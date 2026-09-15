"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTokoSaya, UseTokoSayaProps } from "./hooks/useTokoSaya";
import { TokoHeader } from "./components/TokoHeader";
import { TokoReviewsSection } from "./components/TokoReviewsSection";
import { TokoEtalase } from "./components/TokoEtalase";
import { ListingForm } from "../listing-management/components/ListingForm";
import { getCurrentUser, type RegisteredUser } from "../../services/authService";
import { updateListingStatus, deleteListing } from "../../services/listingService";
import type { ListingModel, ListingStatus } from "../../domain/listing/listing.contract";
import { X } from "lucide-react";

export interface TokoSayaFeatureProps extends UseTokoSayaProps {
  className?: string;
}

export const TokoSayaFeature: React.FC<TokoSayaFeatureProps> = ({
  initialListings = [],
  sellerId,
  className = "",
}) => {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleUserUpdate = () => setCurrentUser(getCurrentUser());
    window.addEventListener("userProfileUpdated", handleUserUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUserUpdate);
  }, []);

  const effectiveSellerId = sellerId || currentUser?.id;

  const {
    listings,
    allListings,
    statusFilter,
    setStatusFilter,
    stats,
    isLoading,
    refreshToko,
  } = useTokoSaya({ initialListings, sellerId: effectiveSellerId });

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

  const handleStatusChange = useCallback(
    async (id: string, status: ListingStatus) => {
      await updateListingStatus(id, status);
      refreshToko();
    },
    [refreshToko]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteListing(id);
      refreshToko();
    },
    [refreshToko]
  );

  return (
    <div className={`space-y-4 sm:space-y-5 max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 ${className}`.trim()}>
      {/* Section 1: Top Showcase Banner & Store Profile */}
      <TokoHeader
        user={currentUser}
        soldCount={stats.sold}
        onCreateListingClick={handleCreateNew}
      />

      {/* Section 2: Rating & Ulasan Toko */}
      <TokoReviewsSection
        rating={5.0}
        reviewCount={0}
        reviews={[]}
      />

      {/* Section 3: Etalase Barang Jualan */}
      <TokoEtalase
        listings={listings}
        allListings={allListings}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      {/* Create / Edit Listing Modal */}
      {isCreatingListing && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={handleCloseForm}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseForm}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
            <ListingForm
              initialListing={editingListing || undefined}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};
