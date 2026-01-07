import express from 'express';
import {
  createFollowupHandler,
  listFollowupsHandler,
  updateFollowupHandler,
  submitResponseHandler,
  listResponsesHandler,
} from '../controllers/followups.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/sessions/:id/followups', authenticateToken, createFollowupHandler);
router.get('/followups', authenticateToken, listFollowupsHandler);
router.put('/followups/:id', authenticateToken, updateFollowupHandler);
router.post('/followups/:id/response', authenticateToken, submitResponseHandler);
router.get('/followups/:id/responses', authenticateToken, listResponsesHandler);

export default router;
