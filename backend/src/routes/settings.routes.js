import { Router } from 'express';
import { get, update } from '../controllers/settings.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET /api/settings
router.get('/', get);

// PUT /api/settings
router.put('/', update);

export default router;
