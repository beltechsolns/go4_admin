import { query } from '../config/db.js';

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
    const { name, type, location, phone, rating, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required.' });
    }

    const { rows } = await query(
      `INSERT INTO stores (name, type, location, phone, rating, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, type || 'Restaurant', location || null, phone || null, rating || 5.0, image_url || null]
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
    const { name, type, location, phone, rating, image_url, is_active } = req.body;

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
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, type, location, phone, rating, image_url, is_active, req.params.id]
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

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:id/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, category, category_id, price, status, emoji } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'name and price are required.' });
    }

    const { rows } = await query(
      `INSERT INTO products (store_id, category_id, name, category, price, status, emoji)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.params.id,
        category_id || null,
        name,
        category || null,
        parseFloat(price),
        status || 'Active',
        emoji || '📦',
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
    const { name, category, category_id, price, status, emoji } = req.body;

    const { rows } = await query(
      `UPDATE products
       SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         category_id = COALESCE($3, category_id),
         price = COALESCE($4, price),
         status = COALESCE($5, status),
         emoji = COALESCE($6, emoji),
         updated_at = NOW()
       WHERE id = $7 AND store_id = $8
       RETURNING *`,
      [name, category, category_id, price ? parseFloat(price) : null, status, emoji, req.params.pid, req.params.id]
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
 */
export const getCategories = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         c.*,
         COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.store_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:id/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required.' });
    }

    const { rows } = await query(
      'INSERT INTO categories (store_id, name, icon) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, name, icon || '📦']
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
       WHERE id = $3 AND store_id = $4
       RETURNING *`,
      [name, icon, req.params.cid, req.params.id]
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
      'DELETE FROM categories WHERE id = $1 AND store_id = $2 RETURNING id',
      [req.params.cid, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: { message: 'Category deleted.' } });
  } catch (err) {
    next(err);
  }
};
