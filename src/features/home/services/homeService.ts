// @ts-ignore
import { sbGetPublicListings } from "../../../../js/services/supabaseListingsDB.js";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { SupabaseListingRowDTO } from "../../../domain/listing/listing.dto";

export async function fetchHomeListings(): Promise<ListingModel[]> {
  try {
    const rawData = await sbGetPublicListings();
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }
    return rawData.map((row: SupabaseListingRowDTO) => mapListingDtoToDomain(row));
  } catch (error) {
    console.error("[HomeService] Failed to fetch public listings:", error);
    return [];
  }
}
