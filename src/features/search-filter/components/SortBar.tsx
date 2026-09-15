import React from "react";
import { ArrowUpDown } from "lucide-react";

export interface SortOption {
  id: string;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "newest", label: "Terbaru" },
  { id: "price_low", label: "Termurah" },
  { id: "price_high", label: "Termahal" },
  { id: "views", label: "Banyak dilihat" },
];

export interface SortBarProps {
  selectedSort?: string;
  onSelectSort?: (sortId: string) => void;
  className?: string;
}

export const SortBar: React.FC<SortBarProps> = ({
  selectedSort = "newest",
  onSelectSort,
  className = "",
}) => {
  return (
    <section id="sort-filter-section" className={`py-0 relative z-10 mt-0 ${className}`.trim()}>
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-3.5 sm:px-4 lg:px-6 relative z-10">
        {SORT_OPTIONS.map((opt) => {
          const isActive = selectedSort === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectSort?.(opt.id)}
              data-sort-val={opt.id}
              className={`sort-option-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${
                isActive
                  ? "bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ArrowUpDown className={`w-2.5 h-2.5 pointer-events-none ${isActive ? "text-amber-300" : "text-slate-400"}`} />
              <span className="truncate pointer-events-none">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
