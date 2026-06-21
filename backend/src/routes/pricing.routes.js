import { Router } from 'express';
import { get, update } from '../controllers/pricing.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET /api/pricing
router.get('/', get);

// PUT /api/pricing
router.put('/', update);

export default router;
