import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Interest service is not configured.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Serverless User Interest Tracking Endpoint
 * Uses server-only Supabase service credentials.
 * NOTE: user authorization must be supplied by a trusted server session/token before production use.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const supabase = getAdminClient();

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
      }
    }

    const { userId, categoryId } = body || {};
    const cleanUserId = userId == null ? '' : String(userId).trim().slice(0, 128);
    const cleanCatId = categoryId == null ? '' : String(categoryId).trim().toLowerCase().slice(0, 128);

    if (!cleanUserId || !cleanCatId || cleanCatId === 'all') {
      return res.status(400).json({ success: false, error: 'Missing userId or categoryId' });
    }

    // Authorization is intentionally not guessed here: the current app uses a client-managed
    // custom session rather than a server-verifiable auth token. Keep this endpoint isolated
    // from client credentials until a trusted session mechanism is introduced.
    const { data: uData, error: uErr } = await supabase
      .from('users')
      .select('interests')
      .eq('id', cleanUserId)
      .maybeSingle();

    if (uErr) {
      console.error('[Serverless Track Interest] users select error:', uErr.message);
      return res.status(500).json({ success: false, error: 'Unable to load user interests.' });
    }

    let interests = Array.isArray(uData?.interests) ? [...uData.interests] : [];
    interests = interests.filter((value) => String(value).toLowerCase().trim() !== cleanCatId);
    interests.push(cleanCatId);
    while (interests.length > 3) interests.shift();

    const { error: updError } = await supabase
      .from('users')
      .update({ interests })
      .eq('id', cleanUserId);

    if (updError) {
      console.error('[Serverless Track Interest] update error:', updError.message);
      return res.status(500).json({ success: false, error: 'Unable to save user interests.' });
    }

    return res.status(200).json({
      success: true,
      userId: cleanUserId,
      categoryId: cleanCatId,
      interests
    });
  } catch (error) {
    console.error('[Serverless Track Interest Error]', error);
    if (error?.message === 'Interest service is not configured.') {
      return res.status(503).json({ success: false, error: 'Interest service is not configured.' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
