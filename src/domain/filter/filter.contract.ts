export interface FilterState {
  searchQuery: string;
  category: string;
  regionId: string;
  district: string;
  provinceCode: string | null;
  regencyCode: string | null;
  districtCode: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  condition: string | null;
  isBu: boolean;
  sortBy: "newest" | "price_asc" | "price_desc" | "popular" | string;
}
