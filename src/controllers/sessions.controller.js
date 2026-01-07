import * as SessionModel from '../models/sessions.model.js';
import pool from '../db/index.js';

/* POST /sessions */
export const createSession = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const { client_id, session_date } = req.body;

    if (!client_id || !session_date) {
      return res.status(400).json({ error: 'client_id and session_date are required' });
    }

    const session = await SessionModel.createSession({
      customer_id,
      ...req.body,
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /sessions */
export const listSessions = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const sessions = await SessionModel.listSessions({
      customer_id,
      client_id: req.query.client_id,
      status: req.query.status,
      limit: Number(req.query.limit || 10),
      offset: Number(req.query.offset || 0),
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /sessions/:id */
export const getSession = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const session = await SessionModel.getSessionById(
      req.params.id,
      customer_id
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /sessions/:id */
export const updateSession = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const updated = await SessionModel.updateSession(
      req.params.id,
      customer_id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /sessions/:id */
export const deleteSession = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;
    await SessionModel.deleteSession(req.params.id, customer_id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
