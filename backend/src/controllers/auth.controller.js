import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const { rows } = await query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.admin.id,
        full_name: req.admin.full_name,
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters.',
      });
    }

    // Fetch full admin record with hash
    const { rows } = await query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Admin not found.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(current_password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await query(
      'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, req.admin.id]
    );

    res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) {
    next(err);
  }
};
