import { query } from '../../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM product_categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const getCategoryByID = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM product_categories WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const getProducts = async (req, res, next) => {
  try {
    const { category_id, search, page = 1, limit = 10 } = req.query;
    const conditions = ['p.available = true'];
    const params = [];
    let idx = 1;

    if (category_id) {
      conditions.push('p.category_id = $' + idx);
      params.push(category_id);
      idx++;
    }
    if (search) {
      conditions.push('(p.name ILIKE $' + idx + ' OR p.description ILIKE $' + idx + ')');
      params.push('%' + search + '%');
      idx++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const count = await query('SELECT COUNT(*) AS total FROM products p ' + where, params);
    const total = parseInt(count.rows[0].total);

    const { rows } = await query(
      'SELECT p.*, s.name AS store_name FROM products p LEFT JOIN stores s ON s.id = p.store_id ' + where + ' ORDER BY p.created_at DESC LIMIT $' + idx + ' OFFSET $' + (idx + 1),
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const getProductByID = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT p.*, s.name AS store_name FROM products p LEFT JOIN stores s ON s.id = p.store_id WHERE p.id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const getSpecialOffers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const count = await query("SELECT COUNT(*) AS total FROM products WHERE is_special_offer = true AND available = true");
    const total = parseInt(count.rows[0].total);

    const { rows } = await query(
      'SELECT p.*, s.name AS store_name FROM products p LEFT JOIN stores s ON s.id = p.store_id WHERE p.is_special_offer = true AND p.available = true ORDER BY p.created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discount_price, category_id, restaurant_id, is_special_offer } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ success: false, message: 'name and price are required' });

    if (restaurant_id) {
      const s = await query('SELECT id FROM stores WHERE id = $1', [restaurant_id]);
      if (!s.rows.length) return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const image = req.file ? '/uploads/' + req.file.filename : null;

    const { rows } = await query(
      'INSERT INTO products (store_id, category_id, name, description, price, discount_price, image, is_special_offer) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [restaurant_id || null, category_id || null, name, description || null, parseFloat(price), discount_price || null, image, is_special_offer || false]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const imagePath = '/uploads/' + req.file.filename;
    const { rows } = await query('UPDATE products SET image = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [imagePath, req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const toggleSpecialOffer = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE products SET is_special_offer = NOT is_special_offer, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
