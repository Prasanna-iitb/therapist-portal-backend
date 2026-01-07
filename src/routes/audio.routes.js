import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import {
  uploadAudio,
  getAudio,
  transcribeSession,
  createSessionWithAudio,
} from '../controllers/audio.controller.js';
import { authenticateToken, authenticateTokenQuery } from '../middleware/auth.middleware.js';

const router = express.Router();

/* Multer storage config */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('src', 'uploads', 'sessions', req.params.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'audio' + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// New endpoint for creating session with audio
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('src', 'uploads', 'temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const tempUpload = multer({ storage: tempStorage });

router.post('/audio/upload', authenticateToken, tempUpload.single('audio'), createSessionWithAudio);
router.post('/sessions/:id/audio', authenticateToken, upload.single('audio'), uploadAudio);
router.get('/sessions/:id/audio', authenticateTokenQuery, getAudio);
router.post('/sessions/:id/transcribe', authenticateToken, transcribeSession);

export default router;
