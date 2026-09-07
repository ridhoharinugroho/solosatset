import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_FIELDS = 'id,name,store_name,region,district,avatar,bio,status,deleted_at,is_demo,created_at';

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function clean(value, max = 128) {
  return String(value ?? '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'User directory is not configured on the server.' });

  try {
    const id = clean(req.query?.id, 128);
    const limit = Math.min(Math.max(Number(req.query?.limit) || 200, 1), 500);
    let query = supabase
      .from('users')
      .select(PUBLIC_FIELDS)
      .neq('status', 'deleted')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (id) query = query.eq('id', id);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, users: data || [] });
  } catch (error) {
    console.error('[User Directory Error]', { name: error?.name, message: error?.message });
    return res.status(500).json({ success: false, error: 'User directory gagal dimuat.' });
  }
}
