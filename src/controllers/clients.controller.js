import * as ClientModel from '../models/clients.model.js';
import db from '../db/index.js';

/* POST /clients */
export const createClient = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await db.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_id = userResult.rows[0].customer_id;

    const client = await ClientModel.createClient({
      customer_id,
      ...req.body,
    });

    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /clients */
export const getClients = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await db.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_id = userResult.rows[0].customer_id;
    const clients = await ClientModel.getClientsByCustomer(customer_id);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /clients/:id */
export const getClient = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await db.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_id = userResult.rows[0].customer_id;
    const client = await ClientModel.getClientById(
      req.params.id,
      customer_id
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /clients/:id */
export const updateClient = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await db.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_id = userResult.rows[0].customer_id;
    const updated = await ClientModel.updateClient(
      req.params.id,
      customer_id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /clients/:id */
export const deleteClient = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await db.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customer_id = userResult.rows[0].customer_id;
    await ClientModel.deleteClient(req.params.id, customer_id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
