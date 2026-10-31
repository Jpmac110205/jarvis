import json
import os
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
import main
from ingestion_pipeline import load_document
from storage import conversation_repository as conversations
from storage import document_repository as documents
from storage import user_memory_repository as memories
from storage.database import get_memory_connection, init_memory_db
from user_memory import refresh_user_memory
from memory_worker import run_once


class AttachmentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "memory.db"
        self.conn = get_memory_connection(self.path)
        init_memory_db(self.conn)
        self.client = TestClient(main.app)
        self.patches = ExitStack()
        self.patches.enter_context(
            patch.object(
                main,
                "get_memory_connection",
                side_effect=lambda: get_memory_connection(self.path),
            )
        )
        self.patches.enter_context(
            patch.object(
                main.session_repository,
                "resolve_session",
                side_effect=lambda token: token if token in {"alice", "bob"} else None,
            )
        )
        self.patches.enter_context(
            patch.object(main, "ensure_user", return_value={"display_name": "Alice"})
        )
        self.patches.enter_context(
            patch.object(
                main, "google_access_token", side_effect=main.HTTPException(401)
            )
        )
        self.patches.enter_context(
            patch.object(
                main, "retrieve_memory", return_value={"context": "tier memory"}
            )
        )
        self.patches.enter_context(
            patch.object(
                main,
                "vector_context",
                return_value={"hits": [], "documents": [], "unavailable": False},
            )
        )
        self.patches.enter_context(
            patch.object(main, "classify_query", return_value="LLM")
        )
        self.patches.enter_context(
            patch.object(main.user_repository, "increment_counter")
        )
        self.model = Mock()
        self.model.invoke.return_value = SimpleNamespace(content="answer")
        self.patches.enter_context(
            patch.object(main, "make_model", return_value=self.model)
        )
        self.headers = {"X-Session-Token": "alice"}

    def tearDown(self):
        self.patches.close()
        self.client.close()
        self.conn.close()
        self.temp.cleanup()

    def save_document(
        self, owner="alice", key="a" * 64, content="FIRST\n\nMIDDLE\n\nLAST"
    ):
        documents.save_document(self.conn, owner, key, "notes.md", content)
        self.conn.commit()
        return key

    def chat(self, keys=None, request_id=None):
        return self.client.post(
            "/chat",
            json={
                "message": "Summarize the entire file",
                "attachment_keys": keys or [],
                "request_id": request_id,
            },
            headers=self.headers,
        )

    def test_entire_document_and_user_markdown_join_tier_context(self):
        text = "BEGINNING\n" + "Every section matters.\n" * 1000 + "END OF FILE"
        key = self.save_document(content=text)
        memories.save_memory(
            self.conn, "alice", "# Preferences\n- Use Python", True, 0, 0
        )
        result = self.chat([key])
        self.assertEqual(result.status_code, 200, result.text)
        prompt = self.model.invoke.call_args.args[0]
        combined = "\n".join(m.content for m in prompt)
        self.assertIn(json.dumps(text), combined)
        self.assertIn("tier memory", combined)
        self.assertIn("# Preferences\n- Use Python", combined)
        self.assertEqual(prompt[-1].content, "Summarize the entire file")
        saved = conversations.get_messages(self.conn, "alice")
        self.assertEqual(
            saved[0]["attachments"], [{"document_key": key, "filename": "notes.md"}]
        )
        self.assertNotIn("Every section", saved[0]["content"])

    def test_removing_attachment_excludes_full_text_on_next_question(self):
        key = self.save_document(content="UNIQUE FILE BODY")
        self.assertEqual(self.chat([key]).status_code, 200)
        self.assertEqual(self.chat().status_code, 200)
        combined = str(self.model.invoke.call_args.args[0])
        self.assertNotIn("UNIQUE FILE BODY", combined)
        self.assertNotIn("Full attached documents", combined)

    def test_documents_are_private_in_list_read_and_chat(self):
        key = self.save_document("bob")
        self.assertEqual(
            self.client.get("/documents", headers=self.headers).json(),
            {"documents": []},
        )
        self.assertEqual(
            self.client.get(f"/documents/{key}", headers=self.headers).status_code, 404
        )
        self.assertEqual(self.chat([key]).status_code, 404)
        self.model.invoke.assert_not_called()

    def test_attachment_selection_is_part_of_retry_identity(self):
        key = self.save_document()
        request_id = str(uuid4())
        self.assertEqual(self.chat([key], request_id).status_code, 200)
        self.assertEqual(self.chat([key], request_id).status_code, 200)
        self.model.invoke.assert_called_once()
        self.assertEqual(self.chat([], request_id).status_code, 409)

    def test_oversized_context_is_rejected_before_model_or_transcript_write(self):
        key = self.save_document(content="word " * 1000)
        with patch.dict(os.environ, {"MAX_CONTEXT_TOKENS": "100"}):
            result = self.chat([key])
        self.assertEqual(result.status_code, 413, result.text)
        self.assertIn("No attached text has been truncated", result.json()["detail"])
        self.model.invoke.assert_not_called()
        self.assertEqual(conversations.get_messages(self.conn, "alice"), [])

    def test_old_upload_is_visible_but_needs_reupload_for_full_text(self):
        key = "a" * 64
        self.conn.execute(
            "INSERT INTO document_uploads (user_id, document_key, filename) VALUES (?, ?, ?)",
            ("alice", key, "old.txt"),
        )
        self.conn.commit()
        self.assertFalse(
            self.client.get("/documents", headers=self.headers).json()["documents"][0][
                "full_text_available"
            ]
        )
        self.assertEqual(self.chat([key]).status_code, 409)
        self.save_document(key=key)
        self.assertEqual(self.chat([key]).status_code, 200)

    def test_markdown_upload_survives_vector_outage_and_retries_without_duplicate_count(
        self,
    ):
        body = "# Project\n\nThe complete project document."
        with patch.object(
            main, "create_vector_store", side_effect=RuntimeError("offline")
        ):
            result = self.client.post(
                "/upload",
                files={"file": ("project.md", body.encode(), "text/markdown")},
                headers=self.headers,
            )
        self.assertEqual(result.status_code, 200, result.text)
        self.assertFalse(result.json()["indexed"])
        key = result.json()["document_key"]
        self.assertEqual(
            documents.get_document(self.conn, "alice", key)["content"], body
        )
        self.assertEqual(self.chat([key]).status_code, 200)
        with patch.object(main, "create_vector_store"):
            result = self.client.post(
                "/upload",
                files={"file": ("project.md", body.encode(), "text/markdown")},
                headers=self.headers,
            )
        self.assertTrue(result.json()["indexed"])
        self.assertEqual(len(documents.list_documents(self.conn, "alice")), 1)
        main.user_repository.increment_counter.assert_called_once_with(
            "alice", "pdfs_number"
        )

    def test_empty_extraction_is_rejected(self):
        with patch.object(
            main, "load_document", return_value=[SimpleNamespace(page_content="  ")]
        ):
            result = self.client.post(
                "/upload",
                files={"file": ("scan.pdf", b"pdf", "application/pdf")},
                headers=self.headers,
            )
        self.assertEqual(result.status_code, 422)
        self.assertEqual(documents.list_documents(self.conn, "alice"), [])

    def test_memory_edits_are_private_and_reject_stale_revisions(self):
        memories.save_memory(self.conn, "bob", "Bob secret", True, 0, 0)
        self.assertEqual(
            self.client.get("/memory/user", headers=self.headers).json()["markdown"], ""
        )
        payload = {
            "markdown": "# Me\n- Python developer",
            "revision": 0,
            "auto_update": False,
        }
        result = self.client.put("/memory/user", json=payload, headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.json()["auto_update"])
        self.assertEqual(
            self.client.put(
                "/memory/user", json=payload, headers=self.headers
            ).status_code,
            409,
        )
        self.assertEqual(
            memories.get_memory(self.conn, "bob")["markdown"], "Bob secret"
        )
        self.conn.close()
        self.conn = get_memory_connection(self.path)
        self.assertEqual(
            memories.get_memory(self.conn, "alice")["markdown"], payload["markdown"]
        )

    def test_memory_update_uses_only_owned_user_statements_and_durable_cursor(self):
        conversations.append_exchange(
            self.conn, "alice", "I prefer concise replies", "Invented assistant claim"
        )
        conversations.append_exchange(self.conn, "bob", "Bob private", "Bob answer")
        self.save_document(content="DOCUMENT FACTS MUST NOT ENTER PERSONAL MEMORY")
        model = Mock()
        model.invoke.return_value = SimpleNamespace(
            content=json.dumps({"markdown": "# Preferences\n- Concise replies"})
        )
        result = refresh_user_memory(self.conn, "alice", model)
        self.assertIn("Concise replies", result["markdown"])
        payload = model.invoke.call_args.args[0][-1].content
        self.assertIn("I prefer concise", payload)
        self.assertNotIn("Invented", payload)
        self.assertNotIn("Bob private", payload)
        self.assertNotIn("DOCUMENT FACTS", payload)
        refresh_user_memory(self.conn, "alice", model)
        model.invoke.assert_called_once()

    def test_memory_failure_retains_cursor_for_retry_and_toggle_stops_updates(self):
        conversations.append_exchange(
            self.conn, "alice", "My goal is to learn Rust", "Okay"
        )
        model = Mock()
        model.invoke.return_value = SimpleNamespace(content="invalid JSON")
        with self.assertRaises(ValueError):
            refresh_user_memory(self.conn, "alice", model)
        self.assertEqual(memories.get_memory(self.conn, "alice")["last_message_id"], 0)
        model.invoke.return_value = SimpleNamespace(
            content=json.dumps({"markdown": "# Goals\n- Learn Rust"})
        )
        result = refresh_user_memory(self.conn, "alice", model)
        self.assertGreater(result["last_message_id"], 0)
        memories.save_memory(
            self.conn,
            "alice",
            result["markdown"],
            False,
            result["last_message_id"],
            result["revision"],
        )
        conversations.append_exchange(self.conn, "alice", "Another fact", "Okay")
        model.reset_mock()
        refresh_user_memory(self.conn, "alice", model)
        model.invoke.assert_not_called()

    def test_markdown_loader_preserves_utf8_and_complete_text(self):
        path = Path(self.temp.name) / "notes.md"
        path.write_text("# Notes\n\nCafé\n\nLast section", encoding="utf-8")
        self.assertEqual(load_document(str(path))[0].page_content, path.read_text())

    def test_schema_upgrade_preserves_old_data(self):
        # Run twice as it will be on subsequent Render restarts.
        self.save_document()
        init_memory_db(self.conn)
        init_memory_db(self.conn)
        self.assertEqual(len(documents.list_documents(self.conn, "alice")), 1)

    def test_successful_chat_updates_markdown_used_on_the_next_turn(self):
        first = self.client.post(
            "/chat", json={"message": "I prefer concise replies"}, headers=self.headers
        )
        self.assertEqual(memories.get_memory(self.conn, "alice")["markdown"], "")
        memory_model = Mock()
        memory_model.invoke.return_value = SimpleNamespace(
            content=json.dumps({"markdown": "# Preferences\n- Concise replies"})
        )
        run_once(lambda _: memory_model, lambda: get_memory_connection(self.path))
        second = self.chat()
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertIn(
            "Concise replies", str(self.model.invoke.call_args_list[1].args[0])
        )
        self.assertIn(
            "Concise replies", memories.get_memory(self.conn, "alice")["markdown"]
        )

    def test_failed_memory_update_does_not_lose_chat_reply(self):
        with patch(
            "memory_worker.refresh_user_memory", side_effect=RuntimeError("offline")
        ) as update:
            result = self.chat()
            update.assert_not_called()
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["memory_status"], "queued")
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)

    def test_manual_clear_skips_old_statements_but_keeps_tier_memories(self):
        conversations.append_exchange(
            self.conn, "alice", "I once lived in Boston", "Okay"
        )
        memories.save_memory(
            self.conn, "alice", "# About me\n- Lives in Boston", True, 0, 0
        )
        result = self.client.put(
            "/memory/user",
            json={"markdown": "", "revision": 1, "auto_update": True},
            headers=self.headers,
        )
        self.assertEqual(result.status_code, 200)
        model = Mock()
        refresh_user_memory(self.conn, "alice", model)
        model.invoke.assert_not_called()
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 2)

    def test_memory_updater_reduces_batch_without_dropping_pending_statements(self):
        for index in range(4):
            conversations.append_exchange(
                self.conn, "alice", f"User fact {index}", "Okay"
            )
        model = Mock()
        model.invoke.return_value = SimpleNamespace(
            content=json.dumps({"markdown": "# Facts"})
        )

        def budget(messages, _model_name):
            if len(json.loads(messages[-1].content)["user_statements"]) > 2:
                raise main.HTTPException(413)

        with patch("user_memory.check_prompt_budget", side_effect=budget):
            result = refresh_user_memory(self.conn, "alice", model)
        self.assertEqual(
            len(
                json.loads(model.invoke.call_args.args[0][-1].content)[
                    "user_statements"
                ]
            ),
            2,
        )
        pending = self.conn.execute(
            "SELECT COUNT(*) FROM conversation_messages WHERE user_id = ? AND role = 'user' AND id > ?",
            ("alice", result["last_message_id"]),
        ).fetchone()[0]
        self.assertEqual(pending, 2)
