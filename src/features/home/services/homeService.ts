import { sbGetPublicListings, getPublicListings } from "../../../services/listingService";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { SupabaseListingRowDTO } from "../../../domain/listing/listing.dto";

export async function fetchHomeListings(): Promise<ListingModel[]> {
  try {
    const rawData = await sbGetPublicListings();
    if (rawData && Array.isArray(rawData) && rawData.length > 0) {
      return rawData.map((row: SupabaseListingRowDTO) => mapListingDtoToDomain(row));
    }
    const local = getPublicListings();
    return local.map((item: any) => mapListingDtoToDomain(item));
  } catch (error) {
    console.error("[HomeService] Failed to fetch public listings:", error);
    const local = getPublicListings();
    return local.map((item: any) => mapListingDtoToDomain(item));
  }
}
