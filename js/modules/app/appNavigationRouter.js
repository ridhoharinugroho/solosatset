import { getRegionById } from '../../data/regions.js';
import { isUserLoggedIn, getCurrentUser } from '../../services/auth.js';
import { setRegionFilter } from '../filter/filterController.js';
import { openCreateListingModal, openEditListingModal } from '../listings/listingFormModal.js';
import { openUserAuthModal } from '../auth/authUI.js';
import { openAppReviewsModal } from '../reviews/appReviews.js';
import { openUserProfileModal } from '../profile/userProfile.js';
import { openModal } from '../../utils/modalRouter.js';
import { ensureNotificationsModalLoaded } from '../../notificationModal.js';
import { syncUserNotifications } from '../notifications/notificationUI.js';
import { initLiveActivityWidget } from '../../services/liveActivity.js';
import { fetchAppReviewsFromSupabase } from '../../services/storage.js';
import { refreshIcons } from '../../utils/runtime.js';
import { handleProductClick } from './appAnalytics.js';

export function handleUrlNavigation(state) {
  const params = new URLSearchParams(window.location.search);
  const actionParam = params.get("action") || params.get("tab") || params.get("page");
  const regionParam = params.get("region");
  const itemParam = params.get("item");
  const hash = window.location.hash ? window.location.hash.toLowerCase() : "";
  const modeParam = params.get("mode");

  if ("mobile_editor" === modeParam) {
    document.getElementById("app-splash-screen")?.remove();
    document.body.classList.add("is-in-phone-frame");
    sessionStorage.setItem("pusat_barkas_admin_auth", "true");
  } else if ("passive_preview" === modeParam) {
    document.getElementById("app-splash-screen")?.remove();
    if (state) state.isVisualEditorActive = false;
    document.body.classList.remove("visual-editor-active");
    document.getElementById("floating-live-editor-bar")?.classList.add("hidden");
  }

  if (regionParam && getRegionById(regionParam)) {
    setRegionFilter(regionParam);
  }

  if (itemParam) {
    handleProductClick(itemParam);
  } else if (actionParam === "create-listing" || hash === "#pasang-iklan" || hash === "#jual") {
    if (isUserLoggedIn() || getCurrentUser()) {
      openCreateListingModal();
    } else {
      openUserAuthModal("login", "Silakan masuk atau daftar akun terlebih dahulu untuk memasang iklan barang.");
    }
  } else if (actionParam === "edit" || hash.startsWith("#edit-")) {
    const editId = params.get("id") || hash.replace("#edit-", "");
    if (editId) {
      if (isUserLoggedIn() || getCurrentUser()) {
        openEditListingModal(editId);
      } else {
        openUserAuthModal("login", "Silakan masuk terlebih dahulu untuk mengubah iklan.");
      }
    }
  } else if (actionParam === "ulasan" || actionParam === "reviews" || hash === "#ulasan" || hash === "#reviews") {
    openAppReviewsModal();
  } else if (actionParam === "filter" || hash === "#filter") {
    openModal("modal-filter");
  } else if (actionParam === "profil" || actionParam === "profile" || hash === "#profil" || hash === "#profile") {
    if (isUserLoggedIn() || getCurrentUser()) {
      openUserProfileModal();
    } else {
      openUserAuthModal("login", "Silakan masuk atau daftar akun terlebih dahulu untuk melihat profil Anda.");
    }
  } else if (actionParam === "traktir" || hash === "#traktir") {
    openModal("modal-traktir-kopi");
  } else if (actionParam === "notifikasi" || actionParam === "notifications" || hash === "#notifikasi" || hash === "#notifications") {
    ensureNotificationsModalLoaded().then(() => {
      openModal("modal-notifications");
      if (typeof syncUserNotifications === "function") {
        syncUserNotifications(false);
      }
    });
  }

  try {
    initLiveActivityWidget();
    fetchAppReviewsFromSupabase().catch(() => {});
  } catch (e) {}

  if (actionParam || (hash && hash !== "#" && hash !== "")) {
    try {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + (regionParam ? `?region=${regionParam}` : "")
      );
    } catch (e) {}
  }

  try {
    refreshIcons();
  } catch (e) {}
}
