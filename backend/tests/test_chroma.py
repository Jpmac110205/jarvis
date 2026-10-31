"""Real Chroma collection integration with deterministic local embeddings."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from langchain_core.embeddings import Embeddings
from storage.database import get_memory_connection, init_memory_db
from storage import vector_store, memory_manager as memory


class LocalEmbeddings(Embeddings):
    def embed_documents(self, texts):
        return [self.embed_query(text) for text in texts]

    def embed_query(self, text):
        return [1.0, float("project" in text.lower()), float("travel" in text.lower())]


class ChromaTests(unittest.TestCase):
    def test_parallel_context_reuses_one_embedding_and_validates_both_tiers(self):
        from langchain_core.documents import Document
        from context_pipeline import vector_context

        with tempfile.TemporaryDirectory() as directory:
            import chromadb
            from chromadb.config import Settings

            client = chromadb.PersistentClient(
                path=str(Path(directory) / "chroma"),
                settings=Settings(anonymized_telemetry=False),
            )
            conn = get_memory_connection(Path(directory) / "memory.db")
            init_memory_db(conn)
            embeddings = LocalEmbeddings()
            vector_store.get_store.cache_clear()
            try:
                with (
                    patch.object(vector_store, "get_client", return_value=client),
                    patch.object(
                        vector_store, "get_embeddings", return_value=embeddings
                    ),
                ):
                    memory.store_memory("project short", "alice", conn, "short")
                    memory.store_memory("project long", "alice", conn, "long")
                    conn.execute(
                        "UPDATE memories SET tier = 'long' WHERE embedding_id = 'long'"
                    )
                    conn.commit()
                    memory.sync_memory_index(conn, "alice")
                    docs = vector_store.get_store("prodigy_documents")
                    docs.add_documents(
                        [
                            Document(
                                page_content="project notes",
                                metadata={"user_id": "alice", "source": "notes.md"},
                            ),
                            Document(
                                page_content="project secret",
                                metadata={"user_id": "bob", "source": "secret.md"},
                            ),
                        ],
                        ids=["alice-doc", "bob-doc"],
                    )
                    with (
                        patch(
                            "context_pipeline.query_embeddings", return_value=embeddings
                        ),
                        patch.object(
                            embeddings, "embed_query", wraps=embeddings.embed_query
                        ) as embed,
                    ):
                        result = vector_context("project", "alice", True, True)
                    embed.assert_called_once_with("project")
                    self.assertFalse(result["unavailable"])
                    self.assertEqual(
                        {tier for tier, _ in result["hits"]}, {"short", "long"}
                    )
                    self.assertEqual(
                        [d.page_content for d in result["documents"]], ["project notes"]
                    )
                    with patch.object(memory, "sync_memory_index") as sync:
                        context = memory.retrieve_memory(
                            "project", "alice", conn, hits=result["hits"]
                        )
                    sync.assert_not_called()
                    self.assertIn("project short", context["context"])
                    self.assertIn("project long", context["context"])
                    self.assertEqual(
                        conn.execute(
                            "SELECT tier FROM memories WHERE embedding_id = 'long'"
                        ).fetchone()[0],
                        "short",
                    )
            finally:
                conn.close()
                vector_store.get_store.cache_clear()

    def test_real_upsert_filters_demotion_and_promotion(self):
        with tempfile.TemporaryDirectory() as directory:
            import chromadb
            from chromadb.config import Settings

            client = chromadb.PersistentClient(
                path=str(Path(directory) / "chroma"),
                settings=Settings(anonymized_telemetry=False),
            )
            conn = get_memory_connection(Path(directory) / "memory.db")
            init_memory_db(conn)
            vector_store.get_store.cache_clear()
            try:
                with (
                    patch.object(vector_store, "get_client", return_value=client),
                    patch.object(
                        vector_store, "get_embeddings", return_value=LocalEmbeddings()
                    ),
                ):
                    memory.store_memory("project decision", "alice", conn, "id")
                    memory.store_memory("project decision", "alice", conn, "id")
                    memory.store_memory("private project", "bob", conn, "id")
                    short = vector_store.get_store(memory.SHORT_COLLECTION)
                    self.assertEqual(len(short.get()["ids"]), 2)
                    self.assertEqual(
                        memory.retrieve_memory("project", "alice", conn)["context"],
                        "project decision",
                    )
                    conn.execute(
                        "UPDATE memories SET last_accessed = ?, frequency = 1 WHERE user_id = 'alice'",
                        (
                            (
                                datetime.now(timezone.utc) - timedelta(days=40)
                            ).isoformat(),
                        ),
                    )
                    conn.commit()
                    memory.demote_stale_memories(conn, "alice")
                    memory.sync_memory_index(conn, "alice")
                    self.assertEqual(short.get(ids=["alice:id"])["ids"], [])
                    long = vector_store.get_store(memory.LONG_COLLECTION)
                    self.assertEqual(long.get(ids=["alice:id"])["ids"], ["alice:id"])
                    result = memory.retrieve_memory("project", "alice", conn)
                    self.assertEqual(result["tier"], "long_term")
                    self.assertEqual(long.get(ids=["alice:id"])["ids"], [])
                    self.assertEqual(short.get(ids=["alice:id"])["ids"], ["alice:id"])
            finally:
                conn.close()
                vector_store.get_store.cache_clear()
