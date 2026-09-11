/**
 * Storage Facade Module
 * Central re-exporter untuk storageListings, storageFavorites, storageReviews, dan storageSettings.
 * Preserves 100% backward compatibility untuk semua import yang ada.
 *
 * Catatan: storageFavorites.js di-re-export melalui storageListings.js
 */

export * from "./storageListings.js";
export * from "./storageReviews.js";
export * from "./storageSettings.js";
export * from "./auth.js";
export { formatRupiah } from "./whatsapp.js";
export { getRegionById, getDistrictsByRegionId } from "../data/regions.js";
