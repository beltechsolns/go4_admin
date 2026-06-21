import { Router } from 'express';
import {
  getDeliveryTrends,
  getPeakHours,
  getRiderPerformance,
  getOrdersByCategory,
  getSummary,
} from '../controllers/reports.controller.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/trends', getDeliveryTrends);
router.get('/peak-hours', getPeakHours);
router.get('/rider-performance', getRiderPerformance);
router.get('/categories', getOrdersByCategory);
router.get('/summary', getSummary);

export default router;
