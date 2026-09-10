import { createClient } from '@supabase/supabase-js';
import { getUserSessionFromRequest } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Interest service is not configured.');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const session = getUserSessionFromRequest(req);
  if (!session?.sub) return res.status(401).json({ success: false, error: 'Authentication required.' });

  try {
    const supabase = getAdminClient();
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'Invalid JSON body.' }); }
    }

    const cleanCatId = body?.categoryId == null ? '' : String(body.categoryId).trim().toLowerCase().slice(0, 128);
    if (!cleanCatId || cleanCatId === 'all') return res.status(400).json({ success: false, error: 'Missing categoryId' });

    const userId = String(session.sub).trim().slice(0, 128);
    const { data: uData, error: uErr } = await supabase.from('users').select('id,interests,status,deleted_at').eq('id', userId).maybeSingle();
    if (uErr || !uData) {
      console.error('[Serverless Track Interest] users select error:', uErr?.message);
      return res.status(401).json({ success: false, error: 'Authentication failed. User account not found.' });
    }
    const statusStr = String(uData.status || 'active').toLowerCase();
    if (uData.deleted_at || statusStr === 'deleted' || statusStr === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account is suspended or deleted.' });
    }

    let interests = Array.isArray(uData.interests) ? [...uData.interests] : [];
    interests = interests.filter((value) => String(value).toLowerCase().trim() !== cleanCatId);
    interests.push(cleanCatId);
    while (interests.length > 3) interests.shift();

    const { error: updError } = await supabase.from('users').update({ interests }).eq('id', userId);
    if (updError) {
      console.error('[Serverless Track Interest] update error:', updError.message);
      return res.status(500).json({ success: false, error: 'Unable to save user interests.' });
    }

    return res.status(200).json({ success: true, categoryId: cleanCatId, interests });
  } catch (error) {
    console.error('[Serverless Track Interest Error]', { name: error?.name, message: error?.message });
    if (error?.message === 'Interest service is not configured.') return res.status(503).json({ success: false, error: 'Interest service is not configured.' });
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
