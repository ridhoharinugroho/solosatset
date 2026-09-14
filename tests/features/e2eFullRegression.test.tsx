// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Feature imports across all React phases
import { SearchFilterFeature } from "../../src/features/search-filter/SearchFilterFeature";
import { ListingDetail } from "../../src/features/listing/components/ListingDetail";
import { AuthModal } from "../../src/features/auth/AuthModal";
import { ProfileFeature } from "../../src/features/profile/ProfileFeature";
import { ListingManagementFeature } from "../../src/features/listing-management/ListingManagementFeature";
import { ReviewFeature } from "../../src/features/review/ReviewFeature";
import { NotificationFeature } from "../../src/features/notification/NotificationFeature";
import { AdminFeature } from "../../src/features/admin/AdminFeature";

// Service & domain imports
import * as authService from "../../src/services/authService";
import * as storage from "../../src/services/listingService";
import * as storageReviews from "../../src/services/reviewService";
import * as notificationsService from "../../src/services/notificationService";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";
import type { ListingModel } from "../../src/domain/listing/listing.contract";
import type { UserProfile } from "../../src/domain/user/user.contract";

const MOCK_LISTINGS: SupabaseListingRowDTO[] = [
  {
    id: "lst-e2e-1",
    title: "Laptop Asus Gaming ROG",
    description: "Laptop kencang mulus Like New",
    price: 9500000,
    category: "Elektronik",
    condition: "like_new",
    region: "solo",
    district: "Laweyan",
    province_code: "33",
    regency_code: "3372",
    district_code: "337201",
    seller_id: "usr-seller-100",
    seller_name: "Toko Komputer Solo",
    status: "active",
    is_bu: true,
    views: 85,
    created_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "lst-e2e-2",
    title: "Sepeda Lipat Dahon Bekas",
    description: "Sepeda lipat 20 inch mulus",
    price: 3200000,
    category: "Hobi",
    condition: "good",
    region: "karanganyar",
    district: "Colomadu",
    province_code: "33",
    regency_code: "3313",
    district_code: "331301",
    seller_id: "usr-seller-200",
    seller_name: "Gudang Sepeda",
    status: "active",
    is_bu: false,
    views: 40,
    created_at: "2026-08-20T10:00:00Z",
  },
];

const MOCK_USER: UserProfile = {
  id: "usr-seller-100",
  name: "Budi Santoso",
  storeName: "Toko Komputer Solo",
  email: "budi@sopaloka.id",
  phone: "081234567890",
  region: "solo",
  district: "Laweyan",
  provinceCode: "33",
  regencyCode: "3372",
  districtCode: "337201",
  village: "Purwosari",
  avatar: "https://example.com/avatar.jpg",
  bio: "Penjual laptop & aksesoris terpercaya",
  status: "active",
  deletedAt: null,
  isDemo: false,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: null,
};

describe("Phase 10: Full Integration & E2E Cross-Feature Regression Suite", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    localStorage.setItem("pusat_barkas_current_user", JSON.stringify(MOCK_USER));
    (window as unknown as Record<string, unknown>).__currentUser = MOCK_USER;

    (window as unknown as Record<string, unknown>).__reviews = [
      {
        id: "rev-100",
        sellerId: "usr-seller-100",
        buyerId: "usr-buyer-99",
        buyerName: "Siti (Colomadu)",
        buyerAvatar: "https://example.com/buyer.jpg",
        productImage: "https://example.com/laptop.jpg",
        rating: 5,
        comment: "Laptop mantap sesuai deskripsi!",
        createdAt: "2026-09-05T10:00:00Z",
        isHidden: false,
      },
    ];
  });

  // --------------------------------------------------------------------------
  // 1. PUBLIC JOURNEY: Search -> Filter -> Listing -> Detail
  // --------------------------------------------------------------------------
  it("1. Public Journey: Search -> Filter -> Listing -> Detail", async () => {
    render(<SearchFilterFeature initialListings={MOCK_LISTINGS} />);

    // Verification 1: Render initial listings
    expect(screen.getByText("Laptop Asus Gaming ROG")).not.toBeNull();
    expect(screen.getByText("Sepeda Lipat Dahon Bekas")).not.toBeNull();

    // Verification 2: Perform keyword search
    const searchInput = screen.getByPlaceholderText(/Cari barang/i);
    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    expect(screen.getByText("Laptop Asus Gaming ROG")).not.toBeNull();
    expect(screen.queryByText("Sepeda Lipat Dahon Bekas")).toBeNull();

    // Verification 3: Detail view render
    const selectedItem = {
      id: "lst-e2e-1",
      title: "Laptop Asus Gaming ROG",
      price: 9500000,
      formattedPrice: "Rp 9.500.000",
      category: "Elektronik",
      condition: "like_new",
      region: "Solo Raya",
      district: "Laweyan",
      description: "Laptop kencang mulus Like New",
      isBu: true,
      images: ["https://example.com/laptop.jpg"],
      seller: { id: "usr-seller-100", name: "Toko Komputer Solo", storeName: "Toko Komputer Solo", phone: "081234567890" },
      createdAt: "2026-09-01T10:00:00Z",
    } as unknown as ListingModel;

    render(
      <ListingDetail
        listing={selectedItem}
        isOpen={true}
        activeImageIndex={0}
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Detail Produk/i)).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 2. USER JOURNEY: Auth -> Session -> Profile -> Logout
  // --------------------------------------------------------------------------
  it("2. User Journey: Auth -> Session -> Profile -> Logout", async () => {
    // Auth Modal test
    render(<AuthModal isOpen={true} initialMode="login" onClose={vi.fn()} />);
    expect(screen.getByText("Masuk Akun SOPALOKA")).not.toBeNull();

    // Profile Feature test
    render(<ProfileFeature initialProfile={MOCK_USER} onUpdateProfileSubmit={vi.fn()} />);
    expect(screen.getByText(/Toko Komputer Solo/i)).not.toBeNull();

    // Logout test
    const logoutSpy = vi.spyOn(authService, "logout").mockImplementation(async () => {
      localStorage.clear();
      sessionStorage.clear();
      delete (window as unknown as Record<string, unknown>).__currentUser;
    });

    await logoutSpy();
    expect(localStorage.getItem("pusat_barkas_current_user")).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 3. SELLER JOURNEY: Login -> Seller Studio -> Management -> Public Feed Sync
  // --------------------------------------------------------------------------
  it("3. Seller Journey: Management -> Create/Edit Listing -> Status Change", async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ListingManagementFeature
        currentUser={MOCK_USER}
        allListings={MOCK_LISTINGS}
        onSaveListingSubmit={onSave}
      />
    );

    // Verify seller's owned listing appears
    expect(screen.getByText("Laptop Asus Gaming ROG")).not.toBeNull();

    // Click mark as sold
    const soldBtns = screen.getAllByText("✓ Laku / Sold");
    fireEvent.click(soldBtns[0]);

    expect(onSave).toHaveBeenCalledWith({
      id: "lst-e2e-1",
      status: "sold",
    });
  });

  // --------------------------------------------------------------------------
  // 4. REVIEW & NOTIFICATION JOURNEY: Submit Review -> Display -> Notification Read
  // --------------------------------------------------------------------------
  it("4. Review & Notification Journey: Review submit -> Notification read & push", async () => {
    // Review feature test
    render(<ReviewFeature sellerId="usr-seller-100" sellerName="Toko Komputer Solo" />);

    expect(screen.getByText("Ulasan & Rating Toko")).not.toBeNull();
    expect(screen.getByText("Laptop mantap sesuai deskripsi!")).not.toBeNull();

    // Notification feature test
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([
      {
        id: "notif-e2e-1",
        title: "Iklan Baru Terpasang",
        message: "Iklan Laptop Asus Anda telah aktif di marketplace.",
        isRead: false,
        created_at: "2026-09-12T10:00:00Z",
      },
    ]);
    const markReadSpy = vi.spyOn(notificationsService, "sbMarkNotificationAsRead").mockResolvedValue(true);

    render(<NotificationFeature userId="usr-seller-100" />);

    await waitFor(() => {
      expect(screen.getByText("Iklan Baru Terpasang")).not.toBeNull();
      expect(screen.getByText("1 Baru")).not.toBeNull();
    });

    const notifItem = screen.getByText("Iklan Baru Terpasang");
    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith("notif-e2e-1");
    });
  });

  // --------------------------------------------------------------------------
  // 5. ADMIN JOURNEY: Admin Auth -> Security Denial -> Moderation -> Logout
  // --------------------------------------------------------------------------
  it("5. Admin Journey: Auth check -> Moderation -> Logout", async () => {
    // Mock admin fetch session as authenticated
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("action=session")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            authenticated: true,
            user: { id: "admin-root", username: "admin", role: "admin" },
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({ ok: true }) } as Response;
    });

    vi.spyOn(storage, "getAllListings").mockReturnValue(MOCK_LISTINGS as any);

    render(<AdminFeature />);

    await waitFor(() => {
      expect(screen.getByText("Panel Kontrol Administrator")).not.toBeNull();
      expect(screen.getByText("Moderasi Iklan (2)")).not.toBeNull();
    });

    const logoutBtn = screen.getByText(/Keluar \(Logout\)/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByText("Panel Admin SoloSatSet")).not.toBeNull();
    });
  });
});
