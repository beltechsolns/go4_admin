import { Router } from 'express';
import { query } from '../config/db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/orders — Admin sees all orders
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, store_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`co.status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (store_id) {
      conditions.push(`co.store_id = $${idx}`);
      params.push(store_id);
      idx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(`SELECT COUNT(*) AS total FROM customer_orders co ${where}`, params);
    const total = parseInt(countResult.rows[0].total);

    const { rows } = await query(
      `SELECT co.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        s.name AS store_name, s.location AS store_location,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      LEFT JOIN stores s ON s.id = co.store_id
      ${where}
      ORDER BY co.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    for (const order of rows) {
      order.orderName = order.order_name;
    }

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [order] } = await query(
      `SELECT co.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        s.name AS store_name, s.location AS store_location
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      LEFT JOIN stores s ON s.id = co.store_id
      WHERE co.id = $1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = items;
    order.orderName = order.order_name;

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

export default router;
