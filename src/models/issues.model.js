import pool from '../db/index.js';

export const createIssue = async (session_id, customer_id, issue_text) => {
  const result = await pool.query(
    `
    INSERT INTO key_issues (session_id, issue_text)
    SELECT s.session_id, $2
    FROM sessions s
    WHERE s.session_id = $1
      AND s.customer_id = $3
    RETURNING *;
    `,
    [session_id, issue_text, customer_id]
  );

  return result.rows[0];
};

export const listIssuesBySession = async (session_id, customer_id) => {
  const result = await pool.query(
    `
    SELECT i.*
    FROM key_issues i
    JOIN sessions s ON s.session_id = i.session_id
    WHERE i.session_id = $1
      AND s.customer_id = $2
    ORDER BY i.created_at ASC;
    `,
    [session_id, customer_id]
  );

  return result.rows;
};

export const updateIssueById = async (issue_id, customer_id, issue_text) => {
  const result = await pool.query(
    `
    UPDATE key_issues i
    SET issue_text = $1,
        updated_at = now()
    FROM sessions s
    WHERE i.issue_id = $2
      AND i.session_id = s.session_id
      AND s.customer_id = $3
    RETURNING i.*;
    `,
    [issue_text, issue_id, customer_id]
  );

  return result.rows[0];
};

export const deleteIssueById = async (issue_id, customer_id) => {
  const result = await pool.query(
    `
    DELETE FROM key_issues i
    USING sessions s
    WHERE i.issue_id = $1
      AND i.session_id = s.session_id
      AND s.customer_id = $2
    RETURNING i.*;
    `,
    [issue_id, customer_id]
  );

  return result.rows[0];
};
