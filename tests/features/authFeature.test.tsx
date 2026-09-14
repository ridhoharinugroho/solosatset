// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthModal } from "../../src/features/auth/AuthModal";
import type { UserProfile } from "../../src/domain/user/user.contract";

const MOCK_USER: UserProfile = {
  id: "usr-999",
  name: "Budi Santoso",
  storeName: "Toko Budi",
  email: "budi@example.com",
  phone: "081234567890",
  region: "solo",
  district: "Jebres",
  provinceCode: "33",
  regencyCode: "3372",
  districtCode: "337202",
  village: "Manahan",
  avatar: null,
  bio: "Penjual terpercaya",
  status: "active",
  deletedAt: null,
  isDemo: false,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: null,
};

describe("Auth + Session Feature Component & Hooks", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("1. Harus me-render LoginForm secara default", () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Masuk Akun SOPALOKA")).not.toBeNull();
    expect(screen.getByPlaceholderText("08123456789 / email@example.com")).not.toBeNull();
  });

  it("2. Harus memicu submit Login dengan kredensial", async () => {
    const onLogin = vi.fn().mockResolvedValue({ isAuthenticated: true, user: MOCK_USER });
    const onClose = vi.fn();

    render(
      <AuthModal isOpen={true} onClose={onClose} onLoginSubmit={onLogin} />
    );

    const identifierInput = screen.getByPlaceholderText("08123456789 / email@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(identifierInput, { target: { value: "budi@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByText("Masuk Akun");
    fireEvent.click(submitBtn);

    expect(onLogin).toHaveBeenCalledWith("budi@example.com", "password123");
  });

  it("3. Harus berpindah ke mode Register dan memicu pendaftaran", async () => {
    const onRegister = vi.fn().mockResolvedValue({ isAuthenticated: true, user: MOCK_USER });
    render(<AuthModal isOpen={true} onClose={vi.fn()} onRegisterSubmit={onRegister} />);

    // Switch to Register
    const switchBtn = screen.getByText("Daftar Gratis");
    fireEvent.click(switchBtn);

    expect(screen.getByText("Daftar Akun Baru")).not.toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Budi Santoso"), { target: { value: "Budi Santoso" } });
    fireEvent.change(screen.getByPlaceholderText("08123456789"), { target: { value: "081234567890" } });

    const registerBtn = screen.getByText("Daftar Akun Sekarang");
    fireEvent.click(registerBtn);

    expect(onRegister).toHaveBeenCalledWith({
      name: "Budi Santoso",
      identifier: "081234567890",
      storeName: undefined,
      password: undefined,
    });
  });

  it("4. Harus berpindah ke mode OTP saat tombol OTP diklik", () => {
    const onOtp = vi.fn().mockResolvedValue({ isAuthenticated: true, user: MOCK_USER });
    render(<AuthModal isOpen={true} onClose={vi.fn()} onOtpSubmit={onOtp} />);

    const identifierInput = screen.getByPlaceholderText("08123456789 / email@example.com");
    fireEvent.change(identifierInput, { target: { value: "081234567890" } });

    const otpBtn = screen.getByText(/Masuk via Kode OTP/i);
    fireEvent.click(otpBtn);

    expect(screen.getByText("Verifikasi Kode OTP")).not.toBeNull();
    expect(screen.getByText("081234567890")).not.toBeNull();
  });

  it("5. Harus berpindah ke mode Reset Password", async () => {
    const onReset = vi.fn().mockResolvedValue({ isAuthenticated: true });
    render(<AuthModal isOpen={true} onClose={vi.fn()} onResetPasswordSubmit={onReset} />);

    const forgotBtn = screen.getByText("Lupa Password?");
    fireEvent.click(forgotBtn);

    expect(screen.getByText("Reset Password")).not.toBeNull();

    const input = screen.getByPlaceholderText("08123456789");
    fireEvent.change(input, { target: { value: "budi@example.com" } });

    const submitBtn = screen.getByText("Kirim Petunjuk Reset");
    fireEvent.click(submitBtn);

    expect(onReset).toHaveBeenCalledWith("budi@example.com");
  });
});
