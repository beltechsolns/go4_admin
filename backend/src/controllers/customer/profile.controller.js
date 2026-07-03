import { query } from '../../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (phone && phone.length < 5) return res.status(400).json({ success: false, message: 'Invalid phone number' });

    const { rows } = await query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone, role, avatar, created_at',
      [name, phone, req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const avatarPath = '/uploads/' + req.file.filename;
    const { rows } = await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, phone, role, avatar, created_at', [avatarPath, req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
