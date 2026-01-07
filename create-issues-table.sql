-- Create key_issues table
CREATE TABLE IF NOT EXISTS key_issues (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  issue_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by session
CREATE INDEX IF NOT EXISTS idx_key_issues_session_id ON key_issues(session_id);

-- Add comment to table
COMMENT ON TABLE key_issues IS 'Stores individual key issues and themes identified during therapy sessions';
