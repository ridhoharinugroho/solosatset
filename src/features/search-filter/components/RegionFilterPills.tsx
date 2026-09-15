import React from "react";

export interface RegionOption {
  id: string;
  name: string;
  color?: string;
}

export const REGIONS_LIST: RegionOption[] = [
  { id: "all", name: "🌟 Semua Wilayah" },
  { id: "solo", name: "Solo", color: "#dc2626" },
  { id: "karanganyar", name: "Karanganyar", color: "#059669" },
  { id: "sukoharjo", name: "Sukoharjo", color: "#2563eb" },
  { id: "wonogiri", name: "Wonogiri", color: "#d97706" },
  { id: "sragen", name: "Sragen", color: "#7c3aed" },
  { id: "boyolali", name: "Boyolali", color: "#0d9488" },
  { id: "klaten", name: "Klaten", color: "#4f46e5" },
];

export interface RegionFilterPillsProps {
  selectedRegion?: string;
  onSelectRegion?: (regionId: string) => void;
  className?: string;
}

export const RegionFilterPills: React.FC<RegionFilterPillsProps> = ({
  selectedRegion = "all",
  onSelectRegion,
  className = "",
}) => {
  return (
    <section id="region-filter-section" className={`relative z-10 py-0 mt-1 ${className}`.trim()}>
      <div
        id="region-pills-container"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0 items-center px-3.5 sm:px-4 lg:px-6 relative z-10"
      >
        {REGIONS_LIST.map((reg) => {
          const isActive = selectedRegion === reg.id;
          return (
            <button
              key={reg.id}
              type="button"
              onClick={() => onSelectRegion?.(reg.id)}
              data-region={reg.id}
              className={`region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${
                isActive
                  ? "bg-slate-800 text-white border-slate-800 ring-2 ring-slate-800/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {reg.color && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 pointer-events-none"
                  style={{ backgroundColor: reg.color }}
                />
              )}
              <span className="truncate pointer-events-none">{reg.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
