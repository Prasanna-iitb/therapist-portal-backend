import pool from '../db/index.js';

export const createNote = async (session_id, customer_id, content) => {
  const result = await pool.query(
    `
    INSERT INTO notes (session_id, content)
    SELECT s.session_id, $2
    FROM sessions s
    WHERE s.session_id = $1
      AND s.customer_id = $3
    RETURNING *;
    `,
    [session_id, content, customer_id]
  );

  return result.rows[0];
};

export const listNotesBySession = async (session_id, customer_id) => {
  const result = await pool.query(
    `
    SELECT n.*
    FROM notes n
    JOIN sessions s ON s.session_id = n.session_id
    WHERE n.session_id = $1
      AND s.customer_id = $2
    ORDER BY n.created_at ASC;
    `,
    [session_id, customer_id]
  );

  return result.rows;
};


export const updateNoteById = async (note_id, customer_id, content) => {
  const result = await pool.query(
    `
    UPDATE notes n
    SET content = $1,
        updated_at = now()
    FROM sessions s
    WHERE n.note_id = $2
      AND n.session_id = s.session_id
      AND s.customer_id = $3
    RETURNING n.*;
    `,
    [content, note_id, customer_id]
  );

  return result.rows[0];
};


export const deleteNoteById = async (note_id, customer_id) => {
  const result = await pool.query(
    `
    DELETE FROM notes n
    USING sessions s
    WHERE n.note_id = $1
      AND n.session_id = s.session_id
      AND s.customer_id = $2
    RETURNING n.*;
    `,
    [note_id, customer_id]
  );

  return result.rows[0];
};
