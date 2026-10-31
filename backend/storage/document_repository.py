"""Full extracted documents live in SQL; vectors remain a supplemental index."""


def describe(row):
    return {
        "document_key": row[0],
        "filename": row[1],
        "characters": row[2],
        "full_text_available": row[2] is not None,
        "indexed": bool(row[3]),
        "created_at": str(row[4]),
    }


def list_documents(conn, user_id):
    rows = conn.execute(
        """SELECT document_key, filename, LENGTH(content), indexed, created_at
        FROM document_uploads WHERE user_id = ? ORDER BY created_at DESC, document_key""",
        (user_id,),
    ).fetchall()
    return [describe(row) for row in rows]


def get_document(conn, user_id, key):
    row = conn.execute(
        """SELECT document_key, filename, LENGTH(content), indexed, created_at, content
        FROM document_uploads WHERE user_id = ? AND document_key = ?""",
        (user_id, key),
    ).fetchone()
    return {**describe(row), "content": row[5]} if row else None


def save_document(conn, user_id, key, filename, content):
    inserted = conn.execute(
        """INSERT INTO document_uploads (user_id, document_key, filename, content, indexed)
        VALUES (?, ?, ?, ?, 0) ON CONFLICT (user_id, document_key) DO NOTHING""",
        (user_id, key, filename, content),
    ).rowcount
    # Re-uploading an old, vector-only file restores its complete text.
    conn.execute(
        "UPDATE document_uploads SET content = ? WHERE user_id = ? AND document_key = ?",
        (content, user_id, key),
    )
    return inserted
