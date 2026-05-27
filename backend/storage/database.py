import os
import sqlite3

def init_memory_db():
    os.makedirs("db", exist_ok=True)
    conn = sqlite3.connect("db/memory.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       TEXT NOT NULL,
            content       TEXT NOT NULL,
            embedding_id  TEXT NOT NULL,
            tier          TEXT DEFAULT 'short',
            frequency     INTEGER DEFAULT 1,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print("[Memory] DB initialized.")