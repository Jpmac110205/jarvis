"""An editable, versioned Markdown document per account, durable on Render."""

MAX_MARKDOWN_CHARS = 100_000


def get_memory(conn, user_id):
    row = conn.execute(
        """SELECT markdown, revision, auto_update, last_message_id, updated_at
        FROM user_memory WHERE user_id = ?""",
        (user_id,),
    ).fetchone()
    return {
        "markdown": row[0] if row else "",
        "revision": row[1] if row else 0,
        "auto_update": bool(row[2]) if row else True,
        "last_message_id": row[3] if row else 0,
        "updated_at": str(row[4]) if row else None,
    }


def save_memory(conn, user_id, markdown, auto_update, last_message_id, revision):
    if len(markdown) > MAX_MARKDOWN_CHARS:
        raise ValueError("User memory exceeds the Markdown size limit")
    conn.execute(
        "INSERT INTO user_memory (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING",
        (user_id,),
    )
    changed = conn.execute(
        """UPDATE user_memory SET markdown = ?, auto_update = ?, last_message_id = ?,
        revision = revision + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND revision = ?""",
        (markdown, int(auto_update), last_message_id, user_id, revision),
    ).rowcount
    if not changed:
        conn.rollback()
        raise ValueError("Your memory changed. Reload it before saving again.")
    conn.commit()
    return get_memory(conn, user_id)
