import pool from '../db/index.js';

/* Save audio and metadata for a session */
export const attachAudioToSession = async (
  sessionId,
  customerId,
  audioPath,
  audioData = {}
) => {
  const {
    audioUrl = audioPath,
    fileSize = null,
    duration = null,
    format = 'webm',
    mimeType = 'audio/webm'
  } = audioData;

  const result = await pool.query(
    `
    UPDATE sessions
    SET audio_blob_url = $1,
        audio_file_size = $2,
        audio_duration = $3,
        audio_format = $4,
        audio_mime_type = $5,
        audio_uploaded_at = now(),
        status = CASE 
          WHEN status = 'pending' THEN 'completed'
          ELSE status
        END,
        updated_at = now()
    WHERE session_id = $6
      AND customer_id = $7
    RETURNING *;
    `,
    [audioUrl, fileSize, duration, format, mimeType, sessionId, customerId]
  );

  return result.rows[0];
};

/* Get session audio with all metadata */
export const getSessionAudioPath = async (sessionId, customerId) => {
  const result = await pool.query(
    `
    SELECT 
      audio_file_path,
      audio_blob_url,
      audio_file_size,
      audio_duration,
      audio_format,
      audio_mime_type,
      audio_uploaded_at
    FROM sessions
    WHERE session_id = $1
      AND customer_id = $2;
    `,
    [sessionId, customerId]
  );

  return result.rows[0];
};

/* Update session status */
export const updateSessionStatus = async (sessionId, status) => {
  await pool.query(
    `
    UPDATE sessions
    SET status = $1,
        updated_at = now()
    WHERE session_id = $2;
    `,
    [status, sessionId]
  );
};

/* DELETE SESSION AUDIO - Clear all audio metadata */
export const deleteSessionAudio = async (sessionId, customerId) => {
  const result = await pool.query(
    `
    UPDATE sessions
    SET audio_blob_url = NULL,
        audio_file_size = NULL,
        audio_duration = NULL,
        audio_format = NULL,
        audio_mime_type = NULL,
        audio_uploaded_at = NULL,
        status = 'pending',
        updated_at = now()
    WHERE session_id = $1
      AND customer_id = $2
    RETURNING audio_blob_url;
    `,
    [sessionId, customerId]
  );

  return result.rows[0];
};
