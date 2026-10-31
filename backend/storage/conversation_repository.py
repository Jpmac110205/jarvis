"""User-scoped conversational tier, persisted independently of process lifetime."""

from datetime import datetime, timezone
import hashlib
import json

SUMMARY_MESSAGES = 20  # ten complete user/assistant exchanges
CONTEXT_MESSAGES = 10


def get_messages(conn, user_id, limit=None):
    sql = "SELECT id, role, content, created_at, attachments FROM conversation_messages WHERE user_id = ? ORDER BY id DESC"
    parameters = (user_id,)
    if limit is not None:
        sql += " LIMIT ?"
        parameters += (limit,)
    rows = conn.execute(sql, parameters).fetchall()
    return [
        {
            "id": r[0],
            "role": r[1],
            "content": r[2],
            "created_at": str(r[3]),
            "attachments": json.loads(r[4]),
        }
        for r in reversed(rows)
    ]


def append_exchange(
    conn,
    user_id,
    question,
    answer,
    request_id=None,
    route="LLM",
    track_usage=False,
    attachments=None,
    maintenance_model=None,
    memory_accesses=None,
):
    now = datetime.now(timezone.utc).isoformat()
    try:
        for role, content in (("user", question), ("assistant", answer)):
            conn.execute(
                "INSERT INTO conversation_messages (user_id, role, content, created_at, attachments) VALUES (?, ?, ?, ?, ?)",
                (
                    user_id,
                    role,
                    content,
                    now,
                    json.dumps(attachments or []) if role == "user" else "[]",
                ),
            )
        if request_id:
            conn.execute(
                "INSERT INTO chat_responses (user_id, request_id, message, reply, route, attachment_keys) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    user_id,
                    str(request_id),
                    question,
                    answer,
                    route,
                    json.dumps(sorted(a["document_key"] for a in (attachments or []))),
                ),
            )
        if track_usage and getattr(conn, "postgres", False):
            conn.execute(
                "UPDATE users SET chats_number = COALESCE(chats_number, 0) + 1 WHERE google_id = ?",
                (user_id,),
            )
        if maintenance_model:
            from storage.memory_manager import touch_memories
            from storage.job_repository import enqueue

            touch_memories(conn, user_id, memory_accesses or [])
            enqueue(conn, user_id, maintenance_model)
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def pending_summary(conn, user_id):
    rows = conn.execute(
        """SELECT id, role, content FROM conversation_messages
        WHERE user_id = ? AND summarized = 0 ORDER BY id LIMIT ?""",
        (user_id, SUMMARY_MESSAGES),
    ).fetchall()
    return rows if len(rows) == SUMMARY_MESSAGES else []


def summary_id(user_id, rows):
    return (
        "summary-"
        + hashlib.sha256(f"{user_id}:{rows[0][0]}:{rows[-1][0]}".encode()).hexdigest()
    )


def mark_summarized(conn, user_id, rows):
    conn.execute(
        "UPDATE conversation_messages SET summarized = 1 WHERE user_id = ? AND id >= ? AND id <= ?",
        (user_id, rows[0][0], rows[-1][0]),
    )
    conn.commit()
