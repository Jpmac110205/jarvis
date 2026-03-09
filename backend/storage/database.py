import psycopg2
from psycopg2.extras import RealDictCursor


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