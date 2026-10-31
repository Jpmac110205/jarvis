import json
import tempfile
import time
import unittest
from contextlib import ExitStack
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
import main
from storage import conversation_repository as conversations, job_repository as jobs
from storage import context_cache, user_memory_repository as memories
from storage.database import get_memory_connection, init_memory_db
from memory_worker import run_once


def chunk(text="", finish=False):
    return SimpleNamespace(
        content=text, response_metadata={"finish_reason": "stop"} if finish else {}
    )


class LatencyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "test.db"
        self.factory = lambda: get_memory_connection(self.path)
        self.conn = self.factory()
        init_memory_db(self.conn)
        self.patches = ExitStack()
        self.model = Mock()
        self.model.invoke.return_value = SimpleNamespace(content="A saved reply")
        self.model.stream.side_effect = lambda _: iter(
            [chunk("Hello "), chunk("world"), chunk(finish=True)]
        )
        for name, value in (
            ("ensure_user", {"display_name": "Alice"}),
            ("make_model", self.model),
            ("vector_context", {"hits": [], "documents": [], "unavailable": False}),
        ):
            self.patches.enter_context(patch.object(main, name, return_value=value))
        self.patches.enter_context(
            patch.object(main, "get_memory_connection", side_effect=self.factory)
        )
        self.google = self.patches.enter_context(
            patch.object(
                main,
                "google_access_token",
                side_effect=AssertionError("Unexpected Google request"),
            )
        )
        self.patches.enter_context(
            patch.object(
                main.session_repository,
                "resolve_session",
                side_effect=lambda token: token if token in {"alice", "bob"} else None,
            )
        )
        self.client = TestClient(main.app)
        self.headers = {"X-Session-Token": "alice"}

    def tearDown(self):
        self.client.close()
        self.patches.close()
        self.conn.close()
        self.temp.cleanup()

    def post(self, **kwargs):
        return self.client.post(
            "/chat",
            headers=self.headers,
            json={"message": "Explain vector search", **kwargs},
        )

    def test_answer_is_one_generation_and_maintenance_is_atomic_queued_work(self):
        result = self.post(request_id=str(uuid4()))
        self.assertEqual(result.status_code, 200, result.text)
        self.model.invoke.assert_called_once()
        self.google.assert_not_called()
        self.assertEqual(result.json()["memory_status"], "queued")
        self.assertEqual(
            self.conn.execute(
                "SELECT generation FROM memory_jobs WHERE user_id = 'alice'"
            ).fetchone()[0],
            1,
        )
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)
        self.assertEqual(memories.get_memory(self.conn, "alice")["markdown"], "")

    def test_deltas_arrive_before_completion_and_persistence(self):
        events = main.chat_events(
            main.ChatRequest(
                message="Explain vectors", stream=True, request_id=uuid4()
            ),
            "alice",
        )
        self.assertEqual(next(events)["type"], "ready")
        self.assertEqual(next(events), {"type": "delta", "text": "Hello "})
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])
        self.assertEqual(next(events)["text"], "world")
        self.assertEqual(next(events)["type"], "done")
        self.assertEqual(
            conversations.get_messages(self.conn, "alice")[-1]["content"], "Hello world"
        )
        events.close()
        self.model.invoke.assert_not_called()

    def test_stream_replay_does_not_regenerate_or_enqueue_duplicate_job(self):
        request_id = str(uuid4())
        for _ in range(2):
            result = self.post(stream=True, request_id=request_id)
            self.assertEqual(result.status_code, 200)
            self.assertIn('"type": "done"', result.text)
        self.model.stream.assert_called_once()
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)
        self.assertEqual(
            self.conn.execute("SELECT generation FROM memory_jobs").fetchone()[0], 1
        )

    def test_failed_stream_is_not_persisted_and_same_request_can_retry(self):
        def broken(_):
            yield chunk("Partial")
            raise RuntimeError("Provider disconnected")

        self.model.stream.side_effect = broken
        request_id = str(uuid4())
        result = self.post(stream=True, request_id=request_id)
        self.assertIn("event: delta", result.text)
        self.assertIn("event: error", result.text)
        self.assertNotIn("event: done", result.text)
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memory_jobs").fetchone()[0], 0
        )
        self.model.stream.side_effect = lambda _: iter(
            [chunk("Recovered", finish=True)]
        )
        self.assertIn("event: done", self.post(stream=True, request_id=request_id).text)
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)

    def test_stream_without_provider_completion_marker_is_not_saved(self):
        self.model.stream.side_effect = lambda _: iter([chunk("Incomplete")])
        result = self.post(stream=True)
        self.assertIn("event: error", result.text)
        self.assertNotIn("event: done", result.text)
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])

    def test_closing_a_partial_stream_closes_provider_and_releases_resources(self):
        closed = []

        def provider(_):
            try:
                yield chunk("Partial")
                yield chunk("Rest", finish=True)
            finally:
                closed.append(True)

        self.model.stream.side_effect = provider
        events = main.chat_events(
            main.ChatRequest(message="Hello", stream=True), "alice"
        )
        next(events)
        next(events)
        events.close()
        self.assertEqual(closed, [True])
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])
        # Reusing the account proves the previous request released its chat lock.
        self.assertEqual(self.post().status_code, 200)

    def test_stream_preflight_errors_keep_http_status_and_json(self):
        result = self.post(stream=True, attachment_keys=["a" * 64])
        self.assertEqual(result.status_code, 404)
        self.assertIn("application/json", result.headers["content-type"])
        self.model.stream.assert_not_called()

    def test_timings_include_first_token_and_no_personal_content(self):
        with self.assertLogs("uvicorn.error", level="INFO") as logs:
            self.post(stream=True)
        line = next(line for line in logs.output if "chat_latency " in line)
        data = json.loads(line.split("chat_latency ", 1)[1])
        self.assertEqual(data["status"], "complete")
        for key in (
            "first_token_ms",
            "generation_ms",
            "retrieval_ms",
            "persistence_ms",
            "total_ms",
        ):
            self.assertIn(key, data)
        self.assertNotIn("Explain vector search", line)
        self.assertNotIn("Hello world", line)

    def test_job_generation_and_leases_survive_restarts_and_new_messages(self):
        jobs.enqueue(self.conn, "alice", "model")
        self.conn.commit()
        first = jobs.claim(self.conn, now=100, lease_seconds=10)
        self.assertIsNone(jobs.claim(self.conn, now=105))
        replacement = jobs.claim(self.conn, now=111)
        self.assertNotEqual(first["token"], replacement["token"])
        jobs.finish(self.conn, first)
        self.assertEqual(
            self.conn.execute("SELECT lease_token FROM memory_jobs").fetchone()[0],
            replacement["token"],
        )
        jobs.enqueue(self.conn, "alice", "new-model")
        self.conn.commit()
        jobs.finish(self.conn, replacement)
        self.conn.close()
        self.conn = self.factory()
        pending = jobs.claim(self.conn, now=time.time())
        self.assertEqual(pending["generation"], 2)
        self.assertEqual(pending["model"], "new-model")

    def test_enqueue_failure_rolls_back_exchange_and_receipt(self):
        with patch.object(
            jobs, "enqueue", side_effect=RuntimeError("Database write failed")
        ):
            with self.assertRaises(RuntimeError):
                conversations.append_exchange(
                    self.conn,
                    "alice",
                    "Question",
                    "Answer",
                    "request",
                    maintenance_model="model",
                )
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM chat_responses").fetchone()[0], 0
        )

    def test_memory_access_changes_commit_only_with_a_completed_answer(self):
        from langchain_core.documents import Document

        self.conn.execute(
            "INSERT INTO memories (user_id, content, embedding_id, tier, indexed_tier) VALUES ('alice', 'A useful fact', 'm1', 'long', 'long')"
        )
        self.conn.commit()
        hits = [
            (
                "long",
                Document(
                    page_content="A useful fact",
                    metadata={"user_id": "alice", "embedding_id": "m1"},
                ),
            )
        ]
        with patch.object(
            main,
            "vector_context",
            return_value={"hits": hits, "documents": [], "unavailable": False},
        ):
            self.model.stream.side_effect = lambda _: iter([chunk("Incomplete")])
            self.post(stream=True)
            self.assertEqual(
                self.conn.execute("SELECT frequency, tier FROM memories").fetchone(),
                (1, "long"),
            )
            self.assertEqual(self.post().status_code, 200)
        self.assertEqual(
            self.conn.execute(
                "SELECT frequency, tier, indexed_tier FROM memories"
            ).fetchone(),
            (2, "short", "long"),
        )
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memory_jobs").fetchone()[0], 1
        )

    def test_worker_failure_retries_without_losing_answer(self):
        self.post()
        memory_model = Mock()
        memory_model.invoke.side_effect = RuntimeError("Memory provider down")
        run_once(lambda _: memory_model, self.factory)
        row = self.conn.execute(
            "SELECT attempts, lease_token, run_after FROM memory_jobs"
        ).fetchone()
        self.assertEqual(row[0], 1)
        self.assertIsNone(row[1])
        self.assertGreater(row[2], time.time())
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)
        self.assertEqual(memories.get_memory(self.conn, "alice")["last_message_id"], 0)

    def test_markdown_failure_does_not_starve_summaries_or_index_repair(self):
        for index in range(10):
            conversations.append_exchange(
                self.conn, "alice", f"Fact {index}", "Reply", maintenance_model="model"
            )
        model = Mock()
        model.invoke.side_effect = [
            RuntimeError("Markdown unavailable"),
            SimpleNamespace(content="A durable conversation summary"),
        ]

        def repair(conn, user_id):
            conn.execute(
                "UPDATE memories SET indexed_tier = tier WHERE user_id = ?", (user_id,)
            )
            conn.commit()
            return 1

        with patch("memory_worker.sync_memory_index", side_effect=repair) as sync:
            run_once(lambda _: model, self.factory)
        sync.assert_called_once()
        self.assertEqual(
            self.conn.execute("SELECT content, indexed_tier FROM memories").fetchone(),
            ("A durable conversation summary", "short"),
        )
        self.assertEqual(
            self.conn.execute(
                "SELECT COUNT(*) FROM conversation_messages WHERE summarized = 0"
            ).fetchone()[0],
            0,
        )
        self.assertEqual(
            self.conn.execute("SELECT attempts FROM memory_jobs").fetchone()[0], 1
        )

    def test_manual_memory_edit_wins_over_inflight_worker(self):
        self.post()

        def generate(_):
            editor = self.factory()
            try:
                memories.save_memory(
                    editor, "alice", "# Manually corrected", True, 2, 0
                )
            finally:
                editor.close()
            return SimpleNamespace(
                content=json.dumps({"markdown": "# Stale generated memory"})
            )

        memory_model = Mock()
        memory_model.invoke.side_effect = generate
        run_once(lambda _: memory_model, self.factory)
        self.assertEqual(
            memories.get_memory(self.conn, "alice")["markdown"], "# Manually corrected"
        )
        self.assertEqual(
            self.conn.execute("SELECT attempts FROM memory_jobs").fetchone()[0], 1
        )

    def test_cache_is_account_scoped_and_expires(self):
        context_cache.write(
            self.conn, "bob", "chat-google", {"private": "Bob schedule"}
        )
        self.assertIsNone(context_cache.read(self.conn, "alice", "chat-google"))
        context_cache.write(
            self.conn, "alice", "chat-google", {"snapshot": "Alice"}, ttl=-1
        )
        self.assertIsNone(context_cache.read(self.conn, "alice", "chat-google"))

    def test_slow_memory_generation_does_not_hold_the_chat_lock(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Event

        self.post()
        entered, release = Event(), Event()

        def slow(_):
            entered.set()
            if not release.wait(5):
                raise TimeoutError("Test did not release worker")
            return SimpleNamespace(content=json.dumps({"markdown": "# Facts"}))

        memory_model = Mock()
        memory_model.invoke.side_effect = slow
        with ThreadPoolExecutor(max_workers=1) as executor:
            worker = executor.submit(run_once, lambda _: memory_model, self.factory)
            try:
                self.assertTrue(entered.wait(2))
                self.assertEqual(self.post().status_code, 200)
                self.assertFalse(worker.done())
            finally:
                release.set()
                worker.result(timeout=5)
        self.assertIsNotNone(self.conn.execute("SELECT 1 FROM memory_jobs").fetchone())

    def test_google_snapshot_is_reused_and_followup_intent_is_preserved(self):
        with (
            patch.object(
                main, "google_access_token", return_value="not-cached-token"
            ) as token,
            patch.object(
                main, "get_upcoming_events", return_value={"items": []}
            ) as events,
            patch.object(main, "get_tasks", return_value={"items": []}) as tasks,
        ):
            fresh = main.cached_google_context("alice")
            cached = main.cached_google_context("alice")
        self.assertIn("snapshot fetched", fresh)
        self.assertIn("Cached Google snapshot", cached)
        token.assert_called_once()
        events.assert_called_once()
        tasks.assert_called_once()
        self.assertNotIn(
            "not-cached-token",
            self.conn.execute("SELECT payload FROM context_cache").fetchone()[0],
        )
        self.assertTrue(
            main.needs_google_context(
                "What about the second one?",
                [{"role": "user", "content": "What meetings do I have today?"}],
            )
        )
        self.assertFalse(main.needs_google_context("Explain database indexing", []))
