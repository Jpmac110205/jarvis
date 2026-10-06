"""One vector configuration for ingestion, retrieval and both memory tiers."""

import os
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def get_client():
    import chromadb

    keys = ("CHROMA_API_KEY", "CHROMA_TENANT", "CHROMA_DATABASE")
    configured = [bool(os.getenv(key)) for key in keys]
    if all(configured):
        return chromadb.CloudClient(
            **{key.removeprefix("CHROMA_").lower(): os.environ[key] for key in keys}
        )
    if any(configured) or os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError(
            "Chroma Cloud requires CHROMA_API_KEY, CHROMA_TENANT and CHROMA_DATABASE"
        )
    path = os.getenv(
        "CHROMA_LOCAL_PATH",
        str(Path(__file__).resolve().parents[1] / "db/chroma_unified"),
    )
    return chromadb.PersistentClient(path=path)


@lru_cache(maxsize=1)
def get_embeddings():
    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(
        model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    )


@lru_cache(maxsize=3)
def get_store(collection):
    from langchain_chroma import Chroma

    return Chroma(
        client=get_client(),
        collection_name=collection,
        embedding_function=get_embeddings(),
        collection_metadata={"hnsw:space": "cosine"},
    )
