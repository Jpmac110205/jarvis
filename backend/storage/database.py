"""Durable memory storage. PostgreSQL in production; explicit SQLite for local tests."""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]


class PostgresConnection:
    """Keep the small repository SQL portable without changing parameter safety."""

    postgres = True

    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, parameters=()):
        cursor = self.connection.cursor()
        cursor.execute(sql.replace("?", "%s"), parameters)
        return cursor

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


def get_memory_connection(sqlite_path=None):
    if sqlite_path is None and os.getenv("DATABASE_URL"):
        import psycopg2

        return PostgresConnection(
            psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=10)
        )
    if sqlite_path is None and os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("Production memory requires DATABASE_URL")
    path = Path(
        sqlite_path or os.getenv("MEMORY_SQLITE_PATH", BACKEND_DIR / "db/memory.db")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    # StreamingResponse advances sync generators in its thread pool. A request
    # owns its connection exclusively, but consecutive advances can use different threads.
    conn = sqlite3.connect(path, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_memory_db(conn=None):
    owned = conn is None
    conn = conn or get_memory_connection()
    postgres = getattr(conn, "postgres", False)
    identity = (
        "BIGSERIAL PRIMARY KEY" if postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"
    )
    try:
        conn.execute(f"""CREATE TABLE IF NOT EXISTS memories (
            id {identity}, user_id TEXT NOT NULL, content TEXT NOT NULL,
            embedding_id TEXT NOT NULL, tier TEXT DEFAULT 'short',
            frequency INTEGER DEFAULT 1, last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, indexed_tier TEXT
        )""")
        if postgres:
            conn.execute(
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS indexed_tier TEXT"
            )
        elif "indexed_tier" not in [
            r[1] for r in conn.execute("PRAGMA table_info(memories)")
        ]:
            conn.execute("ALTER TABLE memories ADD COLUMN indexed_tier TEXT")
        # No destructive deduplication: a legacy duplicate must be reviewed before migration.
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS memories_owner_embedding ON memories(user_id, embedding_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS memories_owner_tier ON memories(user_id, tier)"
        )
        conn.execute(f"""CREATE TABLE IF NOT EXISTS conversation_messages (
            id {identity}, user_id TEXT NOT NULL, role TEXT NOT NULL,
            content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            summarized INTEGER NOT NULL DEFAULT 0
        )""")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS conversation_owner_id ON conversation_messages(user_id, id)"
        )
        conn.execute("""CREATE TABLE IF NOT EXISTS chat_responses (
            user_id TEXT NOT NULL, request_id TEXT NOT NULL, message TEXT NOT NULL,
            reply TEXT NOT NULL, route TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, request_id)
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS document_uploads (
            user_id TEXT NOT NULL, document_key TEXT NOT NULL, filename TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, document_key)
        )""")
        # Additive upgrades preserve existing uploads and chat receipts.
        for table, column, definition in (
            ("document_uploads", "content", "TEXT"),
            ("document_uploads", "indexed", "INTEGER NOT NULL DEFAULT 1"),
            ("chat_responses", "attachment_keys", "TEXT NOT NULL DEFAULT '[]'"),
            ("conversation_messages", "attachments", "TEXT NOT NULL DEFAULT '[]'"),
        ):
            if postgres:
                conn.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}"
                )
            elif column not in [
                r[1] for r in conn.execute(f"PRAGMA table_info({table})")
            ]:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        conn.execute("""CREATE TABLE IF NOT EXISTS user_memory (
            user_id TEXT PRIMARY KEY, markdown TEXT NOT NULL DEFAULT '',
            revision INTEGER NOT NULL DEFAULT 0, auto_update INTEGER NOT NULL DEFAULT 1,
            last_message_id BIGINT NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS chat_locks (
            user_id TEXT PRIMARY KEY, touched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS memory_jobs (
            user_id TEXT PRIMARY KEY, generation BIGINT NOT NULL DEFAULT 1,
            model TEXT NOT NULL, run_after DOUBLE PRECISION NOT NULL DEFAULT 0,
            lease_token TEXT, lease_until DOUBLE PRECISION NOT NULL DEFAULT 0,
            attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT
        )""")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS memory_jobs_ready ON memory_jobs(run_after, lease_until)"
        )
        conn.execute("""CREATE TABLE IF NOT EXISTS context_cache (
            user_id TEXT NOT NULL, cache_key TEXT NOT NULL, payload TEXT NOT NULL,
            expires_at DOUBLE PRECISION NOT NULL, PRIMARY KEY (user_id, cache_key)
        )""")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        if owned:
            conn.close()


@contextmanager
def serialized_chat(conn, user_id):
    """A separate transaction holds a row lock across workers, including pooled PG.

    Unlike session advisory locks this works with transaction-pooling Neon URLs.
    All chat writes use the request connection while this lock connection stays open.
    """
    if getattr(conn, "postgres", False):
        lock = get_memory_connection()
        try:
            lock.execute(
                "INSERT INTO chat_locks (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING",
                (user_id,),
            )
            lock.commit()
            lock.execute("SET LOCAL lock_timeout = '60s'")
            lock.execute(
                "SELECT user_id FROM chat_locks WHERE user_id = ? FOR UPDATE",
                (user_id,),
            )
            yield
        finally:
            lock.rollback()
            lock.close()
    else:
        # SQLite is development-only. Serialize across processes, not just threads.
        import fcntl
        import hashlib
        import tempfile

        lock_path = Path(tempfile.gettempdir()) / (
            "prodigy-chat-" + hashlib.sha256(user_id.encode()).hexdigest() + ".lock"
        )
        with lock_path.open("a") as lock_file:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock_file, fcntl.LOCK_UN)
