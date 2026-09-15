import React from "react";
import { ShoppingBag, ShieldCheck } from "lucide-react";

export interface CommunityFooterProps {
  className?: string;
}

export const CommunityFooter: React.FC<CommunityFooterProps> = ({ className = "" }) => {
  return (
    <footer className={`mt-12 pt-8 border-t border-slate-200 text-slate-600 space-y-6 max-w-7xl mx-auto w-full px-3.5 sm:px-4 lg:px-6 ${className}`.trim()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* About Community */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-900 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4 text-amber-300" />
            </div>
            <h4 data-text-key="footer_title" className="font-extrabold text-slate-900 text-sm sm:text-base">
              SOPALOKA
            </h4>
          </div>
          <p data-text-key="footer_desc" className="text-xs leading-relaxed text-slate-500">
            Platform jual beli barang terpercaya berbasis komunitas. Transaksi aman, mudah, dan langsung terhubung dengan penjual via WhatsApp.
          </p>
        </div>

        {/* COD Safety & Terms */}
        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 space-y-2">
          <h5 data-text-key="terms_title" className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-800" />
            <span>Ketentuan Transaksi & Tips COD Aman — Pantau Cocok Bayar</span>
          </h5>
          <p data-text-key="terms_content" className="text-[11px] text-rose-900/90 whitespace-pre-line leading-relaxed">
            1. Selalu utamakan transaksi sistem Cash on Delivery (COD) di tempat umum yang ramai. 2. Periksa fisik, fungsi, dan kelengkapan barang secara teliti bersama penjual sebelum melakukan pembayaran. 3. Jangan pernah mentransfer uang muka (DP) atau biaya booking tanpa bertemu penjual dan memeriksa barang secara langsung.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 pb-4">
        <span data-text-key="copyright_text">
          © 2026 SOPALOKA — Jual Beli Barang Terdekat — Pantau Cocok Bayar
        </span>
        <span className="text-[11px]">
          Semua Wilayah • Transaksi Amanah & Langsung
        </span>
      </div>
    </footer>
  );
};
