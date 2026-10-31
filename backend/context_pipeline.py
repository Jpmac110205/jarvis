"""One query embedding and parallel, bounded searches; no shared SQL connections."""

import logging
import os
from concurrent.futures import ThreadPoolExecutor, wait
from langchain_openai import OpenAIEmbeddings
from functools import lru_cache
from storage.vector_store import get_store
from storage.memory_manager import (
    SHORT_COLLECTION,
    LONG_COLLECTION,
    SIMILARITY_THRESHOLD,
)

logger = logging.getLogger(__name__)
IO_POOL = ThreadPoolExecutor(max_workers=8, thread_name_prefix="context-io")
GOOGLE_POOL = ThreadPoolExecutor(max_workers=2, thread_name_prefix="google-context")


@lru_cache(maxsize=1)
def query_embeddings():
    return OpenAIEmbeddings(
        model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        request_timeout=3,
        max_retries=0,
    )


def search_vector(collection, embedding, user_id, count, threshold):
    # All Prodigy collections use cosine distance; by-vector API returns distance,
    # despite its name. Convert to similarity before applying the threshold.
    results = get_store(collection).similarity_search_by_vector_with_relevance_scores(
        embedding,
        k=count,
        filter={"user_id": user_id},
    )
    return [
        doc
        for doc, distance in results
        if 1 - distance > threshold and doc.metadata.get("user_id") == user_id
    ]


def vector_context(question, user_id, has_memories, has_documents):
    if not has_memories and not has_documents:
        return {"hits": [], "documents": [], "unavailable": False}
    result = {"hits": [], "documents": [], "unavailable": False}
    embedding_future = IO_POOL.submit(query_embeddings().embed_query, question)
    try:
        embedding = embedding_future.result(timeout=4)
    except Exception:
        embedding_future.cancel()
        logger.warning("Query embedding unavailable", exc_info=True)
        return {**result, "unavailable": True}
    searches = {}
    if has_memories:
        for tier, collection in (
            ("short", SHORT_COLLECTION),
            ("long", LONG_COLLECTION),
        ):
            searches[
                IO_POOL.submit(
                    search_vector,
                    collection,
                    embedding,
                    user_id,
                    2,
                    SIMILARITY_THRESHOLD,
                )
            ] = tier
    if has_documents:
        searches[
            IO_POOL.submit(
                search_vector,
                "prodigy_documents",
                embedding,
                user_id,
                4,
                float(os.getenv("DOCUMENT_SIMILARITY_THRESHOLD", "0.35")),
            )
        ] = "documents"
    completed, pending = wait(searches, timeout=4)
    for future in pending:
        future.cancel()
        result["unavailable"] = True
    for future in completed:
        try:
            docs = future.result()
            if searches[future] == "documents":
                result["documents"] = docs
            else:
                result["hits"].extend((searches[future], doc) for doc in docs)
        except Exception:
            result["unavailable"] = True
            logger.warning("Vector context unavailable", exc_info=True)
    return result
