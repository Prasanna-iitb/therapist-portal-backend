import pool from '../db/index.js';

/* Create follow-up */
export const createFollowup = async (
  session_id,
  customer_id,
  title,
  description,
  due_date
) => {
  const result = await pool.query(
    `
    INSERT INTO followup_items (session_id, client_id, title, description, status, due_date)
    SELECT s.session_id, s.client_id, $2, $3, 'pending', $4
    FROM sessions s
    WHERE s.session_id = $1
      AND s.customer_id = $5
    RETURNING *;
    `,
    [session_id, title, description, due_date, customer_id]
  );
  return result.rows[0];
};

/* List follow-ups */
export const listFollowups = async ({ customer_id, client_id, status }) => {
  let query = `
    SELECT f.*
    FROM followup_items f
    JOIN sessions s ON s.session_id = f.session_id
    WHERE s.customer_id = $1
  `;
  const values = [customer_id];
  let idx = 2;

  if (client_id) {
    query += ` AND f.client_id = $${idx++}`;
    values.push(client_id);
  }

  if (status) {
    query += ` AND f.status = $${idx++}`;
    values.push(status);
  }

  query += ` ORDER BY f.due_date ASC`;

  const result = await pool.query(query, values);
  return result.rows;
};

/* Update follow-up */
export const updateFollowup = async (
  followup_id,
  customer_id,
  updates
) => {
  const { title, description, status, due_date } = updates;

  // Validate status if provided
  if (status && !['pending', 'completed'].includes(status)) {
    throw new Error('Invalid status. Must be pending or completed');
  }

  const result = await pool.query(
    `
    UPDATE followup_items f
    SET
      title = COALESCE($1, f.title),
      description = COALESCE($2, f.description),
      status = COALESCE($3, f.status),
      due_date = COALESCE($4, f.due_date),
      updated_at = now()
    FROM sessions s
    WHERE f.followup_id = $5
      AND f.session_id = s.session_id
      AND s.customer_id = $6
    RETURNING f.*;
    `,
    [title, description, status, due_date, followup_id, customer_id]
  );

  return result.rows[0];
};

/* Client submits response */
export const createFollowupResponse = async (
  followup_id,
  client_id,
  response_text,
  attachment_urls
) => {
  // Validate that the followup belongs to this client
  const followupCheck = await pool.query(
    `SELECT followup_id FROM followup_items WHERE followup_id = $1 AND client_id = $2`,
    [followup_id, client_id]
  );

  if (followupCheck.rows.length === 0) {
    throw new Error('Follow-up not found or does not belong to this client');
  }

  const result = await pool.query(
    `
    INSERT INTO followup_responses
      (followup_id, client_id, response_text, attachment_urls)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [followup_id, client_id, response_text, JSON.stringify(attachment_urls)]
  );
  return result.rows[0];
};

/* Therapist views responses */
export const listFollowupResponses = async (
  followup_id,
  customer_id
) => {
  const result = await pool.query(
    `
    SELECT r.*
    FROM followup_responses r
    JOIN followup_items f ON f.followup_id = r.followup_id
    JOIN sessions s ON s.session_id = f.session_id
    WHERE r.followup_id = $1
      AND s.customer_id = $2
    ORDER BY r.submitted_at ASC;
    `,
    [followup_id, customer_id]
  );
  return result.rows;
};
