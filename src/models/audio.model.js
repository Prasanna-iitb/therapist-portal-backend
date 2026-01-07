import pool from '../db/index.js';

/* Save audio path for a session */
export const attachAudioToSession = async (
  sessionId,
  customerId,
  audioPath
) => {
  const result = await pool.query(
    `
    UPDATE sessions
    SET audio_file_path = $1,
        updated_at = now()
    WHERE session_id = $2
      AND customer_id = $3
    RETURNING *;
    `,
    [audioPath, sessionId, customerId]
  );

  return result.rows[0];
};

/* Get session audio path */
export const getSessionAudioPath = async (sessionId, customerId) => {
  const result = await pool.query(
    `
    SELECT audio_file_path
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

/* DELETE SESSION AUDIO */
export const deleteSessionAudio = async (sessionId, customerId) => {
  const result = await pool.query(
    `
    UPDATE sessions
    SET audio_file_path = NULL,
        status = 'pending',
        updated_at = now()
    WHERE session_id = $1
      AND customer_id = $2
    RETURNING audio_file_path;
    `,
    [sessionId, customerId]
  );

  return result.rows[0];
};
