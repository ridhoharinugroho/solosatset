// Compatibility facade for the legacy Supabase database service.
// Notification operations are intentionally overridden by the server-authoritative
// implementation so browser code cannot query or mutate public.notifications directly.
export * from './supabaseDBLegacy.js';
export {
  sbGetNotifications,
  sbMarkNotificationAsRead,
  sbMarkAllNotificationsAsRead,
  sbBroadcastBuNotification,
  sbSubscribeNotifications,
  sbUnsubscribeNotifications
} from './notifications.js';
