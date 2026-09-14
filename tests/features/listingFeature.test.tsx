// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingFeature } from "../../src/features/listing/ListingFeature";
import { ListingDetail } from "../../src/features/listing/components/ListingDetail";
import { ListingGallery } from "../../src/features/listing/components/ListingGallery";
import { ListingMetadata } from "../../src/features/listing/components/ListingMetadata";
import { ListingActions } from "../../src/features/listing/components/ListingActions";
import { mapListingDtoToDomain } from "../../src/domain/listing/listing.mapper";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";

const MOCK_LISTINGS_DTO: SupabaseListingRowDTO[] = [
  {
    id: "lst-201",
    title: "iPhone 13 Pro 128GB Mulus",
    description: "Battery health 88%, fullset original.",
    price: 9800000,
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
    cod_point: "Depan Stadion Manahan",
    seller_id: "usr-88",
    seller_name: "Apple Store Solo",
    seller_phone: "08123456789",
    images: [
      "https://example.com/iphone-1.jpg",
      "https://example.com/iphone-2.jpg",
      "https://example.com/iphone-3.jpg",
    ],
    is_bu: true,
    qris_verified: true,
    views: 215,
    created_at: "2026-09-10T12:00:00Z",
  },
  {
    id: "lst-202",
    title: "Helm KYT TT Course",
    description: "Helm msh baru pakai 2x",
    price: 950000,
    category: "Hobi",
    condition: "good",
    region: "karanganyar",
    district: "Colomadu",
    province_code: "33",
    regency_code: "3313",
    seller_id: "usr-89",
    seller_name: "Rider Store",
    seller_phone: "08987654321",
    images: ["https://example.com/helm.jpg"],
    is_bu: false,
    views: 30,
    created_at: "2026-09-08T10:00:00Z",
  },
];

describe("Listing Feature Components & Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("1. Harus me-render daftar listing pada grid", () => {
    render(<ListingFeature initialListings={MOCK_LISTINGS_DTO} />);

    expect(screen.getByText("iPhone 13 Pro 128GB Mulus")).not.toBeNull();
    expect(screen.getByText("Helm KYT TT Course")).not.toBeNull();
  });

  it("2. Harus membuka modal detail saat kartu listing diklik", () => {
    render(<ListingFeature initialListings={MOCK_LISTINGS_DTO} />);

    const card = screen.getByText("iPhone 13 Pro 128GB Mulus");
    fireEvent.click(card);

    expect(screen.getByText(/Detail Produk — iPhone 13 Pro 128GB Mulus/i)).not.toBeNull();
    expect(screen.getByText("Battery health 88%, fullset original.")).not.toBeNull();
  });

  it("3. Harus dapat mengganti foto aktif pada galeri foto", () => {
    const onSelect = vi.fn();
    render(
      <ListingGallery
        images={[
          "https://example.com/iphone-1.jpg",
          "https://example.com/iphone-2.jpg",
        ]}
        title="iPhone 13 Pro"
        activeIndex={0}
        onImageSelect={onSelect}
      />
    );

    const thumbnail2 = screen.getByAltText("Thumbnail 2");
    fireEvent.click(thumbnail2);

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("4. Harus me-render metadata produk & lokasi BPS/legacy secara akurat", () => {
    const domainModel = mapListingDtoToDomain(MOCK_LISTINGS_DTO[0]);
    render(<ListingMetadata listing={domainModel} />);

    expect(screen.getByText("iPhone 13 Pro 128GB Mulus")).not.toBeNull();
    expect(screen.getByText("Rp 9.800.000")).not.toBeNull();
    expect(screen.getByText(/Manahan, Banjarsari, solo/i)).not.toBeNull();
    expect(screen.getByText(/Depan Stadion Manahan/i)).not.toBeNull();
    expect(screen.getByText("Apple Store Solo")).not.toBeNull();
  });

  it("5. Harus memanggil callback aksi kontak penjual & bagikan", () => {
    const domainModel = mapListingDtoToDomain(MOCK_LISTINGS_DTO[0]);
    const onContact = vi.fn();
    const onShare = vi.fn();

    render(
      <ListingActions
        listing={domainModel}
        onContactClick={onContact}
        onShareClick={onShare}
      />
    );

    const chatBtn = screen.getByText(/Chat Penjual/i);
    fireEvent.click(chatBtn);
    expect(onContact).toHaveBeenCalledWith("08123456789", "iPhone 13 Pro 128GB Mulus");

    const shareBtn = screen.getByText(/Bagikan/i);
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledWith(domainModel);
  });

  it("6. Harus terintegrasi dengan Search + Filter (penyaringan & pencarian kata kunci)", () => {
    render(<ListingFeature initialListings={MOCK_LISTINGS_DTO} />);

    const searchInput = screen.getByPlaceholderText(/Cari barang/i);
    fireEvent.change(searchInput, { target: { value: "Helm" } });

    expect(screen.getByText("Helm KYT TT Course")).not.toBeNull();
    expect(screen.queryByText("iPhone 13 Pro 128GB Mulus")).toBeNull();
  });

  it("7. Harus menutup modal detail ketika tombol tutup diklik", () => {
    render(<ListingFeature initialListings={MOCK_LISTINGS_DTO} />);

    const card = screen.getByText("iPhone 13 Pro 128GB Mulus");
    fireEvent.click(card);

    const closeBtn = screen.getByLabelText("Tutup modal detail");
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Detail Produk — iPhone 13 Pro/i)).toBeNull();
  });
});
