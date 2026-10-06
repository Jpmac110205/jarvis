import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
import main
from storage.database import get_memory_connection, init_memory_db
from storage import conversation_repository as conversations


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name) / "memory.db"
        conn = get_memory_connection(self.db)
        init_memory_db(conn)
        conn.close()
        # No lifespan: external databases and Google are deliberately disconnected.
        self.client = TestClient(main.app)
        self.session = patch.object(
            main.session_repository,
            "resolve_session",
            side_effect=lambda token: "alice" if token == "valid-session" else None,
        )
        self.session.start()
        self.connection = patch.object(
            main,
            "get_memory_connection",
            side_effect=lambda: get_memory_connection(self.db),
        )
        self.connection.start()
        self.headers = {"X-Session-Token": "valid-session"}
        self.user = {
            "id": 1,
            "display_name": "Alice",
            "email": "alice@example.test",
            "selected_model": main.DEFAULT_MODEL,
        }

    def tearDown(self):
        self.connection.stop()
        self.session.stop()
        self.client.close()
        self.temp.cleanup()

    def test_supplied_user_id_does_not_authenticate(self):
        for route in ["/conversation", "/events", "/tasks", "/users/1"]:
            self.assertEqual(
                self.client.get(route, headers={"X-User-ID": "alice"}).status_code, 401
            )
        self.assertEqual(
            self.client.post(
                "/chat", json={"message": "Hello"}, headers={"X-User-ID": "alice"}
            ).status_code,
            401,
        )

    def test_empty_or_malformed_chat_returns_validation_error(self):
        for payload in [{"message": " "}, {"message": []}, {"message": "x" * 20001}]:
            self.assertEqual(
                self.client.post(
                    "/chat", json=payload, headers=self.headers
                ).status_code,
                422,
            )
        self.assertEqual(
            self.client.post(
                "/chat",
                content="invalid",
                headers={**self.headers, "Content-Type": "application/json"},
            ).status_code,
            422,
        )

    def test_conversation_and_export_are_private(self):
        conn = get_memory_connection(self.db)
        conversations.append_exchange(conn, "alice", "Alice question", "Alice answer")
        conversations.append_exchange(
            conn, "bob", "Bob private question", "Bob private answer"
        )
        conn.close()
        response = self.client.get("/conversation", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Bob", response.text)
        self.assertNotIn(
            "Bob", self.client.post("/export/conversation", headers=self.headers).text
        )

    def test_profile_patch_does_not_reset_counters_or_other_fields(self):
        with (
            patch.object(main, "ensure_user", return_value=self.user),
            patch.object(main.user_repository, "update_user") as update,
            patch.object(
                main.user_repository, "get_user_by_id", return_value=self.user
            ),
        ):
            response = self.client.put(
                "/users/1", json={"title": "Engineer"}, headers=self.headers
            )
        self.assertEqual(response.status_code, 200)
        update.assert_called_once_with(1, {"title": "Engineer"})

    def test_cannot_read_or_update_another_profile(self):
        with patch.object(main, "ensure_user", return_value=self.user):
            self.assertEqual(
                self.client.get("/users/2", headers=self.headers).status_code, 403
            )
            self.assertEqual(
                self.client.put(
                    "/users/2", json={"title": "bad"}, headers=self.headers
                ).status_code,
                403,
            )

    def test_unavailable_model_is_rejected(self):
        with patch.object(main, "ensure_user", return_value=self.user):
            self.assertEqual(
                self.client.put(
                    "/users/1",
                    json={"selected_model": "invented"},
                    headers=self.headers,
                ).status_code,
                422,
            )

    def test_oauth_rejects_missing_or_mismatched_state(self):
        for state in ["", "incorrect"]:
            response = self.client.get(
                f"/auth/google/callback?code=secret&state={state}"
            )
            self.assertEqual(response.status_code, 400)

    def test_chat_uses_persisted_history_not_client_supplied_history(self):
        conn = get_memory_connection(self.db)
        conversations.append_exchange(
            conn, "alice", "my saved context", "my saved answer"
        )
        conversations.append_exchange(conn, "bob", "private", "secret")
        conn.close()
        model = SimpleNamespace(
            invoke=lambda messages: SimpleNamespace(content="reply")
        )
        with (
            patch.object(main, "ensure_user", return_value=self.user),
            patch.object(main, "make_model", return_value=model),
            patch.object(main, "classify_query", return_value="LLM"),
            patch.object(
                main, "google_access_token", side_effect=main.HTTPException(401)
            ),
            patch.object(
                main, "retrieve_memory", return_value={"context": "", "tier": "none"}
            ),
            patch.object(main.user_repository, "increment_counter"),
            patch.object(model, "invoke", wraps=model.invoke) as invoke,
        ):
            response = self.client.post(
                "/chat",
                json={"message": "new question", "history": [{"content": "injected"}]},
                headers=self.headers,
            )
        self.assertEqual(response.status_code, 200)
        messages = str(invoke.call_args.args[0])
        self.assertIn("my saved context", messages)
        self.assertNotIn("private", messages)
        self.assertNotIn("injected", messages)
        conn = get_memory_connection(self.db)
        self.assertEqual(len(conversations.get_messages(conn, "alice")), 4)
        conn.close()

    def test_chat_retries_reuse_saved_response_without_duplicate_exchange(self):
        import uuid

        request_id = str(uuid.uuid4())
        model = SimpleNamespace(
            invoke=lambda messages: SimpleNamespace(content="one reply")
        )
        with (
            patch.object(main, "ensure_user", return_value=self.user),
            patch.object(main, "make_model", return_value=model),
            patch.object(main, "classify_query", return_value="LLM"),
            patch.object(
                main, "google_access_token", side_effect=main.HTTPException(401)
            ),
            patch.object(
                main, "retrieve_memory", return_value={"context": "", "tier": "none"}
            ),
            patch.object(main.user_repository, "increment_counter"),
            patch.object(model, "invoke", wraps=model.invoke) as invoke,
        ):
            for _ in range(2):
                response = self.client.post(
                    "/chat",
                    json={"message": "same question", "request_id": request_id},
                    headers=self.headers,
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["reply"], "one reply")
            self.assertEqual(invoke.call_count, 1)
            self.assertEqual(
                self.client.post(
                    "/chat",
                    json={"message": "different question", "request_id": request_id},
                    headers=self.headers,
                ).status_code,
                409,
            )
        conn = get_memory_connection(self.db)
        self.assertEqual(len(conversations.get_messages(conn, "alice")), 2)
        conn.close()

    def test_cross_origin_cookie_mutations_are_rejected(self):
        headers = {**self.headers, "Origin": "https://untrusted.example"}
        self.assertEqual(
            self.client.post(
                "/chat", json={"message": "question"}, headers=headers
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post("/auth/logout", headers=headers).status_code, 403
        )

    def test_oauth_issues_opaque_session_and_http_only_cookie(self):
        response = SimpleNamespace(
            raise_for_status=lambda: None, json=lambda: {"access_token": "google-token"}
        )
        self.client.cookies.set("oauth_state", "verified-state")
        with (
            patch.object(main.requests, "post", return_value=response),
            patch.object(
                main,
                "google_get",
                return_value={"sub": "alice", "email": "alice@example.test"},
            ),
            patch.object(main.token_repository, "save_tokens"),
            patch.object(main, "ensure_user", return_value=self.user),
            patch.object(
                main.session_repository, "create_session", return_value="opaque-session"
            ),
        ):
            result = self.client.get(
                "/auth/google/callback?code=code&state=verified-state",
                follow_redirects=False,
            )
        self.assertEqual(result.status_code, 307)
        self.assertIn("#session=opaque-session", result.headers["location"])
        self.assertNotIn("user_id", result.headers["location"])
        cookies = result.headers.get_list("set-cookie")
        self.assertTrue(
            any(
                "prodigy_session=opaque-session" in cookie and "HttpOnly" in cookie
                for cookie in cookies
            )
        )

    def test_duplicate_upload_does_not_inflate_document_count(self):
        with (
            patch.object(
                main,
                "load_document",
                return_value=[SimpleNamespace(page_content="note")],
            ),
            patch.object(
                main,
                "split_documents",
                side_effect=lambda *args, **kwargs: [SimpleNamespace(metadata={})],
            ),
            patch.object(main, "create_vector_store"),
            patch.object(main.user_repository, "increment_counter") as counter,
        ):
            for name in ["notes.txt", "renamed.txt"]:
                result = self.client.post(
                    "/upload",
                    files={"file": (name, b"same text", "text/plain")},
                    headers=self.headers,
                )
                self.assertEqual(result.status_code, 200)
        counter.assert_called_once_with("alice", "pdfs_number")

    def test_google_pagination_and_completed_tasks_are_real(self):
        pages = [
            {"items": [{"id": "list", "title": "Work"}]},
            {"items": [{"id": "t1", "status": "needsAction"}], "nextPageToken": "next"},
            {"items": [{"id": "t2", "status": "completed"}]},
        ]
        with patch.object(main, "google_get", side_effect=pages) as get:
            data = main.get_tasks("token")
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["items"][1]["status"], "completed")
        self.assertEqual(get.call_args.args[2]["pageToken"], "next")

    def test_upload_enforces_size_and_supports_text_without_filename_paths(self):
        with patch.object(main, "MAX_UPLOAD_BYTES", 3):
            response = self.client.post(
                "/upload",
                files={"file": ("../../notes.txt", b"too large", "text/plain")},
                headers=self.headers,
            )
        self.assertEqual(response.status_code, 413)
        with (
            patch.object(
                main,
                "load_document",
                return_value=[SimpleNamespace(page_content="note")],
            ),
            patch.object(
                main, "split_documents", return_value=[SimpleNamespace(metadata={})]
            ) as split,
            patch.object(main, "create_vector_store"),
            patch.object(main.user_repository, "increment_counter"),
        ):
            response = self.client.post(
                "/upload",
                files={"file": ("../../notes.txt", b"notes", "text/plain")},
                headers=self.headers,
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(split.call_args.kwargs["filename"], "notes.txt")


if __name__ == "__main__":
    unittest.main()
