import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

function getBearerToken(req) {
  const value = req.headers?.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : null;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) {
      return res.status(503).json({ success: false, error: 'Push notifications are not configured.' });
    }
    return res.status(200).json({
      service: 'Pusat Jual Beli Solo Raya - Web Push Subscription Engine',
      vapidPublicKey: VAPID_PUBLIC_KEY,
      status: 'active'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, error: 'Push service is not configured.' });
  }

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required.' });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let sessionUser;
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ success: false, error: 'Invalid authentication.' });
    sessionUser = data.user;
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid authentication.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { action = 'subscribe', subscription } = body || {};
    if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.endpoint.startsWith('https://')) {
      return res.status(400).json({ success: false, error: 'Valid subscription endpoint is required.' });
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (action === 'unsubscribe') {
      const { error } = await admin.from('push_subscriptions').delete()
        .eq('endpoint', endpoint)
        .eq('user_id', sessionUser.id);
      if (error) return res.status(500).json({ success: false, error: 'Unable to unsubscribe device.' });
      return res.status(200).json({ success: true, message: 'Unsubscribed successfully.' });
    }

    if (!p256dh || !auth) {
      return res.status(400).json({ success: false, error: 'Invalid subscription keys.' });
    }

    const subRecord = {
      endpoint,
      p256dh,
      auth,
      user_id: sessionUser.id,
      user_email: sessionUser.email || null,
      user_agent: userAgent,
      updated_at: new Date().toISOString()
    };

    const { error: upsertErr } = await admin
      .from('push_subscriptions')
      .upsert([subRecord], { onConflict: 'endpoint' });

    if (upsertErr) {
      console.error('[Push Subscribe] Database error:', upsertErr.message);
      return res.status(500).json({ success: false, error: 'Unable to save push subscription.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Perangkat Anda berhasil terdaftar untuk menerima Notifikasi Web Push SoloSatSet.'
    });
  } catch (error) {
    console.error('[Push Subscribe Handler Error]', error);
    return res.status(500).json({ success: false, error: 'Push subscription operation failed.' });
  }
}
