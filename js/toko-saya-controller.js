import "./notificationModal.js";
import { getCurrentUser } from "./services/auth.js";
import { openModal as openStoreModal, closeModal as closeStoreModal } from "./utils/modalRouter.js";
import { openCreateListingModal, openEditListingModal } from "./modules/listings/listingFormModal.js";
import {
  openUserProfileModal,
  handleSaveProfileSettings,
  handleProfileLogout,
  handleDeleteProfileAvatar,
} from "./modules/profile/userProfile.js";
import {
  initTokoSayaPage,
  handleFilterTabClick,
  syncAndRenderStoreListings,
} from "./modules/toko-saya/tokoSayaBootstrap.js";
let currentUserRef = { value: null };
let uploadedImagesRef = { value: [] };

export { openEditListingModal, handleSaveProfileSettings, handleProfileLogout, handleDeleteProfileAvatar };

export function openModal(modalId, pushHistory = true) {
  return openStoreModal(modalId, pushHistory);
}
export function closeModal(modalId, fromHistory = false) {
  return closeStoreModal(modalId, fromHistory);
}

export function showStoreLoadingSkeleton() {
  return true;
}

window.syncAndRenderStoreListings = (filter, force) => syncAndRenderStoreListings(currentUserRef.value, filter, force);
window.handleFilterTabClick = (tabEl, filterVal) => handleFilterTabClick(tabEl, filterVal, currentUserRef.value);
window.filterStoreListings = window.handleFilterTabClick;
window.handleProfileNavClick = (e) => {
  if (e && e.preventDefault) e.preventDefault();
  if (getCurrentUser()) {
    openUserProfileModal();
  } else {
    import("./modules/auth/authUI.js").then((m) => {
      m.openUserAuthModal("login", "Silakan masuk atau daftar akun terlebih dahulu untuk melihat profil Anda.");
    }).catch(() => openUserProfileModal());
  }
};
window.openModal = openModal;
window.closeModal = closeModal;
window.openCreateListingModal = openCreateListingModal;
window.openEditListingModal = openEditListingModal;
window.openUserProfileModal = openUserProfileModal;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initTokoSayaPage(currentUserRef, uploadedImagesRef));
} else {
  initTokoSayaPage(currentUserRef, uploadedImagesRef);
}
