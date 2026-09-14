"use client";

import React from "react";
import type { UserProfile } from "../../domain/user/user.contract";
import type { ListingModel } from "../../domain/listing/listing.contract";
import type { SupabaseListingRowDTO } from "../../domain/listing/listing.dto";
import { useSellerListings } from "../seller/hooks/useSellerListings";
import { SellerListingGrid } from "../seller/components/SellerListingGrid";
import { ListingForm } from "./components/ListingForm";
import { Button } from "../../components/ui/Button";

export interface ListingManagementFeatureProps {
  currentUser?: UserProfile | null;
  allListings?: SupabaseListingRowDTO[] | ListingModel[];
  editingListing?: ListingModel | null;
  onSuccess?: () => void;
  onSaveListingSubmit?: (listingData: Partial<ListingModel>) => Promise<boolean>;
  onDeleteListingSubmit?: (id: string) => Promise<boolean>;
  className?: string;
}

export const ListingManagementFeature: React.FC<ListingManagementFeatureProps> = ({
  currentUser,
  allListings = [],
  editingListing: propEditingListing = null,
  onSuccess,
  onSaveListingSubmit,
  onDeleteListingSubmit,
  className = "",
}) => {
  const sellerId = currentUser?.id || "";

  const {
    activeTab,
    filteredSellerListings,
    editingListing,
    isFormOpen,
    error,
    setActiveTab,
    openCreateForm,
    openEditForm,
    closeForm,
    handleUpdateStatus,
    handleDeleteListing,
  } = useSellerListings({
    sellerId,
    allListings,
    onSaveListingSubmit,
    onDeleteListingSubmit,
  });

  if (!currentUser) {
    return (
      <div className={`p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`.trim()}>
        <p className="text-sm font-semibold text-gray-500">
          🔒 Silakan masuk akun terlebih dahulu untuk mengelola barang jualan Anda.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            Kelola Barang Jualan — {currentUser.storeName || currentUser.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manajemen etalase toko & iklan barang bekas/baru di SOPALOKA
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateForm}
          className="font-bold shrink-0"
        >
          + Pasang Iklan Baru
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          ⛔ {error}
        </div>
      )}

      {/* Seller Listing Grid with Status Tabs */}
      <SellerListingGrid
        listings={filteredSellerListings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEditListing={openEditForm}
        onStatusChange={handleUpdateStatus}
        onDeleteListing={handleDeleteListing}
      />

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <ListingForm
              initialListing={editingListing}
              currentUser={currentUser}
              onSaveSubmit={onSaveListingSubmit}
              onClose={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};
