import { query } from '../config/db.js';

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

export const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required.' });
    }

    const exists = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, error: 'A category with this name already exists.' });
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
      [name, icon, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: { message: 'Category deleted.' } });
  } catch (err) {
    next(err);
  }
};
