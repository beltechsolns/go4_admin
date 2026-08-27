import { query } from '../../config/db.js';
import { haversineKm, computeEtaMinutes, hasArrived } from '../../helpers/geoHelper.js';
import { fixItemImages } from '../../helpers/imageHelper.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../../helpers/emailHelper.js';
import { notifyUser, createNotification } from '../../helpers\notifyHelper.js';

export const createOrder = async (req, res, next) => {
  try {
    const { items, delivery_address, notes, pickup_address, delivery_lat, delivery_lng } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ success: false, message: 'Items required' });

    const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);

    // Resolve delivery location: use provided lat/lng, or fallback to current location
    let resolvedAddress = delivery_address || '';
    let resolvedLat = delivery_lat || null;
    let resolvedLng = delivery_lng || null;

    if (!resolvedLat || !resolvedLng) {
      const { rows: savedLoc } = await query(
        "SELECT latitude, longitude, address FROM user_locations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
        [req.user.id]
      );
      if (savedLoc.length) {
        resolvedLat = resolvedLat || savedLoc[0].latitude;
        resolvedLng = resolvedLng || savedLoc[0].longitude;
        resolvedAddress = resolvedAddress || savedLoc[0].address || '';
      }
    }

    if (!resolvedAddress)
      return res.status(400).json({ success: false, message: 'Delivery address required' });

    const productIds = items.map(i => i.product_id).filter(Boolean);
    let orderName = `Order #${Date.now().toString(36).toUpperCase()}`;
    let storeId = null;
    let resolvedPickup = pickup_address || '';

    if (productIds.length) {
      const { rows: products } = await query('SELECT id, name, store_id, price FROM products WHERE id = ANY($1::int[])', [productIds]);
      if (products.length) {
        const names = products.map(p => p.name).filter(Boolean);
        orderName = names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
        storeId = products[0].store_id;
      }

      if (!resolvedPickup && storeId) {
        const { rows: store } = await query('SELECT location FROM stores WHERE id = $1', [storeId]);
        if (store.length && store[0].location) {
          resolvedPickup = store[0].location;
        }
      }
    }

    const totalPrice = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);

    const { rows: [order] } = await query(
      'INSERT INTO customer_orders (user_id, store_id, order_name, user_name, total_price, delivery_address, pickup_address, delivery_lat, delivery_lng, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [req.user.id, storeId, orderName, user[0].name, totalPrice, resolvedAddress, resolvedPickup, resolvedLat, resolvedLng, notes || '']
    );

    for (const item of items) {
      const { rows: [prod] } = await query('SELECT name, image FROM products WHERE id = $1', [item.product_id]);
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price) VALUES ($1,$2,$3,$4,$5,$6)',
        [order.id, item.product_id, prod?.name || 'Unknown', prod?.image || null, item.quantity || 1, item.price]
      );
    }

    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    const { rows: [fullOrder] } = await query('SELECT * FROM customer_orders WHERE id = $1', [order.id]);
    const { rows: orderItems } = await query(
      'SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
      [order.id]
    );
    fullOrder.items = fixItemImages(orderItems);

    fullOrder.orderName = fullOrder.order_name;

    // Send order confirmation email (non-blocking)
    try {
      await sendOrderConfirmationEmail({ to: user[0].email, name: user[0].name, order: fullOrder });
    } catch (mailErr) {
      console.error('[OrderEmail] Confirmation send failed:', mailErr.message);
    }

    // In-app notification to customer
    createNotification(req.user.id, {
      title: 'Order Placed',
      message: `Your order "${orderName}" has been placed successfully. Total: ETB ${totalPrice.toFixed(2)}`,
    });

    // Notify admin users about new order
    try {
      const { rows: admins } = await query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        createNotification(admin.id, {
          title: 'New Order',
          message: `New order "${orderName}" from ${user[0].name}. Total: ETB ${totalPrice.toFixed(2)}`,
        });
      }
    } catch (e) {
      console.error('[OrderNotify] Admin notify failed:', e.message);
    }

    res.status(201).json({ success: true, data: fullOrder });
  } catch (err) { next(err); }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['user_id = $1'];
    const params = [req.user.id];
    let idx = 2;

    if (status === 'active') {
      conditions.push('status = ANY($' + idx + '::text[])');
      params.push(['accepted', 'picked_up', 'in_transit']);
      idx++;
    } else if (status) {
      conditions.push('status = $' + idx);
      params.push(status);
      idx++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const count = await query('SELECT COUNT(*) AS total FROM customer_orders ' + where, params);
    const total = parseInt(count.rows[0].total);

    const { rows: orders } = await query(
      'SELECT * FROM customer_orders ' + where + ' ORDER BY created_at DESC LIMIT $' + idx + ' OFFSET $' + (idx + 1),
      [...params, parseInt(limit), offset]
    );

    for (const order of orders) {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items;
      order.orderName = order.order_name;
    }

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const getOrderByID = async (req, res, next) => {
  try {
    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { rows: items } = await query('SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1', [order.id]);
    order.items = fixItemImages(items);
    order.orderName = order.order_name;

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, rider_id } = req.body;
    const validStatuses = ['accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const setClauses = ["status = $1", "updated_at = NOW()"];
    const params = [status, req.params.id];

    if (rider_id) {
      setClauses.push("rider_id = $3");
      params.push(rider_id);
    }

    const { rows } = await query(
      'UPDATE customer_orders SET ' + setClauses.join(', ') + ' WHERE id = $2 RETURNING *',
      params
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE customer_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    rows[0].orderName = rows[0].order_name;
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const getPendingOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await query("SELECT COUNT(*) AS total FROM customer_orders WHERE status = 'pending'");
    const total = parseInt(count.rows[0].total);

    const { rows: orders } = await query(
      'SELECT co.*, u.name AS user_name, u.phone AS user_phone, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = co.id) AS items_count FROM customer_orders co LEFT JOIN users u ON u.id = co.user_id WHERE co.status = $1 ORDER BY co.created_at DESC LIMIT $2 OFFSET $3',
      ['pending', parseInt(limit), offset]
    );

    for (const order of orders) {
      order.orderName = order.order_name;
    }

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const getDeliveredOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await query("SELECT COUNT(*) AS total FROM customer_orders WHERE user_id = $1 AND status = 'delivered'", [req.user.id]);
    const total = parseInt(count.rows[0].total);

    const { rows: orders } = await query(
      'SELECT *, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = customer_orders.id) AS items_count FROM customer_orders WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [req.user.id, 'delivered', parseInt(limit), offset]
    );

    for (const order of orders) {
      order.orderName = order.order_name;
    }

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const trackOrder = async (req, res, next) => {
  try {
    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderName = order.order_name;

    // Rider live location
    let rider = null;
    if (order.rider_id) {
      const { rows: [r] } = await query(
        'SELECT id, full_name, phone, vehicle_type, status, current_lat, current_lng, updated_at FROM riders WHERE id = $1',
        [order.rider_id]
      );
      rider = r || null;

      // Check if rider is offline for more than 30 minutes → auto-cancel
      if (rider && rider.status === 'Offline' && order.status === 'in_transit') {
        const riderLastUpdate = new Date(rider.updated_at);
        const now = new Date();
        const minutesOffline = (now - riderLastUpdate) / (1000 * 60);

        if (minutesOffline > 30) {
          await query(
            "UPDATE customer_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
            [order.id]
          );
          order.status = 'cancelled';

          // Notify customer
          createNotification(order.user_id, {
            title: 'Order Cancelled',
            message: `Your order "${order.order_name}" has been cancelled because the rider went offline.`,
          });

          try {
            const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
            if (user.length && user[0].email) {
              await sendOrderStatusEmail({ to: user[0].email, name: user[0].name, order, status: 'cancelled' });
            }
          } catch (e) {
            console.error('[OrderEmail] Cancel notification failed:', e.message);
          }
        }
      }
    }

    // Distance & ETA from rider to delivery point
    let distance_km = null;
    let eta_minutes = null;
    let arrived = false;

    if (rider && order.delivery_lat && order.delivery_lng) {
      if (rider.current_lat != null && rider.current_lng != null) {
        distance_km = haversineKm(
          parseFloat(rider.current_lat),
          parseFloat(rider.current_lng),
          parseFloat(order.delivery_lat),
          parseFloat(order.delivery_lng)
        );
        eta_minutes = computeEtaMinutes(distance_km);
        arrived = hasArrived(distance_km);
      }
    }

    const { rows: items } = await query(
      'SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
      [order.id]
    );

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderName: order.order_name,
          status: order.status,
          created_at: order.created_at,
          delivery_address: order.delivery_address,
          total_price: order.total_price,
          items: fixItemImages(items),
        },
        rider: rider ? {
          id: rider.id,
          name: rider.full_name,
          phone: rider.phone,
          vehicle_type: rider.vehicle_type,
          status: rider.status,
          current_lat: rider.current_lat,
          current_lng: rider.current_lng,
        } : null,
        delivery: {
          delivery_lat: order.delivery_lat,
          delivery_lng: order.delivery_lng,
        },
        tracking: {
          distance_km: distance_km ? parseFloat(distance_km.toFixed(2)) : null,
          eta_minutes,
          arrived,
          message: !rider
            ? 'Waiting for a rider to accept the order'
            : arrived
              ? 'Rider has arrived at your location'
              : `Rider is ${eta_minutes} minutes away`,
        },
      },
    });
  } catch (err) { next(err); }
};

export const rateDriver = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.rider_id) return res.status(400).json({ success: false, message: 'No rider assigned to this order yet' });
    if (order.status !== 'delivered') return res.status(400).json({ success: false, message: 'Order must be delivered before rating the driver' });

    const { rows } = await query(
      `INSERT INTO driver_ratings (rider_id, user_id, order_id, rating, review) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, review = EXCLUDED.review
       RETURNING *`,
      [order.rider_id, req.user.id, order.id, rating, review || null]
    );

    const avg = await query('SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS count FROM driver_ratings WHERE rider_id = $1', [order.rider_id]);

    res.json({
      success: true,
      data: {
        rating: rows[0],
        average_rating: parseFloat(avg.rows[0].avg_rating),
        reviews_count: parseInt(avg.rows[0].count),
      },
    });
  } catch (err) { next(err); }
};

export const confirmDelivery = async (req, res, next) => {
  try {
    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'delivered') return res.status(400).json({ success: false, message: 'Order already delivered' });
    if (order.status !== 'in_transit') return res.status(400).json({ success: false, message: 'Order must be in transit to confirm' });

    const { rows } = await query(
      "UPDATE customer_orders SET customer_delivered_at = NOW(), status = 'delivered', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    rows[0].orderName = rows[0].order_name;
    notifyOrderStatus(rows[0], 'delivered');

    // In-app notification to customer
    createNotification(req.user.id, {
      title: 'Order Delivered',
      message: `Your order "${rows[0].order_name}" has been delivered. Enjoy!`,
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
