import React from "react";
import { LayoutGrid, Smartphone, Bike, Armchair, Shirt, Utensils } from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
  line1: string;
  line2: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "all", name: "Semua Kategori", line1: "Lihat", line2: "Semua", icon: LayoutGrid },
  { id: "elektronik", name: "Elektronik & Gadget", line1: "Elektronik", line2: "& Gadget", icon: Smartphone },
  { id: "kendaraan", name: "Kendaraan & Otomotif", line1: "Kendaraan", line2: "& Otomotif", icon: Bike },
  { id: "perabot", name: "Perabot & Rumah Tangga", line1: "Perabot &", line2: "Rumah Tangga", icon: Armchair },
  { id: "pakaian", name: "Pakaian & Aksesoris", line1: "Pakaian &", line2: "Aksesoris", icon: Shirt },
  { id: "kuliner", name: "Makanan & Minuman", line1: "Makanan &", line2: "Minuman", icon: Utensils },
];

export interface FeedPillsProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export const FeedPills: React.FC<FeedPillsProps> = ({
  activeCategory,
  onSelectCategory,
  className = "",
}) => {
  return (
    <section className={`mt-1 ${className}`.trim()}>
      <div
        id="category-pills-container"
        className="flex items-start gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-3.5 sm:px-4 lg:px-6 scroll-smooth min-h-[76px] min-[380px]:min-h-[82px] sm:min-h-[92px]"
      >
        {CATEGORIES.map((cat) => {
          const isActive =
            activeCategory.toLowerCase() === cat.id.toLowerCase() ||
            (activeCategory === "" && cat.id === "all");
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              data-category={cat.id}
              className="category-pill flex flex-col items-center justify-start flex-shrink-0 w-[52px] min-[380px]:w-[58px] sm:w-[68px] group cursor-pointer text-center select-none"
              title={cat.name}
            >
              <div
                className={`w-[44px] h-[44px] min-[380px]:w-[48px] min-[380px]:h-[48px] sm:w-[56px] sm:h-[56px] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-rose-900 text-amber-300 shadow-sm ring-2 ring-rose-900/25 scale-105 border-2 border-rose-800"
                    : "bg-white text-rose-900 border border-[#e2e8f2]/90 shadow-2xs group-hover:bg-slate-50 group-hover:border-rose-300 group-hover:scale-105"
                }`}
              >
                <Icon className="w-5 h-5 min-[380px]:w-5.5 min-[380px]:h-5.5 sm:w-6.5 sm:h-6.5 transition-transform group-hover:scale-110" />
              </div>
              <span
                className={`mt-1 px-0.5 text-[7.5px] min-[360px]:text-[8px] min-[380px]:text-[9px] sm:text-[10px] leading-[1.1] text-center tracking-tight transition-colors min-h-[20px] min-[380px]:min-h-[22px] sm:min-h-[26px] flex flex-col items-center justify-start ${
                  isActive
                    ? "font-black text-rose-950"
                    : "font-bold text-slate-700 group-hover:text-rose-900"
                }`}
              >
                <span className="block whitespace-nowrap leading-tight">{cat.line1}</span>
                <span className="block whitespace-nowrap leading-tight">{cat.line2}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

