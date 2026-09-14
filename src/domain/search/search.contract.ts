export interface SearchQuery {
  keyword: string;
  category: string;
  regionId: string;
  district: string;
  provinceCode: string | null;
  regencyCode: string | null;
  districtCode: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  condition: string | null;
  sortBy: "newest" | "price_asc" | "price_desc" | "popular" | string;
}
