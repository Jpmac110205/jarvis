"""Coalescing durable jobs, leased across processes and retried after crashes."""

import time
from uuid import uuid4


def enqueue(conn, user_id, model):
    # Caller commits this in the same transaction as the chat transcript/receipt.
    conn.execute(
        """INSERT INTO memory_jobs (user_id, model) VALUES (?, ?)
        ON CONFLICT (user_id) DO UPDATE SET generation = memory_jobs.generation + 1,
        model = excluded.model""",
        (user_id, model),
    )


def claim(conn, now=None, lease_seconds=900):
    now = time.time() if now is None else now
    postgres = getattr(conn, "postgres", False)
    try:
        if not postgres:
            conn.execute("BEGIN IMMEDIATE")
        sql = """SELECT user_id, generation, model, attempts FROM memory_jobs
            WHERE run_after <= ? AND lease_until <= ? ORDER BY run_after, user_id LIMIT 1"""
        if postgres:
            sql += " FOR UPDATE SKIP LOCKED"
        row = conn.execute(sql, (now, now)).fetchone()
        if not row:
            conn.commit()
            return None
        token = uuid4().hex
        conn.execute(
            "UPDATE memory_jobs SET lease_token = ?, lease_until = ? WHERE user_id = ?",
            (token, now + lease_seconds, row[0]),
        )
        conn.commit()
        return dict(
            user_id=row[0],
            generation=row[1],
            model=row[2],
            attempts=row[3],
            token=token,
        )
    except Exception:
        conn.rollback()
        raise


def owns_lease(conn, job):
    return (
        conn.execute(
            "SELECT 1 FROM memory_jobs WHERE user_id = ? AND lease_token = ? AND lease_until > ?",
            (job["user_id"], job["token"], time.time()),
        ).fetchone()
        is not None
    )


def finish(conn, job, again=False):
    if not again:
        conn.execute(
            "DELETE FROM memory_jobs WHERE user_id = ? AND lease_token = ? AND generation = ?",
            (job["user_id"], job["token"], job["generation"]),
        )
    # A new exchange during the job increments generation, so it cannot be lost.
    conn.execute(
        """UPDATE memory_jobs SET lease_token = NULL, lease_until = 0,
        attempts = 0, run_after = 0, last_error = NULL WHERE user_id = ? AND lease_token = ?""",
        (job["user_id"], job["token"]),
    )
    conn.commit()


def fail(conn, job, error):
    delay = min(300, 2 ** min(job["attempts"] + 1, 8))
    # Do not persist provider exception text, which can contain personal context.
    conn.execute(
        """UPDATE memory_jobs SET lease_token = NULL, lease_until = 0,
        attempts = attempts + 1, run_after = ?, last_error = ?
        WHERE user_id = ? AND lease_token = ?""",
        (time.time() + delay, type(error).__name__, job["user_id"], job["token"]),
    )
    conn.commit()
