import { describe, it, expect } from "vitest";
import { mapListingDtoToDomain, mapDomainToListingCreateDto } from "../../src/domain/listing/listing.mapper";

describe("Listing Domain Mapper", () => {
  it("harus menormalisasi DTO format snake_case Supabase ke ListingModel domain", () => {
    const rawDto = {
      id: "lst-101",
      title: " Laptop Bekas Mulus ",
      description: "Kondisi baik, garansi aktif",
      price: "4500000",
      category: "Elektronik",
      condition: "like_new",
      nego_type: "nego_alus",
      payment_method: "cod",
      region: "solo",
      district: "Banjarsari",
      province_code: "33",
      regency_code: "3372",
      district_code: "337201",
      village: "Manahan",
      cod_point: "Depan Solo Grand Mall",
      store_maps_url: "https://maps.google.com/test",
      seller_id: "usr-01",
      seller_name: "Toko Harapan",
      seller_phone: "08123456789",
      seller_avatar: "https://avatar.png",
      images: ["https://img1.jpg", "https://img2.jpg"],
      status: "active",
      is_bu: true,
      bu_expires_at: "2026-10-01T00:00:00Z",
      qris_verified: true,
      views: 42,
      created_at: "2026-09-01T10:00:00Z",
    };

    const domain = mapListingDtoToDomain(rawDto);

    expect(domain.id).toBe("lst-101");
    expect(domain.title).toBe("Laptop Bekas Mulus");
    expect(domain.price).toBe(4500000);
    expect(domain.negoType).toBe("nego_alus");
    expect(domain.paymentMethod).toBe("cod");
    expect(domain.regionId).toBe("solo");
    expect(domain.provinceCode).toBe("33");
    expect(domain.regencyCode).toBe("3372");
    expect(domain.seller.id).toBe("usr-01");
    expect(domain.seller.storeName).toBe("Toko Harapan");
    expect(domain.isBu).toBe(true);
    expect(domain.isQrisVerified).toBe(true);
    expect(domain.views).toBe(42);
  });

  it("harus menormalisasi DTO format camelCase ke ListingModel domain", () => {
    const rawDto = {
      id: "lst-102",
      title: "Kamera DSLR",
      price: 3000000,
      negoType: "pass",
      paymentMethod: "transfer",
      regionId: "sukoharjo",
      district: "Kartasura",
      provinceCode: "33",
      regencyCode: "33.11",
      seller: {
        id: "usr-02",
        name: "Penjual Kamera",
        storeName: "Kamera Solo",
        phone: "089999999",
      },
      isBu: false,
      isQrisVerified: false,
    };

    const domain = mapListingDtoToDomain(rawDto);

    expect(domain.id).toBe("lst-102");
    expect(domain.negoType).toBe("pass");
    expect(domain.paymentMethod).toBe("transfer");
    expect(domain.regionId).toBe("sukoharjo");
    expect(domain.seller.storeName).toBe("Kamera Solo");
    expect(domain.isBu).toBe(false);
  });

  it("harus menangani data kosong atau undefined secara aman", () => {
    const domain = mapListingDtoToDomain(null);

    expect(domain.id).toBe("");
    expect(domain.price).toBe(0);
    expect(domain.seller.name).toBe("Penjual");
    expect(domain.images).toEqual([]);
    expect(domain.status).toBe("active");
  });

  it("harus memetakan Domain Model kembali ke ListingCreateDTO", () => {
    const domain = mapListingDtoToDomain({
      id: "lst-103",
      title: " Sepeda Gunung ",
      price: 1500000,
      nego_type: "pass",
      payment_method: "cod",
      region: "karanganyar",
      district: "Colomadu",
      seller_id: "usr-03",
      seller_name: "Toko Sepeda",
    });

    const createDto = mapDomainToListingCreateDto(domain);

    expect(createDto.title).toBe("Sepeda Gunung");
    expect(createDto.price).toBe(1500000);
    expect(createDto.nego_type).toBe("pass");
    expect(createDto.payment_method).toBe("cod");
    expect(createDto.seller_id).toBe("usr-03");
  });
});
