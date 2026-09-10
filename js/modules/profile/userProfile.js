import { refreshIcons } from "../../utils/runtime.js";
import { getCurrentUser, fetchFreshCurrentUserFromSupabase, formatJoinedDate } from "../../services/auth.js";
import { getMyListings, getSellerStats } from "../../services/storage.js";
import { getRegionById } from "../../data/regions.js";
import { openModal, showToast } from "../../utils/modalRouter.js";
import { openUserAuthModal } from "../auth/authUI.js";

export let isProfileEditMode = false;
export let isProfileModuleInitialized = false;
export let userProfileAvatarData = null;
export let pendingAvatarFile = null;
export let shouldRemoveAvatar = false;

export function setProfileEditMode(isEditing) {
  isProfileEditMode = isEditing;
  const avatarWrapper = document.getElementById("profile-avatar-upload-wrapper");
  const btnEdit = document.getElementById("btn-profile-enable-edit");
  const btnCancel = document.getElementById("btn-profile-cancel-edit");
  const btnSave = document.getElementById("btn-profile-save");
  const passSection = document.getElementById("profile-password-section");
  const inputs = [
    "profile-input-name",
    "profile-input-store-name",
    "profile-input-phone",
    "profile-input-email",
    "profile-input-bio",
    "profile-input-new-password",
    "profile-input-confirm-password",
  ];
  const btnRegion = document.getElementById("btn-open-profile-region-picker");
  const btnDistrict = document.getElementById("btn-open-profile-district-picker");
  const chevronRegion = document.getElementById("profile-region-trigger-chevron");
  const chevronDistrict = document.getElementById("profile-district-trigger-chevron");

  if (isEditing) {
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = false;
        el.readOnly = false;
        el.removeAttribute("disabled");
        el.removeAttribute("readonly");
        el.className =
          "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6";
        if (id === "profile-input-phone" || id === "profile-input-email") {
          el.className =
            "w-full pl-5 pr-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6";
        } else if (id === "profile-input-bio") {
          el.className =
            "w-full px-2 py-0.5 bg-white border border-rose-300 rounded-md text-[10.5px] font-medium text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 min-h-[24px] max-h-[30px]";
        }
      }
    });

    if (btnRegion) {
      btnRegion.disabled = false;
      btnRegion.className =
        "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 cursor-pointer flex items-center justify-between text-left";
    }
    if (btnDistrict) {
      btnDistrict.disabled = false;
      btnDistrict.className =
        "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 cursor-pointer flex items-center justify-between text-left";
    }
    if (chevronRegion) chevronRegion.classList.remove("hidden");
    if (chevronDistrict) chevronDistrict.classList.remove("hidden");

    const state = window.state || {};
    const btnDeleteAvatar = document.getElementById("btn-profile-delete-avatar");
    if (avatarWrapper) avatarWrapper.classList.remove("hidden");
    if (btnDeleteAvatar) {
      if (userProfileAvatarData || (state.currentUser && state.currentUser.avatar)) {
        btnDeleteAvatar.classList.remove("hidden");
      } else {
        btnDeleteAvatar.classList.add("hidden");
      }
    }
    if (passSection) passSection.classList.remove("hidden");
    if (btnEdit) btnEdit.classList.add("hidden");
    if (btnCancel) btnCancel.classList.remove("hidden");
    if (btnSave) btnSave.classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("profile-input-name")?.focus();
    }, 50);
  } else {
    const btnDeleteAvatar = document.getElementById("btn-profile-delete-avatar");
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = true;
        el.readOnly = true;
        el.setAttribute("disabled", "true");
        el.setAttribute("readonly", "true");
        el.className =
          "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6";
        if (id === "profile-input-phone" || id === "profile-input-email") {
          el.className =
            "w-full pl-5 pr-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6";
        } else if (id === "profile-input-bio") {
          el.className =
            "w-full px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-medium text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6 min-h-[24px] max-h-[30px]";
        }
      }
    });

    if (btnRegion) {
      btnRegion.disabled = true;
      btnRegion.className =
        "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed flex items-center justify-between text-left h-6";
    }
    if (btnDistrict) {
      btnDistrict.disabled = true;
      btnDistrict.className =
        "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed flex items-center justify-between text-left h-6";
    }
    if (chevronRegion) chevronRegion.classList.add("hidden");
    if (chevronDistrict) chevronDistrict.classList.add("hidden");
    if (avatarWrapper) avatarWrapper.classList.add("hidden");
    if (btnDeleteAvatar) btnDeleteAvatar.classList.add("hidden");
    if (passSection) passSection.classList.add("hidden");
    if (btnEdit) btnEdit.classList.remove("hidden");
    if (btnCancel) btnCancel.classList.add("hidden");
    if (btnSave) btnSave.classList.add("hidden");
  }

  if (typeof refreshIcons === "function") refreshIcons();
}

export function enableProfileEditMode(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  setProfileEditMode(true);
}

export function cancelProfileEditMode(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const state = window.state || {};
  const user = state.currentUser || getCurrentUser();
  if (user) {
    userProfileAvatarData = user.avatar || null;
    pendingAvatarFile = null;
    shouldRemoveAvatar = false;
    const defaultAvatar =
      "https://api.dicebear.com/7.x/bottts/svg?seed=" +
      encodeURIComponent(user.email || user.id || "user");
    const previewEl = document.getElementById("profile-edit-avatar-preview");
    if (previewEl) previewEl.src = user.avatar || defaultAvatar;

    const nameInput = document.getElementById("profile-input-name");
    const storeNameInput = document.getElementById("profile-input-store-name");
    const phoneInput = document.getElementById("profile-input-phone");
    const emailInput = document.getElementById("profile-input-email");
    const bioInput = document.getElementById("profile-input-bio");
    const newPassInput = document.getElementById("profile-input-new-password");
    const confirmPassInput = document.getElementById("profile-input-confirm-password");

    if (nameInput) nameInput.value = user.name || "";
    if (storeNameInput) storeNameInput.value = user.storeName || user.store_name || user.name || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (emailInput) emailInput.value = user.email || "";
    if (bioInput) bioInput.value = user.bio || "";
    if (newPassInput) newPassInput.value = "";
    if (confirmPassInput) confirmPassInput.value = "";
  }
  setProfileEditMode(false);
}

export function initProfileModule() {
  if (!isProfileModuleInitialized) {
    isProfileModuleInitialized = true;
    try {
      const avatarFileInput = document.getElementById("profile-edit-avatar-file");
      avatarFileInput?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewEl = document.getElementById("profile-edit-avatar-preview");
        const btnDel = document.getElementById("btn-profile-delete-avatar");
        const state = window.state || {};
        if (!(state.currentUser || getCurrentUser())) {
          return showToast("Silakan login terlebih dahulu.", "error");
        }
        shouldRemoveAvatar = false;
        pendingAvatarFile = file;
        const previewUrl = URL.createObjectURL(file);
        userProfileAvatarData = previewUrl;
        if (previewEl) previewEl.src = previewUrl;
        if (btnDel) btnDel.classList.remove("hidden");
        showToast(
          "Foto avatar dipilih untuk preview. Klik 'Simpan Perubahan' untuk mengunggah dan menyimpan profil.",
          "info"
        );
      });

      const btnDeleteAvatar = document.getElementById("btn-profile-delete-avatar");
      if (btnDeleteAvatar && typeof window.handleDeleteProfileAvatar === "function") {
        btnDeleteAvatar.onclick = window.handleDeleteProfileAvatar;
      }
      document
        .getElementById("btn-open-profile-region-picker")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          if (!isProfileEditMode) return;
          if (typeof window.renderProfileRegionPicker === "function") {
            window.renderProfileRegionPicker(
              document.getElementById("profile-input-region")?.value || "solo"
            );
          }
          openModal("modal-profile-region-picker");
        });

      document
        .getElementById("btn-open-profile-district-picker")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          if (!isProfileEditMode) return;
          if (typeof window.renderProfileDistrictPicker === "function") {
            window.renderProfileDistrictPicker(
              document.getElementById("profile-input-region")?.value || "solo",
              document.getElementById("profile-input-district")?.value || ""
            );
          }
          openModal("modal-profile-district-picker");
        });

      const profileForm = document.getElementById("form-user-profile-settings");
      if (profileForm && typeof window.handleSaveProfileSettings === "function") {
        profileForm.onsubmit = window.handleSaveProfileSettings;
      }
      document
        .getElementById("btn-profile-enable-edit")
        ?.addEventListener("click", enableProfileEditMode);
      document
        .getElementById("btn-profile-cancel-edit")
        ?.addEventListener("click", cancelProfileEditMode);

      const btnLogout = document.getElementById("btn-profile-logout");
      if (btnLogout && typeof window.handleProfileLogout === "function") {
        btnLogout.onclick = window.handleProfileLogout;
      }
    } catch (err) {
      console.warn("[ErrorBoundary: initProfileModule]", err);
    }
  }
}

export function openUserProfileModal() {
  try {
    initProfileModule();
    const btnLogout = document.getElementById("btn-profile-logout");
    if (btnLogout && typeof window.handleProfileLogout === "function") {
      btnLogout.onclick = window.handleProfileLogout;
    }
    const state = window.state || {};
    const user = state.currentUser || getCurrentUser();
    if (!user) {
      return openUserAuthModal(
        "login",
        "Silakan masuk atau daftar akun terlebih dahulu untuk mengatur profil."
      );
    }
    state.currentUser = user;
    userProfileAvatarData = user.avatar || null;
    const defaultAvatar =
      "https://api.dicebear.com/7.x/bottts/svg?seed=" +
      encodeURIComponent(user.email || user.id || "user");
    const avatarPreview = document.getElementById("profile-edit-avatar-preview");
    const namePreview = document.getElementById("profile-edit-name-preview");
    const joinedPreview = document.getElementById("profile-edit-joined-preview");

    if (avatarPreview) avatarPreview.src = user.avatar || defaultAvatar;
    if (namePreview) namePreview.textContent = user.storeName || user.name || "Pengguna";

    const rawCreatedAt = user.created_at || user.createdAt;
    if (joinedPreview)
      joinedPreview.textContent = `Bergabung: ${formatJoinedDate(rawCreatedAt)}`;

    const nameInput = document.getElementById("profile-input-name");
    const storeNameInput = document.getElementById("profile-input-store-name");
    const phoneInput = document.getElementById("profile-input-phone");
    const emailInput = document.getElementById("profile-input-email");
    const bioInput = document.getElementById("profile-input-bio");
    const newPassInput = document.getElementById("profile-input-new-password");
    const confirmPassInput = document.getElementById("profile-input-confirm-password");

    if (nameInput) nameInput.value = user.name || "";
    if (storeNameInput) storeNameInput.value = user.storeName || user.store_name || user.name || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (emailInput) emailInput.value = user.email || "";
    if (bioInput) bioInput.value = user.bio || "";
    if (newPassInput) newPassInput.value = "";
    if (confirmPassInput) confirmPassInput.value = "";

    if (typeof window.selectProfileRegion === "function") {
      window.selectProfileRegion(user.region || "solo", user.district);
    }
    setProfileEditMode(false);
    openModal("modal-user-profile");

    fetchFreshCurrentUserFromSupabase()
      .then((fresh) => {
        if (fresh) {
          state.currentUser = fresh;
          userProfileAvatarData = fresh.avatar || null;
          if (avatarPreview && fresh.avatar) avatarPreview.src = fresh.avatar;
          if (namePreview) {
            namePreview.textContent =
              fresh.storeName || fresh.store_name || fresh.name || "Pengguna";
          }
          const freshCreatedAt = fresh.created_at || fresh.createdAt;
          if (joinedPreview) {
            joinedPreview.textContent = `Bergabung: ${formatJoinedDate(freshCreatedAt)}`;
          }
          if (nameInput) nameInput.value = fresh.name || "";
          if (storeNameInput) storeNameInput.value = fresh.storeName || fresh.store_name || fresh.name || "";
          if (phoneInput) phoneInput.value = fresh.phone || "";
          if (emailInput) emailInput.value = fresh.email || "";
          if (bioInput) bioInput.value = fresh.bio || "";
          if (typeof window.selectProfileRegion === "function") {
            window.selectProfileRegion(fresh.region || "solo", fresh.district);
          }
        }
      })
      .catch(() => {});
  } catch (err) {
    console.warn("[ErrorBoundary: openUserProfileModal]", err);
  }
}

export function renderMyListings(filter = "all") {
  const container = document.getElementById("my-listings-container");
  const emptyView = document.getElementById("my-listings-empty");
  const state = window.state || {};
  const user = state.currentUser;
  if (!container || !user) return;
  const myListings = getMyListings(user.id);
  const stats = getSellerStats(user.id);
  const statTotal = document.getElementById("my-stat-total");
  const statAvailable = document.getElementById("my-stat-available");
  const statBooked = document.getElementById("my-stat-booked");
  const statSold = document.getElementById("my-stat-sold");
  const soldCountText = document.getElementById("my-store-sold-count-text");

  if (statTotal) statTotal.textContent = stats.totalListings;
  if (statAvailable) statAvailable.textContent = stats.availableCount;
  if (statBooked) statBooked.textContent = stats.bookedCount;
  if (statSold) statSold.textContent = stats.soldCount;
  if (soldCountText) soldCountText.textContent = `${stats.soldCount} Terjual`;

  let displayListings = myListings;
  if (filter === "available") {
    displayListings = myListings.filter(
      (l) => !l.isSold && "sold" !== l.status && "booked" !== l.status
    );
  } else if (filter === "booked") {
    displayListings = myListings.filter((l) => "booked" === l.status);
  } else if (filter === "sold") {
    displayListings = myListings.filter((l) => l.isSold || "sold" === l.status);
  }

  if (displayListings.length === 0) {
    container.innerHTML = "";
    emptyView?.classList.remove("hidden");
    return;
  }

  emptyView?.classList.add("hidden");
  let html = "";
  displayListings.forEach((item) => {
    const region = getRegionById(item.regionId);
    const regionName = region ? region.shortName : item.regionId;
    const itemStatus = item.status || (item.isSold ? "sold" : "available");
    let statusBadgeHtml = "";
    let statusBorderColor = "border-slate-200";

    if (itemStatus === "sold") {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-600 text-white shadow-xs tracking-wider">
          <i data-lucide="check-circle-2" class="w-3 h-3"></i>
          <span>TERJUAL</span>
        </span>
      `;
      statusBorderColor = "border-rose-200 bg-rose-50/20";
    } else if (itemStatus === "booked") {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white shadow-xs tracking-wider">
          <i data-lucide="clock" class="w-3 h-3"></i>
          <span>BOOKED</span>
        </span>
      `;
      statusBorderColor = "border-amber-200 bg-amber-50/20";
    } else {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-xs tracking-wider">
          <i data-lucide="tag" class="w-3 h-3"></i>
          <span>AKTIF</span>
        </span>
      `;
    }

    const firstImg =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : "/assets/img/app-logo.png?v=2.1";

    html += `
      <div class="my-listing-card bg-white rounded-2xl border ${statusBorderColor} p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div class="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
          <img src="${firstImg}" alt="${item.title}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0" onerror="this.src='/assets/img/app-logo.png?v=2.1'">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              ${statusBadgeHtml}
              <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">${regionName}</span>
            </div>
            <h4 class="font-extrabold text-sm sm:text-base text-slate-900 truncate">${item.title}</h4>
            <p class="font-black text-rose-900 text-sm mt-0.5">Rp ${(item.price || 0).toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (typeof refreshIcons === "function") refreshIcons();
}

if (typeof window !== "undefined") {
  window.setProfileEditMode = setProfileEditMode;
  window.enableProfileEditMode = enableProfileEditMode;
  window.cancelProfileEditMode = cancelProfileEditMode;
  window.initProfileModule = initProfileModule;
  window.openUserProfileModal = openUserProfileModal;
  window.renderMyListings = renderMyListings;
}
