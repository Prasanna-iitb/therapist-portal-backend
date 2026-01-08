-- Migration: Add audio metadata columns to sessions table
-- This migration adds support for storing audio file information and blob URLs

-- Add new columns to sessions table if they don't exist
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS audio_blob_url TEXT,
ADD COLUMN IF NOT EXISTS audio_file_size BIGINT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_format VARCHAR(50),
ADD COLUMN IF NOT EXISTS audio_uploaded_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS audio_mime_type VARCHAR(100) DEFAULT 'audio/webm';

-- Create index on audio_blob_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_audio_blob_url ON sessions(audio_blob_url);

-- Add comment to explain the columns
COMMENT ON COLUMN sessions.audio_blob_url IS 'Vercel Blob Storage URL for the audio file';
COMMENT ON COLUMN sessions.audio_file_size IS 'Size of audio file in bytes';
COMMENT ON COLUMN sessions.audio_duration IS 'Duration of audio in seconds';
COMMENT ON COLUMN sessions.audio_format IS 'Audio format (e.g., webm, mp3, wav)';
COMMENT ON COLUMN sessions.audio_uploaded_at IS 'Timestamp when audio was uploaded to blob storage';
COMMENT ON COLUMN sessions.audio_mime_type IS 'MIME type of the audio file';
