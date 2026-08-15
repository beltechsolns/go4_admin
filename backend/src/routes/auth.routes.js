import { Router } from 'express';
import {
	login,
	getMe,
	changePassword,
	forgotPassword,
	resetPassword,
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/me  (protected)
router.get('/me', auth, getMe);

// PUT /api/auth/change-password  (protected)
router.put('/change-password', auth, changePassword);

export default router;
