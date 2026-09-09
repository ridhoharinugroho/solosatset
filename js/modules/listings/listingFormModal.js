import { SOLO_RAYA_REGIONS, getDistrictsByRegionId } from '../../data/regions.js';
import { CATEGORIES, CONDITIONS, NEGO_TYPES } from '../../data/categories.js';
import { getCurrentUser, isUserLoggedIn } from '../../services/auth.js';
import { getListingById, getAllListings } from '../../services/storage.js';
import { formatRupiah, formatDisplayPhone } from '../../services/whatsapp.js';
import { refreshIcons } from '../../utils/runtime.js';
import { supabase } from '../../lib/supabase.js';
import { showToast } from '../common/toast.js';
import { openModal, closeModal } from '../common/modalManager.js';

export const FORM_CATEGORY_META = {
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

export const FORM_CONDITION_META = {
  'new': { name: 'Baru (Gres / Segel)', icon: 'sparkles' },
  'like_new': { name: 'Bekas - Seperti Baru', icon: 'gem' },
  'good': { name: 'Bekas - Mulus / Normal', icon: 'check-circle-2' },
  'fair': { name: 'Bekas - Wajar Pemakaian', icon: 'clock' },
  'repair': { name: 'Bekas - Butuh Servis / Bahan', icon: 'wrench' }
};

export const FORM_NEGO_META = {
  'pas': { name: 'Harga Pas / Nett', icon: 'tag' },
  'nego_alus': { name: 'Nego Alus (Wajar)', icon: 'badge-percent' },
  'nego_bebas': { name: 'Nego Bebas (Asal Jadi)', icon: 'coins' }
};

export const FORM_PAYMENT_METHOD_META = {
  'cod': { name: 'COD (Ketemuan Langsung)', icon: 'handshake' },
  'in_store': { name: 'Ambil di Toko / Toko Fisik', icon: 'store' }
};

export function selectFormCategory(catId) {
  const selectedId = catId || 'elektronik';
  const input = document.getElementById('form-input-category');
  if (input) input.value = selectedId;

  const meta = FORM_CATEGORY_META[selectedId] || { name: 'Elektronik & Gadget', icon: 'smartphone' };

  const textEl = document.getElementById('category-trigger-text');
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById('category-trigger-icon-wrapper');
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="category-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll('.picker-item-category').forEach((btn) => {
    const isSelected = btn.getAttribute('data-id') === selectedId;
    const checkDot = btn.querySelector('.check-dot');
    const checkBox = btn.querySelector('.check-box');
    const iconBox = btn.querySelector('.item-icon-box');
    const title = btn.querySelector('.item-title');

    if (isSelected) {
      btn.className = "picker-item-category w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className = "picker-item-category w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try { refreshIcons(); } catch (e) { }
}

export function selectFormCondition(condId) {
  const selectedId = condId || 'good';
  const input = document.getElementById('form-input-condition');
  if (input) input.value = selectedId;

  const meta = FORM_CONDITION_META[selectedId] || { name: 'Mulus / Normal', icon: 'check-circle-2' };

  const textEl = document.getElementById('condition-trigger-text');
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById('condition-trigger-icon-wrapper');
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="condition-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll('.picker-item-condition').forEach((btn) => {
    const isSelected = btn.getAttribute('data-id') === selectedId;
    const checkDot = btn.querySelector('.check-dot');
    const checkBox = btn.querySelector('.check-box');
    const iconBox = btn.querySelector('.item-icon-box');
    const title = btn.querySelector('.item-title');

    if (isSelected) {
      btn.className = "picker-item-condition w-full px-4 py-3 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className = "picker-item-condition w-full px-4 py-3 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try { refreshIcons(); } catch (e) { }
}

export function selectFormNego(negoId) {
  const selectedId = negoId || 'nego_alus';
  const input = document.getElementById('form-input-nego');
  if (input) input.value = selectedId;

  const meta = FORM_NEGO_META[selectedId] || { name: 'Nego Alus', icon: 'badge-percent' };

  const textEl = document.getElementById('nego-trigger-text');
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById('nego-trigger-icon-wrapper');
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="nego-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll('.picker-item-nego').forEach((btn) => {
    const isSelected = btn.getAttribute('data-id') === selectedId;
    const checkDot = btn.querySelector('.check-dot');
    const checkBox = btn.querySelector('.check-box');
    const iconBox = btn.querySelector('.item-icon-box');
    const title = btn.querySelector('.item-title');

    if (isSelected) {
      btn.className = "picker-item-nego w-full px-4 py-3.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className = "picker-item-nego w-full px-4 py-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try { refreshIcons(); } catch (e) { }
}

export function selectFormPaymentMethod(methodId) {
  const selectedId = methodId || 'cod';
  const input = document.getElementById('form-input-payment-method');
  if (input) input.value = selectedId;

  const meta = FORM_PAYMENT_METHOD_META[selectedId] || { name: 'COD', icon: 'handshake' };

  const textEl = document.getElementById('payment-method-trigger-text');
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById('payment-method-trigger-icon-wrapper');
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="payment-method-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  const storeMapsContainer = document.getElementById('container-store-maps-link');
  if (storeMapsContainer) {
    if (selectedId === 'in_store') {
      storeMapsContainer.classList.remove('hidden');
    } else {
      storeMapsContainer.classList.add('hidden');
    }
  }

  document.querySelectorAll('.picker-item-payment-method').forEach((btn) => {
    const isSelected = btn.getAttribute('data-id') === selectedId;
    const checkDot = btn.querySelector('.check-dot');
    const checkBox = btn.querySelector('.check-box');
    const iconBox = btn.querySelector('.item-icon-box');
    const title = btn.querySelector('.item-title');

    if (isSelected) {
      btn.className = "picker-item-payment-method w-full px-4 py-3.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className = "picker-item-payment-method w-full px-4 py-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try { refreshIcons(); } catch (e) { }
}

export function updateCreateListingSellerInfo() {
  const user = getCurrentUser();
  const avatarEl = document.getElementById('form-seller-avatar');
  const nameEl = document.getElementById('form-seller-name-preview');
  const phoneEl = document.getElementById('form-seller-phone-preview');

  if (user && avatarEl && nameEl && phoneEl) {
    avatarEl.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    nameEl.textContent = user.storeName || user.name;
    phoneEl.textContent = `WA: ${formatDisplayPhone(user.phone || 'Belum diatur')}`;
  }
}

export function populateFormRegions() {
  const regionSelect = document.getElementById('form-region-select');
  const districtSelect = document.getElementById('form-district-select');
  if (!regionSelect || !districtSelect) return;

  let regionOptions = '';
  SOLO_RAYA_REGIONS.forEach((r) => {
    regionOptions += `<option value="${r.id}">${r.name}</option>`;
  });
  regionSelect.innerHTML = regionOptions;

  function updateDistricts() {
    const regId = regionSelect.value;
    const districts = getDistrictsByRegionId(regId);
    let distOptions = '';
    districts.forEach((d) => {
      distOptions += `<option value="${d}">Kec. ${d}</option>`;
    });
    districtSelect.innerHTML = distOptions;
  }

  regionSelect.addEventListener('change', updateDistricts);
  updateDistricts();
}

export function renderFormImagePreviews(uploadedImagesArray = []) {
  const previewContainer = document.getElementById('image-preview-container');
  const counterBadge = document.getElementById('upload-photo-counter');
  const uploadLabel = document.getElementById('file-upload-label');
  if (!previewContainer) return;

  const targetImages = (typeof window.state !== 'undefined' && window.state.uploadedImages) ? window.state.uploadedImages : uploadedImagesArray;

  const count = targetImages.length;
  if (counterBadge) {
    counterBadge.textContent = `${count}/3 Foto (Rasio 1:1)`;
    if (count >= 3) {
      counterBadge.className = "text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md";
    } else {
      counterBadge.className = "text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md";
    }
  }

  if (count === 0) {
    previewContainer.classList.add('hidden');
    previewContainer.innerHTML = '';
    if (uploadLabel) uploadLabel.textContent = 'Pilih / Tambah Foto dari HP / Komputer (Maks 3)';
    return;
  }

  previewContainer.classList.remove('hidden');
  if (uploadLabel) {
    uploadLabel.textContent = count < 3 ? `+ Tambah Foto Lagi (${count}/3 Terpilih)` : 'Maksimal 3 Foto Terpenuhi';
  }

  let html = '';
  targetImages.forEach((imgUrl, idx) => {
    html += `
      <div class="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border-2 border-rose-200 shadow-sm group">
        <img src="${imgUrl}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">
        <span class="absolute top-1.5 left-1.5 bg-slate-950/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
          ${idx === 0 ? 'Utama' : `Foto ${idx + 1}`}
        </span>
        <button
          type="button"
          data-remove-idx="${idx}"
          class="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow-md transition-transform hover:scale-110"
          title="Hapus foto ini"
        >
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  });

  previewContainer.innerHTML = html;

  previewContainer.querySelectorAll('[data-remove-idx]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
      targetImages.splice(idx, 1);
      renderFormImagePreviews(targetImages);
      try { refreshIcons(); } catch (e) { }
    });
  });

  try { refreshIcons(); } catch (e) { }
}

export function resetCreateListingForm() {
  const form = document.getElementById('form-create-listing');
  if (form) form.reset();
  const editIdInput = document.getElementById('form-input-edit-id');
  if (editIdInput) editIdInput.value = '';
  selectFormCategory('elektronik');
  selectFormCondition('good');
  selectFormNego('nego_alus');
  selectFormPaymentMethod('cod');
  const storeMapsInput = document.getElementById('form-input-store-maps');
  if (storeMapsInput) storeMapsInput.value = '';
  if (typeof window.state !== 'undefined') {
    window.state.uploadedImages = [];
  }
  renderFormImagePreviews();
  const pricePreview = document.getElementById('price-rupiah-preview');
  if (pricePreview) pricePreview.textContent = 'Rp 0';
  const charCount = document.getElementById('title-char-count');
  if (charCount) charCount.textContent = '0/80 karakter';

  const buCheckbox = document.getElementById('form-checkbox-is-bu');
  if (buCheckbox) {
    buCheckbox.checked = false;
    buCheckbox.removeAttribute('data-qris-verified');
  }
  const buQrisBox = document.getElementById('container-bu-qris-box');
  if (buQrisBox) buQrisBox.classList.add('hidden');
  const buQrisBadge = document.getElementById('bu-qris-status-badge');
  if (buQrisBadge) buQrisBadge.classList.add('hidden');
  const btnVerifyQris = document.getElementById('btn-verify-bu-qris');
  if (btnVerifyQris) btnVerifyQris.classList.remove('opacity-60');
  const verifyBtnText = document.getElementById('btn-verify-bu-text');
  if (verifyBtnText) verifyBtnText.textContent = "Saya Sudah Bayar QRIS (Verifikasi)";
}

export function openCreateListingModal() {
  const user = getCurrentUser();
  if (!user) {
    if (typeof window.openUserAuthModal === 'function') {
      window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk memasang iklan barang.');
    } else {
      openModal('modal-user-auth');
    }
    return;
  }

  const editIdInput = document.getElementById('form-input-edit-id');
  if (editIdInput) editIdInput.value = '';

  const titleModal = document.getElementById('form-create-listing-title');
  if (titleModal) titleModal.textContent = "Pasang Iklan Solo Raya";

  const subtitleModal = document.getElementById('form-create-listing-subtitle');
  if (subtitleModal) subtitleModal.textContent = "Jangkau calon pembeli di 7 wilayah Solo Raya";

  const btnSubmitText = document.getElementById('btn-submit-listing-text');
  if (btnSubmitText) btnSubmitText.textContent = "Tayangkan Iklan Sekarang";

  updateCreateListingSellerInfo();
  resetCreateListingForm();
  openModal('modal-create-listing');
  selectFormCategory('elektronik');
  selectFormCondition('good');
  selectFormNego('nego_alus');
  selectFormPaymentMethod('cod');
  try { refreshIcons(); } catch (e) { }
}

export async function openEditListingModal(listingId) {
  if (!isUserLoggedIn()) {
    if (typeof window.openUserAuthModal === 'function') {
      window.openUserAuthModal('login', 'Silakan masuk terlebih dahulu untuk menyunting iklan.');
    } else {
      openModal('modal-user-auth');
    }
    return;
  }

  const targetId = String(listingId || '').trim();
  if (!targetId) return;

  let listing = getListingById(targetId);
  if (!listing) {
    const all = getAllListings();
    listing = all.find(item => String(item.id).trim() === targetId);
  }

  if (!listing && supabase) {
    try {
      const { data, error } = await supabase.from('listings').select('*').eq('id', targetId).maybeSingle();
      if (data && !error) {
        listing = {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          price: Number(data.price) || 0,
          category: data.category || 'elektronik',
          condition: data.condition || 'good',
          negoType: data.nego_type || 'nego_alus',
          paymentMethod: data.payment_method || 'cod',
          regionId: data.region || 'solo',
          district: data.district || '',
          codPoint: data.cod_point || '',
          storeMapsUrl: data.store_maps_url || '',
          images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
          views: Number(data.views) || 0,
          isBu: Boolean(data.is_bu),
          is_bu: Boolean(data.is_bu),
          qris_verified: Boolean(data.qris_verified),
          payment_status: data.payment_status || 'verified',
          status: data.status || 'active',
          seller: {
            id: data.seller_id,
            name: data.seller_name,
            storeName: data.seller_name,
            phone: data.seller_phone,
            avatar: data.seller_avatar,
            region: data.region
          },
          createdAt: data.created_at || new Date().toISOString()
        };
      }
    } catch (e) { }
  }

  if (!listing) {
    showToast("Data iklan tidak ditemukan. Silakan muat ulang halaman.", "error");
    return;
  }

  const editIdInput = document.getElementById('form-input-edit-id');
  if (editIdInput) editIdInput.value = listing.id;

  const titleModal = document.getElementById('form-create-listing-title');
  if (titleModal) titleModal.textContent = "Sunting Iklan Solo Raya";

  const subtitleModal = document.getElementById('form-create-listing-subtitle');
  if (subtitleModal) subtitleModal.textContent = "Perbarui rincian, foto, harga, atau lokasi COD";

  const btnSubmitText = document.getElementById('btn-submit-listing-text');
  if (btnSubmitText) btnSubmitText.textContent = "Simpan Perubahan Iklan";

  const titleInput = document.getElementById('form-input-title');
  if (titleInput) titleInput.value = listing.title || '';

  const catInput = document.getElementById('form-input-category');
  if (catInput) catInput.value = listing.category || 'elektronik';
  selectFormCategory(listing.category || 'elektronik');

  const condInput = document.getElementById('form-input-condition');
  if (condInput) condInput.value = listing.condition || 'good';
  selectFormCondition(listing.condition || 'good');

  const priceInput = document.getElementById('form-input-price');
  if (priceInput) {
    priceInput.value = listing.price || '';
    const pricePreview = document.getElementById('price-rupiah-preview');
    if (pricePreview) pricePreview.textContent = formatRupiah(listing.price || 0);
  }

  const negoInput = document.getElementById('form-input-nego');
  if (negoInput) negoInput.value = listing.negoType || listing.nego_type || 'nego_alus';
  selectFormNego(listing.negoType || listing.nego_type || 'nego_alus');

  const paymentMethodInput = document.getElementById('form-input-payment-method');
  if (paymentMethodInput) paymentMethodInput.value = listing.paymentMethod || listing.payment_method || 'cod';
  selectFormPaymentMethod(listing.paymentMethod || listing.payment_method || 'cod');

  const storeMapsInput = document.getElementById('form-input-store-maps');
  if (storeMapsInput) storeMapsInput.value = listing.storeMapsUrl || listing.store_maps_url || '';

  const regInput = document.getElementById('form-region-select');
  if (regInput) {
    regInput.value = listing.regionId || listing.region || 'solo';
    const event = new Event('change');
    regInput.dispatchEvent(event);
  }

  const distInput = document.getElementById('form-district-select');
  if (distInput) distInput.value = listing.district || '';

  const codInput = document.getElementById('form-input-cod');
  if (codInput) codInput.value = listing.codPoint || listing.cod_point || '';

  const descInput = document.getElementById('form-input-desc');
  if (descInput) descInput.value = listing.description || '';

  if (typeof window.state !== 'undefined') {
    window.state.uploadedImages = listing.images ? [...listing.images] : [];
  }
  renderFormImagePreviews(listing.images || []);

  const isBu = Boolean(listing.is_bu || listing.isBu);
  const buCheckbox = document.getElementById('form-checkbox-is-bu');
  const buQrisBox = document.getElementById('container-bu-qris-box');
  const buQrisBadge = document.getElementById('bu-qris-status-badge');
  const btnVerifyQris = document.getElementById('btn-verify-bu-qris');
  const verifyBtnText = document.getElementById('btn-verify-bu-text');

  if (buCheckbox) {
    buCheckbox.checked = isBu;
    if (isBu) {
      buQrisBox?.classList.remove('hidden');
      if (listing.qris_verified || listing.payment_status === 'verified') {
        buCheckbox.setAttribute('data-qris-verified', 'true');
        buQrisBadge?.classList.remove('hidden');
        btnVerifyQris?.classList.add('opacity-60');
        if (verifyBtnText) verifyBtnText.textContent = "✅ QRIS Terverifikasi";
      }
    } else {
      buQrisBox?.classList.add('hidden');
      buCheckbox.removeAttribute('data-qris-verified');
      buQrisBadge?.classList.add('hidden');
      btnVerifyQris?.classList.remove('opacity-60');
    }
  }

  openModal('modal-create-listing');
  try { refreshIcons(); } catch (e) { }
}

export function openItemStatusModal(itemId, itemTitle, currentStatus) {
  const modal = document.getElementById('modal-item-status-picker');
  if (!modal) return;

  const targetInput = document.getElementById('status-picker-target-id');
  if (targetInput) targetInput.value = itemId;

  document.querySelectorAll('.picker-status-btn').forEach((btn) => {
    const statusVal = btn.getAttribute('data-status-val');
    const isCurrent = statusVal === currentStatus;
    const checkIcon = btn.querySelector('.status-check-icon');
    const checkCircle = btn.querySelector('.status-check-circle');

    if (isCurrent) {
      if (statusVal === 'available') {
        btn.className = "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-500/70 bg-emerald-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-emerald-500/20";
        if (checkCircle) checkCircle.className = "status-check-circle w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center flex-shrink-0";
      } else if (statusVal === 'booked') {
        btn.className = "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-amber-500/70 bg-amber-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-amber-500/20";
        if (checkCircle) checkCircle.className = "status-check-circle w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-500/20 flex items-center justify-center flex-shrink-0";
      } else {
        btn.className = "picker-status-btn w-full px-4 py-3.5 rounded-2xl border-2 border-rose-500/70 bg-rose-950/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-500/20";
        if (checkCircle) checkCircle.className = "status-check-circle w-5 h-5 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center flex-shrink-0";
      }
      if (checkIcon) checkIcon.classList.remove('hidden');
    } else {
      btn.className = "picker-status-btn w-full px-4 py-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkCircle) checkCircle.className = "status-check-circle w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0";
      if (checkIcon) checkIcon.classList.add('hidden');
    }
  });

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  try { refreshIcons(); } catch (e) { }
}

if (typeof window !== 'undefined') {
  window.selectFormCategory = selectFormCategory;
  window.selectFormCondition = selectFormCondition;
  window.selectFormNego = selectFormNego;
  window.selectFormPaymentMethod = selectFormPaymentMethod;
  window.updateCreateListingSellerInfo = updateCreateListingSellerInfo;
  window.populateFormRegions = populateFormRegions;
  window.renderFormImagePreviews = renderFormImagePreviews;
  window.resetCreateListingForm = resetCreateListingForm;
  window.openCreateListingModal = openCreateListingModal;
  window.openEditListingModal = openEditListingModal;
  window.openItemStatusModal = openItemStatusModal;
}
