import { Router } from 'express';
import {
  getStats,
  getActivity,
  getChartData,
  getQuickStats,
} from '../controllers/dashboard.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All dashboard routes are protected
router.use(auth);

// GET /api/dashboard/stats
router.get('/stats', getStats);

// GET /api/dashboard/activity
router.get('/activity', getActivity);

// GET /api/dashboard/chart
router.get('/chart', getChartData);

// GET /api/dashboard/quick-stats
router.get('/quick-stats', getQuickStats);

export default router;
