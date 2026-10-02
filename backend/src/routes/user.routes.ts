import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// User routes protected by JWT
router.get('/', authenticateToken, requireRole('admin'), getAllUsers);
router.get('/:id', authenticateToken, getUserById);

export default router;
