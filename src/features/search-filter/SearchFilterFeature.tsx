"use client";

import React from "react";
import { useSearchFilter, UseSearchFilterProps } from "./hooks/useSearchFilter";
import { SearchBar } from "./components/SearchBar";
import { FilterBar } from "./components/FilterBar";
import { ListingGrid } from "./components/ListingGrid";
import type { ListingModel } from "../../domain/listing/listing.contract";

export interface SearchFilterFeatureProps extends UseSearchFilterProps {
  onListingClick?: (listing: ListingModel) => void;
  className?: string;
}

export const SearchFilterFeature: React.FC<SearchFilterFeatureProps> = ({
  initialListings = [],
  onListingClick,
  className = "",
}) => {
  const {
    filterState,
    filteredListings,
    totalCount,
    updateSearchQuery,
    updateFilter,
    resetFilters,
  } = useSearchFilter({ initialListings });

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Search Bar Header */}
      <SearchBar
        value={filterState.searchQuery}
        onChange={updateSearchQuery}
      />

      {/* Filter Controls Bar */}
      <FilterBar
        filterState={filterState}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Result Meta Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>Menampilkan <strong className="text-gray-900">{totalCount}</strong> barang</span>
      </div>

      {/* Listing Grid Result */}
      <ListingGrid
        listings={filteredListings}
        onListingClick={onListingClick}
      />
    </div>
  );
};
