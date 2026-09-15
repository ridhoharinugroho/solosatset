// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { TokoSayaFeature } from "../../src/features/toko-saya/TokoSayaFeature";
import { mapListingDtoToDomain } from "../../src/domain/listing/listing.mapper";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";

const MOCK_LISTINGS_DTO: SupabaseListingRowDTO[] = [
  {
    id: "seller-lst-1",
    title: "Kamera Canon EOS 80D",
    description: "Kondisi mulus box lengkap",
    price: 7500000,
    category: "Elektronik",
    condition: "bekas",
    status: "active",
    views: 45,
    seller_id: "seller-123",
    seller_name: "Toko Kamera Surakarta",
  },
  {
    id: "seller-lst-2",
    title: "Lensa Canon 50mm f1.8",
    description: "Lensa bokeh tajam",
    price: 1200000,
    category: "Elektronik",
    condition: "bekas",
    status: "sold",
    views: 89,
    seller_id: "seller-123",
    seller_name: "Toko Kamera Surakarta",
  },
];

const mockListings = MOCK_LISTINGS_DTO.map(mapListingDtoToDomain);

describe("TokoSayaFeature Component & Hooks", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders seller header, statistics, status filter tabs, and seller listing grid", () => {
    render(<TokoSayaFeature initialListings={mockListings} sellerId="seller-123" />);

    expect(screen.getByText("Toko Saya")).not.toBeNull();
    expect(screen.getByText("Kamera Canon EOS 80D")).not.toBeNull();
    expect(screen.getByText("Lensa Canon 50mm f1.8")).not.toBeNull();
  });

  it("filters seller listings by status tab click (Aktif vs Terjual)", () => {
    render(<TokoSayaFeature initialListings={mockListings} sellerId="seller-123" />);

    // Click on "Tersedia" filter tab
    const availableTab = screen.getAllByRole("button").find(b => b.textContent?.includes("Tersedia"));
    if (availableTab) {
      act(() => {
        fireEvent.click(availableTab);
      });
    }

    expect(screen.getByText("Kamera Canon EOS 80D")).not.toBeNull();
    expect(screen.queryByText("Lensa Canon 50mm f1.8")).toBeNull();

    // Click on "Terjual" filter tab
    const soldTab = screen.getAllByRole("button").find(b => b.textContent?.includes("Terjual"));
    if (soldTab) {
      act(() => {
        fireEvent.click(soldTab);
      });
    }

    expect(screen.queryByText("Kamera Canon EOS 80D")).toBeNull();
    expect(screen.getByText("Lensa Canon 50mm f1.8")).not.toBeNull();
  });

  it("triggers create listing form modal on header button click", () => {
    render(<TokoSayaFeature initialListings={mockListings} sellerId="seller-123" />);

    const createBtn = screen.getByRole("button", { name: /Pasang Iklan/i });
    fireEvent.click(createBtn);

    expect(screen.getByText("Pasang Iklan Barang Baru")).not.toBeNull();
    expect(screen.getByText("Batal")).not.toBeNull();
  });
});


