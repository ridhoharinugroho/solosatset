import type { FilterStateDTO } from "./filter.dto";
import type { FilterState } from "./filter.contract";

export function mapFilterDtoToDomain(dto: FilterStateDTO | null | undefined): FilterState {
  if (!dto || typeof dto !== "object") {
    return {
      searchQuery: "",
      category: "all",
      regionId: "all",
      district: "all",
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      minPrice: null,
      maxPrice: null,
      condition: null,
      isBu: false,
      sortBy: "newest",
    };
  }

  const searchQuery = String(dto.search_query || "").trim();
  const category = String(dto.category || "all").trim();
  const regionId = String(dto.regionId || dto.region_id || "all").trim();
  const district = String(dto.district || "all").trim();
  const provinceCode = dto.provinceCode || dto.province_code || null;
  const regencyCode = dto.regencyCode || dto.regency_code || null;
  const districtCode = dto.districtCode || dto.district_code || null;
  const minPrice = dto.minPrice ?? dto.min_price ?? null;
  const maxPrice = dto.maxPrice ?? dto.max_price ?? null;
  const isBu = Boolean(dto.isBu ?? dto.is_bu);
  const sortBy = String(dto.sortBy || dto.sort_by || "newest");

  return {
    searchQuery,
    category,
    regionId,
    district,
    provinceCode,
    regencyCode,
    districtCode,
    minPrice,
    maxPrice,
    condition: dto.condition || null,
    isBu,
    sortBy,
  };
}
