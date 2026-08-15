import fs from 'fs/promises';
import { query } from '../../config/db.js';
import { uploadToStorage } from '../../helpers/storageHelper.js';

const BASE_URL = process.env.BASE_URL || 'https://go4-admin.onrender.com';

export const getProfile = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const user = rows[0];
    if (user.avatar && user.avatar.startsWith('/uploads/')) user.avatar = BASE_URL + user.avatar;
    res.json({ success: true, data: user });
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
    const user = rows[0];
    if (user.avatar && user.avatar.startsWith('/uploads/')) user.avatar = BASE_URL + user.avatar;
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const buffer = await fs.readFile(req.file.path);
    const publicUrl = await uploadToStorage(buffer, req.file.filename, req.file.mimetype);
    const avatarUrl = publicUrl || BASE_URL + '/uploads/' + req.file.filename;
    const { rows } = await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, phone, role, avatar, created_at', [avatarUrl, req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const setAvatarUrl = async (req, res, next) => {
  try {
    const { avatar_url } = req.body;
    if (!avatar_url) return res.status(400).json({ success: false, message: 'avatar_url is required' });
    const { rows } = await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, phone, role, avatar, created_at', [avatar_url, req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const deleteAvatar = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, phone, role, avatar, created_at',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
