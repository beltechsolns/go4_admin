import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  toggleStatus,
} from '../controllers/customers.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET    /api/customers
router.get('/', getAll);

// GET    /api/customers/:id
router.get('/:id', getOne);

// POST   /api/customers
router.post('/', create);

// PUT    /api/customers/:id
router.put('/:id', update);

// DELETE /api/customers/:id
router.delete('/:id', remove);

// PATCH  /api/customers/:id/status
router.patch('/:id/status', toggleStatus);

export default router;
