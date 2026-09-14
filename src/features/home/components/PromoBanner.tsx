import React from "react";

export interface PromoBannerProps {
  className?: string;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ className = "" }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${className}`.trim()}>
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-900">
        <div className="p-2 bg-emerald-500 text-white rounded-lg font-bold shrink-0">
          ✓
        </div>
        <div>
          <h4 className="font-bold text-gray-900">Transaksi Langsung COD</h4>
          <p className="text-gray-600 text-[11px]">Ketemu penjual, cek barang, baru bayar.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-900">
        <div className="p-2 bg-rose-800 text-white rounded-lg font-bold shrink-0">
          0%
        </div>
        <div>
          <h4 className="font-bold text-gray-900">Tanpa Biaya Potongan</h4>
          <p className="text-gray-600 text-[11px]">Jual gratis, beli tanpa biaya aplikasi.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-900">
        <div className="p-2 bg-amber-600 text-white rounded-lg font-bold shrink-0">
          📍
        </div>
        <div>
          <h4 className="font-bold text-gray-900">Jangkauan Nasional 38 Provinsi</h4>
          <p className="text-gray-600 text-[11px]">Cari barang di kota atau kabupaten terdekat.</p>
        </div>
      </div>
    </div>
  );
};
