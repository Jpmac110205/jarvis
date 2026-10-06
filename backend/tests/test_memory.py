import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from storage.database import get_memory_connection, init_memory_db
from storage import memory_manager as memory
from storage import conversation_repository as conversations
from scripts.maintain_memory import migrate


class FakeStore:
    def __init__(self):
        self.documents = {}
        self.fail_write = False
        self.fail_delete = False

    def add_documents(self, docs, ids):
        if self.fail_write:
            raise RuntimeError("embedding service down")
        self.documents.update(zip(ids, docs))

    def delete(self, ids):
        if self.fail_delete:
            raise RuntimeError("source deletion failed")
        for key in ids:
            self.documents.pop(key, None)

    def similarity_search_with_relevance_scores(self, query, k, filter):
        return [
            (doc, 0.9)
            for doc in self.documents.values()
            if doc.metadata["user_id"] == filter["user_id"]
        ][:k]


class MemoryTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "memory.db"
        self.conn = get_memory_connection(self.path)
        init_memory_db(self.conn)
        self.stores = {
            memory.SHORT_COLLECTION: FakeStore(),
            memory.LONG_COLLECTION: FakeStore(),
        }
        self.patch = patch.object(
            memory, "get_store", side_effect=lambda key: self.stores[key]
        )
        self.patch.start()

    def tearDown(self):
        self.patch.stop()
        self.conn.close()
        self.directory.cleanup()

    def store(self, owner="alice", key="m1", text="A project decision"):
        memory.store_memory(text, owner, self.conn, key)

    def age(self, owner="alice", days=40, frequency=1):
        self.conn.execute(
            "UPDATE memories SET last_accessed = ?, frequency = ? WHERE user_id = ?",
            (
                (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(),
                frequency,
                owner,
            ),
        )
        self.conn.commit()

    def test_persistent_conversations_are_user_scoped_and_bounded(self):
        for i in range(12):
            conversations.append_exchange(self.conn, "alice", f"question {i}", "answer")
        conversations.append_exchange(self.conn, "bob", "private", "bob answer")
        self.conn.close()
        self.conn = get_memory_connection(self.path)
        self.assertEqual(len(conversations.get_messages(self.conn, "alice", 10)), 10)
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 24)
        self.assertNotIn("private", str(conversations.get_messages(self.conn, "alice")))

    def test_summarizes_ten_exchanges_not_shared_message_count(self):
        for i in range(9):
            conversations.append_exchange(self.conn, "alice", "question", "answer")
        conversations.append_exchange(self.conn, "bob", "question", "answer")
        self.assertEqual(conversations.pending_summary(self.conn, "alice"), [])
        conversations.append_exchange(self.conn, "alice", "tenth", "answer")
        rows = conversations.pending_summary(self.conn, "alice")
        self.assertEqual(len(rows), 20)
        key = conversations.summary_id("alice", rows)
        self.assertEqual(key, conversations.summary_id("alice", rows))
        self.store(key=key)
        # Simulate crash after the summary write, before marking the window.
        self.store(key=key)
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 1
        )
        conversations.mark_summarized(self.conn, "alice", rows)
        self.assertEqual(conversations.pending_summary(self.conn, "alice"), [])
        self.assertEqual(len(conversations.get_messages(self.conn, "alice")), 20)

    def test_demotion_moves_vector_and_keeps_sql_content(self):
        self.store()
        self.age()
        self.assertEqual(memory.demote_stale_memories(self.conn, "alice"), 1)
        memory.sync_memory_index(self.conn, "alice")
        self.assertNotIn("alice:m1", self.stores[memory.SHORT_COLLECTION].documents)
        self.assertIn("alice:m1", self.stores[memory.LONG_COLLECTION].documents)
        self.assertEqual(
            self.conn.execute(
                "SELECT tier, indexed_tier, content FROM memories"
            ).fetchone(),
            ("long", "long", "A project decision"),
        )

    def test_recent_and_frequently_used_memories_stay_short(self):
        self.store()
        self.age(days=29)
        self.assertEqual(memory.demote_stale_memories(self.conn, "alice"), 0)
        self.age(days=100, frequency=5)
        self.assertEqual(memory.demote_stale_memories(self.conn, "alice"), 0)

    def test_demotion_is_scoped_to_owner(self):
        self.store()
        self.store("bob", text="private")
        self.age("bob")
        memory.demote_stale_memories(self.conn, "alice")
        self.assertEqual(
            self.conn.execute(
                "SELECT tier FROM memories WHERE user_id = 'bob'"
            ).fetchone()[0],
            "short",
        )

    def test_long_term_hit_promotes_the_vector(self):
        self.store()
        self.age()
        memory.demote_stale_memories(self.conn, "alice")
        memory.sync_memory_index(self.conn, "alice")
        result = memory.retrieve_memory("project", "alice", self.conn)
        self.assertEqual(result["tier"], "long_term")
        self.assertIn("alice:m1", self.stores[memory.SHORT_COLLECTION].documents)
        self.assertNotIn("alice:m1", self.stores[memory.LONG_COLLECTION].documents)
        self.assertEqual(
            self.conn.execute("SELECT frequency, tier FROM memories").fetchone(),
            (2, "short"),
        )

    def test_both_tiers_contribute_even_when_short_term_matches(self):
        self.store()
        self.store(key="m2", text="Older relevant decision")
        self.conn.execute("UPDATE memories SET tier = 'long' WHERE embedding_id = 'm2'")
        self.conn.commit()
        memory.sync_memory_index(self.conn, "alice")
        result = memory.retrieve_memory("project", "alice", self.conn)
        self.assertEqual(result["tier"], "mixed")
        self.assertIn("Older relevant decision", result["context"])
        self.assertIn("A project decision", result["context"])

    def test_embedding_failure_retains_sql_and_retries_idempotently(self):
        self.stores[memory.SHORT_COLLECTION].fail_write = True
        with self.assertLogs(memory.logger, level="ERROR"):
            self.store()
        self.assertEqual(
            self.conn.execute("SELECT indexed_tier FROM memories").fetchone()[0], None
        )
        self.stores[memory.SHORT_COLLECTION].fail_write = False
        self.store()
        self.store()
        self.assertEqual(len(self.stores[memory.SHORT_COLLECTION].documents), 1)
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 1
        )

    def test_failed_move_does_not_delete_source_and_is_retryable(self):
        self.store()
        self.age()
        memory.demote_stale_memories(self.conn, "alice")
        self.stores[memory.LONG_COLLECTION].fail_write = True
        with self.assertLogs(memory.logger, level="ERROR"):
            memory.sync_memory_index(self.conn, "alice")
        self.assertIn("alice:m1", self.stores[memory.SHORT_COLLECTION].documents)
        self.stores[memory.LONG_COLLECTION].fail_write = False
        self.assertEqual(memory.sync_memory_index(self.conn, "alice"), 1)

    def test_failed_source_deletion_retries_without_duplicate_hits(self):
        self.store()
        self.age()
        memory.demote_stale_memories(self.conn, "alice")
        self.stores[memory.SHORT_COLLECTION].fail_delete = True
        with self.assertLogs(memory.logger, level="ERROR"):
            memory.sync_memory_index(self.conn, "alice")
        self.assertIn("alice:m1", self.stores[memory.LONG_COLLECTION].documents)
        # Stale short-tier vector must not masquerade as a current hit.
        with patch.object(memory, "maybe_promote"):
            result = memory.retrieve_memory("project", "alice", self.conn)
        self.assertEqual(result["tier"], "long_term")
        self.assertEqual(result["context"].count("A project decision"), 1)
        self.stores[memory.SHORT_COLLECTION].fail_delete = False
        self.assertEqual(memory.sync_memory_index(self.conn, "alice"), 1)

    def test_collision_does_not_update_or_retrieve_another_user(self):
        self.store()
        self.store("bob", text="Bob's private memory")
        result = memory.retrieve_memory("project", "alice", self.conn)
        self.assertNotIn("Bob", result["context"])
        self.assertEqual(
            self.conn.execute(
                "SELECT frequency FROM memories WHERE user_id = 'bob'"
            ).fetchone()[0],
            1,
        )
        self.assertEqual(
            memory.retrieve_memory("project", "", self.conn)["tier"], "none"
        )

    def test_rejects_foreign_and_orphaned_vector_hits(self):
        self.store()
        fake = [
            SimpleNamespace(
                page_content="foreign",
                metadata={"user_id": "bob", "embedding_id": "m1"},
            ),
            SimpleNamespace(
                page_content="orphan",
                metadata={"user_id": "alice", "embedding_id": "missing"},
            ),
        ]
        with patch.object(
            self.stores[memory.SHORT_COLLECTION],
            "similarity_search_with_relevance_scores",
            return_value=[(doc, 0.9) for doc in fake],
        ):
            self.assertEqual(
                memory.retrieve_memory("project", "alice", self.conn)["context"], ""
            )

    def test_future_timestamp_and_naive_datetime_are_safe(self):
        self.assertEqual(
            memory.compute_score(2, datetime.now(timezone.utc) + timedelta(days=2)), 2
        )
        self.assertGreater(memory.compute_score(1, datetime.now()), 0)
        self.assertEqual(memory.get_conversational_context([1, 2], 0), [])

    def test_legacy_migration_preserves_source_and_is_repeatable(self):
        source = get_memory_connection(Path(self.directory.name) / "legacy.db")
        try:
            init_memory_db(source)
            source.execute(
                "INSERT INTO memories (user_id, content, embedding_id, tier, frequency) VALUES ('alice', 'legacy fact', 'old', 'long', 3)"
            )
            source.commit()
            self.assertEqual(migrate(source, self.conn), 1)
            self.assertEqual(migrate(source, self.conn), 0)
            self.assertEqual(
                source.execute("SELECT COUNT(*) FROM memories").fetchone()[0], 1
            )
            self.assertEqual(
                self.conn.execute(
                    "SELECT content, tier, frequency, indexed_tier FROM memories"
                ).fetchone(),
                ("legacy fact", "long", 3, None),
            )
        finally:
            source.close()

    def test_legacy_schema_upgrade_preserves_rows(self):
        import sqlite3

        old = sqlite3.connect(Path(self.directory.name) / "schema.db")
        try:
            old.execute(
                "CREATE TABLE memories (id INTEGER PRIMARY KEY, user_id TEXT, content TEXT, embedding_id TEXT, tier TEXT, frequency INTEGER, last_accessed TIMESTAMP, created_at TIMESTAMP)"
            )
            old.execute(
                "INSERT INTO memories VALUES (1, 'alice', 'keep', 'id', 'short', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
            old.commit()
            init_memory_db(old)
            init_memory_db(old)
            self.assertEqual(
                old.execute("SELECT content, indexed_tier FROM memories").fetchone(),
                ("keep", None),
            )
        finally:
            old.close()


if __name__ == "__main__":
    unittest.main()
