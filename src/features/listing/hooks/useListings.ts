import { useState, useEffect, useCallback } from "react";
import type { ListingItem } from "../../../services/listingService";
import {
  fetchPublicListingsFromSupabase,
  getPublicListings,
  getListingServiceStatus,
  type ListingServiceStatus,
} from "../../../services/listingService";

export function useListings(initialListings?: ListingItem[]) {
  const [listings, setListings] = useState<ListingItem[]>(() => initialListings || getPublicListings());
  const [isLoading, setIsLoading] = useState<boolean>(!initialListings || initialListings.length === 0);
  const [status, setStatus] = useState<ListingServiceStatus>(() => getListingServiceStatus());

  const loadListings = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const data = await fetchPublicListingsFromSupabase(force);
      setListings(data);
      setStatus(getListingServiceStatus());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings(false);

    const handleListingsChanged = (e: CustomEvent<ListingItem[]>) => {
      if (Array.isArray(e.detail)) {
        setListings(e.detail);
        setStatus(getListingServiceStatus());
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("listingsChanged", handleListingsChanged as EventListener);
      return () => {
        window.removeEventListener("listingsChanged", handleListingsChanged as EventListener);
      };
    }
  }, [loadListings]);

  const refetch = useCallback(() => {
    return loadListings(true);
  }, [loadListings]);

  return {
    listings,
    isLoading,
    isOffline: status.isOffline,
    errorType: status.errorType,
    error: status.errorMessage,
    refetch,
    retry: refetch,
  };
}
