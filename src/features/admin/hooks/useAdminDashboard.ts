import { useState, useEffect, useCallback } from "react";
import {
  getAllListings,
  deleteListing,
  toggleHideListing,
  toggleSoldStatus,
} from "../../../../js/services/storage.js";

export interface AdminListingItem {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  regionId: string;
  district?: string;
  codPoint?: string;
  images?: string[];
  isHidden?: boolean;
  isSold?: boolean;
  seller?: {
    name?: string;
    storeName?: string;
    phone?: string;
  };
}

export interface AdminStats {
  total: number;
  active: number;
  hidden: number;
  sold: number;
}

export function useAdminDashboard() {
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, active: 0, hidden: 0, sold: 0 });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      const rawListings = (getAllListings() || []) as unknown as AdminListingItem[];
      
      // Calculate stats
      const total = rawListings.length;
      const active = rawListings.filter((l) => !l.isHidden && !l.isSold).length;
      const hidden = rawListings.filter((l) => l.isHidden).length;
      const sold = rawListings.filter((l) => l.isSold).length;
      setStats({ total, active, hidden, sold });

      // Apply search and filtering
      let filtered = [...rawListings];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((l) => {
          const titleMatch = l.title?.toLowerCase().includes(q);
          const sellerName = l.seller?.storeName || l.seller?.name || "";
          const sellerMatch = sellerName.toLowerCase().includes(q);
          return titleMatch || sellerMatch;
        });
      }

      if (selectedRegion !== "all") {
        filtered = filtered.filter((l) => l.regionId === selectedRegion);
      }

      if (selectedStatus === "active") {
        filtered = filtered.filter((l) => !l.isHidden && !l.isSold);
      } else if (selectedStatus === "hidden") {
        filtered = filtered.filter((l) => l.isHidden);
      } else if (selectedStatus === "sold") {
        filtered = filtered.filter((l) => l.isSold);
      }

      setListings(filtered);
    } catch {
      setListings([]);
      setStats({ total: 0, active: 0, hidden: 0, sold: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRegion, selectedStatus]);

  useEffect(() => {
    loadData();

    const handleListingsChange = () => {
      loadData();
    };

    window.addEventListener("listingsChanged", handleListingsChange);
    return () => {
      window.removeEventListener("listingsChanged", handleListingsChange);
    };
  }, [loadData]);

  const toggleHide = (id: string) => {
    const updated = toggleHideListing(id);
    loadData();
    return updated;
  };

  const toggleSold = (id: string) => {
    const updated = toggleSoldStatus(id);
    loadData();
    return updated;
  };

  const removeListing = (id: string) => {
    const result = deleteListing(id);
    loadData();
    return result;
  };

  return {
    listings,
    stats,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    selectedStatus,
    setSelectedStatus,
    isLoading,
    refresh: loadData,
    toggleHide,
    toggleSold,
    removeListing,
  };
}
