/**
 * Notification Service (TypeScript)
 * Server-authoritative notification client facade
 */

import { getCurrentUser } from "./authService";

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  created_at?: string;
  data?: any;
}

function getAuthenticatedUserId(): string | null {
  try {
    const user = getCurrentUser();
    const id = user?.id ? String(user.id).trim() : "";
    return id || null;
  } catch (_) {
    return null;
  }
}

function isAuthenticatedNotificationUser(userId?: string | null): boolean {
  const authenticatedId = getAuthenticatedUserId();
  return Boolean(authenticatedId && userId && String(userId) === authenticatedId);
}

async function request(action: string, payload: any = null, method: string = "POST"): Promise<any> {
  try {
    const options: RequestInit = {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    };
    if (payload !== null) options.body = JSON.stringify({ action, ...payload });
    const url = method === "GET" ? `/api/push-notify?action=${encodeURIComponent(action)}` : "/api/push-notify";
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `Notification request failed (${response.status}).`);
    return data;
  } catch (error: any) {
    if (error?.message !== "Authentication required.") {
      console.warn(`[Notifications] ${action}:`, error?.message || error);
    }
    return { success: false, error: error?.message || "Notification request failed." };
  }
}

export async function sbGetNotifications(userId: string | null = null): Promise<NotificationItem[]> {
  if (!isAuthenticatedNotificationUser(userId)) return [];
  const result = await request("list_notifications", null, "GET");
  return result.success && Array.isArray(result.notifications) ? result.notifications : [];
}

export async function getNotifications(userId: string | null = null): Promise<NotificationItem[]> {
  return sbGetNotifications(userId);
}

export async function sbMarkNotificationAsRead(notifId: string | number): Promise<boolean> {
  if (!notifId || !getAuthenticatedUserId()) return false;
  const result = await request("mark_notification_read", { notificationId: String(notifId).slice(0, 128) });
  return result.success === true;
}

export async function markNotificationRead(notifId: string | number): Promise<boolean> {
  return sbMarkNotificationAsRead(notifId);
}

export async function sbMarkAllNotificationsAsRead(): Promise<boolean> {
  if (!getAuthenticatedUserId()) return false;
  const result = await request("mark_all_notifications_read");
  return result.success === true;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  return sbMarkAllNotificationsAsRead();
}

export async function sbBroadcastBuNotification(
  productId: string,
  categoryId?: string,
  productDetails: any = {},
): Promise<any> {
  if (!productId || !getAuthenticatedUserId()) {
    return { success: false, userCount: 0, error: "Authentication required." };
  }
  const result = await request("broadcast_bu_notification", {
    productId: String(productId).slice(0, 128),
    categoryId: String(categoryId || "umum").slice(0, 100),
    productDetails: productDetails && typeof productDetails === "object" ? productDetails : {},
  });
  return result;
}

export function sbUnsubscribeNotifications(subscription: any): void {
  if (subscription?.timer && typeof window !== "undefined") {
    window.clearInterval(subscription.timer);
  }
}

export function sbSubscribeNotifications(
  userId: string,
  onNewNotification: (notif: NotificationItem) => void,
  intervalMs: number = 15000,
): { timer: number; unsubscribe: () => void } | null {
  if (typeof window === "undefined" || !isAuthenticatedNotificationUser(userId) || typeof onNewNotification !== "function") {
    return null;
  }
  let stopped = false;
  const lastSeenIds = new Set<string>();

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
  return {
    timer,
    unsubscribe() {
      stopped = true;
      window.clearInterval(timer);
    },
  };
}
