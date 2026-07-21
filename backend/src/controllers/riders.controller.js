import { query } from '../config/db.js';

/**
 * GET /api/riders
 */
export const getAll = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ['is_active = true'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(full_name ILIKE $${idx} OR phone ILIKE $${idx} OR zone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (status) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM riders ${where}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT * FROM riders ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
 * GET /api/riders/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM riders WHERE id = $1', [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/riders
 */
export const create = async (req, res, next) => {
  try {
    const { full_name, phone, email, vehicle_type, zone, status } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ success: false, error: 'full_name and phone are required.' });
    }

    if (email) {
      const [existingUser, existingRider, existingAdmin] = await Promise.all([
        query('SELECT id FROM users WHERE email = $1', [email]),
        query('SELECT id FROM riders WHERE email = $1', [email]),
        query('SELECT id FROM admins WHERE email = $1', [email]),
      ]);
      if (existingUser.rows.length || existingRider.rows.length || existingAdmin.rows.length)
        return res.status(409).json({ success: false, error: 'Email already in use by another user.' });
    }

    const { rows } = await query(
      `INSERT INTO riders (full_name, phone, email, vehicle_type, zone, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [full_name, phone, email || null, vehicle_type || 'Bike', zone || null, status || 'Offline']
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/riders/:id
 */
export const update = async (req, res, next) => {
  try {
    const { full_name, phone, email, vehicle_type, zone, status, rating, total_deliveries } = req.body;

    if (email) {
      const [existingUser, existingRider, existingAdmin] = await Promise.all([
        query('SELECT id FROM users WHERE email = $1', [email]),
        query('SELECT id FROM riders WHERE email = $1 AND id != $2', [email, req.params.id]),
        query('SELECT id FROM admins WHERE email = $1', [email]),
      ]);
      if (existingUser.rows.length || existingRider.rows.length || existingAdmin.rows.length)
        return res.status(409).json({ success: false, error: 'Email already in use by another user.' });
    }

    const { rows } = await query(
      `UPDATE riders
       SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email),
         vehicle_type = COALESCE($4, vehicle_type),
         zone = COALESCE($5, zone),
         status = COALESCE($6, status),
         rating = COALESCE($7, rating),
         total_deliveries = COALESCE($8, total_deliveries),
         updated_at = NOW()
       WHERE id = $9 AND is_active = true
       RETURNING *`,
      [full_name, phone, email, vehicle_type, zone, status, rating, total_deliveries, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/riders/:id
 * Soft delete by setting is_active = false
 */
export const remove = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE riders SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    res.json({ success: true, data: { message: 'Rider removed.' } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/riders/:id/status
 * Toggle is_active or update status field
 */
export const toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    let newStatus;
    if (status) {
      newStatus = status;
    } else {
      const { rows: current } = await query(
        'SELECT status FROM riders WHERE id = $1',
        [req.params.id]
      );
      if (!current.length) {
        return res.status(404).json({ success: false, error: 'Rider not found.' });
      }
      newStatus = current[0].status === 'Online' ? 'Offline' : 'Online';
    }

    const { rows } = await query(
      'UPDATE riders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStatus, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/riders/:id/location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required.' });
    }

    const { rows } = await query(
      `UPDATE riders
       SET current_lat = $1, current_lng = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, full_name, current_lat, current_lng, status`,
      [parseFloat(lat), parseFloat(lng), req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
