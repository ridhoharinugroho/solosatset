import React from "react";
import { NotificationItem as NotificationItemType } from "../hooks/useNotification";
import { NotificationItem } from "./NotificationItem";

export interface NotificationListProps {
  notifications: NotificationItemType[];
  unreadCount: number;
  isPushSupported?: boolean;
  isPushSubscribed?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onTogglePush?: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  unreadCount,
  isPushSupported = false,
  isPushSubscribed = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onTogglePush,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-full">
              {unreadCount} Baru
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isPushSupported && onTogglePush && (
            <button
              type="button"
              onClick={onTogglePush}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isPushSubscribed
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{isPushSubscribed ? "🔔 Push Aktif" : "🔕 Aktifkan Push"}</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 transition"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="text-3xl mb-2">🔕</div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum Ada Notifikasi</p>
          <p className="text-xs text-slate-400 mt-1">Pembaruan iklan dan info transaksi Anda akan tampil di sini.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onMarkAsRead={onMarkAsRead} />
          ))}
        </div>
      )}
    </div>
  );
};
