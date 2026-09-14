import { getMyListings, isSellerVerified } from "../../../services/listingService";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { SupabaseListingRowDTO } from "../../../domain/listing/listing.dto";

export async function fetchSellerListingsData(sellerId?: string): Promise<ListingModel[]> {
  try {
    const rawData = await getMyListings(sellerId);
    if (!rawData || !Array.isArray(rawData)) return [];
    return rawData.map((row: SupabaseListingRowDTO) => mapListingDtoToDomain(row));
  } catch (error) {
    console.error("[SellerService] fetchSellerListingsData error:", error);
    return [];
  }
}

export function checkSellerVerificationStatus(sellerId: string): boolean {
  try {
    return isSellerVerified(sellerId);
  } catch (error) {
    console.error("[SellerService] checkSellerVerificationStatus error:", error);
    return false;
  }
}
