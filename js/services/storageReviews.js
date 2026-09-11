/**
 * Storage Reviews Module - Seller Reviews & App Reviews Engine
 */

  // eslint-disable-next-line no-unused-vars
import { getCurrentUser, getUserByReviewAuthor, getUserById, formatJoinedDate } from "./auth.js";
import { supabase } from "../lib/supabase.js";
import { formatRegionTitle, formatDistrictTitle } from "../utils/runtime.js";

const realtimeChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("solosatset_seller_reviews") : null;
   
  // eslint-disable-next-line no-unused-vars
import { getMyListings, getPublicListings } from "./storageListings.js";
import { getListingsBySellerId } from "./storageFavorites.js";
import { DEFAULT_REVIEWS } from "./storageDefaultReviews.js";

export { DEFAULT_REVIEWS };

export function getAllReviews() {
  const raw = window.__reviews;
  if (!raw || !raw.length) {
    window.__reviews = [...DEFAULT_REVIEWS];
    return window.__reviews;
  }
  return raw;
}

export function getSellerReviews(sellerId, includeHidden = false) {
  if (!sellerId) return [];
  const all = getAllReviews();
  return all
    .filter((r) => r.sellerId === sellerId && (includeHidden || !r.isHidden))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function toggleHideSellerReview(reviewId) {
  if (sessionStorage.getItem("pusat_barkas_admin_auth") !== "true") {
    throw new Error("Akses ditolak: Hanya admin yang berwenang untuk menyembunyikan ulasan toko.");
  }
  const all = getAllReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  all[idx].isHidden = !all[idx].isHidden;
  window.__reviews = all;

  const updatedReview = all[idx];
  window.dispatchEvent(
    new CustomEvent("sellerReviewsChanged", { detail: { sellerId: updatedReview.sellerId, review: updatedReview } }),
  );
  if (realtimeChannel) {
    realtimeChannel.postMessage({
      type: "REVIEW_UPDATED",
      payload: { sellerId: updatedReview.sellerId, review: updatedReview },
    });
  }
  return updatedReview;
}

export async function deleteSellerReview(reviewId) {
  if (sessionStorage.getItem("pusat_barkas_admin_auth") !== "true") {
    throw new Error("Akses ditolak: Hanya admin yang berwenang untuk menghapus ulasan toko.");
  }
  const all = getAllReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return false;

  const targetSellerId = all[idx].sellerId;

  if (supabase) {
    try {
      await supabase.from("seller_reviews").delete().eq("id", reviewId);
    } catch (_e) {}
  }

  all.splice(idx, 1);
  window.__reviews = all;

  window.dispatchEvent(
    new CustomEvent("sellerReviewsChanged", { detail: { sellerId: targetSellerId, deletedReviewId: reviewId } }),
  );
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "REVIEW_DELETED", payload: { sellerId: targetSellerId, reviewId } });
  }
  return true;
}

export function addSellerReview({ sellerId, rating, comment, productImage }) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan toko.");
  }

  if (currentUser.id === sellerId) {
    throw new Error("Anda tidak dapat memberikan ulasan untuk toko Anda sendiri.");
  }

  // Validasi wajib foto produk yang dibeli: Ulasan tanpa foto produk akan ditolak sistem
  if (!productImage || productImage.trim() === "") {
    throw new Error(
      "Ulasan ditolak sistem: Anda wajib melampirkan foto produk/barang yang dibeli sebagai bukti ulasan terverifikasi.",
    );
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new Error("Rating harus bernilai 1 hingga 5 bintang.");
  }

  const cleanComment = (comment || "").trim();
  if (!cleanComment) {
    throw new Error("Tuliskan ulasan atau pengalaman transaksi Anda.");
  }

  const all = getAllReviews();
  const districtName = currentUser.district ? formatDistrictTitle(currentUser.district) : "";
  const regionName = currentUser.region ? formatRegionTitle(currentUser.region) : "Solo Raya";
  const locationTag = districtName || regionName;
  const buyerDisplayName = currentUser.storeName || currentUser.name || "Pengguna";

  const newReview = {
    id: `rev-${Date.now()}`,
    sellerId,
    buyerId: currentUser.id,
    buyerName: `${buyerDisplayName} (${locationTag})`,
    buyerAvatar:
      currentUser.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productImage: productImage,
    rating: numRating,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
  };

  all.unshift(newReview);
  window.__reviews = all;

  window.dispatchEvent(new CustomEvent("sellerReviewsChanged", { detail: { sellerId, review: newReview } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: "REVIEW_ADDED", payload: { sellerId, review: newReview } });
  }

  // Supabase sync
  if (supabase) {
    const sbReviewPayload = {
      id: newReview.id,
      seller_id: newReview.sellerId,
      buyer_id: newReview.buyerId,
      buyer_name: newReview.buyerName,
      buyer_avatar: newReview.buyerAvatar,
      product_image: newReview.productImage,
      rating: newReview.rating,
      comment: newReview.comment,
      created_at: newReview.createdAt,
    };

    console.log("[Supabase Review Sync] Mengirim payload data ulasan ke database Supabase:", sbReviewPayload);

    supabase
      .from("seller_reviews")
      .insert([sbReviewPayload])
      .then(({ data, error }) => {
        if (error) {
          console.error(
            "[Supabase Error] Gagal menyimpan ulasan ke tabel seller_reviews Supabase:",
            error.message || error,
            error,
          );
        } else {
          console.log(
            "[Supabase Success] Ulasan berhasil disimpan ke tabel seller_reviews Supabase:",
            data || sbReviewPayload.id,
          );
        }
      })
      .catch((err) => {
        console.error("[Supabase Exception] Kendala koneksi/eksekusi saat insert ulasan ke Supabase:", err);
      });
  }

  return newReview;
}

export function getSellerRatingStats(sellerId) {
  // Hanya hitung ulasan yang tidak disembunyikan
  const reviews = getSellerReviews(sellerId, false);
  if (reviews.length === 0) {
    return {
      averageRating: 0.0,
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

// -------------------------------------------------------------
// 5 STRICT CRITERIA FOR SELLER VERIFICATION BADGE
// -------------------------------------------------------------
/**
 * Logika Sistem Syarat Badge 'Terverifikasi / Toko Lokal':
 * 1. Minimal 20 ulasan positif (rating >= 4).
 * 2. Rating rata-rata minimal 4.5.
 * 3. Telah memposting minimal 10 barang jualan.
 * 4. Profil lengkap (Foto Avatar, Lokasi Kab/Kec, dan No. WA).
 * 5. Usia akun minimal 30 hari.
 */
export function checkSellerVerification(sellerUserOrId) {
  const user = typeof sellerUserOrId === "string" ? getUserById(sellerUserOrId) : sellerUserOrId;
  if (!user) {
    return {
      isVerified: false,
      seller: null,
      passedCount: 0,
      totalCriteria: 5,
      criteria: {
        reviewsPositive: { passed: false, current: 0, required: 20 },
        averageRating: { passed: false, current: 0, required: 4.5 },
        totalListings: { passed: false, current: 0, required: 10 },
        profileComplete: { passed: false, missing: ["Foto Avatar", "Lokasi", "No. WhatsApp"] },
        accountAgeDays: { passed: false, current: 0, required: 30 },
      },
    };
  }

  const sellerId = user.id;
  const listings = getListingsBySellerId(sellerId);
  const reviews = getSellerReviews(sellerId);
  const ratingStats = getSellerRatingStats(sellerId);

  // 1. Sudah memiliki minimal 20 ulasan positif (rating >= 4)
  const positiveReviewsCount = reviews.filter((r) => r.rating >= 4).length;
  const reviewsPassed = positiveReviewsCount >= 20;

  // 2. Memiliki rating rata-rata minimal 4.5
  const avgRating = ratingStats.totalReviews > 0 ? ratingStats.averageRating : 0;
  const ratingPassed = ratingStats.totalReviews > 0 && avgRating >= 4.5;

  // 3. Telah memposting minimal 10 barang jualan
  const totalListingsCount = listings.length;
  const listingsPassed = totalListingsCount >= 10;

  // 4. Profil (Foto, Lokasi, dan No. WA) sudah lengkap
  const hasAvatar = Boolean(user.avatar && user.avatar.trim() !== "");
  const hasLocation = Boolean(user.region && user.region.trim() !== "" && user.district && user.district.trim() !== "");
  const hasPhone = Boolean(user.phone && user.phone.replace(/\D/g, "").length >= 8);

  const missingFields = [];
  if (!hasAvatar) missingFields.push("Foto Avatar");
  if (!hasLocation) missingFields.push("Lokasi (Kabupaten & Kecamatan)");
  if (!hasPhone) missingFields.push("No. WhatsApp Aktif");
  const profilePassed = missingFields.length === 0;

  // 5. Akun telah berusia minimal 30 hari
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  const now = new Date();
  const diffTime = Math.max(0, now - createdAt);
  const accountAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const agePassed = accountAgeDays >= 30;

  const passedList = [reviewsPassed, ratingPassed, listingsPassed, profilePassed, agePassed];
  const passedCount = passedList.filter(Boolean).length;
  const isVerified = reviewsPassed && ratingPassed && listingsPassed && profilePassed && agePassed;

  return {
    isVerified,
    seller: user,
    passedCount,
    totalCriteria: 5,
    criteria: {
      reviewsPositive: { passed: reviewsPassed, current: positiveReviewsCount, required: 20 },
      averageRating: { passed: ratingPassed, current: avgRating, required: 4.5 },
      totalListings: { passed: listingsPassed, current: totalListingsCount, required: 10 },
      profileComplete: { passed: profilePassed, missing: missingFields },
      accountAgeDays: { passed: agePassed, current: accountAgeDays, required: 30 },
    },
  };
}

export function checkSellerVerifiedStatus(sellerUserOrId) {
  const result = checkSellerVerification(sellerUserOrId);
  return result.isVerified;
}

// -------------------------------------------------------------
// APP & DEVELOPER REVIEWS & COMMUNITY FEEDBACK
// Dipindahkan ke storageAppReviews.js - re-export di bawah
// -------------------------------------------------------------

export {
  STORAGE_KEY_APP_REVIEWS,
  DEFAULT_APP_REVIEWS,
  fetchAppReviewsFromSupabase,
  getAppReviews,
  addAppReview,
  deleteAppReview,
  updateAppReview,
  toggleHideAppReview,
  getAppRatingStats,
} from "./storageAppReviews.js";
