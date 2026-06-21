import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

/**
 * Verify Bearer JWT token and attach admin to req.admin
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
    }

    // Fetch fresh admin data from DB
    const { rows } = await query(
      'SELECT id, full_name, email, role, is_active FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: 'Admin account not found or deactivated.',
      });
    }

    req.admin = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

export default auth;
