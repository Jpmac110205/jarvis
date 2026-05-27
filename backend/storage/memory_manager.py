import os
from datetime import datetime, timezone
from langchain_chroma import Chroma
from langchain.schema import Document
from langchain_community.embeddings import OpenAIEmbeddings
import sqlite3

from storage.database import init_memory_db

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

SHORT_TERM_DIR = "db/chroma_short_term"
LONG_TERM_DIR  = "db/chroma_long_term"

# Thresholds
SHORT_TERM_THRESHOLD = 0.15   # minimum score to stay in short-term
PROMOTION_THRESHOLD  = 5      # frequency hits before staying short-term permanently
TIER_SHIFT_DAYS      = 30     # days of no access before demotion to long-term


# ==================== SCORING ====================

def compute_score(frequency: int, last_accessed: datetime) -> float:
    """Higher = more relevant to keep in short-term"""
    now = datetime.now(timezone.utc)
    if last_accessed.tzinfo is None:
        last_accessed = last_accessed.replace(tzinfo=timezone.utc)
    days_since = (now - last_accessed).days
    recency_weight = 1 / (days_since + 1)
    return frequency * recency_weight


# ==================== RETRIEVAL ====================

def get_conversational_context(chat_history: list, n: int = 10) -> list:
    """Layer 1 — just the last N messages, no DB needed"""
    return chat_history[-n:]


def search_memory_tier(query: str, persist_dir: str, user_id: str, k: int = 2) -> list:
    """Search a specific ChromaDB tier for relevant memories"""
    try:
        db = Chroma(
            persist_directory=persist_dir,
            embedding_function=embedding_model
        )
        results = db.similarity_search_with_relevance_scores(
            query,
            k=k,
            filter={"user_id": user_id}
        )
        # Only return results above similarity threshold
        return [doc for doc, score in results if score > 0.5]
    except Exception as e:
        print(f"[Memory] Search failed in {persist_dir}: {e}")
        return []


def retrieve_memory(query: str, user_id: str, conn) -> dict:
    """
    Waterfall through all three layers.
    Returns whatever context was found and which tier it came from.
    """
    # Layer 2 — short-term
    short_results = search_memory_tier(query, SHORT_TERM_DIR, user_id)
    if short_results:
        # Update frequency + recency for each hit
        for doc in short_results:
            embedding_id = doc.metadata.get("embedding_id")
            if embedding_id:
                bump_memory_score(embedding_id, conn)
        return {
            "context": "\n---\n".join([d.page_content for d in short_results]),
            "tier": "short_term"
        }

    # Layer 3 — long-term (only if short-term missed)
    long_results = search_memory_tier(query, LONG_TERM_DIR, user_id)
    if long_results:
        for doc in long_results:
            embedding_id = doc.metadata.get("embedding_id")
            if embedding_id:
                bump_memory_score(embedding_id, conn)
                maybe_promote(embedding_id, conn)  # promote back to short-term if accessed again
        return {
            "context": "\n---\n".join([d.page_content for d in long_results]),
            "tier": "long_term"
        }

    return {"context": "", "tier": "none"}


# ==================== WRITING ====================

def store_memory(summary: str, user_id: str, conn, embedding_id: str):
    """Store a new memory in short-term by default"""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO memories (user_id, content, embedding_id, tier, frequency, last_accessed)
        VALUES (?, ?, ?, 'short', 1, ?)
    """, (user_id, summary, embedding_id, datetime.now(timezone.utc)))
    conn.commit()

    # Write to ChromaDB short-term
    doc = Document(
        page_content=summary,
        metadata={
            "user_id": user_id,
            "embedding_id": embedding_id,
            "tier": "short",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    )
    Chroma.from_documents(
        documents=[doc],
        embedding=embedding_model,
        persist_directory=SHORT_TERM_DIR
    )
    print(f"[Memory] Stored new short-term memory for user {user_id}")


# ==================== SCORING UPDATES ====================

def bump_memory_score(embedding_id: str, conn):
    """Increment frequency and update last_accessed when a memory is hit"""
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE memories
        SET frequency = frequency + 1,
            last_accessed = ?
        WHERE embedding_id = ?
    """, (datetime.now(timezone.utc), embedding_id))
    conn.commit()


def maybe_promote(embedding_id: str, conn):
    """Move a long-term memory back to short-term if it's being accessed again"""
    cursor = conn.cursor()
    cursor.execute("SELECT frequency, last_accessed FROM memories WHERE embedding_id = ?", (embedding_id,))
    row = cursor.fetchone()
    if not row:
        return

    frequency, last_accessed = row
    if isinstance(last_accessed, str):
        last_accessed = datetime.fromisoformat(last_accessed)

    score = compute_score(frequency, last_accessed)
    if score > SHORT_TERM_THRESHOLD:
        cursor.execute("UPDATE memories SET tier = 'short' WHERE embedding_id = ?", (embedding_id,))
        conn.commit()
        print(f"[Memory] Promoted {embedding_id} back to short-term (score={score:.3f})")


# ==================== DEMOTION JOB ====================

def demote_stale_memories(conn):
    """
    Run periodically — demote short-term memories that haven't been
    accessed recently and have low scores down to long-term.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT embedding_id, frequency, last_accessed FROM memories WHERE tier = 'short'")
    rows = cursor.fetchall()

    demoted = 0
    for embedding_id, frequency, last_accessed in rows:
        if isinstance(last_accessed, str):
            last_accessed = datetime.fromisoformat(last_accessed)
        score = compute_score(frequency, last_accessed)
        if score < SHORT_TERM_THRESHOLD:
            cursor.execute("UPDATE memories SET tier = 'long' WHERE embedding_id = ?", (embedding_id,))
            demoted += 1

    conn.commit()
    print(f"[Memory] Demoted {demoted} memories to long-term")
    init_memory_db()
