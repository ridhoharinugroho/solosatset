import { refreshIcons } from "../../utils/runtime.js";

export const modalHistoryStack = [];
export let isPopStateActive = false;

export const NESTED_PICKER_MODALS = new Set([
  "modal-category-picker",
  "modal-condition-picker",
  "modal-nego-picker",
  "modal-payment-method-picker",
  "modal-item-status-picker",
  "modal-profile-region-picker",
  "modal-profile-district-picker",
  "modal-notifications",
]);

export function setIsPopStateActive(val) {
  isPopStateActive = val;
}

export function openModal(modalId, pushHistory = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const isPicker = NESTED_PICKER_MODALS.has(modalId);
  if (!isPicker) {
    document.querySelectorAll('.fixed[id^="modal-"]').forEach((m) => {
      if (m.id !== modalId && !NESTED_PICKER_MODALS.has(m.id)) {
        m.classList.add("hidden");
        m.style.display = "none";
        const idx = modalHistoryStack.indexOf(m.id);
        if (idx !== -1) modalHistoryStack.splice(idx, 1);
      }
    });
  }

  modal.classList.remove("hidden");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  if (!modalHistoryStack.includes(modalId)) {
    modalHistoryStack.push(modalId);
  }

  if (pushHistory && !isPopStateActive && !isPicker) {
    try {
      window.history.pushState({ modalId: modalId, appModal: true }, "");
    } catch (_e) {}
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

  modal.classList.add("hidden");
  modal.style.display = "none";

  const stackIndex = modalHistoryStack.lastIndexOf(modalId);
  if (stackIndex !== -1) {
    modalHistoryStack.splice(stackIndex, 1);
  }

  const isNestedPicker = NESTED_PICKER_MODALS.has(modalId);
  if (!fromHistory && !isPopStateActive && !isNestedPicker && window.history.state && window.history.state.appModal) {
    try {
      window.history.back();
    } catch (_e) {}
  }

  const activeModalsCount = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]')).filter(
    (m) => "none" !== window.getComputedStyle(m).display && m.id !== modalId,
  ).length;

  if (activeModalsCount === 0) {
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
  }
}
