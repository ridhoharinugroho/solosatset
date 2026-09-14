import { useState, useEffect, useCallback } from "react";
import {
  sbGetNotifications,
  sbMarkNotificationAsRead,
  sbMarkAllNotificationsAsRead,
  sbSubscribeNotifications,
  sbUnsubscribeNotifications,
} from "../../../../js/services/notifications.js";
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "../../../../js/services/pushNotification.js";

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface UseNotificationOptions {
  userId?: string;
  autoSubscribe?: boolean;
}

export function useNotification({ userId, autoSubscribe = true }: UseNotificationOptions = {}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await sbGetNotifications(userId as any);
      const mapped = (data || []).map((item: Record<string, unknown>) => ({
        id: String(item.id || item.notification_id || Math.random()),
        userId: item.user_id ? String(item.user_id) : userId,
        title: String(item.title || "Notifikasi"),
        message: String(item.message || item.body || ""),
        type: item.type ? String(item.type) : "info",
        link: item.link || item.url ? String(item.link || item.url) : undefined,
        isRead: Boolean(item.is_read || item.read || item.isRead),
        createdAt: String(item.created_at || item.createdAt || new Date().toISOString()),
      }));
      setNotifications(mapped);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setIsPushSupported(isPushNotificationSupported());
    setPushPermissionStatus(getNotificationPermissionStatus());
    if (typeof window !== "undefined") {
      setIsPushSubscribed(Boolean((window as unknown as Record<string, unknown>).__solosatset_push_enabled));
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    if (!userId || !autoSubscribe) return;

    const sub = sbSubscribeNotifications(userId, (newNotif: Record<string, unknown>) => {
      setNotifications((prev) => [
        {
          id: String(newNotif.id || Math.random()),
          userId,
          title: String(newNotif.title || "Notifikasi Baru"),
          message: String(newNotif.message || newNotif.body || ""),
          type: newNotif.type ? String(newNotif.type) : "info",
          link: newNotif.link || newNotif.url ? String(newNotif.link || newNotif.url) : undefined,
          isRead: false,
          createdAt: String(newNotif.created_at || newNotif.createdAt || new Date().toISOString()),
        },
        ...prev,
      ]);
    });

    return () => {
      if (sub) {
        sbUnsubscribeNotifications(sub);
      }
    };
  }, [userId, autoSubscribe, loadNotifications]);

  const markAsRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    await sbMarkNotificationAsRead(notifId);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await sbMarkAllNotificationsAsRead();
  };

  const togglePushSubscription = async () => {
    if (!isPushSupported) {
      throw new Error("Web Push Notification tidak didukung di browser ini.");
    }

    if (isPushSubscribed) {
      const success = await unsubscribeUserFromPush();
      if (success) {
        setIsPushSubscribed(false);
      }
      return false;
    } else {
      const sub = await subscribeUserToPush();
      if (sub) {
        setIsPushSubscribed(true);
        setPushPermissionStatus("granted");
        return true;
      }
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isPushSupported,
    pushPermissionStatus,
    isPushSubscribed,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
    togglePushSubscription,
  };
}
