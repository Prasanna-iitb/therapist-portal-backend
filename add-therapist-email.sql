-- Add email column to therapist table if it doesn't exist
ALTER TABLE therapist 
ADD COLUMN IF NOT EXISTS "Therapist_Email" VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_therapist_email ON therapist("Therapist_Email");
