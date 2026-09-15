import React from "react";
import { Package, PackageOpen, Edit3, CheckCircle, RefreshCw, Trash2, Eye } from "lucide-react";
import type { ListingModel, ListingStatus } from "../../../domain/listing/listing.contract";

export interface TokoEtalaseProps {
  listings: ListingModel[];
  allListings: ListingModel[];
  statusFilter: string;
  onFilterChange: (status: string) => void;
  onEdit: (listing: ListingModel) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export const TokoEtalase: React.FC<TokoEtalaseProps> = ({
  listings,
  allListings,
  statusFilter,
  onFilterChange,
  onEdit,
  onStatusChange,
  onDelete,
  className = "",
}) => {
  const counts = {
    all: allListings.length,
    available: allListings.filter((l) => l.status === "active" || l.status === "available").length,
    booked: allListings.filter((l) => l.status === "booked").length,
    sold: allListings.filter((l) => l.status === "sold").length,
  };

  const tabs = [
    { id: "all", label: "Semua", count: counts.all, dot: "" },
    { id: "available", label: "🟢 Tersedia", count: counts.available, dot: "🟢" },
    { id: "booked", label: "🟡 Booked", count: counts.booked, dot: "🟡" },
    { id: "sold", label: "🔴 Terjual", count: counts.sold, dot: "🔴" },
  ];

  return (
    <div className={`space-y-4 pt-1 ${className}`.trim()}>
      {/* Dark Dashboard Etalase Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
        <div>
          <h2 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-400" />
            <span>Daftar Etalase Barang Jualan</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Ubah status barang, sunting harga/deskripsi, atau kelola iklan toko kamu
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive =
              statusFilter === tab.id ||
              (statusFilter === "active" && tab.id === "available") ||
              (statusFilter === "all" && tab.id === "all");

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`store-filter-tab px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "active bg-rose-900 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Listings Container */}
      <div id="my-listings-container" className="space-y-3">
        {listings.length === 0 ? (
          <div id="my-listings-empty" className="w-full py-8 sm:py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 p-6 rounded-2xl mx-auto max-w-md border border-slate-200/60 shadow-2xs">
              <PackageOpen className="w-16 h-16 text-slate-300 mx-auto mb-2" />
              <div>
                <p className="text-base font-bold text-slate-800 mb-2">
                  Tidak ada barang jualan pada etalase ini
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gunakan tombol Pasang Iklan di atas untuk menambah barang jualan ke etalase kamu.
                </p>
              </div>
            </div>
          </div>
        ) : (
          listings.map((item) => {
            const formattedPrice = new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(item.price);

            const mainImage =
              item.images && item.images.length > 0
                ? item.images[0]
                : "https://via.placeholder.com/150?text=SOPALOKA";

            const isSold = item.status === "sold";
            const isBooked = item.status === "booked";

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex gap-3.5 sm:gap-4 items-center min-w-0 flex-1">
                  <img
                    src={mainImage}
                    alt={item.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 object-cover flex-shrink-0 border border-slate-100"
                    loading="lazy"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isSold
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : isBooked
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isSold ? "🔴 Terjual" : isBooked ? "🟡 Booked" : "🟢 Tersedia"}
                      </span>
                      {item.isBu && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-600 text-white">
                          BU
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {item.views || 0}x dilihat
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {item.title}
                    </h3>

                    <p className="text-sm font-black text-rose-900">
                      {formattedPrice}
                    </p>
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {!isSold ? (
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.id, "sold")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tandai Terjual</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.id, "active")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Aktifkan</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus barang ini dari etalase?")) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Hapus Iklan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
