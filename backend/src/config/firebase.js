import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;

/**
 * Initialize Firebase Admin SDK from env vars.
 * Supports:
 * - FIREBASE_SERVICE_ACCOUNT (JSON string or path to JSON file)
 * - FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)
 * - individual fields: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
export function initFirebase() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  try {
    // Primary: single env var that may contain the full JSON or a file path
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (svc) {
      let cred = null;
      // If it looks like JSON, parse it
      if (svc.trim().startsWith('{')) {
        try {
          cred = JSON.parse(svc);
        } catch (e) {
          console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT JSON string');
        }
      }

      // If not parsed, treat as a file path
      if (!cred) {
        try {
          const p = path.isAbsolute(svc) ? svc : path.join(process.cwd(), svc);
          if (fs.existsSync(p)) {
            const file = fs.readFileSync(p, 'utf8');
            cred = JSON.parse(file);
          }
        } catch (e) {
          console.warn('Could not read FIREBASE_SERVICE_ACCOUNT file:', e.message);
        }
      }

      if (cred) {
        admin.initializeApp({ credential: admin.credential.cert(cred) });
        initialized = true;
        console.log('✅ Firebase Admin initialized');
        return admin;
      }
    }

    // Fallback: individual env fields
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      initialized = true;
      console.log('✅ Firebase Admin initialized');
      return admin;
    }

    console.warn('⚠️ Firebase Admin not configured — push notifications disabled');
    return null;
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
    return null;
  }
}

export function getFirebaseAdmin() {
  if (!initialized && !admin.apps.length) initFirebase();
  return admin.apps.length ? admin : null;
}
