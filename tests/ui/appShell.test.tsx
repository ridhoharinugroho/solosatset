// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../../src/components/ui/Button";
import { Container } from "../../src/components/ui/Container";
import { NavBrand } from "../../src/components/navigation/NavBrand";
import { NavActions } from "../../src/components/navigation/NavActions";
import { HeaderNav } from "../../src/components/navigation/HeaderNav";
import { AppShell } from "../../src/components/layout/AppShell";

describe("Shared UI / App Shell Components", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("harus me-render Button dengan varian & size yang benar", () => {
    render(
      <Button variant="outline" size="sm">
        Klik Saya
      </Button>
    );

    const btn = screen.getByText("Klik Saya");
    expect(btn).not.toBeNull();
    expect(btn.className).toContain("border-gray-300");
    expect(btn.className).toContain("px-3");
  });

  it("harus me-render Container dengan pembatas kelas max-w-7xl", () => {
    render(
      <Container className="my-custom-container">
        <div>Content Inside Container</div>
      </Container>
    );

    const containerEl = document.querySelector(".max-w-7xl");
    expect(containerEl).not.toBeNull();
    expect(containerEl?.className).toContain("my-custom-container");
  });

  it("harus me-render NavBrand dengan judul & subtitle default", () => {
    render(<NavBrand />);

    expect(screen.getByText("SOPALOKA")).not.toBeNull();
    expect(screen.getByText("Pantau Cocok Bayar • Nego Langsung WA")).not.toBeNull();
  });

  it("harus me-render NavActions dengan tombol aksi notifikasi, favorit, dan pasang iklan", () => {
    render(
      <NavActions
        notificationCount={3}
      />
    );

    expect(screen.getByTitle("Pusat Notifikasi")).not.toBeNull();
    expect(screen.getByTitle("Daftar Barang Favorit")).not.toBeNull();
    expect(screen.getByText("Pasang Iklan")).not.toBeNull();
    expect(screen.getByText("3")).not.toBeNull();
  });

  it("harus me-render AppShell lengkap dengan header, main content, dan footer slot", () => {
    render(
      <AppShell
        headerSlot={<HeaderNav />}
        footerSlot={<div data-testid="footer-content">Footer SOPALOKA</div>}
      >
        <div data-testid="main-content">Konten Utama SOPALOKA</div>
      </AppShell>
    );

    expect(screen.getByText("SOPALOKA")).not.toBeNull();
    expect(screen.getByTestId("main-content")).not.toBeNull();
    expect(screen.getByTestId("footer-content")).not.toBeNull();
  });
});

