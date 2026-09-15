"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, MapPin, Navigation, Tag, Check, RotateCcw } from "lucide-react";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: string;
  selectedCategory: string;
  onApply: (region: string, category: string) => void;
  className?: string;
}

const REGION_OPTIONS = [
  { id: "all", name: "Semua Wilayah Solo Raya" },
  { id: "solo", name: "Kota Solo (Surakarta)" },
  { id: "karanganyar", name: "Kab. Karanganyar" },
  { id: "sukoharjo", name: "Kab. Sukoharjo" },
  { id: "wonogiri", name: "Kab. Wonogiri" },
  { id: "sragen", name: "Kab. Sragen" },
  { id: "boyolali", name: "Kab. Boyolali" },
  { id: "klaten", name: "Kab. Klaten" },
];

const CATEGORY_OPTIONS = [
  { id: "all", name: "Semua Kategori" },
  { id: "elektronik", name: "Elektronik & Gadget" },
  { id: "kendaraan", name: "Kendaraan & Otomotif" },
  { id: "perabot", name: "Perabot & Rumah Tangga" },
  { id: "pakaian", name: "Pakaian & Aksesoris" },
  { id: "kuliner", name: "Makanan & Minuman" },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  selectedRegion: initialRegion,
  selectedCategory: initialCategory,
  onApply,
  className = "",
}) => {
  const [tempRegion, setTempRegion] = useState(initialRegion || "all");
  const [tempCategory, setTempCategory] = useState(initialCategory || "all");

  React.useEffect(() => {
    if (isOpen) {
      setTempRegion(initialRegion || "all");
      setTempCategory(initialCategory || "all");
    }
  }, [isOpen, initialRegion, initialCategory]);

  if (!isOpen) return null;

  const handleReset = () => {
    setTempRegion("all");
    setTempCategory("all");
  };

  const handleSave = () => {
    onApply(tempRegion, tempCategory);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-amber-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Filter Wilayah & Kategori
              </h3>
              <p className="text-[10.5px] text-slate-300">
                Pilih wilayah dan kategori barang yang ingin dipantau
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
            aria-label="Tutup Filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Filter Wilayah */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-800" />
              <span>Wilayah Solo Raya</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {REGION_OPTIONS.map((reg) => {
                const isSelected = tempRegion.toLowerCase() === reg.id.toLowerCase();
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setTempRegion(reg.id)}
                    className={`w-full px-3.5 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? "bg-rose-50 border-rose-600 text-rose-950 font-black shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{reg.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-rose-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Filter Kategori */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-rose-800" />
              <span>Kategori Barang</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = tempCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTempCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? "bg-rose-50 border-rose-600 text-rose-950 font-black shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-black text-white bg-rose-900 hover:bg-rose-800 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
