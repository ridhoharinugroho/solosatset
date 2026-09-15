"use client";

import React, { useState } from "react";
import { useSearchFilter, UseSearchFilterProps } from "./hooks/useSearchFilter";
import { SearchBar } from "./components/SearchBar";
import { FilterBar } from "./components/FilterBar";
import { RegionFilterPills } from "./components/RegionFilterPills";
import { SortBar } from "./components/SortBar";
import { ListingGrid } from "./components/ListingGrid";
import type { ListingModel } from "../../domain/listing/listing.contract";

export interface SearchFilterFeatureProps extends UseSearchFilterProps {
  onListingClick?: (listing: ListingModel) => void;
  categorySlot?: React.ReactNode;
  className?: string;
}

export const SearchFilterFeature: React.FC<SearchFilterFeatureProps> = ({
  initialListings = [],
  category,
  onListingClick,
  categorySlot,
  className = "",
}) => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  const {
    filterState,
    filteredListings,
    totalCount,
    updateSearchQuery,
    updateFilter,
    resetFilters,
  } = useSearchFilter({ initialListings, category });

  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`.trim()}>
      {/* 7 Regions Filter Pills */}
      <RegionFilterPills
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />

      {/* Sort Options Bar */}
      <SortBar
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
      />

      {/* Category Pills (Placed directly below Sort Bar, matching baseline 8463f32) */}
      {categorySlot}

      {/* Listing Grid Result */}
      <ListingGrid
        listings={filteredListings}
        onListingClick={onListingClick}
      />
    </div>
  );
};

