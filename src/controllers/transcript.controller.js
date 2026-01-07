import {
  getTranscriptBySession,
  updateTranscriptBySession,
} from '../models/transcript.model.js';

import { transcriptionQueue } from '../queues/transcription.queue.js';
import fs from 'fs';
import path from 'path';
import pool from '../db/index.js';

export const getTranscript = async (req, res) => {
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

    console.log('Getting transcript for session_id:', session_id, 'customer_id:', customer_id);

    const transcript = await getTranscriptBySession(
      session_id,
      customer_id
    );

    console.log('Transcript found:', transcript ? 'Yes' : 'No');
    if (transcript) {
      console.log('Transcript session_id:', transcript.session_id);
      console.log('Transcript file_path:', transcript.file_path);
    }

    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // If transcript has a file_path, read the content from file
    if (transcript.file_path && !transcript.content) {
      try {
        const absolutePath = path.resolve(transcript.file_path);
        console.log('Reading transcript from file:', absolutePath);
        
        if (fs.existsSync(absolutePath)) {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          console.log('File content length:', fileContent.length);
          console.log('File content preview:', fileContent.substring(0, 100));
          transcript.file_content = fileContent;
          transcript.transcript_text = fileContent; // Add this for frontend compatibility
        } else {
          console.warn(`Transcript file not found: ${absolutePath}`);
        }
      } catch (fileError) {
        console.error(`Error reading transcript file: ${fileError.message}`);
      }
    }

    res.json(transcript);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
};

export const updateTranscript = async (req, res) => {
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

    const transcript = await updateTranscriptBySession(
      session_id,
      customer_id,
      content
    );

    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // If transcript has a file_path, also update the file
    if (transcript.file_path) {
      try {
        const absolutePath = path.resolve(transcript.file_path);
        const dir = path.dirname(absolutePath);
        
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write updated content to file
        fs.writeFileSync(absolutePath, content, 'utf8');
        console.log('Transcript file updated:', absolutePath);
      } catch (fileError) {
        console.error(`Error writing transcript file: ${fileError.message}`);
      }
    }

    res.json({
      message: 'Transcript updated successfully',
      transcript,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update transcript' });
  }
};


export const triggerTranscription = async (req, res) => {
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

    // 1. Verify session ownership
    const session = await getSessionById(session_id, customer_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // 2. Update status to 'transcribing'
    await updateSessionStatus(session_id, 'transcribing');

    // 3. Push to Redis Queue
    await transcriptionQueue.add('process-audio', {
      session_id,
      customer_id,
      audio_file_path: session.audio_file_path
    });

    res.status(202).json({ message: 'Transcription job queued' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
};