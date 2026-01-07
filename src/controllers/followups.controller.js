import {
  createFollowup,
  listFollowups,
  updateFollowup,
  createFollowupResponse,
  listFollowupResponses,
} from '../models/followups.model.js';
import pool from '../db/index.js';

/* Therapist creates follow-up */
export const createFollowupHandler = async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    if (!title) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const followup = await createFollowup(
      req.params.id,
      customer_id,
      title,
      description,
      due_date
    );

    if (!followup) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(201).json(followup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* Therapist lists follow-ups */
export const listFollowupsHandler = async (req, res) => {
  try {
    const { client_id, status } = req.query;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const followups = await listFollowups({
      customer_id,
      client_id,
      status,
    });

    res.json(followups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* Therapist updates follow-up */
export const updateFollowupHandler = async (req, res) => {
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

    const followup = await updateFollowup(
      req.params.id,
      customer_id,
      req.body
    );

    if (!followup) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    res.json(followup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* Client submits response */
export const submitResponseHandler = async (req, res) => {
  try {
    const client_id = req.headers['x-client-id'];
    const { response_text, attachment_urls } = req.body;

    if (!client_id || !response_text) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const response = await createFollowupResponse(
      req.params.id,
      client_id,
      response_text,
      attachment_urls
    );

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* Therapist views responses */
export const listResponsesHandler = async (req, res) => {
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

    const responses = await listFollowupResponses(
      req.params.id,
      customer_id
    );

    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

