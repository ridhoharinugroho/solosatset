import { SOLO_RAYA_REGIONS, getRegionById } from '../../data/regions.js';
import { CATEGORIES, CONDITIONS, SAMPLE_LISTINGS } from '../../data/categories.js';
import { getCurrentUser, isUserLoggedIn, isDemoUser, isSellerVerified } from '../../services/auth.js';
import { getPublicListings, isFavorite, toggleFavorite } from '../../services/storage.js';
import { formatRupiah, generateWhatsAppUrl, timeAgo } from '../../services/whatsapp.js';
import { refreshIcons, deferTask } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openCreateListingModal } from '../listings/listingFormModal.js';
import { handleProductClick, openProductDetail } from '../listings/productDetailModal.js';
import { setRegionFilter, updateActiveFilterChips } from '../filter/filterController.js';

export function showHomeLoadingSkeleton() {
  const grid = document.getElementById('listings-grid') || document.getElementById('listings-container');
  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.classList.add('hidden');
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
  const container = document.getElementById('region-pills-container');
  if (!container) return;
  const stateObj = typeof window.state !== 'undefined' ? window.state : {};

  const listings = getPublicListings();
  const isLoaded = Boolean(window.hasInitialListingsLoaded) || (Array.isArray(listings) && listings.length > 0 && !window.isInitialFeedLoading);
  const allCount = isLoaded ? (Array.isArray(listings) ? listings.length : 0) : '-';
  const selectedReg = stateObj.selectedRegion || 'all';

  let html = `
    <button
      type="button"
      data-region="all"
      class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${selectedReg === 'all'
      ? 'bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20'
      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
    }"
    >
      <span class="pointer-events-none">🌟 Semua</span>
      <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none pointer-events-none ${selectedReg === 'all' ? 'bg-rose-800 text-amber-300' : 'bg-slate-100 text-slate-600'
    }">${allCount}</span>
    </button>
  `;

  SOLO_RAYA_REGIONS.forEach((reg) => {
    const isSelected = selectedReg === reg.id;
    const count = isLoaded ? (Array.isArray(listings) ? listings.filter((l) => l.regionId === reg.id).length : 0) : '-';

    html += `
      <button
        type="button"
        data-region="${reg.id}"
        class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${isSelected
        ? 'bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20'
        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
      }"
      >
        <span class="w-2 h-2 rounded-full flex-shrink-0 pointer-events-none" style="background-color: ${reg.accentColor}"></span>
        <span class="truncate pointer-events-none">${reg.shortName}</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none flex-shrink-0 pointer-events-none ${isSelected ? 'bg-rose-800 text-amber-300' : 'bg-slate-100 text-slate-600'
      }">${count}</span>
      </button>
    `;
  });

  container.innerHTML = html;

  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-region]');
      if (targetBtn) {
        e.preventDefault();
        e.stopPropagation();
        const regionId = targetBtn.getAttribute('data-region');
        if (regionId) {
          setRegionFilter(regionId);
        }
      }
    });
  }

  const indicator = document.getElementById('region-current-indicator');
  if (indicator) {
    if (selectedReg === 'all') {
      indicator.textContent = stateObj.customTexts?.region_indicator_all || 'Menampilkan: 7 Wilayah Solo Raya';
    } else {
      const reg = getRegionById(selectedReg);
      indicator.textContent = `Menampilkan: ${reg ? reg.name : selectedReg}`;
    }
  }
}

export function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;
  const stateObj = typeof window.state !== 'undefined' ? window.state : {};
  const selectedCat = stateObj.selectedCategory || 'all';

  let html = '';
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
        <div class="w-[44px] h-[44px] min-[380px]:w-[48px] min-[380px]:h-[48px] sm:w-[56px] sm:h-[56px] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${isSelected
        ? 'bg-rose-900 text-amber-300 shadow-sm ring-2 ring-rose-900/25 scale-105 border-2 border-rose-800'
        : 'bg-white text-rose-900 border border-[#e2e8f2]/90 shadow-2xs group-hover:bg-slate-50 group-hover:border-rose-300 group-hover:scale-105'
      }">
          <i data-lucide="${cat.icon}" class="w-5 h-5 min-[380px]:w-5.5 min-[380px]:h-5.5 sm:w-6.5 sm:h-6.5 transition-transform group-hover:scale-110"></i>
        </div>
        <span class="mt-1 px-0.5 text-[8px] min-[360px]:text-[8.5px] min-[380px]:text-[9.5px] sm:text-[10.5px] font-bold leading-[1.15] text-center tracking-tight transition-colors h-5.5 min-[380px]:h-6 sm:h-6.5 flex items-start justify-center overflow-hidden ${isSelected
        ? 'text-rose-950 font-black'
        : 'text-slate-700 group-hover:text-rose-900'
      }">
          ${labelHtml}
        </span>
      </button>
    `;
  });

  container.innerHTML = html;

  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-category]');
      if (pill) {
        e.preventDefault();
        const catId = pill.getAttribute('data-category');
        if (catId && stateObj.selectedCategory !== catId) {
          stateObj.selectedCategory = catId;
          renderCategoryPills();
          deferTask(() => renderListings());
        }
      }
    });
  }

  try { refreshIcons(container); } catch (e) { }
}

export function renderListings() {
  const grid = document.getElementById('listings-grid') || document.getElementById('listings-container');
  const emptyState = document.getElementById('empty-state');
  const countBadge = document.getElementById('listings-count');
  if (!grid) return;

  const stateObj = typeof window.state !== 'undefined' ? window.state : {};

  if (window.isInitialFeedLoading && !window.hasInitialListingsLoaded) {
    showHomeLoadingSkeleton();
    return;
  }

  const isListView = stateObj.siteSettings && stateObj.siteSettings.layoutStyle === 'list';
  const chatWaText = stateObj.customTexts?.btn_chat_wa_card || "Chat WA";
  const detailText = stateObj.customTexts?.btn_detail_card || "Detail";

  if (isListView) {
    grid.className = "flex flex-col gap-3 transition-all feed-fade-in";
  } else {
    grid.className = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5 px-3.5 sm:px-4 lg:px-6 transition-all feed-fade-in";
  }

  let listings = getPublicListings();
  if (!Array.isArray(listings) || listings.length === 0) {
    listings = Array.isArray(SAMPLE_LISTINGS) ? [...SAMPLE_LISTINGS] : [];
  }

  const selRegion = stateObj.selectedRegion || 'all';
  const selDistrict = stateObj.selectedDistrict || 'all';
  const selCategory = stateObj.selectedCategory || 'all';
  const selCondition = stateObj.selectedCondition || 'all';
  const sortBy = stateObj.sortBy || 'newest';

  if (selRegion !== 'all') {
    listings = listings.filter((l) => l.regionId === selRegion);
  }
  if (selDistrict !== 'all') {
    listings = listings.filter((l) => l.district && l.district.toLowerCase() === selDistrict.toLowerCase());
  }
  if (selCategory !== 'all') {
    listings = listings.filter((l) => l.category === selCategory);
  }
  if (selCondition !== 'all') {
    listings = listings.filter((l) => l.condition === selCondition);
  }
  if (stateObj.minPrice !== null && stateObj.minPrice !== undefined && !isNaN(stateObj.minPrice)) {
    listings = listings.filter((l) => l.price >= stateObj.minPrice);
  }
  if (stateObj.maxPrice !== null && stateObj.maxPrice !== undefined && !isNaN(stateObj.maxPrice)) {
    listings = listings.filter((l) => l.price <= stateObj.maxPrice);
  }

  if (stateObj.searchQuery && stateObj.searchQuery.trim() !== '') {
    const q = stateObj.searchQuery.toLowerCase().trim();
    listings = listings.filter((l) => {
      const titleMatch = l.title && l.title.toLowerCase().includes(q);
      const descMatch = l.description && l.description.toLowerCase().includes(q);
      const distMatch = l.district && l.district.toLowerCase().includes(q);
      const sellerMatch = l.seller && (l.seller.storeName || l.seller.name) && (l.seller.storeName || l.seller.name).toLowerCase().includes(q);
      return titleMatch || descMatch || distMatch || sellerMatch;
    });
  }

  listings.sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (countBadge) countBadge.textContent = listings.length;
  updateActiveFilterChips();

  if (listings.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let cardsHtml = '';
  const currentUser = getCurrentUser();

  listings.forEach((item) => {
    try {
      const region = getRegionById(item.regionId);
      const regionName = region ? region.shortName : (item.regionId || 'Solo');
      const isFav = isFavorite(item.id);
      const waUrl = generateWhatsAppUrl(item, currentUser?.storeName || currentUser?.name);
      const priceFormatted = formatRupiah(item.price);
      const timeAgoStr = timeAgo(item.createdAt);
      const sellerName = item.seller?.storeName || item.seller?.name || 'Penjual Solo';

      const imagesArr = Array.isArray(item.images) ? item.images : (typeof item.images === 'string' && item.images.startsWith('http') ? [item.images] : []);
      const imgUrl = (imagesArr.length > 0 && imagesArr[0]) ? imagesArr[0] : "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
      const imagesCount = imagesArr.length;

      const isDemo = isDemoUser(item.seller?.id || item.seller) || Boolean(item.isDemo) || Boolean(item.id && String(item.id).startsWith('barkas-0'));
      const isItemBu = Boolean(item.is_bu || item.isBu);
      const paymentType = item.paymentMethod || ((String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (item.title || '').length) % 2 === 0 ? 'cod' : 'in_store');

      if (isListView) {
        cardsHtml += `
          <div
            data-listing-id="${item.id}"
            class="product-card group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col sm:flex-row overflow-hidden relative cursor-pointer"
          >
            <div class="relative w-full sm:w-44 aspect-square bg-slate-100 overflow-hidden flex-shrink-0">
              <img
                src="${imgUrl}"
                alt="${item.title}"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              >

              ${imagesCount > 1 ? `
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/75 text-white backdrop-blur-xs flex items-center gap-1 shadow">
                  <i data-lucide="image" class="w-3 h-3 text-amber-300"></i>
                  <span>${imagesCount} Foto</span>
                </span>
              ` : ''}

              ${isDemo ? `
                <span class="absolute top-2 ${imagesCount > 1 ? 'left-20' : 'left-2'} px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-500 shadow-md flex items-center gap-1 z-10">
                  <i data-lucide="tag" class="w-2.5 h-2.5"></i>
                  <span>DEMO</span>
                </span>
              ` : ''}

              ${item.isSold ? `
                <div class="absolute inset-0 bg-slate-900/75 backdrop-blur-[2px] flex items-center justify-center">
                  <span class="bg-rose-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">TERJUAL</span>
                </div>
              ` : ''}

              <div class="absolute bottom-2 left-2">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs flex items-center gap-1">
                  <i data-lucide="map-pin" class="w-3 h-3 text-rose-800"></i>
                  <span>${regionName} • ${item.district || '-'}</span>
                </span>
              </div>

              <button
                data-action="favorite"
                data-id="${item.id}"
                class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:scale-110 shadow-sm transition-all"
                title="Simpan ke favorit"
              >
                <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}"></i>
              </button>
            </div>

            <div class="p-4 flex-1 flex flex-col justify-between space-y-2.5">
              <div class="space-y-1.5">
                <div>
                  <span class="text-base sm:text-lg md:text-xl font-black text-rose-900 tracking-tight">${priceFormatted}</span>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                  ${isItemBu ? `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
                      <span>🔥 BU</span>
                      <span class="text-[9px] font-normal text-rose-100 hidden sm:inline">(Butuh Uang)</span>
                    </span>
                  ` : ''}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    ${item.negoType === 'pas' ? 'Nett' : 'Bisa Nego'}
                  </span>

                  ${paymentType === 'cod' ? `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                      <i data-lucide="handshake" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>COD</span>
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200/90 shadow-2xs">
                      <i data-lucide="store" class="w-3.5 h-3.5 text-sky-600"></i>
                      <span>In Store</span>
                    </span>
                  `}
                </div>

                <h3 class="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-rose-900 transition-colors leading-snug pt-0.5">
                  ${item.title}
                </h3>

                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  ${item.description}
                </p>
              </div>

              <div class="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-500">
                  <span class="font-bold text-slate-700 flex items-center gap-1.5">
                    <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>${sellerName}</span>
                  </span>
                  <span class="text-slate-300">•</span>
                  <span class="text-[11px] text-slate-400 font-medium">${timeAgoStr}</span>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    href="${waUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-action="whatsapp"
                    class="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                    <span>${chatWaText}</span>
                  </a>
                  <button
                    data-action="view-detail"
                    data-id="${item.id}"
                    class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">${detailText}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        `;
      } else {
        cardsHtml += `
          <div
            data-listing-id="${item.id}"
            class="product-card group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col overflow-hidden relative cursor-pointer"
          >
            <div class="relative aspect-square bg-slate-100 overflow-hidden">
              <img
                src="${imgUrl}"
                alt="${item.title}"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              >

              ${imagesCount > 1 ? `
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/75 text-white backdrop-blur-xs flex items-center gap-1 shadow">
                  <i data-lucide="image" class="w-3 h-3 text-amber-300"></i>
                  <span>${imagesCount} Foto</span>
                </span>
              ` : ''}

              ${isDemo ? `
                <span class="absolute top-2 ${imagesCount > 1 ? 'left-18 sm:left-20' : 'left-2'} px-1.5 sm:px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-500 shadow-md flex items-center gap-0.5 z-10">
                  <i data-lucide="tag" class="w-2.5 h-2.5"></i>
                  <span>DEMO</span>
                </span>
              ` : ''}

              ${item.isSold ? `
                <div class="absolute inset-0 bg-slate-900/75 backdrop-blur-[2px] flex items-center justify-center">
                  <span class="bg-rose-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">TERJUAL</span>
                </div>
              ` : ''}

              <div class="absolute bottom-2 left-2 flex items-center gap-1">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs flex items-center gap-1">
                  <i data-lucide="map-pin" class="w-3 h-3 text-rose-800"></i>
                  <span>${regionName} • ${item.district || '-'}</span>
                </span>
              </div>

              <button
                data-action="favorite"
                data-id="${item.id}"
                class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:scale-110 shadow-sm transition-all"
                title="Simpan ke favorit"
              >
                <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}"></i>
              </button>
            </div>

            <div class="p-1 sm:p-1.5 space-y-0.5 flex-1 flex flex-col justify-between">
              <div class="space-y-0.5">
                <div>
                  <span class="text-[10px] min-[360px]:text-[11px] sm:text-xs md:text-sm font-black text-rose-900 leading-none tracking-tight">${priceFormatted}</span>
                </div>

                <div class="flex items-center gap-1 flex-wrap pt-0.5">
                  ${isItemBu ? `
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8.5px] min-[360px]:text-[9px] font-black bg-rose-600 text-white shadow-2xs animate-pulse">
                      <span>🔥 BU</span>
                    </span>
                  ` : ''}
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] min-[360px]:text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                    ${item.negoType === 'pas' ? 'Nett' : 'Nego'}
                  </span>

                  ${paymentType === 'cod' ? `
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8.5px] min-[360px]:text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                      <i data-lucide="handshake" class="w-3 h-3 text-emerald-600"></i>
                      <span>COD</span>
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8.5px] min-[360px]:text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200/90 shadow-2xs">
                      <i data-lucide="store" class="w-3 h-3 text-sky-600"></i>
                      <span>In Store</span>
                    </span>
                  `}
                </div>

                <h3 class="text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-slate-800 group-hover:text-rose-900 transition-colors line-clamp-2 leading-none pt-0.5" title="${item.title}">
                  ${item.title}
                </h3>
              </div>

              <div class="pt-1 border-t border-slate-100/90 space-y-1">
                <div class="flex items-center justify-between text-[9.5px] min-[360px]:text-[10px] sm:text-xs text-slate-500 gap-1">
                  ${(() => {
            const isVer = isSellerVerified(item.seller?.id || item.seller);
            return `
                      <div class="flex items-center gap-1 truncate min-w-0" title="${isVer ? 'Penjual Terverifikasi: ' : 'Penjual: '}${sellerName}">
                        <i data-lucide="${isVer ? 'shield-check' : 'user'}" class="w-3 h-3 ${isVer ? 'text-emerald-600' : 'text-slate-400'} flex-shrink-0"></i>
                        <span class="${isVer ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate">${sellerName}</span>
                      </div>
                    `;
          })()}
                  <span class="text-[9px] min-[360px]:text-[9.5px] sm:text-[10.5px] font-medium text-slate-400 flex-shrink-0 whitespace-nowrap">${timeAgoStr}</span>
                </div>

                <div class="flex items-center gap-1 pt-0">
                  ${(item.isSold || item.status === 'sold') ? `
                    <button
                      disabled
                      class="flex-1 flex items-center justify-center gap-1 bg-slate-200 text-slate-500 font-bold py-1 px-1.5 rounded-xl text-[9.5px] min-[360px]:text-[10.5px] sm:text-xs cursor-not-allowed opacity-80"
                    >
                      <span>Terjual</span>
                    </button>
                  ` : `
                    <a
                      href="${waUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-action="whatsapp"
                      class="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 font-bold py-1 px-1.5 rounded-xl text-[9.5px] min-[360px]:text-[10.5px] sm:text-xs transition-colors shadow-2xs"
                      title="Chat Penjual via WhatsApp"
                    >
                      <i data-lucide="message-circle" class="w-3 h-3"></i>
                      <span>${chatWaText}</span>
                    </a>
                  `}

                  <button
                    data-action="view-detail"
                    data-id="${item.id}"
                    class="p-1 sm:p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
                    title="Lihat Detail"
                  >
                    <i data-lucide="eye" class="w-3 h-3"></i>
                  </button>
                </div>

              </div>

            </div>
          </div>
        `;
      }
    } catch (err) {
      console.warn('[Card Render Error]', err);
    }
  });

  grid.innerHTML = cardsHtml;

  if (!grid.__hasDelegatedClick) {
    grid.__hasDelegatedClick = true;
    grid.addEventListener('click', (e) => {
      const favBtn = e.target.closest('[data-action="favorite"]');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = favBtn.getAttribute('data-id');
        const isNowFav = toggleFavorite(id);
        renderListings();
        showToast(isNowFav ? "Ditambahkan ke favorit" : "Dihapus dari favorit", "info");
        return;
      }
      const waBtn = e.target.closest('[data-action="whatsapp"]');
      if (waBtn) {
        if (!isUserLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.openUserAuthModal === 'function') {
            window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk menghubungi penjual via WhatsApp.');
          }
        }
        return;
      }

      const viewDetailBtn = e.target.closest('[data-action="view-detail"]');
      if (viewDetailBtn) {
        e.preventDefault();
        e.stopPropagation();
        const listingId = viewDetailBtn.getAttribute('data-id') || viewDetailBtn.closest('.product-card')?.getAttribute('data-listing-id');
        if (listingId) handleProductClick(listingId);
        return;
      }

      const card = e.target.closest('.product-card');
      if (card) {
        const listingId = card.getAttribute('data-listing-id');
        if (listingId) handleProductClick(listingId);
      }
    });
  }

  try { refreshIcons(grid); } catch (e) { }
}

if (typeof window !== 'undefined') {
  window.showHomeLoadingSkeleton = showHomeLoadingSkeleton;
  window.renderRegionPills = renderRegionPills;
  window.renderCategoryPills = renderCategoryPills;
  window.renderListings = renderListings;
}
