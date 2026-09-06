import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) return res.status(503).json({ success: false, error: 'Push notification service is not configured on the server.' });
    return res.status(200).json({ service: 'Pusat Jual Beli Solo Raya - Web Push Notification Dispatcher', status: 'active', vapidPublicKey: VAPID_PUBLIC_KEY, timestamp: new Date().toISOString() });
  }

  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const supabase = getAdminClient();
  if (!supabase || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return res.status(503).json({ success: false, error: 'Push notification service is not configured on the server.' });
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const itemPayload = Array.isArray(body) ? (body[0] || {}) : (body || {});
    const title = String(itemPayload.title || '📢 Pusat Jual Beli Solo Raya');
    const message = String(itemPayload.body || itemPayload.message || 'Ada pembaruan sistem dan barang seken terbaru di Solo Raya! Buka aplikasi sekarang.');
    const url = String(itemPayload.url || 'https://solosatset.vercel.app/');
    const icon = String(itemPayload.icon || itemPayload.image || '/assets/img/app-logo.png?v=2.1');
    const badge = String(itemPayload.badge || '/assets/img/app-logo.png?v=2.1');
    const tag = String(itemPayload.tag || 'solosatset-update');

    let cleanTargetUserIds = [];
    let isTargetSpecified = false;
    if (itemPayload.targetUserIds !== undefined && itemPayload.targetUserIds !== null) {
      isTargetSpecified = true;
      if (Array.isArray(itemPayload.targetUserIds)) {
        cleanTargetUserIds = itemPayload.targetUserIds.map((u) => (typeof u === 'object' && u !== null ? (u.user_id || u.id || u.userId) : u)).filter(Boolean).map((u) => String(u).trim());
      } else if (typeof itemPayload.targetUserIds === 'string' && itemPayload.targetUserIds.trim()) {
        cleanTargetUserIds = [itemPayload.targetUserIds.trim()];
      }
    }
    const cleanTargetUserId = itemPayload.targetUserId ? String(itemPayload.targetUserId).trim() : null;
    if (cleanTargetUserId) {
      isTargetSpecified = true;
      if (!cleanTargetUserIds.includes(cleanTargetUserId)) cleanTargetUserIds.push(cleanTargetUserId);
    }
    const targetEmail = itemPayload.targetEmail ? String(itemPayload.targetEmail).toLowerCase().trim() : null;
    if (isTargetSpecified && cleanTargetUserIds.length === 0 && !targetEmail) return res.status(200).json({ success: true, sentCount: 0, totalTargets: 0, message: 'Tidak ada target pengguna yang valid.' });

    let query = supabase.from('push_subscriptions').select('endpoint,p256dh,auth,user_id,user_email');
    if (cleanTargetUserIds.length > 0) query = query.in('user_id', cleanTargetUserIds);
    if (targetEmail) query = query.eq('user_email', targetEmail);
    const { data: subscriptions, error } = await query;
    if (error) throw error;

    const allSubs = Array.isArray(subscriptions) ? subscriptions.filter((s) => s?.endpoint && s?.p256dh && s?.auth) : [];
    if (allSubs.length === 0) return res.status(200).json({ success: true, sentCount: 0, totalTargets: 0, message: 'Belum ada perangkat pengguna yang terdaftar.' });

    const pushPayload = JSON.stringify({ title, body: message, url, icon, badge, tag, timestamp: Date.now() });
    const expiredEndpoints = [];
    let sentCount = 0;
    let failedCount = 0;

    await Promise.allSettled(allSubs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, pushPayload);
        sentCount += 1;
      } catch (err) {
        failedCount += 1;
        if (err.statusCode === 404 || err.statusCode === 410) expiredEndpoints.push(sub.endpoint);
        console.warn('[Push Error]', err.statusCode || 'network', err.message);
      }
    }));

    if (expiredEndpoints.length > 0) await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    return res.status(200).json({ success: true, sentCount, failedCount, totalTargets: allSubs.length });
  } catch (error) {
    console.error('[Push Dispatcher Error]', { name: error.name, message: error.message });
    return res.status(500).json({ success: false, error: 'Push notification dispatch failed.' });
  }
}