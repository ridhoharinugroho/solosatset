import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { StatusBadge } from "../../../components/common/StatusBadge";

export interface ListingCardProps {
  listing: ListingModel;
  onCardClick?: (listing: ListingModel) => void;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onCardClick,
  className = "",
}) => {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const mainImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : "https://via.placeholder.com/300x200?text=SOPALOKA";

  const locationText = listing.village
    ? `${listing.village}, ${listing.district}`
    : listing.district || listing.regionId || "Solo Raya";

  return (
    <div
      onClick={() => onCardClick?.(listing)}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col ${className}`.trim()}
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {listing.isBu && (
          <div className="absolute top-2 left-2">
            <StatusBadge label="BU" variant="danger" />
          </div>
        )}

        {listing.isQrisVerified && (
          <div className="absolute top-2 right-2">
            <StatusBadge label="QRIS" variant="info" />
          </div>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
            {listing.category}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mt-0.5 group-hover:text-red-600 transition-colors">
            {listing.title}
          </h3>
        </div>

        <div>
          <div className="text-base font-extrabold text-gray-900">
            {formattedPrice}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
            <span className="truncate">📍 {locationText}</span>
            <span className="text-[10px] text-gray-400">👁 {listing.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
