import { query } from '../../config/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE user_notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
