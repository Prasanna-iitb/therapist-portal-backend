import pool from '../db/index.js';

/* CREATE */
export const createClient = async ({
  customer_id,
  name,
  email,
  phone,
  unique_identifier,
}) => {
  const query = `
    INSERT INTO clients (customer_id, name, email, phone, unique_identifier)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    customer_id,
    name,
    email,
    phone,
    unique_identifier,
  ]);

  return result.rows[0];
};

/* READ (LIST) */
export const getClientsByCustomer = async (customer_id) => {
  const result = await pool.query(
    `SELECT * FROM clients
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customer_id]
  );
  return result.rows;
};

/* READ (ONE) */
export const getClientById = async (client_id, customer_id) => {
  const result = await pool.query(
    `SELECT * FROM clients
     WHERE client_id = $1 AND customer_id = $2`,
    [client_id, customer_id]
  );
  return result.rows[0];
};

/* UPDATE */
export const updateClient = async (
  client_id,
  customer_id,
  updates
) => {
  const result = await pool.query(
    `
    UPDATE clients
    SET
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      phone = COALESCE($3, phone),
      unique_identifier = COALESCE($4, unique_identifier)
    WHERE client_id = $5 AND customer_id = $6
    RETURNING *;
    `,
    [
      updates.name,
      updates.email,
      updates.phone,
      updates.unique_identifier,
      client_id,
      customer_id,
    ]
  );

  return result.rows[0];
};


/* DELETE */
export const deleteClient = async (client_id, customer_id) => {
  await pool.query(
    `DELETE FROM clients
     WHERE client_id = $1 AND customer_id = $2`,
    [client_id, customer_id]
  );
};
