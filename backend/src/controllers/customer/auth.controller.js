import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../config/db.js';

const generateToken = (userId, email, role) =>
  jwt.sign({ user_id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    // Check email across all user types
    const [existingUser, existingRider, existingAdmin] = await Promise.all([
      query('SELECT id FROM users WHERE email = $1', [email]),
      query('SELECT id FROM riders WHERE email = $1', [email]),
      query('SELECT id FROM admins WHERE email = $1', [email]),
    ]);
    if (existingUser.rows.length || existingRider.rows.length || existingAdmin.rows.length)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, phone, role, avatar, created_at',
      [name, email, phone, hash, role === 'rider' ? 'rider' : 'customer']
    );

    const user = rows[0];
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, token } });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user.id, user.email, user.role);
    const { password_hash, ...safe } = user;

    res.json({ success: true, data: { user: safe, token } });
  } catch (err) { next(err); }
};

export const me = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user.id, req.user.email, req.user.role);
    res.json({ success: true, data: { token }, message: 'Token refreshed' });
  } catch (err) { next(err); }
};

export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length) {
      const user = rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expires = new Date(Date.now() + 30 * 60 * 1000);

      await query(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expires]
      );

      console.log(`[PasswordReset] Token for ${email}: ${rawToken}`);
    }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await query(
      'SELECT id, user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
      [tokenHash]
    );

    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, rows[0].user_id]);
    await query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [rows[0].id]);
    await query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL AND id != $2', [rows[0].user_id, rows[0].id]);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) { next(err); }
};
