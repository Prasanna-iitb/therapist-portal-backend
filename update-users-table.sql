-- Add columns for Google OAuth authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Make password_hash nullable (since Google users won't have passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Make customer_id nullable (for new registrations)
ALTER TABLE users ALTER COLUMN customer_id DROP NOT NULL;

-- Make role nullable with default value
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'therapist';
