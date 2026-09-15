import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { ListingCard } from "./ListingCard";
import { PackageSearch } from "lucide-react";

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
  const gridClasses = `listings-grid-container grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5 px-3.5 sm:px-4 lg:px-6 transition-all min-h-[320px] ${className}`.trim();

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse"
          >
            <div className="w-full aspect-[4/3] bg-slate-200/70 rounded-xl" />
            <div className="h-3.5 bg-slate-200/70 rounded w-3/4" />
            <div className="h-4 bg-slate-200/70 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div id="empty-state" className="w-full py-8 sm:py-12">
        <div className="flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-900 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1.5">
            Barang Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Coba ganti kata kunci pencarian, ubah pilihan wilayah, atau atur ulang filter Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
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

