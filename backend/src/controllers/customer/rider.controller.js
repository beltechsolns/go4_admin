import { query } from '../../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const [activeOrders, completedToday, earnings] = await Promise.all([
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status IN ('accepted','picked_up','in_transit')", [req.user.id]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [req.user.id]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [req.user.id]),
    ]);

    res.json({
      success: true,
      data: {
        active_orders: parseInt(activeOrders.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count),
        total_earnings: parseFloat(earnings.rows[0].total),
      },
    });
  } catch (err) { next(err); }
};

export const getEarnings = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    let interval;
    if (period === 'week') interval = "INTERVAL '7 days'";
    else if (period === 'month') interval = "INTERVAL '30 days'";
    else interval = "INTERVAL '7 days'";

    const { rows } = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total_price), 0) AS earnings FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - ${interval} GROUP BY DATE(created_at) ORDER BY date`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Online', 'Offline', 'Busy'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const { rows } = await query('UPDATE riders SET status = $1, updated_at = NOW() WHERE id = (SELECT id FROM riders WHERE phone = (SELECT phone FROM users WHERE id = $2)) RETURNING *', [status, req.user.id]);

    if (!rows.length) {
      const { rows: user } = await query('SELECT phone FROM users WHERE id = $1', [req.user.id]);
      const { rows: existing } = await query('SELECT id FROM riders WHERE phone = $1', [user[0].phone]);
      if (existing.length) {
        const { rows: updated } = await query('UPDATE riders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, existing[0].id]);
        return res.json({ success: true, data: updated[0] });
      }
      return res.status(404).json({ success: false, message: 'Rider profile not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const getAvailableOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await query("SELECT COUNT(*) AS total FROM customer_orders WHERE status = 'pending'");
    const total = parseInt(count.rows[0].total);

    const { rows } = await query(
      `SELECT co.id, co.order_name, co.user_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.created_at,
        u.name AS user_name, u.phone AS user_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      WHERE co.status = $1
      ORDER BY co.created_at DESC LIMIT $2 OFFSET $3`,
      ['pending', parseInt(limit), offset]
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
};

export const getActiveOrders = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT co.id, co.order_name, co.user_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.status, co.created_at,
        u.name AS user_name, u.phone AS user_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      WHERE co.rider_id = $1 AND co.status IN ('accepted','picked_up','in_transit')
      ORDER BY co.created_at DESC`,
      [req.user.id]
    );

    for (const order of rows) {
      order.orderName = order.order_name;
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const getCompletedOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await query("SELECT COUNT(*) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [req.user.id]);
    const total = parseInt(count.rows[0].total);

    const { rows } = await query(
      `SELECT co.id, co.order_name, co.user_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.status, co.created_at,
        u.name AS user_name, u.phone AS user_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      WHERE co.rider_id = $1 AND co.status = $2
      ORDER BY co.created_at DESC LIMIT $3 OFFSET $4`,
      [req.user.id, 'delivered', parseInt(limit), offset]
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
};

export const getRiderOrderById = async (req, res, next) => {
  try {
    const { rows: [order] } = await query('SELECT * FROM customer_orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = items;
    order.orderName = order.order_name;
    order.items_count = items.length;

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const acceptOrder = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE customer_orders SET status = 'accepted', rider_id = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending' RETURNING *",
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not available' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const startDelivery = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE customer_orders SET status = 'in_transit', updated_at = NOW() WHERE id = $1 AND rider_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const completeDelivery = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE customer_orders SET status = 'delivered', updated_at = NOW() WHERE id = $1 AND rider_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const { rows } = await query(
      'UPDATE riders SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = (SELECT id FROM riders WHERE phone = (SELECT phone FROM users WHERE id = $3)) RETURNING *',
      [latitude, longitude, req.user.id]
    );
    if (!rows.length) {
      const { rows: user } = await query('SELECT phone, name FROM users WHERE id = $1', [req.user.id]);
      const { rows: existing } = await query('SELECT id FROM riders WHERE phone = $1', [user[0].phone]);
      if (existing.length) {
        const { rows: updated } = await query('UPDATE riders SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [latitude, longitude, existing[0].id]);
        return res.json({ success: true, data: updated[0] });
      }
      const { rows: created } = await query('INSERT INTO riders (full_name, phone, current_lat, current_lng, status) VALUES ($1,$2,$3,$4,$5) RETURNING *', [user[0].name, user[0].phone, latitude, longitude, 'Online']);
      return res.status(201).json({ success: true, data: created[0] });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
