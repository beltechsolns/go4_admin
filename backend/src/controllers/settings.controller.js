import { query } from '../config/db.js';

/**
 * GET /api/settings
 */
export const get = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM settings ORDER BY id LIMIT 1');

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Settings not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings
 */
export const update = async (req, res, next) => {
  try {
    const {
      app_name,
      support_email,
      support_phone,
      notify_new_order,
      notify_delivery_complete,
      notify_rider_offline,
      language,
    } = req.body;

    const { rows } = await query(
      `UPDATE settings
       SET
         app_name = COALESCE($1, app_name),
         support_email = COALESCE($2, support_email),
         support_phone = COALESCE($3, support_phone),
         notify_new_order = COALESCE($4, notify_new_order),
         notify_delivery_complete = COALESCE($5, notify_delivery_complete),
         notify_rider_offline = COALESCE($6, notify_rider_offline),
         language = COALESCE($7, language),
         updated_at = NOW()
       WHERE id = (SELECT id FROM settings ORDER BY id LIMIT 1)
       RETURNING *`,
      [
        app_name || null,
        support_email || null,
        support_phone || null,
        notify_new_order !== undefined ? notify_new_order : null,
        notify_delivery_complete !== undefined ? notify_delivery_complete : null,
        notify_rider_offline !== undefined ? notify_rider_offline : null,
        language || null,
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Settings not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
