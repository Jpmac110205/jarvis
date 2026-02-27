import psycopg
import bcrypt


try:
    conn = psycopg.connect(
        dbname="prodigy",
        user="jpmac1102",
        host="localhost"
    )

    cur = conn.cursor()

    # Insert user
    cur.execute("""
    INSERT INTO users 
    (username, email, password_hash, display_name, given_name, family_name)
    VALUES (%s, %s, %s, %s, %s, %s)
""",
(
    "jpmac1102",
    "james@test.com",
    "hashed_password_here",
    "James McAllister",
    "James",
    "McAllister"
))

    conn.commit()

    # Now query
    cur.execute("SELECT * FROM users;")
    rows = cur.fetchall()

    print("Connection successful.")
    print("Users:", rows)

    cur.close()
    conn.close()

except Exception as e:
    print("Error:", e)