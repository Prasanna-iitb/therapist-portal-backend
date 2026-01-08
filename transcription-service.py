#!/usr/bin/env python3
"""
Transcription Service for Railway
Downloads audio from Vercel Blob, transcribes with Whisper, saves to database
"""

import os
import sys
import requests
import json
import time
import psycopg2
from psycopg2.extras import RealDictCursor
import whisper
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '30'))  # Check every 30 seconds

if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set")
    sys.exit(1)

# Load Whisper model once on startup
logger.info("Loading Whisper tiny model...")
try:
    model = whisper.load_model("tiny")
    logger.info("Whisper model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {e}")
    sys.exit(1)


def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(DATABASE_URL)


def get_pending_sessions():
    """Get sessions with audio but no transcript"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            s.session_id,
            s.audio_blob_url,
            s.audio_format,
            s.customer_id
        FROM sessions s
        LEFT JOIN transcripts t ON s.session_id = t.session_id
        WHERE s.audio_blob_url IS NOT NULL
            AND t.transcript_id IS NULL
            AND s.status = 'transcribing'
        LIMIT 5
        """
        
        cur.execute(query)
        sessions = cur.fetchall()
        cur.close()
        conn.close()
        return sessions
    except Exception as e:
        logger.error(f"Error fetching pending sessions: {e}")
        return []


def download_audio(blob_url):
    """Download audio from Vercel Blob"""
    try:
        logger.info(f"Downloading audio from: {blob_url}")
        response = requests.get(blob_url, timeout=30)
        response.raise_for_status()
        
        # Save to temp file
        temp_file = f"/tmp/audio_{int(time.time())}.webm"
        with open(temp_file, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"Audio downloaded: {temp_file} ({len(response.content)} bytes)")
        return temp_file
    except Exception as e:
        logger.error(f"Failed to download audio: {e}")
        return None


def transcribe_audio(audio_path):
    """Transcribe audio using Whisper tiny"""
    try:
        logger.info(f"Starting transcription: {audio_path}")
        result = model.transcribe(audio_path, language="en", verbose=False)
        
        transcript_text = result.get("text", "").strip()
        logger.info(f"Transcription completed: {len(transcript_text)} chars")
        
        return {
            "text": transcript_text,
            "language": result.get("language", "en"),
            "duration": result.get("duration", 0)
        }
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return None


def save_transcript(session_id, content, language):
    """Save transcript to database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
        INSERT INTO transcripts (session_id, content, language, confidence_score, created_at, updated_at)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (session_id) DO UPDATE
        SET content = EXCLUDED.content, language = EXCLUDED.language, updated_at = NOW()
        """
        
        cur.execute(query, (session_id, content, language, 0.95))
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Transcript saved for session: {session_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to save transcript: {e}")
        return False


def update_session_status(session_id, status):
    """Update session status"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = "UPDATE sessions SET status = %s, updated_at = NOW() WHERE session_id = %s"
        cur.execute(query, (status, session_id))
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Session {session_id} status updated to: {status}")
    except Exception as e:
        logger.error(f"Failed to update session status: {e}")


def cleanup_temp_file(file_path):
    """Remove temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up: {file_path}")
    except Exception as e:
        logger.error(f"Failed to cleanup {file_path}: {e}")


def process_session(session):
    """Process a single session"""
    session_id = session['session_id']
    audio_url = session['audio_blob_url']
    
    logger.info(f"Processing session: {session_id}")
    
    # Download audio
    audio_path = download_audio(audio_url)
    if not audio_path:
        update_session_status(session_id, 'pending')
        return False
    
    # Transcribe
    result = transcribe_audio(audio_path)
    cleanup_temp_file(audio_path)
    
    if not result:
        update_session_status(session_id, 'pending')
        return False
    
    # Save to database
    success = save_transcript(session_id, result['text'], result['language'])
    
    if success:
        update_session_status(session_id, 'completed')
        logger.info(f"✅ Session {session_id} completed successfully")
    else:
        update_session_status(session_id, 'pending')
        logger.error(f"❌ Session {session_id} failed")
    
    return success


def main():
    """Main polling loop"""
    logger.info("🎤 Transcription Service Started")
    logger.info(f"Poll interval: {POLL_INTERVAL} seconds")
    
    while True:
        try:
            sessions = get_pending_sessions()
            
            if sessions:
                logger.info(f"Found {len(sessions)} pending sessions")
                for session in sessions:
                    try:
                        process_session(session)
                    except Exception as e:
                        logger.error(f"Error processing session {session['session_id']}: {e}")
                        update_session_status(session['session_id'], 'pending')
            else:
                logger.debug("No pending sessions")
            
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    main()
