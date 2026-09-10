import { refreshIcons } from "../../utils/runtime.js";
import { getDistrictsByRegionId } from "../../data/regions.js";
import { openModal, showToast } from "../../utils/modalRouter.js";

export function showRegisterError(message) {
  const alertBox = document.getElementById("register-error-alert");
  const textEl = document.getElementById("register-error-text");
  if (alertBox && textEl) {
    textEl.textContent = message;
    alertBox.classList.remove("hidden");
    refreshIcons();
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  const fieldError = document.getElementById("reg-field-error-msg");
  const fieldText = document.getElementById("reg-field-error-text");
  if (fieldError && fieldText) {
    fieldText.textContent = message;
    fieldError.classList.remove("hidden");
    refreshIcons();
  }
  showToast(message, "error", 6000);
}

export function showForgotError(message) {
  const alertBox = document.getElementById("forgot-error-alert");
  const textEl = document.getElementById("forgot-error-text");
  if (alertBox && textEl) {
    textEl.textContent = message;
    alertBox.classList.remove("hidden");
    refreshIcons();
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  showToast(message, "error", 6000);
}

export function showForgotConfirmError(message) {
  const alertBox = document.getElementById("forgot-confirm-error-alert");
  const textEl = document.getElementById("forgot-confirm-error-text");
  if (alertBox && textEl) {
    textEl.textContent = message;
    alertBox.classList.remove("hidden");
    refreshIcons();
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  showToast(message, "error", 6000);
}

export function clearAllAuthErrors() {
  document.getElementById("login-error-alert")?.classList.add("hidden");
  document.getElementById("register-error-alert")?.classList.add("hidden");
  document.getElementById("forgot-error-alert")?.classList.add("hidden");
  document.getElementById("forgot-confirm-error-alert")?.classList.add("hidden");
  document.getElementById("login-field-error-msg")?.classList.add("hidden");
  document.getElementById("reg-field-error-msg")?.classList.add("hidden");
  document.querySelectorAll("#modal-user-auth input").forEach((inp) => {
    inp.classList.remove(
      "border-rose-500",
      "ring-2",
      "ring-rose-400",
      "bg-rose-50/40"
    );
  });
}

export function populateRegisterDistricts() {
  const regionSelect = document.getElementById("reg-select-region");
  const districtSelect = document.getElementById("reg-select-district");
  if (!regionSelect || !districtSelect) return;
  const regionId = regionSelect.value || "solo";
  const districts = getDistrictsByRegionId(regionId);
  districtSelect.innerHTML = districts
    .map((d) => `<option value="${d}">${d}</option>`)
    .join("");
}

export function switchAuthTab(tab) {
  clearAllAuthErrors();
  const tabLogin = document.getElementById("tab-auth-login");
  const tabRegister = document.getElementById("tab-auth-register");
  const panelLogin = document.getElementById("panel-auth-login");
  const panelRegister = document.getElementById("panel-auth-register");
  const panelForgot = document.getElementById("panel-auth-forgot");
  const tabsContainer = document.getElementById("auth-tabs-container");
  const modalTitle = document.getElementById("auth-modal-title");
  const modalSubtitle = document.getElementById("auth-modal-subtitle");

  if (tab === "register") {
    tabsContainer?.classList.remove("hidden");
    panelLogin?.classList.add("hidden");
    panelRegister?.classList.remove("hidden");
    panelForgot?.classList.add("hidden");
    tabRegister?.classList.add(
      "bg-white",
      "text-rose-900",
      "font-black",
      "shadow-xs"
    );
    tabRegister?.classList.remove("text-slate-500", "font-bold");
    tabLogin?.classList.remove(
      "bg-white",
      "text-rose-900",
      "font-black",
      "shadow-xs"
    );
    tabLogin?.classList.add("text-slate-500", "font-bold");
    if (modalTitle) modalTitle.textContent = "Daftar Akun Penjual";
    if (modalSubtitle)
      modalSubtitle.textContent = "Mulai pasang iklan gratis se-Solo Raya";
  } else if (tab === "forgot") {
    tabsContainer?.classList.add("hidden");
    panelLogin?.classList.add("hidden");
    panelRegister?.classList.add("hidden");
    panelForgot?.classList.remove("hidden");
    if (modalTitle) modalTitle.textContent = "Lupa Password Akun";
    if (modalSubtitle)
      modalSubtitle.textContent = "Atur ulang password akun Anda";
  } else {
    tabsContainer?.classList.remove("hidden");
    panelLogin?.classList.remove("hidden");
    panelRegister?.classList.add("hidden");
    panelForgot?.classList.add("hidden");
    tabLogin?.classList.add(
      "bg-white",
      "text-rose-900",
      "font-black",
      "shadow-xs"
    );
    tabLogin?.classList.remove("text-slate-500", "font-bold");
    tabRegister?.classList.remove(
      "bg-white",
      "text-rose-900",
      "font-black",
      "shadow-xs"
    );
    tabRegister?.classList.add("text-slate-500", "font-bold");
    if (modalTitle) modalTitle.textContent = "Masuk ke Akun";
    if (modalSubtitle)
      modalSubtitle.innerHTML =
        "Cepet Payune, Cepet oleh barange !!!<br>Po ra Well ?";
  }
}

export function openUserAuthModal(tab = "login", noticeMsg = null) {
  clearAllAuthErrors();
  const noticeBox = document.getElementById("auth-notice-box");
  const noticeText = document.getElementById("auth-notice-text");
  if (noticeMsg && noticeBox && noticeText) {
    noticeText.textContent = noticeMsg;
    noticeBox.classList.remove("hidden");
  } else if (noticeBox) {
    noticeBox.classList.add("hidden");
  }
  switchAuthTab(tab);
  populateRegisterDistricts();
  openModal("modal-user-auth");
  refreshIcons();
}

if (typeof window !== "undefined") {
  window.showRegisterError = showRegisterError;
  window.showForgotError = showForgotError;
  window.showForgotConfirmError = showForgotConfirmError;
  window.clearAllAuthErrors = clearAllAuthErrors;
  window.populateRegisterDistricts = populateRegisterDistricts;
  window.switchAuthTab = switchAuthTab;
  window.openUserAuthModal = openUserAuthModal;
}
