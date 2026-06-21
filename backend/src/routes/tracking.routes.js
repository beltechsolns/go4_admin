import { Router } from 'express';
import { getActiveRiders, getRiderLocation } from '../controllers/tracking.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET /api/tracking/riders
router.get('/riders', getActiveRiders);

// GET /api/tracking/riders/:id
router.get('/riders/:id', getRiderLocation);

export default router;
