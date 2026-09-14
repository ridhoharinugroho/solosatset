import { useState, useMemo, useCallback } from "react";
import type { ListingModel, ListingStatus } from "../../../domain/listing/listing.contract";
import type { SupabaseListingRowDTO } from "../../../domain/listing/listing.dto";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";

export type SellerTabStatus = "all" | "active" | "bu" | "sold" | "archived";

export interface UseSellerListingsProps {
  sellerId: string;
  allListings?: SupabaseListingRowDTO[] | ListingModel[];
  onSaveListingSubmit?: (listing: Partial<ListingModel>) => Promise<boolean>;
  onDeleteListingSubmit?: (id: string) => Promise<boolean>;
}

export function useSellerListings({
  sellerId,
  allListings = [],
  onSaveListingSubmit,
  onDeleteListingSubmit,
}: UseSellerListingsProps) {
  const [activeTab, setActiveTab] = useState<SellerTabStatus>("all");
  const [editingListing, setEditingListing] = useState<ListingModel | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter listings ONLY owned by sellerId
  const sellerListings = useMemo(() => {
    if (!sellerId) return [];
    const normalized = allListings.map((item) =>
      "negoType" in item ? (item as ListingModel) : mapListingDtoToDomain(item as SupabaseListingRowDTO)
    );
    return normalized.filter(
      (item) => item.seller.id === sellerId || (item as unknown as { seller_id?: string }).seller_id === sellerId
    );
  }, [sellerId, allListings]);

  // Tab-filtered seller listings
  const filteredSellerListings = useMemo(() => {
    return sellerListings.filter((item) => {
      if (activeTab === "active") return item.status === "active";
      if (activeTab === "bu") return item.isBu;
      if (activeTab === "sold") return item.status === "sold";
      if (activeTab === "archived") return item.status === "archived";
      return true; // 'all'
    });
  }, [sellerListings, activeTab]);

  const openCreateForm = useCallback(() => {
    setEditingListing(null);
    setIsFormOpen(true);
    setError(null);
  }, []);

  const openEditForm = useCallback((listing: ListingModel) => {
    // Ownership authorization check
    if (listing.seller.id !== sellerId) {
      setError("Ditolak: Anda tidak memiliki akses untuk mengedit listing ini.");
      return;
    }
    setEditingListing(listing);
    setIsFormOpen(true);
    setError(null);
  }, [sellerId]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingListing(null);
    setError(null);
  }, []);

  const handleUpdateStatus = useCallback(
    async (listingId: string, newStatus: ListingStatus): Promise<boolean> => {
      const target = sellerListings.find((l) => l.id === listingId);
      if (!target || target.seller.id !== sellerId) {
        setError("Ditolak: Anda tidak memiliki akses untuk mengelola listing ini.");
        return false;
      }
      if (onSaveListingSubmit) {
        return onSaveListingSubmit({ id: listingId, status: newStatus });
      }
      return true;
    },
    [sellerListings, sellerId, onSaveListingSubmit]
  );

  const handleDeleteListing = useCallback(
    async (listingId: string): Promise<boolean> => {
      const target = sellerListings.find((l) => l.id === listingId);
      if (!target || target.seller.id !== sellerId) {
        setError("Ditolak: Anda tidak memiliki akses untuk menghapus listing ini.");
        return false;
      }
      if (onDeleteListingSubmit) {
        return onDeleteListingSubmit(listingId);
      }
      return true;
    },
    [sellerListings, sellerId, onDeleteListingSubmit]
  );

  return {
    activeTab,
    sellerListings,
    filteredSellerListings,
    editingListing,
    isFormOpen,
    isLoading,
    error,
    setActiveTab,
    openCreateForm,
    openEditForm,
    closeForm,
    handleUpdateStatus,
    handleDeleteListing,
  };
}
