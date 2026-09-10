import { getListingById, saveListing, updateListing, getCurrentUser } from "../../services/storage.js";
import { sbUploadMultipleImages } from "../../services/supabaseDB.js";
import { showToast, openModal, closeModal } from "../../utils/modalRouter.js";
import { openUserAuthModal } from "../auth/authUI.js";
import { renderRegionPills, renderCategoryPills } from "../home/homeUI.js";
import { renderListings } from "../products/listingsController.js";
import { renderMyListings } from "../profile/userProfile.js";
import { triggerBuNotification } from "../../app-main-controller.js";
import { updateUserInterest } from "../../services/supabaseDB.js";

let isListingSubmitting = false;

export async function handleCreateListingSubmit(e, state) {
  if (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  if (isListingSubmitting) return;
  isListingSubmitting = true;

  const titleInput =
      document.getElementById("form-input-title") ||
      document.querySelector('input[name="title"]'),
    priceInput =
      document.getElementById("form-input-price") ||
      document.querySelector('input[name="price"]'),
    descInput =
      document.getElementById("form-input-desc") ||
      document.querySelector('textarea[name="description"]'),
    catInput =
      document.getElementById("form-input-category") ||
      document.querySelector('select[name="category"]'),
    condInput =
      document.getElementById("form-input-condition") ||
      document.querySelector('select[name="condition"]'),
    negoInput =
      document.getElementById("form-input-nego") ||
      document.querySelector('select[name="nego_type"]'),
    payInput =
      document.getElementById("form-input-payment-method") ||
      document.getElementById("paymentMethod") ||
      document.getElementById("payment_method") ||
      document.querySelector('input[name="payment_method"]:checked') ||
      document.querySelector('input[name="paymentMethod"]:checked') ||
      document.querySelector('input[name="payment_method"]') ||
      document.querySelector('input[name="paymentMethod"]'),
    regInput =
      document.getElementById("form-region-select") ||
      document.querySelector('select[name="region"]'),
    distInput =
      document.getElementById("form-district-select") ||
      document.querySelector('select[name="district"]'),
    codInput =
      document.getElementById("form-input-cod") ||
      document.getElementById("codPointInput") ||
      document.getElementById("codPoint") ||
      document.getElementById("cod_point") ||
      document.querySelector('input[name="cod_point"]') ||
      document.querySelector('input[name="codPoint"]'),
    mapsInput =
      document.getElementById("form-input-store-maps") ||
      document.querySelector('input[name="store_maps_url"]'),
    editIdInput = document.getElementById("form-input-edit-id"),
    title = titleInput?.value?.trim() || "",
    price = Number(priceInput?.value) || 0,
    description = descInput?.value?.trim() || "",
    category = catInput?.value || "elektronik",
    condition = condInput?.value || "good",
    negoType = negoInput?.value || "nego_alus",
    rawPaymentMethod = payInput ? payInput.value : "",
    paymentMethod =
      rawPaymentMethod && "" !== rawPaymentMethod.trim()
        ? rawPaymentMethod.trim()
        : "cod";

  let storeMapsUrl =
    ("in_store" === paymentMethod && mapsInput?.value?.trim()) || "";
  if (storeMapsUrl && !/^https?:\/\//i.test(storeMapsUrl)) {
    storeMapsUrl = "https://" + storeMapsUrl;
  }

  const regionId = regInput?.value || "solo",
    district = distInput?.value || "",
    rawCodPoint = codInput ? codInput.value : "",
    locRef = (district || regionId || "Solo Raya").trim(),
    codPoint =
      rawCodPoint && "" !== rawCodPoint.trim()
        ? rawCodPoint.trim()
        : locRef
          ? `COD ${locRef}`
          : "COD Solo Raya",
    editId = editIdInput?.value?.trim() || "";

  if (!title) {
    isListingSubmitting = false;
    showToast("Harap masukkan nama / judul barang jualan.", "warning");
    return titleInput?.focus();
  }
  if (priceInput && ("" === priceInput.value || isNaN(price) || price < 0)) {
    isListingSubmitting = false;
    showToast("Harap masukkan harga barang yang valid.", "warning");
    return priceInput?.focus();
  }
  if (!description) {
    isListingSubmitting = false;
    showToast("Harap lengkapi deskripsi lengkap barang jualan.", "warning");
    return descInput?.focus();
  }
  if (!(state?.currentUser || getCurrentUser())) {
    isListingSubmitting = false;
    return openUserAuthModal(
      "login",
      "Silakan masuk atau daftar akun terlebih dahulu untuk memasang iklan barang.",
    );
  }

  const submitBtn = document.querySelector('button[form="form-create-listing"]'),
    submitBtnText = document.getElementById("btn-submit-listing-text"),
    originalText = submitBtnText
      ? submitBtnText.textContent
      : "Tayangkan Iklan Sekarang";

  if (submitBtn) {
    submitBtn.disabled = true;
    if (submitBtnText) {
      submitBtnText.textContent = "Mengunggah Foto ke Cloud (1:1 1000px)...";
    }
  }

  let finalImages =
    state.uploadedImages.length > 0
      ? [...state.uploadedImages]
      : [
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
        ];

  if (
    finalImages.some(
      (img) => typeof img === "string" && img.startsWith("data:"),
    )
  ) {
    try {
      const publicUrls = await sbUploadMultipleImages(finalImages, "");
      if (publicUrls && publicUrls.length > 0) {
        finalImages = publicUrls;
        state.uploadedImages = publicUrls;
        console.log(
          "✅ [Listing Submit] Seluruh foto berhasil diunggah ke Supabase Storage:",
          publicUrls,
        );
      } else {
        console.warn(
          "⚠️ [Listing Submit] Gagal mendapatkan URL publik Storage, menggunakan fallback data URL lokal.",
        );
        showToast(
          "Foto disimpan dalam cache lokal karena kendala koneksi ke Cloud Storage.",
          "info",
        );
      }
    } catch (err) {
      console.error("❌ [Supabase Storage] Failed uploading images:", err);
      showToast(
        `Kendala saat mengunggah foto ke Cloud: ${err.message || "Menggunakan cadangan lokal"}`,
        "warning",
      );
    }
  }

  if (submitBtnText) {
    submitBtnText.textContent = editId
      ? "Menyimpan Perubahan..."
      : "Menayangkan Iklan...";
  }

  const isBuChecked = Boolean(
      document.getElementById("form-checkbox-is-bu")?.checked,
    ),
    isQrisVerified = Boolean(
      "true" ===
      document
        .getElementById("form-checkbox-is-bu")
        ?.getAttribute("data-qris-verified"),
    );

  let fallbackUser = null;
  try {
    fallbackUser = JSON.parse(
      sessionStorage.getItem("solosatset_current_user_data") ||
        localStorage.getItem("pusat_barkas_current_user") ||
        "null",
    );
  } catch (e) {
    console.warn("[Storage] Gagal memparsing data user sesi lokal:", e);
  }

  const activeSessionUser =
    (typeof getCurrentUser === "function" ? getCurrentUser() : null) ||
    fallbackUser ||
    state?.currentUser;

  if (!activeSessionUser || !activeSessionUser.id) {
    isListingSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtnText) submitBtnText.textContent = originalText;
    }
    showToast("Silakan masuk akun terlebih dahulu.", "error");
    return openModal("modal-auth");
  }

  const listingPayload = {
    title: title,
    category: category,
    condition: condition,
    price: price,
    negoType: negoType,
    nego_type: negoType,
    paymentMethod: paymentMethod,
    payment_method: paymentMethod || "cod",
    storeMapsUrl: storeMapsUrl,
    store_maps_url: storeMapsUrl || "",
    is_bu: isBuChecked,
    isBu: isBuChecked,
    bu_expires_at: null,
    qris_verified: isQrisVerified,
    regionId: regionId,
    region: regionId,
    district: district,
    codPoint: codPoint,
    cod_point: codPoint || "",
    description: description,
    images: finalImages,
    seller_id: activeSessionUser.id,
    seller: {
      id: activeSessionUser.id,
      name:
        activeSessionUser.storeName || activeSessionUser.name || "Penjual",
      storeName:
        activeSessionUser.storeName || activeSessionUser.name || "Penjual",
      phone: activeSessionUser.phone || "",
      avatar: activeSessionUser.avatar || "",
      region: activeSessionUser.region || regionId,
    },
  };

  if (window.isDraftBu) {
    listingPayload.payment_amount = window.currentBuPaymentAmount || 500;
    listingPayload.payment_status = "pending";
    listingPayload.status = "pending";
  }

  try {
    let savedOrUpdatedItem = null;
    if (
      ((savedOrUpdatedItem = editId
        ? updateListing(editId, listingPayload)
        : saveListing(listingPayload)),
      window.isDraftBu && savedOrUpdatedItem && savedOrUpdatedItem.id)
    ) {
      const listingId = savedOrUpdatedItem.id,
        finalAmount = window.currentBuPaymentAmount || 500;
      window.isDraftBu = false;
      window.location.href = `pembayaran-qris.html?listing_id=${listingId}&amount=${finalAmount}`;
      return;
    }

    if (editId) {
      if (isBuChecked) triggerBuNotification(editId, category);
      if (activeSessionUser && activeSessionUser.id && category) {
        try {
          updateUserInterest(activeSessionUser.id, category);
        } catch (e) {}
      }
      closeModal("modal-create-listing");
      renderRegionPills();
      renderCategoryPills();
      renderListings();
      renderMyListings();
      showToast(
        "Iklan berhasil diperbarui dengan foto rasio 1:1 (Persegi)!",
        "success",
      );
      if (savedOrUpdatedItem && typeof window.openProductDetail === "function") {
        setTimeout(() => window.openProductDetail(savedOrUpdatedItem.id), 400);
      }
    } else {
      if (isBuChecked && savedOrUpdatedItem) {
        triggerBuNotification(savedOrUpdatedItem.id, category);
      }
      if (activeSessionUser && activeSessionUser.id && category) {
        try {
          updateUserInterest(activeSessionUser.id, category);
        } catch (e) {}
      }
      closeModal("modal-create-listing");
      renderRegionPills();
      renderCategoryPills();
      renderListings();
      renderMyListings();
      showToast(
        "Iklan Anda berhasil dipasang dengan foto rasio 1:1 (Persegi) dan tayang di Solo Raya!",
        "success",
      );
      if (savedOrUpdatedItem && typeof window.openProductDetail === "function") {
        setTimeout(() => window.openProductDetail(savedOrUpdatedItem.id), 400);
      }
    }
  } catch (err) {
    showToast(err.message || "Gagal memasang iklan", "error");
  } finally {
    isListingSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtnText) submitBtnText.textContent = originalText;
    }
  }
}
