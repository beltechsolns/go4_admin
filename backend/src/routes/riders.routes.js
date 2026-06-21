import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  toggleStatus,
  updateLocation,
} from '../controllers/riders.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET    /api/riders
router.get('/', getAll);

// GET    /api/riders/:id
router.get('/:id', getOne);

// POST   /api/riders
router.post('/', create);

// PUT    /api/riders/:id
router.put('/:id', update);

// DELETE /api/riders/:id
router.delete('/:id', remove);

// PATCH  /api/riders/:id/status
router.patch('/:id/status', toggleStatus);

// PATCH  /api/riders/:id/location
router.patch('/:id/location', updateLocation);

export default router;
