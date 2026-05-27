import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv


backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))
print("DATABASE_URL loaded:", bool(os.getenv("DATABASE_URL")))


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
    cursor.execute(query, (
        google_id,
        user.email,
        user.display_name,
        user.given_name,
        user.family_name,
        user.picture_url
    ))
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
    conn = get_connection()        
    cursor = conn.cursor()

    query = """
        UPDATE users
        SET display_name  = %s,
            email          = %s,
            given_name     = %s,
            family_name    = %s,
            title          = %s,
            location       = %s,
            system_prompt  = %s,
            picture_url    = %s,
            tasks_number   = %s,
            chats_number   = %s,
            pdfs_number    = %s,
            updated_at     = CURRENT_TIMESTAMP
        WHERE id = %s
    """
    try: 
        cursor.execute(query, (
            data.get("display_name"),
            data.get("email"),
            data.get("given_name"),
            data.get("family_name"),
            data.get("title"),
            data.get("location"),
            data.get("system_prompt"),
            data.get("picture_url"),
            data.get("tasks_number", 0),
            data.get("chats_number", 0),
            data.get("pdfs_number", 0),
            user_id
        ))
        print(f"[UserRepository] Updated user {user_id} with data: {data}")
        conn.commit()
    except Exception as e:
        print(f"[UserRepository] Error updating user {user_id}: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

# ==================== INITIALIZE ====================
if __name__ == "__main__":
    create_table()
    print("Users table created successfully!")