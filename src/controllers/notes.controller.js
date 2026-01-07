import {
  createNote,
  listNotesBySession,
  updateNoteById,
} from '../models/notes.model.js';
import pool from '../db/index.js';

export const addNote = async (req, res) => {
  try {
    const session_id = req.params.id;
    const { content } = req.body;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const note = await createNote(session_id, customer_id, content);

    if (!note) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(201).json({
      message: 'Note added successfully',
      note,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

export const getNotes = async (req, res) => {
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

    const notes = await listNotesBySession(session_id, customer_id);

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};


export const updateNote = async (req, res) => {
  try {
    const note_id = req.params.id;
    const { content } = req.body;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const note = await updateNoteById(note_id, customer_id, content);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update note' });
  }
};


export const deleteNote = async (req, res) => {
  try {
    const note_id = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customer_id = userResult.rows[0].customer_id;

    const note = await deleteNoteById(note_id, customer_id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
