/**
 * Production database health endpoint.
 * Runtime never creates/changes schema. Apply schema changes through Supabase migrations.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ success: false, error: 'Database configuration is incomplete.' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const checks = {};
    const { error: usersError } = await supabase.from('users').select('id').limit(1);
    checks.users = usersError ? 'error' : 'ok';
    if (usersError) console.warn('[DB health] users:', usersError.message);

    const { error: listingsError } = await supabase.from('listings').select('id').limit(1);
    checks.listings = listingsError ? 'error' : 'ok';
    if (listingsError) console.warn('[DB health] listings:', listingsError.message);

    const healthy = checks.users === 'ok' && checks.listings === 'ok';
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      database: healthy ? 'connected' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DB health]', error);
    return res.status(503).json({ success: false, error: 'Database health check failed.' });
  }
}
