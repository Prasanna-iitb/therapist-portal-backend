import {
  createIssue,
  listIssuesBySession,
  updateIssueById,
  deleteIssueById,
} from '../models/issues.model.js';
import pool from '../db/index.js';

export const addIssue = async (req, res) => {
  try {
    const session_id = req.params.id;
    const { issue_text } = req.body;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    if (!issue_text || !issue_text.trim()) {
      return res.status(400).json({ error: 'issue_text is required' });
    }

    const issue = await createIssue(session_id, customer_id, issue_text.trim());

    if (!issue) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(201).json({
      message: 'Key issue added successfully',
      issue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add key issue' });
  }
};

export const getIssues = async (req, res) => {
  try {
    const session_id = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const issues = await listIssuesBySession(session_id, customer_id);

    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch key issues' });
  }
};

export const updateIssue = async (req, res) => {
  try {
    const issue_id = req.params.id;
    const { issue_text } = req.body;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    if (!issue_text || !issue_text.trim()) {
      return res.status(400).json({ error: 'issue_text is required' });
    }

    const issue = await updateIssueById(issue_id, customer_id, issue_text.trim());

    if (!issue) {
      return res.status(404).json({ error: 'Key issue not found' });
    }

    res.json({
      message: 'Key issue updated successfully',
      issue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update key issue' });
  }
};

export const deleteIssue = async (req, res) => {
  try {
    const issue_id = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const issue = await deleteIssueById(issue_id, customer_id);

    if (!issue) {
      return res.status(404).json({ error: 'Key issue not found' });
    }

    res.json({
      message: 'Key issue deleted successfully',
      issue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete key issue' });
  }
};
