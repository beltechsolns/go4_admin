import { query } from '../config/db.js';

function buildDateWhere(from, to, alias) {
  const conditions = [];
  const params = [];
  let idx = 1;
  const prefix = alias ? `${alias}.` : '';
  if (from) {
    conditions.push(`${prefix}created_at >= $${idx}`);
    params.push(from);
    idx++;
  }
  if (to) {
    conditions.push(`${prefix}created_at <= $${idx}`);
    params.push(to);
    idx++;
  }
  return { conditions, params };
}

/**
 * GET /api/reports/trends
 * Supports ?from=&to= date range
 */
export const getDeliveryTrends = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { conditions, params } = buildDateWhere(from, to, '');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') AS label,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Delivered') AS completed,
        COUNT(*) FILTER (WHERE status IN ('Cancelled', 'Failed')) AS cancelled
      FROM deliveries
      ${where}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `, params);

    const data = rows.map(r => ({
      label: r.label,
      total: parseInt(r.total),
      completed: parseInt(r.completed),
      cancelled: parseInt(r.cancelled),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/peak-hours
 * Supports ?from=&to= date range
 */
export const getPeakHours = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { conditions, params } = buildDateWhere(from, to, '');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataRows = await query(`
      SELECT
        EXTRACT(HOUR FROM created_at)::INTEGER AS hour,
        COUNT(*) AS value
      FROM deliveries
      ${where}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, params);

    const hourMap = {};
    dataRows.rows.forEach(r => {
      hourMap[r.hour] = parseInt(r.value);
    });

    const data = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, '0')}:00`,
      value: hourMap[h] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/rider-performance
 * Supports ?from=&to= date range
 */
export const getRiderPerformance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { conditions, params } = buildDateWhere(from, to, 'd');
    const joinOn = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT
        r.id,
        r.full_name,
        r.vehicle_type,
        r.zone,
        r.rating,
        COUNT(d.id) AS total_deliveries,
        COUNT(d.id) FILTER (WHERE d.status = 'Delivered') AS completed,
        COUNT(d.id) FILTER (WHERE d.status IN ('Cancelled', 'Failed')) AS failed,
        CASE
          WHEN COUNT(d.id) > 0
          THEN ROUND((COUNT(d.id) FILTER (WHERE d.status = 'Delivered')::DECIMAL / COUNT(d.id)) * 100, 1)
          ELSE 0
        END AS success_rate
      FROM riders r
      LEFT JOIN deliveries d ON d.rider_id = r.id ${joinOn}
      WHERE r.is_active = true
      GROUP BY r.id, r.full_name, r.vehicle_type, r.zone, r.rating
      ORDER BY total_deliveries DESC
    `, params);

    const timeRows = await query(`
      SELECT
        d.rider_id,
        COALESCE(
          ROUND(AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 60))
        , 0) AS avg_minutes
      FROM deliveries d
      WHERE d.status = 'Delivered'
        AND d.updated_at > d.created_at
        AND d.rider_id IS NOT NULL
        ${from || to ? `AND d.created_at >= $1 AND d.created_at <= $2` : ''}
      GROUP BY d.rider_id
    `, from || to ? [from || '1970-01-01', to || '9999-12-31'] : []);
    const timeMap = {};
    timeRows.rows.forEach(r => { timeMap[r.rider_id] = parseInt(r.avg_minutes); });

    const data = rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      vehicle_type: r.vehicle_type,
      zone: r.zone,
      rating: parseFloat(r.rating),
      total_deliveries: parseInt(r.total_deliveries),
      completed: parseInt(r.completed),
      failed: parseInt(r.failed),
      success_rate: parseFloat(r.success_rate),
      avg_delivery_time: timeMap[r.id] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/categories
 * Orders grouped by store type (for pie chart) – supports ?from=&to=
 */
export const getOrdersByCategory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { conditions, params } = buildDateWhere(from, to, 'd');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT
        COALESCE(s.type, 'Other') AS label,
        COUNT(d.id) AS value
      FROM deliveries d
      LEFT JOIN stores s ON d.store_id = s.id
      ${where}
      GROUP BY COALESCE(s.type, 'Other')
      ORDER BY value DESC
    `, params);

    const colors = ['#F25C22', '#05CD99', '#3377FF', '#FFB800', '#A855F7', '#EC4899'];
    const total = rows.reduce((sum, r) => sum + parseInt(r.value), 0);

    const data = rows.map((r, i) => ({
      label: r.label,
      value: parseInt(r.value),
      pct: total > 0 ? Math.round((parseInt(r.value) / total) * 100) : 0,
      color: colors[i % colors.length],
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/summary
 * Header cards for the reports page – supports ?from=&to= date range
 */
export const getSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (from) {
      conditions.push(`created_at >= $${idx}`);
      params.push(from);
      idx++;
    }
    if (to) {
      conditions.push(`created_at <= $${idx}`);
      params.push(to);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totals, topRider] = await Promise.all([
      query(
        `SELECT
           COUNT(*) AS total_orders,
           COUNT(*) FILTER (WHERE status = 'Delivered') AS completed,
           COUNT(*) FILTER (WHERE status IN ('Cancelled', 'Failed')) AS failed,
           COALESCE(SUM(amount) FILTER (WHERE status = 'Delivered'), 0) AS total_revenue
         FROM deliveries ${where}`,
        params
      ),
      query(
        `SELECT r.full_name, COUNT(d.id) AS deliveries
         FROM riders r
         JOIN deliveries d ON d.rider_id = r.id AND d.status = 'Delivered'
         ${from || to ? `WHERE d.created_at >= COALESCE($1, '-infinity'::timestamptz) AND d.created_at <= COALESCE($2, 'infinity'::timestamptz)` : ''}
         GROUP BY r.full_name
         ORDER BY deliveries DESC
         LIMIT 1`,
        from || to ? [from || null, to || null] : []
      ),
    ]);

    const t = totals.rows[0];

    res.json({
      success: true,
      data: {
        total_orders: parseInt(t.total_orders),
        completed: parseInt(t.completed),
        failed: parseInt(t.failed),
        total_revenue: parseFloat(t.total_revenue),
        top_rider: topRider.rows[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
