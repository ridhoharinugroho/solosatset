import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { StatusBadge } from "../../../components/common/StatusBadge";

export interface ListingMetadataProps {
  listing: ListingModel;
  className?: string;
}

export const ListingMetadata: React.FC<ListingMetadataProps> = ({
  listing,
  className = "",
}) => {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const locationDisplay = [
    listing.village,
    listing.district,
    listing.regionId !== "all" ? listing.regionId : null,
  ]
    .filter(Boolean)
    .join(", ") || "Solo Raya";

  const negoTypeLabels: Record<string, string> = {
    pass: "Harga Pas",
    nego_alus: "Nego Alus",
    free: "Gratis",
  };

  const paymentLabels: Record<string, string> = {
    cod: "Bayar di Tempat (COD)",
    transfer: "Transfer Bank",
    qris: "QRIS",
    bebas: "Bebas",
  };

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Price & Status Badges */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            {listing.category}
          </span>
          {listing.isBu && <StatusBadge label="BU (Butuh Uang)" variant="danger" />}
          {listing.isQrisVerified && <StatusBadge label="QRIS Terverifikasi" variant="info" />}
        </div>

        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {listing.title}
        </h1>

        <div className="text-2xl font-extrabold text-red-600 mt-2">
          {formattedPrice}
        </div>
      </div>

      {/* Product Attributes Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
        <div>
          <span className="text-gray-500 block">Kondisi:</span>
          <span className="font-semibold text-gray-800 capitalize">
            {listing.condition === "like_new" ? "Seperti Baru" : listing.condition}
          </span>
        </div>

        <div>
          <span className="text-gray-500 block">Nego:</span>
          <span className="font-semibold text-gray-800">
            {negoTypeLabels[listing.negoType] || listing.negoType}
          </span>
        </div>

        <div>
          <span className="text-gray-500 block">Pembayaran:</span>
          <span className="font-semibold text-gray-800">
            {paymentLabels[listing.paymentMethod] || listing.paymentMethod}
          </span>
        </div>

        <div>
          <span className="text-gray-500 block">Dilihat:</span>
          <span className="font-semibold text-gray-800">
            {listing.views} kali
          </span>
        </div>
      </div>

      {/* Location Info */}
      <div className="flex items-start space-x-2 text-xs text-gray-700">
        <span className="text-base leading-none">📍</span>
        <div>
          <span className="font-semibold text-gray-900 block">Lokasi COD / Toko:</span>
          <span>{locationDisplay}</span>
          {listing.codPoint && (
            <p className="text-gray-500 mt-0.5">Titik COD: {listing.codPoint}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="pt-3 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
            Deskripsi Produk
          </h3>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      )}

      {/* Seller Profile Summary */}
      <div className="flex items-center space-x-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center overflow-hidden border border-red-200">
          {listing.seller.avatar ? (
            <img src={listing.seller.avatar} alt={listing.seller.name} className="w-full h-full object-cover" />
          ) : (
            listing.seller.storeName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-900">
            {listing.seller.storeName || listing.seller.name}
          </div>
          <div className="text-[10px] text-gray-500">
            Penjual Terverifikasi SOPALOKA
          </div>
        </div>
      </div>
    </div>
  );
};
