import { describe, it, expect } from "vitest";
import { mapUserDtoToDomain, extractSellerProfile, mapDomainToUserUpdateDto } from "../../src/domain/user/user.mapper";

describe("User Domain Mapper", () => {
  it("harus menormalisasi DTO Supabase (snake_case) ke UserProfile domain", () => {
    const rawDto = {
      id: "usr-001",
      name: "Budi Santoso",
      store_name: "Toko Budi Barokah",
      email: "budi@example.com",
      phone: "081234567890",
      region: "solo",
      district: "Jebres",
      province_code: "33",
      regency_code: "3372",
      district_code: "337202",
      village: "Kenting",
      avatar: "https://avatar.png",
      bio: "Penjual terpercaya Solo",
      status: "active",
      deleted_at: null,
      is_demo: false,
      created_at: "2026-08-01T00:00:00Z",
    };

    const domain = mapUserDtoToDomain(rawDto);

    expect(domain.id).toBe("usr-001");
    expect(domain.name).toBe("Budi Santoso");
    expect(domain.storeName).toBe("Toko Budi Barokah");
    expect(domain.provinceCode).toBe("33");
    expect(domain.regencyCode).toBe("3372");
    expect(domain.isDemo).toBe(false);
    expect(domain.deletedAt).toBeNull();
  });

  it("harus menggunakan `name` sebagai fallback jika `store_name` / `storeName` kosong", () => {
    const rawDto = {
      id: "usr-002",
      name: "Siti Rahma",
      email: "siti@example.com",
    };

    const domain = mapUserDtoToDomain(rawDto);

    expect(domain.name).toBe("Siti Rahma");
    expect(domain.storeName).toBe("Siti Rahma");
  });

  it("harus mengekstrak SellerProfile dengan tepat dari UserProfile", () => {
    const domain = mapUserDtoToDomain({
      id: "usr-003",
      name: "Agus",
      store_name: "Toko Elektronik Agus",
      phone: "08567891234",
      region: "karanganyar",
      district: "Colomadu",
      avatar: "https://avatar.jpg",
    });

    const seller = extractSellerProfile(domain);

    expect(seller.id).toBe("usr-003");
    expect(seller.storeName).toBe("Toko Elektronik Agus");
    expect(seller.phone).toBe("08567891234");
    expect(seller.region).toBe("karanganyar");
  });

  it("harus memetakan update DTO ke format snake_case", () => {
    const updateDto = mapDomainToUserUpdateDto({
      name: "Budi Update",
      storeName: "Toko Budi Baru",
      provinceCode: "33",
      regencyCode: "3372",
    });

    expect(updateDto.name).toBe("Budi Update");
    expect(updateDto.store_name).toBe("Toko Budi Baru");
    expect(updateDto.province_code).toBe("33");
  });
});
