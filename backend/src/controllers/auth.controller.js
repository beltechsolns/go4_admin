import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendPasswordResetEmail } from '../helpers/emailHelper.js';

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
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await query(
      'SELECT id, email FROM admins WHERE email = $1 AND is_active = true',
      [normalizedEmail]
    );

    // Return a generic success response to avoid account enumeration.
    if (rows.length) {
      const admin = rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const adminAppBaseUrlRaw =
        process.env.ADMIN_APP_BASE_URL || process.env.FRONTEND_URL || process.env.APP_BASE_URL;
      const adminAppBaseUrl = (adminAppBaseUrlRaw || 'http://localhost:5173').replace(/\/+$/, '');
      const adminResetUrl = `${adminAppBaseUrl}/reset-password?token=${rawToken}`;

      await query(
        'INSERT INTO admin_password_resets (admin_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [admin.id, tokenHash, expiresAt]
      );

      try {
        await sendPasswordResetEmail({
          to: admin.email,
          resetToken: rawToken,
          resetUrl: adminResetUrl,
        });
      } catch (mailErr) {
        console.error('[AdminPasswordReset] Email send failed:', mailErr.message);
      }
    }

    return res.json({
      success: true,
      data: { message: 'If the email exists, a reset link has been sent.' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await query(
      'SELECT id, admin_id FROM admin_password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
      [tokenHash]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token.',
      });
    }

    const resetRecord = rows[0];
    const passwordHash = await bcrypt.hash(password, 10);

    await query('UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      resetRecord.admin_id,
    ]);

    await query('UPDATE admin_password_resets SET used_at = NOW() WHERE id = $1', [resetRecord.id]);
    await query(
      'UPDATE admin_password_resets SET used_at = NOW() WHERE admin_id = $1 AND used_at IS NULL AND id != $2',
      [resetRecord.admin_id, resetRecord.id]
    );

    return res.json({
      success: true,
      data: { message: 'Password has been reset successfully.' },
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
