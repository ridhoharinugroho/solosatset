import React from "react";
import { AdminStats } from "../hooks/useAdminDashboard";

export interface AdminSummaryCardsProps {
  stats: AdminStats;
}

export const AdminSummaryCards: React.FC<AdminSummaryCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Listings */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Iklan</span>
        <div className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.total}</div>
        <span className="text-[10px] text-slate-500 mt-1">Keseluruhan barang</span>
      </div>

      {/* Active Listings */}
      <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/60 flex flex-col justify-between">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Iklan Tayang</span>
        <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{stats.active}</div>
        <span className="text-[10px] text-emerald-500/80 mt-1">Aktif di marketplace</span>
      </div>

      {/* Hidden Listings */}
      <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-800/60 flex flex-col justify-between">
        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Disembunyikan</span>
        <div className="text-2xl sm:text-3xl font-black text-purple-300 mt-1">{stats.hidden}</div>
        <span className="text-[10px] text-purple-500/80 mt-1">Moderasi/privat</span>
      </div>

      {/* Sold Listings */}
      <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-800/60 flex flex-col justify-between">
        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Terjual (Sold)</span>
        <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-1">{stats.sold}</div>
        <span className="text-[10px] text-rose-500/80 mt-1">Transaksi selesai</span>
      </div>
    </div>
  );
};
