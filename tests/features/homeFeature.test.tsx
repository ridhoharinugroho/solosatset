// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeFeature } from "../../src/features/home/HomeFeature";
import { mapListingDtoToDomain } from "../../src/domain/listing/listing.mapper";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";

const MOCK_LISTINGS_DTO: SupabaseListingRowDTO[] = [
  {
    id: "lst-101",
    title: "Laptop ThinkPad T480 Core i7",
    description: "Kondisi mulus RAM 16GB SSD 512GB",
    price: 4500000,
    category: "Elektronik",
    condition: "bekas",
    is_bu: true,
    regionId: "solo",
    province_code: "33",
    regency_code: "33.72",
    district_code: "33.72.01",
    district: "Banjarsari",
    seller_id: "usr-1",
    seller_name: "Budi Store",
    seller_avatar: "",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8"],
    views: 120,
    created_at: "2026-09-10T10:00:00Z",
    updated_at: "2026-09-10T10:00:00Z",
    status: "active",
    nego_type: "tipis",
    seller_phone: "08123456789",
  },
  {
    id: "lst-102",
    title: "Sepeda Motor Honda Vario 125",
    description: "Surat lengkap pajak jalan mulus",
    price: 12500000,
    category: "Kendaraan",
    condition: "bekas",
    is_bu: false,
    regionId: "jogja",
    province_code: "34",
    regency_code: "34.71",
    district_code: "34.71.01",
    district: "Gondokusuman",
    seller_id: "usr-2",
    seller_name: "Jogja Motor",
    seller_avatar: "",
    images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc"],
    views: 85,
    created_at: "2026-09-12T10:00:00Z",
    updated_at: "2026-09-12T10:00:00Z",
    status: "active",
    nego_type: "pas",
    seller_phone: "08987654321",
  },
];

const mockListings = MOCK_LISTINGS_DTO.map(mapListingDtoToDomain);

describe("HomeFeature (Modular Home Browsing)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders hero header, promo banner, category pills, search bar, and listing grid", () => {
    render(<HomeFeature initialListings={mockListings} />);

    expect(screen.getByText(/Jual Beli Barang Terdekat — Pantau Cocok Bayar/i)).not.toBeNull();
    expect(screen.getByText(/SOPALOKA/i)).not.toBeNull();
    expect(screen.getByText(/Transaksi Langsung COD/i)).not.toBeNull();
    expect(screen.getAllByText("Semua Kategori")[0]).not.toBeNull();
    expect(screen.getByText("Laptop ThinkPad T480 Core i7")).not.toBeNull();
    expect(screen.getByText("Sepeda Motor Honda Vario 125")).not.toBeNull();
  });

  it("filters listings by keyword search input", () => {
    render(<HomeFeature initialListings={mockListings} />);

    const searchInput = screen.getByPlaceholderText(/Cari barang/i);
    fireEvent.change(searchInput, { target: { value: "ThinkPad" } });

    expect(screen.getByText("Laptop ThinkPad T480 Core i7")).not.toBeNull();
    expect(screen.queryByText("Sepeda Motor Honda Vario 125")).toBeNull();
  });

  it("filters listings by category pill click", () => {
    render(<HomeFeature initialListings={mockListings} />);

    const kendaraanPill = screen.getAllByRole("button", { name: /Kendaraan/i })[0];
    fireEvent.click(kendaraanPill);

    expect(screen.queryByText("Laptop ThinkPad T480 Core i7")).toBeNull();
    expect(screen.getByText("Sepeda Motor Honda Vario 125")).not.toBeNull();
  });

  it("opens listing detail modal on card click and closes on dismiss button click", () => {
    render(<HomeFeature initialListings={mockListings} />);

    // Click on listing card
    const cardTitle = screen.getByText("Laptop ThinkPad T480 Core i7");
    fireEvent.click(cardTitle);

    // Modal overlay should be visible
    expect(screen.getByTestId("listing-detail-modal-overlay")).not.toBeNull();
    expect(screen.getByText("Kondisi mulus RAM 16GB SSD 512GB")).not.toBeNull();

    // Close modal
    const closeBtn = screen.getByLabelText("Tutup Detail");
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId("listing-detail-modal-overlay")).toBeNull();
  });
});
