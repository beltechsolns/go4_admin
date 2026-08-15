import { query } from '../config/db.js';

/**
 * Insert an in-app notification for a user.
 */
export async function createNotification(userId, { title, message }) {
  try {
    await query(
      'INSERT INTO user_notifications (user_id, title, message) VALUES ($1, $2, $3)',
      [userId, title, message]
    );
  } catch (err) {
    console.error('[Notification] Insert failed:', err.message);
  }
}

/**
 * Send push notification via FCM (if device token exists).
 * Requires firebase-admin SDK initialized.
 */
let admin = null;
try {
  const firebaseAdmin = await import('firebase-admin');
  if (firebaseAdmin.default?.apps?.length) {
    admin = firebaseAdmin.default;
  }
} catch {
  // firebase-admin not installed — push disabled
}

export async function sendPushNotification(userId, { title, body, data = {} }) {
  if (!admin) return;

  try {
    const { rows } = await query(
      'SELECT token FROM device_tokens WHERE user_id = $1',
      [userId]
    );
    if (!rows.length) return;

    const tokens = rows.map(r => r.token);
    const message = {
      notification: { title, body },
      data,
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    // Remove invalid tokens
    response.responses.forEach((resp, idx) => {
      if (resp.error?.code === 'messaging/registration-token-not-registered') {
        query('DELETE FROM device_tokens WHERE token = $1', [tokens[idx]]);
      }
    });
  } catch (err) {
    console.error('[Push] Send failed:', err.message);
  }
}

/**
 * Create in-app notification + send push (combined helper).
 */
export async function notifyUser(userId, { title, message, pushBody }) {
  await createNotification(userId, { title, message });
  await sendPushNotification(userId, { title, body: pushBody || message });
}
