import { getCurrentUser, isUserLoggedIn, getUserByReviewAuthor } from '../../services/auth.js';
import { toggleHideSellerReview, deleteSellerReview, getSellerReviews, getSellerRatingStats } from '../../services/storage.js';
import { formatRegionTitle, formatDistrictTitle } from '../../services/whatsapp.js';
import { refreshIcons } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openModal } from '../common/modalManager.js';
import { openSellerProfileModal } from './sellerReviews.js';

export function renderSellerProfileReviews(sellerId, reviews, ratingStats) {
  const isAdmin = sessionStorage.getItem('pusat_barkas_admin_auth') === 'true';
  const currentUser = getCurrentUser();

  const scoreEl = document.getElementById('seller-rating-score');
  const countTextEl = document.getElementById('seller-rating-count-text');
  if (scoreEl) scoreEl.textContent = ratingStats.averageRating.toFixed(1);
  if (countTextEl) countTextEl.textContent = `Berdasarkan ${ratingStats.totalReviews} ulasan`;

  const total = ratingStats.totalReviews || 1;
  for (let i = 1; i <= 5; i++) {
    const count = ratingStats.ratingCounts[i] || 0;
    const pct = ratingStats.totalReviews > 0 ? ((count / total) * 100).toFixed(0) : (i === 5 ? 100 : 0);
    const progEl = document.getElementById(`progress-star-${i}`);
    const countEl = document.getElementById(`count-star-${i}`);
    if (progEl) progEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = count;
  }

  const listContainer = document.getElementById('seller-reviews-list-container');
  const emptyReviewsEl = document.getElementById('seller-reviews-empty');
  if (!listContainer) return;

  if (reviews.length === 0) {
    listContainer.innerHTML = '';
    emptyReviewsEl?.classList.remove('hidden');
    return;
  }

  emptyReviewsEl?.classList.add('hidden');

  let html = '';
  reviews.forEach((r) => {
    const d = new Date(r.createdAt);
    const dateFormatted = !isNaN(d) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja';

    let starsHtml = '';
    for (let s = 1; s <= 5; s++) {
      starsHtml += `<i data-lucide="star" class="w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}"></i>`;
    }

    const isHidden = !!r.isHidden;
    const cardBgClass = isHidden
      ? 'bg-purple-50/90 border-purple-300 ring-1 ring-purple-400/40 opacity-90'
      : 'bg-slate-50 border-slate-200/80';

    const isBuyerSelf = currentUser && (
      (r.buyerId && (r.buyerId === currentUser.id || r.buyerId === currentUser.email)) ||
      (r.buyerName && (r.buyerName.toLowerCase().includes(currentUser.name?.toLowerCase() || '---') || r.buyerName.toLowerCase().includes(currentUser.storeName?.toLowerCase() || '---')))
    );
    const buyerUser = (isBuyerSelf ? currentUser : null) || getUserByReviewAuthor(r.buyerId, r.buyerName);
    let buyerDisplayName = r.buyerName || 'Pembeli';

    if (buyerUser) {
      const baseName = buyerUser.storeName || buyerUser.name || buyerDisplayName.replace(/\(.*?\)/g, '').trim();
      const dist = buyerUser.district ? formatDistrictTitle(buyerUser.district) : '';
      const reg = buyerUser.region ? formatRegionTitle(buyerUser.region) : '';
      const loc = dist || reg || 'Solo Raya';
      buyerDisplayName = `${baseName} (${loc})`;
    } else {
      buyerDisplayName = buyerDisplayName.replace(/\(([A-Za-z\s]+)\)/g, (m, p1) => {
        const p1Clean = p1.trim();
        const map = {
          'solo': 'Solo',
          'surakarta': 'Solo',
          'karanganyar': 'Karanganyar',
          'sukoharjo': 'Sukoharjo',
          'wonogiri': 'Wonogiri',
          'sragen': 'Sragen',
          'boyolali': 'Boyolali',
          'klaten': 'Klaten',
          'soloraya': 'Solo Raya',
          'solo raya': 'Solo Raya'
        };
        const matchKey = p1Clean.toLowerCase();
        if (map[matchKey]) return `(${map[matchKey]})`;
        return `(${p1Clean.charAt(0).toUpperCase() + p1Clean.slice(1).toLowerCase()})`;
      });
    }

    html += `
      <div class="p-3.5 ${cardBgClass} rounded-2xl border space-y-2.5 transition-all">
        ${isHidden ? `
          <div class="flex items-center justify-between p-1.5 px-2.5 bg-purple-950 text-purple-200 border border-purple-800 rounded-xl text-[10px] font-extrabold shadow-2xs">
            <span class="flex items-center gap-1.5">
              <i data-lucide="eye-off" class="w-3 h-3 text-purple-300"></i>
              <span>ULASAN DISEMBUNYIKAN (Hanya Admin yang Melihat)</span>
            </span>
            <span class="text-purple-300 bg-purple-900 px-1.5 py-0.5 rounded text-[9.5px]">Spam / Fake</span>
          </div>
        ` : ''}

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity btn-open-seller-reviewer-profile" data-reviewer-id="${r.buyerId || ''}" data-reviewer-name="${buyerDisplayName}">
            <img src="${r.buyerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" alt="${buyerDisplayName}" class="w-7 h-7 rounded-full object-cover border border-slate-300 flex-shrink-0">
            <div>
              <div class="font-extrabold text-xs text-slate-900 hover:text-rose-900 hover:underline">${buyerDisplayName}</div>
              <div class="flex items-center gap-0.5">${starsHtml}</div>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 font-medium">${dateFormatted}</span>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60 font-medium">
          "${r.comment}"
        </p>
        ${r.productImage ? `
          <div class="flex items-center gap-2.5 p-2 bg-rose-50/80 border border-rose-200/80 rounded-xl">
            <img src="${r.productImage}" alt="Foto Barang yang Dibeli" class="w-14 h-14 rounded-lg object-cover border border-rose-200 shadow-2xs flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="window.open('${r.productImage}', '_blank')">
            <div class="space-y-0.5 min-w-0">
              <span class="inline-flex items-center gap-1 text-[10px] font-black text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded">
                <i data-lucide="camera" class="w-3 h-3 text-rose-700"></i>
                <span>Foto Produk yang Dibeli</span>
              </span>
              <p class="text-[10.5px] text-slate-600 font-bold truncate">Bukti produk saat transaksi</p>
            </div>
          </div>
        ` : ''}

        ${isAdmin ? `
          <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap bg-slate-100/90 -mx-3.5 -mb-3.5 p-2.5 rounded-b-2xl">
            <div class="flex items-center gap-1 text-[10.5px] font-black text-rose-950">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-rose-800"></i>
              <span>Moderasi Ulasan (Admin):</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                data-action="admin-toggle-hide-review"
                data-review-id="${r.id}"
                data-seller-id="${sellerId}"
                class="px-2.5 py-1 rounded-lg ${isHidden ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'} text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                title="${isHidden ? 'Tampilkan kembali ulasan ini ke publik' : 'Sembunyikan ulasan mencurigakan ini dari publik'}"
              >
                <i data-lucide="${isHidden ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                <span>${isHidden ? 'Buka Sembunyi' : 'Sembunyikan'}</span>
              </button>
              <button
                type="button"
                data-action="admin-delete-review"
                data-review-id="${r.id}"
                data-seller-id="${sellerId}"
                class="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                title="Hapus ulasan spam/mencurigakan ini secara permanen"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });

  listContainer.innerHTML = html;

  listContainer.querySelectorAll('.btn-open-seller-reviewer-profile').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const uId = el.getAttribute('data-reviewer-id');
      const uName = el.getAttribute('data-reviewer-name') || 'Pengguna';
      if (uId) {
        const targetUser = getUserById(uId);
        if (targetUser) {
          openSellerProfileModal(targetUser);
        } else {
          const regionMatch = uName.match(/\((.*?)\)/)?.[1] || 'Solo';
          openSellerProfileModal({
            id: uId,
            name: uName.replace(/\(.*?\)/g, '').trim(),
            avatar: el.querySelector('img')?.src,
            region: regionMatch
          });
        }
      }
    });
  });

  if (isAdmin) {
    listContainer.querySelectorAll('[data-action="admin-toggle-hide-review"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const revId = btn.getAttribute('data-review-id');
        const sId = btn.getAttribute('data-seller-id');
        try {
          const updated = toggleHideSellerReview(revId);
          if (updated) {
            showToast(updated.isHidden ? "🛡️ Ulasan berhasil disembunyikan dari publik secara real-time." : "👁️ Ulasan ditampilkan kembali ke publik secara real-time.", "info");
            const updatedReviews = getSellerReviews(sId, true);
            const updatedStats = getSellerRatingStats(sId);
            renderSellerProfileReviews(sId, updatedReviews, updatedStats);
          }
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    listContainer.querySelectorAll('[data-action="admin-delete-review"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const revId = btn.getAttribute('data-review-id');
        const sId = btn.getAttribute('data-seller-id');
        if (confirm("Apakah Anda yakin ingin menghapus ulasan ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.")) {
          try {
            const ok = deleteSellerReview(revId);
            if (ok) {
              showToast("🗑️ Ulasan spam/mencurigakan berhasil dihapus permanen.", "success");
              const updatedReviews = getSellerReviews(sId, true);
              const updatedStats = getSellerRatingStats(sId);
              renderSellerProfileReviews(sId, updatedReviews, updatedStats);
            }
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });
  }

  try { refreshIcons(); } catch (e) { }
}

export function setupStarRatingPicker() {
  const container = document.getElementById('star-rating-selector');
  const hiddenInput = document.getElementById('input-review-rating');
  const labelEl = document.getElementById('star-rating-label');
  if (!container || !hiddenInput) return;

  const labels = {
    1: '1 Bintang (Kecewa)',
    2: '2 Bintang (Kurang)',
    3: '3 Bintang (Cukup)',
    4: '4 Bintang (Puas)',
    5: '5 Bintang (Sangat Puas)'
  };

  function updateStars(val) {
    hiddenInput.value = val;
    if (labelEl) labelEl.textContent = labels[val] || `${val} Bintang`;

    container.querySelectorAll('.star-btn').forEach((btn) => {
      const r = parseInt(btn.getAttribute('data-rating'), 10);
      if (r <= val) {
        btn.className = "star-btn p-1 text-amber-400 hover:text-amber-500 transition-colors";
      } else {
        btn.className = "star-btn p-1 text-slate-300 hover:text-amber-400 transition-colors";
      }
    });
  }

  container.querySelectorAll('.star-btn').forEach((btn) => {
    ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach((evt) => {
      btn.addEventListener(evt, (e) => {
        if (!isUserLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          if (typeof window.openUserAuthModal === 'function') {
            window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan toko.');
          } else {
            openModal('modal-user-auth');
          }
          return;
        }
        if (evt === 'click' || evt === 'pointerdown') {
          const ratingVal = parseInt(btn.getAttribute('data-rating'), 10);
          updateStars(ratingVal);
        }
      }, { capture: true });
    });
  });

  updateStars(5);
}
