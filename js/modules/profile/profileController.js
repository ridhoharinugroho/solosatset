import {
  getCurrentUser,
  updateProfile,
  removeUserAvatar,
  logout,
  fetchFreshCurrentUserFromSupabase,
  formatJoinedDate,
} from "../../services/auth.js";
import { sbUploadAvatar } from "../../services/supabaseDB.js";
import { fetchAppReviewsFromSupabase } from "../../services/storage.js";
import { supabase } from "../../lib/supabase.js";
import { refreshIcons, formatRegionTitle, formatDistrictTitle } from "../../utils/runtime.js";
import { showToast } from "../common/toast.js";
import { openModal, closeModal } from "../common/modalManager.js";
import { setProfileEditMode, isProfileEditMode } from "./profileEditModeUI.js";
import { selectProfileRegion, renderProfileRegionPicker, renderProfileDistrictPicker } from "./regionPickers.js";

export { setProfileEditMode, isProfileEditMode };
export let userProfileAvatarData = null;
export let pendingAvatarFile = null;
export let shouldRemoveAvatar = false;
let isSavingProfile = false;
let isProfileModuleInitialized = false;

export function enableProfileEditMode(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  setProfileEditMode(true, { userProfileAvatarData });
}

export function cancelProfileEditMode(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const user = getCurrentUser();
  if (user) {
    const nameInput = document.getElementById("profile-input-name");
    const storeNameInput = document.getElementById("profile-input-store-name");
    const phoneInput = document.getElementById("profile-input-phone");
    const emailInput = document.getElementById("profile-input-email");
    const bioInput = document.getElementById("profile-input-bio");
    const newPassInput = document.getElementById("profile-input-new-password");
    const confirmPassInput = document.getElementById("profile-input-confirm-password");

    if (nameInput) nameInput.value = user.name || "";
    if (storeNameInput) storeNameInput.value = user.storeName || user.name || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (emailInput) emailInput.value = user.email || "";
    if (bioInput) bioInput.value = user.bio || "";
    if (newPassInput) newPassInput.value = "";
    if (confirmPassInput) confirmPassInput.value = "";
    userProfileAvatarData = user.avatar || null;
    const defaultAvatar =
      "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(user.email || user.id || "user");
    const avatarPreview = document.getElementById("profile-edit-avatar-preview");
    if (avatarPreview) avatarPreview.src = user.avatar || defaultAvatar;
    selectProfileRegion(user.region || "solo", user.district);
  }
  setProfileEditMode(false);
}

export async function handleSaveProfileSettings(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }

  if (isSavingProfile) return;
  isSavingProfile = true;

  const btnSave = document.getElementById("btn-profile-save") || document.getElementById("btn-save-profile-settings");
  const originalSaveHtml = btnSave ? btnSave.innerHTML : "";

  try {
    const nameInput = document.getElementById("profile-input-name");
    const storeNameInput = document.getElementById("profile-input-store-name");
    const phoneInput = document.getElementById("profile-input-phone");
    const emailInput = document.getElementById("profile-input-email");
    const regionInput = document.getElementById("profile-input-region");
    const districtInput = document.getElementById("profile-input-district");
    const bioInput = document.getElementById("profile-input-bio");
    const newPassInput = document.getElementById("profile-input-new-password");
    const confirmPassInput = document.getElementById("profile-input-confirm-password");

    const nameVal = nameInput ? nameInput.value.trim() : "";
    const storeNameVal = storeNameInput ? storeNameInput.value.trim() : "";
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    const emailVal = emailInput ? emailInput.value.trim() : "";
    const regionVal = regionInput ? regionInput.value : "solo";
    const districtVal = districtInput ? districtInput.value : "Banjarsari";
    const bioVal = bioInput ? bioInput.value.trim() : "";
    const newPass = newPassInput ? newPassInput.value : "";
    const confirmPass = confirmPassInput ? confirmPassInput.value : "";

    if (!nameVal) {
      showToast("Nama lengkap wajib diisi.", "error");
      nameInput?.focus();
      return;
    }

    if (!phoneVal) {
      showToast("Nomor WhatsApp wajib diisi.", "error");
      phoneInput?.focus();
      return;
    }

    if (newPass) {
      if (newPass.length < 5) {
        showToast("Password baru minimal 5 karakter.", "error");
        newPassInput?.focus();
        return;
      }
      if (newPass !== confirmPass) {
        showToast("Konfirmasi password baru tidak cocok.", "error");
        confirmPassInput?.focus();
        return;
      }
    }

    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Menyimpan...</span>`;
      refreshIcons();
    }

    let finalAvatar = userProfileAvatarData;
    const currentUser = getCurrentUser();

    if (shouldRemoveAvatar) {
      try {
        showToast("Menghapus foto avatar lama dari Supabase Storage & database...", "info");
        const targetUserId = currentUser?.id;
        await removeUserAvatar(targetUserId);
        finalAvatar = null;
        userProfileAvatarData = null;
        pendingAvatarFile = null;
        shouldRemoveAvatar = false;
      } catch (remErr) {
        console.warn("[handleSaveProfileSettings Avatar Remove Error]", remErr);
        finalAvatar = null;
      }
    } else if (pendingAvatarFile) {
      try {
        showToast("Mengunggah foto avatar baru ke Supabase Storage...", "info");
        const uploadedUrl = await sbUploadAvatar(pendingAvatarFile);
        if (uploadedUrl && (uploadedUrl.startsWith("http://") || uploadedUrl.startsWith("https://"))) {
          finalAvatar = uploadedUrl;
          userProfileAvatarData = uploadedUrl;
          pendingAvatarFile = null;
        } else {
          showToast("Gagal mengunggah foto avatar ke Storage, menggunakan foto sebelumnya.", "warning");
          finalAvatar = currentUser?.avatar || null;
        }
      } catch (upErr) {
        console.warn("[handleSaveProfileSettings Avatar Upload Error]", upErr);
        finalAvatar = currentUser?.avatar || null;
      }
    }

    const updated = await updateProfile({
      name: nameVal,
      storeName: storeNameVal || nameVal,
      phone: phoneVal,
      email: emailVal,
      region: regionVal,
      district: districtVal,
      bio: bioVal,
      avatar: finalAvatar,
      newPassword: newPass,
    });

    const avatarPreview = document.getElementById("profile-edit-avatar-preview");
    const namePreview = document.getElementById("profile-edit-name-preview");
    if (avatarPreview && updated.avatar) avatarPreview.src = updated.avatar;
    if (namePreview) namePreview.textContent = updated.storeName || updated.name || "Pengguna";

    setProfileEditMode(false);

    if (supabase && updated && updated.id) {
      const newRegion = formatDistrictTitle(updated.district) || formatRegionTitle(updated.region) || "Solo";
      const rawFullName = (updated.name || updated.storeName || updated.store_name || "Pengguna").trim();
      const firstName = rawFullName.split(/\s+/)[0] || "Pengguna";
      const newStoreName = `${firstName} ${newRegion}`.trim();
      const currentUserId = updated.id;

      try {
        await supabase
          .from("app_reviews")
          .update({
            user_location: newRegion,
            user_name: newStoreName,
          })
          .eq("user_id", currentUserId);
      } catch (errSync) {
        console.warn("[handleSaveProfileSettings] Supabase app_reviews update exception:", errSync);
      }
    }

    try {
      if (typeof window.renderAuthNav === "function") window.renderAuthNav();
      if (typeof fetchAppReviewsFromSupabase === "function") {
        fetchAppReviewsFromSupabase().catch(() => {});
      }
    } catch (rErr) {
      console.warn("UI render error:", rErr);
    }

    showToast("Profil dan pengaturan akun berhasil disimpan", "success");
  } catch (err) {
    console.error("[handleSaveProfileSettings Error]", err);
    showToast(err.message || "Gagal menyimpan perubahan profil.", "error");
  } finally {
    isSavingProfile = false;
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML =
        originalSaveHtml ||
        `<i data-lucide="check" class="w-3.5 h-3.5 text-amber-300"></i><span>Simpan Perubahan</span>`;
      refreshIcons();
    }
  }
}

export async function handleProfileLogout(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }

  try {
    closeModal("modal-user-profile");
    closeModal("modal-my-listings");
    closeModal("modal-user-auth");
    document.getElementById("header-user-dropdown-menu")?.classList.add("hidden");
  } catch (err) {}

  try {
    sessionStorage.clear();
  } catch (err) {}

  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const reg of registrations) {
            reg.unregister().catch(() => {});
          }
        })
        .catch(() => {});
    }
    if (typeof window !== "undefined" && "caches" in window) {
      caches
        .keys()
        .then((keys) => {
          return Promise.all(keys.map((k) => caches.delete(k)));
        })
        .catch(() => {});
    }
  // eslint-disable-next-line no-unused-vars
  } catch (swErr) {}

  try {
    if (typeof logout === "function") {
      await logout();
    }
  } catch (err) {}

  try {
    if (typeof window.cleanupNotificationsRealtime === "function") {
      window.cleanupNotificationsRealtime();
    }
  } catch (err) {}

  try {
    showToast("Anda telah berhasil keluar dari akun.", "info");
  } catch (err) {}

  window.location.href = `index.html?logout=1&t=${Date.now()}`;
}

export async function handleDeleteProfileAvatar(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }

  const user = getCurrentUser();
  if (!user) return;

  const defaultAvatar =
    "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(user.email || user.id || "user");
  shouldRemoveAvatar = true;
  pendingAvatarFile = null;
  userProfileAvatarData = null;

  const avatarPreview = document.getElementById("profile-edit-avatar-preview");
  if (avatarPreview) avatarPreview.src = defaultAvatar;

  const headerAvatar = document.getElementById("header-user-avatar-img");
  if (headerAvatar) headerAvatar.src = defaultAvatar;

  const storeAvatar = document.getElementById("my-store-avatar");
  if (storeAvatar) storeAvatar.src = defaultAvatar;

  const formSellerAvatar = document.getElementById("form-seller-avatar");
  if (formSellerAvatar) formSellerAvatar.src = defaultAvatar;

  const fileInput = document.getElementById("profile-edit-avatar-file");
  if (fileInput) fileInput.value = "";

  const btnDeleteAvatar = document.getElementById("btn-profile-delete-avatar");
  if (btnDeleteAvatar) btnDeleteAvatar.classList.add("hidden");

  showToast("Foto avatar dilepas dari pratinjau. Klik 'Simpan Perubahan' untuk mengonfirmasi.", "info");
}

export function initProfileModule() {
  if (isProfileModuleInitialized) return;
  isProfileModuleInitialized = true;

  try {
    const avatarFileInput = document.getElementById("profile-edit-avatar-file");
    avatarFileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const previewEl = document.getElementById("profile-edit-avatar-preview");
      const btnDel = document.getElementById("btn-profile-delete-avatar");

      const user = getCurrentUser();
      if (!user) {
        showToast("Silakan login terlebih dahulu.", "error");
        return;
      }

      shouldRemoveAvatar = false;
      pendingAvatarFile = file;
      const previewUrl = URL.createObjectURL(file);
      userProfileAvatarData = previewUrl;

      if (previewEl) previewEl.src = previewUrl;
      if (btnDel) btnDel.classList.remove("hidden");

      showToast("Foto avatar dipilih untuk preview. Klik 'Simpan Perubahan' untuk mengunggah.", "info");
    });

    const btnDeleteAvatar = document.getElementById("btn-profile-delete-avatar");
    if (btnDeleteAvatar) {
      btnDeleteAvatar.onclick = handleDeleteProfileAvatar;
    }

    document.getElementById("btn-open-profile-region-picker")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isProfileEditMode) return;
      const currentRegId = document.getElementById("profile-input-region")?.value || "solo";
      renderProfileRegionPicker(currentRegId);
      openModal("modal-profile-region-picker");
    });

    document.getElementById("btn-open-profile-district-picker")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isProfileEditMode) return;
      const currentRegId = document.getElementById("profile-input-region")?.value || "solo";
      const currentDistrict = document.getElementById("profile-input-district")?.value || "";
      renderProfileDistrictPicker(currentRegId, currentDistrict);
      openModal("modal-profile-district-picker");
    });

    const profileForm = document.getElementById("form-user-profile-settings");
    if (profileForm) {
      profileForm.onsubmit = handleSaveProfileSettings;
    }

    document.getElementById("btn-profile-enable-edit")?.addEventListener("click", enableProfileEditMode);
    document.getElementById("btn-profile-cancel-edit")?.addEventListener("click", cancelProfileEditMode);

    const btnLogout = document.getElementById("btn-profile-logout");
    if (btnLogout) {
      btnLogout.onclick = handleProfileLogout;
    }
  } catch (err) {
    console.warn("[ErrorBoundary: initProfileModule]", err);
  }
}

export function openUserProfileModal() {
  try {
    initProfileModule();
    const btnLogout = document.getElementById("btn-profile-logout");
    if (btnLogout) {
      btnLogout.onclick = handleProfileLogout;
    }

    const user = getCurrentUser();
    if (!user) {
      if (typeof window.openUserAuthModal === "function") {
        window.openUserAuthModal("login", "Silakan masuk atau daftar akun terlebih dahulu untuk mengatur profil.");
      } else {
        openModal("modal-user-auth");
      }
      return;
    }

    userProfileAvatarData = user.avatar || null;
    const defaultAvatar =
      "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(user.email || user.id || "user");
    const avatarPreview = document.getElementById("profile-edit-avatar-preview");
    const namePreview = document.getElementById("profile-edit-name-preview");
    const joinedPreview = document.getElementById("profile-edit-joined-preview");

    if (avatarPreview) avatarPreview.src = user.avatar || defaultAvatar;
    if (namePreview) namePreview.textContent = user.storeName || user.name || "Pengguna";

    const rawCreatedAt = user.created_at || user.createdAt;
    if (joinedPreview) joinedPreview.textContent = `Bergabung: ${formatJoinedDate(rawCreatedAt)}`;

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

    selectProfileRegion(user.region || "solo", user.district);
    setProfileEditMode(false);
    openModal("modal-user-profile");

    fetchFreshCurrentUserFromSupabase()
      .then((fresh) => {
        if (fresh) {
          userProfileAvatarData = fresh.avatar || null;
          if (avatarPreview && fresh.avatar) avatarPreview.src = fresh.avatar;
          if (namePreview) namePreview.textContent = fresh.storeName || fresh.store_name || fresh.name || "Pengguna";

          const freshCreatedAt = fresh.created_at || fresh.createdAt;
          if (joinedPreview) {
            joinedPreview.textContent = `Bergabung: ${formatJoinedDate(freshCreatedAt)}`;
          }

          if (nameInput) nameInput.value = fresh.name || "";
          if (storeNameInput) storeNameInput.value = fresh.storeName || fresh.store_name || fresh.name || "";
          if (phoneInput) phoneInput.value = fresh.phone || "";
          if (emailInput) emailInput.value = fresh.email || "";
          if (bioInput) bioInput.value = fresh.bio || "";
          selectProfileRegion(fresh.region || "solo", fresh.district);
        }
      })
      .catch(() => {});
  } catch (err) {
    console.warn("[ErrorBoundary: openUserProfileModal]", err);
  }
}

if (typeof window !== "undefined") {
  window.setProfileEditMode = setProfileEditMode;
  window.enableProfileEditMode = enableProfileEditMode;
  window.cancelProfileEditMode = cancelProfileEditMode;
  window.handleSaveProfileSettings = handleSaveProfileSettings;
  window.handleProfileLogout = handleProfileLogout;
  window.handleDeleteProfileAvatar = handleDeleteProfileAvatar;
  window.initProfileModule = initProfileModule;
  window.openUserProfileModal = openUserProfileModal;
}
