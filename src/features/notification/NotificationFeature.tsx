import React from "react";
import { useNotification } from "./hooks/useNotification";
import { NotificationList } from "./components/NotificationList";

export interface NotificationFeatureProps {
  userId?: string;
  onClose?: () => void;
}

export const NotificationFeature: React.FC<NotificationFeatureProps> = ({ userId, onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isPushSupported,
    isPushSubscribed,
    markAsRead,
    markAllAsRead,
    togglePushSubscription,
  } = useNotification({ userId });

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-base">
            🔔
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pusat Notifikasi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Informasi aktivitas & pesan di SOPALOKA</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-sm font-bold flex items-center justify-center transition"
            title="Tutup"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat notifikasi...</p>
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          unreadCount={unreadCount}
          isPushSupported={isPushSupported}
          isPushSubscribed={isPushSubscribed}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onTogglePush={togglePushSubscription}
        />
      )}
    </div>
  );
};

export default NotificationFeature;
