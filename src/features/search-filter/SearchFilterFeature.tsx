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
  region?: string;
  onRegionChange?: (reg: string) => void;
  className?: string;
}

export const SearchFilterFeature: React.FC<SearchFilterFeatureProps> = ({
  initialListings = [],
  category,
  onListingClick,
  categorySlot,
  region,
  onRegionChange,
  className = "",
}) => {
  const [internalRegion, setInternalRegion] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  const activeRegion = region !== undefined ? region : internalRegion;

  const {
    filterState,
    filteredListings,
    totalCount,
    updateSearchQuery,
    updateFilter,
    resetFilters,
  } = useSearchFilter({ initialListings, category });

  React.useEffect(() => {
    if (region !== undefined) {
      updateFilter({ regionId: region });
    }
  }, [region, updateFilter]);

  const handleSelectRegion = (reg: string) => {
    setInternalRegion(reg);
    onRegionChange?.(reg);
    updateFilter({ regionId: reg });
  };

  const handleSelectSort = (srt: string) => {
    setSelectedSort(srt);
    updateFilter({ sortBy: srt });
  };

  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`.trim()}>
      {categorySlot ? (
        <>
          {/* 7 Regions Filter Pills */}
          <RegionFilterPills
            selectedRegion={activeRegion}
            onSelectRegion={handleSelectRegion}
          />

          {/* Sort Options Bar */}
          <SortBar
            selectedSort={selectedSort}
            onSelectSort={handleSelectSort}
          />

          {/* Category Pills (Placed directly below Sort Bar, matching baseline 8463f32) */}
          {categorySlot}
        </>
      ) : (
        <div className="space-y-3 mb-4">
          <SearchBar
            value={filterState.searchQuery}
            onChange={updateSearchQuery}
          />
          <FilterBar
            filterState={filterState}
            onFilterChange={updateFilter}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Listing Grid Result */}
      <ListingGrid
        listings={filteredListings}
        onListingClick={onListingClick}
      />
    </div>
  );
};

