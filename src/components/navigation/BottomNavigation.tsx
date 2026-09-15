"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquareHeart, Coffee, Store, User } from "lucide-react";

export interface BottomNavigationProps {
  activeTab?: "home" | "reviews" | "toko-saya" | "profile";
  onTabChange?: (tab: "home" | "reviews" | "toko-saya" | "profile") => void;
  onProfileClick?: () => void;
  onTraktirKopiClick?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab: propActiveTab,
  onTabChange,
  onProfileClick,
  onTraktirKopiClick,
}) => {
  const pathname = usePathname();

  // Dynamically resolve active tab if not explicitly supplied
  let currentTab = propActiveTab;
  if (!currentTab) {
    if (pathname === "/toko-saya") {
      currentTab = "toko-saya";
    } else {
      currentTab = "home";
    }
  }

  const isHome = currentTab === "home";
  const isReviews = currentTab === "reviews";
  const isTokoSaya = currentTab === "toko-saya";
  const isProfile = currentTab === "profile";

  return (
    <nav
      id="bottom-navigation-dock"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-2xl"
    >
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around">
        {/* 1. Beranda */}
        <Link
          href="/"
          onClick={() => onTabChange?.("home")}
          id="nav-btn-home"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
            isHome
              ? "text-rose-900 font-black"
              : "text-slate-600 hover:text-rose-900 font-bold"
          } text-[10px] sm:text-xs cursor-pointer hover:scale-105 transition-all`}
        >
          <Home className={`w-5 h-5 pointer-events-none ${isHome ? "text-rose-900 stroke-[2.2]" : "text-slate-600 stroke-[1.8]"}`} />
          <span className="pointer-events-none">Beranda</span>
        </Link>

        {/* 2. Ulasan */}
        <button
          type="button"
          onClick={() => onTabChange?.("reviews")}
          id="nav-btn-reviews"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
            isReviews
              ? "text-rose-900 font-black"
              : "text-slate-600 hover:text-rose-900 font-bold"
          } text-[10px] sm:text-xs cursor-pointer hover:scale-105 transition-all`}
          title="Buka Halaman & Kolom Ulasan"
        >
          <MessageSquareHeart
            className={`w-5 h-5 pointer-events-none ${
              isReviews ? "text-rose-900 stroke-[2.2]" : "text-slate-600 stroke-[1.8]"
            }`}
          />
          <span className="pointer-events-none">Ulasan</span>
        </button>

        {/* 3. Traktir Kopi (Center Floating Action Button) */}
        <button
          type="button"
          onClick={onTraktirKopiClick}
          id="nav-btn-traktir"
          title="Traktir Kopi / Apresiasi"
          aria-label="Traktir Pengembang"
          className="relative z-50 flex items-center justify-center -mt-5 bg-gradient-to-r from-amber-600 via-rose-800 to-rose-900 hover:from-amber-500 hover:to-rose-700 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white cursor-pointer pointer-events-auto"
        >
          <Coffee className="w-6 h-6 text-amber-300 pointer-events-none stroke-[2.2]" />
        </button>

        {/* 4. Toko Saya */}
        <Link
          href="/toko-saya"
          id="nav-btn-my-listings"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
            isTokoSaya
              ? "text-rose-900 font-black"
              : "text-slate-600 hover:text-rose-900 font-bold"
          } text-[10px] sm:text-xs cursor-pointer hover:scale-105 transition-all group`}
          title="Buka Halaman Toko Saya"
        >
          <Store
            className={`w-5 h-5 pointer-events-none ${
              isTokoSaya
                ? "text-rose-900 stroke-[2.2]"
                : "text-slate-600 stroke-[1.8] group-hover:text-rose-900"
            }`}
          />
          <span className="pointer-events-none">Toko Saya</span>
        </Link>

        {/* 5. Profil */}
        <button
          type="button"
          onClick={() => {
            onTabChange?.("profile");
            onProfileClick?.();
          }}
          id="nav-btn-profile"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
            isProfile
              ? "text-rose-900 font-black"
              : "text-slate-600 hover:text-rose-900 font-bold"
          } text-[10px] sm:text-xs cursor-pointer hover:scale-105 transition-all`}
          title="Buka Profil Pengguna"
        >
          <User
            className={`w-5 h-5 pointer-events-none ${
              isProfile ? "text-rose-900 stroke-[2.2]" : "text-slate-600 stroke-[1.8]"
            }`}
          />
          <span id="nav-profile-label" className="pointer-events-none">Profil</span>
        </button>
      </div>
    </nav>
  );
};


