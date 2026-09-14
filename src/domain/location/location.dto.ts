export interface RefProvinceDTO {
  code: string;
  name: string;
}

export interface RefRegencyDTO {
  code: string;
  province_code?: string;
  provinceCode?: string;
  name: string;
  type?: string;
}

export interface RefDistrictDTO {
  code: string;
  regency_code?: string;
  regencyCode?: string;
  name: string;
}

export interface LocationHierarchyDTO {
  province_code?: string | null;
  provinceCode?: string | null;
  regency_code?: string | null;
  regencyCode?: string | null;
  district_code?: string | null;
  districtCode?: string | null;
  village?: string | null;
  region?: string | null;
  district?: string | null;
}
