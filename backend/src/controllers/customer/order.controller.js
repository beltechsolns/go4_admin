import { query } from '../../config/db.js';
import { haversineKm, computeEtaMinutes, hasArrived } from '../../helpers/geoHelper.js';
import { getRouteDirections } from '../../helpers/directionHelper.js';
import { fixItemImages } from '../../helpers/imageHelper.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../../helpers/emailHelper.js';
import { notifyUser } from '../../helpers/notifyHelper.js';

export const createOrder = async (req, res, next) => {
  try {
    const { items, delivery_address, notes, pickup_address, delivery_lat, delivery_lng } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ success: false, message: 'Items required' });

    const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);

    // Resolve delivery location
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

    // Look up all products to get their store_id
    const productIds = items.map(i => i.product_id);
    const { rows: products } = await query(
      `SELECT id, name, image, store_id, price FROM products WHERE id = ANY($1)`,
      [productIds]
    );
    if (products.length !== productIds.length)
      return res.status(400).json({ success: false, message: 'Some products were not found' });

    // Group items by store_id
    const itemsByStore = {};
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) continue;
      if (!itemsByStore[prod.store_id]) itemsByStore[prod.store_id] = [];
      itemsByStore[prod.store_id].push({ ...item, product_name: prod.name, product_image: prod.image });
    }

    // Fetch store info for each group
    const storeIds = Object.keys(itemsByStore).map(Number);
    const { rows: stores } = await query(
      `SELECT id, name, location FROM stores WHERE id = ANY($1) AND is_active = true`,
      [storeIds]
    );
    if (!stores.length)
      return res.status(400).json({ success: false, message: 'No valid restaurants found' });

    const createdOrders = [];
    const isMultiRestaurant = storeIds.length > 1;
    const deliveryGroupId = isMultiRestaurant ? `DG-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}` : null;

    for (const storeId of storeIds) {
      const store = stores.find(s => s.id === storeId);
      if (!store) continue;

      const storeItems = itemsByStore[storeId];
      const totalPrice = storeItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
      const orderNum = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
      const orderName = `${store.name} Order #${orderNum}`;
      const resolvedPickup = pickup_address || store.location || '';

      const { rows: [order] } = await query(
        'INSERT INTO customer_orders (user_id, store_id, order_name, user_name, total_price, delivery_address, pickup_address, delivery_lat, delivery_lng, notes, delivery_group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
        [req.user.id, storeId, orderName, user[0].name, totalPrice, resolvedAddress, resolvedPickup, resolvedLat, resolvedLng, notes || '', deliveryGroupId]
      );

      for (const item of storeItems) {
        await query(
          'INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price) VALUES ($1,$2,$3,$4,$5,$6)',
          [order.id, item.product_id, item.product_name, item.product_image, item.quantity || 1, item.price]
        );
      }

      const { rows: fullOrder } = await query('SELECT * FROM customer_orders WHERE id = $1', [order.id]);
      const { rows: orderItems } = await query(
        'SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
        [order.id]
      );
      fullOrder[0].items = fixItemImages(orderItems);
      fullOrder[0].orderName = fullOrder[0].order_name;
      createdOrders.push(fullOrder[0]);
    }

    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // Send order confirmation email
    const totalAll = createdOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
    try {
      await sendOrderConfirmationEmail({ to: user[0].email, name: user[0].name, order: createdOrders[0] });
    } catch (mailErr) {
      console.error('[OrderEmail] Confirmation send failed:', mailErr.message);
    }

    notifyUser(req.user.id, {
      title: 'Order Placed',
      message: `Your order${createdOrders.length > 1 ? 's have' : ' has'} been placed successfully. Total: ETB ${totalAll.toFixed(2)}`,
      data: { type: 'order_status', order_id: createdOrders[0].id, status: 'pending' },
    });

    try {
      const { rows: admins } = await query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        notifyUser(admin.id, {
          title: 'New Order',
          message: `New order(s) from ${user[0].name}. Total: ETB ${totalAll.toFixed(2)}`,
          data: { type: 'new_order', order_id: createdOrders[0].id },
        });
      }
    } catch (e) {
      console.error('[OrderNotify] Admin notify failed:', e.message);
    }

    res.status(201).json({ success: true, data: createdOrders.length === 1 ? createdOrders[0] : createdOrders });
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
      params.push(['accepted', 'picked_up', 'in_transit', 'arrived']);
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
    const validStatuses = ['accepted', 'picked_up', 'in_transit', 'arrived', 'delivered', 'cancelled'];
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

    // Check if this order is part of a delivery group
    let groupedOrders = [];
    let pickupStops = [];
    if (order.delivery_group_id) {
      const { rows: group } = await query(
        'SELECT co.*, s.name AS store_name, s.latitude AS store_lat, s.longitude AS store_lng, s.location AS store_location FROM customer_orders co LEFT JOIN stores s ON s.id = co.store_id WHERE co.delivery_group_id = $1 ORDER BY co.store_id',
        [order.delivery_group_id]
      );
      groupedOrders = group;

      // Build pickup stops
      const storeMap = {};
      for (const o of group) {
        if (!storeMap[o.store_id]) {
          storeMap[o.store_id] = {
            store_id: o.store_id,
            store_name: o.store_name,
            store_location: o.store_location,
            store_lat: o.store_lat,
            store_lng: o.store_lng,
            orders: [],
          };
        }
        storeMap[o.store_id].orders.push({ id: o.id, order_name: o.order_name, total_price: o.total_price });
      }
      pickupStops = Object.values(storeMap);
    } else {
      // Single order — build one pickup stop from store info
      const { rows: storeRows } = await query(
        'SELECT id, name, location, latitude, longitude FROM stores WHERE id = $1',
        [order.store_id]
      );
      if (storeRows.length) {
        const s = storeRows[0];
        pickupStops = [{
          store_id: s.id,
          store_name: s.name,
          store_location: s.location,
          store_lat: s.latitude,
          store_lng: s.longitude,
          orders: [{ id: order.id, order_name: order.order_name, total_price: order.total_price }],
        }];
      }
    }

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
          if (order.delivery_group_id) {
            await query(
              "UPDATE customer_orders SET status = 'cancelled', updated_at = NOW() WHERE delivery_group_id = $1",
              [order.delivery_group_id]
            );
          } else {
            await query(
              "UPDATE customer_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
              [order.id]
            );
          }
          order.status = 'cancelled';

          notifyUser(order.user_id, {
            title: 'Order Cancelled',
            message: `Your order "${order.order_name}" has been cancelled because the rider went offline.`,
            data: { type: 'order_status', order_id: order.id, status: 'cancelled' },
          });
        }
      }
    }

    // Distance & ETA — different route based on order status
    let distance_km = null;
    let eta_minutes = null;
    let arrived = false;
    let route = null;

    if (rider && rider.current_lat != null && rider.current_lng != null) {
      const riderLat = parseFloat(rider.current_lat);
      const riderLng = parseFloat(rider.current_lng);

      // Get store location for all cases
      const { rows: storeRows } = await query(
        'SELECT name, latitude, longitude FROM stores WHERE id = $1',
        [order.store_id]
      );
      const storeName = storeRows.length ? storeRows[0].name : 'the restaurant';
      const storeLat = storeRows.length ? parseFloat(storeRows[0].latitude) : null;
      const storeLng = storeRows.length ? parseFloat(storeRows[0].longitude) : null;

      if (order.status === 'accepted') {
        // Rider heading to restaurant to pick up
        if (storeLat && storeLng) {
          const url = `http://router.project-osrm.org/route/v1/driving/${riderLng},${riderLat};${storeLng},${storeLat}?overview=full&geometries=geojson&steps=true`;
          try {
            const res2 = await fetch(url);
            const data = await res2.json();
            if (data.routes && data.routes.length) {
              const r = data.routes[0];
              route = {
                geometry: r.geometry,
                distance_km: parseFloat((r.distance / 1000).toFixed(2)),
                duration_minutes: Math.max(1, Math.round(r.duration / 60)),
                steps: r.legs[0].steps.map(s => ({
                  instruction: s.maneuver.type === 'depart' ? `Head to ${storeName}`
                    : s.maneuver.type === 'arrive' ? `Arrived at ${storeName}`
                    : `${s.maneuver.modifier || ''} on ${s.name || 'road'}`.trim(),
                  distance_km: parseFloat((s.distance / 1000).toFixed(2)),
                  duration_minutes: Math.max(1, Math.round(s.duration / 60)),
                  maneuver: s.maneuver.type,
                  leg: `Pickup at ${storeName}`,
                })),
              };
              distance_km = route.distance_km;
              eta_minutes = route.duration_minutes;
            }
          } catch (e) {
            console.error('[OSRM] Pickup route failed:', e.message);
          }
          // Fallback to haversine
          if (!route) {
            distance_km = haversineKm(riderLat, riderLng, storeLat, storeLng);
            eta_minutes = computeEtaMinutes(distance_km);
          }
        }
      } else if (order.status === 'picked_up' || order.status === 'in_transit') {
        // Rider heading to customer
        const destLat = parseFloat(order.delivery_lat);
        const destLng = parseFloat(order.delivery_lng);
        if (destLat && destLng) {
          const url = `http://router.project-osrm.org/route/v1/driving/${riderLng},${riderLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
          try {
            const res2 = await fetch(url);
            const data = await res2.json();
            if (data.routes && data.routes.length) {
              const r = data.routes[0];
              route = {
                geometry: r.geometry,
                distance_km: parseFloat((r.distance / 1000).toFixed(2)),
                duration_minutes: Math.max(1, Math.round(r.duration / 60)),
                steps: r.legs[0].steps.map(s => ({
                  instruction: s.maneuver.type === 'depart' ? 'Head to customer'
                    : s.maneuver.type === 'arrive' ? 'Arrive at customer'
                    : `${s.maneuver.modifier || ''} on ${s.name || 'road'}`.trim(),
                  distance_km: parseFloat((s.distance / 1000).toFixed(2)),
                  duration_minutes: Math.max(1, Math.round(s.duration / 60)),
                  maneuver: s.maneuver.type,
                  leg: 'Deliver to customer',
                })),
              };
              distance_km = route.distance_km;
              eta_minutes = route.duration_minutes;
            }
          } catch (e) {
            console.error('[OSRM] Delivery route failed:', e.message);
          }
          // Fallback to haversine
          if (!route) {
            distance_km = haversineKm(riderLat, riderLng, destLat, destLng);
            eta_minutes = computeEtaMinutes(distance_km);
          }
        }
      } else if (order.status === 'arrived') {
        distance_km = 0;
        eta_minutes = 0;
        arrived = true;
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
        grouped_orders: groupedOrders.length > 1
          ? groupedOrders.map(o => ({ id: o.id, order_name: o.order_name, store_name: o.store_name, total_price: o.total_price, status: o.status }))
          : null,
        pickup_stops: pickupStops.length > 0 ? pickupStops : null,
        tracking: {
          distance_km: distance_km ? parseFloat(distance_km.toFixed(2)) : null,
          eta_minutes,
          arrived,
          message: !rider
            ? 'Waiting for a rider to accept the order'
            : order.status === 'arrived'
              ? 'Rider is waiting. Please confirm receipt.'
              : order.status === 'delivered'
                ? 'Order delivered. Enjoy!'
                : order.status === 'accepted'
                  ? `Rider is heading to ${pickupStops[0]?.store_name || 'the restaurant'} to pick up, ${eta_minutes} min`
                  : order.status === 'picked_up'
                    ? `Rider has picked up, heading to you, ${eta_minutes} min`
                    : `Rider is on the way to you, ${eta_minutes} min`,
        },
        route: route ? {
          geometry: route.geometry,
          distance_km: route.distance_km,
          duration_minutes: route.duration_minutes,
          steps: route.steps,
        } : null,
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
    if (order.status !== 'arrived') return res.status(400).json({ success: false, message: 'Order must be arrived to confirm delivery' });

    const { rows } = await query(
      "UPDATE customer_orders SET customer_delivered_at = NOW(), status = 'delivered', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    rows[0].orderName = rows[0].order_name;

    try {
      const { rows: user } = await query('SELECT name, email FROM users WHERE id = $1', [rows[0].user_id]);
      if (user.length && user[0].email) {
        await sendOrderStatusEmail({ to: user[0].email, name: user[0].name, order: rows[0], status: 'delivered' });
      }
    } catch (e) {
      console.error('[OrderEmail] Delivered notification failed:', e.message);
    }

    notifyUser(req.user.id, {
      title: 'Order Delivered',
      message: `Your order "${rows[0].order_name}" has been delivered. Enjoy!`,
      data: { type: 'order_status', order_id: rows[0].id, status: 'delivered' },
    });

    // Also deliver all orders in group if grouped
    if (order.delivery_group_id) {
      await query(
        "UPDATE customer_orders SET customer_delivered_at = NOW(), status = 'delivered', updated_at = NOW() WHERE delivery_group_id = $1 AND status = 'arrived'",
        [order.delivery_group_id]
      );
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const rateRestaurant = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'delivered') return res.status(400).json({ success: false, message: 'Order must be delivered before rating' });

    const { rows } = await query(
      `INSERT INTO ratings (store_id, user_id, rating) VALUES ($1, $2, $3)
       ON CONFLICT (store_id, user_id) DO UPDATE SET rating = EXCLUDED.rating
       RETURNING *`,
      [order.store_id, req.user.id, rating]
    );

    const avg = await query('SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS count FROM ratings WHERE store_id = $1', [order.store_id]);

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

export const rateOrder = async (req, res, next) => {
  try {
    const { food_quality, delivery_speed, overall } = req.body;
    if (!overall || overall < 1 || overall > 5)
      return res.status(400).json({ success: false, message: 'Overall rating must be between 1 and 5' });

    const { rows: [order] } = await query(
      'SELECT * FROM customer_orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'delivered') return res.status(400).json({ success: false, message: 'Order must be delivered before rating' });

    const { rows } = await query(
      `INSERT INTO order_ratings (order_id, user_id, food_quality, delivery_speed, overall)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id, user_id) DO UPDATE SET
         food_quality = EXCLUDED.food_quality,
         delivery_speed = EXCLUDED.delivery_speed,
         overall = EXCLUDED.overall
       RETURNING *`,
      [order.id, req.user.id, food_quality || null, delivery_speed || null, overall]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
