import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUSH_API_TOKEN = process.env.PUSH_API_TOKEN;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function hasValidPushConfig() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_SERVICE_ROLE_KEY &&
    PUSH_API_TOKEN &&
    VAPID_PUBLIC_KEY &&
    VAPID_PRIVATE_KEY &&
    VAPID_SUBJECT
  );
}

function isAuthorized(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  return Boolean(PUSH_API_TOKEN && header === `Bearer ${PUSH_API_TOKEN}`);
}

/**
 * Server-side Web Push dispatcher.
 * All secrets are supplied through the deployment environment.
 * Dispatch is protected by a server-to-server API token because this endpoint
 * can send notifications to arbitrary users.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) {
      return res.status(503).json({ success: false, error: 'Push notification configuration is incomplete.' });
    }
    return res.status(200).json({
      service: 'Pusat Jual Beli Solo Raya - Web Push Notification Dispatcher',
      status: 'active',
      vapidPublicKey: VAPID_PUBLIC_KEY,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!hasValidPushConfig()) {
    return res.status(503).json({ success: false, error: 'Push notification configuration is incomplete.' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database configuration is incomplete.' });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const itemPayload = Array.isArray(body) ? (body[0] || {}) : (body || {});
    if (typeof itemPayload !== 'object' || Array.isArray(itemPayload)) {
      return res.status(400).json({ success: false, error: 'Invalid request body.' });
    }

    const title = typeof itemPayload.title === 'string' && itemPayload.title.trim()
      ? itemPayload.title.trim().slice(0, 160)
      : '📢 Pusat Jual Beli Solo Raya';
    const message = typeof (itemPayload.body || itemPayload.message) === 'string' && (itemPayload.body || itemPayload.message).trim()
      ? String(itemPayload.body || itemPayload.message).trim().slice(0, 1000)
      : 'Ada pembaruan sistem dan barang seken terbaru di Solo Raya! Buka aplikasi sekarang.';
    const url = typeof itemPayload.url === 'string' && itemPayload.url.trim()
      ? itemPayload.url.trim().slice(0, 2048)
      : '/';
    const icon = typeof (itemPayload.icon || itemPayload.image) === 'string'
      ? String(itemPayload.icon || itemPayload.image).trim().slice(0, 2048)
      : '/assets/img/app-logo.png?v=2.1';
    const badge = typeof itemPayload.badge === 'string'
      ? itemPayload.badge.trim().slice(0, 2048)
      : '/assets/img/app-logo.png?v=2.1';
    const tag = typeof itemPayload.tag === 'string' && itemPayload.tag.trim()
      ? itemPayload.tag.trim().slice(0, 100)
      : 'solosatset-update';

    let cleanTargetUserIds = [];
    let isTargetSpecified = false;

    if (itemPayload.targetUserIds !== undefined && itemPayload.targetUserIds !== null) {
      isTargetSpecified = true;
      if (Array.isArray(itemPayload.targetUserIds)) {
        cleanTargetUserIds = itemPayload.targetUserIds
          .map(u => (typeof u === 'object' && u !== null ? (u.user_id || u.id || u.userId) : u))
          .filter(Boolean)
          .map(u => String(u).trim())
          .filter(Boolean)
          .slice(0, 500);
      } else if (typeof itemPayload.targetUserIds === 'string' && itemPayload.targetUserIds.trim()) {
        cleanTargetUserIds = [itemPayload.targetUserIds.trim()];
      }
    }

    const cleanTargetUserId = itemPayload.targetUserId ? String(itemPayload.targetUserId).trim() : null;
    if (cleanTargetUserId && !cleanTargetUserIds.includes(cleanTargetUserId)) {
      isTargetSpecified = true;
      cleanTargetUserIds.push(cleanTargetUserId);
    }

    const targetEmail = itemPayload.targetEmail
      ? String(itemPayload.targetEmail).toLowerCase().trim().slice(0, 320)
      : null;

    if (isTargetSpecified && cleanTargetUserIds.length === 0 && !targetEmail) {
      return res.status(200).json({ success: true, sentCount: 0, totalTargets: 0, message: 'Tidak ada target pengguna.' });
    }

    const pushPayload = JSON.stringify({ title, body: message, url, icon, badge, tag, timestamp: Date.now() });
    const subscriptionsMap = new Map();

    let query = supabase.from('push_subscriptions').select('endpoint,p256dh,auth,user_id,user_email');
    if (cleanTargetUserIds.length > 0) query = query.in('user_id', cleanTargetUserIds);
    if (targetEmail) query = query.eq('user_email', targetEmail);

    const { data: dbSubs, error: dbErr } = await query;
    if (dbErr) {
      console.error('[Push Dispatcher] subscription query failed:', dbErr.message);
      return res.status(500).json({ success: false, error: 'Unable to load push subscriptions.' });
    }

    if (Array.isArray(dbSubs)) {
      dbSubs.forEach(s => {
        if (s?.endpoint && s?.p256dh && s?.auth) {
          subscriptionsMap.set(s.endpoint, {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth }
          });
        }
      });
    }

    const allSubs = Array.from(subscriptionsMap.values());
    if (allSubs.length === 0) {
      return res.status(200).json({ success: true, sentCount: 0, totalTargets: 0, message: 'Belum ada perangkat yang terdaftar.' });
    }

    const expiredEndpoints = [];
    let sentCount = 0;
    let failedCount = 0;

    await Promise.allSettled(allSubs.map(async sub => {
      try {
        await webpush.sendNotification(sub, pushPayload);
        sentCount++;
      } catch (err) {
        failedCount++;
        if (err.statusCode === 404 || err.statusCode === 410) expiredEndpoints.push(sub.endpoint);
        console.warn('[Push Error]', err.statusCode || 'network', err.message);
      }
    }));

    if (expiredEndpoints.length > 0) {
      const { error: purgeError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
      if (purgeError) console.warn('[Push Dispatcher] expired endpoint cleanup failed:', purgeError.message);
    }

    return res.status(200).json({
      success: true,
      totalTargets: allSubs.length,
      sentCount,
      failedCount,
      purgedExpired: expiredEndpoints.length,
      message: `Notifikasi push berhasil dikirim ke ${sentCount} dari ${allSubs.length} perangkat aktif.`
    });
  } catch (error) {
    console.error('[Push Dispatch Handler Error]', error);
    return res.status(500).json({ success: false, error: 'Internal push dispatch error.', sentCount: 0 });
  }
}
