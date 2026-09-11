import { SOLO_RAYA_REGIONS, getRegionById, getDistrictsByRegionId } from "../../data/regions.js";
   
  // eslint-disable-next-line no-unused-vars
import { formatRegionTitle, formatDistrictTitle, refreshIcons } from "../../utils/runtime.js";
import { closeModal } from "../common/modalManager.js";

export function normalizeProfileRegionId(reg) {
  if (!reg) return "solo";
  const lower = String(reg).toLowerCase().trim();
  if (lower.includes("solo") || lower.includes("surakarta")) return "solo";
  if (lower.includes("karanganyar")) return "karanganyar";
  if (lower.includes("sukoharjo")) return "sukoharjo";
  if (lower.includes("sragen")) return "sragen";
  if (lower.includes("boyolali")) return "boyolali";
  if (lower.includes("klaten")) return "klaten";
  if (lower.includes("wonogiri")) return "wonogiri";
  return lower;
}

export function renderProfileRegionPicker(activeRegId) {
  try {
    const container = document.getElementById("picker-profile-region-list");
    if (!container) return;

    let html = "";
    SOLO_RAYA_REGIONS.forEach((r) => {
      const isSelected = r.id === activeRegId;
      html += `
        <button
          type="button"
          class="picker-item-profile-region w-full px-3.5 py-2.5 rounded-2xl border ${
            isSelected
              ? "border-2 border-rose-900 bg-rose-50/70 ring-2 ring-rose-900/20"
              : "border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50"
          } flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
          data-id="${r.id}"
          data-name="${r.name}"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl ${isSelected ? "bg-rose-100 text-rose-900 border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"} flex items-center justify-center flex-shrink-0 item-icon-box">
              <i data-lucide="map-pin" class="w-4 h-4 text-rose-900"></i>
            </div>
            <span class="text-sm ${isSelected ? "font-black text-slate-900" : "font-extrabold text-slate-800"} item-title">${r.name}</span>
          </div>
          <div class="check-box w-5 h-5 rounded-full border-2 ${isSelected ? "border-rose-900" : "border-slate-300"} flex items-center justify-center flex-shrink-0">
            <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 ${isSelected ? "" : "hidden"}"></div>
          </div>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".picker-item-profile-region").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-id");
        selectProfileRegion(id);
        closeModal("modal-profile-region-picker");
      };
    });

    if (window.lucide) {
      try {
        const modalEl = document.getElementById("modal-profile-region-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: renderProfileRegionPicker]", err);
  }
}

export function renderProfileDistrictPicker(regId, activeDistrict) {
  try {
    const container = document.getElementById("picker-profile-district-list");
    if (!container) return;

    const currentRegId = normalizeProfileRegionId(regId);
    const districts = getDistrictsByRegionId(currentRegId) || [];
    let html = "";

    districts.forEach((d) => {
      const isSelected = d === activeDistrict;
      html += `
        <button
          type="button"
          class="picker-item-profile-district w-full px-3.5 py-2.5 rounded-2xl border ${
            isSelected
              ? "border-2 border-rose-900 bg-rose-50/70 ring-2 ring-rose-900/20"
              : "border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50"
          } flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
          data-name="${d}"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl ${isSelected ? "bg-rose-100 text-rose-900 border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"} flex items-center justify-center flex-shrink-0 item-icon-box">
              <i data-lucide="map-pin" class="w-4 h-4 text-rose-900"></i>
            </div>
            <span class="text-sm ${isSelected ? "font-black text-slate-900" : "font-extrabold text-slate-800"} item-title">Kec. ${d}</span>
          </div>
          <div class="check-box w-5 h-5 rounded-full border-2 ${isSelected ? "border-rose-900" : "border-slate-300"} flex items-center justify-center flex-shrink-0">
            <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 ${isSelected ? "" : "hidden"}"></div>
          </div>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".picker-item-profile-district").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const name = btn.getAttribute("data-name");
        selectProfileDistrict(name, currentRegId);
        closeModal("modal-profile-district-picker");
      };
    });

    if (window.lucide) {
      try {
        const modalEl = document.getElementById("modal-profile-district-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: renderProfileDistrictPicker]", err);
  }
}

export function selectProfileRegion(regId, customDistrict = null) {
  try {
    const selectedRegId = normalizeProfileRegionId(regId);
    const regionObj = getRegionById(selectedRegId);
    const regionName = regionObj ? regionObj.name : "Kota Solo (Surakarta)";

    const regionInput = document.getElementById("profile-input-region");
    const triggerText = document.getElementById("profile-region-trigger-text");
    if (regionInput) regionInput.value = selectedRegId;
    if (triggerText) triggerText.textContent = regionName;

    renderProfileRegionPicker(selectedRegId);

    const districts = getDistrictsByRegionId(selectedRegId) || [];
    const targetDistrict = customDistrict && districts.includes(customDistrict) ? customDistrict : districts[0] || "";
    selectProfileDistrict(targetDistrict, selectedRegId);
  } catch (err) {
    console.warn("[ErrorBoundary: selectProfileRegion]", err);
  }
}

export function selectProfileDistrict(districtName, regId = null) {
  try {
    const currentRegId = normalizeProfileRegionId(
      regId || document.getElementById("profile-input-region")?.value || "solo",
    );
    const regionObj = getRegionById(currentRegId);
    const regionName = regionObj ? regionObj.shortName || regionObj.name : "Solo";
    const districts = getDistrictsByRegionId(currentRegId) || [];
    const selectedDistrict = districtName && districts.includes(districtName) ? districtName : districts[0] || "";

    const districtInput = document.getElementById("profile-input-district");
    const triggerText = document.getElementById("profile-district-trigger-text");
    const titleEl = document.getElementById("profile-district-modal-title");
    const subtitleEl = document.getElementById("profile-district-modal-subtitle");

    if (districtInput) districtInput.value = selectedDistrict;
    if (triggerText) triggerText.textContent = selectedDistrict ? `Kec. ${selectedDistrict}` : "Pilih Kecamatan";
    if (titleEl) titleEl.textContent = `Pilih Kecamatan (${regionName})`;
    if (subtitleEl) subtitleEl.textContent = `Daftar kecamatan di ${regionObj ? regionObj.name : regionName}`;

    renderProfileDistrictPicker(currentRegId, selectedDistrict);
  } catch (err) {
    console.warn("[ErrorBoundary: selectProfileDistrict]", err);
  }
}

// Global window registration
if (typeof window !== "undefined") {
  window.normalizeProfileRegionId = normalizeProfileRegionId;
  window.renderProfileRegionPicker = renderProfileRegionPicker;
  window.renderProfileDistrictPicker = renderProfileDistrictPicker;
  window.selectProfileRegion = selectProfileRegion;
  window.selectProfileDistrict = selectProfileDistrict;
}
