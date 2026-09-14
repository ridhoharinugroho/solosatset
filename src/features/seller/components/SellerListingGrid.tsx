import React from "react";
import type { ListingModel, ListingStatus } from "../../../domain/listing/listing.contract";
import type { SellerTabStatus } from "../hooks/useSellerListings";
import { SellerListingCard } from "./SellerListingCard";

export interface SellerListingGridProps {
  listings: ListingModel[];
  activeTab?: SellerTabStatus;
  onTabChange?: (tab: SellerTabStatus) => void;
  onEditListing?: (listing: ListingModel) => void;
  onEdit?: (listing: ListingModel) => void;
  onStatusChange?: (id: string, status: ListingStatus) => any;
  onDeleteListing?: (id: string) => any;
  className?: string;
}

export const SellerListingGrid: React.FC<SellerListingGridProps> = ({
  listings,
  activeTab = "all",
  onTabChange,
  onEditListing,
  onEdit,
  onStatusChange,
  onDeleteListing,
  className = "",
}) => {
  const handleEdit = onEditListing || onEdit || (() => {});
  const handleStatusChange = (id: string, status: ListingStatus) => {
    if (onStatusChange) onStatusChange(id, status);
  };
  const handleDelete = onDeleteListing || (() => {});
  const tabs: { id: SellerTabStatus; label: string }[] = [
    { id: "all", label: "Semua Barang" },
    { id: "active", label: "Aktif" },
    { id: "bu", label: "Butuh Uang (BU)" },
    { id: "sold", label: "Terjual (Sold)" },
    { id: "archived", label: "Arsip" },
  ];

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors shrink-0 ${
              activeTab === tab.id
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {listings.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-500">
          Belum ada barang pada kategori tab ini.
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <SellerListingCard
              key={item.id}
              listing={item}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
