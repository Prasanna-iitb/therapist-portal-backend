import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import clientsRoutes from './routes/clients.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import audioRoutes from './routes/audio.routes.js';
import transcriptRoutes from './routes/transcript.routes.js';
import notesRoutes from './routes/notes.routes.js';
import issuesRoutes from './routes/issues.routes.js';
import followupsRoutes from './routes/followups.routes.js';
import authRoutes from './routes/auth.routes.js';
// Workers don't work in serverless - comment out for Vercel deployment
// import './workers/transcription.worker.js';

dotenv.config();

const app = express();

// Enable CORS for frontend communication
app.use(cors({
  origin: [
    'https://therapist-portal-frontend.vercel.app',
    'https://mvpfrontend-roan.vercel.app',
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/clients', clientsRoutes);
app.use('/sessions', sessionsRoutes);
app.use(audioRoutes);
app.use(transcriptRoutes);
app.use(notesRoutes);
app.use(issuesRoutes);
app.use(followupsRoutes);

// Export app for Vercel serverless deployment
export default app;
