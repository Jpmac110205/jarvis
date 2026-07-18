import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv


backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))


def get_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL not set — check your .env file")
    return psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor)


# ==================== TABLE SETUP ====================
def create_table():
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        CREATE TABLE IF NOT EXISTS user_tokens (
            user_id       VARCHAR(255) PRIMARY KEY,
            access_token  TEXT NOT NULL,
            refresh_token TEXT,
            expires_in    INT,
            scope         TEXT,
            token_type    VARCHAR(50),
            id_token      TEXT,
            profile_json  JSONB,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    cursor.execute(query)
    conn.commit()
    conn.close()


# ==================== CREATE / UPSERT ====================
def save_tokens(user_id: str, token_data: dict, profile: dict):
    """
    Store or update the OAuth token bundle + profile for a user.
    token_data is the raw dict returned by Google's token endpoint.
    profile is the raw userinfo dict.
    """
    import json

    conn = get_connection()
    cursor = conn.cursor()
    query = """
        INSERT INTO user_tokens (
            user_id, access_token, refresh_token, expires_in,
            scope, token_type, id_token, profile_json, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            access_token  = EXCLUDED.access_token,
            refresh_token = COALESCE(EXCLUDED.refresh_token, user_tokens.refresh_token),
            expires_in    = EXCLUDED.expires_in,
            scope         = EXCLUDED.scope,
            token_type    = EXCLUDED.token_type,
            id_token      = EXCLUDED.id_token,
            profile_json  = EXCLUDED.profile_json,
            updated_at    = CURRENT_TIMESTAMP
    """
    cursor.execute(query, (
        user_id,
        token_data.get("access_token"),
        token_data.get("refresh_token"),
        token_data.get("expires_in"),
        token_data.get("scope"),
        token_data.get("token_type"),
        token_data.get("id_token"),
        json.dumps(profile),
    ))
    conn.commit()
    conn.close()


# ==================== READ ====================
def get_tokens(user_id: str):
    """
    Returns a dict shaped like the old in-memory user_tokens[user_id]:
    { "tokens": {...}, "profile": {...} }  or None if not found.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_tokens WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "tokens": {
            "access_token": row["access_token"],
            "refresh_token": row["refresh_token"],
            "expires_in": row["expires_in"],
            "scope": row["scope"],
            "token_type": row["token_type"],
            "id_token": row["id_token"],
        },
        "profile": row["profile_json"],
    }


# ==================== DELETE ====================
def delete_tokens(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_tokens WHERE user_id = %s", (user_id,))
    conn.commit()
    conn.close()


# ==================== INITIALIZE ====================
if __name__ == "__main__":
    create_table()
    print("user_tokens table created successfully!")