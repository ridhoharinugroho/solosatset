import { refreshIcons } from "../../utils/runtime.js";
import { getCurrentUser } from "../../services/auth.js";
import {
  sbGetNotifications,
  sbMarkNotificationAsRead,
  sbMarkAllNotificationsAsRead,
  sbSubscribeNotifications,
  sbUnsubscribeNotifications,
} from "../../services/supabaseDB.js";
import { showToast, closeModal } from "../../utils/modalRouter.js";

export let activeNotifRealtimeChannel = null;
export let isNotificationsCenterInitialized = false;
export let cachedNotifications = [];

export function cleanupNotificationsRealtime() {
  if (activeNotifRealtimeChannel) {
    try {
      if (typeof sbUnsubscribeNotifications === "function") {
        sbUnsubscribeNotifications(activeNotifRealtimeChannel);
      } else if (typeof activeNotifRealtimeChannel.unsubscribe === "function") {
        activeNotifRealtimeChannel.unsubscribe().catch(() => {});
      }
    } catch (err) {
      console.warn("[Notifications Realtime Cleanup Warning]", err);
    } finally {
      activeNotifRealtimeChannel = null;
    }
  }
}

export function updateNotificationBadgeDOM(notifs) {
  const badge = document.getElementById("notif-badge-count");
  if (!badge) return;
  const unreadCount = Array.isArray(notifs) ? notifs.filter((n) => !n.is_read).length : 0;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.classList.remove("hidden");
    badge.classList.add("animate-bounce");
    setTimeout(() => badge.classList.remove("animate-bounce"), 2000);
  } else {
    badge.classList.add("hidden");
    badge.textContent = "0";
  }
}

export function renderNotificationsDOM(notifs) {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;
  if (!Array.isArray(notifs) || notifs.length === 0) {
    container.innerHTML = `
      <div id="notifications-empty-state" class="py-12 px-4 text-center space-y-3">
        <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-inner">
          <i data-lucide="bell-off" class="w-8 h-8"></i>
        </div>
        <div class="space-y-1">
          <h4 class="font-black text-slate-800 text-sm">Belum Ada Notifikasi</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto">Notifikasi barang Butuh Uang (BU) sesuai minat kategori Anda akan muncul secara instan di sini.</p>
        </div>
      </div>
    `;
    if (typeof refreshIcons === "function") refreshIcons();
    return;
  }
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  notifs.forEach((notif) => {
    const isUnread = !notif.is_read;
    const isBu = notif.type === "bu_interest" || (notif.title && notif.title.includes("BUTUH UANG"));

    let timeText = "Baru saja";
    if (notif.created_at) {
      try {
        const d = new Date(notif.created_at);
        const now = new Date();
        const diffSec = Math.floor((now - d) / 1000);
        if (diffSec >= 60) {
          const diffMin = Math.floor(diffSec / 60);
          if (diffMin < 60) timeText = `${diffMin} mnt lalu`;
          else {
            const diffHour = Math.floor(diffMin / 60);
            if (diffHour < 24) timeText = `${diffHour} jam lalu`;
            else {
              const diffDays = Math.floor(diffHour / 24);
              if (diffDays === 1) timeText = "Kemarin";
              else if (diffDays < 7) timeText = `${diffDays} hari lalu`;
              else
                timeText = d.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
            }
          }
        }
      } catch (e) {
        timeText = "Baru saja";
      }
    }

    const imgSrc = notif.image || "/assets/img/app-logo.png?v=2.1";
    const catText = notif.category_id ? String(notif.category_id).toUpperCase() : "BU";
    const card = document.createElement("div");
    card.className =
      "notif-item relative flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer group " +
      (isUnread
        ? "bg-rose-50/90 border-rose-200 hover:bg-rose-100/80 shadow-xs"
        : "bg-white border-slate-200/80 hover:bg-slate-50 opacity-90");
    card.dataset.notifId = notif.id || "";
    card.dataset.productId = notif.product_id || notif.listing_id || "";
    card.innerHTML = `
        <div class="relative w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200 shadow-2xs">
          <img src="${imgSrc}" alt="${notif.title || "Notifikasi"}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='/assets/img/app-logo.png?v=2.1'">
          ${isBu ? '<span class="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] font-black text-center py-0.2 uppercase">🔥 BU</span>' : ""}
        </div>
        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span class="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isBu ? "bg-rose-800 text-rose-100" : "bg-slate-800 text-slate-100"}">
              ${catText}
            </span>
            <span class="text-[10px] text-slate-400 font-medium">${timeText}</span>
          </div>
          <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-rose-900 transition-colors ${isUnread ? "font-black" : "font-semibold text-slate-700"}">
            ${notif.title || "Pemberitahuan Barang"}
          </h4>
          <p class="text-[11.5px] sm:text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
            ${notif.message || notif.body || ""}
          </p>
        </div>
        ${isUnread ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0 mt-1 shadow-xs animate-pulse"></span>' : ""}
    `;
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
  if (typeof refreshIcons === "function") refreshIcons();

  container.querySelectorAll(".notif-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const notifId = item.getAttribute("data-notif-id");
      const productId = item.getAttribute("data-product-id");
      if (notifId && typeof sbMarkNotificationAsRead === "function") {
        sbMarkNotificationAsRead(notifId);
      }
      const targetObj = cachedNotifications.find((n) => String(n.id) === String(notifId));
      if (targetObj) targetObj.is_read = true;
      updateNotificationBadgeDOM(cachedNotifications);
      item.classList.remove("bg-rose-50/90", "border-rose-200");
      item.classList.add("bg-white", "border-slate-200/80", "opacity-90");
      closeModal("modal-notifications");
      if (productId) {
        setTimeout(() => {
          if (typeof window.openProductDetail === "function") {
            window.openProductDetail(productId);
          }
        }, 200);
      }
    });
  });
}

function getActiveSessionUserId() {
  const u = getCurrentUser();
  return u ? u.id || u.email : null;
}

export async function syncUserNotifications(silent = false) {
  let currentUserId = getActiveSessionUserId();
  try {
    const notifs = await sbGetNotifications(currentUserId);
    cachedNotifications = notifs || [];
    updateNotificationBadgeDOM(cachedNotifications);
    const modal = document.getElementById("modal-notifications");
    if (modal && !modal.classList.contains("hidden") && "none" !== window.getComputedStyle(modal).display) {
      renderNotificationsDOM(cachedNotifications);
    }
  } catch (e) {
    if (!silent) console.warn("[syncUserNotifications Note]", e.message);
  }
}

export function initNotificationsCenter() {
  const currentUserId = getActiveSessionUserId();
  syncUserNotifications(true);
  cleanupNotificationsRealtime();

  const btnMarkAll = document.getElementById("btn-mark-all-notifs-read");
  if (btnMarkAll && !btnMarkAll.dataset.notifMarkAllReady) {
    btnMarkAll.dataset.notifMarkAllReady = "true";
    btnMarkAll.addEventListener("click", async () => {
      const uid = getActiveSessionUserId();
      if (uid && typeof sbMarkAllNotificationsAsRead === "function") {
        await sbMarkAllNotificationsAsRead(uid);
      }
      cachedNotifications.forEach((n) => {
        n.is_read = true;
      });
      updateNotificationBadgeDOM(cachedNotifications);
      renderNotificationsDOM(cachedNotifications);
      showToast("Semua notifikasi berhasil ditandai sudah dibaca.", "success");
    });
  }

  if (typeof sbSubscribeNotifications === "function") {
    try {
      activeNotifRealtimeChannel = sbSubscribeNotifications(currentUserId, (newNotif) => {
        if (newNotif && !cachedNotifications.some((n) => n.id === newNotif.id)) {
          cachedNotifications.unshift(newNotif);
          updateNotificationBadgeDOM(cachedNotifications);

          showToast(`🔔 ${newNotif.title || "Notifikasi Baru Masuk!"}`, "info");

          const modal = document.getElementById("modal-notifications");
          if (modal && !modal.classList.contains("hidden") && "none" !== window.getComputedStyle(modal).display) {
            renderNotificationsDOM(cachedNotifications);
          }
        }
      });
    } catch (e) {
      console.warn("[initNotificationsCenter Realtime Note]", e);
    }
  }

  if (!isNotificationsCenterInitialized) {
    isNotificationsCenterInitialized = true;
    setInterval(() => {
      syncUserNotifications(true);
    }, 25000);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        syncUserNotifications(true);
      });
      window.addEventListener("buNotificationTriggered", () => {
        setTimeout(() => syncUserNotifications(true), 1000);
      });
      window.addEventListener("authStateChanged", (e) => {
        const u = e && e.detail ? e.detail : getCurrentUser();
        if (u) {
          setTimeout(() => {
            syncUserNotifications(true);
            initNotificationsCenter();
          }, 500);
        } else {
          cleanupNotificationsRealtime();
          cachedNotifications = [];
          updateNotificationBadgeDOM([]);
        }
      });
    }
  }
}

if (typeof window !== "undefined") {
  window.cleanupNotificationsRealtime = cleanupNotificationsRealtime;
  window.renderNotificationsDOM = renderNotificationsDOM;
  window.updateNotificationBadgeDOM = updateNotificationBadgeDOM;
  window.syncUserNotifications = syncUserNotifications;
  window.initNotificationsCenter = initNotificationsCenter;
}
