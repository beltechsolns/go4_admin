import { query } from '../../config/db.js';
import { resolveRiderId } from '../../helpers/riderHelper.js';
import { sendOrderStatusEmail } from '../../helpers/emailHelper.js';
import { notifyUser } from '../../helpers/notifyHelper.js';
import { haversineKm } from '../../helpers/geoHelper.js';

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

    const [statusResult, activeOrders, completedToday, totalDelivered, today, week, month, allTime, availableCount, currentOrders, availableOrders] = await Promise.all([
      query("SELECT status FROM riders WHERE id = $1", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status IN ('accepted','picked_up','in_transit','arrived')", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '7 days'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
      query(`SELECT COUNT(DISTINCT COALESCE(delivery_group_id, CAST(id AS TEXT))) AS count FROM customer_orders WHERE status = 'pending'`, []),
      query(
        `SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.status, co.created_at,
          u.name AS user_name, u.phone AS user_phone,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count
        FROM customer_orders co
        LEFT JOIN users u ON u.id = co.user_id
        WHERE co.rider_id = $1 AND co.status IN ('accepted','picked_up','in_transit','arrived')
        ORDER BY co.created_at DESC`, [riderId]
      ),
      // Available orders (not assigned to any rider)
      query(
        `WITH grouped AS (
          SELECT delivery_group_id, COUNT(*) AS order_count, SUM(total_price) AS total_price,
            MAX(delivery_address) AS delivery_address, MAX(delivery_lat) AS delivery_lat, MAX(delivery_lng) AS delivery_lng,
            MAX(user_id) AS user_id, MIN(created_at) AS created_at,
            array_agg(DISTINCT store_id) AS store_ids
          FROM customer_orders
          WHERE status = 'pending' AND delivery_group_id IS NOT NULL
          GROUP BY delivery_group_id
        ),
        singles AS (
          SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.delivery_lat, co.delivery_lng,
            co.user_id, co.created_at, co.store_id, 1 AS order_count, ARRAY[co.store_id] AS store_ids
          FROM customer_orders co
          WHERE co.status = 'pending' AND co.delivery_group_id IS NULL
        )
        SELECT * FROM (
          SELECT g.delivery_group_id::TEXT AS id, 'Group #' || g.delivery_group_id AS order_name, g.total_price,
            g.delivery_address, g.delivery_lat, g.delivery_lng, g.user_id, g.created_at,
            g.store_ids, g.order_count, 'grouped' AS type
          FROM grouped g
          UNION ALL
          SELECT s.id::TEXT, s.order_name, s.total_price, s.delivery_address, s.delivery_lat, s.delivery_lng,
            s.user_id, s.created_at, s.store_ids, s.order_count, 'single' AS type
          FROM singles s
        ) combined
        ORDER BY created_at DESC LIMIT 10`, []
      ),
    ]);

    // Enrich current orders with store info
    for (const order of currentOrders.rows) {
      order.orderName = order.order_name;
      const { rows: storeRows } = await query(
        'SELECT name, latitude, longitude FROM stores WHERE id = (SELECT store_id FROM customer_orders WHERE id = $1)',
        [order.id]
      );
      if (storeRows.length) {
        order.store_name = storeRows[0].name;
        order.store_lat = storeRows[0].latitude;
        order.store_lng = storeRows[0].longitude;
      }
    }

    // Enrich available orders with store info
    for (const order of availableOrders.rows) {
      order.orderName = order.order_name;
      const { rows: stores } = await query(
        'SELECT id, name, location, latitude, longitude, phone FROM stores WHERE id = ANY($1)',
        [order.store_ids]
      );
      order.stores = stores;
      if (order.user_id) {
        const { rows: users } = await query('SELECT name, phone FROM users WHERE id = $1', [order.user_id]);
        if (users.length) {
          order.user_name = users[0].name;
          order.user_phone = users[0].phone;
        }
      }
    }

    res.json({
      success: true,
      data: {
        status: statusResult.rows[0]?.status || 'Offline',
        active_orders: parseInt(activeOrders.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count),
        total_deliveries: parseInt(totalDelivered.rows[0].count),
        available_orders_count: parseInt(availableCount.rows[0].count),
        earnings: {
          today: parseFloat(today.rows[0].total),
          this_week: parseFloat(week.rows[0].total),
          this_month: parseFloat(month.rows[0].total),
          total: parseFloat(allTime.rows[0].total),
        },
        current_orders: currentOrders.rows,
        available_orders: availableOrders.rows,
      },
    });
  } catch (err) { next(err); }
};

export const getEarnings = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    // Get all-time stats
    const [totalResult, todayResult, pendingResult, completedResult, totalOrdersResult] = await Promise.all([
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'delivered' AND created_at >= CURRENT_DATE", [riderId]),
      query("SELECT COALESCE(SUM(total_price), 0) AS total FROM customer_orders WHERE rider_id = $1 AND status = 'arrived'", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1 AND status = 'delivered'", [riderId]),
      query("SELECT COUNT(*) AS count FROM customer_orders WHERE rider_id = $1", [riderId]),
    ]);

    // Get daily entries for the period
    const { period = 'month' } = req.query;
    let interval;
    if (period === 'week') interval = "INTERVAL '7 days'";
    else if (period === 'month') interval = "INTERVAL '30 days'";
    else if (period === 'today') interval = "INTERVAL '1 day'";
    else interval = "INTERVAL '30 days'";

    const { rows } = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total_price), 0) AS earnings
       FROM customer_orders
       WHERE rider_id = $1 AND status = 'delivered' AND created_at >= NOW() - ${interval}
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [riderId]
    );

    res.json({
      success: true,
      data: {
        total_earnings: parseFloat(totalResult.rows[0].total),
        today_earnings: parseFloat(todayResult.rows[0].total),
        pending_earnings: parseFloat(pendingResult.rows[0].total),
        completed_orders: parseInt(completedResult.rows[0].count),
        total_orders: parseInt(totalOrdersResult.rows[0].count),
        entries: rows.map(r => ({
          date: r.date,
          orders: parseInt(r.orders),
          earnings: parseFloat(r.earnings),
        })),
      },
    });
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

    // Get grouped deliveries (one row per group) + single orders
    const { rows } = await query(
      `WITH grouped AS (
        SELECT delivery_group_id, COUNT(*) AS order_count, SUM(total_price) AS total_price,
          MAX(delivery_address) AS delivery_address, MAX(delivery_lat) AS delivery_lat, MAX(delivery_lng) AS delivery_lng,
          MAX(user_id) AS user_id, MAX(notes) AS notes, MIN(created_at) AS created_at,
          array_agg(DISTINCT store_id) AS store_ids
        FROM customer_orders
        WHERE status = 'pending' AND delivery_group_id IS NOT NULL
        GROUP BY delivery_group_id
      ),
      singles AS (
        SELECT co.id, co.order_name, co.total_price, co.delivery_address, co.delivery_lat, co.delivery_lng,
          co.user_id, co.notes, co.created_at, co.store_id, 1 AS order_count, ARRAY[co.store_id] AS store_ids
        FROM customer_orders co
        WHERE co.status = 'pending' AND co.delivery_group_id IS NULL
      )
      SELECT * FROM (
        SELECT g.delivery_group_id::TEXT AS id, 'Group #' || g.delivery_group_id AS order_name, g.total_price,
          g.delivery_address, g.delivery_lat, g.delivery_lng, g.user_id, g.notes, g.created_at,
          g.store_ids, g.order_count, 'grouped' AS type
        FROM grouped g
        UNION ALL
        SELECT s.id::TEXT, s.order_name, s.total_price, s.delivery_address, s.delivery_lat, s.delivery_lng,
          s.user_id, s.notes, s.created_at, s.store_ids, s.order_count, 'single' AS type
        FROM singles s
      ) combined
      ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const totalResult = await query(
      `SELECT COUNT(DISTINCT delivery_group_id) + COUNT(*) FILTER (WHERE delivery_group_id IS NULL) AS total
       FROM customer_orders WHERE status = 'pending'`
    );
    const total = parseInt(totalResult.rows[0].total);

    // Enrich with store and user info
    for (const order of rows) {
      order.orderName = order.order_name;

      // Get store details
      const { rows: stores } = await query(
        'SELECT id, name, location, latitude, longitude, phone FROM stores WHERE id = ANY($1)',
        [order.store_ids]
      );
      order.stores = stores;

      // Get user details
      if (order.user_id) {
        const { rows: users } = await query('SELECT name, phone FROM users WHERE id = $1', [order.user_id]);
        if (users.length) {
          order.user_name = users[0].name;
          order.user_phone = users[0].phone;
        }
      }

      // Get items count
      if (order.type === 'grouped') {
        const { rows: itemCnt } = await query(
          `SELECT COUNT(*) AS items_count FROM order_items oi
           JOIN customer_orders co ON co.id = oi.order_id
           WHERE co.delivery_group_id = $1`,
          [order.id]
        );
        order.items_count = parseInt(itemCnt[0].items_count);
      } else {
        const { rows: itemCnt } = await query(
          'SELECT COUNT(*) AS items_count FROM order_items WHERE order_id = $1',
          [order.id]
        );
        order.items_count = parseInt(itemCnt[0].items_count);
      }
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
      WHERE co.rider_id = $1 AND co.status IN ('accepted','picked_up','in_transit','arrived')
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
    const { rows: [order] } = await query(
      `SELECT co.*, s.name AS store_name, s.location AS store_location, s.latitude AS store_lat, s.longitude AS store_lng, s.phone AS store_phone
      FROM customer_orders co
      LEFT JOIN stores s ON s.id = co.store_id
      WHERE co.id = $1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = items;
    order.orderName = order.order_name;
    order.items_count = items.length;

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const rejectOrder = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "SELECT * FROM customer_orders WHERE id = $1 AND status = 'pending'",
      [req.params.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not available' });

    // Rider simply doesn't accept - order stays pending for other riders
    res.json({ success: true, message: 'Order rejected', data: { id: rows[0].id, status: 'pending' } });
  } catch (err) { next(err); }
};

export const acceptOrder = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "SELECT * FROM customer_orders WHERE id = $1 AND status = 'pending'",
      [req.params.id]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not available' });

    const order = rows[0];
    let acceptedOrders;

    if (order.delivery_group_id) {
      // Accept ALL orders in the delivery group
      const { rows: group } = await query(
        "UPDATE customer_orders SET status = 'accepted', rider_id = $1, updated_at = NOW() WHERE delivery_group_id = $2 AND status = 'pending' RETURNING *",
        [riderId, order.delivery_group_id]
      );
      acceptedOrders = group;
    } else {
      // Single order - accept just this one
      const { rows: single } = await query(
        "UPDATE customer_orders SET status = 'accepted', rider_id = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending' RETURNING *",
        [riderId, req.params.id]
      );
      acceptedOrders = single;
    }

    if (!acceptedOrders.length) return res.status(400).json({ success: false, message: 'Order not available' });

    // Build pickup route from store locations
    const storeIds = [...new Set(acceptedOrders.map(o => o.store_id))];
    const { rows: stores } = await query(
      'SELECT id, name, location, latitude, longitude FROM stores WHERE id = ANY($1)',
      [storeIds]
    );

    const pickupStops = acceptedOrders.map(o => {
      const store = stores.find(s => s.id === o.store_id);
      return {
        order_id: o.id,
        order_name: o.order_name,
        store_id: o.store_id,
        store_name: store?.name || 'Restaurant',
        store_location: store?.location || o.pickup_address,
        store_lat: store?.latitude,
        store_lng: store?.longitude,
      };
    });

    // Sort pickup stops by proximity (nearest first)
    const firstStore = stores.find(s => s.id === storeIds[0]);
    if (firstStore?.latitude && firstStore?.longitude) {
      pickupStops.sort((a, b) => {
        if (!a.store_lat || !b.store_lat) return 0;
        const distA = haversineKm(parseFloat(firstStore.latitude), parseFloat(firstStore.longitude), parseFloat(a.store_lat), parseFloat(a.store_lng));
        const distB = haversineKm(parseFloat(firstStore.latitude), parseFloat(firstStore.longitude), parseFloat(b.store_lat), parseFloat(b.store_lng));
        return (distA || 0) - (distB || 0);
      });
    }

    // Notify customer
    const firstOrder = acceptedOrders[0];
    if (firstOrder.user_id) {
      const { rows: rider } = await query('SELECT full_name FROM riders WHERE id = $1', [riderId]);
      const countText = acceptedOrders.length > 1
        ? `all ${acceptedOrders.length} orders from your delivery`
        : `your order "${firstOrder.order_name}"`;
      notifyUser(firstOrder.user_id, {
        title: 'Rider Accepted',
        message: `${rider[0]?.full_name || 'A rider'} has accepted ${countText}.`,
        data: { type: 'order_status', order_id: firstOrder.id, status: 'accepted' },
      });
    }

    res.json({
      success: true,
      data: {
        orders: acceptedOrders.map(o => ({ id: o.id, order_name: o.order_name, store_id: o.store_id, status: o.status })),
        pickup_stops: pickupStops,
        delivery_address: firstOrder.delivery_address,
        delivery_lat: firstOrder.delivery_lat,
        delivery_lng: firstOrder.delivery_lng,
        is_grouped: !!order.delivery_group_id,
      },
    });
  } catch (err) { next(err); }
};

export const startDelivery = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "SELECT * FROM customer_orders WHERE id = $1 AND rider_id = $2",
      [req.params.id, riderId]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });

    const order = rows[0];

    if (order.delivery_group_id) {
      // Start ALL orders in the group
      await query(
        "UPDATE customer_orders SET status = 'in_transit', updated_at = NOW() WHERE delivery_group_id = $1 AND rider_id = $2 AND status = 'picked_up'",
        [order.delivery_group_id, riderId]
      );
    } else {
      await query(
        "UPDATE customer_orders SET status = 'in_transit', updated_at = NOW() WHERE id = $1 AND rider_id = $2 AND status = 'picked_up'",
        [req.params.id, riderId]
      );
    }

    if (order.user_id) {
      notifyUser(order.user_id, {
        title: 'Out for Delivery',
        message: `Your order "${order.order_name}" is on the way!`,
        data: { type: 'order_status', order_id: order.id, status: 'in_transit' },
      });
    }

    order.orderName = order.order_name;
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const pickupOrder = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "SELECT * FROM customer_orders WHERE id = $1 AND rider_id = $2",
      [req.params.id, riderId]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });

    const order = rows[0];
    if (order.status !== 'accepted')
      return res.status(400).json({ success: false, message: 'Order must be accepted before pickup' });

    if (order.delivery_group_id) {
      await query(
        "UPDATE customer_orders SET status = 'picked_up', updated_at = NOW() WHERE delivery_group_id = $1 AND rider_id = $2 AND status = 'accepted'",
        [order.delivery_group_id, riderId]
      );
    } else {
      await query(
        "UPDATE customer_orders SET status = 'picked_up', updated_at = NOW() WHERE id = $1 AND rider_id = $2",
        [req.params.id, riderId]
      );
    }

    if (order.user_id) {
      const { rows: stores } = await query(
        'SELECT s.name FROM stores s WHERE s.id = $1',
        [order.store_id]
      );
      const storeName = stores.length ? stores[0].name : 'the restaurant';
      notifyUser(order.user_id, {
        title: 'Order Picked Up',
        message: `Rider has picked up your order from ${storeName}.`,
        data: { type: 'order_status', order_id: order.id, status: 'picked_up' },
      });
    }

    order.orderName = order.order_name;
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const completeDelivery = async (req, res, next) => {
  try {
    const riderId = await resolveRiderId(req.user.id);
    if (!riderId) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const { rows } = await query(
      "SELECT * FROM customer_orders WHERE id = $1 AND rider_id = $2",
      [req.params.id, riderId]
    );
    if (!rows.length) return res.status(400).json({ success: false, message: 'Order not found' });

    const order = rows[0];
    if (order.status !== 'in_transit')
      return res.status(400).json({ success: false, message: 'Order must be in transit to complete' });

    if (order.delivery_group_id) {
      await query(
        "UPDATE customer_orders SET status = 'arrived', updated_at = NOW() WHERE delivery_group_id = $1 AND rider_id = $2 AND status = 'in_transit'",
        [order.delivery_group_id, riderId]
      );
    } else {
      await query(
        "UPDATE customer_orders SET status = 'arrived', updated_at = NOW() WHERE id = $1",
        [req.params.id]
      );
    }

    if (order.user_id) {
      notifyUser(order.user_id, {
        title: 'Rider Arrived',
        message: `Your rider has arrived at your location for "${order.order_name}". Please confirm receipt.`,
        data: { type: 'order_status', order_id: order.id, status: 'arrived' },
      });

      try {
        const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
        if (user.length && user[0].email) {
          await sendOrderStatusEmail({ to: user[0].email, name: user[0].name, order, status: 'arrived' });
        }
      } catch (e) {
        console.error('[OrderEmail] Arrived notification failed:', e.message);
      }
    }

    order.orderName = order.order_name;
    res.json({ success: true, message: 'Delivery completed', data: order });
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

    // Check if rider is near customer (within 50m) for active orders → auto-complete
    const { rows: activeOrders } = await query(
      "SELECT id, user_id, order_name, delivery_lat, delivery_lng, delivery_group_id FROM customer_orders WHERE rider_id = $1 AND status = 'in_transit'",
      [riderId]
    );

    for (const order of activeOrders) {
      if (order.delivery_lat && order.delivery_lng) {
        const distance = haversineKm(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(order.delivery_lat),
          parseFloat(order.delivery_lng)
        );

        if (distance !== null && distance <= 0.05) {
          if (order.delivery_group_id) {
            // Arrive ALL orders in the group
            await query(
              "UPDATE customer_orders SET status = 'arrived', updated_at = NOW() WHERE delivery_group_id = $1 AND rider_id = $2 AND status = 'in_transit'",
              [order.delivery_group_id, riderId]
            );
          } else {
            await query(
              "UPDATE customer_orders SET status = 'arrived', updated_at = NOW() WHERE id = $1",
              [order.id]
            );
          }

          notifyUser(order.user_id, {
            title: 'Rider Arrived',
            message: `Your rider has arrived at your location for "${order.order_name}". Please confirm receipt.`,
            data: { type: 'order_status', order_id: order.id, status: 'arrived' },
          });

          try {
            const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
            if (user.length && user[0].email) {
              await sendOrderStatusEmail({ to: user[0].email, name: user[0].name, order, status: 'arrived' });
            }
          } catch (e) {
            console.error('[OrderEmail] Arrived notification failed:', e.message);
          }
        }
      }
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
