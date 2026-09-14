// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminFeature } from "../../src/features/admin/AdminFeature";
import * as storage from "../../js/services/storage.js";

describe("Admin Feature Component & Security Suite", () => {
  const mockListings = [
    {
      id: "lst-adm-1",
      title: "Iklan Uji Admin 1",
      price: 500000,
      category: "Elektronik",
      condition: "Bagus",
      regionId: "solo",
      district: "Jebres",
      isHidden: false,
      isSold: false,
      seller: { name: "Penjual 1", phone: "08123456789" },
    },
    {
      id: "lst-adm-2",
      title: "Iklan Uji Admin 2 (Terjual)",
      price: 1500000,
      category: "Kendaraan",
      condition: "Normal",
      regionId: "karanganyar",
      district: "Colomadu",
      isHidden: false,
      isSold: true,
      seller: { name: "Penjual 2", phone: "08987654321" },
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(storage, "getAllListings").mockReturnValue(mockListings as any);

    // Reset window.__reviews
    (window as unknown as Record<string, unknown>).__reviews = [
      {
        id: "rev-admin-1",
        sellerId: "seller-1",
        buyerName: "User Test",
        comment: "Ulasan dari pembeli.",
        rating: 5,
        createdAt: "2026-09-10T10:00:00Z",
        isHidden: false,
      },
    ];

    // Mock fetch for /api/admin-auth
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin-auth?action=session")) {
        // Default to unauthenticated session
        return {
          ok: true,
          json: async () => ({ ok: true, authenticated: false }),
        } as Response;
      }

      if (urlStr.includes("/api/admin-auth?action=login")) {
        const body = JSON.parse(String(options?.body || "{}"));
        if (body.username === "admin" && body.password === "correct_password") {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              authenticated: true,
              user: { id: "admin-1", username: "admin", role: "admin" },
            }),
          } as Response;
        } else {
          return {
            ok: false,
            status: 401,
            json: async () => ({ ok: false, error: "Username atau Password salah." }),
          } as Response;
        }
      }

      if (urlStr.includes("/api/admin-auth?action=logout")) {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });
  });

  it("1. Negative Auth: Non-admin / unauthenticated user ditolak dan diarahkan ke login", async () => {
    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Panel Admin SoloSatSet")).not.toBeNull();
      expect(screen.getByPlaceholderText(/Contoh: admin/i)).not.toBeNull();
    });
  });

  it("2. Negative Auth: Login dengan password salah akan menampilkan pesan kesalahan", async () => {
    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Panel Admin SoloSatSet")).not.toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText(/Contoh: admin/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong_password" } });

    fireEvent.click(screen.getByText("Masuk ke Panel Admin"));

    await waitFor(() => {
      expect(screen.getByText("Username atau Password salah.")).not.toBeNull();
    });
  });

  it("3. Positive Auth: Login berhasil menampilkan Dashboard Admin dan statistik overview", async () => {
    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Panel Admin SoloSatSet")).not.toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText(/Contoh: admin/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "correct_password" } });

    fireEvent.click(screen.getByText("Masuk ke Panel Admin"));

    await waitFor(() => {
      expect(screen.getByText("Panel Kontrol Administrator")).not.toBeNull();
      expect(screen.getByText("Iklan Uji Admin 1")).not.toBeNull();
      expect(screen.getByText("Total Iklan")).not.toBeNull();
    });
  });

  it("4. Moderasi Iklan: Menyembunyikan, menandai terjual, dan menghapus iklan", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (String(url).includes("action=session")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            authenticated: true,
            user: { id: "admin-1", username: "admin", role: "admin" },
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({ ok: true }) } as Response;
    });

    const toggleHideSpy = vi.spyOn(storage, "toggleHideListing").mockReturnValue({ id: "lst-adm-1", isHidden: true } as any);
    const toggleSoldSpy = vi.spyOn(storage, "toggleSoldStatus").mockReturnValue({ id: "lst-adm-1", isSold: true } as any);

    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Iklan Uji Admin 1")).not.toBeNull();
    });

    // Toggle hide
    const hideBtn = screen.getAllByText("Sembunyikan")[0];
    fireEvent.click(hideBtn);
    expect(toggleHideSpy).toHaveBeenCalledWith("lst-adm-1");

    // Toggle sold
    const soldBtn = screen.getByText("Terjual");
    fireEvent.click(soldBtn);
    expect(toggleSoldSpy).toHaveBeenCalledWith("lst-adm-1");
  });

  it("5. Logout Admin: Menghapus sesi server dan kembali ke form login", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (String(url).includes("action=session")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            authenticated: true,
            user: { id: "admin-1", username: "admin", role: "admin" },
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({ ok: true }) } as Response;
    });

    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Panel Kontrol Administrator")).not.toBeNull();
    });

    const logoutBtn = screen.getByText(/Keluar \(Logout\)/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByText("Panel Admin SoloSatSet")).not.toBeNull();
    });
  });
});
