import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from './admin-auth.js';
import { getUserSessionFromRequest } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return null; }
  }
  return Array.isArray(body) ? (body[0] || {}) : (body || {});
}

async function sendPushForUsers(supabase, targetUserIds, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT || !targetUserIds.length) {
    return { sentCount: 0, failedCount: 0 };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth,user_id')
    .in('user_id', targetUserIds);
  if (error) throw error;

  const allSubs = Array.isArray(subscriptions) ? subscriptions.filter((s) => s?.endpoint && s?.p256dh && s?.auth) : [];
  const expiredEndpoints = [];
  let sentCount = 0;
  let failedCount = 0;
  const pushPayload = JSON.stringify(payload);

  await Promise.allSettled(allSubs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload
      );
      sentCount += 1;
    } catch (err) {
      failedCount += 1;
      if (err.statusCode === 404 || err.statusCode === 410) expiredEndpoints.push(sub.endpoint);
      console.warn('[Push Error]', err.statusCode || 'network');
    }
  }));

  if (expiredEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }
  return { sentCount, failedCount };
}

async function handleUserNotificationAction(req, res, action) {
  const session = getUserSessionFromRequest(req);
  if (!session?.sub) return res.status(401).json({ success: false, error: 'Authentication required.' });

  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Notification service is not configured on the server.' });
  const userId = clean(session.sub, 128);

  // Security: Verify user status in DB because session HMAC only proves authenticity, not active status
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('status, deleted_at')
    .eq('id', userId)
    .maybeSingle();
    
  if (userError || !user) {
    return res.status(401).json({ success: false, error: 'Authentication failed. User account not found.' });
  }
  const statusStr = String(user.status || 'active').toLowerCase();
  if (user.deleted_at || statusStr === 'deleted' || statusStr === 'suspended') {
    return res.status(403).json({ success: false, error: 'Account is suspended or deleted.' });
  }

  if (action === 'list_notifications') {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.all_users`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.status(200).json({ success: true, notifications: data || [] });
  }

  if (action === 'mark_notification_read') {
    const body = parseBody(req);
    const notificationId = clean(body?.notificationId, 128);
    if (!notificationId) return res.status(400).json({ success: false, error: 'Notification ID is required.' });
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .or(`user_id.eq.${userId},user_id.eq.all_users`);
    if (error) throw error;
    return res.status(200).json({ success: true });
  }

  if (action === 'mark_all_notifications_read') {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${userId},user_id.eq.all_users`);
    if (error) throw error;
    return res.status(200).json({ success: true });
  }

  if (action === 'broadcast_bu_notification') {
    const body = parseBody(req);
    if (!body) return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
    const productId = clean(body.productId, 128);
    const categoryId = clean(body.categoryId || 'umum', 100).toLowerCase();
    if (!productId) return res.status(400).json({ success: false, userCount: 0, error: 'Product ID is required.' });

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id,seller_id,is_bu')
      .eq('id', productId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing || String(listing.seller_id || '') !== userId) {
      return res.status(403).json({ success: false, userCount: 0, error: 'Anda tidak berwenang mengirim notifikasi untuk produk ini.' });
    }
    if (!listing.is_bu) {
      return res.status(400).json({ success: false, userCount: 0, error: 'Produk bukan listing BUTUH UANG.' });
    }

    const { data: targetUsers, error: targetError } = await supabase
      .from('users')
      .select('id,status,deleted_at')
      .contains('interests', [categoryId]);
    if (targetError) throw targetError;

    const targetUserSet = new Set([userId]);
    (targetUsers || []).forEach((user) => {
      if (!user?.id || user.deleted_at || String(user.status || 'active').toLowerCase() === 'deleted') return;
      targetUserSet.add(String(user.id));
    });
    const targetUserIds = Array.from(targetUserSet).slice(0, 500);

    const details = body.productDetails && typeof body.productDetails === 'object' ? body.productDetails : {};
    const rawTitle = clean(details.title, 200);
    const title = rawTitle
      ? (rawTitle.includes('BUTUH UANG') ? rawTitle : `🔥 BUTUH UANG CEPAT: ${rawTitle}`)
      : '🔥 IKLAN BUTUH UANG CEPAT (BU) TERBARU!';
    const message = clean(details.message || `Ada iklan butuh uang cepat (BU) untuk kategori ${categoryId} yang Anda minati! Cek sekarang sebelum keduluan.`, 2000);
    const url = clean(details.url || `/?item=${encodeURIComponent(productId)}`, 1000);
    const image = clean(details.image || '/assets/img/app-logo.png?v=2.1', 500);

    const notifRows = targetUserIds.map((targetId) => ({
      user_id: targetId,
      title,
      message,
      body: message,
      type: 'bu_interest',
      category_id: categoryId,
      product_id: productId,
      listing_id: productId,
      url,
      image,
      is_read: false,
      created_at: new Date().toISOString()
    }));
    const { error: insertError } = await supabase.from('notifications').insert(notifRows);
    if (insertError) throw insertError;

    let push = { sentCount: 0, failedCount: 0 };
    try {
      push = await sendPushForUsers(supabase, targetUserIds, {
        title,
        body: message,
        url,
        icon: image,
        badge: '/assets/img/app-logo.png?v=2.1',
        tag: `bu-${categoryId}-${productId}`,
        timestamp: Date.now()
      });
    } catch (pushError) {
      console.warn('[BU Notification Push Non-blocking Error]', pushError?.message || pushError);
    }

    return res.status(200).json({
      success: true,
      userCount: targetUserIds.length,
      targetUserIds,
      title,
      message,
      sentCount: push.sentCount,
      failedCount: push.failedCount
    });
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const requestedAction = clean(req.query?.action, 64).toLowerCase();
  if (req.method === 'GET' && requestedAction === 'list_notifications') {
    try { return await handleUserNotificationAction(req, res, requestedAction); }
    catch (error) {
      console.error('[Notifications GET Error]', { name: error?.name, message: error?.message });
      return res.status(500).json({ success: false, error: 'Notification retrieval failed.' });
    }
  }

  if (req.method === 'GET') {
    if (!VAPID_PUBLIC_KEY) return res.status(503).json({ success: false, error: 'Push notification service is not configured on the server.' });
    return res.status(200).json({ service: 'Pusat Jual Beli Solo Raya - Web Push Notification Dispatcher', status: 'active', vapidPublicKey: VAPID_PUBLIC_KEY });
  }
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const body = parseBody(req);
  const action = clean(body?.action, 64).toLowerCase();
  if (['mark_notification_read', 'mark_all_notifications_read', 'broadcast_bu_notification'].includes(action)) {
    try { return await handleUserNotificationAction(req, res, action); }
    catch (error) {
      console.error('[User Notification Action Error]', { name: error?.name, message: error?.message });
      return res.status(500).json({ success: false, error: 'Notification operation failed.' });
    }
  }

  if (!isAdminRequest(req)) return res.status(401).json({ success: false, error: 'Authentication required.' });

  const supabase = getAdminClient();
  if (!supabase || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return res.status(503).json({ success: false, error: 'Push notification service is not configured on the server.' });

  try {
    const itemPayload = body;
    const title = clean(itemPayload.title || '📢 Pusat Jual Beli Solo Raya', 200);
    const message = clean(itemPayload.body || itemPayload.message || 'Ada pembaruan sistem dan barang seken terbaru di Solo Raya! Buka aplikasi sekarang.', 2000);
    const url = clean(itemPayload.url || '/', 1000);
    const icon = clean(itemPayload.icon || itemPayload.image || '/assets/img/app-logo.png?v=2.1', 500);
    const badge = clean(itemPayload.badge || '/assets/img/app-logo.png?v=2.1', 500);
    const tag = clean(itemPayload.tag || 'solosatset-update', 100);

    const cleanIds = Array.isArray(itemPayload.targetUserIds)
      ? itemPayload.targetUserIds.map((u) => typeof u === 'object' && u !== null ? (u.user_id || u.id || u.userId) : u).filter(Boolean).map((u) => String(u).trim().slice(0, 128)).filter(Boolean).slice(0, 500)
      : (itemPayload.targetUserId ? [String(itemPayload.targetUserId).trim().slice(0, 128)] : []);
    const targetEmail = itemPayload.targetEmail ? String(itemPayload.targetEmail).trim().toLowerCase().slice(0, 320) : null;
    const hasTarget = cleanIds.length > 0 || Boolean(targetEmail);

    let query = supabase.from('push_subscriptions').select('endpoint,p256dh,auth,user_id,user_email');
    if (cleanIds.length > 0) query = query.in('user_id', cleanIds);
    if (targetEmail) query = query.eq('user_email', targetEmail);
    const { data: subscriptions, error } = await query;
    if (error) throw error;

    const allSubs = Array.isArray(subscriptions) ? subscriptions.filter((s) => s?.endpoint && s?.p256dh && s?.auth) : [];
    if (hasTarget && allSubs.length === 0) return res.status(200).json({ success: true, sentCount: 0, failedCount: 0, totalTargets: 0, message: 'Tidak ada target pengguna yang terdaftar.' });
    if (!hasTarget && allSubs.length === 0) return res.status(200).json({ success: true, sentCount: 0, failedCount: 0, totalTargets: 0, message: 'Belum ada perangkat pengguna yang terdaftar.' });

    const pushPayload = JSON.stringify({ title, body: message, url, icon, badge, tag, timestamp: Date.now() });
    const expiredEndpoints = [];
    let sentCount = 0;
    let failedCount = 0;
    await Promise.allSettled(allSubs.map(async (sub) => {
      try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, pushPayload); sentCount += 1; }
      catch (err) { failedCount += 1; if (err.statusCode === 404 || err.statusCode === 410) expiredEndpoints.push(sub.endpoint); console.warn('[Push Error]', err.statusCode || 'network'); }
    }));
    if (expiredEndpoints.length > 0) await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    return res.status(200).json({ success: true, sentCount, failedCount, totalTargets: allSubs.length });
  } catch (error) {
    console.error('[Push Dispatcher Error]', { name: error?.name, message: error?.message });
    return res.status(500).json({ success: false, error: 'Push notification dispatch failed.' });
  }
}
