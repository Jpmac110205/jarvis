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
    selected_model TEXT,
    tasks_number INTEGER DEFAULT 0,
    chats_number INTEGER DEFAULT 0,
    pdfs_number INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memories (
    id            SERIAL PRIMARY KEY,
    user_id       TEXT NOT NULL,
    content       TEXT NOT NULL,          -- the summary text
    embedding_id  TEXT NOT NULL,          -- reference to ChromaDB vector
    tier          TEXT DEFAULT 'short',   -- 'short' or 'long'
    frequency     INT DEFAULT 1,          -- how many times accessed
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at    TIMESTAMP DEFAULT NOW(),
    indexed_tier  TEXT
);

-- Additive upgrades for an existing deployment.
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_model TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS indexed_tier TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS memories_owner_embedding ON memories(user_id, embedding_id);
CREATE INDEX IF NOT EXISTS memories_owner_tier ON memories(user_id, tier);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summarized INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS conversation_owner_id ON conversation_messages(user_id, id);

CREATE TABLE IF NOT EXISTS chat_locks (
    user_id TEXT PRIMARY KEY,
    touched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_responses (
    user_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    message TEXT NOT NULL,
    reply TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, request_id)
);
CREATE TABLE IF NOT EXISTS document_uploads (
    user_id TEXT NOT NULL,
    document_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, document_key)
);
CREATE TABLE IF NOT EXISTS auth_sessions (
    session_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE document_uploads ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE document_uploads ADD COLUMN IF NOT EXISTS indexed INTEGER NOT NULL DEFAULT 1;
ALTER TABLE chat_responses ADD COLUMN IF NOT EXISTS attachment_keys TEXT NOT NULL DEFAULT '[]';
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS attachments TEXT NOT NULL DEFAULT '[]';
CREATE TABLE IF NOT EXISTS user_memory (
    user_id TEXT PRIMARY KEY,
    markdown TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL DEFAULT 0,
    auto_update INTEGER NOT NULL DEFAULT 1,
    last_message_id BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS memory_jobs (
    user_id TEXT PRIMARY KEY, generation BIGINT NOT NULL DEFAULT 1,
    model TEXT NOT NULL, run_after DOUBLE PRECISION NOT NULL DEFAULT 0,
    lease_token TEXT, lease_until DOUBLE PRECISION NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT
);
CREATE INDEX IF NOT EXISTS memory_jobs_ready ON memory_jobs(run_after, lease_until);
CREATE TABLE IF NOT EXISTS context_cache (
    user_id TEXT NOT NULL, cache_key TEXT NOT NULL, payload TEXT NOT NULL,
    expires_at DOUBLE PRECISION NOT NULL, PRIMARY KEY (user_id, cache_key)
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_tokens (
    user_id VARCHAR(255) PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_in INTEGER,
    scope TEXT,
    token_type VARCHAR(50),
    id_token TEXT,
    profile_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
