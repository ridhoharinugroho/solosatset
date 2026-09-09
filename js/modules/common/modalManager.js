import { refreshIcons } from '../../utils/runtime.js';

export const NESTED_PICKER_MODALS = new Set([
  'modal-category-picker',
  'modal-condition-picker',
  'modal-nego-picker',
  'modal-payment-method-picker',
  'modal-app-category-picker',
  'modal-item-status-picker',
  'modal-filter-condition-picker',
  'modal-filter-category-picker',
  'modal-filter-region-picker',
  'modal-filter-district-picker',
  'modal-profile-region-picker',
  'modal-profile-district-picker',
  'modal-notifications'
]);

export const modalHistoryStack = [];
export let isPopStateActive = false;

export function updateStickyHeaderVisibility(isHome = true) {
  const stickyHeader = document.getElementById('sticky-header-categories') || document.getElementById('sticky-region-categories-bar');
  if (!stickyHeader) return;
  if (isHome) {
    stickyHeader.classList.remove('hidden');
  } else {
    stickyHeader.classList.add('hidden');
  }
}

export function openModal(modalId, pushHistory = true) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error("Modal not found:", modalId);
    return;
  }

  const isPicker = NESTED_PICKER_MODALS.has(modalId);

  // If this is a PRIMARY modal (not a nested picker popup), close other primary modals
  if (!isPicker) {
    document.querySelectorAll('.fixed[id^="modal-"]').forEach((m) => {
      if (m.id !== modalId && !NESTED_PICKER_MODALS.has(m.id)) {
        m.classList.add('hidden');
        m.style.display = 'none';
        m.style.visibility = 'hidden';
        const idx = modalHistoryStack.indexOf(m.id);
        if (idx !== -1) modalHistoryStack.splice(idx, 1);
      }
    });
    updateStickyHeaderVisibility(false);
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  document.body.style.overflow = 'hidden';

  if (!modalHistoryStack.includes(modalId)) {
    modalHistoryStack.push(modalId);
  }

  if (pushHistory && !isPopStateActive && !isPicker) {
    try {
      window.history.pushState({ modalId: modalId, appModal: true }, '');
    } catch (e) { }
  }

  if (window.lucide) {
    try {
      refreshIcons(modal);
    } catch (e) {
      refreshIcons();
    }
  }
}

export function closeModal(modalId, fromHistory = false) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
  modal.style.visibility = 'hidden';

  const stackIndex = modalHistoryStack.lastIndexOf(modalId);
  if (stackIndex !== -1) {
    modalHistoryStack.splice(stackIndex, 1);
  }

  const isNestedPicker = NESTED_PICKER_MODALS.has(modalId);
  if (!fromHistory && !isPopStateActive && !isNestedPicker) {
    if (window.history.state && window.history.state.appModal) {
      try {
        window.history.back();
      } catch (e) { }
    }
  }

  const openModals = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]'))
    .filter(m => window.getComputedStyle(m).display !== 'none' && m.id !== modalId);

  if (openModals.length === 0) {
    document.body.style.overflow = '';
    updateStickyHeaderVisibility(true);
  } else {
    document.body.style.overflow = 'hidden';
    updateStickyHeaderVisibility(false);
  }
}

export function initBackHandler() {
  try {
    if (!window.history.state || !window.history.state.appBase) {
      window.history.replaceState({ appBase: true }, '');
    }
  } catch (e) { }

  window.addEventListener('popstate', () => {
    isPopStateActive = true;

    const visibleModals = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]'))
      .filter(m => window.getComputedStyle(m).display !== 'none');

    if (visibleModals.length > 0) {
      let targetModalId = null;
      for (let i = modalHistoryStack.length - 1; i >= 0; i--) {
        const id = modalHistoryStack[i];
        const el = document.getElementById(id);
        if (el && window.getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden')) {
          targetModalId = id;
          break;
        }
      }

      if (!targetModalId) {
        const visiblePicker = visibleModals.find(m => NESTED_PICKER_MODALS.has(m.id));
        targetModalId = visiblePicker ? visiblePicker.id : visibleModals[visibleModals.length - 1].id;
      }

      if (targetModalId) {
        closeModal(targetModalId, true);
        isPopStateActive = false;
        return;
      }
    }

    isPopStateActive = false;
  });
}

// Global window registration for backwards compatibility
if (typeof window !== 'undefined') {
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.initBackHandler = initBackHandler;
  window.updateStickyHeaderVisibility = updateStickyHeaderVisibility;
}
