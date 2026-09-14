// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ListingManagementFeature } from "../../src/features/listing-management/ListingManagementFeature";
import { ListingForm } from "../../src/features/listing-management/components/ListingForm";
import { ImageUploader } from "../../src/features/upload/components/ImageUploader";
import type { UserProfile } from "../../src/domain/user/user.contract";
import type { SupabaseListingRowDTO } from "../../src/domain/listing/listing.dto";
import { mapListingDtoToDomain } from "../../src/domain/listing/listing.mapper";

const CURRENT_SELLER: UserProfile = {
  id: "usr-seller-1",
  name: "Danang Wijaya",
  storeName: "Danang Cell Solo",
  email: "danang@example.com",
  phone: "081234567890",
  region: "solo",
  district: "Jebres",
  provinceCode: "33",
  regencyCode: "3372",
  districtCode: "337202",
  village: "Manahan",
  avatar: null,
  bio: "Toko HP & Aksesoris Murah Solo",
  status: "active",
  deletedAt: null,
  isDemo: false,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: null,
};

const MOCK_ALL_LISTINGS: SupabaseListingRowDTO[] = [
  {
    id: "lst-301",
    title: "HP Samsung Galaxy A54",
    price: 3800000,
    category: "Elektronik",
    condition: "like_new",
    seller_id: "usr-seller-1",
    seller_name: "Danang Wijaya",
    province_code: "33",
    regency_code: "3372",
    district_code: "337202",
    status: "active",
  },
  {
    id: "lst-302",
    title: "Vespa Matic LX 150",
    price: 28000000,
    category: "Kendaraan",
    condition: "good",
    seller_id: "usr-seller-1",
    seller_name: "Danang Wijaya",
    province_code: "33",
    regency_code: "3372",
    status: "sold",
  },
  {
    id: "lst-303",
    title: "Laptop Lenovo ThinkPad",
    price: 5500000,
    category: "Elektronik",
    condition: "good",
    seller_id: "usr-other-user", // OWNED BY ANOTHER USER
    seller_name: "Toko Komputer Lain",
    province_code: "33",
    regency_code: "3311",
    status: "active",
  },
];

describe("Seller / Listing Management Feature", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("1. Harus menampilkan HANYA listing milik seller aktif", () => {
    render(
      <ListingManagementFeature
        currentUser={CURRENT_SELLER}
        allListings={MOCK_ALL_LISTINGS}
      />
    );

    expect(screen.getByText("HP Samsung Galaxy A54")).not.toBeNull();
    expect(screen.getByText("Vespa Matic LX 150")).not.toBeNull();
    // Listing milik user lain TIDAK boleh muncul
    expect(screen.queryByText("Laptop Lenovo ThinkPad")).toBeNull();
  });

  it("2. Harus memicu pembukaan form tambah iklan baru", () => {
    render(
      <ListingManagementFeature
        currentUser={CURRENT_SELLER}
        allListings={MOCK_ALL_LISTINGS}
      />
    );

    const addBtn = screen.getByText("+ Pasang Iklan Baru");
    fireEvent.click(addBtn);

    expect(screen.getByText("Pasang Iklan Barang Baru")).not.toBeNull();
  });

  it("3. Harus berhasil membuat listing baru (Create)", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <ListingManagementFeature
        currentUser={CURRENT_SELLER}
        allListings={MOCK_ALL_LISTINGS}
        onSaveListingSubmit={onSave}
      />
    );

    fireEvent.click(screen.getByText("+ Pasang Iklan Baru"));

    fireEvent.change(screen.getByPlaceholderText(/Contoh: iPhone/i), {
      target: { value: "Kamera Canon EOS 60D" },
    });
    fireEvent.change(screen.getByPlaceholderText("500000"), {
      target: { value: "4500000" },
    });

    const submitBtn = screen.getByText("Pasang Iklan");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Kamera Canon EOS 60D",
          price: 4500000,
          seller: expect.objectContaining({
            id: "usr-seller-1",
          }),
        })
      );
    });
  });

  it("4. Harus berhasil mengubah status listing (Mark as Sold)", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <ListingManagementFeature
        currentUser={CURRENT_SELLER}
        allListings={MOCK_ALL_LISTINGS}
        onSaveListingSubmit={onSave}
      />
    );

    const soldBtns = screen.getAllByText("✓ Laku / Sold");
    fireEvent.click(soldBtns[0]);

    expect(onSave).toHaveBeenCalledWith({
      id: "lst-301",
      status: "sold",
    });
  });

  it("5. Harus menguji komponen ImageUploader (tambah & hapus foto)", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();

    render(
      <ImageUploader
        images={["https://img1.jpg", "https://img2.jpg"]}
        onAddImages={onAdd}
        onRemoveImage={onRemove}
      />
    );

    expect(screen.getByAltText("Foto produk 1")).not.toBeNull();

    const deleteBtn = screen.getAllByTitle("Hapus foto")[0];
    fireEvent.click(deleteBtn);

    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
