import { describe, it, expect } from "vitest";
import { mapSearchQueryDtoToDomain } from "../../src/domain/search/search.mapper";
import { mapFilterDtoToDomain } from "../../src/domain/filter/filter.mapper";

describe("Search & Filter Domain Mapper", () => {
  it("harus memetakan SearchQueryParamsDTO ke SearchQuery domain model", () => {
    const dto = {
      q: " laptop ",
      category: "elektronik",
      region: "solo",
      district: "Jebres",
      province_code: "33",
      regency_code: "3372",
      min_price: "1000000",
      max_price: "5000000",
      sort: "price_asc",
    };

    const domain = mapSearchQueryDtoToDomain(dto);

    expect(domain.keyword).toBe("laptop");
    expect(domain.category).toBe("elektronik");
    expect(domain.regionId).toBe("solo");
    expect(domain.minPrice).toBe(1000000);
    expect(domain.maxPrice).toBe(5000000);
    expect(domain.sortBy).toBe("price_asc");
  });

  it("harus menormalisasi FilterStateDTO dengan format snake_case & camelCase", () => {
    const dto = {
      search_query: "sepeda",
      category: "hobi",
      region_id: "karanganyar",
      is_bu: true,
      sort_by: "newest",
    };

    const filterState = mapFilterDtoToDomain(dto);

    expect(filterState.searchQuery).toBe("sepeda");
    expect(filterState.category).toBe("hobi");
    expect(filterState.regionId).toBe("karanganyar");
    expect(filterState.isBu).toBe(true);
    expect(filterState.sortBy).toBe("newest");
  });

  it("harus menangani data kosong atau undefined pada search & filter", () => {
    const searchDomain = mapSearchQueryDtoToDomain(null);
    const filterDomain = mapFilterDtoToDomain(undefined);

    expect(searchDomain.keyword).toBe("");
    expect(searchDomain.category).toBe("all");
    expect(searchDomain.minPrice).toBeNull();

    expect(filterDomain.searchQuery).toBe("");
    expect(filterDomain.regionId).toBe("all");
    expect(filterDomain.isBu).toBe(false);
  });
});
