import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
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
  uploadProductImage,
  getCategories,
  createCategory,
  updateCategory,
  removeCategory,
} from '../controllers/stores.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

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

// POST   /api/stores/:id/products/:pid/image
router.post('/:id/products/:pid/image', upload.single('image'), uploadProductImage);

// ─── Categories ───────────────────────────────────────────────────────────────

// GET    /api/stores/:id/categories
router.get('/:id/categories', getCategories);

// POST   /api/stores/:id/categories
router.post('/:id/categories', createCategory);

// PUT    /api/stores/:id/categories/:cid
router.put('/:id/categories/:cid', updateCategory);

// DELETE /api/stores/:id/categories/:cid
router.delete('/:id/categories/:cid', removeCategory);

export default router;
