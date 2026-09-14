"use client";

import React, { useState, useCallback } from "react";
import { useTokoSaya, UseTokoSayaProps } from "./hooks/useTokoSaya";
import { TokoHeader } from "./components/TokoHeader";
import { TokoStats } from "./components/TokoStats";
import { SellerListingGrid } from "../seller/components/SellerListingGrid";
import { ListingManagementFeature } from "../listing-management/ListingManagementFeature";
import type { ListingModel } from "../../domain/listing/listing.contract";

export interface TokoSayaFeatureProps extends UseTokoSayaProps {
  className?: string;
}

export const TokoSayaFeature: React.FC<TokoSayaFeatureProps> = ({
  initialListings = [],
  sellerId,
  className = "",
}) => {
  const {
    listings,
    statusFilter,
    setStatusFilter,
    stats,
    isLoading,
    refreshToko,
  } = useTokoSaya({ initialListings, sellerId });

  const [isCreatingListing, setIsCreatingListing] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<ListingModel | null>(null);

  const handleEdit = useCallback((listing: ListingModel) => {
    setEditingListing(listing);
    setIsCreatingListing(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingListing(null);
    setIsCreatingListing(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsCreatingListing(false);
    setEditingListing(null);
    refreshToko();
  }, [refreshToko]);

  return (
    <div className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 ${className}`.trim()}>
      {/* Toko Header */}
      <TokoHeader onCreateListingClick={handleCreateNew} />

      {/* Toko Stats */}
      <TokoStats
        total={stats.total}
        active={stats.active}
        sold={stats.sold}
        totalViews={stats.totalViews}
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          {["all", "active", "sold"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-rose-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "Semua Status" : status === "active" ? "Aktif" : "Terjual"}
            </button>
          ))}
        </div>
      </div>

      {/* Listing Form Modal or Grid */}
      {isCreatingListing ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
          <button
            type="button"
            onClick={handleCloseForm}
            className="absolute top-4 right-4 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            ✕ Batal
          </button>
          <ListingManagementFeature
            editingListing={editingListing}
            onSuccess={handleCloseForm}
          />
        </div>
      ) : (
        <SellerListingGrid
          listings={listings}
          onEdit={handleEdit}
          onStatusChange={refreshToko}
        />
      )}
    </div>
  );
};
