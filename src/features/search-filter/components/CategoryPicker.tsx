import React from "react";

export interface CategoryOption {
  id: string;
  name: string;
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: "all", name: "Semua Kategori" },
  { id: "Elektronik", name: "Elektronik" },
  { id: "Kendaraan", name: "Kendaraan" },
  { id: "Fashion", name: "Fashion" },
  { id: "Hobi", name: "Hobi & Olahraga" },
  { id: "Rumah Tangga", name: "Rumah Tangga" },
  { id: "Lainnya", name: "Lainnya" },
];

export interface CategoryPickerProps {
  selectedCategory: string;
  onChange: (category: string) => void;
  categories?: CategoryOption[];
  className?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onChange,
  categories = DEFAULT_CATEGORIES,
  className = "",
}) => {
  return (
    <select
      value={selectedCategory}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${className}`.trim()}
    >
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
};
