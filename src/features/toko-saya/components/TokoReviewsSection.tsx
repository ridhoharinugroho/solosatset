import React from "react";
import { Star } from "lucide-react";

export interface TokoReviewsSectionProps {
  rating?: number;
  reviewCount?: number;
  reviews?: any[];
  className?: string;
}

export const TokoReviewsSection: React.FC<TokoReviewsSectionProps> = ({
  rating = 5.0,
  reviewCount = 0,
  reviews = [],
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-extrabold text-sm sm:text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span>Rating & Ulasan Pembeli untuk Toko Kamu</span>
        </h2>
        <span
          id="my-store-rating-summary-badge"
          className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-xs"
        >
          ⭐ {rating.toFixed(1)} ({reviewCount} Ulasan)
        </span>
      </div>

      {/* Reviews Container */}
      {reviews.length === 0 ? (
        <div
          id="my-store-reviews-empty"
          className="py-4 text-center text-xs text-slate-400 font-medium"
        >
          Belum ada ulasan pembeli untuk toko kamu.
        </div>
      ) : (
        <div id="my-store-reviews-container" className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{rev.reviewerName || "Pembeli"}</span>
                <span className="text-amber-500 font-extrabold">⭐ {rev.rating || 5}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
