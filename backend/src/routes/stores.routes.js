import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  getProducts,
  createProduct,
  updateProduct,
  removeProduct,
  getCategories,
  createCategory,
  removeCategory,
} from '../controllers/stores.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// All routes protected
router.use(auth);

// GET    /api/stores
router.get('/', getAll);

// GET    /api/stores/:id
router.get('/:id', getOne);

// POST   /api/stores
router.post('/', create);

// PUT    /api/stores/:id
router.put('/:id', update);

// DELETE /api/stores/:id
router.delete('/:id', remove);

// ─── Products ─────────────────────────────────────────────────────────────────

// GET    /api/stores/:id/products
router.get('/:id/products', getProducts);

// POST   /api/stores/:id/products
router.post('/:id/products', createProduct);

// PUT    /api/stores/:id/products/:pid
router.put('/:id/products/:pid', updateProduct);

// DELETE /api/stores/:id/products/:pid
router.delete('/:id/products/:pid', removeProduct);

// ─── Categories ───────────────────────────────────────────────────────────────

// GET    /api/stores/:id/categories
router.get('/:id/categories', getCategories);

// POST   /api/stores/:id/categories
router.post('/:id/categories', createCategory);

// DELETE /api/stores/:id/categories/:cid
router.delete('/:id/categories/:cid', removeCategory);

export default router;
