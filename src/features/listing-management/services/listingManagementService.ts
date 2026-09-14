// @ts-ignore
import { saveListing, updateListing } from "../../../../js/services/storageListings.js";
import { mapListingDtoToDomain } from "../../../domain/listing/listing.mapper";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { ListingCreateDTO } from "../../../domain/listing/listing.dto";

export async function createNewListing(dto: ListingCreateDTO): Promise<{ success: boolean; listing?: ListingModel; error?: string }> {
  try {
    const rawListing = await saveListing(dto);
    if (!rawListing) {
      return { success: false, error: "Gagal membuat listing" };
    }
    return { success: true, listing: mapListingDtoToDomain(rawListing) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat membuat listing" };
  }
}

export async function updateExistingListing(id: string, updates: Partial<ListingCreateDTO>): Promise<{ success: boolean; listing?: ListingModel; error?: string }> {
  try {
    const rawListing = await updateListing(id, updates);
    if (!rawListing) {
      return { success: false, error: "Gagal memperbarui listing" };
    }
    return { success: true, listing: mapListingDtoToDomain(rawListing) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui listing" };
  }
}

