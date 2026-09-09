import { getListingById } from '../../services/storage.js';
import { sbBroadcastBuNotification, sbGetNotifications, sbMarkNotificationAsRead, sbMarkAllNotificationsAsRead, sbSubscribeNotifications, sbUnsubscribeNotifications } from '../../services/supabaseDB.js';
import { formatRupiah, generateWhatsAppUrl } from '../../services/whatsapp.js';
import { getRegionById } from '../../data/regions.js';
import { refreshIcons } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openModal, closeModal } from '../common/modalManager.js';
import { getActiveSessionUserId, openProductDetail } from '../listings/productDetailModal.js';

let activeNotifRealtimeChannel = null;
let isNotificationsCenterInitialized = false;
export let cachedNotifications = [];

export function cleanupNotificationsRealtime() {
  if (activeNotifRealtimeChannel) {
    try {
      if (typeof sbUnsubscribeNotifications === 'function') {
        sbUnsubscribeNotifications(activeNotifRealtimeChannel);
      } else if (typeof activeNotifRealtimeChannel.unsubscribe === 'function') {
        activeNotifRealtimeChannel.unsubscribe().catch(() => { });
      }
    } catch (err) {
      console.warn('[Notifications Realtime Cleanup Warning]', err);
    } finally {
      activeNotifRealtimeChannel = null;
    }
  }
}

export async function triggerBuNotification(productId, categoryId) {
  if (!productId) return { success: false, sentUsersCount: 0, error: "Product ID required" };

  try {
    let product = null;
    if (typeof getListingById === 'function') {
      product = getListingById(productId);
    }

    const finalCategory = String(categoryId || product?.category || 'umum').toLowerCase().trim();
    const title = product ? `🔥 BUTUH UANG CEPAT: ${product.title}` : '🔥 IKLAN BUTUH UANG CEPAT (BU) TERBARU!';
    const priceFormatted = product && typeof formatRupiah === 'function' ? formatRupiah(product.price) : (product?.price ? `Rp ${product.price}` : '');
    const regionObj = product && typeof getRegionById === 'function' ? getRegionById(product.regionId) : null;
    const locationName = regionObj ? (regionObj.shortName || regionObj.name) : 'Solo Raya';
    const message = product
      ? `Harga ${priceFormatted} di ${locationName}! Penjual sedang butuh uang cepat, segera cek sebelum keduluan!`
      : `Ada barang butuh uang (BU) untuk kategori ${finalCategory} yang Anda minati baru saja tayang!`;
    const url = `https://solosatset.vercel.app/?item=${productId}`;
    const productImg = (product && product.images && product.images[0]) || '/assets/img/app-logo.png?v=2.1';

    const productDetails = {
      title,
      message,
      url,
      image: productImg,
      category: finalCategory
    };

    let broadcastFn = sbBroadcastBuNotification;
    if (typeof broadcastFn !== 'function' && typeof window !== 'undefined' && typeof window.sbBroadcastBuNotification === 'function') {
      broadcastFn = window.sbBroadcastBuNotification;
    }

    if (typeof broadcastFn !== 'function') {
      return { success: false, sentUsersCount: 0, error: 'Broadcast service unavailable' };
    }

    const result = await broadcastFn(productId, finalCategory, productDetails);

    if (result && result.success) {
      if ((result.userCount || (result.targetUserIds && result.targetUserIds.length)) > 0) {
        showBuBroadcastToast({
          productId,
          categoryId: finalCategory,
          title: result.title || title,
          message: result.message || message,
          image: productImg,
          url
        });
      } else {
        showToast(`⚡ Iklan BU aktif! Belum ada user dengan riwayat minat kategori "${finalCategory}".`, 'info');
      }
    }

    return {
      success: result ? !!result.success : false,
      sentUsersCount: result ? (result.userCount || 0) : 0,
      userCount: result ? (result.userCount || 0) : 0,
      targetUserIds: result ? (result.targetUserIds || []) : [],
      title: result ? (result.title || title) : title,
      message: result ? (result.message || message) : message,
      error: result ? result.error : undefined
    };
  } catch (err) {
    console.error('[BU Notification Wrapper Error]', err);
    return { success: false, sentUsersCount: 0, userCount: 0, error: err.message };
  }
}

export function showBuBroadcastToast(detail) {
  if (!detail) return;
  const productId = detail.productId || detail.product_id || detail.listing_id;
  const title = detail.title || '🔥 IKLAN BUTUH UANG (BU) TERBARU!';
  const message = detail.message || detail.body || 'Ada barang BU terbaru yang cocok dengan minat Anda!';
  const image = detail.image || detail.icon || '/assets/img/app-logo.png?v=2.1';
  const categoryId = detail.categoryId || detail.category_id || 'BU';

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([150, 80, 150]); } catch (e) { }
  }

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-md w-[92%] sm:w-auto sm:min-w-[360px] pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-bu-item pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-2 border-amber-400 shadow-2xl shadow-rose-950/90 text-white transition-all duration-300 transform -translate-y-4 opacity-0 max-w-md w-full backdrop-blur-md ring-4 ring-amber-400/30';

  toast.innerHTML = `
    <div class="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border-2 border-amber-300 shadow-md">
      <img src="${image}" alt="BU Item" class="w-full h-full object-cover" onerror="this.src='/assets/img/app-logo.png?v=2.1'">
      <span class="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] font-black text-center py-0.2 uppercase">🔥 BU</span>
    </div>
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-rose-950 shadow-xs">
          🔥 BUTUH UANG CEPAT
        </span>
        <span class="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/20 text-rose-100">
          ${String(categoryId).toUpperCase()}
        </span>
      </div>
      <h4 class="text-xs sm:text-sm font-black text-white leading-snug break-words">${title}</h4>
      <p class="text-[11.5px] text-rose-100/90 mt-0.5 line-clamp-2 leading-relaxed">${message}</p>

      <div class="mt-2 flex items-center gap-2">
        <button type="button" class="btn-check-bu px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-rose-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95">
          <span>⚡ Cek Iklan Sekarang</span>
        </button>
      </div>
    </div>
    <button type="button" class="btn-close-toast text-rose-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer" title="Tutup">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  const btnCheck = toast.querySelector('.btn-check-bu');
  if (btnCheck) {
    btnCheck.onclick = () => {
      toast.remove();
      if (productId && typeof openProductDetail === 'function') {
        openProductDetail(productId);
      }
    };
  }

  const closeBtn = toast.querySelector('.btn-close-toast');
  if (closeBtn) {
    closeBtn.onclick = () => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 250);
    };
  }

  container.appendChild(toast);
  try { refreshIcons(toast); } catch (e) { }

  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
}

export async function verifyBuQrisPayment(productId, categoryId) {
  try {
    if (typeof window.updateListing === 'function') {
      window.updateListing(productId, {
        is_bu: true,
        isBu: true,
        bu_expires_at: null,
        qris_verified: true
      });
    }

    const res = await triggerBuNotification(productId, categoryId);

    if (typeof window.renderListings === 'function') {
      window.renderListings();
    }

    return res;
  } catch (err) {
    console.error('[QRIS Verification Error]', err);
    return { success: false, error: err.message };
  }
}

export function formatNotificationTime(isoString) {
  if (!isoString) return 'Baru saja';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Baru saja';
  }
}

export function renderNotificationsDOM(notifs) {
  const container = document.getElementById('notifications-list-container');
  if (!container) return;

  if (!Array.isArray(notifs) || notifs.length === 0) {
    container.innerHTML = `
      <div id="notifications-empty-state" class="py-12 px-4 text-center space-y-3">
        <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-inner">
          <i data-lucide="bell-off" class="w-8 h-8"></i>
        </div>
        <div class="space-y-1">
          <h4 class="font-black text-slate-800 text-sm">Belum Ada Notifikasi</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto">Notifikasi barang Butuh Uang (BU) sesuai minat kategori Anda akan muncul secara instan di sini.</p>
        </div>
      </div>
    `;
    try { refreshIcons(); } catch (e) { }
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  notifs.forEach(notif => {
    const isUnread = !notif.is_read;
    const isBu = notif.type === 'bu_interest' || (notif.title && notif.title.includes('BUTUH UANG'));
    const timeText = formatNotificationTime(notif.created_at);
    const imgSrc = notif.image || '/assets/img/app-logo.png?v=2.1';
    const catText = notif.category_id ? String(notif.category_id).toUpperCase() : 'BU';

    const card = document.createElement('div');
    card.className = `notif-item relative flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer group ${isUnread
      ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/80 shadow-xs'
      : 'bg-white border-slate-200/80 hover:bg-slate-50 opacity-90'
    }`;
    card.dataset.notifId = notif.id || '';
    card.dataset.productId = notif.product_id || notif.listing_id || '';

    card.innerHTML = `
        <div class="relative w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200 shadow-2xs">
          <img src="${imgSrc}" alt="${notif.title || 'Notifikasi'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='/assets/img/app-logo.png?v=2.1'">
          ${isBu ? '<span class="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] font-black text-center py-0.2 uppercase">🔥 BU</span>' : ''}
        </div>

        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span class="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isBu ? 'bg-rose-800 text-rose-100' : 'bg-slate-800 text-slate-100'}">
              ${catText}
            </span>
            <span class="text-[10px] text-slate-400 font-medium">${timeText}</span>
          </div>
          <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-rose-900 transition-colors ${isUnread ? 'font-black' : 'font-semibold text-slate-700'}">
            ${notif.title || 'Pemberitahuan Barang'}
          </h4>
          <p class="text-[11.5px] sm:text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
            ${notif.message || notif.body || ''}
          </p>
        </div>

        ${isUnread ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0 mt-1 shadow-xs animate-pulse"></span>' : ''}
    `;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  try { refreshIcons(); } catch (e) { }

  container.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', async () => {
      const notifId = item.getAttribute('data-notif-id');
      const productId = item.getAttribute('data-product-id');

      if (notifId && typeof sbMarkNotificationAsRead === 'function') {
        sbMarkNotificationAsRead(notifId);
      }

      const targetObj = cachedNotifications.find(n => String(n.id) === String(notifId));
      if (targetObj) targetObj.is_read = true;
      updateNotificationBadgeDOM(cachedNotifications);
      item.classList.remove('bg-rose-50/90', 'border-rose-200');
      item.classList.add('bg-white', 'border-slate-200/80', 'opacity-90');

      closeModal('modal-notifications');

      if (productId) {
        setTimeout(() => {
          openProductDetail(productId);
        }, 200);
      }
    });
  });
}

export function updateNotificationBadgeDOM(notifs) {
  const badge = document.getElementById('notif-badge-count');
  if (!badge) return;

  const unreadCount = Array.isArray(notifs) ? notifs.filter(n => !n.is_read).length : 0;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.classList.remove('hidden');
    badge.classList.add('animate-bounce');
    setTimeout(() => badge.classList.remove('animate-bounce'), 2000);
  } else {
    badge.classList.add('hidden');
    badge.textContent = '0';
  }
}

export async function syncUserNotifications(silent = false) {
  let currentUserId = getActiveSessionUserId();

  try {
    const notifs = await sbGetNotifications(currentUserId);
    cachedNotifications = notifs || [];
    updateNotificationBadgeDOM(cachedNotifications);

    const modal = document.getElementById('modal-notifications');
    if (modal && !modal.classList.contains('hidden') && window.getComputedStyle(modal).display !== 'none') {
      renderNotificationsDOM(cachedNotifications);
    }
  } catch (e) {
    if (!silent) console.warn('[syncUserNotifications Note]', e.message);
  }
}

export function initNotificationsCenter() {
  const currentUserId = getActiveSessionUserId();
  syncUserNotifications(true);
  cleanupNotificationsRealtime();

  const btnMarkAll = document.getElementById('btn-mark-all-notifs-read');
  if (btnMarkAll && !btnMarkAll.dataset.notifMarkAllReady) {
    btnMarkAll.dataset.notifMarkAllReady = 'true';
    btnMarkAll.addEventListener('click', async () => {
      const uid = getActiveSessionUserId();
      if (uid && typeof sbMarkAllNotificationsAsRead === 'function') {
        await sbMarkAllNotificationsAsRead(uid);
      }
      cachedNotifications.forEach(n => { n.is_read = true; });
      updateNotificationBadgeDOM(cachedNotifications);
      renderNotificationsDOM(cachedNotifications);
      showToast('Semua notifikasi berhasil ditandai sudah dibaca.', 'success');
    });
  }

  if (typeof sbSubscribeNotifications === 'function') {
    try {
      activeNotifRealtimeChannel = sbSubscribeNotifications(currentUserId, (newNotif) => {
        if (newNotif && !cachedNotifications.some(n => n.id === newNotif.id)) {
          cachedNotifications.unshift(newNotif);
          updateNotificationBadgeDOM(cachedNotifications);

          if (newNotif.type === 'bu_interest' || (newNotif.title && newNotif.title.includes('BUTUH UANG'))) {
            showBuBroadcastToast({
              productId: newNotif.product_id || newNotif.listing_id,
              categoryId: newNotif.category_id,
              title: newNotif.title,
              message: newNotif.message || newNotif.body,
              image: newNotif.image,
              url: newNotif.url
            });
          } else {
            const title = newNotif.title || '🔔 Notifikasi Baru Masuk!';
            showToast(`🔔 ${title}`, 'info');
          }

          const modal = document.getElementById('modal-notifications');
          if (modal && !modal.classList.contains('hidden') && window.getComputedStyle(modal).display !== 'none') {
            renderNotificationsDOM(cachedNotifications);
          }
        }
      });
    } catch (e) { }
  }

  if (!isNotificationsCenterInitialized) {
    isNotificationsCenterInitialized = true;
    setInterval(() => {
      syncUserNotifications(true);
    }, 25000);

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        syncUserNotifications(true);
      });
      window.addEventListener('buNotificationTriggered', () => {
        setTimeout(() => syncUserNotifications(true), 1000);
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.cleanupNotificationsRealtime = cleanupNotificationsRealtime;
  window.triggerBuNotification = triggerBuNotification;
  window.showBuBroadcastToast = showBuBroadcastToast;
  window.verifyBuQrisPayment = verifyBuQrisPayment;
  window.renderNotificationsDOM = renderNotificationsDOM;
  window.updateNotificationBadgeDOM = updateNotificationBadgeDOM;
  window.syncUserNotifications = syncUserNotifications;
  window.initNotificationsCenter = initNotificationsCenter;
}
