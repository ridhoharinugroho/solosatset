"use client";

import React from "react";
import type { SupabaseListingRowDTO } from "../../domain/listing/listing.dto";
import type { ListingModel } from "../../domain/listing/listing.contract";
import { SearchFilterFeature } from "../search-filter/SearchFilterFeature";
import { useListingDetail } from "./hooks/useListingDetail";
import { ListingDetail } from "./components/ListingDetail";

export interface ListingFeatureProps {
  initialListings?: SupabaseListingRowDTO[] | ListingModel[];
  onContactClick?: (phone: string, title: string) => void;
  onShareClick?: (listing: ListingModel) => void;
  className?: string;
}

export const ListingFeature: React.FC<ListingFeatureProps> = ({
  initialListings = [],
  onContactClick,
  onShareClick,
  className = "",
}) => {
  const {
    selectedListing,
    activeImageIndex,
    isDetailOpen,
    selectListing,
    closeDetail,
    selectImage,
  } = useListingDetail();

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Search & Filter Result Grid Section (Phase 4 integration) */}
      <SearchFilterFeature
        initialListings={initialListings}
        onListingClick={selectListing}
      />

      {/* Listing Detail Modal Composition */}
      <ListingDetail
        listing={selectedListing}
        isOpen={isDetailOpen}
        activeImageIndex={activeImageIndex}
        onImageSelect={selectImage}
        onClose={closeDetail}
        onContactClick={onContactClick}
        onShareClick={onShareClick}
      />
    </div>
  );
};
