import { renderListings, updateSortRadioUI } from '../products/listingsController.js';
import { openModal, closeModal } from '../../utils/modalRouter.js';
import { openCreateListingModal } from '../listings/listingFormModal.js';
import { openUserProfileModal } from '../profile/userProfile.js';
import { selectFormCategory, selectFormCondition, selectFormNego, selectFormPaymentMethod } from '../listings/listingFormPickers.js';

export function initGlobalEventListeners(state) {
  const desktopSearch = document.getElementById("desktop-search-input");
  const mobileSearch = document.getElementById("mobile-search-input");
  const desktopForm = document.getElementById("desktop-search-form");
  const mobileForm = document.getElementById("mobile-search-form");
  const dClear = document.getElementById("desktop-search-clear");
  const mClear = document.getElementById("mobile-search-clear");
  let searchDebounceTimer = null;

  function dismissKeyboard() {
    mobileSearch?.blur();
    desktopSearch?.blur();
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  }

  function handleSearch(val, autoDismiss = false, debounce = false) {
    state.searchQuery = val;
    if (dClear) dClear.classList.toggle("hidden", !val);
    if (mClear) mClear.classList.toggle("hidden", !val);

    if (debounce) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderListings();
      }, 100);
    } else {
      clearTimeout(searchDebounceTimer);
      renderListings();
    }
    if (autoDismiss) dismissKeyboard();
  }

  desktopSearch?.addEventListener("input", (e) => {
    if (mobileSearch) mobileSearch.value = e.target.value;
    handleSearch(e.target.value, false, true);
  });

  mobileSearch?.addEventListener("input", (e) => {
    if (desktopSearch) desktopSearch.value = e.target.value;
    handleSearch(e.target.value, false, true);
  });

  const buCheckbox = document.getElementById("form-checkbox-is-bu");
  const btnActivateBu = document.getElementById("btn-activate-bu");

  btnActivateBu?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!buCheckbox) return;
    buCheckbox.checked = true;
    window.isDraftBu = true;
    const uniqueCode = Math.floor(101 * Math.random());
    window.currentBuPaymentAmount = 500 + uniqueCode;
    btnActivateBu.innerText = "Menyiapkan Iklan BU...";
    btnActivateBu.disabled = true;
    btnActivateBu.classList.add("opacity-70", "cursor-not-allowed");
    const form = document.getElementById("form-create-listing");
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  });

  desktopSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      handleSearch(desktopSearch.value, true);
    }
  });

  mobileSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      handleSearch(mobileSearch.value, true);
    }
  });

  desktopSearch?.addEventListener("search", () => {
    handleSearch(desktopSearch.value, true);
  });

  mobileSearch?.addEventListener("search", () => {
    handleSearch(mobileSearch.value, true);
  });

  desktopForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch(desktopSearch ? desktopSearch.value : "", true);
  });

  mobileForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch(mobileSearch ? mobileSearch.value : "", true);
  });

  dClear?.addEventListener("click", () => {
    if (desktopSearch) desktopSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";
    handleSearch("", true);
  });

  mClear?.addEventListener("click", () => {
    if (desktopSearch) desktopSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";
    handleSearch("", true);
  });

  window.addEventListener("scroll", () => {
    if (document.activeElement === mobileSearch || document.activeElement === desktopSearch) {
      dismissKeyboard();
    }
  }, { passive: true });

  document.getElementById("listings-grid")?.addEventListener("touchstart", () => {
    if (document.activeElement === mobileSearch || document.activeElement === desktopSearch) {
      dismissKeyboard();
    }
  }, { passive: true });

  document.getElementById("btn-open-sort-modal")?.addEventListener("click", () => {
    updateSortRadioUI();
    openModal("modal-sort");
  });

  document.querySelectorAll(".sort-option-item").forEach((item) => {
    item.addEventListener("click", () => {
      const val = item.getAttribute("data-sort-val");
      if (val) {
        state.sortBy = val;
        updateSortRadioUI();
        renderListings();
        setTimeout(() => {
          closeModal("modal-sort");
        }, 120);
      }
    });
  });

  document.querySelectorAll(".sort-option-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const val = pill.getAttribute("data-sort-val");
      if (val) {
        state.sortBy = val;
        updateSortRadioUI();
        renderListings();
      }
    });
  });

  document.getElementById("sort-select")?.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    updateSortRadioUI();
    renderListings();
  });

  document.getElementById("btn-create-listing-nav")?.addEventListener("click", openCreateListingModal);
  document.getElementById("nav-btn-create")?.addEventListener("click", openCreateListingModal);
  document.getElementById("btn-create-first-listing")?.addEventListener("click", () => {
    closeModal("modal-my-listings");
    openCreateListingModal();
  });
  document.getElementById("btn-form-edit-profile")?.addEventListener("click", () => {
    closeModal("modal-create-listing");
    openUserProfileModal();
  });

  const handleCloseCreateListingModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeModal("modal-create-listing");
  };

  document.getElementById("btn-close-create-listing")?.addEventListener("click", handleCloseCreateListingModal);
  document.getElementById("btn-cancel-create-listing")?.addEventListener("click", handleCloseCreateListingModal);

  document.getElementById("btn-open-category-picker")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal("modal-category-picker");
  });

  document.getElementById("btn-open-condition-picker")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal("modal-condition-picker");
  });

  document.querySelectorAll(".picker-item-category").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (id) {
        selectFormCategory(id);
        closeModal("modal-category-picker");
      }
    });
  });

  document.querySelectorAll(".picker-item-condition").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (id) {
        selectFormCondition(id);
        closeModal("modal-condition-picker");
      }
    });
  });

  document.getElementById("btn-open-nego-picker")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal("modal-nego-picker");
  });

  document.getElementById("btn-open-payment-method-picker")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal("modal-payment-method-picker");
  });

  document.querySelectorAll(".picker-item-nego").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (id) {
        selectFormNego(id);
        closeModal("modal-nego-picker");
      }
    });
  });

  document.querySelectorAll(".picker-item-payment-method").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (id) {
        selectFormPaymentMethod(id);
        closeModal("modal-payment-method-picker");
      }
    });
  });
}
