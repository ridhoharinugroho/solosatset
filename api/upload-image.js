import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Storage service is not configured on the server.' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    if (req.method === 'DELETE' || body?.action === 'delete') {
      const filePath = req.method === 'DELETE' ? (req.query?.filePath || body?.filePath) : body?.filePath;
      const bucket = (req.method === 'DELETE' ? (req.query?.bucket || body?.bucket) : body?.bucket) || 'avatars';
      const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';
      if (!filePath) return res.status(400).json({ success: false, error: 'filePath is required for deletion' });

      const cleanFileName = String(filePath).replace(/^.*[\\/]([^\\/]+)$/, '$1');
      const { error } = await supabase.storage.from(targetBucket).remove([cleanFileName]);
      if (error) return res.status(500).json({ success: false, error: 'File gagal dihapus dari storage.' });
      return res.status(200).json({ success: true, bucket: targetBucket, file: cleanFileName });
    }

    const { imageData, filePath, bucket = 'product-images' } = body || {};
    if (!imageData) return res.status(400).json({ success: false, error: 'imageData is required' });

    const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';
    const cleanRandomStr = cryptoRandomId();
    const targetFilePath = filePath
      ? String(filePath).replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      : `${targetBucket === 'avatars' ? 'avatar_' : ''}${Date.now()}_${cleanRandomStr}.jpg`;

    let buffer;
    let contentType = 'image/jpeg';
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const separator = ';base64,';
      const index = imageData.indexOf(separator);
      if (index === -1) return res.status(400).json({ success: false, error: 'Invalid image data.' });
      contentType = imageData.slice(5, index) || 'image/jpeg';
      buffer = Buffer.from(imageData.slice(index + separator.length), 'base64');
    } else {
      buffer = Buffer.from(String(imageData), 'base64');
    }

    if (!buffer.length) return res.status(400).json({ success: false, error: 'Invalid image data.' });

    const { error } = await supabase.storage.from(targetBucket).upload(targetFilePath, buffer, {
      upsert: true,
      contentType,
      cacheControl: '31536000'
    });
    if (error) return res.status(500).json({ success: false, error: 'File gagal diunggah ke storage.' });

    const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(targetFilePath);
    return res.status(200).json({ success: true, publicUrl: publicUrlData.publicUrl, filePath: targetFilePath, bucket: targetBucket });
  } catch (error) {
    console.error('[Storage Error]', { name: error.name, message: error.message });
    return res.status(500).json({ success: false, error: 'Storage request failed.' });
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10);
}
