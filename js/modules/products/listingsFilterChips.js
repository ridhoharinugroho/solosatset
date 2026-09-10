import { getRegionById } from "../../data/regions.js";
import { CATEGORIES, CONDITIONS } from "../../data/categories.js";
import { formatRupiah, refreshIcons } from "../../utils/runtime.js";
import { setRegionFilter, resetAllFilters } from "../filter/filterController.js";
import { renderCategoryPills } from "../home/homeUI.js";

export function renderFilterChips(renderListingsFn) {
  const container = document.getElementById("active-filter-chips");
  if (!container) return;

  const state = window.state || {};
  const chips = [];

  if ("all" !== state.selectedRegion) {
    const reg = getRegionById(state.selectedRegion);
    chips.push({
      label: `Wilayah: ${reg ? reg.shortName : state.selectedRegion}`,
      action: () => setRegionFilter("all"),
    });
  }
  if (state.selectedDistrict && "all" !== state.selectedDistrict) {
    chips.push({
      label: `Kec. ${state.selectedDistrict}`,
      action: () => {
        state.selectedDistrict = "all";
        if (typeof renderListingsFn === "function") renderListingsFn();
      },
    });
  }
  if (state.selectedCategory && "all" !== state.selectedCategory) {
    const cat = CATEGORIES.find((c) => c.id === state.selectedCategory);
    chips.push({
      label: `Kategori: ${cat ? cat.name : state.selectedCategory}`,
      action: () => {
        state.selectedCategory = "all";
        renderCategoryPills();
        if (typeof renderListingsFn === "function") renderListingsFn();
      },
    });
  }
  if (state.selectedCondition && "all" !== state.selectedCondition) {
    const cond = CONDITIONS.find((c) => c.id === state.selectedCondition);
    chips.push({
      label: `Kondisi: ${cond ? cond.label.split("(")[0] : state.selectedCondition}`,
      action: () => {
        state.selectedCondition = "all";
        if (typeof renderListingsFn === "function") renderListingsFn();
      },
    });
  }
  if (state.searchQuery) {
    chips.push({
      label: `Cari: "${state.searchQuery}"`,
      action: () => {
        state.searchQuery = "";
        const dInput = document.getElementById("desktop-search-input");
        const mInput = document.getElementById("mobile-search-input");
        if (dInput) dInput.value = "";
        if (mInput) mInput.value = "";
        if (typeof renderListingsFn === "function") renderListingsFn();
      },
    });
  }
  if (state.minPrice || state.maxPrice) {
    chips.push({
      label: `Harga: ${state.minPrice ? formatRupiah(state.minPrice) : "0"} - ${state.maxPrice ? formatRupiah(state.maxPrice) : "Max"}`,
      action: () => {
        state.minPrice = null;
        state.maxPrice = null;
        if (typeof renderListingsFn === "function") renderListingsFn();
      },
    });
  }

  if (chips.length === 0) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  chips.forEach((chip, index) => {
    html += `
      <span class="inline-flex items-center gap-1.5 bg-rose-100/90 hover:bg-rose-200/90 text-rose-900 border border-rose-300/80 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs transition-colors select-none">
        <span class="leading-tight">${chip.label}</span>
        <button
          type="button"
          data-chip-idx="${index}"
          aria-label="Hapus filter ${chip.label}"
          class="w-4 h-4 rounded-full bg-rose-200/80 hover:bg-rose-300 text-rose-900 inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
        >
          <i data-lucide="x" class="w-2.5 h-2.5 stroke-[2.8]"></i>
        </button>
      </span>
    `;
  });
  html += `
    <button type="button" id="btn-clear-all-chips" class="text-rose-900 hover:text-rose-950 text-[11px] font-extrabold hover:underline ml-1 py-0.5 px-1.5 rounded-md hover:bg-rose-100/60 transition-colors cursor-pointer inline-flex items-center gap-1">
      <i data-lucide="rotate-ccw" class="w-2.5 h-2.5"></i>
      <span>Hapus Semua</span>
    </button>
  `;

  container.innerHTML = html;
  container.querySelectorAll("button[data-chip-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-chip-idx"), 10);
      if (chips[idx] && typeof chips[idx].action === "function") {
        chips[idx].action();
      }
    });
  });

  document.getElementById("btn-clear-all-chips")?.addEventListener("click", (e) => {
    e.preventDefault();
    resetAllFilters();
  });

  if (window.lucide) {
    try {
      refreshIcons(container);
    } catch (e) {
      refreshIcons();
    }
  }
}
