"""Optional integration tests: TEST_DATABASE_URL must identify disposable local PG."""

import os
import unittest
from urllib.parse import urlsplit
from unittest.mock import patch
from storage import user_repository, token_repository, session_repository
from storage.database import get_memory_connection, init_memory_db, serialized_chat
from storage import conversation_repository as conversations
from storage import memory_manager as memory

TEST_URL = os.getenv("TEST_DATABASE_URL")
if TEST_URL:
    parsed = urlsplit(TEST_URL)
    if parsed.hostname not in {"localhost", "127.0.0.1"} or not parsed.path.endswith(
        "_test"
    ):
        raise RuntimeError(
            "Integration tests require a disposable local database ending in _test"
        )


@unittest.skipUnless(
    TEST_URL, "Set TEST_DATABASE_URL for a disposable local PostgreSQL database"
)
class PostgresTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"DATABASE_URL": TEST_URL})
        self.env.start()
        self.conn = get_memory_connection()
        init_memory_db(self.conn)
        user_repository.create_table()
        token_repository.create_table()
        session_repository.create_table()
        for table in [
            "memories",
            "conversation_messages",
            "chat_responses",
            "document_uploads",
            "chat_locks",
            "user_memory",
            "memory_jobs",
            "context_cache",
            "auth_sessions",
            "user_tokens",
            "users",
        ]:
            self.conn.execute(f"TRUNCATE {table} RESTART IDENTITY")
        self.conn.commit()

    def tearDown(self):
        self.conn.close()
        self.env.stop()

    def test_postgres_memory_and_transcript_survive_reconnection(self):
        with (
            serialized_chat(self.conn, "alice"),
            patch.object(memory, "sync_memory_index"),
        ):
            memory.store_memory("An important fact", "alice", self.conn, "stable")
            memory.store_memory("An important fact", "alice", self.conn, "stable")
            conversations.append_exchange(self.conn, "alice", "question", "reply")
        self.conn.close()
        self.conn = get_memory_connection()
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 1
        )
        memory.bump_memory_score("stable", self.conn, "alice")
        self.assertEqual(
            self.conn.execute("SELECT frequency FROM memories").fetchone()[0], 2
        )
        init_memory_db(self.conn)
        self.assertEqual(
            self.conn.execute("SELECT content FROM memories").fetchone()[0],
            "An important fact",
        )

    def test_full_documents_markdown_and_attachment_receipts_survive_restart(self):
        from storage import document_repository as documents
        from storage import user_memory_repository as user_memories

        key = "a" * 64
        full_text = "# Full document\n" + "Beginning, middle and end.\n" * 500
        documents.save_document(self.conn, "alice", key, "notes.md", full_text)
        self.conn.commit()
        user_memories.save_memory(
            self.conn, "alice", "# About me\n- Developer", True, 0, 0
        )
        attachments = [{"document_key": key, "filename": "notes.md"}]
        conversations.append_exchange(
            self.conn,
            "alice",
            "Read it",
            "Answer",
            "attachment-request",
            attachments=attachments,
        )
        self.conn.close()
        self.conn = get_memory_connection()
        init_memory_db(self.conn)
        self.assertEqual(
            documents.get_document(self.conn, "alice", key)["content"], full_text
        )
        self.assertIsNone(documents.get_document(self.conn, "bob", key))
        self.assertIn(
            "Developer", user_memories.get_memory(self.conn, "alice")["markdown"]
        )
        self.assertEqual(user_memories.get_memory(self.conn, "bob")["markdown"], "")
        self.assertEqual(
            conversations.get_messages(self.conn, "alice")[0]["attachments"],
            attachments,
        )
        self.assertIn(
            key,
            self.conn.execute("SELECT attachment_keys FROM chat_responses").fetchone()[
                0
            ],
        )

    def test_sessions_are_hashed_revocable_and_expire(self):
        token = session_repository.create_session("alice")
        self.assertEqual(session_repository.resolve_session(token), "alice")
        self.assertIsNone(session_repository.resolve_session("alice"))
        stored = self.conn.execute("SELECT session_hash FROM auth_sessions").fetchone()[
            0
        ]
        self.assertNotEqual(stored, token)
        self.conn.commit()
        session_repository.delete_session(token)
        self.assertIsNone(session_repository.resolve_session(token))
        token = session_repository.create_session("alice")
        self.conn.execute(
            "UPDATE auth_sessions SET expires_at = NOW() - INTERVAL '1 day'"
        )
        self.conn.commit()
        self.assertIsNone(session_repository.resolve_session(token))

    def test_job_claims_are_exclusive_and_new_work_survives_completion(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        from storage import job_repository as jobs

        jobs.enqueue(self.conn, "alice", "model")
        jobs.enqueue(self.conn, "bob", "model")
        self.conn.commit()
        barrier = Barrier(2)

        def claim():
            conn = get_memory_connection()
            try:
                barrier.wait(timeout=3)
                return jobs.claim(conn)
            finally:
                conn.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(claim) for _ in range(2)]
            claimed = [future.result(timeout=5) for future in futures]
        self.assertEqual({job["user_id"] for job in claimed}, {"alice", "bob"})
        alice = next(job for job in claimed if job["user_id"] == "alice")
        jobs.enqueue(self.conn, "alice", "new-model")
        self.conn.commit()
        jobs.finish(self.conn, alice)
        row = self.conn.execute(
            "SELECT generation, lease_token, model FROM memory_jobs WHERE user_id = 'alice'"
        ).fetchone()
        self.assertEqual(row, (2, None, "new-model"))

    def test_worker_updates_markdown_and_cache_with_postgres(self):
        from types import SimpleNamespace
        from unittest.mock import Mock
        import json
        from memory_worker import run_once
        from storage import user_memory_repository as user_memories, context_cache

        conversations.append_exchange(
            self.conn, "alice", "I prefer examples", "Okay", maintenance_model="model"
        )
        model = Mock()
        model.invoke.return_value = SimpleNamespace(
            content=json.dumps({"markdown": "# Preferences\n- Examples"})
        )
        self.assertTrue(run_once(lambda _: model))
        self.assertIn(
            "Examples", user_memories.get_memory(self.conn, "alice")["markdown"]
        )
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memory_jobs").fetchone()[0], 0
        )
        context_cache.write(self.conn, "alice", "google", {"items": []})
        self.assertEqual(
            context_cache.read(self.conn, "alice", "google"), {"items": []}
        )
        self.assertIsNone(context_cache.read(self.conn, "bob", "google"))

    def test_profile_partial_update_preserves_server_counters_and_names(self):
        from main import UserCreate

        user_repository.create_user(
            UserCreate(
                email="alice@example.test",
                display_name="Alice",
                given_name="Alice",
                family_name="Example",
            ),
            "alice",
        )
        user = user_repository.get_user_by_google_id("alice")
        user_repository.increment_counter("alice", "chats_number")
        user_repository.update_user(
            user["id"],
            {"title": "Engineer", "chats_number": 0, "email": "alice@example.test"},
        )
        user = user_repository.get_user_by_google_id("alice")
        self.assertEqual(user["chats_number"], 1)
        self.assertEqual(user["given_name"], "Alice")
        self.assertEqual(user["title"], "Engineer")

    def test_refresh_preserves_google_refresh_token(self):
        token_repository.save_tokens(
            "alice",
            {"access_token": "old", "refresh_token": "refresh", "expires_in": 3600},
            {"sub": "alice"},
        )
        token_repository.save_tokens(
            "alice", {"access_token": "new", "expires_in": 3600}, {"sub": "alice"}
        )
        bundle = token_repository.get_tokens("alice")
        self.assertEqual(bundle["tokens"]["access_token"], "new")
        self.assertEqual(bundle["tokens"]["refresh_token"], "refresh")
        self.assertIsNotNone(bundle["tokens"]["obtained_at"])

    def test_workers_serialize_the_same_users_chat(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Event

        acquired = Event()

        def worker():
            conn = get_memory_connection()
            try:
                with serialized_chat(conn, "alice"):
                    acquired.set()
            finally:
                conn.close()

        with ThreadPoolExecutor(max_workers=1) as executor:
            with serialized_chat(self.conn, "alice"):
                future = executor.submit(worker)
                self.assertFalse(acquired.wait(0.2))
            future.result(timeout=5)
        self.assertTrue(acquired.is_set())

    def test_chat_receipt_counter_and_transcript_commit_atomically(self):
        from main import UserCreate

        user_repository.create_user(
            UserCreate(
                email="alice@example.test",
                display_name="Alice",
                given_name="Alice",
                family_name="Example",
            ),
            "alice",
        )
        conversations.append_exchange(
            self.conn, "alice", "question", "answer", "request", track_usage=True
        )
        self.assertEqual(
            user_repository.get_user_by_google_id("alice")["chats_number"], 1
        )
        with self.assertRaises(Exception):
            conversations.append_exchange(
                self.conn, "alice", "duplicate", "answer", "request", track_usage=True
            )
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)
        self.assertEqual(
            user_repository.get_user_by_google_id("alice")["chats_number"], 1
        )
