import type { LocationHierarchyDTO } from "./location.dto";
import type { LocationHierarchy } from "./location.contract";

/**
 * Normalizes BPS location code string into consistent dotted BPS format.
 * Examples:
 * - Regency: "3372" -> "33.72", "33.72" -> "33.72"
 * - District: "337201" -> "33.72.01", "33.72.01" -> "33.72.01"
 */
export function normalizeBpsCode(rawCode: string | null | undefined): string | null {
  if (!rawCode) return null;
  const clean = String(rawCode).trim().replace(/\./g, "");
  if (!clean) return null;

  if (clean.length === 2) {
    return clean; // Province: 33
  }
  if (clean.length === 4) {
    return `${clean.slice(0, 2)}.${clean.slice(2)}`; // Regency: 33.72
  }
  if (clean.length === 6) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4)}`; // District: 33.72.01
  }
  return String(rawCode).trim();
}

export function mapLocationDtoToDomain(dto: LocationHierarchyDTO | null | undefined): LocationHierarchy {
  if (!dto || typeof dto !== "object") {
    return {
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      village: null,
      legacyRegion: null,
      legacyDistrict: null,
    };
  }

  const rawProv = dto.provinceCode || dto.province_code || null;
  const rawReg = dto.regencyCode || dto.regency_code || null;
  const rawDist = dto.districtCode || dto.district_code || null;

  return {
    provinceCode: normalizeBpsCode(rawProv),
    regencyCode: normalizeBpsCode(rawReg),
    districtCode: normalizeBpsCode(rawDist),
    village: dto.village ? String(dto.village).trim() : null,
    legacyRegion: dto.region ? String(dto.region).trim() : null,
    legacyDistrict: dto.district ? String(dto.district).trim() : null,
  };
}
