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
