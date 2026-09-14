export interface SupabaseUserRowDTO {
  id: string;
  name: string;
  store_name?: string | null;
  storeName?: string | null;
  email?: string | null;
  phone?: string | null;
  region?: string | null;
  district?: string | null;
  province_code?: string | null;
  provinceCode?: string | null;
  regency_code?: string | null;
  regencyCode?: string | null;
  district_code?: string | null;
  districtCode?: string | null;
  village?: string | null;
  avatar?: string | null;
  bio?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  deletedAt?: string | null;
  is_demo?: boolean | null;
  isDemo?: boolean | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
}

export interface UserProfileUpdateDTO {
  name?: string;
  store_name?: string;
  phone?: string;
  region?: string;
  district?: string;
  province_code?: string | null;
  regency_code?: string | null;
  district_code?: string | null;
  village?: string | null;
  avatar?: string | null;
  bio?: string | null;
}
