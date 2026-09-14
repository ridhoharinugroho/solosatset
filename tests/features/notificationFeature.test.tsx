// @vitest-environment jsdom
import React from "react";
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationFeature } from "../../src/features/notification/NotificationFeature";
import * as notificationsService from "../../src/services/notificationService";
import * as pushService from "../../src/services/pushNotificationService";

describe("Notification Feature Component & Hook", () => {
  const mockUserId = "usr-test-123";

  beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    (window as unknown as Record<string, unknown>).__currentUser = { id: mockUserId, name: "Test User" };
  });

  it("1. Harus menampilkan state kosong ketika tidak ada notifikasi", async () => {
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([]);

    render(<NotificationFeature userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("Belum Ada Notifikasi")).not.toBeNull();
    });
  });

  it("2. Harus me-render daftar notifikasi dan jumlah unread badge", async () => {
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([
      {
        id: "notif-1",
        title: "Iklan Disetujui",
        message: "Iklan HP Samsung Anda telah aktif.",
        type: "system",
        isRead: false,
        created_at: "2026-09-12T10:00:00Z",
      },
      {
        id: "notif-2",
        title: "Pesan Baru",
        message: "Budi mengirim pesan pada barang Anda.",
        type: "info",
        isRead: true,
        created_at: "2026-09-11T10:00:00Z",
      },
    ]);

    render(<NotificationFeature userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("Iklan Disetujui")).not.toBeNull();
      expect(screen.getByText("Pesan Baru")).not.toBeNull();
      expect(screen.getByText("1 Baru")).not.toBeNull();
    });
  });

  it("3. Harus dapat menandai satu notifikasi sebagai dibaca saat diklik", async () => {
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([
      {
        id: "notif-100",
        title: "Diskon Khusus SoloSatSet",
        message: "Cek penawaran barang BU hari ini.",
        type: "bu",
        isRead: false,
        created_at: "2026-09-12T10:00:00Z",
      },
    ]);
    const markReadSpy = vi.spyOn(notificationsService, "sbMarkNotificationAsRead").mockResolvedValue(true);

    render(<NotificationFeature userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("1 Baru")).not.toBeNull();
    });

    const notifItem = screen.getByText("Diskon Khusus SoloSatSet");
    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith("notif-100");
      expect(screen.queryByText("1 Baru")).toBeNull();
    });
  });

  it("4. Harus dapat menandai seluruh notifikasi sebagai dibaca", async () => {
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([
      {
        id: "notif-201",
        title: "Notif 1",
        message: "Pesan 1",
        isRead: false,
        created_at: "2026-09-12T10:00:00Z",
      },
      {
        id: "notif-202",
        title: "Notif 2",
        message: "Pesan 2",
        isRead: false,
        created_at: "2026-09-12T11:00:00Z",
      },
    ]);
    const markAllReadSpy = vi.spyOn(notificationsService, "sbMarkAllNotificationsAsRead").mockResolvedValue(true);

    render(<NotificationFeature userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("2 Baru")).not.toBeNull();
    });

    const markAllBtn = screen.getByText("Tandai Semua Dibaca");
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(markAllReadSpy).toHaveBeenCalled();
      expect(screen.queryByText("2 Baru")).toBeNull();
    });
  });

  it("5. Harus mendukung pengaktifan notifikasi push", async () => {
    vi.spyOn(notificationsService, "sbGetNotifications").mockResolvedValue([]);
    vi.spyOn(pushService, "isPushNotificationSupported").mockReturnValue(true);
    vi.spyOn(pushService, "getNotificationPermissionStatus").mockReturnValue("default");
    const subscribePushSpy = vi.spyOn(pushService, "subscribeUserToPush").mockResolvedValue({
      endpoint: "https://push.example.com",
    } as unknown as PushSubscription);

    render(<NotificationFeature userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("🔕 Aktifkan Push")).not.toBeNull();
    });

    const pushBtn = screen.getByText("🔕 Aktifkan Push");
    fireEvent.click(pushBtn);

    await waitFor(() => {
      expect(subscribePushSpy).toHaveBeenCalled();
      expect(screen.getByText("🔔 Push Aktif")).not.toBeNull();
    });
  });
});
