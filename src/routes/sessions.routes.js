import express from 'express';
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
} from '../controllers/sessions.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all session routes with authentication
router.post('/', authenticateToken, createSession);
router.get('/', authenticateToken, listSessions);
router.get('/:id', authenticateToken, getSession);
router.put('/:id', authenticateToken, updateSession);
router.delete('/:id', authenticateToken, deleteSession);

export default router;
