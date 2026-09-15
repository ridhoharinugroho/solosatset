import React from "react";
import { HeaderNav } from "../navigation/HeaderNav";
import { BottomNavigation } from "../navigation/BottomNavigation";
import { CommunityFooter } from "./CommunityFooter";

export interface AppShellProps {
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  activeTab?: "home" | "reviews" | "toko-saya" | "profile";
  notificationCount?: number;
  onNotificationClick?: () => void;
  onFilterClick?: () => void;
  onCreateListingClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onProfileClick?: () => void;
  onTraktirKopiClick?: () => void;
  onTabChange?: (tab: "home" | "reviews" | "toko-saya" | "profile") => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  headerSlot,
  footerSlot,
  children,
  className = "",
  activeTab,
  notificationCount = 0,
  onNotificationClick,
  onFilterClick,
  onCreateListingClick,
  onSearchSubmit,
  onProfileClick,
  onTraktirKopiClick,
  onTabChange,
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-[#ffffff] text-slate-900 pb-24 md:pb-24 font-sans ${className}`.trim()}>
      {headerSlot ? (
        headerSlot
      ) : (
        <HeaderNav
          notificationCount={notificationCount}
          onNotificationClick={onNotificationClick}
          onFilterClick={onFilterClick}
          onCreateListingClick={onCreateListingClick}
          onSearchSubmit={onSearchSubmit}
        />
      )}
      
      <main id="main-content-container" className="flex-1 max-w-7xl w-full mx-auto px-0 pt-[10px] pb-3.5 sm:pb-4">
        {children}
      </main>

      {footerSlot !== undefined ? footerSlot : <CommunityFooter />}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        onProfileClick={onProfileClick}
        onTraktirKopiClick={onTraktirKopiClick}
      />
    </div>
  );
};



