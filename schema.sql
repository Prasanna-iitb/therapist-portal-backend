-- Therapist Portal Database Schema (Exact copy from local audio_mvp database)

-- Create therapist table
CREATE TABLE IF NOT EXISTS therapist (
    "Therapist_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subscription_tier TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "Therapist_Email" VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_therapist_email ON therapist("Therapist_Email");

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES therapist("Therapist_id") ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'therapist',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    google_id VARCHAR(255),
    picture TEXT,
    name VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES therapist("Therapist_id") ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    unique_identifier TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES therapist("Therapist_id") ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    title TEXT,
    session_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    duration INTEGER,
    status TEXT NOT NULL,
    audio_file_path TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT sessions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'transcribing'::text, 'completed'::text]))
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    transcript_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    content TEXT,
    language TEXT,
    confidence_score DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    file_path TEXT
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Create key_issues table
CREATE TABLE IF NOT EXISTS key_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    issue_text TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_key_issues_session_id ON key_issues(session_id);

-- Create followup_items table
CREATE TABLE IF NOT EXISTS followup_items (
    followup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    status TEXT NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT followup_items_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text]))
);

-- Create followup_responses table
CREATE TABLE IF NOT EXISTS followup_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    followup_id UUID NOT NULL REFERENCES followup_items(followup_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    response_text TEXT,
    attachment_urls JSONB,
    submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
