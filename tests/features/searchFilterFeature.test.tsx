// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchFilterFeature } from "../../src/features/search-filter/SearchFilterFeature";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";

const MOCK_LISTINGS: SupabaseListingRowDTO[] = [
  {
    id: "lst-1",
    title: "Laptop Asus ROG Bekas",
    description: "Laptop gaming mulus",
    price: 8500000,
    category: "Elektronik",
    condition: "like_new",
    region: "solo",
    district: "Jebres",
    province_code: "33",
    regency_code: "3372",
    district_code: "337202",
    village: "Kentingan",
    is_bu: true,
    views: 120,
    created_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "lst-2",
    title: "Sepeda Polygon Xtrada",
    description: "Sepeda gunung ukuran 27.5",
    price: 3500000,
    category: "Hobi",
    condition: "good",
    region: "karanganyar",
    district: "Colomadu",
    province_code: "33",
    regency_code: "3313",
    district_code: "331301",
    is_bu: false,
    views: 45,
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "lst-3",
    title: "Jaket Kulit Asli",
    description: "Jaket ukuran L hitam",
    price: 450000,
    category: "Fashion",
    condition: "good",
    region: "sukoharjo",
    district: "Kartasura",
    province_code: "33",
    regency_code: "3311",
    district_code: "331101",
    is_bu: false,
    views: 80,
    created_at: "2026-09-05T10:00:00Z",
  },
];

describe("Search + Filter Feature Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("harus me-render seluruh daftar listing awal", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    expect(screen.getByText("Laptop Asus ROG Bekas")).not.toBeNull();
    expect(screen.getByText("Sepeda Polygon Xtrada")).not.toBeNull();
    expect(screen.getByText("Jaket Kulit Asli")).not.toBeNull();
  });

  it("harus menyaring daftar listing berdasarkan kata kunci pencarian", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    const searchInput = screen.getByPlaceholderText(/Cari barang/i);
    fireEvent.change(searchInput, { target: { value: "Laptop" } });

    expect(screen.getByText("Laptop Asus ROG Bekas")).not.toBeNull();
    expect(screen.queryByText("Sepeda Polygon Xtrada")).toBeNull();
    expect(screen.queryByText("Jaket Kulit Asli")).toBeNull();
  });

  it("harus menyaring berdasarkan kategori", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    const categorySelect = screen.getByDisplayValue("Semua Kategori");
    fireEvent.change(categorySelect, { target: { value: "Hobi" } });

    expect(screen.queryByText("Laptop Asus ROG Bekas")).toBeNull();
    expect(screen.getByText("Sepeda Polygon Xtrada")).not.toBeNull();
  });

  it("harus menyaring hanya barang BU ketika checkbox BU diaktifkan", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    const buCheckbox = screen.getByLabelText(/Hanya Butuh Uang \(BU\)/i);
    fireEvent.click(buCheckbox);

    expect(screen.getByText("Laptop Asus ROG Bekas")).not.toBeNull();
    expect(screen.queryByText("Sepeda Polygon Xtrada")).toBeNull();
    expect(screen.queryByText("Jaket Kulit Asli")).toBeNull();
  });

  it("harus menyaring berdasarkan lokasi BPS (Kabupaten/Kota 3372 Kota Solo)", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    // Select Province 33 (Jawa Tengah)
    const provSelect = screen.getByDisplayValue("Semua Provinsi");
    fireEvent.change(provSelect, { target: { value: "33" } });

    // Select Regency 33.72 (Kota Solo)
    const regSelect = screen.getByDisplayValue("Semua Kab/Kota");
    fireEvent.change(regSelect, { target: { value: "33.72" } });

    expect(screen.getByText("Laptop Asus ROG Bekas")).not.toBeNull();
    expect(screen.queryByText("Sepeda Polygon Xtrada")).toBeNull();
  });

  it("harus mereset seluruh filter saat tombol Reset Filter diklik", () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    const searchInput = screen.getByPlaceholderText(/Cari barang/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentItem" } });
    expect(screen.getByText("Barang Tidak Ditemukan")).not.toBeNull();

    const resetButton = screen.getByText("Reset Filter");
    fireEvent.click(resetButton);

    expect(screen.getByText("Laptop Asus ROG Bekas")).not.toBeNull();
    expect(screen.getByText("Sepeda Polygon Xtrada")).not.toBeNull();
  });
});
