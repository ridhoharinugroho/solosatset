import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListings } from "../useListings";

describe("useListings hook Unit Tests", () => {
  it("initializes with provided initial listings", () => {
    const sample = [
      {
        id: "lst-unit-1",
        title: "Kamera Vintage Bekas",
        price: 1500000,
        formattedPrice: "Rp 1.500.000",
        region: "solo",
        category: "elektronik",
        status: "active",
        createdAt: "2026-09-01",
      },
    ];

    const { result } = renderHook(() => useListings(sample as any));

    expect(result.current.listings).toEqual(sample);
    expect(result.current.isLoading).toBe(false);
  });

  it("updates listings when 'listingsChanged' custom event is dispatched", async () => {
    const initial = [
      { id: "lst-1", title: "Item A", price: 1000, formattedPrice: "Rp 1.000", region: "solo" },
    ];
    const updated = [
      { id: "lst-1", title: "Item A", price: 1000, formattedPrice: "Rp 1.000", region: "solo" },
      { id: "lst-2", title: "Item B", price: 2000, formattedPrice: "Rp 2.000", region: "solo" },
    ];

    const { result } = renderHook(() => useListings(initial as any));

    act(() => {
      window.dispatchEvent(new CustomEvent("listingsChanged", { detail: updated }));
    });

    expect(result.current.listings.length).toBe(2);
  });
});
