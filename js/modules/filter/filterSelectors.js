/**
 * filterSelectors.js
 * Fungsi untuk memilih/menampilkan nilai filter aktif di UI:
 * wilayah, kecamatan, kategori, kondisi.
 * Dipecah dari filterController.js untuk pemerataan beban kerja.
 */

import { FILTER_REGION_META, FILTER_CATEGORY_META, FILTER_CONDITION_META } from "./filterMeta.js";
import { getDistrictsByRegionId } from "../../data/regions.js";
import { refreshIcons } from "../../utils/runtime.js";
import { closeModal } from "../common/modalManager.js";

// ─── SELECT WILAYAH ──────────────────────────────────────────────────────────

export function selectFilterRegion(regId, customDistrict = null) {
  try {
    const selectedRegId = regId || "all";
    const input = document.getElementById("filter-modal-region");
    if (input) input.value = selectedRegId;

    const meta = FILTER_REGION_META[selectedRegId] || FILTER_REGION_META["all"];

    const textEl = document.getElementById("filter-region-trigger-text");
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById("filter-region-trigger-icon-wrapper");
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-region-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll(".picker-item-filter-region").forEach((btn) => {
      const isSelected = btn.getAttribute("data-id") === selectedRegId;
      const checkDot = btn.querySelector(".check-dot");
      const checkBox = btn.querySelector(".check-box");
      const iconBox = btn.querySelector(".item-icon-box");
      const title = btn.querySelector(".item-title");

      if (isSelected) {
        btn.className =
          "picker-item-filter-region w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className =
          "picker-item-filter-region w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    let targetDistrict = customDistrict;
    if (selectedRegId === "all") {
      targetDistrict = "all";
    } else {
      const districts = getDistrictsByRegionId(selectedRegId) || [];
      if (!targetDistrict || (targetDistrict !== "all" && !districts.includes(targetDistrict))) {
        targetDistrict = "all";
      }
    }
    selectFilterDistrict(targetDistrict, selectedRegId);

    if (window.lucide) {
      try {
        const filterModal = document.getElementById("modal-filter");
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById("modal-filter-region-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterRegion]", err);
  }
}

// ─── SELECT KECAMATAN ─────────────────────────────────────────────────────────

export function selectFilterDistrict(districtName, regId = null) {
  try {
    const currentRegId = regId || document.getElementById("filter-modal-region")?.value || "all";
    const districts = currentRegId === "all" ? [] : getDistrictsByRegionId(currentRegId) || [];
    const selectedDistrict = districtName && districts.includes(districtName) ? districtName : "all";

    const districtInput = document.getElementById("filter-modal-district");
    const triggerText = document.getElementById("filter-district-trigger-text");
    const districtListContainer = document.getElementById("picker-filter-district-list");
    const districtIconWrapper = document.getElementById("filter-district-trigger-icon-wrapper");

    if (districtInput) districtInput.value = selectedDistrict;
    if (triggerText) {
      triggerText.textContent = selectedDistrict === "all" ? "Semua Kecamatan" : `Kec. ${selectedDistrict}`;
    }
    if (districtIconWrapper) {
      districtIconWrapper.innerHTML = `<i data-lucide="${selectedDistrict === "all" ? "navigation" : "map-pin"}" id="filter-district-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    if (districtListContainer) {
      let distHtml = `
        <button
          type="button"
          class="picker-item-filter-district w-full px-3.5 py-2.5 rounded-2xl border ${
            selectedDistrict === "all"
              ? "border-2 border-rose-900 bg-rose-50/70 ring-2 ring-rose-900/20"
              : "border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50"
          } flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
          data-name="all"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl ${selectedDistrict === "all" ? "bg-rose-100 text-rose-900 border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"} flex items-center justify-center flex-shrink-0 item-icon-box">
              <i data-lucide="navigation" class="w-4 h-4 text-rose-900"></i>
            </div>
            <span class="text-sm ${selectedDistrict === "all" ? "font-black text-slate-900" : "font-extrabold text-slate-800"} item-title">Semua Kecamatan</span>
          </div>
          <div class="check-box w-5 h-5 rounded-full border-2 ${selectedDistrict === "all" ? "border-rose-900" : "border-slate-300"} flex items-center justify-center flex-shrink-0">
            <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 ${selectedDistrict === "all" ? "" : "hidden"}"></div>
          </div>
        </button>
      `;

      districts.forEach((d) => {
        const isSelected = d === selectedDistrict;
        distHtml += `
          <button
            type="button"
            class="picker-item-filter-district w-full px-3.5 py-2.5 rounded-2xl border ${
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
      districtListContainer.innerHTML = distHtml;

      districtListContainer.querySelectorAll(".picker-item-filter-district").forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();
          const name = btn.getAttribute("data-name");
          selectFilterDistrict(name, currentRegId);
          closeModal("modal-filter-district-picker");
        };
      });
    }

    if (window.lucide) {
      try {
        const filterModal = document.getElementById("modal-filter");
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById("modal-filter-district-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterDistrict]", err);
  }
}

// ─── SELECT KATEGORI ──────────────────────────────────────────────────────────

export function selectFilterCategory(catId) {
  try {
    const selectedId = catId || "all";
    const input = document.getElementById("filter-modal-category");
    if (input) input.value = selectedId;

    const meta = FILTER_CATEGORY_META[selectedId] || FILTER_CATEGORY_META["all"];

    const textEl = document.getElementById("filter-category-trigger-text");
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById("filter-category-trigger-icon-wrapper");
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-category-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll(".picker-item-filter-category").forEach((btn) => {
      const isSelected = btn.getAttribute("data-id") === selectedId;
      const checkDot = btn.querySelector(".check-dot");
      const checkBox = btn.querySelector(".check-box");
      const iconBox = btn.querySelector(".item-icon-box");
      const title = btn.querySelector(".item-title");

      if (isSelected) {
        btn.className =
          "picker-item-filter-category w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className =
          "picker-item-filter-category w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    if (window.lucide) {
      try {
        const filterModal = document.getElementById("modal-filter");
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById("modal-filter-category-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterCategory]", err);
  }
}

// ─── SELECT KONDISI ───────────────────────────────────────────────────────────

export function selectFilterCondition(condId) {
  try {
    const selectedId = condId || "all";
    const input = document.getElementById("filter-modal-condition");
    if (input) input.value = selectedId;

    const meta = FILTER_CONDITION_META[selectedId] || FILTER_CONDITION_META["all"];

    const textEl = document.getElementById("filter-condition-trigger-text");
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById("filter-condition-trigger-icon-wrapper");
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-condition-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll(".picker-item-filter-condition").forEach((btn) => {
      const isSelected = btn.getAttribute("data-id") === selectedId;
      const checkDot = btn.querySelector(".check-dot");
      const checkBox = btn.querySelector(".check-box");
      const iconBox = btn.querySelector(".item-icon-box");
      const title = btn.querySelector(".item-title");

      if (isSelected) {
        btn.className =
          "picker-item-filter-condition w-full px-4 py-3 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className =
          "picker-item-filter-condition w-full px-4 py-3 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add("hidden");
        if (checkBox)
          checkBox.className =
            "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox)
          iconBox.className =
            "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    if (window.lucide) {
      try {
        const filterModal = document.getElementById("modal-filter");
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById("modal-filter-condition-picker");
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterCondition]", err);
  }
}
