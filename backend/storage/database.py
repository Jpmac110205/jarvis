import os

import psycopg2
from psycopg2.extras import RealDictCursor

import sqlite3


def get_connection():
    """
    Creates and returns a connection to the PostgreSQL database
    """

    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="your_database_name",
        user="your_username",
        password="your_password"
    )

    return conn


def get_cursor():
    """
    Returns a cursor that outputs dictionaries instead of tuples
    """
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    return conn, cursor

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