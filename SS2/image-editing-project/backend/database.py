import sqlite3

DB_NAME = "image_editing.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS edit_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_image TEXT NOT NULL,
            prompt TEXT NOT NULL,
            edited_image TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def insert_edit_history(original_image, prompt, edited_image):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO edit_history (original_image, prompt, edited_image)
        VALUES (?, ?, ?)
    """, (original_image, prompt, edited_image))

    conn.commit()
    conn.close()


def fetch_all_history():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, original_image, prompt, edited_image, created_at
        FROM edit_history
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    conn.close()
    return rows