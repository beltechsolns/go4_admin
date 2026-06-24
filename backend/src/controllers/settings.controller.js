import { query } from '../config/db.js';

async function ensureSettingsRow() {
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      app_name VARCHAR(100) DEFAULT 'G4 Delivery',
      support_email VARCHAR(150) DEFAULT 'support@g4delivery.com',
      support_phone VARCHAR(20) DEFAULT '+251 911 000 000',
      notify_new_order BOOLEAN DEFAULT true,
      notify_delivery_complete BOOLEAN DEFAULT true,
      notify_rider_offline BOOLEAN DEFAULT true,
      language VARCHAR(5) DEFAULT 'en',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  const { rows } = await query('SELECT id FROM settings LIMIT 1');
  if (!rows.length) {
    await query('INSERT INTO settings DEFAULT VALUES');
  }
}

/**
 * GET /api/settings
 */
export const get = async (req, res, next) => {
  try {
    await ensureSettingsRow();
    const { rows } = await query('SELECT * FROM settings ORDER BY id LIMIT 1');
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
    await ensureSettingsRow();
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
         app_name = COALESCE(NULLIF($1, ''), app_name),
         support_email = COALESCE(NULLIF($2, ''), support_email),
         support_phone = COALESCE(NULLIF($3, ''), support_phone),
         notify_new_order = COALESCE($4, notify_new_order),
         notify_delivery_complete = COALESCE($5, notify_delivery_complete),
         notify_rider_offline = COALESCE($6, notify_rider_offline),
         language = COALESCE(NULLIF($7, ''), language),
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

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
