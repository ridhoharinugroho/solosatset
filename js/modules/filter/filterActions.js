/**
 * filterActions.js
 * Fungsi aksi filter: buka modal, terapkan, reset, sort, dan chip filter aktif.
 * Dipecah dari filterController.js untuk pemerataan beban kerja.
 */

import { CATEGORIES, CONDITIONS } from '../../data/categories.js';
import { getRegionById } from '../../data/regions.js';
import { formatRupiah } from '../../services/whatsapp.js';
import { refreshIcons } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openModal, closeModal } from '../common/modalManager.js';
import { selectFilterRegion, selectFilterCategory, selectFilterCondition } from './filterSelectors.js';

// ─── BUKA MODAL FILTER ────────────────────────────────────────────────────────

export function openFilterModal() {
  try {
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};

    selectFilterRegion(stateObj.selectedRegion || 'all', stateObj.selectedDistrict || 'all');
    selectFilterCategory(stateObj.selectedCategory || 'all');
    selectFilterCondition(stateObj.selectedCondition || 'all');
    if (minPriceInput) minPriceInput.value = stateObj.minPrice || '';
    if (maxPriceInput) maxPriceInput.value = stateObj.maxPrice || '';

    openModal('modal-filter');

    if (window.lucide) {
      try {
        const modalEl = document.getElementById('modal-filter');
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: openFilterModal]", err);
  }
}

// ─── TERAPKAN FILTER ──────────────────────────────────────────────────────────

export function applyFilterModal() {
  try {
    const regInput = document.getElementById('filter-modal-region');
    const distInput = document.getElementById('filter-modal-district');
    const catInput = document.getElementById('filter-modal-category');
    const condInput = document.getElementById('filter-modal-condition');
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};

    const newReg = regInput ? regInput.value : 'all';
    const newDist = distInput ? distInput.value : 'all';
    const newCat = catInput ? catInput.value : 'all';
    const newCond = condInput ? condInput.value : 'all';
    const newMin = minPriceInput && minPriceInput.value ? Number(minPriceInput.value) : null;
    const newMax = maxPriceInput && maxPriceInput.value ? Number(maxPriceInput.value) : null;

    const hasChanged = (
      stateObj.selectedRegion !== newReg ||
      stateObj.selectedDistrict !== newDist ||
      stateObj.selectedCategory !== newCat ||
      stateObj.selectedCondition !== newCond ||
      stateObj.minPrice !== newMin ||
      stateObj.maxPrice !== newMax
    );

    stateObj.selectedRegion = newReg;
    stateObj.selectedDistrict = newDist;
    stateObj.selectedCategory = newCat;
    stateObj.selectedCondition = newCond;
    stateObj.minPrice = newMin;
    stateObj.maxPrice = newMax;

    closeModal('modal-filter');

    if (hasChanged) {
      if (typeof window.renderRegionPills === 'function') window.renderRegionPills();
      if (typeof window.renderCategoryPills === 'function') window.renderCategoryPills();
      if (typeof window.renderListings === 'function') window.renderListings();
      showToast("Filter diterapkan", "info");
    }
  } catch (err) {
    console.warn("[ErrorBoundary: applyFilterModal]", err);
  }
}

// ─── SET FILTER WILAYAH ───────────────────────────────────────────────────────

export function setRegionFilter(regionId) {
  try {
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};
    stateObj.selectedRegion = regionId;
    stateObj.selectedDistrict = 'all';
    if (typeof window.renderRegionPills === 'function') window.renderRegionPills();
    if (typeof window.renderListings === 'function') window.renderListings();
  } catch (err) {
    console.warn("[ErrorBoundary: setRegionFilter]", err);
  }
}

// ─── RESET SEMUA FILTER ───────────────────────────────────────────────────────

export function resetAllFilters() {
  try {
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};
    const hadFilters = (
      stateObj.selectedRegion !== 'all' ||
      stateObj.selectedDistrict !== 'all' ||
      stateObj.selectedCategory !== 'all' ||
      stateObj.selectedCondition !== 'all' ||
      (stateObj.searchQuery && stateObj.searchQuery.trim() !== '') ||
      stateObj.minPrice !== null ||
      stateObj.maxPrice !== null
    );

    stateObj.selectedRegion = 'all';
    stateObj.selectedDistrict = 'all';
    stateObj.selectedCategory = 'all';
    stateObj.selectedCondition = 'all';
    selectFilterRegion('all', 'all');
    selectFilterCategory('all');
    selectFilterCondition('all');
    stateObj.searchQuery = '';
    stateObj.minPrice = null;
    stateObj.maxPrice = null;

    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';

    const dInput = document.getElementById('desktop-search-input');
    const mInput = document.getElementById('mobile-search-input');
    if (dInput) dInput.value = '';
    if (mInput) mInput.value = '';

    if (hadFilters) {
      if (typeof window.renderRegionPills === 'function') window.renderRegionPills();
      if (typeof window.renderCategoryPills === 'function') window.renderCategoryPills();
      if (typeof window.renderListings === 'function') window.renderListings();
      showToast("Semua filter telah direset.", "info");
    }
  } catch (err) {
    console.warn("[ErrorBoundary: resetAllFilters]", err);
  }
}

// ─── UPDATE UI SORT ───────────────────────────────────────────────────────────

export function updateSortRadioUI() {
  const stateObj = typeof window.state !== 'undefined' ? window.state : {};
  const currentSort = stateObj.sortBy || 'newest';
  const sortLabels = {
    'newest': 'Terbaru',
    'price_low': 'Termurah',
    'price_high': 'Termahal',
    'views': 'Banyak dilihat'
  };

  const labelEl = document.getElementById('current-sort-label');
  if (labelEl) {
    labelEl.textContent = sortLabels[currentSort] || 'Terbaru';
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = currentSort;
  }

  document.querySelectorAll('.sort-option-item').forEach((item) => {
    const val = item.getAttribute('data-sort-val');
    const isSelected = val === currentSort;
    const indicator = item.querySelector('.sort-radio-indicator');
    const dot = item.querySelector('.sort-radio-dot');

    if (isSelected) {
      item.classList.add('bg-rose-50/80', 'border-rose-200/90', 'shadow-2xs');
      item.classList.remove('border-transparent', 'hover:bg-slate-50');
      if (indicator) {
        indicator.className = 'sort-radio-indicator flex-shrink-0 w-4.5 h-4.5 rounded-full border-2 border-rose-900 bg-white flex items-center justify-center shadow-xs';
      }
      if (dot) {
        dot.className = 'sort-radio-dot w-2 h-2 rounded-full bg-rose-900';
      }
    } else {
      item.classList.remove('bg-rose-50/80', 'border-rose-200/90', 'shadow-2xs');
      item.classList.add('border-transparent', 'hover:bg-slate-50');
      if (indicator) {
        indicator.className = 'sort-radio-indicator flex-shrink-0 w-4.5 h-4.5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center';
      }
      if (dot) {
        dot.className = 'sort-radio-dot w-2 h-2 rounded-full bg-transparent';
      }
    }
  });

  document.querySelectorAll('.sort-option-pill').forEach((pill) => {
    const val = pill.getAttribute('data-sort-val');
    const isSelected = val === currentSort;
    const icon = pill.querySelector('svg') || pill.querySelector('.lucide') || pill.querySelector('i[data-lucide="arrow-up-down"]');

    if (isSelected) {
      pill.classList.add('bg-rose-900', 'text-white', 'border-rose-900', 'ring-2', 'ring-rose-900/20');
      pill.classList.remove('bg-white', 'text-slate-700', 'border-slate-200/90', 'hover:bg-slate-50', 'hover:border-slate-300');
      if (icon) {
        icon.classList.remove('text-slate-400', 'group-hover:text-slate-600');
        icon.classList.add('text-amber-300');
      }
    } else {
      pill.classList.remove('bg-rose-900', 'text-white', 'border-rose-900', 'ring-2', 'ring-rose-900/20');
      pill.classList.add('bg-white', 'text-slate-700', 'border-slate-200/90', 'hover:bg-slate-50', 'hover:border-slate-300');
      if (icon) {
        icon.classList.remove('text-amber-300');
        icon.classList.add('text-slate-400', 'group-hover:text-slate-600');
      }
    }
  });
}

// ─── UPDATE CHIP FILTER AKTIF ─────────────────────────────────────────────────

export function updateActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;
  const stateObj = typeof window.state !== 'undefined' ? window.state : {};

  const chips = [];

  if (stateObj.selectedRegion && stateObj.selectedRegion !== 'all') {
    const reg = getRegionById(stateObj.selectedRegion);
    chips.push({
      label: `Wilayah: ${reg ? reg.shortName : stateObj.selectedRegion}`,
      action: () => setRegionFilter('all')
    });
  }

  if (stateObj.selectedDistrict && stateObj.selectedDistrict !== 'all') {
    chips.push({
      label: `Kec. ${stateObj.selectedDistrict}`,
      action: () => {
        stateObj.selectedDistrict = 'all';
        if (typeof window.renderListings === 'function') window.renderListings();
      }
    });
  }

  if (stateObj.selectedCategory && stateObj.selectedCategory !== 'all') {
    const cat = CATEGORIES.find((c) => c.id === stateObj.selectedCategory);
    chips.push({
      label: `Kategori: ${cat ? cat.name : stateObj.selectedCategory}`,
      action: () => {
        stateObj.selectedCategory = 'all';
        if (typeof window.renderCategoryPills === 'function') window.renderCategoryPills();
        if (typeof window.renderListings === 'function') window.renderListings();
      }
    });
  }

  if (stateObj.selectedCondition && stateObj.selectedCondition !== 'all') {
    const cond = CONDITIONS.find((c) => c.id === stateObj.selectedCondition);
    chips.push({
      label: `Kondisi: ${cond ? cond.label.split('(')[0] : stateObj.selectedCondition}`,
      action: () => {
        stateObj.selectedCondition = 'all';
        if (typeof window.renderListings === 'function') window.renderListings();
      }
    });
  }

  if (stateObj.searchQuery) {
    chips.push({
      label: `Cari: "${stateObj.searchQuery}"`,
      action: () => {
        stateObj.searchQuery = '';
        const dInput = document.getElementById('desktop-search-input');
        const mInput = document.getElementById('mobile-search-input');
        if (dInput) dInput.value = '';
        if (mInput) mInput.value = '';
        if (typeof window.renderListings === 'function') window.renderListings();
      }
    });
  }

  if (stateObj.minPrice || stateObj.maxPrice) {
    chips.push({
      label: `Harga: ${stateObj.minPrice ? formatRupiah(stateObj.minPrice) : '0'} - ${stateObj.maxPrice ? formatRupiah(stateObj.maxPrice) : 'Max'}`,
      action: () => {
        stateObj.minPrice = null;
        stateObj.maxPrice = null;
        if (typeof window.renderListings === 'function') window.renderListings();
      }
    });
  }

  if (chips.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';
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

  container.querySelectorAll('button[data-chip-idx]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-chip-idx'), 10);
      if (chips[idx] && typeof chips[idx].action === 'function') {
        chips[idx].action();
      }
    });
  });

  document.getElementById('btn-clear-all-chips')?.addEventListener('click', (e) => {
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

// ─── POPULATE OPTIONS MODAL ───────────────────────────────────────────────────

export function populateFilterModalOptions() {
  try {
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};
    selectFilterRegion(stateObj.selectedRegion || 'all', stateObj.selectedDistrict || 'all');
  } catch (err) {
    console.warn("[ErrorBoundary: populateFilterModalOptions]", err);
  }
}

export function populateFormRegions() {
  populateFilterModalOptions();
}
