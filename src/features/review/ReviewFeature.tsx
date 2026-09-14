import React from "react";
import { useReview } from "./hooks/useReview";
import { ReviewList } from "./components/ReviewList";
import { ReviewForm } from "./components/ReviewForm";

export interface ReviewFeatureProps {
  sellerId: string;
  sellerName?: string;
  isAdmin?: boolean;
  canReview?: boolean;
}

export const ReviewFeature: React.FC<ReviewFeatureProps> = ({
  sellerId,
  sellerName = "Penjual",
  isAdmin = false,
  canReview = true,
}) => {
  const {
    reviews,
    stats,
    verification,
    isLoading,
    error,
    submitReview,
    toggleHide,
    removeReview,
  } = useReview({ sellerId, includeHidden: isAdmin });

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Feature Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Ulasan & Rating Toko</span>
            {verification?.isVerified && (
              <span
                className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-300 dark:border-emerald-700"
                title="Penjual Terverifikasi"
              >
                ✓ Terverifikasi
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ulasan dari pembeli terverifikasi untuk toko <span className="font-semibold">{sellerName}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {/* Review Form */}
      {canReview && (
        <div className="mb-6">
          <ReviewForm onSubmit={submitReview} />
        </div>
      )}

      {/* Review List & Overview */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat ulasan toko...</p>
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          stats={stats}
          isAdmin={isAdmin}
          onToggleHide={toggleHide}
          onDeleteReview={removeReview}
        />
      )}
    </div>
  );
};

export default ReviewFeature;
