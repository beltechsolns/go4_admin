import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  updateStatus,
  assignRider,
} from '../controllers/deliveries.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET    /api/deliveries
router.get('/', getAll);

// GET    /api/deliveries/:id
router.get('/:id', getOne);

// POST   /api/deliveries
router.post('/', create);

// PATCH  /api/deliveries/:id/status
router.patch('/:id/status', updateStatus);

// PATCH  /api/deliveries/:id/assign
router.patch('/:id/assign', assignRider);

export default router;
