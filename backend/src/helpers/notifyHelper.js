import { query } from '../config/db.js';
import { getFirebaseAdmin } from '../config/firebase.js';

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

function stringifyData(data) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null) out[key] = String(value);
  }
  return out;
}

/**
 * Send push notification via FCM (if device token exists).
 */
export async function sendPushNotification(userId, { title, body, data = {} }) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.warn(`[Push] Firebase Admin not initialized — skipping push for user ${userId}`);
    return;
  }

  try {
    const { rows } = await query(
      'SELECT token FROM device_tokens WHERE user_id = $1',
      [userId]
    );
    if (!rows.length) return;

    const tokens = rows.map((r) => r.token);
    const message = {
      notification: { title, body },
      data: stringifyData(data),
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    response.responses.forEach((resp, idx) => {
      if (resp.error?.code === 'messaging/registration-token-not-registered') {
        query('DELETE FROM device_tokens WHERE token = $1', [tokens[idx]]);
      }
    });

    const sent = response.successCount;
    if (sent > 0) {
      console.log(`[Push] Sent to user ${userId} (${sent}/${tokens.length} devices)`);
    }
  } catch (err) {
    console.error('[Push] Send failed:', err?.message || err);
  }
}

/**
 * Create in-app notification + send push (combined helper).
 */
export async function notifyUser(userId, { title, message, pushBody, data = {} }) {
  await createNotification(userId, { title, message });
  await sendPushNotification(userId, {
    title,
    body: pushBody || message,
    data: { ...data, title, body: pushBody || message },
  });
}
