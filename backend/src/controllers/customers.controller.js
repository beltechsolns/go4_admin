import { query } from '../config/db.js';

/**
 * GET /api/customers
 */
export const getAll = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(full_name ILIKE $${idx} OR phone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (status) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM customers ${where}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
 * GET /api/customers/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM customers WHERE id = $1', [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/customers
 */
export const create = async (req, res, next) => {
  try {
    const { full_name, phone, email, status, joined_date } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ success: false, error: 'full_name and phone are required.' });
    }

    const { rows } = await query(
      `INSERT INTO customers (full_name, phone, email, status, joined_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, phone, email || null, status || 'Active', joined_date || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/customers/:id
 */
export const update = async (req, res, next) => {
  try {
    const { full_name, phone, email, status, joined_date, total_orders } = req.body;

    const { rows } = await query(
      `UPDATE customers
       SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email),
         status = COALESCE($4, status),
         joined_date = COALESCE($5, joined_date),
         total_orders = COALESCE($6, total_orders),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [full_name, phone, email, status, joined_date, total_orders, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/customers/:id
 */
export const remove = async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM customers WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: { message: 'Customer deleted.' } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/customers/:id/status
 * Toggle between Active <-> Inactive, or set to Banned
 */
export const toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // If explicit status provided, use it; otherwise toggle
    let newStatus;
    if (status) {
      newStatus = status;
    } else {
      const { rows: current } = await query(
        'SELECT status FROM customers WHERE id = $1',
        [req.params.id]
      );
      if (!current.length) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }
      newStatus = current[0].status === 'Active' ? 'Inactive' : 'Active';
    }

    const { rows } = await query(
      'UPDATE customers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStatus, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
