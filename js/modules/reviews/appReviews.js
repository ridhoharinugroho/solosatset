import { getCurrentUser, getUserByReviewAuthor } from '../../services/auth.js';
import { getAppReviews, getAppRatingStats, addAppReview, updateAppReview, deleteAppReview, toggleHideAppReview, fetchAppReviewsFromSupabase } from '../../services/storage.js';
import { formatRegionTitle, formatDistrictTitle, refreshIcons } from '../../utils/runtime.js';
import { timeAgo } from '../../services/whatsapp.js';
import { showToast } from '../common/toast.js';
import { openModal, closeModal } from '../common/modalManager.js';
import { openSellerProfileModal } from './sellerReviews.js';
import { ensureAppReviewsModalLoaded } from '../../appReviewsModal.js';

export async function openAppReviewsModal() {
  if (!document.getElementById("modal-app-reviews")) {
    await ensureAppReviewsModalLoaded();
  }
  if (!document.getElementById("modal-app-reviews")) return;

  const currentUser = getCurrentUser();
  const authReqBox = document.getElementById("app-review-auth-required");
  const reviewForm = document.getElementById("form-submit-app-review");
  const userNameEl = document.getElementById("app-review-user-name");
  const userAvatarEl = document.getElementById("app-review-user-avatar");

  if (currentUser) {
    authReqBox?.classList.add("hidden");
    reviewForm?.classList.remove("hidden");
    const firstName = (currentUser.name || currentUser.storeName || currentUser.store_name || "Pengguna").trim().split(/\s+/)[0] || "Pengguna";
    const rawDistrict = currentUser.district || currentUser.region || "Solo";
    const displayReviewerName = `${firstName} ${formatDistrictTitle(rawDistrict) || formatRegionTitle(rawDistrict) || "Solo"}`.trim();
    if (userNameEl) userNameEl.textContent = displayReviewerName;
    if (userAvatarEl) {
      userAvatarEl.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.email || currentUser.id || firstName)}`;
    }
  } else {
    authReqBox?.classList.remove("hidden");
    reviewForm?.classList.add("hidden");
  }

  setAppReviewRating(5);
  renderAppReviews();
  fetchAppReviewsFromSupabase().then(() => {
    renderAppReviews();
  }).catch(() => {});
  openModal("modal-app-reviews");
  refreshIcons();
}

export const APP_REVIEW_CATEGORY_META = {
  'Pengalaman Pengguna': { name: 'Pengalaman Pengguna (UX / UI)', icon: 'sparkles' },
  'Apresiasi Pengembang': { name: 'Apresiasi & Dukungan Pengembang', icon: 'coffee' },
  'Saran & Masukan': { name: 'Saran & Permintaan Fitur Baru', icon: 'lightbulb' },
  'Laporan Kendala': { name: 'Laporan Kendala / Masukan Teknis', icon: 'wrench' }
};

export function selectAppReviewCategory(catId) {
  const selectedId = catId || 'Pengalaman Pengguna';
  const input = document.getElementById('app-review-category-val');
  if (input) input.value = selectedId;

  const meta = APP_REVIEW_CATEGORY_META[selectedId] || { name: 'Pengalaman Pengguna (UX / UI)', icon: 'sparkles' };

  const textEl = document.getElementById('app-cat-trigger-text');
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById('app-cat-trigger-icon-wrapper');
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="app-cat-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll('.picker-item-app-category').forEach((btn) => {
    const isSelected = btn.getAttribute('data-id') === selectedId;
    const checkDot = btn.querySelector('.check-dot');
    const checkBox = btn.querySelector('.check-box');
    const iconBox = btn.querySelector('.item-icon-box');
    const title = btn.querySelector('.item-title');

    if (isSelected) {
      btn.className = "picker-item-app-category w-full px-4 py-3 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className = "picker-item-app-category w-full px-4 py-3 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add('hidden');
      if (checkBox) checkBox.className = "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox) iconBox.className = "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try { refreshIcons(); } catch (e) { }
}

export function setAppReviewRating(rating) {
  const hiddenInput = document.getElementById('app-input-rating-val');
  const label = document.getElementById('app-star-rating-label');
  const starContainer = document.getElementById('app-star-rating-selector');
  if (hiddenInput) hiddenInput.value = rating;

  const labels = {
    1: 'Perlu Banyak Perbaikan',
    2: 'Kurang Puas',
    3: 'Cukup Baik',
    4: 'Bagus & Bermanfaat',
    5: 'Sangat Puas & Membantu'
  };
  if (label) label.textContent = labels[rating] || 'Sangat Puas & Membantu';

  if (starContainer) {
    starContainer.querySelectorAll('.star-btn').forEach((btn) => {
      const starVal = parseInt(btn.getAttribute('data-star'), 10);
      const icon = btn.querySelector('svg, i');
      if (icon) {
        if (starVal <= rating) {
          icon.classList.add('fill-amber-400', 'text-amber-400');
          icon.classList.remove('fill-none', 'text-slate-300');
        } else {
          icon.classList.remove('fill-amber-400', 'text-amber-400');
          icon.classList.add('fill-none', 'text-slate-300');
        }
      }
    });
  }
}

export function renderAppReviews() {
  const container = document.getElementById('app-reviews-list-container');
  const avgScoreEl = document.getElementById('app-rating-avg-score');
  const countTextEl = document.getElementById('app-rating-count-text');
  const totalBadge = document.getElementById('app-reviews-total-badge');
  if (!container) return;

  const currentUser = getCurrentUser();
  const isAdmin = sessionStorage.getItem('pusat_barkas_admin_auth') === 'true';
  const reviews = getAppReviews(isAdmin);
  const stats = getAppRatingStats();

  if (avgScoreEl) avgScoreEl.textContent = stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '5.0';
  if (countTextEl) countTextEl.textContent = `Berdasarkan ${stats.totalReviews} ulasan komunitas`;
  if (totalBadge) totalBadge.textContent = `${stats.totalReviews} Ulasan`;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
        <i data-lucide="message-square" class="w-8 h-8 mx-auto text-slate-300"></i>
        <p class="text-xs font-semibold text-slate-600">Belum ada ulasan komunitas.</p>
        <p class="text-[11px]">Jadilah yang pertama memberikan penilaian dan saran untuk aplikasi ini!</p>
      </div>
    `;
    try { refreshIcons(); } catch (e) { }
    return;
  }

  let html = '';
  reviews.forEach((rev) => {
    const isHidden = Boolean(rev.isHidden);
    let starsHtml = '';
    for (let s = 1; s <= 5; s++) {
      starsHtml += `<i data-lucide="star" class="w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}"></i>`;
    }

    const timeStr = timeAgo(rev.createdAt);
    const catMeta = APP_REVIEW_CATEGORY_META[rev.category] || { name: rev.category || 'Pengalaman Pengguna', icon: 'sparkles' };

    const isOwner = Boolean(
      currentUser && (
        rev.userId === currentUser.id ||
        rev.userId === currentUser.email ||
        (currentUser.id && String(rev.userId) === String(currentUser.id)) ||
        (currentUser.email && rev.userId && String(rev.userId).toLowerCase() === String(currentUser.email).toLowerCase())
      )
    );

    const reviewerUser = (isOwner ? currentUser : null) || getUserByReviewAuthor(rev.userId, rev.userName);
    let rawReviewerName = rev.userName || 'Pengguna';
    let authorAvatar = rev.userAvatar;

    if (reviewerUser) {
      const rawFullName = (reviewerUser.name || reviewerUser.storeName || reviewerUser.store_name || 'Pengguna').trim();
      const firstName = rawFullName.split(/\s+/)[0] || 'Pengguna';
      const rawLoc = reviewerUser.district || reviewerUser.region || rev.userLocation || 'Solo';
      const loc = formatDistrictTitle(rawLoc) || formatRegionTitle(rawLoc) || 'Solo';
      rawReviewerName = `${firstName} ${loc}`.trim();
      if (reviewerUser.avatar) {
        authorAvatar = reviewerUser.avatar;
      }
    } else if (rawReviewerName.includes('(')) {
      const locMatch = rawReviewerName.match(/\((.*?)\)/);
      const loc = locMatch ? locMatch[1].trim() : '';
      const baseName = rawReviewerName.replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] || 'Pengguna';
      rawReviewerName = loc ? `${baseName} ${loc}` : baseName;
    }

    if (!authorAvatar) {
      authorAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rev.userId || rawReviewerName)}`;
    }

    html += `
      <div class="p-3 sm:p-3.5 bg-white rounded-2xl border ${isHidden ? 'border-amber-300 bg-amber-50/50 opacity-75' : 'border-slate-200'} shadow-2xs space-y-2 transition-all">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-85 transition-opacity btn-open-app-reviewer-profile" data-reviewer-id="${rev.userId || ''}" data-reviewer-name="${rawReviewerName}">
            <img src="${authorAvatar}" alt="${rawReviewerName}" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 flex-shrink-0">
            <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span class="text-[11.5px] sm:text-xs font-bold text-slate-900 truncate hover:text-rose-900 hover:underline">${rawReviewerName}</span>
              ${isOwner ? '<span class="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Ulasan Kamu</span>' : ''}
              ${isHidden ? '<span class="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white">DISEMBUNYIKAN (ADMIN)</span>' : ''}
            </div>
          </div>

          <div class="flex items-center gap-0.5 flex-shrink-0">
            ${starsHtml}
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 text-[10px] sm:text-[10.5px] pt-0.5">
          <span class="text-rose-900 font-extrabold flex items-center gap-1 min-w-0 truncate">
            <i data-lucide="${catMeta.icon || 'sparkles'}" class="w-3 h-3 text-rose-800 flex-shrink-0"></i>
            <span class="truncate">${catMeta.name || rev.category || 'Pengalaman Pengguna'}</span>
          </span>
          <span class="text-slate-400 font-medium flex-shrink-0 text-[10px]">${timeStr}</span>
        </div>

        <p class="text-[11px] sm:text-[11.5px] text-slate-700 leading-snug whitespace-pre-line bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 font-normal">
          ${rev.comment}
        </p>

        ${(isOwner || isAdmin) ? `
          <div class="pt-1.5 border-t border-slate-100 flex items-center justify-end gap-1.5 text-[10px] sm:text-[10.5px] font-bold flex-wrap">
            ${isOwner ? `
              <button
                type="button"
                data-user-edit-app-review="${rev.id}"
                class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              >
                <i data-lucide="edit-3" class="w-3 h-3 text-amber-700"></i>
                <span>Edit Ulasan</span>
              </button>
            ` : ''}
            <button
              type="button"
              data-user-delete-app-review="${rev.id}"
              class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-800 border border-rose-200 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            >
              <i data-lucide="trash-2" class="w-3 h-3"></i>
              <span>Hapus</span>
            </button>
            ${isAdmin ? `
              <button
                type="button"
                data-admin-toggle-app-review="${rev.id}"
                class="px-2.5 py-1 rounded-lg ${isHidden ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'} hover:scale-105 transition-all cursor-pointer"
              >
                ${isHidden ? 'Buka Sembunyi' : 'Sembunyikan'}
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-open-app-reviewer-profile').forEach((el) => {
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

  container.querySelectorAll('[data-user-edit-app-review]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-user-edit-app-review');
      const targetRev = reviews.find((r) => r.id === id);
      if (!targetRev) return;

      const editIdInput = document.getElementById('app-input-edit-review-id');
      const ratingInput = document.getElementById('app-input-rating-val');
      const commentInput = document.getElementById('app-review-comment-input');
      const formTitle = document.getElementById('app-review-form-title');
      const submitLabel = document.getElementById('app-review-submit-label');
      const cancelBtn = document.getElementById('btn-cancel-edit-app-review');

      if (editIdInput) editIdInput.value = targetRev.id;
      if (ratingInput) ratingInput.value = targetRev.rating;
      setAppReviewRating(targetRev.rating);
      selectAppReviewCategory(targetRev.category || 'Pengalaman Pengguna');
      if (commentInput) commentInput.value = targetRev.comment || '';
      if (formTitle) formTitle.textContent = 'Edit Ulasan Kamu';
      if (submitLabel) submitLabel.textContent = 'Simpan Perubahan Ulasan';
      if (cancelBtn) cancelBtn.classList.remove('hidden');

      const targetSection = document.getElementById('section-write-app-review');
      targetSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentInput?.focus();
    };
  });

  container.querySelectorAll('[data-user-delete-app-review]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-user-delete-app-review');
      if (!id) return;
      if (confirm("Apakah kamu yakin ingin menghapus ulasan ini secara permanen?")) {
        const originalBtnHtml = btn.innerHTML;
        try {
          btn.disabled = true;
          btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i>`;
          try { refreshIcons(); } catch (e) { }

          await deleteAppReview(id);
          renderAppReviews();
          showToast("Ulasan berhasil dihapus secara permanen.", "info");
        } catch (err) {
          console.error('[deleteAppReview UI Error]', err);
          showToast(err.message || "Gagal menghapus ulasan dari database.", "error");
          btn.disabled = false;
          btn.innerHTML = originalBtnHtml;
          try { refreshIcons(); } catch (e) { }
        }
      }
    };
  });

  if (isAdmin) {
    container.querySelectorAll('[data-admin-toggle-app-review]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-admin-toggle-app-review');
        toggleHideAppReview(id);
        renderAppReviews();
        showToast("Status visibilitas ulasan berhasil diperbarui", "info");
      };
    });
  }

  try { refreshIcons(); } catch (e) { }
}

export function resetAppReviewEditMode() {
  const editIdInput = document.getElementById('app-input-edit-review-id');
  const ratingInput = document.getElementById('app-input-rating-val');
  const commentInput = document.getElementById('app-review-comment-input');
  const formTitle = document.getElementById('app-review-form-title');
  const submitLabel = document.getElementById('app-review-submit-label');
  const cancelBtn = document.getElementById('btn-cancel-edit-app-review');

  if (editIdInput) editIdInput.value = '';
  if (ratingInput) ratingInput.value = '5';
  setAppReviewRating(5);
  selectAppReviewCategory('Pengalaman Pengguna');
  if (commentInput) commentInput.value = '';
  if (formTitle) formTitle.textContent = 'Beri Penilaian & Masukan Baru';
  if (submitLabel) submitLabel.textContent = 'Kirim Penilaian & Masukan';
  if (cancelBtn) cancelBtn.classList.add('hidden');
}

export function initAppReviews() {
  const starContainer = document.getElementById('app-star-rating-selector');
  if (starContainer) {
    starContainer.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const rating = parseInt(btn.getAttribute('data-star'), 10);
        setAppReviewRating(rating);
      });
    });
  }

  document.getElementById('btn-open-app-category-picker')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-app-category-picker');
  });

  document.querySelectorAll('.picker-item-app-category').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) {
        selectAppReviewCategory(id);
        closeModal('modal-app-category-picker');
      }
    });
  });

  document.getElementById('btn-cancel-edit-app-review')?.addEventListener('click', () => {
    resetAppReviewEditMode();
  });

  document.getElementById('btn-login-for-app-review')?.addEventListener('click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window.openUserAuthModal === 'function') {
      window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan aplikasi.');
    } else {
      openModal('modal-user-auth');
    }
  });

  document.getElementById('btn-scroll-to-write-review')?.addEventListener('click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentUser = getCurrentUser();
    if (!currentUser) {
      if (typeof window.openUserAuthModal === 'function') {
        window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan aplikasi.');
      } else {
        openModal('modal-user-auth');
      }
      return;
    }
    const target = document.getElementById('section-write-app-review');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('app-review-comment-input')?.focus();
    }
  });

  const form = document.getElementById('form-submit-app-review');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      if (typeof window.openUserAuthModal === 'function') {
        window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan aplikasi.');
      } else {
        openModal('modal-user-auth');
      }
      return;
    }

    const rating = parseInt(document.getElementById('app-input-rating-val')?.value || '5', 10);
    const category = document.getElementById('app-review-category-val')?.value || 'Pengalaman Pengguna';
    const comment = document.getElementById('app-review-comment-input')?.value?.trim();
    const editId = document.getElementById('app-input-edit-review-id')?.value;

    if (!comment) {
      showToast("Silakan tuliskan ulasan atau masukan kamu.", "warning");
      return;
    }

    try {
      if (editId) {
        updateAppReview({
          id: editId,
          rating,
          category,
          comment
        });
        resetAppReviewEditMode();
        renderAppReviews();
        showToast("Ulasan kamu berhasil diperbarui!", "success");
      } else {
        addAppReview({
          rating,
          category,
          comment
        });
        resetAppReviewEditMode();
        renderAppReviews();
        showToast("Terima kasih! Ulasan & masukan kamu berhasil dikirim.", "success");
      }
    } catch (err) {
      showToast(err.message || "Gagal menyimpan ulasan", "error");
    }
  });

  window.addEventListener('appReviewsChanged', () => {
    renderAppReviews();
  });
}

if (typeof window !== 'undefined') {
  window.selectAppReviewCategory = selectAppReviewCategory;
  window.setAppReviewRating = setAppReviewRating;
  window.renderAppReviews = renderAppReviews;
  window.resetAppReviewEditMode = resetAppReviewEditMode;
  window.initAppReviews = initAppReviews;
}
