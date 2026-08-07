import fs from 'fs/promises';
import { query } from '../config/db.js';
import { fixItemImages, fixImages } from '../helpers/imageHelper.js';
import { uploadToStorage } from '../helpers/storageHelper.js';

/**
 * GET /api/stores
 */
export const getAll = async (req, res, next) => {
  try {
    const { search = '', type = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ['s.is_active = true'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(s.name ILIKE $${idx} OR s.location ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (type) {
      conditions.push(`s.type = $${idx}`);
      params.push(type);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM stores s ${where}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT
         s.*,
         (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) AS product_count
       FROM stores s
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stores/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         s.*,
         (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) AS product_count
       FROM stores s
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Store not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores
 */
export const create = async (req, res, next) => {
  try {
    const { name, type, location, phone, rating, image_url, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required.' });
    }

    const { rows } = await query(
      `INSERT INTO stores (name, type, location, phone, rating, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, type || 'Restaurant', location || null, phone || null, rating || 5.0, image_url || null, description || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/stores/:id
 */
export const update = async (req, res, next) => {
  try {
    const { name, type, location, phone, rating, image_url, is_active, description } = req.body;

    const { rows } = await query(
      `UPDATE stores
       SET
         name = COALESCE($1, name),
         type = COALESCE($2, type),
         location = COALESCE($3, location),
         phone = COALESCE($4, phone),
         rating = COALESCE($5, rating),
         image_url = COALESCE($6, image_url),
         is_active = COALESCE($7, is_active),
         description = COALESCE($8, description),
         updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, type, location, phone, rating, image_url, is_active, description, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Store not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/stores/:id
 * Soft delete
 */
export const remove = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE stores SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Store not found.' });
    }

    res.json({ success: true, data: { message: 'Store removed.' } });
  } catch (err) {
    next(err);
  }
};

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /api/stores/:id/products
 */
export const getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;

    const conditions = ['store_id = $1'];
    const params = [req.params.id];
    let idx = 2;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR category ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (category) {
      conditions.push(`category = $${idx}`);
      params.push(category);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC`,
      params
    );

    res.json({ success: true, data: fixImages(rows) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:id/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, category, category_id, price, status, emoji, image, description } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'name and price are required.' });
    }

    const { rows } = await query(
      `INSERT INTO products (store_id, category_id, name, category, price, status, emoji, image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.params.id,
        category_id || null,
        name,
        category || null,
        parseFloat(price),
        status || 'Active',
        emoji || '📦',
        image || null,
        description || null,
      ]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/stores/:id/products/:pid
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { name, category, category_id, price, status, emoji, image, description } = req.body;

    const { rows } = await query(
      `UPDATE products
       SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         category_id = COALESCE($3, category_id),
         price = COALESCE($4, price),
         status = COALESCE($5, status),
         emoji = COALESCE($6, emoji),
         image = COALESCE($7, image),
         description = COALESCE($8, description),
         updated_at = NOW()
       WHERE id = $9 AND store_id = $10
       RETURNING *`,
      [name, category, category_id, price ? parseFloat(price) : null, status, emoji, image, description, req.params.pid, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:id/products/:pid/image
 */
export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded.' });
    }

    const BASE_URL = process.env.BASE_URL || 'https://go4-admin.onrender.com';
    const buffer = await fs.readFile(req.file.path);
    const publicUrl = await uploadToStorage(buffer, req.file.filename, req.file.mimetype);
    const imagePath = publicUrl || BASE_URL + '/uploads/' + req.file.filename;

    const { rows } = await query(
      `UPDATE products SET image = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *`,
      [imagePath, req.params.pid, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/stores/:id/products/:pid
 */
export const removeProduct = async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id',
      [req.params.pid, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: { message: 'Product deleted.' } });
  } catch (err) {
    next(err);
  }
};

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * GET /api/stores/:id/categories
 * Categories are global (shared across all restaurants)
 */
export const getCategories = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         c.*,
         COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:id/categories
 * Creates a global category (shared across all restaurants)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required.' });
    }

    const { rows } = await query(
      'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *',
      [name, icon || '📦']
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/stores/:id/categories/:cid
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    const { rows } = await query(
      `UPDATE categories
       SET
         name = COALESCE($1, name),
         icon = COALESCE($2, icon),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, icon, req.params.cid]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/stores/:id/categories/:cid
 */
export const removeCategory = async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [req.params.cid]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: { message: 'Category deleted.' } });
  } catch (err) {
    next(err);
  }
};
