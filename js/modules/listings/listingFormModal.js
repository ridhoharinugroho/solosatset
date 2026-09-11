import { getCurrentUser, isUserLoggedIn } from "../../services/auth.js";
import { getListingById, getAllListings } from "../../services/storage.js";
import { formatDisplayPhone } from "../../services/whatsapp.js";
import { refreshIcons } from "../../utils/runtime.js";
import { supabase } from "../../lib/supabase.js";
import { showToast } from "../common/toast.js";
import { openModal, closeModal } from "../common/modalManager.js";
import {
  FORM_CATEGORY_META,
  FORM_CONDITION_META,
  FORM_NEGO_META,
  FORM_PAYMENT_METHOD_META,
  selectFormCategory,
  selectFormCondition,
  selectFormNego,
  selectFormPaymentMethod,
  selectFormRegion,
  selectFormDistrict,
  renderDistrictPickerOptions,
} from "./listingFormPickers.js";

export {
  FORM_CATEGORY_META,
  FORM_CONDITION_META,
  FORM_NEGO_META,
  FORM_PAYMENT_METHOD_META,
  selectFormCategory,
  selectFormCondition,
  selectFormNego,
  selectFormPaymentMethod,
  selectFormRegion,
  selectFormDistrict,
  renderDistrictPickerOptions,
};

let formUploadedImages = [];
let editingListingId = null;

export function openEditListingModal(listingId) {
  return openCreateListingModal(listingId);
}

export function updateCreateListingSellerInfo() {
  const user = getCurrentUser();
  const sellerNameEl = document.getElementById("form-seller-name-preview");
  const sellerPhoneEl = document.getElementById("form-seller-phone-preview");
  if (sellerNameEl && user) sellerNameEl.textContent = user.storeName || user.name || "Penjual";
  if (sellerPhoneEl && user) sellerPhoneEl.textContent = user.phone || "";
}

export function openCreateListingModal(editListingId = null) {
  if (!isUserLoggedIn()) {
    if (typeof window.openUserAuthModal === "function") {
      window.openUserAuthModal(
        "login",
        "Silakan masuk atau daftar akun terlebih dahulu untuk memasang pasang iklan gratis!",
      );
    } else {
      openModal("modal-user-auth");
    }
    return;
  }

  const currentUser = getCurrentUser();
  editingListingId = editListingId;
  formUploadedImages = [];

  const modalTitle = document.getElementById("listing-form-modal-title");
  const submitBtnText = document.getElementById("listing-form-submit-text");

  const inputTitle = document.getElementById("form-input-title");
  const inputPrice = document.getElementById("form-input-price");
  const inputDesc = document.getElementById("form-input-desc");
  const inputCodPoint = document.getElementById("form-input-cod-point");
  const inputMapsUrl = document.getElementById("form-input-maps-url");
  const inputSellerName = document.getElementById("form-input-seller-name");
  const inputSellerPhone = document.getElementById("form-input-seller-phone");
  // eslint-disable-next-line no-unused-vars
  const previewContainer = document.getElementById("form-image-previews");
  const formBuCheckbox = document.getElementById("form-checkbox-bu");

  if (modalTitle) modalTitle.textContent = editListingId ? "Edit Iklan Barang" : "Pasang Iklan Barang Gratis";
  if (submitBtnText) submitBtnText.textContent = editListingId ? "Simpan Perubahan Iklan" : "Tayangkan Iklan Sekarang";

  if (editListingId) {
    const listing = getListingById(editListingId);
    if (listing) {
      if (inputTitle) inputTitle.value = listing.title || "";
      if (inputPrice) inputPrice.value = listing.price || "";
      if (inputDesc) inputDesc.value = listing.description || "";
      if (inputCodPoint) inputCodPoint.value = listing.codPoint || "";
      if (inputMapsUrl) inputMapsUrl.value = listing.storeMapsUrl || "";
      if (formBuCheckbox) formBuCheckbox.checked = Boolean(listing.is_bu || listing.isBu);

      selectFormCategory(listing.category);
      selectFormCondition(listing.condition);
      selectFormNego(listing.negoType);
      selectFormPaymentMethod(listing.paymentMethod || "cod");
      selectFormRegion(listing.regionId);
      if (listing.district) selectFormDistrict(listing.district);

      if (Array.isArray(listing.images)) {
        formUploadedImages = [...listing.images];
      }
    }
  } else {
    if (inputTitle) inputTitle.value = "";
    if (inputPrice) inputPrice.value = "";
    if (inputDesc) inputDesc.value = "";
    if (inputCodPoint) inputCodPoint.value = "";
    if (inputMapsUrl) inputMapsUrl.value = "";
    if (formBuCheckbox) formBuCheckbox.checked = false;

    selectFormCategory("elektronik");
    selectFormCondition("good");
    selectFormNego("nego_alus");
    selectFormPaymentMethod("cod");

    const defaultRegion = currentUser?.region || "surakarta";
    selectFormRegion(defaultRegion);
    if (currentUser?.district) selectFormDistrict(currentUser.district);
  }

  if (inputSellerName) inputSellerName.value = currentUser?.storeName || currentUser?.name || "";
  if (inputSellerPhone) inputSellerPhone.value = formatDisplayPhone(currentUser?.phone || "");

  renderImagePreviews();

  const fileInput = document.getElementById("form-file-input-image");
  if (fileInput) {
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (formUploadedImages.length + files.length > 5) {
        showToast("Maksimal 5 foto per iklan barang.", "error");
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          formUploadedImages.push(evt.target.result);
          renderImagePreviews();
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = "";
    };
  }

  const formEl = document.getElementById("form-create-listing");
  if (formEl) {
    formEl.onsubmit = (e) => {
      e.preventDefault();
      handleSaveListing();
    };
  }

  openModal("modal-create-listing");
  try {
    refreshIcons();
  } catch (_e) {}
}

export function renderImagePreviews() {
  const container = document.getElementById("form-image-previews");
  const countEl = document.getElementById("form-image-count");
  if (!container) return;

  if (countEl) countEl.textContent = `${formUploadedImages.length}/5 Foto`;

  let html = "";
  formUploadedImages.forEach((imgUrl, idx) => {
    html += `
      <div class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-rose-200 shadow-2xs group flex-shrink-0">
        <img src="${imgUrl}" alt="Preview Foto ${idx + 1}" class="w-full h-full object-cover">
        <button
          type="button"
          data-img-index="${idx}"
          class="btn-remove-form-img absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-900/80 text-white flex items-center justify-center shadow hover:bg-rose-900 transition-all cursor-pointer"
        >
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
        ${
          idx === 0
            ? `
          <span class="absolute bottom-1 left-1 right-1 bg-slate-900/80 text-white font-extrabold text-[8.5px] px-1 py-0.5 rounded text-center backdrop-blur-xs">
            FOTO UTAMA
          </span>
        `
            : ""
        }
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll(".btn-remove-form-img").forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-img-index"), 10);
      formUploadedImages.splice(idx, 1);
      renderImagePreviews();
    };
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export async function handleSaveListing() {
  const title = document.getElementById("form-input-title")?.value?.trim();
  const priceRaw = document.getElementById("form-input-price")?.value;
  const desc = document.getElementById("form-input-desc")?.value?.trim();
  const category = document.getElementById("form-input-category")?.value;
  const condition = document.getElementById("form-input-condition")?.value;
  const negoType = document.getElementById("form-input-nego")?.value;
  const paymentMethod = document.getElementById("form-input-payment-method")?.value || "cod";
  const regionId = document.getElementById("form-input-region")?.value;
  const district = document.getElementById("form-input-district")?.value;
  const codPoint = document.getElementById("form-input-cod-point")?.value?.trim();
  const storeMapsUrl = document.getElementById("form-input-maps-url")?.value?.trim();
  const sellerName = document.getElementById("form-input-seller-name")?.value?.trim();
  const sellerPhone = document.getElementById("form-input-seller-phone")?.value?.trim();
  const isBu = Boolean(document.getElementById("form-checkbox-bu")?.checked);

  if (!title) return showToast("Judul iklan barang wajib diisi.", "error");
  if (!priceRaw || isNaN(priceRaw) || Number(priceRaw) < 0) return showToast("Harga barang tidak valid.", "error");
  if (!desc) return showToast("Deskripsi kondisi barang wajib diisi.", "error");
  if (formUploadedImages.length === 0) return showToast("Wajib melampirkan minimal 1 foto barang.", "error");

  const currentUser = getCurrentUser();
  const price = Number(priceRaw);

  const listingData = {
    id: editingListingId || `barkas-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    price,
    description: desc,
    category,
    condition,
    negoType,
    paymentMethod,
    regionId,
    district,
    codPoint,
    storeMapsUrl,
    is_bu: isBu,
    isBu,
    images: formUploadedImages,
    createdAt: editingListingId
      ? getListingById(editingListingId)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
    views: editingListingId ? getListingById(editingListingId)?.views || 0 : 0,
    isSold: editingListingId ? getListingById(editingListingId)?.isSold || false : false,
    status: editingListingId ? getListingById(editingListingId)?.status || "available" : "available",
    seller: {
      id: currentUser?.id || "demo-seller",
      storeName: sellerName || currentUser?.storeName || currentUser?.name || "Toko Solo",
      name: sellerName || currentUser?.name || "Penjual",
      phone: sellerPhone || currentUser?.phone || "081234567890",
      avatar:
        currentUser?.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      region: regionId,
      district: district,
    },
  };

  try {
    if (typeof window.saveListingToStorage === "function") {
      window.saveListingToStorage(listingData);
    } else {
      const listings = getAllListings();
      const existingIdx = listings.findIndex((l) => l.id === listingData.id);
      if (existingIdx >= 0) {
        listings[existingIdx] = listingData;
      } else {
        listings.unshift(listingData);
      }
      localStorage.setItem("pusat_barkas_listings", JSON.stringify(listings));
    }

    if (supabase) {
      try {
        await supabase.from("listings").upsert([
          {
            id: listingData.id,
            user_id: currentUser?.id,
            title: listingData.title,
            price: listingData.price,
            description: listingData.description,
            category: listingData.category,
            condition: listingData.condition,
            nego_type: listingData.negoType,
            payment_method: listingData.paymentMethod,
            region_id: listingData.regionId,
            district: listingData.district,
            cod_point: listingData.codPoint,
            store_maps_url: listingData.storeMapsUrl,
            is_bu: listingData.is_bu,
            images: listingData.images,
            views: listingData.views,
            is_sold: listingData.isSold,
            status: listingData.status,
          },
        ]);
      } catch (err) {
        console.warn("[Supabase Listing Sync Warn]", err);
      }
    }

    closeModal("modal-create-listing");
    showToast(editingListingId ? "Iklan berhasil diperbarui! 🎉" : "Iklan Anda berhasil ditayangkan! 🎉", "success");

    if (typeof window.renderListings === "function") {
      window.renderListings();
    }
  } catch (err) {
    showToast("Gagal menyimpan iklan: " + err.message, "error");
  }
}

if (typeof window !== "undefined") {
  window.openCreateListingModal = openCreateListingModal;
  window.openEditListingModal = openEditListingModal;
  window.selectFormCategory = selectFormCategory;
  window.selectFormCondition = selectFormCondition;
  window.selectFormNego = selectFormNego;
  window.selectFormPaymentMethod = selectFormPaymentMethod;
  window.selectFormRegion = selectFormRegion;
  window.selectFormDistrict = selectFormDistrict;
  window.renderDistrictPickerOptions = renderDistrictPickerOptions;
}
