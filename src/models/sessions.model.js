import pool from '../db/index.js';

/* CREATE SESSION */
export const createSession = async ({
  session_id,
  customer_id,
  client_id,
  title,
  session_date,
  duration,
  status = 'pending',
}) => {
  // Validate status
  if (!['pending', 'transcribing', 'completed'].includes(status)) {
    throw new Error('Invalid status. Must be pending, transcribing, or completed');
  }

  // Validate that client belongs to this therapist
  const clientCheck = await pool.query(
    `SELECT client_id FROM clients WHERE client_id = $1 AND customer_id = $2`,
    [client_id, customer_id]
  );

  if (clientCheck.rows.length === 0) {
    throw new Error('Client does not belong to this therapist');
  }

  const result = await pool.query(
    `
    INSERT INTO sessions (
      session_id,
      customer_id,
      client_id,
      title,
      session_date,
      duration,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `,
    [session_id, customer_id, client_id, title, session_date, duration, status]
  );

  return result.rows[0];
};

/* LIST SESSIONS (with filters + pagination) */
export const listSessions = async ({
  customer_id,
  client_id,
  status,
  limit = 10,
  offset = 0,
}) => {
  let query = `
    SELECT 
      s.*,
      c.name as client_name,
      LEFT(REGEXP_REPLACE(COALESCE((
        SELECT content 
        FROM notes 
        WHERE session_id = s.session_id 
        ORDER BY created_at DESC 
        LIMIT 1
      ), ''), '<[^>]+>', '', 'g'), 150) as notes_preview,
      COUNT(DISTINCT n.note_id) > 0 as has_notes,
      MAX(fr.submitted_at) as latest_followup_response_date,
      COUNT(DISTINCT fr.response_id) as followup_response_count,
      (SELECT name FROM clients WHERE client_id = s.client_id) as latest_response_client_name
    FROM sessions s
    LEFT JOIN clients c ON s.client_id = c.client_id
    LEFT JOIN notes n ON s.session_id = n.session_id
    LEFT JOIN followup_items fi ON s.session_id = fi.session_id
    LEFT JOIN followup_responses fr ON fi.followup_id = fr.followup_id
    WHERE s.customer_id = $1
  `;
  const values = [customer_id];
  let idx = 2;

  if (client_id) {
    query += ` AND s.client_id = $${idx++}`;
    values.push(client_id);
  }

  if (status) {
    query += ` AND s.status = $${idx++}`;
    values.push(status);
  }

  query += ` GROUP BY s.session_id, c.name ORDER BY s.session_date DESC LIMIT $${idx++} OFFSET $${idx++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
};

/* GET SESSION BY ID */
export const getSessionById = async (session_id, customer_id) => {
  const result = await pool.query(
    `
    SELECT 
      s.*,
      c.name as client_name,
      c.client_id,
      ROW_NUMBER() OVER (PARTITION BY s.customer_id ORDER BY s.session_date ASC, s.created_at ASC) as session_number
    FROM sessions s
    LEFT JOIN clients c ON s.client_id = c.client_id
    WHERE s.session_id = $1 AND s.customer_id = $2
    `,
    [session_id, customer_id]
  );

  return result.rows[0];
};

/* UPDATE SESSION */
export const updateSession = async (
  session_id,
  customer_id,
  updates
) => {
  // Validate status if provided
  if (updates.status && !['pending', 'transcribing', 'completed'].includes(updates.status)) {
    throw new Error('Invalid status. Must be pending, transcribing, or completed');
  }

  const result = await pool.query(
    `
    UPDATE sessions
    SET
      title = COALESCE($1, title),
      session_date = COALESCE($2, session_date),
      duration = COALESCE($3, duration),
      status = COALESCE($4, status),
      audio_file_path = COALESCE($5, audio_file_path),
      updated_at = now()
    WHERE session_id = $6 AND customer_id = $7
    RETURNING *;
    `,
    [
      updates.title,
      updates.session_date,
      updates.duration,
      updates.status,
      updates.audio_file_path,
      session_id,
      customer_id,
    ]
  );

  return result.rows[0];
};


/* DELETE SESSION */
export const deleteSession = async (session_id, customer_id) => {
  await pool.query(
    `
    DELETE FROM sessions
    WHERE session_id = $1 AND customer_id = $2
    `,
    [session_id, customer_id]
  );
};

/* UPDATE SESSION STATUS */
export const updateSessionStatus = async (session_id, status) => {
  // Validate status
  if (!['pending', 'transcribing', 'completed'].includes(status)) {
    throw new Error('Invalid status. Must be pending, transcribing, or completed');
  }

  const result = await pool.query(
    `
    UPDATE sessions
    SET status = $1,
        updated_at = now()
    WHERE session_id = $2
    RETURNING *;
    `,
    [status, session_id]
  );

  return result.rows[0];
};
