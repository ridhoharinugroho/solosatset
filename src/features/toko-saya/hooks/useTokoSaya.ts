import { useState, useEffect, useCallback, useMemo } from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { fetchTokoListings } from "../services/tokoSayaService";

export interface UseTokoSayaProps {
  initialListings?: ListingModel[];
  sellerId?: string;
}

export function useTokoSaya({ initialListings = [], sellerId }: UseTokoSayaProps = {}) {
  const [listings, setListings] = useState<ListingModel[]>(initialListings);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(initialListings.length === 0);

  const refreshToko = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTokoListings(sellerId);
      if (data && data.length > 0) {
        setListings(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (initialListings.length === 0) {
      refreshToko();
    }
  }, [initialListings.length, refreshToko]);

  const filteredListings = useMemo(() => {
    if (statusFilter === "all") return listings;
    if (statusFilter === "available" || statusFilter === "active") {
      return listings.filter(
        (l) => l.status.toLowerCase() === "active" || l.status.toLowerCase() === "available"
      );
    }
    return listings.filter((l) => l.status.toLowerCase() === statusFilter.toLowerCase());
  }, [listings, statusFilter]);

  const stats = useMemo(() => {
    const total = listings.length;
    const active = listings.filter((l) => l.status === "active").length;
    const sold = listings.filter((l) => l.status === "sold").length;
    const totalViews = listings.reduce((acc, l) => acc + (l.views || 0), 0);
    return { total, active, sold, totalViews };
  }, [listings]);

  return {
    listings: filteredListings,
    allListings: listings,
    statusFilter,
    setStatusFilter,
    stats,
    isLoading,
    refreshToko,
  };
}
