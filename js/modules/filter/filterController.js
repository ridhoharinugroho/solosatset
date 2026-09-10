/**
 * filterController.js
 * Facade utama filter — mendelegasikan ke sub-modul yang lebih spesifik.
 * 
 * Sub-modul:
 *   - filterMeta.js      : Konstanta metadata (FILTER_*_META)
 *   - filterSelectors.js : Fungsi seleksi UI (selectFilter*)
 *   - filterActions.js   : Fungsi aksi (open, apply, reset, sort, chips)
 */

// ─── RE-EXPORT KONSTANTA ──────────────────────────────────────────────────────
export { FILTER_REGION_META, FILTER_CATEGORY_META, FILTER_CONDITION_META } from './filterMeta.js';

// ─── RE-EXPORT SELECTORS ──────────────────────────────────────────────────────
export {
  selectFilterRegion,
  selectFilterDistrict,
  selectFilterCategory,
  selectFilterCondition
} from './filterSelectors.js';

// ─── RE-EXPORT ACTIONS ────────────────────────────────────────────────────────
export {
  populateFilterModalOptions,
  openFilterModal,
  applyFilterModal,
  setRegionFilter,
  resetAllFilters,
  updateSortRadioUI,
  updateActiveFilterChips
} from './filterActions.js';

// ─── DAFTARKAN KE WINDOW (BACKWARD COMPATIBILITY) ────────────────────────────
import { selectFilterRegion, selectFilterDistrict, selectFilterCategory, selectFilterCondition } from './filterSelectors.js';
import { populateFilterModalOptions, openFilterModal, applyFilterModal, setRegionFilter, resetAllFilters, updateSortRadioUI, updateActiveFilterChips } from './filterActions.js';

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
