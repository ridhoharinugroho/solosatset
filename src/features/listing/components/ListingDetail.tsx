import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { ListingGallery } from "./ListingGallery";
import { ListingMetadata } from "./ListingMetadata";
import { ListingActions } from "./ListingActions";

export interface ListingDetailProps {
  listing: ListingModel | null;
  isOpen: boolean;
  activeImageIndex: number;
  onImageSelect: (index: number) => void;
  onClose: () => void;
  onContactClick?: (phone: string, title: string) => void;
  onShareClick?: (listing: ListingModel) => void;
  className?: string;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  isOpen,
  activeImageIndex,
  onImageSelect,
  onClose,
  onContactClick,
  onShareClick,
  className = "",
}) => {
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col ${className}`.trim()}
      >
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-bold text-gray-800 truncate pr-4">
            Detail Produk — {listing.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal detail"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gallery Section */}
            <ListingGallery
              images={listing.images}
              title={listing.title}
              activeIndex={activeImageIndex}
              onImageSelect={onImageSelect}
            />

            {/* Metadata Section */}
            <ListingMetadata listing={listing} />
          </div>

          {/* Actions Bar Section */}
          <ListingActions
            listing={listing}
            onContactClick={onContactClick}
            onShareClick={onShareClick}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
