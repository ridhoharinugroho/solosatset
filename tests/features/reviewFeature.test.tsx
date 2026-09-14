// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewFeature } from "../../src/features/review/ReviewFeature";
import * as storageReviews from "../../js/services/storageReviews.js";

describe("Review Feature Component", () => {
  const mockSellerId = "seller-123";

  beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    const currentUser = {
      id: "buyer-999",
      name: "Joko",
      district: "Serengan",
      region: "solo",
      avatar: "https://example.com/myavatar.jpg",
    };
    localStorage.setItem("pusat_barkas_current_user", JSON.stringify(currentUser));
    (window as unknown as Record<string, unknown>).__currentUser = currentUser;

    // Initialize mock reviews in window.__reviews
    (window as unknown as Record<string, unknown>).__reviews = [
      {
        id: "rev-1",
        sellerId: mockSellerId,
        buyerId: "buyer-1",
        buyerName: "Budi (Jebres)",
        buyerAvatar: "https://example.com/avatar.jpg",
        productImage: "https://example.com/item.jpg",
        rating: 5,
        comment: "Penjual sangat ramah, barang sesuai deskripsi!",
        createdAt: "2026-09-10T10:00:00Z",
        isHidden: false,
      },
      {
        id: "rev-2",
        sellerId: mockSellerId,
        buyerId: "buyer-2",
        buyerName: "Siti (Colomadu)",
        buyerAvatar: "https://example.com/avatar2.jpg",
        productImage: "https://example.com/item2.jpg",
        rating: 4,
        comment: "Respon cepat, recommended seller.",
        createdAt: "2026-09-08T10:00:00Z",
        isHidden: false,
      },
    ];
  });

  it("harus me-render ulasan dan statistik rating penjual", () => {
    render(<ReviewFeature sellerId={mockSellerId} sellerName="Toko Serba Ada" />);

    expect(screen.getByText("Ulasan & Rating Toko")).not.toBeNull();
    expect(screen.getByText("Penjual sangat ramah, barang sesuai deskripsi!")).not.toBeNull();
    expect(screen.getByText("Respon cepat, recommended seller.")).not.toBeNull();
    expect(screen.getByText("4.5")).not.toBeNull();
  });

  it("harus menampilkan pesan error jika foto produk tidak diisi saat submit", async () => {
    render(<ReviewFeature sellerId={mockSellerId} sellerName="Toko Serba Ada" />);

    const textarea = screen.getByPlaceholderText(/Ceritakan kepuasan Anda/i);
    fireEvent.change(textarea, { target: { value: "Barang bagus banget!" } });

    const submitBtn = screen.getByText("Kirim Ulasan Toko");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ulasan ditolak sistem: Anda wajib melampirkan foto produk/i)).not.toBeNull();
    });
  });

  it("harus berhasil mengirim ulasan jika data valid", async () => {
    render(<ReviewFeature sellerId={mockSellerId} sellerName="Toko Serba Ada" />);

    const textarea = screen.getByPlaceholderText(/Ceritakan kepuasan Anda/i);
    fireEvent.change(textarea, { target: { value: "Ulasan baru dari pengujian unit test." } });

    const urlInput = screen.getByPlaceholderText("https://...");
    fireEvent.change(urlInput, { target: { value: "https://example.com/bukti.jpg" } });

    const submitBtn = screen.getByText("Kirim Ulasan Toko");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Ulasan Anda berhasil ditambahkan!")).not.toBeNull();
      expect(screen.getByText("Ulasan baru dari pengujian unit test.")).not.toBeNull();
    });
  });

  it("harus mendukung tombol admin untuk menyembunyikan dan menghapus ulasan", async () => {
    sessionStorage.setItem("pusat_barkas_admin_auth", "true");

    // Spy on deleteSellerReview to avoid hanging Supabase network calls
    vi.spyOn(storageReviews, "deleteSellerReview").mockImplementation(async (reviewId: string) => {
      const all = storageReviews.getAllReviews();
      const idx = all.findIndex((r: { id: string }) => r.id === reviewId);
      if (idx !== -1) {
        all.splice(idx, 1);
        (window as unknown as Record<string, unknown>).__reviews = all;
      }
      return true;
    });

    render(<ReviewFeature sellerId={mockSellerId} sellerName="Toko Serba Ada" isAdmin={true} />);

    const hideButtons = screen.getAllByText("Sembunyikan");
    expect(hideButtons.length).toBe(2);

    fireEvent.click(hideButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Tampilkan")).not.toBeNull();
    });

    const deleteButtons = screen.getAllByText("Hapus");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Penjual sangat ramah, barang sesuai deskripsi!")).toBeNull();
    });
  });
});
