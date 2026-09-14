export interface ProvinceItem {
  code: string;
  name: string;
}

export interface RegencyItem {
  code: string;
  provinceCode: string;
  name: string;
  type: string;
}

export interface DistrictItem {
  code: string;
  regencyCode: string;
  name: string;
}

export interface LocationHierarchy {
  provinceCode: string | null;
  regencyCode: string | null;
  districtCode: string | null;
  village: string | null;
  legacyRegion: string | null;
  legacyDistrict: string | null;
}
