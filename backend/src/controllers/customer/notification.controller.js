import { query } from '../../config/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [listResult, unreadResult, totalResult] = await Promise.all([
      query(
        'SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user.id, parseInt(limit), offset]
      ),
      query(
        'SELECT COUNT(*) AS unread FROM user_notifications WHERE user_id = $1 AND is_read = false',
        [req.user.id]
      ),
      query('SELECT COUNT(*) AS total FROM user_notifications WHERE user_id = $1', [req.user.id]),
    ]);

    res.json({
      success: true,
      data: listResult.rows,
      unread_count: parseInt(unreadResult.rows[0].unread),
      total: parseInt(totalResult.rows[0].total),
      pagination: { page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE user_notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Notification not found' });

    const unread = await query(
      'SELECT COUNT(*) AS unread FROM user_notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ success: true, data: rows[0], unread_count: parseInt(unread.rows[0].unread) });
  } catch (err) { next(err); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await query(
      'UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read', unread_count: 0 });
  } catch (err) { next(err); }
};

export const registerDeviceToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    await query(
      'INSERT INTO device_tokens (user_id, token, platform) VALUES ($1, $2, $3) ON CONFLICT (user_id, token) DO UPDATE SET platform = EXCLUDED.platform',
      [req.user.id, token, platform || 'android']
    );

    res.json({ success: true, message: 'Device token registered' });
  } catch (err) { next(err); }
};

export const removeDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    await query('DELETE FROM device_tokens WHERE user_id = $1 AND token = $2', [req.user.id, token]);
    res.json({ success: true, message: 'Device token removed' });
  } catch (err) { next(err); }
};
