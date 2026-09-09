import { SOLO_RAYA_REGIONS, getRegionById, getDistrictsByRegionId } from '../../data/regions.js';
import { CATEGORIES, CONDITIONS } from '../../data/categories.js';
import { formatRupiah, formatRegionTitle, formatDistrictTitle } from '../../services/whatsapp.js';
import { refreshIcons } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openModal, closeModal } from '../common/modalManager.js';

export const FILTER_REGION_META = {
  'all': { name: 'Semua Wilayah Solo Raya', icon: 'map-pin' },
  'solo': { name: 'Kota Solo (Surakarta)', icon: 'map-pin' },
  'karanganyar': { name: 'Kab. Karanganyar', icon: 'map-pin' },
  'sukoharjo': { name: 'Kab. Sukoharjo', icon: 'map-pin' },
  'wonogiri': { name: 'Kab. Wonogiri', icon: 'map-pin' },
  'sragen': { name: 'Kab. Sragen', icon: 'map-pin' },
  'boyolali': { name: 'Kab. Boyolali', icon: 'map-pin' },
  'klaten': { name: 'Kab. Klaten', icon: 'map-pin' }
};

export const FILTER_CATEGORY_META = {
  'all': { name: 'Semua Kategori', icon: 'grid' },
  'elektronik': { name: 'Elektronik & Gadget', icon: 'smartphone' },
  'kendaraan': { name: 'Kendaraan & Otomotif', icon: 'bike' },
  'perabot': { name: 'Perabot & Rumah Tangga', icon: 'armchair' },
  'pakaian': { name: 'Pakaian & Aksesoris', icon: 'shirt' },
  'kuliner': { name: 'Makanan & Minuman', icon: 'utensils' },
  'bayi-anak': { name: 'Perlengkapan Bayi & Anak', icon: 'baby' },
  'pertukangan': { name: 'Pertukangan / Bahan Bangunan', icon: 'hammer' },
  'hobi': { name: 'Hobi, Musik & Olahraga', icon: 'trophy' },
  'hewan': { name: 'Hewan & Perlengkapan', icon: 'cat' },
  'alat-sekolah': { name: 'Peralatan Sekolah', icon: 'book-open' },
  'perawatan-diri': { name: 'Perawatan Diri', icon: 'sparkles' },
  'properti': { name: 'Properti', icon: 'building-2' },
  'jasa': { name: 'Jasa', icon: 'wrench' },
  'lainnya': { name: 'Lain-lain / Aneka Barang', icon: 'package' }
};

export const FILTER_CONDITION_META = {
  'all': { name: 'Semua Kondisi', icon: 'layers' },
  'new': { name: 'Baru (Gres / Segel)', icon: 'sparkles' },
  'like_new': { name: 'Bekas - Seperti Baru', icon: 'gem' },
  'good': { name: 'Bekas - Mulus / Normal', icon: 'check-circle-2' },
  'fair': { name: 'Bekas - Wajar Pemakaian', icon: 'clock' },
  'repair': { name: 'Bekas - Butuh Servis / Bahan', icon: 'wrench' }
};

export function selectFilterRegion(regId, customDistrict = null) {
  try {
    const selectedRegId = regId || 'all';
    const input = document.getElementById('filter-modal-region');
    if (input) input.value = selectedRegId;

    const meta = FILTER_REGION_META[selectedRegId] || FILTER_REGION_META['all'];

    const textEl = document.getElementById('filter-region-trigger-text');
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById('filter-region-trigger-icon-wrapper');
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-region-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll('.picker-item-filter-region').forEach((btn) => {
      const isSelected = btn.getAttribute('data-id') === selectedRegId;
      const checkDot = btn.querySelector('.check-dot');
      const checkBox = btn.querySelector('.check-box');
      const iconBox = btn.querySelector('.item-icon-box');
      const title = btn.querySelector('.item-title');

      if (isSelected) {
        btn.className = "picker-item-filter-region w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className = "picker-item-filter-region w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    let targetDistrict = customDistrict;
    if (selectedRegId === 'all') {
      targetDistrict = 'all';
    } else {
      const districts = getDistrictsByRegionId(selectedRegId) || [];
      if (!targetDistrict || (targetDistrict !== 'all' && !districts.includes(targetDistrict))) {
        targetDistrict = 'all';
      }
    }
    selectFilterDistrict(targetDistrict, selectedRegId);

    if (window.lucide) {
      try {
        const filterModal = document.getElementById('modal-filter');
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById('modal-filter-region-picker');
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterRegion]", err);
  }
}

export function selectFilterDistrict(districtName, regId = null) {
  try {
    const currentRegId = regId || document.getElementById('filter-modal-region')?.value || 'all';
    const districts = currentRegId === 'all' ? [] : (getDistrictsByRegionId(currentRegId) || []);
    const selectedDistrict = (districtName && districts.includes(districtName)) ? districtName : 'all';

    const districtInput = document.getElementById('filter-modal-district');
    const triggerText = document.getElementById('filter-district-trigger-text');
    const districtListContainer = document.getElementById('picker-filter-district-list');
    const districtIconWrapper = document.getElementById('filter-district-trigger-icon-wrapper');

    if (districtInput) districtInput.value = selectedDistrict;
    if (triggerText) {
      triggerText.textContent = selectedDistrict === 'all' ? 'Semua Kecamatan' : `Kec. ${selectedDistrict}`;
    }
    if (districtIconWrapper) {
      districtIconWrapper.innerHTML = `<i data-lucide="${selectedDistrict === 'all' ? 'navigation' : 'map-pin'}" id="filter-district-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    if (districtListContainer) {
      let distHtml = `
        <button
          type="button"
          class="picker-item-filter-district w-full px-3.5 py-2.5 rounded-2xl border ${selectedDistrict === 'all'
          ? 'border-2 border-rose-900 bg-rose-50/70 ring-2 ring-rose-900/20'
          : 'border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50'
        } flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
          data-name="all"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl ${selectedDistrict === 'all' ? 'bg-rose-100 text-rose-900 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} flex items-center justify-center flex-shrink-0 item-icon-box">
              <i data-lucide="navigation" class="w-4 h-4 text-rose-900"></i>
            </div>
            <span class="text-sm ${selectedDistrict === 'all' ? 'font-black text-slate-900' : 'font-extrabold text-slate-800'} item-title">Semua Kecamatan</span>
          </div>
          <div class="check-box w-5 h-5 rounded-full border-2 ${selectedDistrict === 'all' ? 'border-rose-900' : 'border-slate-300'} flex items-center justify-center flex-shrink-0">
            <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 ${selectedDistrict === 'all' ? '' : 'hidden'}"></div>
          </div>
        </button>
      `;

      districts.forEach((d) => {
        const isSelected = d === selectedDistrict;
        distHtml += `
          <button
            type="button"
            class="picker-item-filter-district w-full px-3.5 py-2.5 rounded-2xl border ${isSelected
            ? 'border-2 border-rose-900 bg-rose-50/70 ring-2 ring-rose-900/20'
            : 'border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50'
          } flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
            data-name="${d}"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-xl ${isSelected ? 'bg-rose-100 text-rose-900 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} flex items-center justify-center flex-shrink-0 item-icon-box">
                <i data-lucide="map-pin" class="w-4 h-4 text-rose-900"></i>
              </div>
              <span class="text-sm ${isSelected ? 'font-black text-slate-900' : 'font-extrabold text-slate-800'} item-title">Kec. ${d}</span>
            </div>
            <div class="check-box w-5 h-5 rounded-full border-2 ${isSelected ? 'border-rose-900' : 'border-slate-300'} flex items-center justify-center flex-shrink-0">
              <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 ${isSelected ? '' : 'hidden'}"></div>
            </div>
          </button>
        `;
      });
      districtListContainer.innerHTML = distHtml;

      districtListContainer.querySelectorAll('.picker-item-filter-district').forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();
          const name = btn.getAttribute('data-name');
          selectFilterDistrict(name, currentRegId);
          closeModal('modal-filter-district-picker');
        };
      });
    }

    if (window.lucide) {
      try {
        const filterModal = document.getElementById('modal-filter');
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById('modal-filter-district-picker');
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterDistrict]", err);
  }
}

export function populateFilterModalOptions() {
  try {
    const stateObj = typeof window.state !== 'undefined' ? window.state : {};
    selectFilterRegion(stateObj.selectedRegion || 'all', stateObj.selectedDistrict || 'all');
  } catch (err) {
    console.warn("[ErrorBoundary: populateFilterModalOptions]", err);
  }
}

export function selectFilterCategory(catId) {
  try {
    const selectedId = catId || 'all';
    const input = document.getElementById('filter-modal-category');
    if (input) input.value = selectedId;

    const meta = FILTER_CATEGORY_META[selectedId] || FILTER_CATEGORY_META['all'];

    const textEl = document.getElementById('filter-category-trigger-text');
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById('filter-category-trigger-icon-wrapper');
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-category-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll('.picker-item-filter-category').forEach((btn) => {
      const isSelected = btn.getAttribute('data-id') === selectedId;
      const checkDot = btn.querySelector('.check-dot');
      const checkBox = btn.querySelector('.check-box');
      const iconBox = btn.querySelector('.item-icon-box');
      const title = btn.querySelector('.item-title');

      if (isSelected) {
        btn.className = "picker-item-filter-category w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className = "picker-item-filter-category w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    if (window.lucide) {
      try {
        const filterModal = document.getElementById('modal-filter');
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById('modal-filter-category-picker');
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterCategory]", err);
  }
}

export function selectFilterCondition(condId) {
  try {
    const selectedId = condId || 'all';
    const input = document.getElementById('filter-modal-condition');
    if (input) input.value = selectedId;

    const meta = FILTER_CONDITION_META[selectedId] || FILTER_CONDITION_META['all'];

    const textEl = document.getElementById('filter-condition-trigger-text');
    if (textEl) textEl.textContent = meta.name;

    const iconWrapper = document.getElementById('filter-condition-trigger-icon-wrapper');
    if (iconWrapper) {
      iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="filter-condition-trigger-icon" class="w-3.5 h-3.5 text-rose-900"></i>`;
    }

    document.querySelectorAll('.picker-item-filter-condition').forEach((btn) => {
      const isSelected = btn.getAttribute('data-id') === selectedId;
      const checkDot = btn.querySelector('.check-dot');
      const checkBox = btn.querySelector('.check-box');
      const iconBox = btn.querySelector('.item-icon-box');
      const title = btn.querySelector('.item-title');

      if (isSelected) {
        btn.className = "picker-item-filter-condition w-full px-4 py-3 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
        if (checkDot) checkDot.classList.remove('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-900 item-title";
      } else {
        btn.className = "picker-item-filter-condition w-full px-4 py-3 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
        if (checkDot) checkDot.classList.add('hidden');
        if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
        if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
        if (title) title.className = "text-sm font-black text-slate-800 item-title";
      }
    });

    if (window.lucide) {
      try {
        const filterModal = document.getElementById('modal-filter');
        if (filterModal) refreshIcons(filterModal);
        const modalEl = document.getElementById('modal-filter-condition-picker');
        if (modalEl) refreshIcons(modalEl);
      } catch (e) {
        refreshIcons();
      }
    }
  } catch (err) {
    console.warn("[ErrorBoundary: selectFilterCondition]", err);
  }
}

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

if (typeof window !== 'undefined') {
  window.selectFilterRegion = selectFilterRegion;
  window.selectFilterDistrict = selectFilterDistrict;
  window.populateFilterModalOptions = populateFilterModalOptions;
  window.selectFilterCategory = selectFilterCategory;
  window.selectFilterCondition = selectFilterCondition;
  window.openFilterModal = openFilterModal;
  window.applyFilterModal = applyFilterModal;
  window.setRegionFilter = setRegionFilter;
  window.resetAllFilters = resetAllFilters;
  window.updateSortRadioUI = updateSortRadioUI;
  window.updateActiveFilterChips = updateActiveFilterChips;
}
