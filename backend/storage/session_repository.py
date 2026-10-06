"""Opaque, revocable sessions; a Google subject is an identifier, never a credential."""

import hashlib
from contextlib import contextmanager
import secrets
from datetime import datetime, timedelta, timezone
from storage import token_repository


@contextmanager
def transaction():
    conn = token_repository.get_connection()
    try:
        with conn:
            yield conn
    finally:
        conn.close()


SESSION_DAYS = 7


def create_table():
    with transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""CREATE TABLE IF NOT EXISTS auth_sessions (
                session_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL
            )""")
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at)"
            )


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    with transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM auth_sessions WHERE expires_at < NOW()")
            cursor.execute(
                "INSERT INTO auth_sessions (session_hash, user_id, expires_at) VALUES (%s, %s, %s)",
                (
                    hashlib.sha256(token.encode()).hexdigest(),
                    user_id,
                    datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
                ),
            )
    return token


def resolve_session(token):
    if not token or len(token) > 256:
        return None
    conn = token_repository.get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM auth_sessions WHERE session_hash = %s AND expires_at > NOW()",
                (hashlib.sha256(token.encode()).hexdigest(),),
            )
            row = cursor.fetchone()
            return row["user_id"] if row else None
    finally:
        conn.close()


def delete_session(token):
    if not token:
        return
    with transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM auth_sessions WHERE session_hash = %s",
                (hashlib.sha256(token.encode()).hexdigest(),),
            )
