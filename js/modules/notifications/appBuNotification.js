import { getListingById, formatRupiah, getRegionById } from "../../services/storage.js";
import { sbGetListingById, sbBroadcastBuNotification } from "../../services/supabaseDB.js";
import { openProductDetail } from "../products/productDetailModal.js";
import { showToast } from "../../utils/modalRouter.js";
import { refreshIcons } from "../../utils/runtime.js";
import { renderListings } from "../products/listingsController.js";
import { updateListing } from "../../services/storage.js";

export async function triggerBuNotification(productId, categoryId) {
  console.log(
    `[BU Notification] Memicu wrapper notifikasi BU untuk produk: ${productId} (Kategori: ${categoryId})...`,
  );
  if (!productId)
    return { success: false, sentUsersCount: 0, error: "Product ID required" };
  try {
    let product = null;
    if (typeof getListingById === "function") {
      product = getListingById(productId);
    }
    if (!product && typeof sbGetListingById === "function") {
      product = await sbGetListingById(productId);
    }
    const finalCategory = String(categoryId || product?.category || "umum")
        .toLowerCase()
        .trim(),
      title = product
        ? `🔥 BUTUH UANG CEPAT: ${product.title}`
        : "🔥 IKLAN BUTUH UANG CEPAT (BU) TERBARU!",
      priceFormatted =
        product && typeof formatRupiah === "function"
          ? formatRupiah(product.price)
          : product?.price
            ? `Rp ${product.price}`
            : "",
      regionObj =
        product && typeof getRegionById === "function"
          ? getRegionById(product.regionId)
          : null,
      locationName = regionObj
        ? regionObj.shortName || regionObj.name
        : "Solo Raya",
      message = product
        ? `Harga ${priceFormatted} di ${locationName}! Penjual sedang butuh uang cepat, segera cek sebelum keduluan!`
        : `Ada barang butuh uang (BU) untuk kategori ${finalCategory} yang Anda minati baru saja tayang!`,
      url = `https://solosatset.vercel.app/?item=${productId}`,
      productImg =
        (product && product.images && product.images[0]) ||
        "/assets/img/app-logo.png?v=2.1",
      productDetails = {
        title: title,
        message: message,
        url: url,
        image: productImg,
        category: finalCategory,
      };
    let broadcastFn = sbBroadcastBuNotification;
    if (
      typeof broadcastFn !== "function" &&
      typeof window !== "undefined" &&
      typeof window.sbBroadcastBuNotification === "function"
    ) {
      broadcastFn = window.sbBroadcastBuNotification;
    }
    if (typeof broadcastFn !== "function") {
      console.error(
        "[BU Notification Error] sbBroadcastBuNotification function not available.",
      );
      return {
        success: false,
        sentUsersCount: 0,
        error: "Broadcast service unavailable",
      };
    }
    const result = await broadcastFn(productId, finalCategory, productDetails);
    if (result && result.success) {
      if ((result.userCount || (result.targetUserIds && result.targetUserIds.length)) > 0) {
        showBuBroadcastToast({
          productId: productId,
          categoryId: finalCategory,
          title: result.title || title,
          message: result.message || message,
          image: productImg,
          url: url,
        });
      } else {
        showToast(
          `⚡ Iklan BU aktif! Belum ada user dengan riwayat minat kategori "${finalCategory}".`,
          "info",
        );
      }
    }
    return {
      success: !!result && !!result.success,
      sentUsersCount: (result && result.userCount) || 0,
      userCount: (result && result.userCount) || 0,
      targetUserIds: (result && result.targetUserIds) || [],
      title: (result && result.title) || title,
      message: (result && result.message) || message,
      error: result ? result.error : undefined,
    };
  } catch (err) {
    console.error("[BU Notification Wrapper Error]", err);
    return { success: false, sentUsersCount: 0, userCount: 0, error: err.message };
  }
}

export function showBuBroadcastToast(detail) {
  if (!detail) return;
  const productId = detail.productId || detail.product_id || detail.listing_id,
    title = detail.title || "🔥 IKLAN BUTUH UANG (BU) TERBARU!",
    message =
      detail.message ||
      detail.body ||
      "Ada barang BU terbaru yang cocok dengan minat Anda!",
    image = detail.image || detail.icon || "/assets/img/app-logo.png?v=2.1",
    categoryId = detail.categoryId || detail.category_id || "BU";

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([150, 80, 150]);
    } catch (e) {}
  }
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className =
      "fixed top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-md w-[92%] sm:w-auto sm:min-w-[360px] pointer-events-none";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className =
    "toast-bu-item pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-2 border-amber-400 shadow-2xl shadow-rose-950/90 text-white transition-all duration-300 transform -translate-y-4 opacity-0 max-w-md w-full backdrop-blur-md ring-4 ring-amber-400/30";
  toast.innerHTML = `
    <div class="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border-2 border-amber-300 shadow-md">
      <img src="${image}" alt="BU Item" class="w-full h-full object-cover" onerror="this.src='/assets/img/app-logo.png?v=2.1'">
      <span class="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] font-black text-center py-0.2 uppercase">🔥 BU</span>
    </div>
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-rose-950 shadow-xs">
          🔥 BUTUH UANG CEPAT
        </span>
        <span class="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/20 text-rose-100">
          ${String(categoryId).toUpperCase()}
        </span>
      </div>
      <h4 class="text-xs sm:text-sm font-black text-white leading-snug break-words">${title}</h4>
      <p class="text-[11.5px] text-rose-100/90 mt-0.5 line-clamp-2 leading-relaxed">${message}</p>

      <div class="mt-2 flex items-center gap-2">
        <button type="button" class="btn-check-bu px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-rose-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95">
          <span>⚡ Cek Iklan Sekarang</span>
        </button>
      </div>
    </div>
    <button type="button" class="btn-close-toast text-rose-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer" title="Tutup">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  const btnCheck = toast.querySelector(".btn-check-bu");
  if (btnCheck) {
    btnCheck.onclick = () => {
      toast.remove();
      if (productId && typeof window.openProductDetail === "function") {
        window.openProductDetail(productId);
      }
    };
  }
  const closeBtn = toast.querySelector(".btn-close-toast");
  if (closeBtn) {
    closeBtn.onclick = () => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-4", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    };
  }
  container.appendChild(toast);
  if (typeof refreshIcons === "function") refreshIcons(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("-translate-y-4", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
  });
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-4", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
}

export async function verifyBuQrisPayment(productId, categoryId) {
  console.log(
    `[QRIS Verification] Memverifikasi pembayaran QRIS untuk iklan BU ${productId}...`,
  );
  try {
    if (typeof updateListing === "function") {
      updateListing(productId, {
        is_bu: true,
        isBu: true,
        bu_expires_at: null,
        qris_verified: true,
      });
    }
    const res = await triggerBuNotification(productId, categoryId);
    if (typeof renderListings === "function") renderListings();
    return res;
  } catch (err) {
    console.error("[QRIS Verification Error]", err);
    return { success: false, error: err.message };
  }
}
