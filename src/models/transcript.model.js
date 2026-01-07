import pool from '../db/index.js';

export const getTranscriptBySession = async (session_id, customer_id) => {
  const result = await pool.query(
    `
    SELECT t.*
    FROM transcripts t
    JOIN sessions s ON s.session_id = t.session_id
    WHERE t.session_id = $1
      AND s.customer_id = $2
    `,
    [session_id, customer_id]
  );

  return result.rows[0];
};

export const updateTranscriptBySession = async (
  session_id,
  customer_id,
  content
) => {
  const result = await pool.query(
    `
    UPDATE transcripts t
    SET content = $1,
        updated_at = now()
    FROM sessions s
    WHERE t.session_id = s.session_id
      AND t.session_id = $2
      AND s.customer_id = $3
    RETURNING t.*;
    `,
    [content, session_id, customer_id]
  );

  return result.rows[0];
};

export const createTranscript = async ({
  session_id,
  content = null,
  file_path = null,
  language = 'en',
  confidence_score = null
}) => {
  const result = await pool.query(
    `
    INSERT INTO transcripts (
      session_id,
      content,
      file_path,
      language,
      confidence_score
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `,
    [session_id, content, file_path, language, confidence_score]
  );

  return result.rows[0];
};
