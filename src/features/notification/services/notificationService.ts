// @ts-ignore
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../../../js/services/notifications.js";

export async function fetchNotifications(): Promise<any[]> {
  try {
    const list = await getNotifications();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("[NotificationService] fetchNotifications error:", error);
    return [];
  }
}

export async function markAsRead(id: string): Promise<boolean> {
  try {
    await markNotificationRead(id);
    return true;
  } catch (error) {
    console.error("[NotificationService] markAsRead error:", error);
    return false;
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    await markAllNotificationsRead();
    return true;
  } catch (error) {
    console.error("[NotificationService] markAllAsRead error:", error);
    return false;
  }
}
