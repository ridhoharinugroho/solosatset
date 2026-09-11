/**
 * Pusat Jual Beli Solo Raya - Admin Panel Controller
 * Admin authentication is server-authoritative via /api/admin-auth.
 */

  // eslint-disable-next-line no-unused-vars
import { SOLO_RAYA_REGIONS, getRegionById } from "./data/regions.js";
import { CATEGORIES, CONDITIONS } from "./data/categories.js";
import { formatRupiah, formatDisplayPhone } from "./services/whatsapp.js";
import {
  getAllListings,
  deleteListing,
  toggleHideListing,
  toggleSoldStatus,
  initializeStorage,
} from "./services/storage.js";
   
   
  // eslint-disable-next-line no-unused-vars
import { getSmtpConfig, saveSmtpConfig, sendTestEmail } from "./services/emailService.js";
import "./adminAuthBridge.js";
   
  // eslint-disable-next-line no-unused-vars
import { initAdminDashboardControls, formatAdminDate } from "./modules/admin/adminDashboard.js";
import { initAdminSmtpControls, loadSmtpForm } from "./modules/admin/adminSmtpUI.js";

const ADMIN_AUTH_KEY = "pusat_barkas_admin_auth";
const CURRENT_SW_VERSION = "20260902_v214";

// Admin State
const adminState = {
  searchQuery: "",
  selectedRegion: "all",
  selectedStatus: "all",
};

document.addEventListener("DOMContentLoaded", async () => {
  initializeStorage();
  await checkAuth();
  initAdminEventListeners();
  initBackHandler();
  initServiceWorker();

  window.addEventListener("dbStatusChanged", (e) => {
    const status = e.detail;
    const badgeText = document.getElementById("db-status-text");
    if (badgeText) {
      if (status.syncStatus === "connected") {
        badgeText.textContent = "Database Online: Terhubung (Sync Aktif)";
      } else if (status.syncStatus === "offline") {
        badgeText.textContent = "Database Offline: Cache Lokal";
      }
    }
  });

  window.addEventListener("listingsChanged", () => {
    updateStats();
    renderAdminListings();
  });
});

// -------------------------------------------------------------
// AUTHENTICATION MANAGEMENT
// -------------------------------------------------------------
async function checkAuth() {
  const auth = window.__solosatsetAdminAuth;
  const session = await auth?.getSession?.();
  const isAuth = Boolean(session?.authenticated);
  const loginView = document.getElementById("admin-login-view");
  const dashboardView = document.getElementById("admin-dashboard-view");

  if (isAuth) {
    sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
    loginView?.classList.add("hidden");
    dashboardView?.classList.remove("hidden");
    loadDashboard();
  } else {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    loginView?.classList.remove("hidden");
    dashboardView?.classList.add("hidden");
  }

  if (window.lucide) window.lucide.createIcons();
  return isAuth;
}

async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById("admin-username")?.value.trim() || "";
  const passwordInput = document.getElementById("admin-password")?.value || "";
  const errorAlert = document.getElementById("login-error-alert");
  const errorMsg = document.getElementById("login-error-msg");

  try {
    await window.__solosatsetAdminAuth.login(usernameInput, passwordInput);
    errorAlert?.classList.add("hidden");
    showToast("Login Admin Berhasil. Selamat datang di Panel Admin.", "success");
    await checkAuth();
  } catch (error) {
    errorAlert?.classList.remove("hidden");
    if (errorMsg) errorMsg.textContent = error.message || "Username atau Password salah.";
    if (window.lucide) window.lucide.createIcons();
  }
}

async function handleLogout() {
  try {
    await window.__solosatsetAdminAuth.logout();
  } catch {}

  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  try {
    sessionStorage.clear();
  } catch {}
  showToast("Anda telah keluar dari Panel Admin.", "info");
  await checkAuth();
  setTimeout(() => {
    window.location.href = "admin.html";
  }, 300);
}

// -------------------------------------------------------------
// DASHBOARD INITIALIZATION
// -------------------------------------------------------------
function loadDashboard() {
  updateStats();
  renderAdminListings();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "studio") {
    const studioBtn = document.getElementById("admin-tab-btn-studio");
    if (studioBtn) studioBtn.click();
  }
}

function updateStats() {
  const listings = getAllListings();
  const total = listings.length;
  const active = listings.filter((l) => !l.isHidden && !l.isSold).length;
  const hidden = listings.filter((l) => l.isHidden).length;
  const sold = listings.filter((l) => l.isSold).length;

  document.getElementById("stat-total-listings").textContent = total;
  document.getElementById("stat-active-listings").textContent = active;
  document.getElementById("stat-hidden-listings").textContent = hidden;
  document.getElementById("stat-sold-listings").textContent = sold;
}

// -------------------------------------------------------------
// TAB 1: LISTINGS MODERATION & MANAGEMENT
// -------------------------------------------------------------
function renderAdminListings() {
  const tbody = document.getElementById("admin-listings-table-body");
  const emptyView = document.getElementById("admin-table-empty");
  const countBadge = document.getElementById("admin-table-count");
  if (!tbody) return;

  let listings = getAllListings();

  if (adminState.searchQuery) {
    const q = adminState.searchQuery.toLowerCase();
    listings = listings.filter((l) => {
      const titleMatch = l.title.toLowerCase().includes(q);
      const sellerMatch =
        l.seller &&
        (l.seller.storeName || l.seller.name) &&
        (l.seller.storeName || l.seller.name).toLowerCase().includes(q);
      const descMatch = l.description && l.description.toLowerCase().includes(q);
      return titleMatch || sellerMatch || descMatch;
    });
  }

  if (adminState.selectedRegion !== "all") {
    listings = listings.filter((l) => l.regionId === adminState.selectedRegion);
  }

  if (adminState.selectedStatus === "active") {
    listings = listings.filter((l) => !l.isHidden && !l.isSold);
  } else if (adminState.selectedStatus === "hidden") {
    listings = listings.filter((l) => l.isHidden);
  } else if (adminState.selectedStatus === "sold") {
    listings = listings.filter((l) => l.isSold);
  }

  if (countBadge) countBadge.textContent = listings.length;

  if (listings.length === 0) {
    tbody.innerHTML = "";
    emptyView.classList.remove("hidden");
    return;
  }

  emptyView.classList.add("hidden");
  let rowsHtml = "";
  listings.forEach((item) => {
    const region = getRegionById(item.regionId);
    const regionName = region ? region.name : item.regionId;
    const cat = CATEGORIES.find((c) => c.id === item.category);
    const cond = CONDITIONS.find((c) => c.id === item.condition);
    const sellerName = item.seller?.storeName || item.seller?.name || "Penjual";
    const sellerPhone = item.seller?.phone ? formatDisplayPhone(item.seller.phone) : "-";

    let statusBadge = "";
    if (item.isHidden) {
      statusBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-700 flex items-center gap-1 w-fit"><i data-lucide="eye-off" class="w-3 h-3"></i> Disembunyikan</span>`;
    } else if (item.isSold) {
      statusBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700 flex items-center gap-1 w-fit"><i data-lucide="tag" class="w-3 h-3"></i> Terjual (Sold)</span>`;
    } else {
      statusBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700 flex items-center gap-1 w-fit"><i data-lucide="check" class="w-3 h-3"></i> Tayang (Aktif)</span>`;
    }

    rowsHtml += `
      <tr class="hover:bg-slate-700/40 transition-colors ${item.isHidden ? "opacity-70 bg-purple-950/20" : ""}">
        <td class="p-3.5">
          <div class="flex items-center gap-3">
            <img src="${Array.isArray(item.images) && item.images[0] ? item.images[0] : "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0 bg-slate-900">
            <div class="min-w-0 max-w-[220px]">
              <div class="font-bold text-white truncate text-xs" title="${item.title}">${item.title}</div>
              <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <span class="text-amber-400 font-semibold">${cond ? cond.label.split("(")[0] : "Normal"}</span>
                <span>•</span>
                <span class="truncate">${item.codPoint || "-"}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="p-3.5">
          <div class="font-extrabold text-rose-400 text-xs">${formatRupiah(item.price)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${cat ? cat.name : item.category}</div>
        </td>
        <td class="p-3.5">
          <div class="font-semibold text-slate-200 flex items-center gap-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-500"></i>
            <span>${regionName}</span>
          </div>
          <div class="text-[11px] text-slate-400">Kec. ${item.district || "-"}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-200 flex items-center gap-1">
            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
            <span class="truncate max-w-[140px]">${sellerName}</span>
          </div>
          <div class="text-[11px] text-emerald-400 font-mono mt-0.5">${sellerPhone}</div>
        </td>
        <td class="p-3.5">${statusBadge}</td>
        <td class="p-3.5 text-right">
          <div class="flex items-center justify-end gap-1.5 flex-wrap">
            <button data-action="toggle-hide" data-id="${item.id}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${item.isHidden ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}" title="${item.isHidden ? "Tampilkan kembali iklan ke publik" : "Sembunyikan iklan dari marketplace publik"}">
              <i data-lucide="${item.isHidden ? "eye" : "eye-off"}" class="w-3.5 h-3.5"></i>
              <span>${item.isHidden ? "Tampilkan" : "Sembunyikan"}</span>
            </button>
            <button data-action="toggle-sold" data-id="${item.id}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${item.isSold ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-amber-600/80 hover:bg-amber-600 text-white"}" title="Ubah status terjual">
              <i data-lucide="${item.isSold ? "check" : "tag"}" class="w-3.5 h-3.5"></i>
              <span>${item.isSold ? "Aktifkan" : "Terjual"}</span>
            </button>
            <button data-action="delete" data-id="${item.id}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors flex items-center gap-1" title="Hapus iklan secara permanen">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Hapus</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;
  tbody.querySelectorAll('[data-action="toggle-hide"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const updated = toggleHideListing(id);
      updateStats();
      renderAdminListings();
      showToast(
        updated.isHidden
          ? "Iklan berhasil disembunyikan dari pengunjung publik!"
          : "Iklan kembali ditampilkan ke marketplace publik!",
        updated.isHidden ? "warning" : "success",
      );
    });
  });
  tbody.querySelectorAll('[data-action="toggle-sold"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const updated = toggleSoldStatus(id);
      updateStats();
      renderAdminListings();
      showToast(updated.isSold ? "Iklan ditandai Terjual!" : "Iklan kembali Tersedia!", "info");
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (
        confirm("Apakah Anda yakin ingin MENGHAPUS PERMANEN iklan barang ini? Tindakan ini tidak dapat dibatalkan.")
      ) {
        deleteListing(id);
        updateStats();
        renderAdminListings();
        showToast("Iklan berhasil dihapus secara permanen.", "info");
      }
    });
  });
  if (window.lucide) window.lucide.createIcons();
}

// -------------------------------------------------------------
// EVENT LISTENERS INITIALIZATION
// -------------------------------------------------------------
function initAdminEventListeners() {
  document.getElementById("form-admin-login")?.addEventListener("submit", handleLogin);
  document.getElementById("btn-admin-logout")?.addEventListener("click", handleLogout);

  const tabListingsBtn = document.getElementById("admin-tab-btn-listings");
  const tabStudioBtn = document.getElementById("admin-tab-btn-studio");
  const tabEmailBtn = document.getElementById("admin-tab-btn-email");
  const contentListings = document.getElementById("tab-content-listings");
  const contentStudio = document.getElementById("tab-content-studio");
  const contentEmail = document.getElementById("tab-content-email");

  function setAdminTab(tab) {
    adminState.currentTab = tab;
    tabListingsBtn.className =
      "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex-shrink-0 cursor-pointer";
    tabStudioBtn.className =
      "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex-shrink-0 cursor-pointer";
    if (tabEmailBtn)
      tabEmailBtn.className =
        "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex-shrink-0 cursor-pointer";
    contentListings?.classList.add("hidden");
    contentStudio?.classList.add("hidden");
    contentEmail?.classList.add("hidden");

    if (tab === "listings") {
      tabListingsBtn.className =
        "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-rose-900 text-white shadow-sm flex-shrink-0";
      contentListings?.classList.remove("hidden");
      renderAdminListings();
    } else if (tab === "studio") {
      tabStudioBtn.className =
        "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-rose-900 text-white shadow-sm flex-shrink-0";
      contentStudio?.classList.remove("hidden");
    } else if (tab === "email") {
      if (tabEmailBtn)
        tabEmailBtn.className =
          "admin-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-emerald-800 text-white shadow-sm flex-shrink-0";
      contentEmail?.classList.remove("hidden");
      loadSmtpForm();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  tabListingsBtn?.addEventListener("click", () => setAdminTab("listings"));
  tabStudioBtn?.addEventListener("click", () => setAdminTab("studio"));
  tabEmailBtn?.addEventListener("click", () => setAdminTab("email"));

  initAdminSmtpControls(showToast);
  document.getElementById("btn-reload-studio")?.addEventListener("click", () => {
    const mobileIframe = document.getElementById("mobile-editor-frame");
    const desktopIframe = document.getElementById("desktop-preview-frame");
    if (mobileIframe) mobileIframe.src = mobileIframe.src;
    if (desktopIframe) desktopIframe.src = desktopIframe.src;
    showToast("Memuat ulang simulasi HP & Pratinjau Desktop...", "info");
  });
  window.addEventListener("message", (e) => {
    const mobileFrame = document.getElementById("mobile-editor-frame");
    const desktopFrame = document.getElementById("desktop-preview-frame");

    if (
      !mobileFrame ||
      !desktopFrame ||
      e.source !== mobileFrame.contentWindow ||
      e.origin !== window.location.origin
    ) {
      return;
    }

    if (e.data && (e.data.type === "LIVE_STUDIO_SYNC" || e.data.type === "LIVE_STUDIO_SAVED")) {
      desktopFrame.contentWindow.postMessage(e.data, window.location.origin);
    }
  });
  document.getElementById("admin-search-input")?.addEventListener("input", (e) => {
    adminState.searchQuery = e.target.value;
    renderAdminListings();
  });
  document.getElementById("admin-region-filter")?.addEventListener("change", (e) => {
    adminState.selectedRegion = e.target.value;
    renderAdminListings();
  });
  document.getElementById("admin-status-filter")?.addEventListener("change", (e) => {
    adminState.selectedStatus = e.target.value;
    renderAdminListings();
  });
}

// -------------------------------------------------------------
// TOAST HELPER
// -------------------------------------------------------------
let lastToastKey = "";
let lastToastTime = 0;

function showToast(message, type = "info", duration = 4500) {
  const now = Date.now();
  const key = `${type}:${message}`;
  if (key === lastToastKey && now - lastToastTime < 800) return;
  lastToastKey = key;
  lastToastTime = now;

  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className =
      "fixed top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-md w-[92%] sm:w-auto sm:min-w-[360px] pointer-events-none";
    document.body.appendChild(container);
  }
  container.className =
    "fixed top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-md w-[92%] sm:w-auto sm:min-w-[360px] pointer-events-none";
  const toast = document.createElement("div");
  let iconName = "info";
  let bgGradient = "from-slate-900 via-slate-800 to-slate-950 border-slate-600 shadow-2xl";
  let badgeText = "Informasi";
  let badgeColor = "bg-slate-700 text-slate-200";
  let iconColor = "text-amber-300";
  let ringClass = "ring-2 ring-white/10";
  if (type === "error") {
    iconName = "alert-octagon";
    bgGradient = "from-rose-950 via-rose-900 to-rose-950 border-rose-400 shadow-2xl shadow-rose-950/80";
    badgeText = "Pemberitahuan Gagal / Kendala";
    badgeColor = "bg-rose-800 text-rose-100 border border-rose-600";
    iconColor = "text-rose-200";
    ringClass = "ring-4 ring-rose-500/30 animate-pulse";
  } else if (type === "success") {
    iconName = "check-circle-2";
    bgGradient = "from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-400 shadow-2xl shadow-emerald-950/80";
    badgeText = "Berhasil";
    badgeColor = "bg-emerald-800 text-emerald-100 border border-emerald-600";
    iconColor = "text-emerald-300";
    ringClass = "ring-4 ring-emerald-500/20";
  } else if (type === "warning") {
    iconName = "alert-triangle";
    bgGradient = "from-amber-950 via-amber-900 to-amber-950 border-amber-400 shadow-2xl shadow-amber-950/80";
    badgeText = "Peringatan";
    badgeColor = "bg-amber-800 text-amber-100 border border-amber-600";
    iconColor = "text-amber-300";
    ringClass = "ring-4 ring-amber-500/20";
  }
  toast.className = `toast-item pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r ${bgGradient} border-2 ${ringClass} text-white transition-all duration-300 transform -translate-y-4 opacity-0 max-w-md w-full backdrop-blur-md`;
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 ${iconColor} mt-0.5"><i data-lucide="${iconName}" class="w-5 h-5"></i></div>
    <div class="flex-1 min-w-0 pr-1"><div class="flex items-center gap-1.5 mb-0.5"><span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}">${badgeText}</span></div><div class="text-xs sm:text-sm font-bold text-white leading-snug break-words">${message}</div></div>
    <button type="button" class="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer" title="Tutup Notifikasi"><i data-lucide="x" class="w-4 h-4"></i></button>
  `;
  const closeBtn = toast.querySelector("button");
  if (closeBtn)
    closeBtn.onclick = () => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-4", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    };
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();
  requestAnimationFrame(() => {
    toast.classList.remove("-translate-y-4", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
  });
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-4", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    }
  }, duration);
}

function initBackHandler() {
  try {
    if (!window.history.state || !window.history.state.pageBase) window.history.replaceState({ pageBase: "admin" }, "");
  } catch {}
  window.addEventListener("popstate", () => {
    const openModals = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]')).filter(
      (m) => window.getComputedStyle(m).display !== "none",
    );
    if (openModals.length > 0) {
      openModals.forEach((m) => {
        m.classList.add("hidden");
        m.style.display = "none";
      });
      document.body.style.overflow = "";
      return;
    }
    window.location.href = "index.html";
  });
}

export function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname.endsWith(".local"),
  );

  if (isLocalhost) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }
    return;
  }

  const storedVersion = window.__solosatset_sw_version || null;
  if (storedVersion !== CURRENT_SW_VERSION) {
    if ("caches" in window)
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() =>
          console.log(
            `[SW Bootstrap] Upgraded from ${storedVersion || "v1"} to v${CURRENT_SW_VERSION}. All stale caches cleaned.`,
          ),
        )
        .catch(() => {});
    window.__solosatset_sw_version = CURRENT_SW_VERSION;
  }
  navigator.serviceWorker
    .register(`./sw.js?v=${CURRENT_SW_VERSION}`)
    .then((registration) => {
      registration.update().catch(() => {});
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller)
            newWorker.postMessage({ action: "skipWaiting" });
        });
      });
      if (registration.waiting) registration.waiting.postMessage({ action: "skipWaiting" });
    })
    .catch(() => {});
}
