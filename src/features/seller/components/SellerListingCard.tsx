import React from "react";
import type { ListingModel, ListingStatus } from "../../../domain/listing/listing.contract";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/common/StatusBadge";

export interface SellerListingCardProps {
  listing: ListingModel;
  onEdit: (listing: ListingModel) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export const SellerListingCard: React.FC<SellerListingCardProps> = ({
  listing,
  onEdit,
  onStatusChange,
  onDelete,
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
      : "https://via.placeholder.com/150";

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`.trim()}>
      <div className="flex items-center space-x-4 w-full sm:w-auto">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-16 h-16 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50"
        />

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              {listing.category}
            </span>
            <StatusBadge
              label={listing.status}
              variant={listing.status === "active" ? "success" : listing.status === "sold" ? "info" : "default"}
            />
            {listing.isBu && <StatusBadge label="BU" variant="danger" />}
          </div>

          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
            {listing.title}
          </h4>

          <div className="text-sm font-extrabold text-gray-900">
            {formattedPrice}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
        <Button variant="outline" size="sm" onClick={() => onEdit(listing)}>
          ✏️ Edit
        </Button>

        {listing.status === "active" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(listing.id, "sold")}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            ✓ Laku / Sold
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(listing.id, "active")}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            ↺ Aktifkan
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
              onDelete(listing.id);
            }
          }}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          🗑️ Hapus
        </Button>
      </div>
    </div>
  );
};
