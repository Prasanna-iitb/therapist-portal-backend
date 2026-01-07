import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { transcriptionQueue } from '../queues/transcription.queue.js';
import pool from '../db/index.js';

import {
  attachAudioToSession,
  getSessionAudioPath,
  updateSessionStatus,
} from '../models/audio.model.js';
import { createSession } from '../models/sessions.model.js';

/* POST /sessions/:id/audio */
export const uploadAudio = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customerId = userResult.rows[0].customer_id;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    const updatedSession = await attachAudioToSession(
      sessionId,
      customerId,
      req.file.path
    );

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      message: 'Audio uploaded successfully',
      audio_file_path: updatedSession.audio_file_path,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
};

/* GET /sessions/:id/audio */
export const getAudio = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customerId = userResult.rows[0].customer_id;

    const session = await getSessionAudioPath(sessionId, customerId);

    if (!session || !session.audio_file_path) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    const absolutePath = path.resolve(session.audio_file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(500).json({ error: 'File missing on server' });
    }

    res.sendFile(absolutePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve audio' });
  }
};

/* POST /sessions/:id/transcribe */
export const transcribeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customerId = userResult.rows[0].customer_id;

    const session = await getSessionAudioPath(sessionId, customerId);

    if (!session || !session.audio_file_path) {
      return res.status(400).json({ error: 'Audio not uploaded' });
    }

    // Mark as transcribing
    await updateSessionStatus(sessionId, 'transcribing');

    // Queue the transcription job for async processing
    const job = await transcriptionQueue.add(
      'transcribe-audio',
      {
        session_id: sessionId,
        audio_file_path: session.audio_file_path,
      },
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      }
    );

    res.json({
      message: 'Transcription job queued successfully',
      status: 'transcribing',
      job_id: job.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
};


/* DELETE /sessions/:id/audio */
export const deleteAudio = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customerId = userResult.rows[0].customer_id;

    const session = await getSessionAudioPath(sessionId, customerId);

    if (!session || !session.audio_file_path) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    const absolutePath = path.resolve(session.audio_file_path);

    // Remove file
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Remove DB reference
    await deleteSessionAudio(sessionId, customerId);

    res.json({ message: 'Audio deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete audio' });
  }
};

/* POST /audio/upload - Create session and upload audio in one request */
export const createSessionWithAudio = async (req, res) => {
  try {
    // Get customer_id from authenticated user
    const userResult = await pool.query(
      'SELECT customer_id FROM users WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const customerId = userResult.rows[0].customer_id;

    const { client_id, duration } = req.body;

    console.log('Creating session with audio:', { client_id, duration, hasFile: !!req.file });

    if (!client_id) {
      return res.status(400).json({ error: 'client_id required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    // Create a new session first
    const sessionId = uuidv4();
    const sessionDate = new Date();

    console.log('Creating session with ID:', sessionId);

    let session;
    try {
      session = await createSession({
        session_id: sessionId,
        customer_id: customerId,
        client_id: client_id,
        session_date: sessionDate,
        duration: parseInt(duration) || 0,
        status: 'pending',
      });
      console.log('Session created successfully:', session);
    } catch (sessionError) {
      console.error('Failed to create session:', sessionError);
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Move uploaded file to proper session folder
    const sessionDir = path.join('src', 'uploads', 'sessions', sessionId);
    console.log('Creating directory:', sessionDir);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
      console.log('Directory created');
    }

    const finalPath = path.join(sessionDir, 'audio.webm');
    console.log('Moving file from', req.file.path, 'to', finalPath);
    
    try {
      fs.renameSync(req.file.path, finalPath);
      console.log('Audio file moved successfully');
    } catch (moveError) {
      console.error('Failed to move file:', moveError);
      throw new Error(`Failed to move audio file: ${moveError.message}`);
    }

    // Attach audio to session
    try {
      await attachAudioToSession(sessionId, customerId, finalPath);
      console.log('Audio attached to session successfully');
    } catch (attachError) {
      console.error('Failed to attach audio to session:', attachError);
      throw new Error(`Failed to attach audio: ${attachError.message}`);
    }

    // Queue transcription
    await transcriptionQueue.add(
      'transcribe-audio',
      {
        session_id: sessionId,
        audio_file_path: finalPath,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    console.log('Transcription queued');

    res.status(201).json({
      message: 'Session created and audio uploaded successfully',
      session_id: sessionId,
      audio_file_path: finalPath,
    });
  } catch (err) {
    console.error('Error in createSessionWithAudio:', err);
    res.status(500).json({ error: err.message || 'Failed to create session with audio' });
  }
};
