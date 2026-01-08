import app from './src/server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Backend server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
