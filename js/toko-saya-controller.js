import "./traktirModal.js";
import "./notificationModal.js"; import { getCurrentUser } from "./services/auth.js";
import { openModal as openStoreModal, closeModal as closeStoreModal } from "./modules/toko-saya/tokoStoreModals.js"; import { renderStoreReviews as renderStoreReviewsModule } from "./modules/toko-saya/tokoStoreReviews.js";
import { showStoreLoadingSkeleton as showStoreLoadingSkeletonModule } from "./modules/toko-saya/tokoStoreEtalase.js";
import { renderAuthHeader as renderAuthHeaderModule, renderStoreShowcase as renderStoreShowcaseModule,
} from "./modules/store/storeShowcase.js";
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
} from "./modules/toko-saya/tokoSayaBootstrap.js"; import { renderStoreListings, openItemStatusPickerModal } from "./modules/toko-saya/tokoStoreListings.js"; import { showToast } from "./utils/modalRouter.js"; let activeStoreFilter = "all";
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
  return showStoreLoadingSkeletonModule();
}

window.syncAndRenderStoreListings = (filter, force) => syncAndRenderStoreListings(currentUserRef.value, filter, force);
window.handleFilterTabClick = (tabEl, filterVal) => handleFilterTabClick(tabEl, filterVal, currentUserRef.value);
window.filterStoreListings = window.handleFilterTabClick;
window.handleProfileNavClick = (e) => {
  if (e && e.preventDefault) e.preventDefault();
  openUserProfileModal();
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
