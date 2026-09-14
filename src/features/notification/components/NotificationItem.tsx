import React from "react";
import { NotificationItem as NotificationItemType } from "../hooks/useNotification";

export interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "bu":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            ⚡
          </div>
        );
      case "system":
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            📢
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            🔔
          </div>
        );
    }
  };

  return (
    <div
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
        if (notification.link) {
          window.location.href = notification.link;
        }
      }}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
        notification.isRead
          ? "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 opacity-80 hover:opacity-100"
          : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80 shadow-sm"
      }`}
    >
      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs sm:text-sm font-bold truncate ${
              notification.isRead ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"
            }`}
          >
            {notification.title}
          </h4>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {formatDate(notification.createdAt)}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {!notification.isRead && (
        <div
          className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0 self-center"
          title="Belum dibaca"
        />
      )}
    </div>
  );
};
