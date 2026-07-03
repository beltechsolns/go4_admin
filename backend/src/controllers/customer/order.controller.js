import { query } from '../../config/db.js';

export const createOrder = async (req, res, next) => {
  try {
    const { items, delivery_address, notes, pickup_address } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ success: false, message: 'Items required' });
    if (!delivery_address)
      return res.status(400).json({ success: false, message: 'Delivery address required' });

    const { rows: user } = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);

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
      'INSERT INTO customer_orders (user_id, store_id, order_name, user_name, total_price, delivery_address, pickup_address, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, storeId, orderName, user[0].name, totalPrice, delivery_address, resolvedPickup, notes || '']
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
    fullOrder.items = orderItems;

    fullOrder.orderName = fullOrder.order_name;

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
    order.items = items;
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
