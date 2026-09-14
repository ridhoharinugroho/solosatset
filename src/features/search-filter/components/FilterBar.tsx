import React from "react";
import type { FilterState } from "../../../domain/filter/filter.contract";
import { CategoryPicker } from "./CategoryPicker";
import { LocationPicker } from "./LocationPicker";

export interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  onReset,
  className = "",
}) => {
  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category */}
          <CategoryPicker
            selectedCategory={filterState.category}
            onChange={(cat) => onFilterChange({ category: cat })}
          />

          {/* Location */}
          <LocationPicker
            provinceCode={filterState.provinceCode}
            regencyCode={filterState.regencyCode}
            regionId={filterState.regionId}
            onProvinceChange={(prov) => onFilterChange({ provinceCode: prov, regencyCode: null })}
            onRegencyChange={(reg) => onFilterChange({ regencyCode: reg })}
            onRegionIdChange={(regId) => onFilterChange({ regionId: regId })}
          />

          {/* Sort By */}
          <select
            value={filterState.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
            <option value="popular">Paling Dilihat</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
        >
          Reset Filter
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-700">
        {/* BU Toggle */}
        <label className="inline-flex items-center space-x-2 cursor-pointer font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
          <input
            type="checkbox"
            checked={filterState.isBu}
            onChange={(e) => onFilterChange({ isBu: e.target.checked })}
            className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
          />
          <span>Hanya Butuh Uang (BU)</span>
        </label>

        {/* Condition */}
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-500">Kondisi:</span>
          <select
            value={filterState.condition || "all"}
            onChange={(e) => onFilterChange({ condition: e.target.value })}
            className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-800"
          >
            <option value="all">Semua</option>
            <option value="new">Baru</option>
            <option value="like_new">Seperti Baru</option>
            <option value="good">Bagus</option>
            <option value="fair">Cukup</option>
          </select>
        </div>
      </div>
    </div>
  );
};
