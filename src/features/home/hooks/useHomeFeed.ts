import { useState, useEffect, useCallback } from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { fetchHomeListings } from "../services/homeService";
import { getPublicListings } from "../../../services/listingService";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";

export interface UseHomeFeedProps {
  initialListings?: ListingModel[];
}

export function useHomeFeed({ initialListings = [] }: UseHomeFeedProps = {}) {
  const [listings, setListings] = useState<ListingModel[]>(() => {
    if (initialListings && initialListings.length > 0) return initialListings;
    const local = getPublicListings();
    return local.map((item: any) => mapListingDtoToDomain(item));
  });
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedListing, setSelectedListing] = useState<ListingModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const hasInitial = initialListings && initialListings.length > 0;

  useEffect(() => {
    if (hasInitial) {
      setListings(initialListings);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      fetchHomeListings()
        .then((data) => {
          if (data && data.length > 0) {
            setListings(data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [hasInitial]);

  const selectCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const openListingDetail = useCallback((listing: ListingModel) => {
    setSelectedListing(listing);
  }, []);

  const closeListingDetail = useCallback(() => {
    setSelectedListing(null);
  }, []);

  return {
    listings,
    activeCategory,
    selectedListing,
    isLoading,
    selectCategory,
    openListingDetail,
    closeListingDetail,
  };
}
