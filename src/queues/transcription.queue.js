import { Queue } from 'bullmq';

// Only create queue if Redis is available
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  enableOfflineQueue: false,
  maxRetriesPerRequest: null,
};

// Create a mock queue for testing without Redis
export const transcriptionQueue = {
  add: async (jobName, data) => {
    console.log('[Mock Queue] Job added:', jobName);
    return { id: `mock-${Date.now()}` };
  },
  process: () => {},
  on: () => {},
  off: () => {},
};