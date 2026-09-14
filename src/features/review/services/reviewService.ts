import {
  getSellerReviews,
  getSellerRatingStats,
  addSellerReview,
  toggleHideSellerReview,
  deleteSellerReview,
  checkSellerVerification,
} from "../../../services/reviewService";
import type { ReviewItem, RatingStats, VerificationDetails } from "../hooks/useReview";

export function fetchSellerReviews(sellerId: string, includeHidden = false): ReviewItem[] {
  try {
    return getSellerReviews(sellerId, includeHidden) || [];
  } catch (error) {
    console.error("[ReviewService] fetchSellerReviews error:", error);
    return [];
  }
}

export function fetchSellerRatingStats(sellerId: string): RatingStats {
  try {
    return getSellerRatingStats(sellerId) || { averageRating: 0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  } catch (error) {
    console.error("[ReviewService] fetchSellerRatingStats error:", error);
    return { averageRating: 0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
}

export function fetchSellerVerificationDetails(sellerId: string): VerificationDetails | null {
  try {
    return checkSellerVerification(sellerId) || null;
  } catch (error) {
    console.error("[ReviewService] fetchSellerVerificationDetails error:", error);
    return null;
  }
}

export function submitNewReview(payload: { sellerId: string; rating: number; comment: string; productImage: string }): ReviewItem {
  return addSellerReview(payload);
}

export function performToggleHideReview(reviewId: string): any {
  return toggleHideSellerReview(reviewId);
}

export async function performDeleteReview(reviewId: string): Promise<boolean> {
  return deleteSellerReview(reviewId);
}
