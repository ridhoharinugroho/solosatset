import {
  getSellerReviews,
  getSellerRatingStats,
  toggleHideSellerReview,
  deleteSellerReview
} from "../../services/storage.js";
import { getUserByReviewAuthor } from "../../services/auth.js";
import { formatRegionTitle, formatDistrictTitle, refreshIcons } from "../../utils/runtime.js";

export function renderStoreRatingSummary(currentUser) {
  const badgeEl = document.getElementById("my-store-rating-summary-badge");
  if (!badgeEl || !currentUser) return;

  const sellerId = currentUser.id || currentUser.storeName || currentUser.name;
  const stats = getSellerRatingStats(sellerId);
  const avg = stats.avgRating || "0.0";
  const count = stats.totalReviews || 0;

  badgeEl.textContent = `⭐ ${avg} (${count} Ulasan)`;
}

export function getStoreReviews(currentUser) {
  if (!currentUser) return [];
  const sellerId = currentUser.id || currentUser.storeName || currentUser.name;
  return getSellerReviews(sellerId);
}

export function renderStoreReviews(currentUser) {
  if (!currentUser) return;
  const isAdmin = "true" === sessionStorage.getItem("pusat_barkas_admin_auth");
  const ratingStats = getSellerRatingStats(currentUser.id);
  const reviews = getSellerReviews(currentUser.id, isAdmin);
  const summaryBadge = document.getElementById("my-store-rating-summary-badge");
  const container = document.getElementById("my-store-reviews-container");
  const emptyView = document.getElementById("my-store-reviews-empty");

  if (summaryBadge) {
    summaryBadge.textContent =
      0 === ratingStats.totalReviews
        ? "⭐ 0.0 (0 Ulasan)"
        : `⭐ ${ratingStats.averageRating.toFixed(1)} (${ratingStats.totalReviews} Ulasan)`;
  }

  if (!container) return;

  if (0 === reviews.length) {
    container.innerHTML = "";
    emptyView?.classList.remove("hidden");
    return;
  }

  emptyView?.classList.add("hidden");
  let html = "";
  reviews.forEach((r) => {
    const d = new Date(r.createdAt);
    const dStr = isNaN(d)
      ? ""
      : d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
    const isHidden = !!r.isHidden;
    const buyerUser =
      (currentUser &&
      ((r.buyerId &&
        (r.buyerId === currentUser.id || r.buyerId === currentUser.email)) ||
        (r.buyerName &&
          (r.buyerName
            .toLowerCase()
            .includes(currentUser.name?.toLowerCase() || "---") ||
            r.buyerName
              .toLowerCase()
              .includes(currentUser.storeName?.toLowerCase() || "---"))))
        ? currentUser
        : null) || getUserByReviewAuthor(r.buyerId, r.buyerName);

    let displayBuyerName = r.buyerName || "Pembeli";
    if (buyerUser) {
      const baseName =
        buyerUser.storeName ||
        buyerUser.name ||
        displayBuyerName.replace(/\(.*?\)/g, "").trim();
      const dist = buyerUser.district
        ? formatDistrictTitle(buyerUser.district)
        : "";
      const reg = buyerUser.region ? formatRegionTitle(buyerUser.region) : "";
      displayBuyerName = `${baseName} (${dist || reg || "Solo Raya"})`;
    } else {
      displayBuyerName = displayBuyerName.replace(
        /\(([A-Za-z\s]+)\)/g,
        (m, p1) => {
          const p1Clean = p1.trim();
          const map = {
            solo: "Solo",
            surakarta: "Solo",
            karanganyar: "Karanganyar",
            sukoharjo: "Sukoharjo",
            wonogiri: "Wonogiri",
            sragen: "Sragen",
            boyolali: "Boyolali",
            klaten: "Klaten",
            soloraya: "Solo Raya",
            "solo raya": "Solo Raya",
          };
          const matchKey = p1Clean.toLowerCase();
          return map[matchKey]
            ? `(${map[matchKey]})`
            : `(${p1Clean.charAt(0).toUpperCase() + p1Clean.slice(1).toLowerCase()})`;
        },
      );
    }

    html += `
      <div class="p-3.5 bg-slate-950/70 rounded-2xl border ${isHidden ? "border-purple-800 bg-purple-950/30" : "border-slate-800"} text-xs space-y-2.5 shadow-2xs">
        ${
          isHidden
            ? `
          <div class="flex items-center justify-between p-1.5 px-2 bg-purple-950 text-purple-200 border border-purple-800 rounded-lg text-[10px] font-bold">
            <span class="flex items-center gap-1"><i data-lucide="eye-off" class="w-3 h-3 text-purple-400"></i> Ulasan Disembunyikan (Hanya Admin)</span>
            <span class="text-purple-300">Spam/Kompetitor</span>
          </div>
        `
            : ""
        }

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-black text-white">${displayBuyerName}</span>
            <span class="text-[10px] text-slate-400">${dStr}</span>
          </div>
          <span class="text-amber-400 font-black tracking-widest">${"★".repeat(r.rating)}</span>
        </div>
        <p class="text-slate-300 font-medium">"${r.comment}"</p>
        ${
          r.productImage
            ? `
          <div class="flex items-center gap-2.5 p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
            <img src="${r.productImage}" alt="Foto Produk yang Dibeli" class="w-12 h-12 rounded-lg object-cover border border-slate-700 shadow-2xs flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="window.open('${r.productImage}', '_blank')">
            <div class="space-y-0.5 min-w-0">
              <span class="inline-flex items-center gap-1 text-[9.5px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/50">
                <i data-lucide="camera" class="w-3 h-3 text-rose-400"></i>
                <span>Foto Produk yang Dibeli</span>
              </span>
              <p class="text-[10px] text-slate-400 font-medium truncate">Bukti foto barang saat transaksi COD</p>
            </div>
          </div>
        `
            : ""
        }

        ${
          isAdmin
            ? `
          <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[10.5px] font-bold text-rose-400 flex items-center gap-1"><i data-lucide="shield-alert" class="w-3 h-3"></i> Moderasi:</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                data-action="store-toggle-hide-review"
                data-id="${r.id}"
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <i data-lucide="${isHidden ? "eye" : "eye-off"}" class="w-3 h-3"></i>
                <span>${isHidden ? "Buka" : "Sembunyi"}</span>
              </button>
              <button
                type="button"
                data-action="store-delete-review"
                data-id="${r.id}"
                class="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-[10.5px] font-bold border border-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <i data-lucide="trash-2" class="w-3 h-3"></i>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  });

  container.innerHTML = html;

  if (isAdmin) {
    container
      .querySelectorAll('[data-action="store-toggle-hide-review"]')
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          toggleHideSellerReview(id);
          renderStoreReviews(currentUser);
        });
      });
    container
      .querySelectorAll('[data-action="store-delete-review"]')
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          if (confirm("Hapus ulasan toko ini secara permanen?")) {
            deleteSellerReview(id);
            renderStoreReviews(currentUser);
          }
        });
      });
  }

  refreshIcons();
}
