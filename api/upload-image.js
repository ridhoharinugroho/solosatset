import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getUserSessionFromRequest } from '../server/user-session.js';
import { isAdminRequest } from './admin-auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_SIGNATURES = {
  'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer) => buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
};

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

function sanitizeStoragePath(value) {
  const segments = String(value || '').split('/').map((segment) => segment.trim()).filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..' || !/^[a-zA-Z0-9_.-]+$/.test(segment))) return null;
  return segments.join('/');
}

function decodeImageData(imageData) {
  if (typeof imageData !== 'string') return null;
  if (!imageData.startsWith('data:')) return { buffer: Buffer.from(imageData, 'base64'), declaredType: null };
  const match = imageData.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) return null;
  const declaredType = String(match[1] || '').toLowerCase().trim();
  const buffer = Buffer.from(match[2], 'base64');
  return { buffer, declaredType };
}

function validateImage(buffer, declaredType) {
  if (!buffer?.length) return { ok: false, error: 'Invalid image data.' };
  if (buffer.length > MAX_IMAGE_BYTES) return { ok: false, error: 'Ukuran gambar terlalu besar.' };
  if (declaredType && !IMAGE_SIGNATURES[declaredType]) return { ok: false, error: 'Format gambar tidak didukung.' };
  const detectedType = Object.entries(IMAGE_SIGNATURES).find(([, check]) => check(buffer))?.[0] || null;
  if (!detectedType) return { ok: false, error: 'Data bukan file gambar JPEG, PNG, atau WebP yang valid.' };
  if (declaredType && declaredType !== detectedType) return { ok: false, error: 'Tipe konten gambar tidak sesuai dengan isi file.' };
  return { ok: true, contentType: detectedType };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const authenticatedUser = getUserSessionFromRequest(req);
  const authenticatedAdmin = isAdminRequest(req);
  if (!authenticatedUser?.sub && !authenticatedAdmin) return res.status(401).json({ success: false, error: 'Authentication required.' });

  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Storage service is not configured on the server.' });

  let authUserId = authenticatedUser?.sub;
  if (!authenticatedAdmin && authUserId) {
    // Security: Verify user status in DB
    const { data: authUser, error: authErr } = await supabase.from('users').select('status, deleted_at').eq('id', authUserId).maybeSingle();
    if (authErr || !authUser) return res.status(401).json({ success: false, error: 'Authentication failed. User account not found.' });
    const statusStr = String(authUser.status || 'active').toLowerCase();
    if (authUser.deleted_at || statusStr === 'deleted' || statusStr === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account is suspended or deleted.' });
    }
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    if (req.method === 'DELETE' || body?.action === 'delete') {
      if (!authenticatedAdmin) return res.status(403).json({ success: false, error: 'Admin authentication required for storage deletion.' });
      const filePath = req.method === 'DELETE' ? (req.query?.filePath || body?.filePath) : body?.filePath;
      const bucket = (req.method === 'DELETE' ? (req.query?.bucket || body?.bucket) : body?.bucket) || 'avatars';
      const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';
      const cleanFilePath = sanitizeStoragePath(filePath);
      if (!cleanFilePath) return res.status(400).json({ success: false, error: 'Invalid file path.' });
      const { error } = await supabase.storage.from(targetBucket).remove([cleanFilePath]);
      if (error) return res.status(500).json({ success: false, error: 'File gagal dihapus dari storage.' });
      return res.status(200).json({ success: true, bucket: targetBucket, file: cleanFilePath });
    }

    const { imageData, bucket = 'product-images' } = body || {};
    if (!imageData) return res.status(400).json({ success: false, error: 'imageData is required' });

    const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';
    const randomId = crypto.randomUUID();
    const ownerId = String(authenticatedUser?.sub || 'admin').replace(/[^a-zA-Z0-9_-]/g, '_');
    const generatedFilePath = `${ownerId}/${targetBucket === 'avatars' ? 'avatar' : 'image'}_${randomId}.jpg`;

    const decoded = decodeImageData(imageData);
    const validation = validateImage(decoded?.buffer, decoded?.declaredType);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });

    const { error } = await supabase.storage.from(targetBucket).upload(generatedFilePath, decoded.buffer, {
      upsert: false,
      contentType: validation.contentType,
      cacheControl: '31536000'
    });
    if (error) return res.status(500).json({ success: false, error: 'File gagal diunggah ke storage.' });
    const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(generatedFilePath);
    return res.status(200).json({ success: true, publicUrl: publicUrlData.publicUrl, filePath: generatedFilePath, bucket: targetBucket });
  } catch (error) {
    console.error('[Storage Error]', { name: error.name, message: error.message });
    return res.status(500).json({ success: false, error: 'Storage request failed.' });
  }
}
