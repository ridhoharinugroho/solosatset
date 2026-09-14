import React from "react";
import { AdminListingItem } from "../hooks/useAdminDashboard";
import { SOLO_RAYA_REGIONS } from "../../../../js/data/regions.js";

export interface AdminListingsTableProps {
  listings: AdminListingItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRegion: string;
  onRegionChange: (r: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  onToggleHide: (id: string) => void;
  onToggleSold: (id: string) => void;
  onDeleteListing: (id: string) => void;
}

export const AdminListingsTable: React.FC<AdminListingsTableProps> = ({
  listings,
  searchQuery,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  selectedStatus,
  onStatusChange,
  onToggleHide,
  onToggleSold,
  onDeleteListing,
}) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul iklan atau nama penjual..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Wilayah</option>
            {(SOLO_RAYA_REGIONS || []).map((r: { id: string; name: string }) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Tayang (Aktif)</option>
            <option value="hidden">Disembunyikan</option>
            <option value="sold">Terjual (Sold)</option>
          </select>
        </div>
      </div>

      {/* Table / Empty View */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
          <p className="text-sm font-semibold text-slate-400">Tidak ada iklan yang ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Detail Iklan</th>
                <th className="p-3.5">Harga & Kategori</th>
                <th className="p-3.5">Lokasi</th>
                <th className="p-3.5">Penjual</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Moderasi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {listings.map((item) => {
                const sellerName = item.seller?.storeName || item.seller?.name || "Penjual";
                const sellerPhone = item.seller?.phone || "-";
                const img = item.images && item.images[0] ? item.images[0] : "https://via.placeholder.com/150";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      item.isHidden ? "opacity-75 bg-purple-950/20" : ""
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={item.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800 flex-shrink-0 bg-slate-950"
                        />
                        <div className="min-w-0 max-w-[200px]">
                          <div className="font-bold text-white truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Kondisi: <span className="text-amber-400 font-semibold">{item.condition}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-extrabold text-rose-400">{formatRupiah(item.price)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{item.regionId}</div>
                      <div className="text-[11px] text-slate-400">Kec. {item.district || "-"}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-200 truncate max-w-[130px]">{sellerName}</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{sellerPhone}</div>
                    </td>

                    <td className="p-3.5">
                      {item.isHidden ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-700 inline-block">
                          👁️ Disembunyikan
                        </span>
                      ) : item.isSold ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700 inline-block">
                          🏷️ Terjual (Sold)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700 inline-block">
                          ✓ Tayang (Aktif)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onToggleHide(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            item.isHidden
                              ? "bg-purple-600 hover:bg-purple-500 text-white"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          }`}
                        >
                          {item.isHidden ? "Tampilkan" : "Sembunyikan"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleSold(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            item.isSold
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "bg-amber-600 hover:bg-amber-500 text-white"
                          }`}
                        >
                          {item.isSold ? "Aktifkan" : "Terjual"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Apakah Anda yakin ingin MENGHAPUS PERMANEN iklan barang ini?")) {
                              onDeleteListing(item.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
