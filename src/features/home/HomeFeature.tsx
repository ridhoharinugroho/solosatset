"use client";

import React, { useCallback } from "react";
import { useHomeFeed, UseHomeFeedProps } from "./hooks/useHomeFeed";
import { HeroHeader } from "./components/HeroHeader";
import { PromoBanner } from "./components/PromoBanner";
import { FeedPills } from "./components/FeedPills";
import { SearchFilterFeature } from "../search-filter/SearchFilterFeature";
import { ListingDetail } from "../listing/components/ListingDetail";
import type { ListingModel } from "../../domain/listing/listing.contract";
import { isFavorite } from "../../services/listingService";

export interface HomeFeatureProps extends UseHomeFeedProps {
  onCreateListingClick?: () => void;
  showFavoritesOnly?: boolean;
  selectedRegion?: string;
  onSelectRegion?: (region: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export const HomeFeature: React.FC<HomeFeatureProps> = ({
  initialListings = [],
  onCreateListingClick,
  showFavoritesOnly = false,
  selectedRegion,
  onSelectRegion,
  selectedCategory,
  onSelectCategory,
  className = "",
}) => {
  const {
    listings,
    activeCategory: internalCategory,
    selectedListing,
    selectCategory: internalSelectCategory,
    openListingDetail,
    closeListingDetail,
  } = useHomeFeed({ initialListings });

  const activeCategory = selectedCategory !== undefined ? selectedCategory : internalCategory;
  const selectCategory = onSelectCategory || internalSelectCategory;

  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0);
  const [favVersion, setFavVersion] = React.useState<number>(0);

  React.useEffect(() => {
    const handleFavChange = () => setFavVersion((v) => v + 1);
    window.addEventListener("sopaloka:favorites_changed", handleFavChange);
    return () => window.removeEventListener("sopaloka:favorites_changed", handleFavChange);
  }, []);

  const handleListingClick = useCallback((listing: ListingModel) => {
    setActiveImageIndex(0);
    openListingDetail(listing);
  }, [openListingDetail]);

  const displayedListings = React.useMemo(() => {
    if (!showFavoritesOnly) return listings;
    return listings.filter((item) => isFavorite(item.id));
  }, [listings, showFavoritesOnly, favVersion]);

  return (
    <div className={`w-full ${className}`.trim()}>
      {/* 1. Hero Header Banner */}
      <HeroHeader onCreateListingClick={onCreateListingClick} />

      {/* 2. Search, Region Filter, Sort Bar, Category Icon Pills, and Listing Grid */}
      <SearchFilterFeature
        initialListings={displayedListings}
        category={activeCategory}
        region={selectedRegion}
        onRegionChange={onSelectRegion}
        onListingClick={handleListingClick}
        categorySlot={
          <FeedPills
            activeCategory={activeCategory}
            onSelectCategory={selectCategory}
          />
        }
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
