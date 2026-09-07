import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_BUCKETS = new Set(['product-images', 'avatars']);

function unauthorized(res) {
  return res.status(401).json({ success: false, error: 'Authentication required.' });
}

function getSessionToken(req) {
  const header = req.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

function setCors(res) {
  // Same-origin API: bearer authentication does not require credentialed CORS.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ success: false, error: 'Storage service is not configured.' });
  }

  const token = getSessionToken(req);
  if (!token) return unauthorized(res);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let sessionUser;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return unauthorized(res);
    sessionUser = data.user;
  } catch {
    return unauthorized(res);
  }

  try {
    if (req.method === 'DELETE') {
      const bucket = String(req.query?.bucket || 'product-images');
      const filePath = String(req.query?.filePath || '');
      if (!ALLOWED_BUCKETS.has(bucket) || !filePath || filePath.includes('..') || filePath.startsWith('/')) {
        return res.status(400).json({ success: false, error: 'Invalid storage path.' });
      }
      const ownerPrefix = `${sessionUser.id}/`;
      if (!filePath.startsWith(ownerPrefix)) {
        return res.status(403).json({ success: false, error: 'You can only delete your own files.' });
      }
      const { data, error } = await admin.storage.from(bucket).remove([filePath]);
      if (error) return res.status(500).json({ success: false, error: 'Storage deletion failed.' });
      return res.status(200).json({ success: true, data });
    }

    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    const { imageData, bucket = 'product-images', filePath } = req.body || {};
    if (!ALLOWED_BUCKETS.has(bucket) || typeof imageData !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid upload request.' });
    }

    const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!match) return res.status(400).json({ success: false, error: 'Only JPEG, PNG and WebP images are allowed.' });

    const contentType = match[1];
    const base64Payload = match[2];
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Payload) || base64Payload.length % 4 !== 0) {
      return res.status(400).json({ success: false, error: 'Invalid image encoding.' });
    }

    const buffer = Buffer.from(base64Payload, 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({ success: false, error: 'Image must be smaller than 8 MB.' });
    }

    const safeName = String(filePath || `${Date.now()}.jpg`).split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFilePath = `${sessionUser.id}/${safeName}`;
    const { data, error } = await admin.storage.from(bucket).upload(targetFilePath, buffer, {
      upsert: true,
      contentType,
      cacheControl: '31536000'
    });
    if (error) return res.status(500).json({ success: false, error: 'Storage upload failed.' });

    const { data: publicUrlData } = admin.storage.from(bucket).getPublicUrl(targetFilePath);
    return res.status(200).json({ success: true, publicUrl: publicUrlData.publicUrl, filePath: data?.path || targetFilePath, bucket });
  } catch (error) {
    console.error('[Storage API]', error);
    return res.status(500).json({ success: false, error: 'Storage operation failed.' });
  }
}
