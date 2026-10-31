"""SQL is the source of truth; vector changes are an idempotent, retryable index."""

import logging
from datetime import datetime, timezone

from storage.vector_store import get_store

logger = logging.getLogger(__name__)
SHORT_COLLECTION = "prodigy_memory_short"
LONG_COLLECTION = "prodigy_memory_long"
SHORT_TERM_THRESHOLD = 0.15
PROMOTION_THRESHOLD = 5
TIER_SHIFT_DAYS = 30
SIMILARITY_THRESHOLD = 0.5


def as_datetime(value):
    value = datetime.fromisoformat(value) if isinstance(value, str) else value
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def compute_score(frequency, last_accessed):
    days_since = max(0, (datetime.now(timezone.utc) - as_datetime(last_accessed)).days)
    return max(0, frequency) / (days_since + 1)


def get_conversational_context(chat_history, n=10):
    return chat_history[-n:] if n > 0 else []


def store_memory(summary, user_id, conn, embedding_id, sync_index=True):
    if not user_id or not summary.strip() or not embedding_id:
        raise ValueError("A memory requires an owner, content and stable ID")
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """INSERT INTO memories (user_id, content, embedding_id, tier, frequency, last_accessed, created_at)
        VALUES (?, ?, ?, 'short', 1, ?, ?) ON CONFLICT (user_id, embedding_id) DO NOTHING""",
        (user_id, summary.strip(), embedding_id, now, now),
    )
    conn.commit()  # retain the summary even when embeddings/network are unavailable
    if sync_index:
        sync_memory_index(conn, user_id)


def sync_memory_index(conn, user_id, limit=50):
    """Upsert destination before removing source. Interrupted moves can be retried.

    The SQL tier validates search hits during a partial move. Never delete SQL content
    as compensation for a vector failure: it is the durable recovery source.
    Maintenance workers own a per-account job lease. Chat may update SQL tiers
    concurrently, so a changed tier must remain pending for another indexing pass.
    """
    rows = conn.execute(
        """SELECT embedding_id, content, tier, created_at FROM memories
        WHERE user_id = ? AND (indexed_tier IS NULL OR indexed_tier <> tier)
        ORDER BY id LIMIT ?""",
        (user_id, limit),
    ).fetchall()
    synced = 0
    for embedding_id, content, tier, created_at in rows:
        try:
            from langchain_core.documents import Document

            target = SHORT_COLLECTION if tier == "short" else LONG_COLLECTION
            source = LONG_COLLECTION if tier == "short" else SHORT_COLLECTION
            # Stable, owner-prefixed IDs also tolerate legacy embedding-ID collisions.
            vector_id = f"{user_id}:{embedding_id}"
            get_store(target).add_documents(
                [
                    Document(
                        page_content=content,
                        metadata={
                            "user_id": user_id,
                            "embedding_id": embedding_id,
                            "tier": tier,
                            "created_at": str(created_at),
                        },
                    )
                ],
                ids=[vector_id],
            )
            get_store(source).delete(ids=[vector_id])
            changed = conn.execute(
                "UPDATE memories SET indexed_tier = ? WHERE user_id = ? AND embedding_id = ? AND tier = ?",
                (tier, user_id, embedding_id, tier),
            ).rowcount
            if not changed:
                conn.execute(
                    "UPDATE memories SET indexed_tier = NULL WHERE user_id = ? AND embedding_id = ?",
                    (user_id, embedding_id),
                )
            conn.commit()
            synced += 1
        except Exception:
            conn.rollback()
            conn.execute(
                "UPDATE memories SET indexed_tier = NULL WHERE user_id = ? AND embedding_id = ?",
                (user_id, embedding_id),
            )
            conn.commit()
            logger.exception("Memory indexing deferred; SQL content retained")
            # A service outage should not make fifty identical network requests.
            break
    return synced


def search_memory_tier(query, collection, user_id, k=2):
    if not user_id:
        return []
    try:
        results = get_store(collection).similarity_search_with_relevance_scores(
            query, k=k, filter={"user_id": user_id}
        )
        return [
            doc
            for doc, score in results
            if score > SIMILARITY_THRESHOLD and doc.metadata.get("user_id") == user_id
        ]
    except Exception:
        logger.exception("Memory search unavailable in %s", collection)
        return []


def retrieve_memory(query, user_id, conn, hits=None, touch_hits=True):
    if not user_id:
        return {"context": "", "tier": "none"}
    if hits is not None:
        return apply_memory_hits(conn, user_id, hits, touch=touch_hits)
    context, tiers, seen = [], [], set()
    # Search both: a short-term hit must not hide relevant older information.
    for collection, tier in ((SHORT_COLLECTION, "short"), (LONG_COLLECTION, "long")):
        for doc in search_memory_tier(query, collection, user_id):
            embedding_id = doc.metadata.get("embedding_id")
            row = conn.execute(
                "SELECT content, tier FROM memories WHERE user_id = ? AND embedding_id = ?",
                (user_id, embedding_id),
            ).fetchone()
            if not row or row[1] != tier or embedding_id in seen:
                continue
            seen.add(embedding_id)
            context.append(row[0])
            tiers.append(tier)
            bump_memory_score(embedding_id, conn, user_id)
            if tier == "long":
                maybe_promote(embedding_id, conn, user_id)
    if not tiers:
        return {"context": "", "tier": "none"}
    return {
        "context": "\n---\n".join(context),
        "tier": "mixed"
        if len(set(tiers)) > 1
        else ("short_term" if tiers[0] == "short" else "long_term"),
    }


def touch_memories(conn, user_id, keys):
    if not keys:
        return
    placeholders = ",".join("?" for _ in keys)
    conn.execute(
        f"UPDATE memories SET frequency = frequency + 1, last_accessed = ?, tier = 'short' WHERE user_id = ? AND embedding_id IN ({placeholders})",
        (datetime.now(timezone.utc).isoformat(), user_id, *keys),
    )


def apply_memory_hits(conn, user_id, hits, touch=True):
    """Validate in one read and touch in one transaction; worker moves vectors."""
    keys = list(
        {
            doc.metadata.get("embedding_id")
            for _, doc in hits
            if doc.metadata.get("embedding_id")
        }
    )
    if not keys:
        return {"context": "", "tier": "none"}
    placeholders = ",".join("?" for _ in keys)
    rows = conn.execute(
        f"SELECT embedding_id, content, tier FROM memories WHERE user_id = ? AND embedding_id IN ({placeholders})",
        (user_id, *keys),
    ).fetchall()
    authoritative = {r[0]: (r[1], r[2]) for r in rows}
    context, tiers, seen = [], [], set()
    for tier, doc in hits:
        key = doc.metadata.get("embedding_id")
        row = authoritative.get(key)
        if (
            not row
            or row[1] != tier
            or key in seen
            or doc.metadata.get("user_id") != user_id
        ):
            continue
        seen.add(key)
        context.append(row[0])
        tiers.append(tier)
    if touch:
        touch_memories(conn, user_id, list(seen))
        conn.commit()
    return {
        "context": "\n---\n".join(context),
        "accesses": list(seen),
        "tier": "mixed"
        if len(set(tiers)) > 1
        else (tiers[0] + "_term" if tiers else "none"),
    }


def bump_memory_score(embedding_id, conn, user_id):
    conn.execute(
        """UPDATE memories SET frequency = frequency + 1, last_accessed = ?
        WHERE user_id = ? AND embedding_id = ?""",
        (datetime.now(timezone.utc).isoformat(), user_id, embedding_id),
    )
    conn.commit()


def maybe_promote(embedding_id, conn, user_id):
    row = conn.execute(
        "SELECT frequency, last_accessed FROM memories WHERE user_id = ? AND embedding_id = ? AND tier = 'long'",
        (user_id, embedding_id),
    ).fetchone()
    if row and compute_score(*row) > SHORT_TERM_THRESHOLD:
        conn.execute(
            "UPDATE memories SET tier = 'short' WHERE user_id = ? AND embedding_id = ?",
            (user_id, embedding_id),
        )
        conn.commit()
        sync_memory_index(conn, user_id)


def demote_stale_memories(conn, user_id):
    rows = conn.execute(
        "SELECT embedding_id, frequency, last_accessed FROM memories WHERE user_id = ? AND tier = 'short'",
        (user_id,),
    ).fetchall()
    demoted = 0
    now = datetime.now(timezone.utc)
    for embedding_id, frequency, last_accessed in rows:
        if (
            (now - as_datetime(last_accessed)).days >= TIER_SHIFT_DAYS
            and frequency < PROMOTION_THRESHOLD
            and compute_score(frequency, last_accessed) < SHORT_TERM_THRESHOLD
        ):
            demoted += conn.execute(
                "UPDATE memories SET tier = 'long' WHERE user_id = ? AND embedding_id = ? AND frequency = ? AND last_accessed = ?",
                (user_id, embedding_id, frequency, last_accessed),
            ).rowcount
    conn.commit()
    return demoted
