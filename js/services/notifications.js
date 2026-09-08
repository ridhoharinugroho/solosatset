// Server-authoritative notification client.
// Intentionally contains no Supabase client access; all notification data operations
// go through the authenticated server endpoint so the browser never receives DB access.

function isAnonymousSessionUser(userId) {
  return !userId || String(userId).startsWith('guest-');
}

async function request(action, payload = null, method = 'POST') {
  try {
    const options = { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
    if (payload !== null) options.body = JSON.stringify({ action, ...payload });
    const url = method === 'GET' ? `/api/push-notify?action=${encodeURIComponent(action)}` : '/api/push-notify';
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `Notification request failed (${response.status}).`);
    return data;
  } catch (error) {
    // Authentication failures are expected when a public page has no active user.
    // Do not spam the browser console during background polling.
    if (error?.message !== 'Authentication required.') {
      console.warn(`[Notifications] ${action}:`, error?.message || error);
    }
    return { success: false, error: error?.message || 'Notification request failed.' };
  }
}

export async function sbGetNotifications(userId = null) {
  // Notification data is private. Never call the server endpoint for an anonymous visitor.
  if (isAnonymousSessionUser(userId)) return [];
  const result = await request('list_notifications', null, 'GET');
  return result.success && Array.isArray(result.notifications) ? result.notifications : [];
}

export async function sbMarkNotificationAsRead(notifId) {
  if (!notifId) return false;
  const result = await request('mark_notification_read', { notificationId: String(notifId).slice(0, 128) });
  return result.success === true;
}

export async function sbMarkAllNotificationsAsRead() {
  const result = await request('mark_all_notifications_read');
  return result.success === true;
}

export async function sbBroadcastBuNotification(productId, categoryId, productDetails = {}) {
  if (!productId) return { success: false, userCount: 0, error: 'Product ID is required' };
  const result = await request('broadcast_bu_notification', {
    productId: String(productId).slice(0, 128),
    categoryId: String(categoryId || 'umum').slice(0, 100),
    productDetails: productDetails && typeof productDetails === 'object' ? productDetails : {}
  });
  if (result.success) {
    try {
      window.dispatchEvent(new CustomEvent('buNotificationTriggered', { detail: result }));
    } catch (_) {}
  }
  return result;
}

export function sbUnsubscribeNotifications(subscription) {
  if (subscription?.timer) window.clearInterval(subscription.timer);
}

export function sbSubscribeNotifications(userId, onNewNotification, intervalMs = 15000) {
  // Device/guest identifiers are not authenticated notification principals.
  if (isAnonymousSessionUser(userId) || typeof onNewNotification !== 'function') return null;
  let stopped = false;
  let lastSeenIds = new Set();

  const poll = async () => {
    if (stopped) return;
    const notifications = await sbGetNotifications(userId);
    if (stopped) return;
    const fresh = notifications.filter((notification) => notification?.id && !lastSeenIds.has(String(notification.id)));
    notifications.forEach((notification) => lastSeenIds.add(String(notification.id)));
    fresh.reverse().forEach((notification) => onNewNotification(notification));
  };

  poll();
  const timer = window.setInterval(poll, Math.max(5000, Number(intervalMs) || 15000));
  return { timer, unsubscribe() { stopped = true; window.clearInterval(timer); } };
}
