import { useState, useEffect, useCallback } from "react";
import {
  getSellerReviews,
  getSellerRatingStats,
  addSellerReview,
  toggleHideSellerReview,
  deleteSellerReview,
  checkSellerVerification,
} from "../../../../js/services/storageReviews.js";

export interface ReviewItem {
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

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingCounts: { [key: number]: number };
}

export interface VerificationDetails {
  isVerified: boolean;
  passedCount: number;
  totalCriteria: number;
  criteria: Record<string, unknown>;
}

export interface UseReviewOptions {
  sellerId?: string;
  includeHidden?: boolean;
}

export function useReview({ sellerId, includeHidden = false }: UseReviewOptions = {}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<RatingStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [verification, setVerification] = useState<VerificationDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(() => {
    if (!sellerId) {
      setReviews([]);
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
      setVerification(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fetchedReviews = getSellerReviews(sellerId, includeHidden);
      const fetchedStats = getSellerRatingStats(sellerId);
      const fetchedVerification = checkSellerVerification(sellerId);

      setReviews(fetchedReviews || []);
      setStats(fetchedStats || { averageRating: 0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
      setVerification(fetchedVerification || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat ulasan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, includeHidden]);

  useEffect(() => {
    loadReviews();

    const handleReviewsChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (sellerId && customEvent.detail && customEvent.detail.sellerId === sellerId) {
        loadReviews();
      }
    };

    window.addEventListener("sellerReviewsChanged", handleReviewsChange);
    return () => {
      window.removeEventListener("sellerReviewsChanged", handleReviewsChange);
    };
  }, [sellerId, loadReviews]);

  const submitReview = async (payload: { rating: number; comment: string; productImage: string }) => {
    if (!sellerId) {
      throw new Error("ID penjual tidak valid.");
    }
    setError(null);
    try {
      const newReview = addSellerReview({
        sellerId,
        rating: payload.rating,
        comment: payload.comment,
        productImage: payload.productImage,
      });
      loadReviews();
      return newReview;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan ulasan.";
      setError(msg);
      throw err;
    }
  };

  const toggleHide = (reviewId: string) => {
    try {
      const updated = toggleHideSellerReview(reviewId);
      loadReviews();
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status visibilitas ulasan.";
      setError(msg);
      throw err;
    }
  };

  const removeReview = async (reviewId: string) => {
    try {
      const success = await deleteSellerReview(reviewId);
      loadReviews();
      return success;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus ulasan.";
      setError(msg);
      throw err;
    }
  };

  return {
    reviews,
    stats,
    verification,
    isLoading,
    error,
    refresh: loadReviews,
    submitReview,
    toggleHide,
    removeReview,
  };
}
