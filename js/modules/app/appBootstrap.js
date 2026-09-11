import { initSplashScreen } from "./appSplashScreen.js";
import { handleUrlNavigation } from "./appNavigationRouter.js";
import { initGlobalEventListeners } from "./appEventListeners.js";
import {
  showHomeLoadingSkeleton,
  renderRegionPills,
  renderCategoryPills,
  initHeroBannerCarousel,
  applyCustomTexts,
  applySiteSettings,
} from "../home/homeUI.js";
import { renderListings, updateSortRadioUI } from "../products/listingsController.js";
import {
  fetchPublicListingsFromSupabase,
  initializeStorage,
  getSiteSettings,
  getCustomTexts,
  getCurrentUser,
} from "../../services/storage.js";
import { syncAllUsersToCloudOnStartup, fetchFreshCurrentUserFromSupabase, subscribeAuth } from "../../services/auth.js";
import { renderAuthNav } from "../auth/authUI.js";
import { renderAppReviews, initAppReviews } from "../reviews/appReviews.js";
import { updateCreateListingSellerInfo } from "../listings/listingFormModal.js";
import {
  populateFormRegions,
  populateFilterModalOptions,
  selectFilterRegion,
  selectFilterCategory,
  selectFilterCondition,
} from "../filter/filterController.js";
import { initProfileModule } from "../profile/userProfile.js";
import { initLiveVisualEditor } from "../editor/liveVisualEditor.js";
import { initBackHandler } from "../../utils/modalRouter.js";
import { initNotificationsCenter } from "../notifications/notificationUI.js";
import { refreshIcons, CURRENT_SW_VERSION } from "../../utils/runtime.js";

let isAppStarted = false;

export function startApp(state) {
  if (isAppStarted) return;
  isAppStarted = true;

  try {
    initSplashScreen();
  } catch (err) {
    if (typeof window.dismissAppSplash === "function") window.dismissAppSplash();
  }

  try {
    const urlParams = new URLSearchParams(window.location.search),
      hasLogoutParam = "1" === urlParams.get("logout"),
      hasLoggedOutFlag = "true" === sessionStorage.getItem("solosatset_just_logged_out");
    if (
      (hasLogoutParam || hasLoggedOutFlag) &&
      (console.log("[Boot Check] Terdeteksi status pasca-logout. Memastikan sesi lokal bersih total."),
      sessionStorage.clear(),
      (state.currentUser = null),
      hasLogoutParam)
    ) {
      urlParams.delete("logout");
      urlParams.delete("t");
      const cleanQuery = urlParams.toString(),
        newUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : "") + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch (bootErr) {
    console.warn("[Boot Check Exception]", bootErr);
  }

  try {
    initializeStorage();
    renderRegionPills();
    renderListings();
    fetchPublicListingsFromSupabase()
      .then(() => {
        renderRegionPills();
        renderListings();
      })
      .catch(() => {
        renderListings();
      });
  } catch (e) {
    console.warn("[Storage init]", e);
  }

  try {
    syncAllUsersToCloudOnStartup()
      .then(() => {
        const fresh = getCurrentUser();
        if (fresh) {
          state.currentUser = fresh;
          try {
            renderAuthNav();
          } catch (err) {}
        }
        try {
          renderAppReviews();
        } catch (err) {}
      })
      .catch(() => {});
  } catch (_e) {}

  try {
    applySiteSettings(state.siteSettings);
    applyCustomTexts(state.customTexts);
  } catch (_e) {}

  try {
    subscribeAuth((user) => {
      state.currentUser = user;
      try {
        renderAuthNav();
      } catch (err) {}
      try {
        updateCreateListingSellerInfo();
      } catch (err) {}
      const navProfileLabel = document.getElementById("nav-profile-label");
      if (navProfileLabel) navProfileLabel.textContent = user ? "Profil" : "Masuk";
      try {
        renderAppReviews();
      } catch (err) {}
    });
  } catch (_e) {}

  window.addEventListener("userProfileUpdated", (e) => {
    state.currentUser = e.detail || getCurrentUser();
    try {
      renderAuthNav();
    } catch (err) {}
    try {
      renderAppReviews();
    } catch (err) {}
  });

  window.addEventListener("registeredUsersChanged", () => {
    const fresh = getCurrentUser();
    if (fresh) {
      state.currentUser = fresh;
      try {
        renderAuthNav();
      } catch (err) {}
    }
    try {
      renderAppReviews();
    } catch (err) {}
  });

  window.addEventListener("siteSettingsChanged", (e) => {
    state.siteSettings = e.detail;
    applySiteSettings(e.detail);
    renderListings();
  });

  window.addEventListener("siteTextsChanged", (e) => {
    state.customTexts = e.detail;
    applyCustomTexts(e.detail);
  });

  window.addEventListener("listingsChanged", () => {
    renderRegionPills();
    renderListings();
  });

  window.addEventListener("storage", (e) => {
    if ("pusat_barkas_site_settings" === e.key) {
      state.siteSettings = getSiteSettings();
      applySiteSettings(state.siteSettings);
      renderListings();
    } else if ("pusat_barkas_custom_texts" === e.key) {
      state.customTexts = getCustomTexts();
      applyCustomTexts(state.customTexts);
    } else if ("pusat_barkas_listings" === e.key) {
      renderRegionPills();
      renderListings();
    } else if ("pusat_barkas_user" === e.key || "pusat_barkas_registered_users" === e.key) {
      state.currentUser = getCurrentUser();
      try {
        renderAuthNav();
      } catch (err) {}
      try {
        renderAppReviews();
      } catch (err) {}
      try {
        renderListings();
      } catch (err) {}
    }
  });

  document.addEventListener("visibilitychange", () => {
    if ("visible" === document.visibilityState) {
      fetchFreshCurrentUserFromSupabase().catch(() => {});
    }
  });

  const safeExec = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[Module Error Boundary: ${name}]`, err);
    }
  };

  safeExec("RegionPills", renderRegionPills);
  safeExec("CategoryPills", renderCategoryPills);
  safeExec("HeroBannerCarousel", initHeroBannerCarousel);
  safeExec("FormRegions", populateFormRegions);
  safeExec("FilterModalOptions", populateFilterModalOptions);
  safeExec("FilterRegionSelector", () =>
    selectFilterRegion(state.selectedRegion || "all", state.selectedDistrict || "all"),
  );
  safeExec("FilterCategorySelector", () => selectFilterCategory(state.selectedCategory || "all"));
  safeExec("FilterConditionSelector", () => selectFilterCondition(state.selectedCondition || "all"));
  safeExec("SortRadioUI", updateSortRadioUI);

  showHomeLoadingSkeleton();
  safeExec("EventListeners", () => initGlobalEventListeners(state));
  safeExec("ProfileModule", initProfileModule);
  safeExec("AppReviews", initAppReviews);
  safeExec("LiveVisualEditor", initLiveVisualEditor);
  safeExec("BackHandler", initBackHandler);
  safeExec("NotificationsCenter", initNotificationsCenter);
  safeExec("ServiceWorker", initServiceWorker);

  if (!window.location.search.includes("mode=mobile_editor")) {
    document.body.classList.remove("visual-editor-active", "is-in-phone-frame");
    document.getElementById("floating-live-editor-bar")?.classList.add("hidden");
    document.getElementById("live-editor-overlay-bubble")?.classList.add("hidden");
  }

  safeExec("UrlNavigation", () => handleUrlNavigation(state));
  refreshIcons();
}

export function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const storedVersion = window.__solosatset_sw_version || null;
  if (storedVersion !== CURRENT_SW_VERSION && "caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => {
        console.log(
          `[SW Bootstrap] Upgraded from ${storedVersion || "v1"} to v${CURRENT_SW_VERSION}. All stale caches cleaned.`,
        );
      })
      .catch(() => {});
    window.__solosatset_sw_version = CURRENT_SW_VERSION;
  }

  navigator.serviceWorker
    .register(`./sw.js?v=${CURRENT_SW_VERSION}`)
    .then((registration) => {
      console.log("[SW Bootstrap] Service Worker registered successfully, scope:", registration.scope);
      registration.update().catch(() => {});
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if ("installed" === newWorker.state && navigator.serviceWorker.controller) {
              console.log("[SW Bootstrap] New version found. Requesting skipWaiting & immediate activation.");
              newWorker.postMessage({ action: "skipWaiting" });
            }
          });
        }
      });
      if (registration.waiting) {
        registration.waiting.postMessage({ action: "skipWaiting" });
      }
    })
    .catch((err) => {
      console.warn("[SW Bootstrap] Service Worker registration notice:", err);
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("[SW Bootstrap] New Service Worker has taken control.");
  });
}
