import { SOLO_RAYA_REGIONS, getRegionById } from "../../data/regions.js";
import { CATEGORIES } from "../../data/categories.js";
import { getPublicListings } from "../../services/storage.js";
import { refreshIcons, deferTask } from "../../utils/runtime.js";
import { setRegionFilter } from "../filter/filterController.js";

export function showHomeLoadingSkeleton() {
  const grid = document.getElementById("listings-grid") || document.getElementById("listings-container");
  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.classList.add("hidden");
  if (grid) {
    grid.innerHTML = `
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse hidden md:block">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse hidden lg:block">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
    `;
  }
}

export function renderRegionPills() {
  const container = document.getElementById("region-pills-container");
  if (!container) return;
  const stateObj = typeof window.state !== "undefined" ? window.state : {};

  const listings = getPublicListings();
  const isLoaded =
    Boolean(window.hasInitialListingsLoaded) ||
    (Array.isArray(listings) && listings.length > 0 && !window.isInitialFeedLoading);
  const allCount = isLoaded ? (Array.isArray(listings) ? listings.length : 0) : "-";
  const selectedReg = stateObj.selectedRegion || "all";

  let html = `
    <button
      type="button"
      data-region="all"
      class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${
        selectedReg === "all"
          ? "bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20"
          : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
      }"
    >
      <span class="pointer-events-none">🌟 Semua</span>
      <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none pointer-events-none ${
        selectedReg === "all" ? "bg-rose-800 text-amber-300" : "bg-slate-100 text-slate-600"
      }">${allCount}</span>
    </button>
  `;

  SOLO_RAYA_REGIONS.forEach((reg) => {
    const isSelected = selectedReg === reg.id;
    const count = isLoaded ? (Array.isArray(listings) ? listings.filter((l) => l.regionId === reg.id).length : 0) : "-";

    html += `
      <button
        type="button"
        data-region="${reg.id}"
        class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${
          isSelected
            ? "bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20"
            : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
        }"
      >
        <span class="w-2 h-2 rounded-full flex-shrink-0 pointer-events-none" style="background-color: ${reg.accentColor}"></span>
        <span class="truncate pointer-events-none">${reg.shortName}</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none flex-shrink-0 pointer-events-none ${
          isSelected ? "bg-rose-800 text-amber-300" : "bg-slate-100 text-slate-600"
        }">${count}</span>
      </button>
    `;
  });

  container.innerHTML = html;

  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-region]");
      if (targetBtn) {
        e.preventDefault();
        e.stopPropagation();
        const regionId = targetBtn.getAttribute("data-region");
        if (regionId) {
          setRegionFilter(regionId);
        }
      }
    });
  }

  const indicator = document.getElementById("region-current-indicator");
  if (indicator) {
    if (selectedReg === "all") {
      indicator.textContent = stateObj.customTexts?.region_indicator_all || "Menampilkan: 7 Wilayah Solo Raya";
    } else {
      const reg = getRegionById(selectedReg);
      indicator.textContent = `Menampilkan: ${reg ? reg.name : selectedReg}`;
    }
  }
}

export function renderCategoryPills(renderListingsFn) {
  const container = document.getElementById("category-pills-container");
  if (!container) return;
  const stateObj = typeof window.state !== "undefined" ? window.state : {};
  const selectedCat = stateObj.selectedCategory || "all";

  let html = "";
  CATEGORIES.forEach((cat) => {
    const isSelected = selectedCat === cat.id;
    const labelHtml = cat.displayHtml || cat.name;

    html += `
      <button
        type="button"
        data-category="${cat.id}"
        class="category-pill flex flex-col items-center justify-start flex-shrink-0 w-[52px] min-[380px]:w-[58px] sm:w-[68px] group cursor-pointer text-center select-none"
        title="${cat.name}"
      >
        <div class="w-[44px] h-[44px] min-[380px]:w-[48px] min-[380px]:h-[48px] sm:w-[56px] sm:h-[56px] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? "bg-rose-900 text-amber-300 shadow-sm ring-2 ring-rose-900/25 scale-105 border-2 border-rose-800"
            : "bg-white text-rose-900 border border-[#e2e8f2]/90 shadow-2xs group-hover:bg-slate-50 group-hover:border-rose-300 group-hover:scale-105"
        }">
          <i data-lucide="${cat.icon}" class="w-5 h-5 min-[380px]:w-5.5 min-[380px]:h-5.5 sm:w-6.5 sm:h-6.5 transition-transform group-hover:scale-110"></i>
        </div>
        <span class="mt-1 px-0.5 text-[8px] min-[360px]:text-[8.5px] min-[380px]:text-[9.5px] sm:text-[10.5px] font-bold leading-[1.15] text-center tracking-tight transition-colors h-5.5 min-[380px]:h-6 sm:h-6.5 flex items-start justify-center overflow-hidden ${
          isSelected ? "text-rose-950 font-black" : "text-slate-700 group-hover:text-rose-900"
        }">
          ${labelHtml}
        </span>
      </button>
    `;
  });

  container.innerHTML = html;

  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-category]");
      if (pill) {
        e.preventDefault();
        const catId = pill.getAttribute("data-category");
        if (catId && stateObj.selectedCategory !== catId) {
          stateObj.selectedCategory = catId;
          renderCategoryPills(renderListingsFn);
          if (typeof renderListingsFn === "function") {
            deferTask(() => renderListingsFn());
          }
        }
      }
    });
  }

  try {
    refreshIcons(container);
  } catch (_e) {}
}
