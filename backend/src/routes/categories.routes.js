import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  removeCategory,
} from '../controllers/categories.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

// GET    /api/categories
router.get('/', getCategories);

// POST   /api/categories
router.post('/', createCategory);

// PUT    /api/categories/:id
router.put('/:id', updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', removeCategory);

export default router;
