// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileFeature } from "../../src/features/profile/ProfileFeature";
import type { UserProfile } from "../../src/domain/user/user.contract";

const MOCK_PROFILE: UserProfile = {
  id: "usr-777",
  name: "Siti Rahmawati",
  storeName: "Toko Hijab Solo",
  email: "siti@example.com",
  phone: "081299998888",
  region: "solo",
  district: "Banjarsari",
  provinceCode: "33",
  regencyCode: "3372",
  districtCode: "337201",
  village: "Manahan",
  avatar: null,
  bio: "Menjual pakaian muslimah & aksesoris",
  status: "active",
  deletedAt: null,
  isDemo: false,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: null,
};

describe("Profile Feature Components & Hooks", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("1. Harus me-render informasi profil pengguna", () => {
    render(<ProfileFeature initialProfile={MOCK_PROFILE} />);

    expect(screen.getByText("Siti Rahmawati")).not.toBeNull();
    expect(screen.getByText("🏪 Toko Hijab Solo")).not.toBeNull();
    expect(screen.getByText("081299998888")).not.toBeNull();
    expect(screen.getByText("siti@example.com")).not.toBeNull();
    expect(screen.getByText("Menjual pakaian muslimah & aksesoris")).not.toBeNull();
  });

  it("2. Harus merespons pesan warning saat profil null (belum login)", () => {
    render(<ProfileFeature initialProfile={null} />);

    expect(screen.getByText(/Silakan masuk akun terlebih dahulu/i)).not.toBeNull();
  });

  it("3. Harus membuka form edit profil dan menyimpan perubahan", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <ProfileFeature
        initialProfile={MOCK_PROFILE}
        onUpdateProfileSubmit={onSave}
      />
    );

    const editBtn = screen.getByText(/Edit Profil/i);
    fireEvent.click(editBtn);

    expect(screen.getByText("Edit Profil Pengguna")).not.toBeNull();

    const nameInput = screen.getByDisplayValue("Siti Rahmawati");
    fireEvent.change(nameInput, { target: { value: "Siti Rahmawati Update" } });

    const saveBtn = screen.getByText("Simpan Perubahan");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Siti Rahmawati Update",
        })
      );
    });
  });
});
