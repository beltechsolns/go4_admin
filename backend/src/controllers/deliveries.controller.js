import { query } from '../config/db.js';

/**
 * Generate next order number like #1001
 */
async function generateOrderNumber() {
  const { rows } = await query('SELECT COUNT(*) AS count FROM deliveries');
  const count = parseInt(rows[0].count);
  return `#${String(1000 + count + 1)}`;
}

/**
 * GET /api/deliveries
 */
export const getAll = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(
        `(d.order_number ILIKE $${idx} OR d.customer_name ILIKE $${idx} OR d.rider_name ILIKE $${idx})`
      );
      params.push(`%${search}%`);
      idx++;
    }

    if (status) {
      conditions.push(`d.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM deliveries d ${where}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT
         d.*,
         c.phone AS customer_phone,
         r.phone AS rider_phone,
         r.vehicle_type
       FROM deliveries d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN riders r ON d.rider_id = r.id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/deliveries/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         d.*,
         c.phone AS customer_phone,
         r.phone AS rider_phone,
         r.vehicle_type,
         r.current_lat,
         r.current_lng
       FROM deliveries d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN riders r ON d.rider_id = r.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Delivery not found.' });
    }

    // Fetch status history
    const { rows: history } = await query(
      'SELECT * FROM delivery_status_history WHERE delivery_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], history } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/deliveries
 */
export const create = async (req, res, next) => {
  try {
    const {
      customer_id,
      customer_name,
      rider_id,
      rider_name,
      store_id,
      location,
      amount,
      status,
    } = req.body;

    if (!location) {
      return res.status(400).json({ success: false, error: 'location is required.' });
    }

    const order_number = await generateOrderNumber();

    const { rows } = await query(
      `INSERT INTO deliveries
         (order_number, customer_id, customer_name, rider_id, rider_name, store_id, location, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        order_number,
        customer_id || null,
        customer_name || null,
        rider_id || null,
        rider_name || null,
        store_id || null,
        location,
        amount || 0,
        status || 'Pending',
      ]
    );

    // Insert initial status history
    await query(
      'INSERT INTO delivery_status_history (delivery_id, status, note) VALUES ($1, $2, $3)',
      [rows[0].id, rows[0].status, 'Order created']
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/deliveries/:id/status
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required.' });
    }

    const { rows } = await query(
      'UPDATE deliveries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Delivery not found.' });
    }

    // Record history
    await query(
      'INSERT INTO delivery_status_history (delivery_id, status, note) VALUES ($1, $2, $3)',
      [req.params.id, status, note || null]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/deliveries/:id/assign
 */
export const assignRider = async (req, res, next) => {
  try {
    const { rider_id } = req.body;

    if (!rider_id) {
      return res.status(400).json({ success: false, error: 'rider_id is required.' });
    }

    // Get rider name
    const { rows: riderRows } = await query(
      'SELECT id, full_name FROM riders WHERE id = $1 AND is_active = true',
      [rider_id]
    );

    if (!riderRows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    const rider = riderRows[0];

    const { rows } = await query(
      `UPDATE deliveries
       SET rider_id = $1, rider_name = $2, status = 'Accepted', updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [rider.id, rider.full_name, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Delivery not found.' });
    }

    // Record history
    await query(
      'INSERT INTO delivery_status_history (delivery_id, status, note) VALUES ($1, $2, $3)',
      [req.params.id, 'Accepted', `Assigned to rider: ${rider.full_name}`]
    );

    // Update rider status to Busy
    await query(
      `UPDATE riders SET status = 'Busy', updated_at = NOW() WHERE id = $1`,
      [rider.id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
