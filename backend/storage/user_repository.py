import mysql.connector
import dotenv
import os

# Load environment variables
dotenv.load_dotenv()

#Connection
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user=os.getenv("database_user"),
        password=os.getenv("database_password"),
        database=os.getenv("database_name")
    )

#Table Setup
def create_table():
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        given_name VARCHAR(255) NOT NULL,
        family_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        location VARCHAR(255),
        system_prompt TEXT,
        picture_url TEXT,
        tasks_number INT DEFAULT 0,
        chats_number INT DEFAULT 0,
        pdfs_number INT DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    """

    cursor.execute(query)
    conn.close()

#Create
def create_user(user, google_id):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    INSERT INTO users (
        google_id, email, display_name, given_name, family_name, picture_url
    ) VALUES (%s, %s, %s, %s, %s, %s)
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

#Read
def get_user_by_google_id(google_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = "SELECT * FROM users WHERE google_id = %s"
    cursor.execute(query, (google_id,))

    user = cursor.fetchone()
    conn.close()

    return user


def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))

    user = cursor.fetchone()
    conn.close()

    return user

#Update
def update_user(user_id, data):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    UPDATE users
    SET display_name=%s,
        given_name=%s,
        family_name=%s,
        title=%s,
        location=%s,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=%s
    """

    cursor.execute(query, (
        data["display_name"],
        data["given_name"],
        data["family_name"],
        data.get("title"),
        data.get("location"),
        user_id
    ))

    conn.commit()
    conn.close()

#Initialize
if __name__ == "__main__":
    create_table()
    print("Users table created successfully!")