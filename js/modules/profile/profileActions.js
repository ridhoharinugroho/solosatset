import { getCurrentUser, removeUserAvatar, updateProfile, logout } from "../../services/auth.js";
import { sbUploadAvatar } from "../../services/supabaseDB.js";
import { showToast } from "../../utils/modalRouter.js";
import { closeModal } from "../../utils/modalRouter.js";
import { refreshIcons, formatDistrictTitle, formatRegionTitle } from "../../utils/runtime.js";
import { supabase } from "../../lib/supabase.js";

let isSavingProfile = false;
let userProfileAvatarData = null;
let pendingAvatarFile = null;
let shouldRemoveAvatar = false;

export async function handleSaveProfileSettings(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
  }
  if (isSavingProfile) return;
  isSavingProfile = true;

  const btnSave = document.getElementById("btn-profile-save-settings");
  const originalSaveHtml = btnSave ? btnSave.innerHTML : "";

  try {
    const nameVal = document.getElementById("profile-input-name")?.value?.trim() || "";
    const storeNameVal = document.getElementById("profile-input-store-name")?.value?.trim() || nameVal;
    const phoneVal = document.getElementById("profile-input-phone")?.value?.trim() || "";
    const emailVal = document.getElementById("profile-input-email")?.value?.trim() || "";
    const regionVal = document.getElementById("profile-input-region")?.value || "solo";
    const districtVal = document.getElementById("profile-input-district")?.value || "";
    const bioVal = document.getElementById("profile-input-bio")?.value?.trim() || "";
    const newPass = document.getElementById("profile-input-new-password")?.value || "";
    const confirmPass = document.getElementById("profile-input-confirm-password")?.value || "";

    if (!nameVal) {
      showToast("Nama lengkap wajib diisi.", "warning");
      return void document.getElementById("profile-input-name")?.focus();
    }

    if (newPass) {
      if (newPass.length < 6) {
        showToast("Kata sandi baru minimal 6 karakter.", "warning");
        return void document.getElementById("profile-input-new-password")?.focus();
      }
      if (newPass !== confirmPass) {
        showToast("Konfirmasi kata sandi baru tidak cocok.", "error");
        return void document.getElementById("profile-input-confirm-password")?.focus();
      }
    }

    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Menyimpan...</span>';
      refreshIcons();
    }

    let finalAvatar = userProfileAvatarData;
    if (shouldRemoveAvatar) {
      try {
        showToast("Menghapus foto avatar lama dari Supabase Storage & database...", "info");
        const targetUserId = window.state?.currentUser?.id || getCurrentUser()?.id;
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
          finalAvatar = window.state?.currentUser?.avatar || null;
        }
      } catch (upErr) {
        console.warn("[handleSaveProfileSettings Avatar Upload Error]", upErr);
        finalAvatar = window.state?.currentUser?.avatar || null;
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

    if (window.state) window.state.currentUser = updated;

    const avatarPreview = document.getElementById("profile-edit-avatar-preview");
    const namePreview = document.getElementById("profile-edit-name-preview");

    if (avatarPreview && updated.avatar) avatarPreview.src = updated.avatar;
    if (namePreview) namePreview.textContent = updated.storeName || updated.name || "Pengguna";

    if (typeof window.setProfileEditMode === "function") {
      window.setProfileEditMode(false);
    }

    if (supabase && updated && updated.id) {
      const newRegion = formatDistrictTitle(updated.district) || formatRegionTitle(updated.region) || "Solo";
      const rawFullName = (updated.name || updated.storeName || updated.store_name || "Pengguna").trim();
      const newStoreName = `${rawFullName.split(/\s+/)[0] || "Pengguna"} ${newRegion}`.trim();
      const currentUserId = updated.id;

      try {
        await supabase
          .from("app_reviews")
          .update({ user_location: newRegion, user_name: newStoreName })
          .eq("user_id", currentUserId);
      } catch (errSync) {
        console.warn("[handleSaveProfileSettings] Supabase app_reviews update exception:", errSync);
      }
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
        '<i data-lucide="check" class="w-3.5 h-3.5 text-amber-300"></i><span>Simpan Perubahan</span>';
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
    if (typeof logout === "function") await logout();
  } catch (err) {}

  if (window.state) window.state.currentUser = null;
  showToast("Anda telah berhasil keluar dari akun.", "info");
  window.location.href = `index.html?logout=1&t=${Date.now()}`;
}

export async function handleDeleteProfileAvatar(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const user = window.state?.currentUser || getCurrentUser();
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

  showToast(
    "Foto avatar dilepas dari pratinjau. File & database tetap aman hingga tombol 'Simpan Perubahan' diklik.",
    "info",
  );
}

if (typeof window !== "undefined") {
  window.handleDeleteProfileAvatar = handleDeleteProfileAvatar;
  window.handleSaveProfileSettings = handleSaveProfileSettings;
  window.handleProfileLogout = handleProfileLogout;
  window.logout = handleProfileLogout;
}
