"use client";

import React, { useCallback } from "react";
import { useHomeFeed, UseHomeFeedProps } from "./hooks/useHomeFeed";
import { HeroHeader } from "./components/HeroHeader";
import { PromoBanner } from "./components/PromoBanner";
import { FeedPills } from "./components/FeedPills";
import { SearchFilterFeature } from "../search-filter/SearchFilterFeature";
import { ListingDetail } from "../listing/components/ListingDetail";
import type { ListingModel } from "../../domain/listing/listing.contract";

export interface HomeFeatureProps extends UseHomeFeedProps {
  className?: string;
}

export const HomeFeature: React.FC<HomeFeatureProps> = ({
  initialListings = [],
  className = "",
}) => {
  const {
    listings,
    activeCategory,
    selectedListing,
    selectCategory,
    openListingDetail,
    closeListingDetail,
  } = useHomeFeed({ initialListings });

  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0);

  const handleListingClick = useCallback((listing: ListingModel) => {
    setActiveImageIndex(0);
    openListingDetail(listing);
  }, [openListingDetail]);

  return (
    <div className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 ${className}`.trim()}>
      {/* 1. Hero Header Banner */}
      <HeroHeader />

      {/* 2. Platform Value Highlights */}
      <PromoBanner />

      {/* 3. Category Feed Pills Navigation */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          Jelajahi Kategori
        </h3>
        <FeedPills
          activeCategory={activeCategory}
          onSelectCategory={selectCategory}
        />
      </div>

      {/* 4. Search, Filter, and Listing Grid */}
      <SearchFilterFeature
        initialListings={listings}
        category={activeCategory}
        onListingClick={handleListingClick}
      />

      {/* 5. Listing Detail Overlay / Modal View */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={closeListingDetail}
          data-testid="listing-detail-modal-overlay"
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeListingDetail}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup Detail"
            >
              ✕
            </button>
            <div className="p-6">
              <ListingDetail
                listing={selectedListing}
                isOpen={Boolean(selectedListing)}
                activeImageIndex={activeImageIndex}
                onImageSelect={setActiveImageIndex}
                onClose={closeListingDetail}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
