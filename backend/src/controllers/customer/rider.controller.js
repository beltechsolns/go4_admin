import { query } from '../../config/db.js';
import { resolveRiderId } from '../../helpers/riderHelper.js';
import { sendOrderStatusEmail } from '../../helpers/emailHelper.js';

async function notifyOrderStatus(order, status) {
  try {
    const [{ rows: user }, { rows: items }] = await Promise.all([
      query('SELECT name, email FROM users WHERE id = $1', [order.user_id]),
      query('SELECT product_name, quantity, price FROM order_items WHERE order_id = $1', [order.id]),
    ]);
    if (!user.length || !user[0].email) return;
    order.items = items;
    await sendOrderStatusEmail({ to: user[0].email, name: user[0].name, order, status });
  } catch (err) {
    console.error(`[OrderEmail] ${status} notification failed:`, err.message);
  }
}

export const getDashboard = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const [activeOrders, completedToday, totalDelivered, today, week, month, allTime] = await Promise.all([
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status IN ('accepted','picked_up','in_transit')", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '7 days'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
    ]);

    res.json({
      success: true,
      data: {
        active_orders: parseInt(activeOrders.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count),
        total_deliveries: parseInt(totalDelivered.rows[0].count),
        earnings: {
          today: parseFloat(today.rows[0].total),
          this_week: parseFloat(week.rows[0].total),
          this_month: parseFloat(month.rows[0].total),
          total: parseFloat(allTime.rows[0].total),
        },
      },
    });
  } catch (err) { next(err); }
};

export const getEarnings = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { period = 'week' } = req.query;
    let interval;
    if (period === 'week') interval = "INTERVAL '7 days'";
    else if (period === 'month') interval = "INTERVAL '30 days'";
    else if (period === 'today') interval = "INTERVAL '1 day'";
    else interval = "INTERVAL '7 days'";

    const { rows } = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total_price), 0) AS earnings FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - ${interval} GROUP BY DATE(created_at) ORDER BY date`,
      [riderId]
    );

    const total = rows.reduce((sum, r) => sum + parseFloat(r.earnings), 0);
    const orders = rows.reduce((sum, r) => sum + parseInt(r.orders), 0);

    res.json({ success: true, data: rows, total_earnings: total, total_orders: orders });
  } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Online', 'Offline', 'Busy'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query('UPDATE riders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, riderId]);
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
      `SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.created_at,
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
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      `SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.status, co.created_at,
        u.name AS user_name, u.phone AS user_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      WHERE co.rider_id = $1 AND co.status IN ('accepted','picked_up','in_transit')
      ORDER BY co.created_at DESC`,
      [riderId]
    );

    for (const order of rows) {
      order.orderName = order.order_name;
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const getCompletedOrders = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await query("SELECT COUNT(*) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]);
    const total = parseInt(count.rows[0].total);

    const { rows } = await query(
      `SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.pickup_address, co.notes, co.status, co.created_at,
        u.name AS user_name, u.phone AS user_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
      FROM customer_orders co
      LEFT JOIN users u ON u.id = co.user_id
      WHERE co.rider_id = $1 AND co.status = $2
      ORDER BY co.created_at DESC LIMIT $3 OFFSET $4`,
      [riderId, 'delivered', parseInt(limit), offset]
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
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "UPDATE customer_orders SET status = 'accepted', rider_id = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending' RETURNING *",
      [riderId, req.params.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not available' });
    rows[0].orderName = rows[0].order_name;
    notifyOrderStatus(rows[0], 'accepted');
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const startDelivery = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "UPDATE customer_orders SET status = 'in_transit', updated_at = NOW() WHERE id = $1 AND rider_id = $2 RETURNING *",
      [req.params.id, riderId]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const completeDelivery = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "UPDATE customer_orders SET status = 'delivered', updated_at = NOW() WHERE id = $1 AND rider_id = $2 RETURNING *",
      [req.params.id, riderId]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    notifyOrderStatus(rows[0], 'delivered');
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    let riderId = await resolveRiderId(req.user.id);

    if (!riderId) {
      const { rows: user } = await query('SELECT name, phone FROM users WHERE id = $1', [req.user.id]);
      if (!user.length) return res.status(404).json({ success: false, message: 'User not found' });
      const { rows: created } = await query(
        'INSERT INTO riders (full_name, phone, user_id, current_lat, current_lng, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [user[0].name, user[0].phone, req.user.id, latitude, longitude, 'Online']
      );
      return res.status(201).json({ success: true, data: created[0] });
    }

    const { rows } = await query(
      'UPDATE riders SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [latitude, longitude, riderId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
