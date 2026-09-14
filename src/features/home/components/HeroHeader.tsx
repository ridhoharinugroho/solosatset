import React from "react";

export interface HeroHeaderProps {
  className?: string;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ className = "" }) => {
  return (
    <div className={`bg-gradient-to-r from-rose-900 via-burgundy to-rose-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden ${className}`.trim()}>
      <div className="relative z-10 max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-rose-200 border border-white/15">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Pusat Jual Beli Barang Terdekat
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          SOPALOKA <span className="text-amber-300 font-medium">Indonesia</span>
        </h1>
        <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed font-medium">
          Temukan barang bekas & baru terdekat di 38 provinsi. Transaksi langsung, cepat, aman, dan tanpa biaya perantara.
        </p>
      </div>

      {/* Decorative Background Accents */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 sm:w-64 sm:h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-20 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
