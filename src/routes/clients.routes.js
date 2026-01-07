import express from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/clients.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all client routes with authentication
router.post('/', authenticateToken, createClient);
router.get('/', authenticateToken, getClients);
router.get('/:id', authenticateToken, getClient);
router.put('/:id', authenticateToken, updateClient);
router.delete('/:id', authenticateToken, deleteClient);

export default router;
