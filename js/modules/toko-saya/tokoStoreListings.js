import {
  getMyListings,
  getRegionById,
  formatRupiah,
  deleteListing, updateListingStatus,
} from "../../services/storage.js";
import { openEditListingModal } from "../listings/listingFormModal.js"; import { openModal, closeModal, showToast } from "../../utils/modalRouter.js";
import { refreshIcons } from "../../utils/runtime.js";

let isInitialStoreLoading = true;
let hasStoreListingsLoadedOnce = false;

export function renderStoreListings(
  currentUser,
  filter = "all",
  showStoreLoadingSkeletonFn,
  renderStoreShowcaseFn,
  syncAndRenderStoreListingsFn,
) {
  const container = document.getElementById("my-listings-container"),
    emptyView = document.getElementById("my-listings-empty");
  if (!container || !currentUser) return;
  const myListings = getMyListings(currentUser);
  if (isInitialStoreLoading && 0 === myListings.length && !hasStoreListingsLoadedOnce) {
    if (typeof showStoreLoadingSkeletonFn === "function") showStoreLoadingSkeletonFn();
    return;
  }
  const countAllEl = document.getElementById("store-count-all"),
    countAvailEl = document.getElementById("store-count-available"),
    countBookedEl = document.getElementById("store-count-booked"),
    countSoldEl = document.getElementById("store-count-sold"),
    totalAll = myListings.length,
    totalAvailable = myListings.filter((l) => !l.isSold && "sold" !== l.status && "booked" !== l.status).length,
    totalBooked = myListings.filter((l) => "booked" === l.status).length,
    totalSold = myListings.filter((l) => l.isSold || "sold" === l.status).length;

  if (countAllEl) countAllEl.textContent = totalAll;
  if (countAvailEl) countAvailEl.textContent = totalAvailable;
  if (countBookedEl) countBookedEl.textContent = totalBooked;
  if (countSoldEl) countSoldEl.textContent = totalSold;

  let displayListings = myListings;
  if ("available" === filter) {
    displayListings = myListings.filter((l) => !l.isSold && "sold" !== l.status && "booked" !== l.status);
  } else if ("booked" === filter) {
    displayListings = myListings.filter((l) => "booked" === l.status);
  } else if ("sold" === filter) {
    displayListings = myListings.filter((l) => l.isSold || "sold" === l.status);
  }

  if (0 === displayListings.length) {
    container.innerHTML = "";
    if (emptyView) emptyView.classList.remove("hidden");
    return;
  }
  if (emptyView) emptyView.classList.add("hidden");

  let html = "";
  displayListings.forEach((item) => {
    const region = getRegionById(item.regionId),
      regionName = region ? region.shortName : item.regionId,
      itemStatus = item.status || (item.isSold ? "sold" : "available");
    let statusBorderColor = "border-slate-200 bg-white";
    if ("sold" === itemStatus) statusBorderColor = "border-rose-200 bg-rose-50/50";
    else if ("booked" === itemStatus) statusBorderColor = "border-amber-200 bg-amber-50/50";

    html += `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl border ${statusBorderColor} shadow-sm hover:border-slate-300 transition-all">

        <!-- Left: Image & Content -->
        <div class="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
          <div class="relative flex-shrink-0">
            <img src="${Array.isArray(item.images) && item.images[0] ? item.images[0] : "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"}" alt="${item.title}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-sm">
            <span class="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-xs ${"sold" === itemStatus ? "bg-rose-500" : "booked" === itemStatus ? "bg-amber-400" : "bg-emerald-400"}" title="Status: ${"sold" === itemStatus ? "Terjual" : "booked" === itemStatus ? "Booked" : "Tersedia"}"></span>
          </div>

          <div class="flex-1 min-w-0 space-y-1.5">
            <h3 class="text-[11px] sm:text-[12px] font-bold text-slate-800 leading-snug line-clamp-2 hover:text-rose-900 transition-colors" title="${item.title}">
              ${item.title}
            </h3>

            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[12px] sm:text-[13px] font-black text-rose-900 tracking-tight">${formatRupiah(item.price)}</span>
              ${
                item.is_bu || item.isBu
                  ? `
                <span class="text-[9px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500 shadow-xs flex items-center gap-1 animate-pulse">
                  <span>🔥 BU</span>
                </span>
              `
                  : ""
              }
              <span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                ${"pas" === item.negoType ? "Nett" : "Nego"}
              </span>
              <span class="text-[9px] font-bold ${"in_store" === item.paymentMethod ? "text-sky-700 bg-sky-50 border-sky-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"} px-1.5 py-0.5 rounded-md border">
                ${"in_store" === item.paymentMethod ? "In Store" : "COD"}
              </span>
            </div>

            <div class="flex items-center gap-2.5 text-[10px] text-slate-500 flex-wrap pt-0.5">
              <span class="flex items-center gap-1 font-semibold text-slate-600">
                <i data-lucide="map-pin" class="w-3 h-3 text-rose-700 flex-shrink-0"></i>
                <span>${regionName}${item.district ? " • " + item.district : ""}</span>
              </span>
              <span class="flex items-center gap-1 font-medium text-slate-500">
                <i data-lucide="eye" class="w-3 h-3 text-amber-500 flex-shrink-0"></i>
                <span>${item.views || 1}x dilihat</span>
              </span>
            </div>

            ${
              item.codPoint
                ? `
              <div class="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                <i data-lucide="navigation" class="w-3 h-3 text-emerald-600 flex-shrink-0"></i>
                <span class="truncate">Titik: ${item.codPoint}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Right Controls -->
        <div class="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0 self-end md:self-center mt-1 sm:mt-0">
          <button
            type="button"
            data-action="open-status-modal"
            data-id="${item.id}"
            data-title="${item.title.replace(/"/g, "&quot;")}"
            data-current-status="${itemStatus}"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-xs ${"sold" === itemStatus ? "bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300 hover:bg-rose-100" : "booked" === itemStatus ? "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300 hover:bg-amber-100" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100"}"
            title="Klik untuk Mengubah Status Barang"
          >
            <span class="w-1.5 h-1.5 rounded-full ${"sold" === itemStatus ? "bg-rose-500" : "booked" === itemStatus ? "bg-amber-500" : "bg-emerald-500"}"></span>
            <span>${"sold" === itemStatus ? "Terjual" : "booked" === itemStatus ? "Booked" : "Tersedia"}</span>
            <i data-lucide="chevron-down" class="w-3 h-3 text-slate-500"></i>
          </button>

          <button
            type="button"
            data-action="edit-listing"
            data-id="${item.id}"
            class="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-amber-600 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer border border-slate-200 hover:border-amber-300"
            title="Sunting / Edit Rincian Iklan"
          >
            <i data-lucide="edit-3" class="w-3 h-3"></i>
            <span>Edit</span>
          </button>

          <button
            type="button"
            data-action="delete-listing"
            data-id="${item.id}"
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-200 shadow-none hover:shadow-xs"
            title="Hapus Iklan"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('[data-action="open-status-modal"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      const id = btn.getAttribute("data-id"),
        currentStatus = btn.getAttribute("data-current-status");
      if (id) openItemStatusPickerModal(id, currentStatus);
    });
  });

  container.querySelectorAll('[data-action="edit-listing"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      const id = btn.getAttribute("data-id");
      if (id) openEditListingModal(id);
    });
  });

  let isDeletingItem = false;
  container.querySelectorAll('[data-action="delete-listing"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if (isDeletingItem) return;
      const id = btn.getAttribute("data-id");
      if (confirm("Apakah kamu yakin ingin menghapus barang jualan ini dari etalase toko kamu?")) {
        isDeletingItem = true;
        setTimeout(() => {
          isDeletingItem = false;
        }, 600);
        deleteListing(id);
        if (typeof renderStoreShowcaseFn === "function") renderStoreShowcaseFn();
        if (typeof syncAndRenderStoreListingsFn === "function") syncAndRenderStoreListingsFn(filter);
        showToast("Barang jualan berhasil dihapus.", "info");
      }
    });
  });

  if (typeof refreshIcons === "function") refreshIcons();
}

export function openItemStatusPickerModal(itemId, currentStatus) {
  if (!document.getElementById("modal-item-status-picker")) return;
  const targetInput = document.getElementById("status-picker-target-id");
  if (targetInput) targetInput.value = itemId;

  document.querySelectorAll(".picker-status-btn").forEach((btn) => {
    const statusVal = btn.getAttribute("data-status-val"),
      isCurrent = statusVal === currentStatus,
      checkIcon = btn.querySelector(".status-check-icon"),
      checkCircle = btn.querySelector(".status-check-circle");

    if (isCurrent) {
      if ("available" === statusVal) {
        btn.className =
          "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-500/70 bg-emerald-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-emerald-500/20";
        if (checkCircle)
          checkCircle.className =
            "status-check-circle w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center flex-shrink-0";
      } else if ("booked" === statusVal) {
        btn.className =
          "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-amber-500/70 bg-amber-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-amber-500/20";
        if (checkCircle)
          checkCircle.className =
            "status-check-circle w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-500/20 flex items-center justify-center flex-shrink-0";
      } else {
        btn.className =
          "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-rose-500/70 bg-rose-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-500/20";
        if (checkCircle)
          checkCircle.className =
            "status-check-circle w-5 h-5 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center flex-shrink-0";
      }
      if (checkIcon) checkIcon.classList.remove("hidden");
    } else {
      btn.className =
        "picker-status-btn w-full px-4 py-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkCircle)
        checkCircle.className =
          "status-check-circle w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0";
      if (checkIcon) checkIcon.classList.add("hidden");
    }
  });

  openModal("modal-item-status-picker");
}
