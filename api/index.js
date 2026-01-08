import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from '../src/config/passport.js';
import clientsRoutes from '../src/routes/clients.routes.js';
import sessionsRoutes from '../src/routes/sessions.routes.js';
import audioRoutes from '../src/routes/audio.routes.js';
import transcriptRoutes from '../src/routes/transcript.routes.js';
import notesRoutes from '../src/routes/notes.routes.js';
import issuesRoutes from '../src/routes/issues.routes.js';
import followupsRoutes from '../src/routes/followups.routes.js';
import authRoutes from '../src/routes/auth.routes.js';

dotenv.config();

const app = express();

// Trust proxy - required for Vercel
app.set('trust proxy', true);

// CORS configuration
const corsOptions = {
  origin: [
    'https://therapist-portal-frontend.vercel.app',
    'https://mvpfrontend-roan.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Enable CORS with middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Therapist Portal API' });
});

app.use('/auth', authRoutes);
app.use('/clients', clientsRoutes);
app.use('/sessions', sessionsRoutes);
app.use(audioRoutes);
app.use(transcriptRoutes);
app.use(notesRoutes);
app.use(issuesRoutes);
app.use(followupsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Export the Express app as a Vercel serverless function
export default app;
