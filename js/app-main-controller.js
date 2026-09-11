import { ensurePickerModalsLoaded } from "./pickerModals.js";
import { ensureFilterModalsLoaded } from "./filterModals.js";
import { ensureAuthProfileModalsLoaded } from "./authProfileModals.js";
import { ensureProductSellerModalsLoaded } from "./productSellerModals.js";
import { ensureNotificationsModalLoaded, initNotificationsModal } from "./notificationModal.js";
import { renderNotificationsDOM, syncUserNotifications } from "./modules/notifications/notificationUI.js";
import { openProductDetail as openProductDetailModule } from "./modules/products/productDetailModal.js";
import { getSiteSettings, getCustomTexts } from "./services/storage.js";
import { startApp } from "./modules/app/appBootstrap.js";

// Re-exports
export {
  initLiveVisualEditor,
  enableVisualEditor,
  disableVisualEditor,
  saveVisualChanges,
  handleModalAdminLogin,
} from "./modules/editor/liveVisualEditor.js";
export { getActiveSessionUserId, trackUserInterest, getUserTopInterests } from "./modules/app/appAnalytics.js";
export {
  openSellerProfileModal,
  switchSellerProfileTab,
  renderSellerProfileListings,
  renderSellerProfileReviews,
  setupStarRatingPicker,
} from "./modules/reviews/sellerReviews.js";
export {
  selectFilterRegion,
  selectFilterDistrict,
  selectFilterCategory,
  selectFilterCondition,
  populateFilterModalOptions,
  openFilterModal,
  applyFilterModal,
  setRegionFilter,
  resetAllFilters,
} from "./modules/filter/filterController.js";
export {
  openAppReviewsModal,
  selectAppReviewCategory,
  setAppReviewRating,
  renderAppReviews,
  resetAppReviewEditMode,
  initAppReviews,
} from "./modules/reviews/appReviews.js";
export {
  handleSaveProfileSettings,
  handleProfileLogout,
  handleDeleteProfileAvatar,
} from "./modules/profile/profileActions.js";
export {
  triggerBuNotification,
  showBuBroadcastToast,
  verifyBuQrisPayment,
} from "./modules/notifications/appBuNotification.js";
export { handleProfileNavClick } from "./modules/app/appEventListeners.js";

export let state = {
  selectedRegion: "all",
  selectedDistrict: "all",
  selectedCategory: "all",
  selectedCondition: "all",
  searchQuery: "",
  minPrice: null,
  maxPrice: null,
  sortBy: "newest",
  currentDetailListing: null,
  uploadedImages: [],
  currentUser: null,
  siteSettings: getSiteSettings(),
  customTexts: getCustomTexts(),
  isVisualEditorActive: false,
};
if (typeof window !== "undefined") {
  window.state = state;
}

export function openProductDetail(listingId) {
  return openProductDetailModule(listingId, state);
}
window.openProductDetail = openProductDetail;

export function handleProductClick(productOrListingId) {
  let product = null,
    listingId = null;
  if (typeof productOrListingId === "object" && productOrListingId !== null) {
    product = productOrListingId;
    listingId = product.id;
  } else if (typeof productOrListingId === "string") {
    listingId = productOrListingId;
  }
  if (listingId) openProductDetail(listingId);
}
window.handleProductClick = handleProductClick;

document.addEventListener("DOMContentLoaded", () => {
  ensurePickerModalsLoaded();
  ensureFilterModalsLoaded();
  ensureAuthProfileModalsLoaded();
  ensureProductSellerModalsLoaded();
  ensureNotificationsModalLoaded();
  initNotificationsModal();
  window.addEventListener("notifications:opened", () => {
    requestAnimationFrame(() => {
      try {
        renderNotificationsDOM(window.cachedNotifications || []);
      } catch (err) {
        console.warn("Gagal merender daftar notifikasi:", err);
      }
    });
    setTimeout(() => {
      if (typeof syncUserNotifications === "function") {
        syncUserNotifications(false).catch((err) => console.warn("Sinkronisasi latar belakang tertunda:", err));
      }
    }, 50);
  });
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => startApp(state));
} else {
  startApp(state);
}
