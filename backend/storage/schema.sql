CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    given_name VARCHAR(255) NOT NULL,
    family_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    location VARCHAR(255),
    system_prompt TEXT,
    picture_url TEXT,
    tasks_number INTEGER DEFAULT 0,
    chats_number INTEGER DEFAULT 0,
    pdfs_number INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memories (
    id            SERIAL PRIMARY KEY,
    user_id       TEXT NOT NULL,
    content       TEXT NOT NULL,          -- the summary text
    embedding_id  TEXT NOT NULL,          -- reference to ChromaDB vector
    tier          TEXT DEFAULT 'short',   -- 'short' or 'long'
    frequency     INT DEFAULT 1,          -- how many times accessed
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at    TIMESTAMP DEFAULT NOW()
);