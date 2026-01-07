import express from 'express';
import {
  addNote,
  getNotes,
  updateNote,      
} from '../controllers/notes.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/* Create note */
router.post('/sessions/:id/notes', authenticateToken, addNote);

/* Get notes for a session */
router.get('/sessions/:id/notes', authenticateToken, getNotes);

/* Update a specific note */
router.put('/notes/:id', authenticateToken, updateNote);


export default router;
