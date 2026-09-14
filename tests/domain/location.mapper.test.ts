import { describe, it, expect } from "vitest";
import { normalizeBpsCode, mapLocationDtoToDomain } from "../../src/domain/location/location.mapper";

describe("Location Domain Mapper", () => {
  it("harus menormalisasi kode BPS tanpa titik menjadi standar format BPS berformat titik", () => {
    expect(normalizeBpsCode("33")).toBe("33");
    expect(normalizeBpsCode("3372")).toBe("33.72");
    expect(normalizeBpsCode("337201")).toBe("33.72.01");
    expect(normalizeBpsCode("33.72.01")).toBe("33.72.01");
    expect(normalizeBpsCode("")).toBeNull();
    expect(normalizeBpsCode(null)).toBeNull();
  });

  it("harus memetakan LocationHierarchyDTO dengan kode BPS & legacy region/district", () => {
    const dto = {
      province_code: "33",
      regency_code: "3372",
      district_code: "337201",
      village: "Manahan",
      region: "solo",
      district: "Banjarsari",
    };

    const domain = mapLocationDtoToDomain(dto);

    expect(domain.provinceCode).toBe("33");
    expect(domain.regencyCode).toBe("33.72");
    expect(domain.districtCode).toBe("33.72.01");
    expect(domain.village).toBe("Manahan");
    expect(domain.legacyRegion).toBe("solo");
    expect(domain.legacyDistrict).toBe("Banjarsari");
  });

  it("harus menangani DTO berformat camelCase", () => {
    const dto = {
      provinceCode: "34",
      regencyCode: "3404",
      districtCode: "340401",
    };

    const domain = mapLocationDtoToDomain(dto);

    expect(domain.provinceCode).toBe("34");
    expect(domain.regencyCode).toBe("34.04");
    expect(domain.districtCode).toBe("34.04.01");
  });

  it("harus merespons aman saat DTO null atau kosong", () => {
    const domain = mapLocationDtoToDomain(null);

    expect(domain.provinceCode).toBeNull();
    expect(domain.regencyCode).toBeNull();
    expect(domain.districtCode).toBeNull();
    expect(domain.village).toBeNull();
    expect(domain.legacyRegion).toBeNull();
  });
});
