import { Worker } from 'bullmq';
import { createTranscript } from '../models/transcript.model.js';
import { updateSessionStatus } from '../models/sessions.model.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Transcribe audio using OpenAI Whisper Tiny model (local)
const transcribeAudio = async (audioFilePath) => {
  // Verify file exists
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  const fileStat = fs.statSync(audioFilePath);
  console.log(`Processing audio file: ${path.basename(audioFilePath)} (${fileStat.size} bytes)`);

  try {
    console.log(`Starting Whisper Tiny model transcription...`);
    
    // Get the Python script path
    const scriptPath = path.join(process.cwd(), 'src', 'workers', 'transcribe.py');
    
    const command = `python "${scriptPath}" "${audioFilePath}" tiny en`;
    
    console.log(`Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
    
    if (stderr) {
      console.log(`Whisper process info:`, stderr);
    }
    
    // Parse JSON output from stdout
    const transcriptionData = JSON.parse(stdout);
    
    console.log(`Transcription completed successfully`);

    return {
      text: transcriptionData.text.trim(),
      language: transcriptionData.language || 'en',
      duration: transcriptionData.duration || 0,
      confidence: 0.90 // Tiny model approximate confidence
    };
  } catch (error) {
    console.error(`Whisper transcription failed:`, error.message);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

const worker = new Worker('transcription-tasks', async (job) => {
  const { session_id, audio_file_path } = job.data;
  
  try {
    console.log(`[Transcription Worker] Starting job ${job.id} for session: ${session_id}`);
    console.log(`[Transcription Worker] Audio file: ${audio_file_path}`);

    // Call STT service
    const transcriptionResult = await transcribeAudio(audio_file_path);
    console.log(`[Transcription Worker] Transcription completed for session ${session_id}`);

    // Save transcript as a text file in the session folder
    const audioDir = path.dirname(audio_file_path);
    const transcriptFilePath = path.join(audioDir, 'transcript.txt');
    
    const transcriptContent = `Session ID: ${session_id}
Language: ${transcriptionResult.language}
Confidence Score: ${transcriptionResult.confidence}
Generated: ${new Date().toISOString()}

=== TRANSCRIPT ===

${transcriptionResult.text}`;

    fs.writeFileSync(transcriptFilePath, transcriptContent, 'utf8');
    console.log(`[Transcription Worker] Transcript file saved: ${transcriptFilePath}`);

    // Save transcript metadata to database (file path instead of content)
    await createTranscript({
      session_id,
      file_path: transcriptFilePath,
      language: transcriptionResult.language,
      confidence_score: transcriptionResult.confidence
    });
    console.log(`[Transcription Worker] Transcript metadata saved to database`);

    // Update session status to completed
    await updateSessionStatus(session_id, 'completed');
    console.log(`[Transcription Worker] Session ${session_id} marked as completed`);

    return { success: true, session_id };

  } catch (error) {
    console.error(`[Transcription Worker] Job ${job.id} failed:`, error);
    
    // Try to update session status to pending on failure
    try {
      await updateSessionStatus(session_id, 'pending');
    } catch (statusError) {
      console.error(`[Transcription Worker] Failed to update session status:`, statusError);
    }
    
    throw error; 
  }
}, { 
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000 // per 60 seconds
  }
});

console.log('Transcription worker started...');