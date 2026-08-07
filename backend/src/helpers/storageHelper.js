import { createClient } from '@supabase/supabase-js';

const BUCKET = 'delivery-images';

let supabase = null;
let bucketReady = false;
let bucketCheck = null;

const getSupabase = () => {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
};

const ensureBucket = async () => {
  if (bucketReady) return true;
  const client = getSupabase();
  if (!client) return false;
  try {
    await client.storage.createBucket(BUCKET, { public: true });
  } catch {
    // Bucket already exists or we cannot create it — proceed and let upload error surface
  }
  bucketReady = true;
  return true;
};

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success, or null if storage is not configured / upload fails.
 */
export const uploadToStorage = async (buffer, filename, contentType) => {
  const client = getSupabase();
  if (!client) return null;
  try {
    await ensureBucket();
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const { error } = await client.storage
      .from(BUCKET)
      .upload(cleanName, buffer, { contentType: contentType || 'application/octet-stream', upsert: true });
    if (error) throw error;
    const { data } = client.storage.from(BUCKET).getPublicUrl(cleanName);
    return data.publicUrl;
  } catch (err) {
    console.error('Supabase storage upload failed:', err.message);
    return null;
  }
};
