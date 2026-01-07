import express from 'express';
import {
  addIssue,
  getIssues,
  updateIssue,
  deleteIssue,
} from '../controllers/issues.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/* Create key issue */
router.post('/sessions/:id/issues', authenticateToken, addIssue);

/* Get key issues for a session */
router.get('/sessions/:id/issues', authenticateToken, getIssues);

/* Update a specific key issue */
router.put('/issues/:id', authenticateToken, updateIssue);

/* Delete a specific key issue */
router.delete('/issues/:id', authenticateToken, deleteIssue);

export default router;
