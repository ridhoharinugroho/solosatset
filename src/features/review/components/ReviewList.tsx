import React from "react";
import { ReviewItem, RatingStats } from "../hooks/useReview";

export interface ReviewListProps {
  reviews: ReviewItem[];
  stats: RatingStats;
  isAdmin?: boolean;
  onToggleHide?: (reviewId: string) => void;
  onDeleteReview?: (reviewId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  stats,
  isAdmin = false,
  onToggleHide,
  onDeleteReview,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isFilled = i < Math.floor(rating);
      return (
        <span key={i} className={isFilled ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>
          ★
        </span>
      );
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center sm:text-left flex-shrink-0">
          <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="text-amber-400 text-lg mt-1">{renderStars(stats.averageRating)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {stats.totalReviews} Ulasan Pembeli
          </div>
        </div>

        {/* Rating Breakdown Progress Bars */}
        <div className="w-full space-y-1.5 flex-1 max-w-md">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingCounts[star] || 0;
            const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 font-semibold text-slate-600 dark:text-slate-300 text-right">{star}</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-slate-500 dark:text-slate-400 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Belum ada ulasan untuk toko ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl border ${
                rev.isHidden
                  ? "border-amber-300 dark:border-amber-800 opacity-60 bg-amber-50/20"
                  : "border-slate-200 dark:border-slate-700/80"
              } shadow-sm transition-all`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      rev.buyerAvatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={rev.buyerName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {rev.buyerName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="text-amber-400 text-xs">{renderStars(rev.rating)}</div>
                      <span className="text-[11px] text-slate-400">• {formatDate(rev.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {onToggleHide && (
                      <button
                        type="button"
                        onClick={() => onToggleHide(rev.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        {rev.isHidden ? "Tampilkan" : "Sembunyikan"}
                      </button>
                    )}
                    {onDeleteReview && (
                      <button
                        type="button"
                        onClick={() => onDeleteReview(rev.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Comment text */}
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {rev.comment}
              </p>

              {/* Product Proof Image */}
              {rev.productImage && (
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">Bukti Foto Produk/Barang:</div>
                  <img
                    src={rev.productImage}
                    alt="Bukti Produk Pembelian"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
