import { query } from '../../config/db.js';
import { fixImages, fixItemImages } from '../../helpers/imageHelper.js';
import { haversineKm, computeEtaMinutes } from '../../helpers/geoHelper.js';
import { getRouteDirections } from '../../helpers/directionHelper.js';

export const getRestaurants = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT s.*,
        COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM ratings r WHERE r.store_id = s.id), 0) AS rating,
        COALESCE((SELECT COUNT(*) FROM ratings r WHERE r.store_id = s.id), 0) AS reviews_count
      FROM stores s
      WHERE s.is_active = true
      ORDER BY s.name
    `);
    res.json({ success: true, data: fixImages(rows) });
  } catch (err) { next(err); }
};

export const getRestaurantByID = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT s.*,
        COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM ratings r WHERE r.store_id = s.id), 0) AS rating,
        COALESCE((SELECT COUNT(*) FROM ratings r WHERE r.store_id = s.id), 0) AS reviews_count
      FROM stores s
      WHERE s.id = $1 AND s.is_active = true
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: fixItemImages(rows[0]) });
  } catch (err) { next(err); }
};

export const getRestaurantProducts = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*,
        COALESCE((SELECT ROUND(AVG(pr.rating), 1) FROM product_ratings pr WHERE pr.product_id = p.id), 0) AS rating,
        COALESCE((SELECT COUNT(*) FROM product_ratings pr WHERE pr.product_id = p.id), 0) AS reviews_count
       FROM products p WHERE p.store_id = $1 AND p.available = true ORDER BY p.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: fixImages(rows) });
  } catch (err) { next(err); }
};

export const updateRestaurantImage = async (req, res, next) => {
  try {
    const { image_url } = req.body;
    const { rows } = await query(
      `UPDATE stores SET image_url = $1 WHERE id = $2 RETURNING id, name, image_url`,
      [image_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: fixItemImages(rows[0]) });
  } catch (err) { next(err); }
};

export const rateRestaurant = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    const store = await query('SELECT id FROM stores WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!store.rows.length) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const { rows } = await query(
      `INSERT INTO ratings (store_id, user_id, rating) VALUES ($1, $2, $3)
       ON CONFLICT (store_id, user_id) DO UPDATE SET rating = EXCLUDED.rating
       RETURNING *`,
      [req.params.id, req.user.id, rating]
    );

    const avg = await query('SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS count FROM ratings WHERE store_id = $1', [req.params.id]);

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

export const estimateDeliveryTime = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null)
      return res.status(400).json({ success: false, message: 'latitude and longitude required' });

    const { rows } = await query('SELECT id, name, latitude, longitude FROM stores WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const store = rows[0];
    if (!store.latitude || !store.longitude)
      return res.json({ success: true, data: { distance_km: null, eta_minutes: null, message: 'Restaurant location not set' } });

    const distance_km = haversineKm(
      parseFloat(store.latitude),
      parseFloat(store.longitude),
      parseFloat(latitude),
      parseFloat(longitude)
    );

    const eta_minutes = computeEtaMinutes(distance_km);

    const route = await getRouteDirections(
      parseFloat(store.latitude),
      parseFloat(store.longitude),
      parseFloat(latitude),
      parseFloat(longitude)
    );

    // Use real road distance/duration from OSRM if available, fallback to straight-line
    const finalDistance = route ? route.distance_km : (distance_km ? parseFloat(distance_km.toFixed(2)) : null);
    const finalEta = route ? route.duration_minutes : eta_minutes;

    res.json({
      success: true,
      data: {
        restaurant: { id: store.id, name: store.name },
        distance_km: finalDistance,
        eta_minutes: finalEta,
        route: route ? {
          geometry: route.geometry,
          steps: route.steps,
        } : null,
      },
    });
  } catch (err) { next(err); }
};
