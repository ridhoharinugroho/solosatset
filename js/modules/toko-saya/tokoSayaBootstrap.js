import { initializeStorage, getCurrentUser, syncAllUsersToCloudOnStartup, fetchFreshCurrentUserFromSupabase } from "../../services/storage.js";
import { renderAuthHeaderModule, renderStoreShowcaseModule } from "../store/storeShowcase.js";
import { renderStoreReviewsModule } from "./tokoStoreReviews.js";
import { getMyListings, getDistrictsByRegionId, getAllListings } from "../../services/storage.js";
import { SOLO_RAYA_REGIONS } from "../../data/regions.js";
import { openCreateListingModal } from "../listings/listingFormModal.js";
import { formatRupiah } from "../../services/whatsapp.js";
import { processSquareImage } from "../../utils/imageProcessor.js";
import { showToast, openModal, closeModal } from "../../utils/modalRouter.js";
import { sbUploadMultipleImages, sbBroadcastBuNotification, updateUserInterest, sbGetMyListings } from "../../services/supabaseDB.js";
import { saveListing, updateListing, updateListingStatus } from "../../services/storage.js";
import { initProfileModule, openUserProfileModal } from "../profile/userProfile.js";
import { refreshIcons } from "../../utils/runtime.js";
import { renderStoreListings } from "./tokoStoreListings.js";
import { initServiceWorker } from "../app/appBootstrap.js";

let isTokoSayaPageInitialized = false;
let activeStoreFilter = "all";
let isSyncingStoreListings = false;
let isInitialStoreLoading = true;
let hasStoreListingsLoadedOnce = false;

export async function initTokoSayaPage(currentUserRef, uploadedImagesRef) {
  if (isTokoSayaPageInitialized) return;
  isTokoSayaPageInitialized = true;

  try {
    initializeStorage();
  } catch (e) {
    console.warn("[initializeStorage Error]", e);
  }

  try {
    document.querySelectorAll('.fixed[id^="modal-"]').forEach((m) => {
      m.classList.add("hidden");
      m.style.display = "none";
    });
  } catch (e) {}

  if (
    new URLSearchParams(window.location.search).has("logout") ||
    "true" === sessionStorage.getItem("solosatset_just_logged_out")
  ) {
    sessionStorage.clear();
    window.location.href = "index.html";
    return;
  }

  let sessionUser = getCurrentUser();
  if (!sessionUser) {
    console.log("[Toko Saya] Pengguna belum masuk/login. Mengarahkan kembali ke Beranda.");
    window.location.href = "index.html";
    return;
  }

  currentUserRef.value = sessionUser;
  const currentUser = sessionUser;

  try { renderAuthHeaderModule(currentUser); } catch (e) {}
  try { renderStoreShowcaseModule(currentUser); } catch (e) {}
  try { renderStoreReviewsModule(currentUser); } catch (e) {}

  if (getMyListings(currentUser).length > 0) {
    isInitialStoreLoading = false;
    hasStoreListingsLoadedOnce = true;
    try {
      renderStoreListings(currentUser, activeStoreFilter);
    } catch (e) {
      console.warn("[renderStoreListings]", e);
    }
  }

  setupFormRegions(currentUser);
  setupVerificationToggle();
  setupEventListeners(currentUserRef, uploadedImagesRef);
  setupBackHandler();

  try { initServiceWorker(); } catch (e) {}
  if (window.lucide) {
    try { refreshIcons(); } catch (e) {}
  }

  (async () => {
    try {
      await syncAllUsersToCloudOnStartup();
      const freshUser = getCurrentUser();
      if (freshUser) currentUserRef.value = freshUser;
    } catch (uErr) {}
    try {
      await syncAndRenderStoreListings(currentUserRef.value, activeStoreFilter, true);
    } catch (lErr) {}
  })();

  window.addEventListener("userProfileUpdated", (e) => {
    const updatedUser = e.detail || getCurrentUser();
    if (updatedUser) currentUserRef.value = updatedUser;
    try { renderAuthHeaderModule(currentUserRef.value); } catch (e) {}
    try { renderStoreShowcaseModule(currentUserRef.value); } catch (e) {}
    try { renderStoreReviewsModule(currentUserRef.value); } catch (e) {}
  });

  window.addEventListener("registeredUsersChanged", () => {
    const updatedUser = getCurrentUser();
    if (updatedUser) currentUserRef.value = updatedUser;
    try { renderAuthHeaderModule(currentUserRef.value); } catch (e) {}
    try { renderStoreShowcaseModule(currentUserRef.value); } catch (e) {}
    try { renderStoreReviewsModule(currentUserRef.value); } catch (e) {}
  });

  document.addEventListener("visibilitychange", () => {
    if ("visible" === document.visibilityState && !hasStoreListingsLoadedOnce) {
      fetchFreshCurrentUserFromSupabase().catch(() => {});
    }
  });
}

function setupFormRegions(currentUser) {
  try {
    const regSelect = document.getElementById("form-region-select"),
      distSelect = document.getElementById("form-district-select");
    if (!regSelect) return;
    regSelect.innerHTML = "";
    SOLO_RAYA_REGIONS.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.shortName})`;
      regSelect.appendChild(opt);
    });
    const updateDistricts = (regId) => {
      if (!distSelect) return;
      const districts = getDistrictsByRegionId(regId) || [];
      distSelect.innerHTML = "";
      districts.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = `Kec. ${d}`;
        distSelect.appendChild(opt);
      });
    };
    regSelect.onchange = () => updateDistricts(regSelect.value);
    if (SOLO_RAYA_REGIONS.length > 0) {
      const defaultReg = currentUser?.region || "karanganyar";
      regSelect.value = defaultReg;
      updateDistricts(defaultReg);
    }
  } catch (err) {
    console.warn("[setupFormRegions error]", err);
  }
}

function setupVerificationToggle() {
  const toggleBtn = document.getElementById("btn-toggle-verification-details"),
    detailsBox = document.getElementById("my-store-verification-details"),
    toggleLabel = document.getElementById("my-verification-toggle-label"),
    toggleChevron = document.getElementById("my-verification-chevron");
  if (toggleBtn && detailsBox) {
    toggleBtn.onclick = () => {
      if (detailsBox.classList.contains("hidden")) {
        detailsBox.classList.remove("hidden");
        if (toggleLabel) toggleLabel.textContent = "Sembunyikan Syarat";
        if (toggleChevron) toggleChevron.style.transform = "rotate(180deg)";
      } else {
        detailsBox.classList.add("hidden");
        if (toggleLabel) toggleLabel.textContent = "Lihat Rincian Syarat";
        if (toggleChevron) toggleChevron.style.transform = "rotate(0deg)";
      }
    };
  }
}

function setupEventListeners(currentUserRef, uploadedImagesRef) {
  document.querySelectorAll(".store-filter-tab").forEach((tab) => {
    tab.onclick = (e) => {
      if (e) e.preventDefault();
      const filterVal = tab.getAttribute("data-store-filter") || "all";
      handleFilterTabClick(tab, filterVal, currentUserRef.value);
    };
  });

  const buCheckbox = document.getElementById("form-checkbox-is-bu"),
    btnVerifyQris = document.getElementById("btn-verify-bu-qris"),
    verifyBtnText = document.getElementById("btn-verify-bu-text"),
    buQrisBadge = document.getElementById("bu-qris-status-badge"),
    btnActivateBu = document.getElementById("btn-activate-bu");

  btnActivateBu?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!buCheckbox) return;
    buCheckbox.checked = true;
    window.isDraftBu = true;
    const basePrice = 500,
      uniqueCode = Math.floor(101 * Math.random());
    window.currentBuPaymentAmount = basePrice + uniqueCode;
    btnActivateBu.innerText = "Menyiapkan Iklan BU...";
    btnActivateBu.disabled = true;
    btnActivateBu.classList.add("opacity-70", "cursor-not-allowed");
    const form = document.getElementById("form-create-listing");
    if (form) {
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  });

  btnVerifyQris?.addEventListener("click", () => {
    buCheckbox?.setAttribute("data-qris-verified", "true");
    buQrisBadge?.classList.remove("hidden");
    btnVerifyQris?.classList.add("opacity-60");
    if (verifyBtnText) verifyBtnText.textContent = "✅ QRIS Terverifikasi";
    showToast(
      "Pembayaran QRIS BU berhasil diverifikasi! Notifikasi broadcast akan otomatis dikirim saat iklan ditayangkan.",
      "success",
    );
  });

  document.getElementById("btn-store-create-listing")?.addEventListener("click", (e) => {
    e.preventDefault();
    openCreateListingModal();
  });

  const priceInput = document.getElementById("form-input-price"),
    pricePreview = document.getElementById("price-rupiah-preview");
  priceInput?.addEventListener("input", (e) => {
    const val = Number(e.target.value) || 0;
    if (pricePreview) pricePreview.textContent = formatRupiah(val);
  });

  const fileInput = document.getElementById("form-image-file");
  fileInput?.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remainingSlots = 3 - uploadedImagesRef.value.length;
    if (remainingSlots <= 0) {
      showToast("Maksimal 3 foto per barang. Hapus foto yang sudah ada jika ingin menambah baru.", "warning");
      fileInput.value = "";
      return;
    }
    const filesToProcess = files.slice(0, remainingSlots);
    let processed = 0;
    for (const file of filesToProcess) {
      try {
        const squareDataUrl = await processSquareImage(file);
        uploadedImagesRef.value.push(squareDataUrl);
        processed++;
      } catch (err) {
        showToast(err.message || "Gagal memproses foto", "error");
      }
    }
    if (processed > 0) {
      fileInput.value = "";
      showToast(`${processed} foto berhasil dipotong 1:1 & dikompresi (Maks 1000px, Kualitas 0.8)!`, "success");
    }
  });

  let isStatusActionInProgress = false;
  document.querySelectorAll(".picker-status-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e) { e.preventDefault(); e.stopImmediatePropagation(); }
      if (isStatusActionInProgress) return;
      isStatusActionInProgress = true;
      setTimeout(() => { isStatusActionInProgress = false; }, 600);
      const newStatus = btn.getAttribute("data-status-val"),
        targetId = document.getElementById("status-picker-target-id")?.value;
      if (targetId && newStatus) {
        updateListingStatus(targetId, newStatus);
        closeModal("modal-item-status-picker");
        renderStoreShowcaseModule(currentUserRef.value);
        syncAndRenderStoreListings(currentUserRef.value, activeStoreFilter);
        showToast(`Status barang berhasil diubah menjadi "${"sold" === newStatus ? "Terjual" : "booked" === newStatus ? "Booked" : "Tersedia"}"!`, "success");
      }
    });
  });

  document.getElementById("nav-btn-profile")?.addEventListener("click", (e) => {
    e.preventDefault();
    openUserProfileModal();
  });
}

export function handleFilterTabClick(tabEl, filterVal = "all", currentUser) {
  activeStoreFilter = filterVal;
  document.querySelectorAll(".store-filter-tab").forEach((t) => {
    t.classList.remove("active", "bg-rose-900", "text-white", "shadow-xs");
    t.classList.add("text-slate-400");
  });
  if (tabEl) {
    tabEl.classList.add("active", "bg-rose-900", "text-white", "shadow-xs");
    tabEl.classList.remove("text-slate-400");
  }
  renderStoreListings(currentUser, filterVal);
}

export async function syncAndRenderStoreListings(currentUser, filter = activeStoreFilter, force = false) {
  if (!currentUser || !currentUser.id) return;
  if (
    getMyListings(currentUser).length > 0
      ? (isInitialStoreLoading = false, hasStoreListingsLoadedOnce = true, renderStoreListings(currentUser, filter))
      : isInitialStoreLoading && !hasStoreListingsLoadedOnce,
    !isSyncingStoreListings || force
  ) {
    isSyncingStoreListings = true;
    try {
      const cloudListings = await sbGetMyListings(currentUser, force);
      if (cloudListings && Array.isArray(cloudListings)) {
        const allListings = getAllListings();
        cloudListings.forEach((cloudItem) => {
          const existingIdx = allListings.findIndex((l) => l.id === cloudItem.id),
            formattedItem = {
              id: cloudItem.id,
              title: cloudItem.title,
              description: cloudItem.description,
              price: Number(cloudItem.price) || 0,
              category: cloudItem.category,
              condition: cloudItem.condition || "good",
              negoType: cloudItem.nego_type || "nego_alus",
              paymentMethod: cloudItem.payment_method || "cod",
              regionId: cloudItem.region || currentUser.region || "solo",
              district: cloudItem.district || currentUser.district || "",
              codPoint: cloudItem.cod_point || "",
              images: Array.isArray(cloudItem.images) ? cloudItem.images : cloudItem.images ? [cloudItem.images] : [],
              views: Number(cloudItem.views) || 0,
              isBu: Boolean(cloudItem.is_bu),
              is_bu: Boolean(cloudItem.is_bu),
              qris_verified: Boolean(cloudItem.qris_verified),
              payment_status: cloudItem.payment_status || "verified",
              status: cloudItem.status || "active",
              seller: {
                id: cloudItem.seller_id || currentUser.id,
                name: cloudItem.seller_name || currentUser.storeName || currentUser.name,
                storeName: cloudItem.seller_name || currentUser.storeName || currentUser.name,
                phone: cloudItem.seller_phone || currentUser.phone,
                avatar: cloudItem.seller_avatar || currentUser.avatar,
                region: cloudItem.region || currentUser.region,
              },
              createdAt: cloudItem.created_at || new Date().toISOString(),
            };
          if (-1 !== existingIdx) allListings[existingIdx] = { ...allListings[existingIdx], ...formattedItem };
          else allListings.unshift(formattedItem);
        });
      }
    } catch (err) {
      console.error("❌ [Toko Saya: syncAndRenderStoreListings Error]", err);
    } finally {
      isInitialStoreLoading = false;
      hasStoreListingsLoadedOnce = true;
      isSyncingStoreListings = false;
      renderStoreListings(currentUser, filter);
    }
  }
}

function setupBackHandler() {
  try {
    if (!window.history.state || !window.history.state.pageBase) {
      window.history.replaceState({ pageBase: "toko-saya" }, "");
    }
  } catch (e) {}
}
