/**
 * storageFavorites.js
 * Modul khusus untuk pengelolaan favorit listing dan statistik penjual.
 * Dipecah dari storageListings.js untuk pemerataan beban kerja.
 */

import { supabase } from "../lib/supabase.js";
import { getAllListings } from "./storageListings.js";

// ─── FAVORIT LISTING ──────────────────────────────────────────────────────────

/**
 * Ambil semua ID listing yang difavoritkan (cache di memory).
 * Data di-fetch dari Supabase jika belum tersedia.
 */
export async function getFavoriteIds() {
  try {
    // Kembalikan cache jika sudah ada
    if (Array.isArray(window.__favorites)) return window.__favorites;
    const { data, error } = await supabase.from("favorites").select("listing_id");
    if (error) {
      console.warn("[Supabase] fetch favorites error:", error.message);
      window.__favorites = [];
    } else if (Array.isArray(data)) {
      window.__favorites = data.map((row) => row.listing_id);
    } else {
      window.__favorites = [];
    }
    return window.__favorites;
  } catch (e) {
    console.error("[Supabase] exception fetching favorites:", e);
    window.__favorites = [];
    return [];
  }
}

/**
 * Tambah atau hapus listing dari favorit, sync ke Supabase.
 */
export async function toggleFavorite(listingId) {
  const favs = await getFavoriteIds();
  const exists = favs.includes(listingId);
  let updated;
  if (exists) {
    updated = favs.filter((id) => id !== listingId);
    await supabase.from("favorites").delete().eq("listing_id", listingId);
  } else {
    updated = [...favs, listingId];
    await supabase.from("favorites").insert({ listing_id: listingId });
  }
  window.__favorites = updated;
  return !exists;
}

/**
 * Cek apakah sebuah listing sudah difavoritkan.
 */
export function isFavorite(listingId) {
  try {
    const favs = Array.isArray(window.__favorites) ? window.__favorites : [];
    return favs.includes(listingId);
  } catch (e) {
    console.error("[isFavorite] error:", e);
    return false;
  }
}

// ─── STATISTIK PENJUAL ────────────────────────────────────────────────────────

/**
 * Ambil semua listing milik satu penjual berdasarkan sellerId.
 */
export function getListingsBySellerId(sellerId) {
  if (!sellerId) return [];
  const listings = getAllListings();
  return listings.filter((item) => item.seller && item.seller.id === sellerId);
}

/**
 * Hitung statistik listing penjual: total, tersedia, dipesan, terjual, views.
 */
export function getSellerStats(sellerId) {
  const items = getListingsBySellerId(sellerId);
  const totalListings = items.length;
  const availableCount = items.filter((l) => !l.isSold && l.status !== "sold" && l.status !== "booked").length;
  const bookedCount = items.filter((l) => l.status === "booked").length;
  const soldCount = items.filter((l) => l.isSold || l.status === "sold").length;
  const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);

  return {
    totalListings,
    availableCount,
    bookedCount,
    soldCount,
    totalViews,
  };
}
