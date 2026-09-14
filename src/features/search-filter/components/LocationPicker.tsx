import React from "react";
import { PROVINCES, getRegenciesByProvince } from "../../../lib/regions";

export interface LocationPickerProps {
  provinceCode?: string | null;
  regencyCode?: string | null;
  regionId?: string | null;
  onProvinceChange?: (provCode: string) => void;
  onRegencyChange?: (regCode: string) => void;
  onRegionIdChange?: (regionId: string) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  provinceCode = "",
  regencyCode = "",
  regionId = "all",
  onProvinceChange,
  onRegencyChange,
  onRegionIdChange,
  className = "",
}) => {
  const regencies = React.useMemo(() => {
    return provinceCode ? getRegenciesByProvince(provinceCode) : [];
  }, [provinceCode]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {/* Province Picker (BPS) */}
      <select
        value={provinceCode || ""}
        onChange={(e) => {
          const val = e.target.value;
          onProvinceChange?.(val);
          onRegencyChange?.("");
        }}
        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <option value="">Semua Provinsi</option>
        {PROVINCES.map((prov) => (
          <option key={prov.code} value={prov.code}>
            {prov.name}
          </option>
        ))}
      </select>

      {/* Regency / City Picker (BPS) */}
      {provinceCode && (
        <select
          value={regencyCode || ""}
          onChange={(e) => onRegencyChange?.(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Semua Kab/Kota</option>
          {regencies.map((reg) => (
            <option key={reg.code} value={reg.code}>
              {reg.name}
            </option>
          ))}
        </select>
      )}

      {/* Legacy Region Fallback Select */}
      {!provinceCode && (
        <select
          value={regionId || "all"}
          onChange={(e) => onRegionIdChange?.(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">Semua Wilayah Solo Raya</option>
          <option value="solo">Kota Solo</option>
          <option value="karanganyar">Karanganyar</option>
          <option value="sukoharjo">Sukoharjo</option>
          <option value="sragen">Sragen</option>
          <option value="boyolali">Boyolali</option>
          <option value="klaten">Klaten</option>
          <option value="wonogiri">Wonogiri</option>
        </select>
      )}
    </div>
  );
};
