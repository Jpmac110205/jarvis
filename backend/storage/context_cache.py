"""Short-lived, account-scoped cache shared by web workers; never stores tokens."""

import json
import time


def read(conn, user_id, key):
    row = conn.execute(
        "SELECT payload, expires_at FROM context_cache WHERE user_id = ? AND cache_key = ? AND expires_at > ?",
        (user_id, key, time.time()),
    ).fetchone()
    return json.loads(row[0]) if row else None


def write(conn, user_id, key, data, ttl=45):
    conn.execute(
        """INSERT INTO context_cache (user_id, cache_key, payload, expires_at) VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, cache_key) DO UPDATE SET payload = excluded.payload, expires_at = excluded.expires_at""",
        (user_id, key, json.dumps(data), time.time() + ttl),
    )
    conn.commit()
