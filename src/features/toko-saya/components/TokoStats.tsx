import React from "react";

export interface TokoStatsProps {
  total: number;
  active: number;
  sold: number;
  totalViews: number;
  className?: string;
}

export const TokoStats: React.FC<TokoStatsProps> = ({
  total,
  active,
  sold,
  totalViews,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`.trim()}>
      <div className="bg-white p-4 rounded-xl border border-gray-200/70 shadow-sm text-center">
        <span className="text-xs font-semibold text-gray-500 block">Total Listing</span>
        <strong className="text-xl font-bold text-gray-900">{total}</strong>
      </div>
      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 shadow-sm text-center">
        <span className="text-xs font-semibold text-emerald-700 block">Aktif</span>
        <strong className="text-xl font-bold text-emerald-900">{active}</strong>
      </div>
      <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/60 shadow-sm text-center">
        <span className="text-xs font-semibold text-blue-700 block">Terjual</span>
        <strong className="text-xl font-bold text-blue-900">{sold}</strong>
      </div>
      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 shadow-sm text-center">
        <span className="text-xs font-semibold text-amber-700 block">Total Dilihat</span>
        <strong className="text-xl font-bold text-amber-900">{totalViews}x</strong>
      </div>
    </div>
  );
};
