import { query } from '../../config/db.js';

export const getFavorites = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT f.*, p.name AS product_name, p.price, p.image, p.emoji, p.store_id FROM favorites f LEFT JOIN products p ON p.id = f.product_id WHERE f.user_id = $1 ORDER BY f.created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const addFavorite = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

    const { rows } = await query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *',
      [req.user.id, product_id]
    );
    res.status(201).json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
};

export const addFavoriteByProductId = async (req, res, next) => {
  try {
    const { rows } = await query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *',
      [req.user.id, req.params.product_id]
    );
    res.status(201).json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rowCount) return res.status(404).json({ success: false, message: 'Favorite not found' });
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) { next(err); }
};
