import express from 'express';
import {
  getTranscript,
  updateTranscript,
} from '../controllers/transcript.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/sessions/:id/transcript', authenticateToken, getTranscript);
router.put('/sessions/:id/transcript', authenticateToken, updateTranscript);

export default router;
