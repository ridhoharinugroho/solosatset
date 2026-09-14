import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { ListingCard } from "./ListingCard";

export interface ListingGridProps {
  listings: ListingModel[];
  onListingClick?: (listing: ListingModel) => void;
  isLoading?: boolean;
  className?: string;
}

export const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  onListingClick,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-8">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className="bg-gray-100 animate-pulse rounded-xl h-64" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm my-6">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-base font-bold text-gray-800">Barang Tidak Ditemukan</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Coba ganti kata kunci pencarian atau bersihkan filter untuk menemukan barang impian Anda.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4 ${className}`.trim()}>
      {listings.map((item) => (
        <ListingCard
          key={item.id}
          listing={item}
          onCardClick={onListingClick}
        />
      ))}
    </div>
  );
};
