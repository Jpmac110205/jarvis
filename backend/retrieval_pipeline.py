"""Document retrieval shares the ingestion client and collection configuration."""

from storage.vector_store import get_store


def search_documents(query, user_id, k=4):
    if not user_id:
        return []
    return get_store("prodigy_documents").similarity_search(
        query, k=k, filter={"user_id": user_id}
    )
