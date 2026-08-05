import { query } from '../config/db.js';

// Map a users.id (from JWT) to the riders.id record
export async function resolveRiderId(userId) {
  const { rows } = await query(
    'SELECT id FROM riders WHERE user_id = $1',
    [userId]
  );
  if (rows.length) return rows[0].id;

  // Fallback: match by phone
  const { rows: user } = await query('SELECT phone FROM users WHERE id = $1', [userId]);
  if (!user.length) return null;
  const { rows: byPhone } = await query('SELECT id FROM riders WHERE phone = $1', [user[0].phone]);
  return byPhone.length ? byPhone[0].id : null;
}
