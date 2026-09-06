import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Server push storage is not configured.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Serverless Push Subscription Handler
 * Saves & manages W3C Web Push subscriptions in Supabase.
 * Credentials are server-only; there are no embedded credential fallbacks.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) {
      return res.status(503).json({ success: false, error: 'Push service is not configured.' });
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

    const { action = 'subscribe', subscription, userId, userEmail } = body || {};
    if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.endpoint.trim()) {
      return res.status(400).json({ success: false, error: 'Subscription data with endpoint is required.' });
    }

    const endpoint = subscription.endpoint.trim();
    const p256dh = typeof subscription.keys?.p256dh === 'string' ? subscription.keys.p256dh.trim() : '';
    const auth = typeof subscription.keys?.auth === 'string' ? subscription.keys.auth.trim() : '';
    const safeUserId = userId == null ? null : String(userId).trim().slice(0, 128) || null;
    const safeUserEmail = userEmail == null ? null : String(userEmail).trim().toLowerCase().slice(0, 320) || null;
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 500);

    if (action === 'unsubscribe') {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
      if (error) {
        console.error('[Push Subscribe] Unsubscribe error:', error.message);
        return res.status(500).json({ success: false, error: 'Unable to unsubscribe device.' });
      }
      return res.status(200).json({ success: true, message: 'Unsubscribed successfully.' });
    }

    if (action !== 'subscribe') {
      return res.status(400).json({ success: false, error: 'Unsupported subscription action.' });
    }

    if (!p256dh || !auth) {
      return res.status(400).json({ success: false, error: 'Invalid subscription keys.' });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert([{
        endpoint,
        p256dh,
        auth,
        user_id: safeUserId,
        user_email: safeUserEmail,
        user_agent: userAgent,
        updated_at: new Date().toISOString()
      }], { onConflict: 'endpoint' });

    if (error) {
      console.error('[Push Subscribe] Subscription save error:', error.message);
      return res.status(500).json({ success: false, error: 'Unable to save push subscription.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Perangkat Anda berhasil terdaftar untuk menerima Notifikasi Web Push SoloSatSet.',
      savedToTable: true
    });
  } catch (error) {
    console.error('[Push Subscribe Handler Error]', error);
    if (error?.message === 'Server push storage is not configured.') {
      return res.status(503).json({ success: false, error: 'Push service is not configured.' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
