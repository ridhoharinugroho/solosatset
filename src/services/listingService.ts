/**
 * Listing Service Module (TypeScript)
 * SOPALOKA Pure Next.js / React / TypeScript Listing Engine
 */

import { SAMPLE_LISTINGS, type ListingItem } from "../lib/sampleListings.ts";
import { getCurrentUser } from "./authService.ts";
import { supabase } from "../lib/supabase.ts";

export { SAMPLE_LISTINGS };
export type { ListingItem };

const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production";
let inMemoryListings: ListingItem[] = isProduction ? [] : [...SAMPLE_LISTINGS];
let isStorageInitialized = false;
let isFetchingListingsFromSupabase = false;
let lastFetchListingsTime = 0;

export async function deleteAvatarFile(avatarUrlOrPath?: string | null): Promise<boolean> {
  if (!avatarUrlOrPath || typeof avatarUrlOrPath !== "string") return true;
  const rawUrl = avatarUrlOrPath.trim();
  if (!rawUrl || rawUrl.includes("dicebear.com") || rawUrl.includes("unsplash.com") || rawUrl.startsWith("data:")) {
    return true;
  }

  try {
    let rawCleaned = rawUrl;
    if (rawUrl.includes("/avatars/")) {
      rawCleaned = rawUrl.split("/avatars/").pop() || rawUrl;
    } else if (rawUrl.includes("avatars/")) {
      rawCleaned = rawUrl.split("avatars/").pop() || rawUrl;
    }

    const cleanPath = decodeURIComponent(rawCleaned.split("?")[0].split("#")[0].trim());
    if (!cleanPath || cleanPath === "") return true;

    if (supabase && supabase.storage) {
      const { error } = await supabase.storage.from("avatars").remove([cleanPath]);
      if (error) {
        console.warn(`[Storage deleteAvatarFile Notice] Gagal menghapus file avatar "${cleanPath}":`, error.message);
      }
      return true;
    }
  } catch (err: any) {
    console.warn("[Storage deleteAvatarFile Exception]:", err.message || err);
    return true;
  }
  return true;
}

export function safeBroadcastToCloud(type: string, data: any): void {
  // Safe notification dispatch across components
}

export function getAllListings(): ListingItem[] {
  if (typeof window !== "undefined" && Array.isArray((window as any).__listingsCache)) {
    return (window as any).__listingsCache;
  }
  if (typeof window !== "undefined" && Array.isArray((window as any).__listings)) {
    return (window as any).__listings;
  }
  if (!isProduction && (!Array.isArray(inMemoryListings) || inMemoryListings.length === 0)) {
    inMemoryListings = [...SAMPLE_LISTINGS];
  }
  return inMemoryListings || [];
}

export function getPublicListings(): ListingItem[] {
  const all = getAllListings();
  const localListings = all.filter((item) => !item.isHidden && item.status !== "deleted");
  if (!isProduction && localListings.length === 0 && Array.isArray(SAMPLE_LISTINGS) && SAMPLE_LISTINGS.length > 0) {
    return [...SAMPLE_LISTINGS];
  }
  return localListings;
}

export function getListingById(id: string): ListingItem | null {
  const listings = getAllListings();
  return listings.find((item) => String(item.id).trim() === String(id).trim()) || null;
}

export function processAndBroadcastSupabaseListings(cloudData: any[]): ListingItem[] {
  if (!Array.isArray(cloudData)) return [];
  const cleanCloud: ListingItem[] = cloudData
    .filter((c) => {
      if (!c) return false;
      const sEmail = c.seller_email || (c.seller && c.seller.email) || "";
      const sName = c.seller_name || (c.seller && (c.seller.storeName || c.seller.name)) || "";
      return (
        !sEmail.toLowerCase().includes("danang.solo") &&
        !sName.toLowerCase().includes("danang") &&
        c.status !== "deleted"
      );
    })
    .map((c) => {
      let parsedImages: string[] = [];
      if (Array.isArray(c.images)) {
        parsedImages = c.images;
      } else if (typeof c.images === "string") {
        try {
          const p = JSON.parse(c.images);
          if (Array.isArray(p)) parsedImages = p;
          else if (c.images.startsWith("http")) parsedImages = [c.images];
        } catch (e) {
          if (c.images.startsWith("http")) parsedImages = [c.images];
        }
      }
      if (!parsedImages || parsedImages.length === 0) {
        parsedImages = ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"];
      }

      return {
        id: c.id,
        title: c.title || "Barang Jualan",
        price: Number(c.price) || 0,
        category: c.category || "lainnya",
        condition: c.condition || "good",
        negoType: c.nego_type || c.negoType || "nego_alus",
        paymentMethod: c.payment_method || c.paymentMethod || "cod",
        regionId: c.region || c.regionId || "",
        district: c.district || "",
        provinceCode: c.province_code || c.provinceCode || null,
        regencyCode: c.regency_code || c.regencyCode || null,
        districtCode: c.district_code || c.districtCode || null,
        village: c.village || "",
        codPoint: c.cod_point || c.codPoint || (c.district ? "COD " + c.district : "COD"),
        description: c.description || "",
        images: parsedImages,
        seller: {
          id: c.seller_id || "user-anon",
          name: c.seller_name || "Penjual",
          storeName: c.seller_name || "Penjual",
          phone: c.seller_phone || "081234567890",
          avatar: c.seller_avatar || "",
          region: c.region || "",
        },
        status: c.status || "active",
        isSold: c.status === "sold",
        is_bu: Boolean(c.is_bu || c.isBu),
        isBu: Boolean(c.is_bu || c.isBu),
        bu_expires_at: c.bu_expires_at || null,
        bu_activated_at: c.bu_activated_at || null,
        qris_verified: Boolean(c.qris_verified),
        payment_status: c.payment_status || (c.is_bu ? "verified" : "none"),
        views: Number(c.views) || 0,
        createdAt: c.created_at || c.createdAt || new Date().toISOString(),
      };
    });

  const finalData = cleanCloud.length > 0 ? cleanCloud : [...SAMPLE_LISTINGS];
  inMemoryListings = finalData;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: finalData }));
  }
  return finalData;
}

export interface ListingServiceStatus {
  isOffline: boolean;
  errorType: "none" | "network_error" | "database_error" | "timeout";
  errorMessage: string | null;
  lastFetchSuccess: boolean;
}

let lastFetchState: ListingServiceStatus = {
  isOffline: false,
  errorType: "none",
  errorMessage: null,
  lastFetchSuccess: true,
};

export function getListingServiceStatus(): ListingServiceStatus {
  return { ...lastFetchState };
}

export function classifyListingError(err: any): { type: "network_error" | "database_error" | "timeout"; isOffline: boolean; safeMessage: string } {
  const raw = String(err?.message || err?.details || err || "").toLowerCase();
  if (raw.includes("fetch failed") || raw.includes("network") || raw.includes("enotfound") || raw.includes("econnrefused") || raw.includes("failed to fetch")) {
    return { type: "network_error", isOffline: true, safeMessage: "Koneksi internet terputus. Silakan periksa jaringan Anda." };
  }
  if (raw.includes("timeout") || raw.includes("timed out")) {
    return { type: "timeout", isOffline: true, safeMessage: "Waktu koneksi ke server habis. Silakan coba lagi." };
  }
  return { type: "database_error", isOffline: false, safeMessage: "Gagal memuat data listing terbaru dari server." };
}

export async function fetchPublicListingsFromSupabase(force = false): Promise<ListingItem[]> {
  const now = Date.now();
  if (isFetchingListingsFromSupabase || (!force && now - lastFetchListingsTime < 30000 && lastFetchState.lastFetchSuccess)) {
    return getPublicListings();
  }

  isFetchingListingsFromSupabase = true;
  lastFetchListingsTime = now;

  if (!supabase) {
    lastFetchState = {
      isOffline: true,
      errorType: "network_error",
      errorMessage: "Layanan database tidak terhubung.",
      lastFetchSuccess: false,
    };
    isFetchingListingsFromSupabase = false;
    return getPublicListings();
  }

  try {
    const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });

    if (error) {
      const errInfo = classifyListingError(error);
      lastFetchState = {
        isOffline: errInfo.isOffline,
        errorType: errInfo.type,
        errorMessage: errInfo.safeMessage,
        lastFetchSuccess: false,
      };
      return inMemoryListings;
    }

    if (Array.isArray(data)) {
      lastFetchState = {
        isOffline: false,
        errorType: "none",
        errorMessage: null,
        lastFetchSuccess: true,
      };
      return processAndBroadcastSupabaseListings(data);
    }
  } catch (err: any) {
    const errInfo = classifyListingError(err);
    lastFetchState = {
      isOffline: errInfo.isOffline,
      errorType: errInfo.type,
      errorMessage: errInfo.safeMessage,
      lastFetchSuccess: false,
    };
  } finally {
    isFetchingListingsFromSupabase = false;
  }
  return getPublicListings();
}

export function getMyListings(userOrId?: string | any | null): ListingItem[] {
  if (!userOrId) return [];
  const targetId = typeof userOrId === "string" ? userOrId.trim() : (userOrId.id || "").trim();
  const targetPhone = typeof userOrId === "object" ? (userOrId.phone || "").replace(/\D/g, "") : "";
  const targetEmail = typeof userOrId === "object" ? (userOrId.email || "").toLowerCase().trim() : "";
  const targetName =
    typeof userOrId === "object" ? (userOrId.storeName || userOrId.name || "").toLowerCase().trim() : "";

  const listings = getAllListings();
  return listings.filter((item) => {
    if (!item || item.status === "deleted") return false;

    const sId = item.seller?.id || (item as any).seller_id || (item as any).user_id || (item as any).userId;
    if (targetId && sId && String(sId).trim() === targetId) {
      return true;
    }

    if (targetId && (targetId === "user-ridho" || targetId === "user-1787309560138")) {
      if (sId === "user-ridho" || sId === "user-1787309560138") return true;
    }

    const sPhone = (item.seller?.phone || (item as any).seller_phone || "").replace(/\D/g, "");
    if (
      targetPhone &&
      sPhone &&
      (sPhone === targetPhone || sPhone.endsWith(targetPhone) || targetPhone.endsWith(sPhone))
    ) {
      return true;
    }

    const sEmail = (item.seller?.email || (item as any).seller_email || "").toLowerCase().trim();
    if (targetEmail && sEmail && sEmail === targetEmail) {
      return true;
    }

    const sName = (item.seller?.storeName || item.seller?.name || (item as any).seller_name || "").toLowerCase().trim();
    if (targetName && sName && (sName === targetName || targetName.includes(sName) || sName.includes(targetName))) {
      return true;
    }

    return false;
  });
}

export function isSellerVerified(sellerOrId?: string | any | null): boolean {
  if (!sellerOrId) return false;
  if (typeof sellerOrId === "object") {
    if (sellerOrId.isVerified || sellerOrId.is_verified || sellerOrId.badge_verified) return true;
    if (sellerOrId.qris_verified || sellerOrId.isQrisVerified) return true;
  }
  const sellerId = typeof sellerOrId === "string" ? sellerOrId : sellerOrId.id || sellerOrId.seller_id;
  if (!sellerId) return false;
  const listings = getAllListings();
  return listings.some((l) => {
    const sId = l.seller?.id || (l as any).seller_id;
    return sId === sellerId && (l.qris_verified || l.isQrisVerified);
  });
}

export function saveListing(listingData: any): ListingItem {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memasang iklan.");
  }

  const activeSellerId = currentUser.id;
  const activeSellerName = currentUser.storeName || currentUser.name || "Penjual";
  const activeSellerPhone = currentUser.phone || "081234567890";
  const activeSellerEmail = currentUser.email || "";
  const activeSellerAvatar = currentUser.avatar || "";
  const activeSellerRegion = currentUser.region || listingData.regionId || listingData.region || "";

  const isBu = Boolean(listingData.is_bu || listingData.isBu);
  const buExpiresAt = isBu ? listingData.bu_expires_at || null : null;

  const newListing: ListingItem = {
    id: `barkas-${Date.now()}`,
    title: String(listingData.title || "").trim(),
    price: Number(listingData.price) || 0,
    category: listingData.category || "lainnya",
    condition: listingData.condition || "good",
    negoType: listingData.negoType || listingData.nego_type || "nego_alus",
    nego_type: listingData.nego_type || listingData.negoType || "nego_alus",
    paymentMethod: listingData.paymentMethod || listingData.payment_method || "cod",
    payment_method: listingData.payment_method || listingData.paymentMethod || "cod",
    storeMapsUrl: listingData.storeMapsUrl || listingData.store_maps_url || "",
    store_maps_url: listingData.store_maps_url || listingData.storeMapsUrl || "",
    is_bu: isBu,
    isBu: isBu,
    bu_expires_at: buExpiresAt,
    qris_verified: Boolean(
      listingData.qris_verified || listingData.isQrisVerified || listingData.payment_status === "verified",
    ),
    regionId: listingData.regionId || listingData.region || activeSellerRegion,
    region: listingData.region || listingData.regionId || activeSellerRegion,
    district: listingData.district || currentUser.district || "Banjarsari",
    provinceCode: listingData.provinceCode || listingData.province_code || currentUser.provinceCode || null,
    province_code: listingData.province_code || listingData.provinceCode || currentUser.provinceCode || null,
    regencyCode: listingData.regencyCode || listingData.regency_code || currentUser.regencyCode || null,
    regency_code: listingData.regency_code || listingData.regencyCode || currentUser.regencyCode || null,
    districtCode: listingData.districtCode || listingData.district_code || currentUser.districtCode || null,
    district_code: listingData.district_code || listingData.districtCode || currentUser.districtCode || null,
    village: listingData.village || currentUser.village || "",
    codPoint:
      listingData.codPoint ||
      listingData.cod_point ||
      "COD di " + (listingData.district || listingData.region || "Solo Raya"),
    cod_point:
      listingData.cod_point ||
      listingData.codPoint ||
      "COD di " + (listingData.district || listingData.region || "Solo Raya"),
    description: listingData.description ? String(listingData.description).trim() : "",
    images: listingData.images && listingData.images.length > 0 ? listingData.images : [],
    seller: {
      id: activeSellerId,
      name: activeSellerName,
      storeName: activeSellerName,
      phone: activeSellerPhone,
      email: activeSellerEmail,
      avatar: activeSellerAvatar,
      region: activeSellerRegion,
    },
    createdAt: new Date().toISOString(),
    status: listingData.status || "active",
    payment_amount: listingData.payment_amount,
    payment_status: listingData.payment_status || (isBu ? "pending" : "none"),
  };

  const listings = getAllListings();
  listings.unshift(newListing);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: listings }));
  }

  if (supabase) {
    const sbRow = {
      id: newListing.id,
      title: newListing.title,
      description: newListing.description,
      price: Number(newListing.price) || 0,
      category: newListing.category,
      condition: newListing.condition,
      nego_type: newListing.negoType || "nego_alus",
      payment_method: newListing.paymentMethod || "cod",
      region: newListing.regionId || activeSellerRegion,
      district: newListing.district || "",
      cod_point: newListing.codPoint || "",
      seller_id: activeSellerId,
      seller_name: activeSellerName,
      seller_phone: activeSellerPhone,
      seller_avatar: activeSellerAvatar,
      images: newListing.images,
      status: newListing.status || "active",
      is_bu: newListing.is_bu,
      created_at: newListing.createdAt,
    };
    void supabase.from("listings").upsert([sbRow], { onConflict: "id" });
  }

  return newListing;
}

export function updateListing(id: string, updatedFields: Partial<ListingItem> | any): ListingItem {
  const targetId = String(id || "").trim();
  const listings = getAllListings();
  let index = listings.findIndex((item) => String(item.id).trim() === targetId);

  let updatedFieldsCopy = { ...updatedFields };
  if (updatedFieldsCopy.is_bu !== undefined || updatedFieldsCopy.isBu !== undefined) {
    const isBuVal = Boolean(updatedFieldsCopy.is_bu !== undefined ? updatedFieldsCopy.is_bu : updatedFieldsCopy.isBu);
    updatedFieldsCopy.is_bu = isBuVal;
    updatedFieldsCopy.isBu = isBuVal;
    updatedFieldsCopy.bu_expires_at = isBuVal ? updatedFieldsCopy.bu_expires_at || null : null;
  }

  if (index === -1) {
    const newEntry: ListingItem = {
      id: targetId,
      title: "Barang",
      price: 0,
      category: "lainnya",
      condition: "good",
      description: "",
      images: [],
      seller: { id: "user-anon", name: "Penjual", storeName: "Penjual", phone: "" },
      status: "active",
      createdAt: new Date().toISOString(),
      ...updatedFieldsCopy,
      updatedAt: new Date().toISOString(),
    };
    listings.unshift(newEntry);
    index = 0;
  } else {
    listings[index] = {
      ...listings[index],
      ...updatedFieldsCopy,
      updatedAt: new Date().toISOString(),
    };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: listings }));
  }

  if (supabase) {
    void supabase.from("listings").update(updatedFieldsCopy).eq("id", targetId);
  }

  return listings[index];
}

export function updateListingStatus(id: string, newStatus: string): ListingItem {
  return updateListing(id, {
    status: newStatus,
    isSold: newStatus === "sold",
  });
}

export function toggleSoldStatus(id: string): ListingItem | null {
  const listings = getAllListings();
  const index = listings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  listings[index].isSold = !listings[index].isSold;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: listings }));
  }
  return listings[index];
}

export function toggleHideListing(id: string): ListingItem | null {
  const listings = getAllListings();
  const index = listings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  listings[index].isHidden = !listings[index].isHidden;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: listings }));
  }
  return listings[index];
}

export function deleteListing(id: string): boolean {
  inMemoryListings = inMemoryListings.filter((item) => String(item.id).trim() !== String(id).trim());

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listingsChanged", { detail: inMemoryListings }));
  }

  if (supabase) {
    void supabase.from("listings").delete().eq("id", id);
  }

  return true;
}

export function incrementListingViews(id: string): void {
  const listings = getAllListings();
  const item = listings.find((l) => l.id === id);
  if (item) {
    item.views = (item.views || 0) + 1;
  }
}

// ─── FAVORIT & STATISTIK ──────────────────────────────────────────────────────

export async function getFavoriteIds(): Promise<string[]> {
  if (typeof window !== "undefined" && Array.isArray((window as any).__favorites)) {
    return (window as any).__favorites;
  }
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from("favorites").select("listing_id");
    if (!error && Array.isArray(data)) {
      const favs = data.map((row: any) => row.listing_id);
      if (typeof window !== "undefined") (window as any).__favorites = favs;
      return favs;
    }
  } catch (e) {}
  return [];
}

export async function toggleFavorite(listingId: string): Promise<boolean> {
  const favs = await getFavoriteIds();
  const exists = favs.includes(listingId);
  let updated: string[];
  if (exists) {
    updated = favs.filter((id) => id !== listingId);
    if (supabase) await supabase.from("favorites").delete().eq("listing_id", listingId);
  } else {
    updated = [...favs, listingId];
    if (supabase) await supabase.from("favorites").insert({ listing_id: listingId });
  }
  if (typeof window !== "undefined") (window as any).__favorites = updated;
  return !exists;
}

export function isFavorite(listingId: string): boolean {
  if (typeof window !== "undefined" && Array.isArray((window as any).__favorites)) {
    return (window as any).__favorites.includes(listingId);
  }
  return false;
}

export function getListingsBySellerId(sellerId: string): ListingItem[] {
  if (!sellerId) return [];
  const listings = getAllListings();
  return listings.filter((item) => item.seller && item.seller.id === sellerId);
}

export function getSellerStats(sellerId: string) {
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

export async function sbGetPublicListings(): Promise<any[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) return null;
  return data;
}

export async function sbGetListingById(id: string): Promise<any | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}
