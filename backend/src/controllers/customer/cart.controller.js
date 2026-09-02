import { query } from '../../config/db.js';

export const getCart = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT ci.*, p.name AS product_name, p.price, p.image, p.emoji, p.store_id FROM cart_items ci LEFT JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1 ORDER BY ci.created_at',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

    const existing = await query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existing.rows.length) {
      const { rows } = await query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [quantity, existing.rows[0].id]
      );
      return res.json({ success: true, data: rows[0] });
    }

    const { rows } = await query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) return res.status(400).json({ success: false, message: 'quantity required' });

    const { rows } = await query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Cart item not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rowCount) return res.status(404).json({ success: false, message: 'Cart item not found' });

    const { rows } = await query(
      'SELECT ci.*, p.name AS product_name, p.price, p.image, p.emoji, p.store_id FROM cart_items ci LEFT JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1 ORDER BY ci.created_at',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const clearCart = async (req, res, next) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, data: [], message: 'Cart cleared' });
  } catch (err) { next(err); }
};
