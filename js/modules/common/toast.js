import { refreshIcons } from "../../utils/runtime.js";

let lastToastKey = "";
let lastToastTime = 0;

/**
 * Tampilkan notifikasi toast melayang di bagian atas layar.
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {'info'|'success'|'warning'|'error'} type - Tipe toast
 * @param {number} duration - Durasi tampil (ms)
 */
export function showToast(message, type = "info", duration = 4500) {
  const now = Date.now();
  const key = `${type}:${message}`;
  if (key === lastToastKey && now - lastToastTime < 800) {
    return;
  }
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
    <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 ${iconColor} mt-0.5">
      <i data-lucide="${iconName}" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex items-center gap-1.5 mb-0.5">
        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}">
          ${badgeText}
        </span>
      </div>
      <div class="text-xs sm:text-sm font-bold text-white leading-snug break-words">${message}</div>
    </div>
    <button type="button" class="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer" title="Tutup Notifikasi">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  const closeBtn = toast.querySelector("button");
  if (closeBtn) {
    closeBtn.onclick = () => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-4", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    };
  }

  container.appendChild(toast);
  try {
    refreshIcons();
  } catch (_e) {}

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

// Global window registration for legacy inline calls
if (typeof window !== "undefined") {
  window.showToast = showToast;
}
