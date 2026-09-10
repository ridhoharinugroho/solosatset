import { createClient } from '@supabase/supabase-js';
import { getUserSessionFromRequest } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server push storage is not configured.');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) return res.status(503).json({ success: false, error: 'Push service is not configured.' });
    return res.status(200).json({ service: 'Pusat Jual Beli Solo Raya - Web Push Subscription Engine', vapidPublicKey: VAPID_PUBLIC_KEY, status: 'active' });
  }
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const session = getUserSessionFromRequest(req);
  if (!session?.sub) return res.status(401).json({ success: false, error: 'Authentication required.' });

  try {
    const supabase = getAdminClient();
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'Invalid JSON body.' }); }
    }

    const action = String(body?.action || 'subscribe').trim().toLowerCase();
    const subscription = body?.subscription;
    if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.endpoint.trim()) {
      return res.status(400).json({ success: false, error: 'Subscription data with endpoint is required.' });
    }

    const endpoint = subscription.endpoint.trim();
    const p256dh = typeof subscription.keys?.p256dh === 'string' ? subscription.keys.p256dh.trim() : '';
    const auth = typeof subscription.keys?.auth === 'string' ? subscription.keys.auth.trim() : '';
    const userId = String(session.sub).trim().slice(0, 128);

    // Security: Verify user status in DB
    const { data: authUser, error: authErr } = await supabase.from('users').select('email, status, deleted_at').eq('id', userId).maybeSingle();
    if (authErr || !authUser) return res.status(401).json({ success: false, error: 'Authentication failed. User account not found.' });
    const statusStr = String(authUser.status || 'active').toLowerCase();
    if (authUser.deleted_at || statusStr === 'deleted' || statusStr === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account is suspended or deleted.' });
    }

    if (action === 'unsubscribe') {
      const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId);
      if (error) { console.error('[Push Subscribe] Unsubscribe error:', error.message); return res.status(500).json({ success: false, error: 'Unable to unsubscribe device.' }); }
      return res.status(200).json({ success: true, message: 'Unsubscribed successfully.' });
    }
    if (action !== 'subscribe') return res.status(400).json({ success: false, error: 'Unsupported subscription action.' });
    if (!p256dh || !auth) return res.status(400).json({ success: false, error: 'Invalid subscription keys.' });

    const { data: user, error: userError } = await supabase.from('users').select('id,email,status,deleted_at').eq('id', userId).maybeSingle();
    if (userError) return res.status(500).json({ success: false, error: 'Unable to verify user.' });
    if (!user || user.deleted_at || String(user.status || 'active').toLowerCase() === 'deleted') return res.status(401).json({ success: false, error: 'Authentication required.' });

    const { error } = await supabase.from('push_subscriptions').upsert([{ endpoint, p256dh, auth, user_id: userId, user_email: user.email || null, user_agent: String(req.headers['user-agent'] || 'unknown').slice(0, 500), updated_at: new Date().toISOString() }], { onConflict: 'endpoint' });
    if (error) { console.error('[Push Subscribe] Subscription save error:', error.message); return res.status(500).json({ success: false, error: 'Unable to save push subscription.' }); }
    return res.status(200).json({ success: true, message: 'Perangkat Anda berhasil terdaftar untuk menerima Notifikasi Web Push SoloSatSet.', savedToTable: true });
  } catch (error) {
    console.error('[Push Subscribe Handler Error]', { name: error?.name, message: error?.message });
    if (error?.message === 'Server push storage is not configured.') return res.status(503).json({ success: false, error: 'Push service is not configured.' });
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
