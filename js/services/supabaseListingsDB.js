/**
 * Supabase Listings DB Module - Listings CRUD & Subscriptions
 */
import { supabase } from "../lib/supabase.js";
import { sbUploadMultipleImages } from "./supabaseStorageDB.js";

function requireClient(fnName) {
  if (!supabase) {
    console.warn(`[SupabaseListingsDB] ${fnName}() dilewati - client belum terkonfigurasi.`);
    return false;
  }
  return true;
}

/** Ambil semua listing publik (status = active) */
export async function sbGetPublicListings() {
  if (!requireClient("sbGetPublicListings")) return null;
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[SupabaseDB] getPublicListings:", error.message);
    return null;
  }
  return data;
}

/** Ambil satu listing berdasarkan ID */
export async function sbGetListingById(id) {
  if (!requireClient("sbGetListingById")) return null;
  const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
  if (error) {
    console.error("[SupabaseDB] getListingById:", error.message);
    return null;
  }
  return data;
}

// ============================================================
// STORAGE BUCKET - Upload & Kompresi Foto 1:1 (product-images)
// ============================================================

/**
 * Konversi Data URL base64 ke standard Blob (compressedFile)
 * @param {string} dataUrl
 * @returns {Blob}
 */
export async function sbSaveListing(listing) {
  if (!requireClient("sbSaveListing")) return null;

  let payload = { ...listing };
  if (
    payload.images &&
    Array.isArray(payload.images) &&
    payload.images.some((img) => typeof img === "string" && img.startsWith("data:"))
  ) {
    const uploadedUrls = await sbUploadMultipleImages(payload.images, "");
    if (uploadedUrls && uploadedUrls.length > 0) {
      payload.images = uploadedUrls;
    }
  }

  const sellerId = listing.seller?.id || listing.seller_id || listing.user_id;
  const isBu = Boolean(listing.is_bu || listing.isBu);
  const buExpiresAt = isBu ? listing.bu_expires_at || null : null;

  const insertPayload = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price) || 0,
    category: listing.category,
    condition: listing.condition || "good",
    nego_type: listing.negoType || listing.nego_type || "nego_alus",
    payment_method: listing.payment_method || listing.paymentMethod || "cod",
    region: listing.regionId || listing.region || "solo",
    district: listing.district || "",
    cod_point: listing.cod_point || listing.codPoint || "",
    store_maps_url: listing.store_maps_url || listing.storeMapsUrl || "",
    seller_id: sellerId,
    seller_name: listing.seller?.storeName || listing.seller?.name || listing.seller_name || "Penjual",
    seller_phone: listing.seller?.phone || listing.seller_phone || "",
    seller_avatar: listing.seller?.avatar || listing.seller_avatar || "",
    images: payload.images || [],
    status: listing.status || "active",
    is_bu: isBu,
    bu_expires_at: buExpiresAt,
    qris_verified: Boolean(listing.qris_verified || listing.isQrisVerified),
    views: Number(listing.views) || 0,
    created_at: listing.createdAt || listing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("listings").insert([insertPayload]).select().single();

  if (error) {
    console.error("❌ [SupabaseDB] saveListing error:", error.message);
    return null;
  }
  return data;
}

/**
 * Update listing yang sudah ada
 * Memastikan payload mencakup is_bu dan bu_expires_at saat fitur BU diaktifkan
 */
export async function sbUpdateListing(id, updates) {
  if (!requireClient("sbUpdateListing")) return null;

  let payload = { ...updates };
  if (
    payload.images &&
    Array.isArray(payload.images) &&
    payload.images.some((img) => typeof img === "string" && img.startsWith("data:"))
  ) {
    const uploadedUrls = await sbUploadMultipleImages(payload.images, "");
    if (uploadedUrls && uploadedUrls.length > 0) {
      payload.images = uploadedUrls;
    }
  }

  // Sanitize dan petakan kolom valid tabel listings
  const cleanUpdatePayload = {};
  if (payload.title !== undefined) cleanUpdatePayload.title = payload.title;
  if (payload.description !== undefined) cleanUpdatePayload.description = payload.description;
  if (payload.price !== undefined) cleanUpdatePayload.price = Number(payload.price) || 0;
  if (payload.category !== undefined) cleanUpdatePayload.category = payload.category;
  if (payload.condition !== undefined) cleanUpdatePayload.condition = payload.condition;
  if (payload.negoType !== undefined || payload.nego_type !== undefined)
    cleanUpdatePayload.nego_type = payload.negoType || payload.nego_type;
  if (payload.payment_method !== undefined || payload.paymentMethod !== undefined)
    cleanUpdatePayload.payment_method = payload.payment_method || payload.paymentMethod || "cod";
  if (payload.regionId !== undefined || payload.region !== undefined)
    cleanUpdatePayload.region = payload.regionId || payload.region;
  if (payload.district !== undefined) cleanUpdatePayload.district = payload.district;
  if (payload.cod_point !== undefined || payload.codPoint !== undefined)
    cleanUpdatePayload.cod_point = payload.cod_point || payload.codPoint || "";
  if (payload.store_maps_url !== undefined || payload.storeMapsUrl !== undefined)
    cleanUpdatePayload.store_maps_url = payload.store_maps_url || payload.storeMapsUrl || "";
  if (payload.status !== undefined) cleanUpdatePayload.status = payload.status;
  if (payload.views !== undefined) cleanUpdatePayload.views = Number(payload.views) || 0;
  if (payload.images !== undefined) cleanUpdatePayload.images = payload.images;
  if (payload.seller_id !== undefined || payload.seller?.id !== undefined)
    cleanUpdatePayload.seller_id = payload.seller_id || payload.seller?.id;
  if (payload.seller_name !== undefined || payload.seller?.name !== undefined)
    cleanUpdatePayload.seller_name = payload.seller_name || payload.seller?.name;
  if (payload.seller_phone !== undefined || payload.seller?.phone !== undefined)
    cleanUpdatePayload.seller_phone = payload.seller_phone || payload.seller?.phone;
  if (payload.seller_avatar !== undefined || payload.seller?.avatar !== undefined)
    cleanUpdatePayload.seller_avatar = payload.seller_avatar || payload.seller?.avatar;
  if (payload.qris_verified !== undefined || payload.isQrisVerified !== undefined)
    cleanUpdatePayload.qris_verified = Boolean(payload.qris_verified || payload.isQrisVerified);
  if (payload.payment_amount !== undefined) cleanUpdatePayload.payment_amount = payload.payment_amount;
  if (payload.payment_status !== undefined) cleanUpdatePayload.payment_status = payload.payment_status;

  if (payload.is_bu !== undefined || payload.isBu !== undefined) {
    const isBuVal = Boolean(payload.is_bu !== undefined ? payload.is_bu : payload.isBu);
    cleanUpdatePayload.is_bu = isBuVal;
    cleanUpdatePayload.bu_expires_at = isBuVal ? payload.bu_expires_at || null : null;
  }

  cleanUpdatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("listings").update(cleanUpdatePayload).eq("id", id).select().single();

  if (error) {
    console.error("❌ [SupabaseDB] updateListing error:", error.message);
    return null;
  }
  return data;
}

/** Hapus listing */
export async function sbDeleteListing(id) {
  if (!requireClient("sbDeleteListing")) return false;
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) {
    console.error("❌ [SupabaseDB] deleteListing error:", error.message);
    return false;
  }
  return true;
}

/** Increment view count listing */
export async function sbIncrementViews(id) {
  if (!requireClient("sbIncrementViews")) return;
  await supabase.rpc("increment_listing_views", { listing_id: id }).catch(() => {});
}

const activeGetMyListingsPromises = new Map();
let lastGetMyListingsTime = new Map();

/**
 * Ambil listing milik satu seller/user yang sedang login dari tabel listings Supabase
 * Menggunakan query komprehensif (seller_id, seller_phone, atau seller_name)
 * Dilengkapi pencegahan duplikasi query simultan (*in-flight de-duplication*)
 * @param {string|object} userOrId - ID Akun Penjual atau Objek User yang sedang aktif login
 * @param {boolean} [force=false] - Paksa ambil data baru dari Supabase
 * @returns {Promise<Array|null>}
 */
export async function sbGetMyListings(userOrId, force = false) {
  if (!requireClient("sbGetMyListings")) return null;
  if (!userOrId) {
    console.warn("⚠️ [SupabaseDB: sbGetMyListings] userOrId tidak boleh kosong");
    return [];
  }

  const sellerId = typeof userOrId === "string" ? userOrId.trim() : (userOrId.id || "").trim();
  const sellerPhone = typeof userOrId === "object" ? (userOrId.phone || "").trim() : "";
  const sellerName = typeof userOrId === "object" ? (userOrId.storeName || userOrId.name || "").trim() : "";
  const cacheKey = sellerId || sellerPhone || sellerName || "default";

  // Jika sedang ada request in-flight yang sama persis, kembalikan promise yang sedang berjalan
  if (activeGetMyListingsPromises.has(cacheKey)) {
    return activeGetMyListingsPromises.get(cacheKey);
  }

  const now = Date.now();
  const lastTime = lastGetMyListingsTime.get(cacheKey) || 0;
  if (!force && now - lastTime < 1500) {
    return null;
  }

  const fetchPromise = (async () => {
    try {
      console.log(
        `[SupabaseDB: sbGetMyListings] Mengambil daftar produk etalase penjual (ID: "${sellerId}", Phone: "${sellerPhone}", Toko: "${sellerName}")`,
      );

      const orConditions = [];
      if (sellerId) orConditions.push(`seller_id.eq.${sellerId}`);
      if (sellerPhone) orConditions.push(`seller_phone.eq.${sellerPhone}`);
      if (sellerName) orConditions.push(`seller_name.eq.${sellerName}`);

      let query = supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (orConditions.length > 0) {
        query = query.or(orConditions.join(","));
      } else if (sellerId) {
        query = query.eq("seller_id", sellerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ [SupabaseDB: sbGetMyListings Error]: Gagal memuat produk toko:", error.message || error);
        if (sellerId) {
          const { data: fallbackData } = await supabase
            .from("listings")
            .select("*")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });
          if (fallbackData) return fallbackData;
        }
        return null;
      }

      lastGetMyListingsTime.set(cacheKey, Date.now());
      console.log(
        `✅ [SupabaseDB: sbGetMyListings Sukses] Berhasil memuat ${data?.length || 0} produk untuk penjual (${sellerName || sellerId || sellerPhone})`,
      );
      return data || [];
    } catch (err) {
      console.error("❌ [SupabaseDB: sbGetMyListings Exception]:", err);
      return null;
    } finally {
      activeGetMyListingsPromises.delete(cacheKey);
    }
  })();

  activeGetMyListingsPromises.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// ============================================================
// USERS - Akun Penjual
// ============================================================

/** Ambil semua user terdaftar */
export function sbSubscribeListings(onInsert, onUpdate, onDelete) {
  if (!requireClient("sbSubscribeListings")) return null;
  const channel = supabase
    .channel("realtime-listings")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "listings" }, (payload) => {
      if (onInsert) onInsert(payload.new);
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "listings" }, (payload) => {
      if (onUpdate) onUpdate(payload.new, payload.old);
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "listings" }, (payload) => {
      if (onDelete) onDelete(payload.old);
    })
    .subscribe((status) => {
      console.log("[Supabase Realtime] listings channel:", status);
    });
  return channel;
}

/**
 * Subscribe ke perubahan site_settings secara realtime
 * @param {function} onChange - Callback saat settings berubah
 * @returns {object} channel
 */
