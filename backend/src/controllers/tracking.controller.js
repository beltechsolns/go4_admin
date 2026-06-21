import { query } from '../config/db.js';

/**
 * GET /api/tracking/riders
 * All online/busy riders with their current GPS and active delivery info
 */
export const getActiveRiders = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        r.id,
        r.full_name,
        r.phone,
        r.vehicle_type,
        r.zone,
        r.status,
        r.rating,
        r.current_lat,
        r.current_lng,
        d.id AS delivery_id,
        d.order_number,
        d.customer_name,
        d.location AS delivery_location,
        d.status AS delivery_status
      FROM riders r
      LEFT JOIN deliveries d ON d.rider_id = r.id
        AND d.status IN ('Accepted', 'Picked Up', 'In Transit')
      WHERE r.status IN ('Online', 'Busy')
        AND r.is_active = true
      ORDER BY r.full_name
    `);

    const data = rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      phone: r.phone,
      vehicle_type: r.vehicle_type,
      zone: r.zone,
      status: r.status,
      rating: parseFloat(r.rating),
      location: {
        lat: r.current_lat ? parseFloat(r.current_lat) : null,
        lng: r.current_lng ? parseFloat(r.current_lng) : null,
      },
      current_order: r.delivery_id
        ? {
            id: r.delivery_id,
            order_number: r.order_number,
            customer_name: r.customer_name,
            delivery_location: r.delivery_location,
            status: r.delivery_status,
          }
        : null,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking/riders/:id
 * Single rider's current location
 */
export const getRiderLocation = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         id,
         full_name,
         status,
         current_lat,
         current_lng,
         updated_at
       FROM riders
       WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    const r = rows[0];

    res.json({
      success: true,
      data: {
        id: r.id,
        full_name: r.full_name,
        status: r.status,
        location: {
          lat: r.current_lat ? parseFloat(r.current_lat) : null,
          lng: r.current_lng ? parseFloat(r.current_lng) : null,
        },
        last_updated: r.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
