/**
 * Review Service (TypeScript)
 * Seller & App Reviews Engine with Supabase Sync
 */

import { getCurrentUser, getUserById, getUserByReviewAuthor, formatRegionTitle, formatDistrictTitle } from "./authService.ts";
import { getListingsBySellerId } from "./listingService.ts";
import { supabase } from "../lib/supabase.ts";

export interface SellerReview {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  productImage: string;
  rating: number;
  comment: string;
  createdAt: string;
  isHidden?: boolean;
}

export interface AppReview {
  id: string;
  userId?: string;
  userName: string;
  userLocation: string;
  userAvatar?: string | null;
  rating: number;
  category: string;
  comment: string;
  review_text?: string;
  createdAt: string;
  created_at?: string;
  isHidden?: boolean;
}

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
}

export const DEFAULT_REVIEWS: SellerReview[] = [
  {
    id: "rev-001",
    sellerId: "user-1787309560138",
    buyerId: "buyer-01",
    buyerName: "Bagus Setiawan (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment:
      "Barang sangat sesuai deskripsi, sepeda lipat mulus dan bonus helm masih bagus. COD di Manahan fast response & ramah!",
    createdAt: "2026-08-18T14:30:00Z",
  },
  {
    id: "rev-002",
    sellerId: "user-1787309560138",
    buyerId: "buyer-02",
    buyerName: "Dewi Anggraini (Solo Baru)",
    buyerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Penjual terpercaya se-Solo. Komunikasi lewat WhatsApp sangat cepat dan ramah.",
    createdAt: "2026-08-19T09:15:00Z",
  },
];

export const DEFAULT_APP_REVIEWS: AppReview[] = [];

let inMemorySellerReviews: SellerReview[] = [...DEFAULT_REVIEWS];
let inMemoryAppReviews: AppReview[] = [];

// ─── SELLER REVIEWS ───────────────────────────────────────────────────────────

export function getAllReviews(): SellerReview[] {
  if (typeof window !== "undefined" && Array.isArray((window as any).__reviews)) {
    return (window as any).__reviews;
  }
  if (!inMemorySellerReviews || inMemorySellerReviews.length === 0) {
    inMemorySellerReviews = [...DEFAULT_REVIEWS];
  }
  return inMemorySellerReviews;
}

export function getSellerReviews(sellerId: string, includeHidden = false): SellerReview[] {
  if (!sellerId) return [];
  const all = getAllReviews();
  return all
    .filter((r) => r.sellerId === sellerId && (includeHidden || !r.isHidden))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function toggleHideSellerReview(reviewId: string): SellerReview | null {
  const all = getAllReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  all[idx].isHidden = !all[idx].isHidden;
  const updatedReview = all[idx];

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sellerReviewsChanged", { detail: { sellerId: updatedReview.sellerId, review: updatedReview } }),
    );
  }
  return updatedReview;
}

export async function deleteSellerReview(reviewId: string): Promise<boolean> {
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

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sellerReviewsChanged", { detail: { sellerId: targetSellerId, deletedReviewId: reviewId } }),
    );
  }
  return true;
}

export function addSellerReview({ sellerId, rating, comment, productImage }: any): SellerReview {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan toko.");
  }

  if (currentUser.id === sellerId) {
    throw new Error("Anda tidak dapat memberikan ulasan untuk toko Anda sendiri.");
  }

  if (!productImage || String(productImage).trim() === "") {
    throw new Error(
      "Ulasan ditolak sistem: Anda wajib melampirkan foto produk/barang yang dibeli sebagai bukti ulasan terverifikasi.",
    );
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new Error("Rating harus bernilai 1 hingga 5 bintang.");
  }

  const cleanComment = String(comment || "").trim();
  if (!cleanComment) {
    throw new Error("Tuliskan ulasan atau pengalaman transaksi Anda.");
  }

  const all = getAllReviews();
  const districtName = currentUser.district ? formatDistrictTitle(currentUser.district) : "";
  const regionName = currentUser.region ? formatRegionTitle(currentUser.region) : "Solo Raya";
  const locationTag = districtName || regionName;
  const buyerDisplayName = currentUser.storeName || currentUser.name || "Pengguna";

  const newReview: SellerReview = {
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

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sellerReviewsChanged", { detail: { sellerId, review: newReview } }));
  }

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
    void supabase.from("seller_reviews").insert([sbReviewPayload]);
  }

  return newReview;
}

export function getSellerRatingStats(sellerId: string): RatingStats {
  const reviews = getSellerReviews(sellerId, false);
  if (reviews.length === 0) {
    return {
      averageRating: 0.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const totalReviews = reviews.length;
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
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

export function checkSellerVerification(sellerUserOrId?: string | any | null) {
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

  const positiveReviewsCount = reviews.filter((r) => r.rating >= 4).length;
  const reviewsPassed = positiveReviewsCount >= 20;

  const avgRating = ratingStats.totalReviews > 0 ? ratingStats.averageRating : 0;
  const ratingPassed = ratingStats.totalReviews > 0 && avgRating >= 4.5;

  const totalListingsCount = listings.length;
  const listingsPassed = totalListingsCount >= 10;

  const hasAvatar = Boolean(user.avatar && user.avatar.trim() !== "");
  const hasLocation = Boolean(user.region && user.region.trim() !== "" && user.district && user.district.trim() !== "");
  const hasPhone = Boolean(user.phone && user.phone.replace(/\D/g, "").length >= 8);

  const missingFields: string[] = [];
  if (!hasAvatar) missingFields.push("Foto Avatar");
  if (!hasLocation) missingFields.push("Lokasi (Kabupaten & Kecamatan)");
  if (!hasPhone) missingFields.push("No. WhatsApp Aktif");
  const profilePassed = missingFields.length === 0;

  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - createdAt.getTime());
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

export function checkSellerVerifiedStatus(sellerUserOrId?: string | any | null): boolean {
  return checkSellerVerification(sellerUserOrId).isVerified;
}

// ─── APP REVIEWS ──────────────────────────────────────────────────────────────

export function getAppReviews(includeHidden = false): AppReview[] {
  try {
    let reviews: AppReview[] = (typeof window !== "undefined" && Array.isArray((window as any).__appReviewsCache))
      ? (window as any).__appReviewsCache
      : inMemoryAppReviews;
    if (!Array.isArray(reviews)) reviews = [];
    if (!includeHidden) {
      reviews = reviews.filter((r: AppReview) => !r.isHidden);
    }
    return reviews.sort((a: AppReview, b: AppReview) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export async function fetchAppReviewsFromSupabase(): Promise<AppReview[]> {
  if (!supabase) return getAppReviews();
  try {
    const { data: sbReviews, error } = await supabase
      .from("app_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(sbReviews)) {
      const mapped: AppReview[] = sbReviews.map((r: any) => {
        let resolvedName = r.user_name || "Pengguna";
        let resolvedLocation = r.user_location || "Solo Raya";
        let resolvedAvatar: string | null = null;

        const liveUser = getUserByReviewAuthor(r.user_id, r.user_name);
        if (liveUser) {
          const rawStore = liveUser.storeName;
          const rawName = liveUser.name;
          const cleanDisplayName = rawStore || rawName || resolvedName.replace(/\(.*?\)/g, "").trim();
          const rawLoc = liveUser.district || liveUser.region || resolvedLocation;
          resolvedLocation = formatDistrictTitle(rawLoc) || formatRegionTitle(rawLoc) || "Solo Raya";
          resolvedName = `${cleanDisplayName} (${resolvedLocation})`;
          resolvedAvatar = liveUser.avatar || null;
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

      inMemoryAppReviews = mapped;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { reviews: mapped } }));
      }
      return mapped;
    }
  } catch (err) {
    console.warn("[Supabase fetchAppReviewsFromSupabase Exception]", err);
  }
  return getAppReviews();
}

export function addAppReview({ rating, category, comment }: { rating?: number; category?: string; comment?: string }): AppReview {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan aplikasi.");
  }

  const cleanComment = String(comment || "").trim();
  if (!cleanComment) {
    throw new Error("Silakan tuliskan ulasan atau masukan Anda.");
  }
  const numRating = Number(rating) || 5;

  const rawFullName = (currentUser.name || currentUser.storeName || "Pengguna").trim();
  const firstName = rawFullName.split(/\s+/)[0] || "Pengguna";
  const rawDistrict = currentUser.district || currentUser.region || "";
  const districtTitle = formatDistrictTitle(rawDistrict) || formatRegionTitle(rawDistrict) || "Indonesia";

  const fullUserName = `${firstName} ${districtTitle}`.trim();
  const locationTag = districtTitle;

  const newReview: AppReview = {
    id: `app-rev-${Date.now()}`,
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

  inMemoryAppReviews.unshift(newReview);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: newReview } }));
  }

  if (supabase) {
    void supabase
      .from("app_reviews")
      .insert([
        {
          id: newReview.id,
          user_id: currentUser.id,
          user_name: fullUserName,
          user_location: locationTag,
          rating: newReview.rating,
          category: newReview.category,
          review_text: cleanComment,
          created_at: newReview.createdAt,
        },
      ]);
  }

  return newReview;
}

export async function deleteAppReview(reviewId: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from("app_reviews").delete().eq("id", reviewId);
    } catch (_e) {}
  }

  inMemoryAppReviews = inMemoryAppReviews.filter((r) => r.id !== reviewId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { deletedId: reviewId } }));
  }
  return true;
}

export function updateAppReview({ id, rating, category, comment }: any): AppReview {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu.");
  }
  const idx = inMemoryAppReviews.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error("Ulasan tidak ditemukan.");
  }

  const cleanComment = String(comment || "").trim();
  if (!cleanComment) {
    throw new Error("Silakan tuliskan ulasan atau masukan Anda.");
  }
  const numRating = Number(rating) || 5;

  inMemoryAppReviews[idx] = {
    ...inMemoryAppReviews[idx],
    rating: Math.min(5, Math.max(1, numRating)),
    category: category || inMemoryAppReviews[idx].category,
    comment: cleanComment,
    review_text: cleanComment,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: inMemoryAppReviews[idx] } }));
  }

  if (supabase) {
    void supabase
      .from("app_reviews")
      .update({
        rating: inMemoryAppReviews[idx].rating,
        category: inMemoryAppReviews[idx].category,
        review_text: cleanComment,
      })
      .eq("id", id);
  }

  return inMemoryAppReviews[idx];
}

export function toggleHideAppReview(reviewId: string): AppReview | null {
  const idx = inMemoryAppReviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  inMemoryAppReviews[idx].isHidden = !inMemoryAppReviews[idx].isHidden;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("appReviewsChanged", { detail: { review: inMemoryAppReviews[idx] } }));
  }
  return inMemoryAppReviews[idx];
}

export function getAppRatingStats(): RatingStats {
  const reviews = getAppReviews(false);
  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const totalReviews = reviews.length;
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
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
