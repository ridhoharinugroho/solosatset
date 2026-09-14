export interface SearchQueryParamsDTO {
  q?: string;
  query?: string;
  category?: string;
  region?: string;
  district?: string;
  province_code?: string;
  regency_code?: string;
  district_code?: string;
  min_price?: string | number;
  max_price?: string | number;
  condition?: string;
  sort?: string;
}
