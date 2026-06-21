import { query } from '../config/db.js';

/**
 * GET /api/pricing
 */
export const get = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM pricing ORDER BY id LIMIT 1');

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Pricing config not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pricing
 */
export const update = async (req, res, next) => {
  try {
    const { base_fee, per_km_rate, service_charge, min_order, peak_surcharge } = req.body;

    const { rows } = await query(
      `UPDATE pricing
       SET
         base_fee = COALESCE($1, base_fee),
         per_km_rate = COALESCE($2, per_km_rate),
         service_charge = COALESCE($3, service_charge),
         min_order = COALESCE($4, min_order),
         peak_surcharge = COALESCE($5, peak_surcharge),
         updated_at = NOW()
       WHERE id = (SELECT id FROM pricing ORDER BY id LIMIT 1)
       RETURNING *`,
      [
        base_fee !== undefined ? parseFloat(base_fee) : null,
        per_km_rate !== undefined ? parseFloat(per_km_rate) : null,
        service_charge !== undefined ? parseFloat(service_charge) : null,
        min_order !== undefined ? parseFloat(min_order) : null,
        peak_surcharge !== undefined ? parseFloat(peak_surcharge) : null,
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Pricing config not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
