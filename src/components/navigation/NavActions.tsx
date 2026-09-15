import React from "react";
import { Bell, SlidersHorizontal, PlusCircle } from "lucide-react";

export interface NavActionsProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
  onFilterClick?: () => void;
  onCreateListingClick?: () => void;
}

export const NavActions: React.FC<NavActionsProps> = ({
  notificationCount = 0,
  onNotificationClick,
  onFilterClick,
  onCreateListingClick,
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
      {/* Notification Bell Button */}
      <button
        type="button"
        id="btn-open-notifications-modal"
        onClick={onNotificationClick}
        className="relative p-1.5 sm:p-2 text-rose-900 bg-white/50 hover:bg-white/80 rounded-xl border border-rose-200/50 flex items-center justify-center text-xs font-semibold flex-shrink-0 cursor-pointer backdrop-blur-sm transition-all shadow-sm"
        title="Pusat Notifikasi"
      >
        <Bell className="w-4 h-4 text-rose-600 pointer-events-none" />
        {notificationCount > 0 && (
          <span
            id="notif-badge-count"
            className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#ffffff] shadow-xs"
          >
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      {/* Filter Button */}
      <button
        type="button"
        id="btn-open-filter-modal"
        onClick={onFilterClick}
        className="p-1.5 sm:p-2 text-rose-900 bg-white/50 hover:bg-white/80 rounded-xl border border-rose-200/50 flex items-center justify-center gap-1 text-xs font-semibold flex-shrink-0 cursor-pointer backdrop-blur-sm transition-all shadow-sm"
        title="Filter Wilayah & Kategori"
      >
        <SlidersHorizontal className="w-4 h-4 text-rose-600" />
        <span data-text-key="btn_filter" className="hidden sm:inline font-bold text-rose-950">
          Filter
        </span>
      </button>

      {/* Desktop Pasang Iklan Button */}
      <button
        type="button"
        id="btn-create-listing-nav"
        onClick={onCreateListingClick}
        className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <PlusCircle className="w-4 h-4 text-slate-950" />
        <span>Pasang Iklan</span>
      </button>
    </div>
  );
};

