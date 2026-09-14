import { useState, useCallback } from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";

export interface UseListingDetailProps {
  initialSelectedListing?: ListingModel | null;
}

export function useListingDetail({ initialSelectedListing = null }: UseListingDetailProps = {}) {
  const [selectedListing, setSelectedListing] = useState<ListingModel | null>(initialSelectedListing);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(Boolean(initialSelectedListing));

  const selectListing = useCallback((listing: ListingModel | null) => {
    setSelectedListing(listing);
    setActiveImageIndex(0);
    setIsDetailOpen(Boolean(listing));
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedListing(null);
  }, []);

  const selectImage = useCallback((index: number) => {
    setActiveImageIndex(index);
  }, []);

  return {
    selectedListing,
    activeImageIndex,
    isDetailOpen,
    selectListing,
    closeDetail,
    selectImage,
  };
}
