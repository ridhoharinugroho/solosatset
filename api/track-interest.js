import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ success: false, error: 'Database configuration is incomplete.' });
  }

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required.' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return res.status(401).json({ success: false, error: 'Invalid authentication token.' });
    }

    const authenticatedUserId = authData.user.id;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { categoryId } = body || {};
    if (!categoryId || categoryId === 'all') {
      return res.status(400).json({ success: false, error: 'Missing categoryId.' });
    }

    const cleanCatId = String(categoryId).toLowerCase().trim().slice(0, 100);
    if (!cleanCatId) return res.status(400).json({ success: false, error: 'Invalid categoryId.' });

    const { data: uData, error: readError } = await supabase
      .from('users')
      .select('interests')
      .eq('id', authenticatedUserId)
      .maybeSingle();

    if (readError) return res.status(500).json({ success: false, error: 'Unable to read user interests.' });

    let interests = Array.isArray(uData?.interests) ? [...uData.interests] : [];
    interests = interests.filter((item) => String(item).toLowerCase().trim() !== cleanCatId);
    interests.push(cleanCatId);
    while (interests.length > 3) interests.shift();

    const { error: updateError } = await supabase
      .from('users')
      .update({ interests })
      .eq('id', authenticatedUserId);

    if (updateError) return res.status(500).json({ success: false, error: 'Unable to save interests.' });

    return res.status(200).json({ success: true, categoryId: cleanCatId, interests });
  } catch (error) {
    console.error('[Track Interest]', error);
    return res.status(500).json({ success: false, error: 'Interest tracking failed.' });
  }
}
