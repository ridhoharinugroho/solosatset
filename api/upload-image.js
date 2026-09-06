import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Storage service is not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Serverless Upload & Delete Image Endpoint
 * Requires the Supabase service-role credential for storage operations.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    if (req.method === 'DELETE' || (body && body.action === 'delete')) {
      const filePath = req.method === 'DELETE' ? (req.query?.filePath || body?.filePath) : body?.filePath;
      const bucket = (req.method === 'DELETE' ? (req.query?.bucket || body?.bucket) : body?.bucket) || 'avatars';
      const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';

      if (!filePath) {
        return res.status(400).json({ success: false, error: 'filePath is required for deletion' });
      }

      const cleanFileName = String(filePath).replace(/^.*[\\/\\]([^\\/\\]+)$/, '$1');
      const { data: delData, error: delError } = await supabase.storage
        .from(targetBucket)
        .remove([cleanFileName]);

      if (delError) {
        console.warn(`[Serverless Storage Delete Notice] ${targetBucket}/${cleanFileName}:`, delError.message || delError);
        return res.status(500).json({ success: false, error: delError.message });
      }

      return res.status(200).json({
        success: true,
        message: 'File berhasil dihapus dari storage',
        bucket: targetBucket,
        file: cleanFileName,
        data: delData
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { imageData, filePath, bucket = 'product-images' } = body || {};
    if (!imageData) {
      return res.status(400).json({ success: false, error: 'imageData is required' });
    }

    const targetBucket = bucket === 'avatars' ? 'avatars' : 'product-images';
    const cleanRandomStr = Math.random().toString(36).substring(2, 10);
    const targetFilePath = filePath ? String(filePath).replace(/[^a-zA-Z0-9_\-\.]/g, '_') : `${targetBucket === 'avatars' ? 'avatar_' : ''}${Date.now()}_${cleanRandomStr}.jpg`;

    let buffer;
    let contentType = 'image/jpeg';

    if (imageData.startsWith('data:')) {
      const parts = imageData.split(';base64,');
      contentType = parts[0].replace('data:', '') || 'image/jpeg';
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }

    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(targetFilePath, buffer, {
        upsert: true,
        contentType,
        cacheControl: '31536000'
      });

    if (error) {
      console.error(`[Serverless Storage Upload Error] ${targetBucket}/${targetFilePath}:`, error.message || error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(targetFilePath);

    return res.status(200).json({
      success: true,
      publicUrl: publicUrlData.publicUrl,
      filePath: targetFilePath,
      bucket: targetBucket
    });
  } catch (err) {
    console.error('[Serverless Storage Exception]:', err.message || err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
