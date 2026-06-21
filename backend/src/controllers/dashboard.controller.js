import { query } from '../config/db.js';

/**
 * GET /api/dashboard/stats
 * Summary cards data
 */
export const getStats = async (req, res, next) => {
  try {
    const [totalOrders, activeDeliveries, availableRiders, revenue] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM deliveries'),
      query(`SELECT COUNT(*) AS count FROM deliveries WHERE status IN ('Accepted','Picked Up','In Transit')`),
      query(`SELECT COUNT(*) AS count FROM riders WHERE status = 'Online' AND is_active = true`),
      query(`SELECT COALESCE(SUM(amount), 0) AS total FROM deliveries WHERE status = 'Delivered'`),
    ]);

    const data = [
      { title: 'Total Orders', value: parseInt(totalOrders.rows[0].count) },
      { title: 'Active Deliveries', value: parseInt(activeDeliveries.rows[0].count) },
      { title: 'Available Riders', value: parseInt(availableRiders.rows[0].count) },
      { title: 'Total Revenue', value: `ETB ${parseFloat(revenue.rows[0].total).toFixed(2)}` },
    ];

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/activity
 * Last 10 recent activity items
 */
export const getActivity = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        d.order_number,
        d.status,
        d.customer_name,
        d.rider_name,
        d.updated_at
      FROM deliveries d
      ORDER BY d.updated_at DESC
      LIMIT 10
    `);

    const data = rows.map(row => ({
      t: row.updated_at,
      m: `Order ${row.order_number} — ${row.status}${row.rider_name ? ` (Rider: ${row.rider_name})` : ''}`,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/chart
 * Daily orders last 7 days + monthly revenue last 6 months
 */
export const getChartData = async (req, res, next) => {
  try {
    // Daily orders for last 7 days
    const dailyResult = await query(`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'Dy') AS day,
        COUNT(*) AS value
      FROM deliveries
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at), TO_CHAR(created_at AT TIME ZONE 'UTC', 'Dy')
      ORDER BY DATE_TRUNC('day', created_at)
    `);

    // Monthly revenue for last 6 months
    const monthlyResult = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        COALESCE(SUM(amount), 0) AS value
      FROM deliveries
      WHERE
        status = 'Delivered'
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    res.json({
      success: true,
      data: {
        daily: dailyResult.rows.map(r => ({ day: r.day, value: parseInt(r.value) })),
        monthly: monthlyResult.rows.map(r => ({
          month: r.month,
          value: parseFloat(r.value),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/quick-stats
 */
export const getQuickStats = async (req, res, next) => {
  try {
    const [todayOrders, totalRiders, onlineRiders, avgTime, satisfaction] = await Promise.all([
      query(`
        SELECT COUNT(*) AS count FROM deliveries
        WHERE DATE(created_at) = CURRENT_DATE
      `),
      query('SELECT COUNT(*) AS count FROM riders WHERE is_active = true'),
      query(`SELECT COUNT(*) AS count FROM riders WHERE status = 'Online' AND is_active = true`),
      query(`
        SELECT COALESCE(
          ROUND(
            AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 60)
          ), 0
        ) AS avg_minutes
        FROM deliveries d
        WHERE d.status = 'Delivered'
          AND d.updated_at > d.created_at
      `),
      query(`
        SELECT COALESCE(
          ROUND(AVG(r.rating)::numeric, 2), 0
        ) AS avg_rating
        FROM riders r
        WHERE r.is_active = true
      `),
    ]);

    res.json({
      success: true,
      data: {
        today_orders: parseInt(todayOrders.rows[0].count),
        avg_delivery_time: parseInt(avgTime.rows[0].avg_minutes),
        customer_satisfaction: parseFloat(satisfaction.rows[0].avg_rating),
        active_riders: parseInt(onlineRiders.rows[0].count),
        total_riders: parseInt(totalRiders.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
};
