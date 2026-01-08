import fs from 'fs';
import path from 'path';
import { uploadToVercelBlob } from '../utils/vercelBlob.js';
import { v4 as uuidv4 } from 'uuid';
import { transcriptionQueue } from '../queues/transcription.queue.js';
import pool from '../db/index.js';

import {
  attachAudioToSession,
  getSessionAudioPath,
  updateSessionStatus,
  deleteSessionAudio,
} from '../models/audio.model.js';
import { createSession } from '../models/sessions.model.js';
import { createTranscript } from '../models/transcript.model.js';

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

    // Upload to Vercel Blob Storage
    const ext = path.extname(req.file.originalname) || '.webm';
    const blobName = `audio/${sessionId}_${Date.now()}${ext}`;
    let blobUrl = null;
    try {
      // Use buffer for memory storage (Vercel) or path for disk storage
      const fileSource = req.file.buffer || req.file.path;
      blobUrl = await uploadToVercelBlob(fileSource, blobName);
      console.log(`Audio uploaded to Vercel Blob: ${blobUrl}`);
    } catch (uploadErr) {
      console.error('Failed to upload to Vercel Blob:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload audio to cloud storage' });
    }

    // Prepare audio metadata
    const audioData = {
      audioUrl: blobUrl,
      fileSize: req.file.size,
      duration: parseInt(req.body.duration) || 0,
      format: ext.substring(1), // Remove leading dot
      mimeType: req.file.mimetype || 'audio/webm'
    };

    // Save blob URL and metadata in DB
    const updatedSession = await attachAudioToSession(
      sessionId,
      customerId,
      blobUrl,
      audioData
    );
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Clean up local file (only for disk storage)
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      message: 'Audio uploaded successfully',
      audio_url: blobUrl,
      session_id: sessionId,
      audio_duration: audioData.duration,
      audio_size: audioData.fileSize,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
};

/* GET /sessions/:id/audio - Returns audio metadata including blob URL */
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

    if (!session || !session.audio_blob_url) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    // Return the blob URL and metadata
    res.json({
      audio_url: session.audio_blob_url,
      audio_duration: session.audio_duration,
      audio_file_size: session.audio_file_size,
      audio_format: session.audio_format,
      audio_mime_type: session.audio_mime_type,
      audio_uploaded_at: session.audio_uploaded_at
    });
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

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Mark as transcribing
    await updateSessionStatus(sessionId, 'transcribing');

    // For MVP/Vercel: Create immediate placeholder transcript
    // In production, this would queue an async job with a transcription service
    try {
      const placeholderTranscript = `[Transcription in progress...]

Audio Duration: ${session.audio_duration || 'N/A'} seconds
Format: ${session.audio_format || 'webm'}
Uploaded: ${session.audio_uploaded_at || 'N/A'}

Note: Full transcription will be available when processing completes.`;

      await createTranscript({
        session_id: sessionId,
        content: placeholderTranscript,
        language: 'en',
        confidence_score: 0
      });

      // Update status to completed
      await updateSessionStatus(sessionId, 'completed');

      console.log(`[Transcription] Placeholder transcript created for session: ${sessionId}`);

      res.json({
        message: 'Transcription processing started',
        status: 'completed',
        job_id: `placeholder-${sessionId}`,
      });
    } catch (transcriptErr) {
      console.error(`[Transcription] Failed to create transcript:`, transcriptErr);
      await updateSessionStatus(sessionId, 'pending');
      throw transcriptErr;
    }
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
  let localFilePath = null;
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

    localFilePath = req.file.path;

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
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Upload to Vercel Blob Storage
    const ext = path.extname(req.file.originalname) || '.webm';
    const blobName = `audio/${sessionId}_${Date.now()}${ext}`;
    let blobUrl = null;

    try {
      // Use buffer for memory storage (Vercel) or path for disk storage
      const fileSource = req.file.buffer || localFilePath;
      blobUrl = await uploadToVercelBlob(fileSource, blobName);
      console.log(`Audio uploaded to Vercel Blob: ${blobUrl}`);
    } catch (uploadErr) {
      console.error('Failed to upload to Vercel Blob:', uploadErr);
      // Clean up local file
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      throw new Error(`Failed to upload audio: ${uploadErr.message}`);
    }

    // Prepare audio metadata
    const audioData = {
      audioUrl: blobUrl,
      fileSize: req.file.size,
      duration: parseInt(duration) || 0,
      format: ext.substring(1), // Remove leading dot
      mimeType: req.file.mimetype || 'audio/webm'
    };

    // Attach audio metadata to session
    try {
      await attachAudioToSession(
        sessionId,
        customerId,
        blobUrl,
        audioData
      );
      console.log('Session updated with audio metadata');
    } catch (attachError) {
      console.error('Failed to update session:', attachError);
      // Clean up local file
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      throw new Error(`Failed to update session: ${attachError.message}`);
    }

    // Clean up local file
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.log('Session created with audio successfully');

    res.status(201).json({
      message: 'Session created successfully',
      session_id: sessionId,
      audio_url: blobUrl,
      audio_duration: audioData.duration,
      audio_size: audioData.fileSize,
    });
  } catch (err) {
    console.error('Error in createSessionWithAudio:', err);
    // Clean up on error
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    res.status(500).json({ error: err.message || 'Failed to create session with audio' });
  }
};
