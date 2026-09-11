/**
 * storageAppReviews.js
 * Modul khusus untuk ulasan aplikasi (App Reviews & Community Feedback).
 * Dipecah dari storageReviews.js untuk pemerataan beban kerja.
 */

import { getCurrentUser, getUserById, getUserByReviewAuthor } from "./auth.js";
import { supabase } from "../lib/supabase.js";
import { formatRegionTitle, formatDistrictTitle } from "../utils/runtime.js";

export const STORAGE_KEY_APP_REVIEWS = "pusat_barkas_app_reviews";
export const DEFAULT_APP_REVIEWS = [];

// Native Browser BroadcastChannel untuk sinkronisasi lintas tab
const realtimeChannel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("pusat_barkas_realtime_v2") : null;

// Safe broadcast helper
function safeBroadcastToCloud(type, data) {
  try {
    import("./cloudSync.js")
      .then(({ broadcastToCloud }) => {
        if (typeof broadcastToCloud === "function") {
          broadcastToCloud(type, data).catch((e) => console.warn("[CloudSync Broadcast Warning]", e));
        }
      })
      .catch(() => {});
  } catch (e) {
    console.warn("[CloudSync Broadcast Exception]", e);
  }
}

// ─── FETCH APP REVIEWS DARI SUPABASE ─────────────────────────────────────────

export async function fetchAppReviewsFromSupabase() {
  if (!supabase) return getAppReviews();
  try {
    const { data: sbReviews, error } = await supabase
      .from("app_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(sbReviews)) {
      // Relasional/Lookup matching ke tabel public.users untuk menyinkronkan nama & lokasi terkini
      let usersMap = new Map();
      try {
        const { data: allLiveUsers } = await supabase.from("users").select("*");

        if (allLiveUsers && Array.isArray(allLiveUsers)) {
          allLiveUsers.forEach((u) => {
            if (u.id) usersMap.set(String(u.id).toLowerCase(), u);
            if (u.email) usersMap.set(String(u.email).toLowerCase(), u);
          });
        }
  // eslint-disable-next-line no-unused-vars
      } catch (uErr) {}

      const mapped = sbReviews.map((r) => {
        const uId = r.user_id ? String(r.user_id).toLowerCase() : "";
        const liveUser = usersMap.get(uId) || getUserByReviewAuthor(r.user_id, r.user_name);

        let resolvedName = r.user_name || "Pengguna";
        let resolvedLocation = r.user_location || "Solo Raya";
        let resolvedAvatar = null;

        if (liveUser) {
          const rawStore = liveUser.store_name || liveUser.storeName;
          const rawName = liveUser.name;
          const cleanDisplayName = rawStore || rawName || resolvedName.replace(/\(.*?\)/g, "").trim();
          const rawLoc = liveUser.district || liveUser.region || resolvedLocation;
          resolvedLocation = formatDistrictTitle(rawLoc) || formatRegionTitle(rawLoc) || "Solo Raya";
          resolvedName = `${cleanDisplayName} (${resolvedLocation})`;
          resolvedAvatar = liveUser.avatar || null;
        } else if (r.user_location && !resolvedName.includes("(")) {
          resolvedName = `${resolvedName} (${r.user_location})`;
        }

        return {
          id: r.id,
          userId: r.user_id,
          userName: resolvedName,
          userLocation: resolvedLocation,
          userAvatar: resolvedAvatar,
          rating: Number(r.rating) || 5,
          category: r.category || "Pengalaman Pengguna",
          comment: r.review_text || "",
          review_text: r.review_text || "",
          createdAt: r.created_at,
          created_at: r.created_at,
        };
      });

      window.__appReviewsCache = mapped;
      window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { reviews: mapped } }));
      return mapped;
    } else if (error) {
      console.warn("[Supabase fetchAppReviewsFromSupabase Error]", error.message || error);
    }
  } catch (err) {
    console.warn("[Supabase fetchAppReviewsFromSupabase Exception]", err);
  }
  return getAppReviews();
}

// ─── AMBIL APP REVIEWS ────────────────────────────────────────────────────────

export function getAppReviews(includeHidden = false) {
  try {
    let reviews = window.__appReviewsCache || [];
    if (!Array.isArray(reviews)) reviews = [];
    if (!includeHidden) {
      reviews = reviews.filter((r) => !r.isHidden);
    }
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return [];
  }
}

// ─── TAMBAH APP REVIEW ────────────────────────────────────────────────────────

export function addAppReview({ rating, category, comment }) {
  const sessionUser = getCurrentUser();
  if (!sessionUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan aplikasi.");
  }
  const currentUser = (sessionUser.id ? getUserById(sessionUser.id) : null) || sessionUser;

  const cleanComment = (comment || "").trim();
  if (!cleanComment) {
    throw new Error("Silakan tuliskan ulasan atau masukan Anda.");
  }
  const numRating = Number(rating) || 5;

  const all = getAppReviews(true);

  const rawFullName = (currentUser.name || currentUser.storeName || currentUser.store_name || "Pengguna").trim();
  const firstName = rawFullName.split(/\s+/)[0] || "Pengguna";

  const rawDistrict = currentUser.district || currentUser.region || "Solo";
  const districtTitle = formatDistrictTitle(rawDistrict) || formatRegionTitle(rawDistrict) || "Solo";

  const fullUserName = `${firstName} ${districtTitle}`.trim();
  const locationTag = districtTitle;

  const generateUuid = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (_e) {}
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const newReview = {
    id: generateUuid(),
    userId: currentUser.id,
    userName: fullUserName,
    userLocation: locationTag,
    userAvatar:
      currentUser.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.email || currentUser.id || fullUserName)}`,
    rating: Math.min(5, Math.max(1, numRating)),
    category: category || "Pengalaman Pengguna",
    comment: cleanComment,
    review_text: cleanComment,
    createdAt: new Date().toISOString(),
  };

  all.unshift(newReview);
  window.__appReviewsCache = all;

  window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: newReview } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "APP_REVIEW_ADDED", payload: newReview });
  }

  safeBroadcastToCloud("APP_REVIEW_ADDED", newReview);

  if (supabase) {
    const sbPayload = {
      id: newReview.id,
      user_id: currentUser.id,
      user_name: fullUserName,
      user_location: locationTag,
      rating: newReview.rating,
      category: newReview.category,
      review_text: cleanComment,
      created_at: newReview.createdAt,
    };

    console.log("[Supabase App Review] Mengirim payload ulasan ke tabel app_reviews:", sbPayload);

    supabase
      .from("app_reviews")
      .insert([sbPayload])
      .then(({ data, error }) => {
        if (error) {
          console.error("[Supabase Error] Gagal menyimpan ulasan ke tabel app_reviews:", error.message || error);
        } else {
          console.log("[Supabase Success] Ulasan aplikasi berhasil disimpan:", data || sbPayload.id);
        }
      })
      .catch((err) => {
        console.error("[Supabase Exception] Kendala saat insert ke app_reviews:", err);
      });
  }

  return newReview;
}

// ─── HAPUS APP REVIEW ─────────────────────────────────────────────────────────

export async function deleteAppReview(reviewId) {
  if (supabase) {
    try {
      console.log(`[deleteAppReview] Menghapus ulasan dari tabel app_reviews Supabase (id = "${reviewId}")...`);
      const { error } = await supabase.from("app_reviews").delete().eq("id", reviewId);

      if (error) {
        console.error("[deleteAppReview: Supabase Error]", error.message || error);
        throw error;
      }
      console.log("[deleteAppReview: Supabase Success] Ulasan berhasil dihapus permanen dari Supabase");
    } catch (sbErr) {
      console.error("[deleteAppReview: Supabase Exception]", sbErr);
      throw sbErr;
    }
  }

  const all = getAppReviews(true);
  const filtered = all.filter((r) => r.id !== reviewId);
  window.__appReviewsCache = filtered;

  window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { deletedId: reviewId } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "APP_REVIEW_DELETED", payload: reviewId });
  }

  safeBroadcastToCloud("APP_REVIEW_DELETED", reviewId);
  return true;
}

// ─── UPDATE APP REVIEW ────────────────────────────────────────────────────────

export function updateAppReview({ id, rating, category, comment }) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu.");
  }
  const all = getAppReviews(true);
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error("Ulasan tidak ditemukan.");
  }

  const isAdmin = sessionStorage.getItem("pusat_barkas_admin_auth") === "true";
  const isOwner = all[idx].userId === currentUser.id || all[idx].userId === currentUser.email;
  if (!isOwner && !isAdmin) {
    throw new Error("Akses ditolak: Anda hanya dapat mengedit ulasan milik Anda sendiri.");
  }

  const cleanComment = (comment || "").trim();
  if (!cleanComment) {
    throw new Error("Silakan tuliskan ulasan atau masukan Anda.");
  }
  const numRating = Number(rating) || 5;
  const activeUser = (currentUser.id ? getUserById(currentUser.id) : null) || currentUser;
  const rawFullName = (activeUser.name || activeUser.storeName || activeUser.store_name || "Pengguna").trim();
  const firstName = rawFullName.split(/\s+/)[0] || "Pengguna";
  const rawDistrict = activeUser.district || activeUser.region || "Solo";
  const districtTitle = formatDistrictTitle(rawDistrict) || formatRegionTitle(rawDistrict) || "Solo";
  const fullUserName = `${firstName} ${districtTitle}`.trim();
  const locationTag = districtTitle;

  all[idx] = {
    ...all[idx],
    userName: fullUserName,
    userLocation: locationTag,
    userAvatar: activeUser.avatar || all[idx].userAvatar,
    rating: Math.min(5, Math.max(1, numRating)),
    category: category || all[idx].category,
    comment: cleanComment,
    review_text: cleanComment,
    updatedAt: new Date().toISOString(),
  };

  window.__appReviewsCache = all;

  window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: all[idx] } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "APP_REVIEW_UPDATED", payload: all[idx] });
  }

  safeBroadcastToCloud("APP_REVIEW_UPDATED", all[idx]);

  if (supabase) {
    supabase
      .from("app_reviews")
      .update({
        user_name: fullUserName,
        user_location: locationTag,
        rating: all[idx].rating,
        category: all[idx].category,
        review_text: cleanComment,
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[Supabase Error] Gagal update ulasan di app_reviews:", error.message);
      })
      .catch(() => {});
  }

  return all[idx];
}

// ─── SEMBUNYIKAN / TAMPILKAN APP REVIEW ──────────────────────────────────────

export function toggleHideAppReview(reviewId) {
  const all = getAppReviews(true);
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  all[idx].isHidden = !all[idx].isHidden;
  window.__appReviewsCache = all;

  window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: all[idx] } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "APP_REVIEW_UPDATED", payload: all[idx] });
  }

  safeBroadcastToCloud("APP_REVIEW_UPDATED", all[idx]);
  return all[idx];
}

// ─── STATISTIK RATING APP ─────────────────────────────────────────────────────

export function getAppRatingStats() {
  const reviews = getAppReviews(false);
  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const totalReviews = reviews.length;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    sum += r.rating;
  });

  const averageRating = Number((sum / totalReviews).toFixed(1));

  return {
    averageRating,
    totalReviews,
    ratingCounts,
  };
}
