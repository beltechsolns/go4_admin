import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';
import { syncCustomerToAdmin } from '../../helpers/adminSync.js';

const googleClient = new OAuth2Client();

const generateToken = (userId, email, role) =>
  jwt.sign({ user_id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

const findOrCreateSocialUser = async (name, email, avatar, provider, providerId) => {
  // Check if user exists by email
  let { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);

  if (rows.length) {
    // Update avatar if empty
    if (!rows[0].avatar && avatar) {
      await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, rows[0].id]);
      rows[0].avatar = avatar;
    }
    // Sync existing user into admin panel
    await syncCustomerToAdmin(rows[0]);
    return rows[0];
  }

  // Check emails across other tables
  const [existingRider, existingAdmin] = await Promise.all([
    query('SELECT id FROM riders WHERE email = $1', [email]),
    query('SELECT id FROM admins WHERE email = $1', [email]),
  ]);
  if (existingRider.rows.length || existingAdmin.rows.length) return null;

  // Create new customer
  const hash = await bcrypt.hash(providerId, 10);
  const { rows: newUser } = await query(
    'INSERT INTO users (name, email, password_hash, role, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, email, hash, 'customer', avatar || null]
  );
  // Sync new user into admin panel
  await syncCustomerToAdmin(newUser[0]);
  return newUser[0];
};

export const googleLogin = async (req, res, next) => {
  try {
    const id_token = req.body.id_token || req.body.idToken || req.body.token;
    if (!id_token)
      return res.status(400).json({ success: false, message: 'Google ID token is required' });

    const ticket = await googleClient.verifyIdToken({
      id_token,
      audience: process.env.GOOGLE_CLIENT_ID || undefined,
    });

    const payload = ticket.getPayload();
    const { name, email, picture, sub: googleId } = payload;

    const user = await findOrCreateSocialUser(name, email, picture, 'google', googleId);
    if (!user)
      return res.status(409).json({ success: false, message: 'Email already registered with another login method' });

    const token = generateToken(user.id, user.email, user.role);
    const { password_hash, ...safe } = user;

    res.json({ success: true, data: { user: safe, token } });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token') || err.message?.includes('Invalid audience'))
      return res.status(401).json({ success: false, message: 'Invalid Google token: ' + err.message });
    next(err);
  }
};

export const facebookLogin = async (req, res, next) => {
  try {
    const access_token = req.body.access_token || req.body.accessToken || req.body.token;
    if (!access_token)
      return res.status(400).json({ success: false, message: 'Facebook access token is required' });

    // Verify token and get user info from Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(access_token)}`
    );
    const data = await response.json();

    if (data.error)
      return res.status(401).json({ success: false, message: data.error.message || 'Invalid Facebook token' });

    const { name, email, picture, id: facebookId } = data;
    if (!email)
      return res.status(400).json({ success: false, message: 'Facebook account must have an email. Please use another login method.' });

    const avatar = picture?.data?.url || null;

    const user = await findOrCreateSocialUser(name, email, avatar, 'facebook', facebookId);
    if (!user)
      return res.status(409).json({ success: false, message: 'Email already registered with another login method' });

    const token = generateToken(user.id, user.email, user.role);
    const { password_hash, ...safe } = user;

    res.json({ success: true, data: { user: safe, token } });
  } catch (err) { next(err); }
};
