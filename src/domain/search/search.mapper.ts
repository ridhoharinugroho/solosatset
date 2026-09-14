import type { SearchQueryParamsDTO } from "./search.dto";
import type { SearchQuery } from "./search.contract";

export function mapSearchQueryDtoToDomain(dto: SearchQueryParamsDTO | null | undefined): SearchQuery {
  if (!dto || typeof dto !== "object") {
    return {
      keyword: "",
      category: "all",
      regionId: "all",
      district: "all",
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      minPrice: null,
      maxPrice: null,
      condition: null,
      sortBy: "newest",
    };
  }

  const keyword = String(dto.q || dto.query || "").trim();
  const category = String(dto.category || "all").trim();
  const regionId = String(dto.region || "all").trim();
  const district = String(dto.district || "all").trim();
  const minPrice = dto.min_price !== undefined && dto.min_price !== "" ? Number(dto.min_price) : null;
  const maxPrice = dto.max_price !== undefined && dto.max_price !== "" ? Number(dto.max_price) : null;

  return {
    keyword,
    category,
    regionId,
    district,
    provinceCode: dto.province_code || null,
    regencyCode: dto.regency_code || null,
    districtCode: dto.district_code || null,
    minPrice: Number.isNaN(minPrice) ? null : minPrice,
    maxPrice: Number.isNaN(maxPrice) ? null : maxPrice,
    condition: dto.condition || null,
    sortBy: String(dto.sort || "newest"),
  };
}
