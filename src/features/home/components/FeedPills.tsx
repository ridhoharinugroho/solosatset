import React from "react";

export interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

export const CATEGORY_PILLS: CategoryOption[] = [
  { id: "all", name: "Semua Kategori" },
  { id: "elektronik", name: "Elektronik" },
  { id: "kendaraan", name: "Kendaraan" },
  { id: "fashion", name: "Fashion & Pakaian" },
  { id: "hobi", name: "Hobi & Olahraga" },
  { id: "properti", name: "Properti" },
  { id: "rumah-tangga", name: "Rumah Tangga" },
  { id: "jasa", name: "Jasa & Lowongan" },
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
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`.trim()}>
      {CATEGORY_PILLS.map((pill) => {
        const isActive = activeCategory.toLowerCase() === pill.id.toLowerCase();
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onSelectCategory(pill.id)}
            className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-rose-900 text-white shadow-md shadow-rose-900/20 scale-[1.02]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-200/80"
            }`}
          >
            {pill.name}
          </button>
        );
      })}
    </div>
  );
};
