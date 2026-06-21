import { Router } from 'express';
import { login, getMe, changePassword } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (protected)
router.get('/me', auth, getMe);

// PUT /api/auth/change-password  (protected)
router.put('/change-password', auth, changePassword);

export default router;
