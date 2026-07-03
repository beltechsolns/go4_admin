import { query } from '../../config/db.js';

export const getLocations = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM user_locations WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const saveLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, label, address, is_default } = req.body;
    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ success: false, message: 'latitude and longitude required' });

    if (is_default) {
      await query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await query(
      'INSERT INTO user_locations (user_id, latitude, longitude, label, address, is_default) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, latitude, longitude, label || 'Home', address || null, is_default || false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, label, address, is_default } = req.body;

    if (is_default) {
      await query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await query(
      'UPDATE user_locations SET latitude = COALESCE($1, latitude), longitude = COALESCE($2, longitude), label = COALESCE($3, label), address = COALESCE($4, address), is_default = COALESCE($5, is_default), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *',
      [latitude, longitude, label, address, is_default, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM user_locations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rowCount) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, message: 'Location deleted' });
  } catch (err) { next(err); }
};

export const getCurrentAddress = async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM user_locations WHERE user_id = $1 AND is_default = true LIMIT 1", [req.user.id]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
};

export const updateCurrentAddress = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    await query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [req.user.id]);

    const { rows } = await query(
      'INSERT INTO user_locations (user_id, latitude, longitude, address, is_default) VALUES ($1,$2,$3,$4,true) RETURNING *',
      [req.user.id, latitude, longitude, address]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
