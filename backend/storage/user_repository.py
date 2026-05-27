import psycopg
from psycopg.rows import dict_row
import dotenv
import os

dotenv.load_dotenv()

def get_connection():
    return psycopg.connect(os.getenv("DATABASE_URL"), row_factory=dict_row)

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
            given_name    = %s,
            family_name   = %s,
            title         = %s,
            location      = %s,
            system_prompt = %s,
            picture_url   = %s,
            updated_at    = CURRENT_TIMESTAMP
        WHERE id = %s
    """
    cursor.execute(query, (
        data["display_name"],
        data["given_name"],
        data["family_name"],
        data.get("title"),
        data.get("location"),
        data.get("system_prompt"),
        data.get("picture_url"),
        user_id
    ))
    conn.commit()
    conn.close()

# ==================== INITIALIZE ====================
if __name__ == "__main__":
    create_table()
    print("Users table created successfully!")