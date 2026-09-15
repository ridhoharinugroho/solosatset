import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { NavBrand } from "./NavBrand";
import { NavActions } from "./NavActions";

export interface HeaderNavProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
  onFavoritesClick?: () => void;
  onFilterClick?: () => void;
  onCreateListingClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onLogoClick?: () => void;
  className?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  notificationCount = 0,
  onNotificationClick,
  onFavoritesClick,
  onFilterClick,
  onCreateListingClick,
  onSearchSubmit,
  onLogoClick,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchSubmit?.(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchSubmit?.("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(searchQuery);
  };

  return (
    <div
      id="sticky-top-app-wrapper"
      className={`sticky-top-app-bar sticky top-0 z-30 w-full bg-[#ffffff] shadow-xs min-h-[88px] md:min-h-[64px] flex flex-col justify-center border-b border-rose-100/60 ${className}`.trim()}
    >
      <header className="w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-4 lg:px-6">
          {/* Row 1: Brand Logo, Desktop Search, & Action Buttons */}
          <div className="flex items-center justify-between h-12 sm:h-16 gap-2 sm:gap-4 pt-1.5 pb-0.5 sm:py-1">
            {/* Brand Logo & Header */}
            <NavBrand onLogoClick={onLogoClick} />

            {/* Desktop Search Bar (Hidden on Mobile) */}
            <div id="desktop-search-container" className="hidden md:flex flex-1 max-w-lg mx-2 lg:mx-4">
              <form onSubmit={handleFormSubmit} role="search" className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  id="desktop-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Cari sepeda, HP, motor, sofa terdekat..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-10 pr-10 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-full text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white shadow-xs transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Right Header Action Controls */}
            <NavActions
              notificationCount={notificationCount}
              onNotificationClick={onNotificationClick}
              onFavoritesClick={onFavoritesClick}
              onFilterClick={onFilterClick}
              onCreateListingClick={onCreateListingClick}
            />
          </div>

          {/* Row 2: Mobile Search Bar (Positioned directly below brand header on mobile) */}
          <div id="mobile-search-container" className="md:hidden pt-0.5 pb-2">
            <form onSubmit={handleFormSubmit} role="search" className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                id="mobile-search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cari barang terdekat..."
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full pl-10 pr-8 py-2 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white shadow-xs [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </header>
    </div>
  );
};

