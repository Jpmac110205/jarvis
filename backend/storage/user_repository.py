import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv


backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, "..", ".env"))


def get_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL not set — check your .env file")
    return psycopg2.connect(
        db_url, cursor_factory=psycopg2.extras.RealDictCursor, connect_timeout=10
    )


# ==================== TABLE SETUP ====================
def create_table():
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        CREATE TABLE IF NOT EXISTS users (
            id          BIGSERIAL PRIMARY KEY,
            google_id   VARCHAR(255) UNIQUE,
            email       VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            given_name  VARCHAR(255) NOT NULL,
            family_name VARCHAR(255) NOT NULL,
            title       VARCHAR(255),
            location    VARCHAR(255),
            system_prompt TEXT,
            picture_url TEXT,
            tasks_number  INT DEFAULT 0,
            chats_number  INT DEFAULT 0,
            pdfs_number   INT DEFAULT 0,
            verified    BOOLEAN DEFAULT FALSE,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    cursor.execute(query)
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_model TEXT")
    conn.commit()
    conn.close()


# ==================== CREATE ====================
def create_user(user, google_id):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        INSERT INTO users (
            google_id, email, display_name, given_name, family_name, picture_url
        ) VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (google_id) DO NOTHING
    """
    cursor.execute(
        query,
        (
            google_id,
            user.email,
            user.display_name,
            user.given_name,
            user.family_name,
            user.picture_url,
        ),
    )
    conn.commit()
    conn.close()


# ==================== READ ====================
def get_user_by_google_id(google_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
    user = cursor.fetchone()
    conn.close()
    return user


def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user


# ==================== UPDATE ====================
def update_user(user_id, data):
    allowed = {
        "display_name",
        "email",
        "given_name",
        "family_name",
        "title",
        "location",
        "system_prompt",
        "picture_url",
        "selected_model",
    }
    fields = {key: value for key, value in data.items() if key in allowed}
    if not fields:
        return
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            assignments = ", ".join(f"{key} = %s" for key in fields)
            cursor.execute(
                f"UPDATE users SET {assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (*fields.values(), user_id),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def increment_counter(google_id, counter):
    if counter not in {"chats_number", "pdfs_number"}:
        raise ValueError("Unknown counter")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"UPDATE users SET {counter} = COALESCE({counter}, 0) + 1 WHERE google_id = %s",
                (google_id,),
            )
        conn.commit()
    finally:
        conn.close()


# ==================== INITIALIZE ====================
if __name__ == "__main__":
    create_table()
    print("Users table created successfully!")
