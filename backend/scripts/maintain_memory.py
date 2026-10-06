"""Read-only by default. Migrate legacy SQLite summaries and repair vector indexes."""

import argparse
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
from storage.database import get_memory_connection, init_memory_db, serialized_chat
from storage.memory_manager import demote_stale_memories, sync_memory_index


def migrate(source, target):
    """Copy SQL content without deleting source or overwriting existing target rows."""
    rows = source.execute(
        "SELECT user_id, content, embedding_id, tier, frequency, last_accessed, created_at FROM memories ORDER BY id"
    ).fetchall()
    copied = 0
    try:
        for row in rows:
            existing = target.execute(
                "SELECT content, tier FROM memories WHERE user_id = ? AND embedding_id = ?",
                (row[0], row[2]),
            ).fetchone()
            if existing:
                if existing[0] != row[1]:
                    raise ValueError(
                        "Conflicting legacy memory ID. Review the duplicate before migrating."
                    )
                continue
            if row[3] not in {"short", "long"}:
                raise ValueError("Unknown legacy memory tier")
            target.execute(
                """INSERT INTO memories (user_id, content, embedding_id, tier, frequency, last_accessed, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                tuple(row),
            )
            copied += 1
        target.commit()
    except Exception:
        target.rollback()
        raise
    return copied


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--legacy-sqlite",
        type=Path,
        help="Backup of the production db/memory.db to import",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply migration, demotion and index repair",
    )
    parser.add_argument(
        "--reindex",
        action="store_true",
        help="Rebuild both indexes from canonical SQL content",
    )
    args = parser.parse_args()
    if not args.apply:
        if args.legacy_sqlite:
            source = sqlite3.connect(
                f"{args.legacy_sqlite.resolve().as_uri()}?mode=ro", uri=True
            )
            try:
                print(
                    f"Legacy summaries: {source.execute('SELECT COUNT(*) FROM memories').fetchone()[0]}"
                )
            finally:
                source.close()
        print(
            "Dry run: no target connections or writes. --apply copies legacy summaries, demotes stale summaries and repairs indexes."
        )
        return
    from storage import user_repository, token_repository, session_repository

    user_repository.create_table()
    token_repository.create_table()
    session_repository.create_table()
    conn = get_memory_connection()
    try:
        init_memory_db(conn)
        if args.legacy_sqlite:
            source = sqlite3.connect(
                f"{args.legacy_sqlite.resolve().as_uri()}?mode=ro", uri=True
            )
            try:
                print(f"Copied summaries: {migrate(source, conn)}")
            finally:
                source.close()
        users = conn.execute("SELECT DISTINCT user_id FROM memories").fetchall()
        for (user_id,) in users:
            with serialized_chat(conn, user_id):
                if args.reindex:
                    conn.execute(
                        "UPDATE memories SET indexed_tier = NULL WHERE user_id = ?",
                        (user_id,),
                    )
                    conn.commit()
                demote_stale_memories(conn, user_id)
                while sync_memory_index(conn, user_id, limit=50):
                    pass
        pending = conn.execute(
            "SELECT COUNT(*) FROM memories WHERE indexed_tier IS NULL OR indexed_tier <> tier"
        ).fetchone()[0]
        print(f"Summaries awaiting indexing: {pending}")
        if pending:
            raise SystemExit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
