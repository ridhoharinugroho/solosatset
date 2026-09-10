import { getRegionById } from '../../data/regions.js';
import { CATEGORIES, CONDITIONS, NEGO_TYPES } from '../../data/categories.js';
import { getCurrentUser, isUserLoggedIn, isDemoUser, getUserById, formatJoinedDate } from '../../services/auth.js';
import { getListingById, incrementListingViews, isFavorite, toggleFavorite, getSellerRatingStats, isSellerVerified } from '../../services/storage.js';
import { formatRupiah, generateWhatsAppUrl, timeAgo } from '../../services/whatsapp.js';
import { refreshIcons } from '../../utils/runtime.js';
import { showToast } from '../common/toast.js';
import { openModal } from '../common/modalManager.js';
import { applyDetailImageSettings, initDetailImageResizeControls } from '../ui/imageResize.js';
import { getActiveSessionUserId, getTrackingUserUUID, trackUserInterest, getUserTopInterests } from './productInterestTracker.js';

export { getActiveSessionUserId, getTrackingUserUUID, trackUserInterest, getUserTopInterests };

export function handleProductClick(productOrListingId) {
  let product = null;
  let listingId = null;

  if (typeof productOrListingId === 'object' && productOrListingId !== null) {
    product = productOrListingId;
    listingId = product.id;
  } else if (typeof productOrListingId === 'string') {
    listingId = productOrListingId;
    if (typeof getListingById === 'function') {
      product = getListingById(listingId);
    }
  }

  trackUserInterest(listingId || product);

  if (listingId) {
    openProductDetail(listingId);
  }
}

export function openProductDetail(listingId) {
  const listing = getListingById(listingId);
  if (!listing) return;
  if (typeof window.state !== 'undefined') {
    window.state.currentDetailListing = listing;
  }

  trackUserInterest(listing);
  incrementListingViews(listingId);

  const region = getRegionById(listing.regionId);
  const regionName = region ? region.name : listing.regionId;
  const isFav = isFavorite(listing.id);

  const mainDetailImg = document.getElementById('detail-image');
  const thumbContainer = document.getElementById('detail-thumbnails-container');
  if (mainDetailImg) mainDetailImg.src = listing.images[0];

  const isAdmin = sessionStorage.getItem('pusat_barkas_admin_auth') === 'true';
  const adminToolbar = document.getElementById('admin-detail-image-toolbar');
  if (adminToolbar) {
    if (isAdmin) {
      adminToolbar.classList.remove('hidden');
      initDetailImageResizeControls();
    } else {
      adminToolbar.classList.add('hidden');
    }
  }

  applyDetailImageSettings();

  if (thumbContainer) {
    if (listing.images && listing.images.length > 1) {
      thumbContainer.classList.remove('hidden');
      let thumbsHtml = '';
      listing.images.forEach((imgUrl, idx) => {
        thumbsHtml += `
          <button
            type="button"
            data-img-index="${idx}"
            class="detail-thumb-btn w-14 sm:w-16 aspect-square rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-rose-800 ring-2 ring-rose-300 scale-105' : 'border-slate-300 opacity-70 hover:opacity-100'}"
          >
            <img src="${imgUrl}" alt="${listing.title} Foto ${idx + 1}" class="w-full h-full object-cover">
          </button>
        `;
      });
      thumbContainer.innerHTML = thumbsHtml;

      thumbContainer.querySelectorAll('.detail-thumb-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-img-index'), 10);
          if (mainDetailImg) mainDetailImg.src = listing.images[idx];
          thumbContainer.querySelectorAll('.detail-thumb-btn').forEach((b, i) => {
            if (i === idx) {
              b.className = "detail-thumb-btn w-14 sm:w-16 aspect-square rounded-xl overflow-hidden border-2 border-rose-800 ring-2 ring-rose-300 scale-105 transition-all";
            } else {
              b.className = "detail-thumb-btn w-14 sm:w-16 aspect-square rounded-xl overflow-hidden border-2 border-slate-300 opacity-70 hover:opacity-100 transition-all";
            }
          });
        });
      });
    } else {
      thumbContainer.classList.add('hidden');
      thumbContainer.innerHTML = '';
    }
  }

  const detailTitle = document.getElementById('detail-title');
  const detailPrice = document.getElementById('detail-price');
  if (detailTitle) detailTitle.textContent = listing.title;
  if (detailPrice) detailPrice.textContent = formatRupiah(listing.price);

  const paymentBadge = document.getElementById('detail-payment-method-badge');
  if (paymentBadge) {
    const pMethod = listing.paymentMethod || 'cod';
    if (pMethod === 'cod') {
      paymentBadge.innerHTML = `<i data-lucide="handshake" class="w-3.5 h-3.5 text-emerald-700"></i><span>COD</span>`;
      paymentBadge.className = 'px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1.5';
    } else {
      paymentBadge.innerHTML = `<i data-lucide="store" class="w-3.5 h-3.5 text-sky-700"></i><span>In Store</span>`;
      paymentBadge.className = 'px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-sky-100/90 text-sky-800 border border-sky-300 shadow-2xs flex items-center gap-1.5';
    }
  }

  const cat = CATEGORIES.find((c) => c.id === listing.category);
  const catBadge = document.getElementById('detail-category-badge');
  if (catBadge) {
    catBadge.innerHTML = `<i data-lucide="tag" class="w-3 h-3 text-rose-800"></i><span>${cat ? cat.name : 'Barang'}</span>`;
  }

  const regBadge = document.getElementById('detail-region-badge');
  if (regBadge) {
    const shortRegName = region ? (region.shortName || region.name.replace(/Kota|Kab\./gi, '').replace(/\(.*?\)/g, '').trim()) : (listing.regionId || 'Solo');
    const locSnippet = listing.district ? `${shortRegName} • ${listing.district}` : shortRegName;
    regBadge.innerHTML = `<i data-lucide="map-pin" class="w-3 h-3 text-rose-700"></i><span>${locSnippet}</span>`;
  }

  const statusBadge = document.getElementById('detail-status-badge');
  const itemStatus = listing.status || (listing.isSold ? 'sold' : 'available');
  if (statusBadge) {
    if (itemStatus === 'sold' || listing.isSold) {
      statusBadge.innerHTML = `<i data-lucide="x-circle" class="w-3 h-3 text-rose-600"></i><span>Terjual</span>`;
      statusBadge.className = 'px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs flex items-center gap-1';
    } else if (itemStatus === 'booked') {
      statusBadge.innerHTML = `<i data-lucide="clock" class="w-3 h-3 text-amber-600"></i><span>Booked</span>`;
      statusBadge.className = 'px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1';
    } else {
      statusBadge.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3 text-emerald-600"></i><span>Tersedia</span>`;
      statusBadge.className = 'px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1';
    }
  }

  const cond = CONDITIONS.find((c) => c.id === listing.condition);
  const condBadge = document.getElementById('detail-condition-badge');
  if (condBadge) {
    const condLabel = cond ? cond.label.split('(')[0].trim() : 'Bekas';
    condBadge.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3 text-blue-600"></i><span>${condLabel}</span>`;
  }

  const negoBadge = document.getElementById('detail-nego-badge');
  const negoObj = NEGO_TYPES.find((n) => n.id === listing.negoType);
  if (negoBadge) {
    const negoLabel = listing.negoType === 'pas' ? 'Nett' : (negoObj ? (negoObj.short || negoObj.label.split('(')[0].trim()) : 'Bisa Nego');
    negoBadge.innerHTML = `<i data-lucide="badge-percent" class="w-3 h-3 text-amber-700"></i><span>${negoLabel}</span>`;
  }

  const timeAgoEl = document.getElementById('detail-time-ago');
  if (timeAgoEl) {
    const span = timeAgoEl.querySelector('span');
    if (span) span.textContent = timeAgo(listing.createdAt);
  }

  const viewsEl = document.getElementById('detail-views-count');
  if (viewsEl) viewsEl.textContent = `${(listing.views || 0) + 1} kali dilihat`;

  const locEl = document.getElementById('detail-location-text');
  if (locEl) {
    const locText = listing.district ? `${regionName}, Kec. ${listing.district}` : regionName;
    locEl.textContent = locText;
  }

  const codEl = document.getElementById('detail-cod-text');
  const codBox = document.getElementById('detail-cod-container');
  if (codEl) {
    const pMethod = listing.paymentMethod || 'cod';
    if (pMethod === 'in_store') {
      const mapsBtnHtml = listing.storeMapsUrl ? `
        <div class="mt-2">
          <a href="${listing.storeMapsUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-300"></i>
            <span>Buka Lokasi Toko (Google Maps)</span>
            <i data-lucide="external-link" class="w-3 h-3 text-sky-200"></i>
          </a>
        </div>
      ` : '';
      const storeLoc = listing.codPoint && listing.codPoint.trim() ? listing.codPoint : `Ambil langsung di toko / lokasi penjual (Area ${listing.district ? listing.district + ', ' : ''}${regionName})`;
      codEl.innerHTML = `<div>${storeLoc}</div>${mapsBtnHtml}`;
      if (codBox) {
        const titleEl = codBox.querySelector('.uppercase');
        if (titleEl) titleEl.textContent = 'Lokasi Toko / Ambil di Tempat';
        const iconContainer = codBox.querySelector('.flex-shrink-0');
        if (iconContainer) iconContainer.innerHTML = '<i data-lucide="store" class="w-5 h-5"></i>';
        codBox.classList.remove('hidden');
      }
    } else {
      if (listing.codPoint && listing.codPoint.trim()) {
        codEl.textContent = listing.codPoint;
      } else {
        codEl.textContent = `Area ${listing.district ? listing.district + ', ' : ''}${regionName} (Bisa janjian via WhatsApp)`;
      }
      if (codBox) {
        const titleEl = codBox.querySelector('.uppercase');
        if (titleEl) titleEl.textContent = 'Titik / Patokan Lokasi COD';
        const iconContainer = codBox.querySelector('.flex-shrink-0');
        if (iconContainer) iconContainer.innerHTML = '<i data-lucide="handshake" class="w-5 h-5"></i>';
        codBox.classList.remove('hidden');
      }
    }
  }

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = listing.description;

  const sellerId = listing.seller?.id;
  const sellerUser = getUserById(sellerId);
  const sellerAvatar = document.getElementById('detail-seller-avatar');
  const sellerName = document.getElementById('detail-seller-name');
  const sellerRegionEl = document.getElementById('detail-seller-region');
  const sellerRegion = sellerRegionEl ? sellerRegionEl.querySelector('span') : null;
  const sellerRatingText = document.getElementById('detail-seller-rating-text');
  const sellerJoinedText = document.getElementById('detail-seller-joined');
  const sellerBadgeText = document.getElementById('detail-seller-badge-text');

  const ratingStats = getSellerRatingStats(sellerId);
  if (sellerRatingText) {
    sellerRatingText.textContent = `${ratingStats.averageRating.toFixed(1)} (${ratingStats.totalReviews} Ulasan)`;
  }

  const isSellerVer = isSellerVerified(sellerId || listing.seller);
  const isDemo = isDemoUser(sellerId || listing.seller) || Boolean(listing.isDemo) || Boolean(listing.id && listing.id.startsWith('barkas-0'));

  if (sellerBadgeText) {
    if (isDemo) {
      sellerBadgeText.textContent = `AKUN DEMO / PERAGA`;
      const badgeParent = sellerBadgeText.parentElement;
      if (badgeParent) {
        badgeParent.className = "inline-flex items-center gap-1 bg-amber-400 text-slate-950 border border-amber-500 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs";
      }
    } else if (isSellerVer) {
      sellerBadgeText.textContent = `Toko Lokal ${region ? region.shortName : 'Solo Raya'} Terverifikasi`;
      const badgeParent = sellerBadgeText.parentElement;
      if (badgeParent) {
        badgeParent.className = "inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full";
      }
    } else {
      sellerBadgeText.textContent = `Toko Member ${region ? region.shortName : 'Solo Raya'}`;
      const badgeParent = sellerBadgeText.parentElement;
      if (badgeParent) {
        badgeParent.className = "inline-flex items-center gap-1 bg-slate-700 text-slate-300 border border-slate-600 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full";
      }
    }
  }

  const existingDemoBadge = document.getElementById('detail-photo-demo-badge');
  if (isDemo) {
    if (!existingDemoBadge) {
      const demoBadge = document.createElement('div');
      demoBadge.id = 'detail-photo-demo-badge';
      demoBadge.className = 'absolute top-3 left-3 z-10 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-400 text-slate-950 border border-amber-500 shadow-md flex items-center gap-1.5';
      demoBadge.innerHTML = '<i data-lucide="tag" class="w-3.5 h-3.5"></i><span>AKUN DEMO / PERAGA</span>';
      document.getElementById('detail-photo-container')?.appendChild(demoBadge);
    }
  } else {
    existingDemoBadge?.remove();
  }

  if (sellerJoinedText) {
    const rawDate = sellerUser?.created_at || sellerUser?.createdAt || listing.seller?.created_at || listing.seller?.createdAt || listing.created_at || listing.createdAt;
    sellerJoinedText.textContent = `Bergabung: ${formatJoinedDate(rawDate)}`;
  }

  if (sellerAvatar) sellerAvatar.src = listing.seller?.avatar || sellerUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(listing.seller?.storeName || listing.seller?.name || 'solo')}`;
  if (sellerName) sellerName.textContent = sellerUser?.storeName || listing.seller?.storeName || listing.seller?.name || 'Penjual Terverifikasi';

  if (sellerRegion) {
    const shortReg = region ? (region.shortName || region.name.replace(/Kota|Kab\./gi, '').replace(/\(.*?\)/g, '').trim()) : (listing.regionId || 'Solo');
    const capReg = shortReg.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const distClean = (listing.district || sellerUser?.district || '').trim().replace(/\.+$/, '').replace(/^Kec\.?\s*/i, '');
    const capDist = distClean ? distClean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
    sellerRegion.textContent = capDist ? `${capReg} • ${capDist}` : capReg;
  }

  const viewSellerBtn = document.getElementById('btn-view-seller-profile');
  if (viewSellerBtn) {
    viewSellerBtn.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof window.openSellerProfileModal === 'function') {
        window.openSellerProfileModal(sellerId || listing.seller);
      }
    };
  }

  const soldOverlay = document.getElementById('detail-sold-overlay');
  if (soldOverlay) {
    if (listing.isSold || itemStatus === 'sold') {
      soldOverlay.classList.remove('hidden');
    } else {
      soldOverlay.classList.add('hidden');
    }
  }

  const favBtn = document.getElementById('btn-detail-favorite');
  if (favBtn) {
    favBtn.innerHTML = `<i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}"></i>`;
    favBtn.onclick = () => {
      const isNow = toggleFavorite(listing.id);
      favBtn.innerHTML = `<i data-lucide="heart" class="w-5 h-5 ${isNow ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}"></i>`;
      if (typeof window.renderListings === 'function') window.renderListings();
      showToast(isNow ? "Disimpan ke favorit" : "Dihapus dari favorit", "info");
      try { refreshIcons(); } catch (e) { }
    };
  }

  const waBtn = document.getElementById('btn-detail-whatsapp');
  const isItemSold = listing.isSold || itemStatus === 'sold';

  if (waBtn) {
    if (isItemSold) {
      waBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none', 'bg-slate-400');
      waBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'whatsapp-pulse');
      const span = waBtn.querySelector('span');
      if (span) span.textContent = 'Barang Ini Sudah Terjual';
    } else {
      waBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none', 'bg-slate-400');
      waBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'whatsapp-pulse');
      const span = waBtn.querySelector('span');
      if (span) span.textContent = 'Hubungi Penjual via WhatsApp';
      const currentUser = getCurrentUser();
      const waUrl = generateWhatsAppUrl(listing, currentUser?.storeName || currentUser?.name);
      waBtn.href = waUrl;
      waBtn.onclick = (e) => {
        if (!isUserLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.openUserAuthModal === 'function') {
            window.openUserAuthModal('login', 'Silakan masuk atau daftar akun terlebih dahulu untuk menghubungi penjual via WhatsApp.');
          } else {
            openModal('modal-user-auth');
          }
        }
      };
    }
  }

  const waPreviewText = document.getElementById('detail-wa-preview-text');
  if (waPreviewText) {
    const currentUser = getCurrentUser();
    const sellerDisp = listing.seller?.storeName || listing.seller?.name || 'Penjual';
    const locSnippet = listing.district ? `${regionName}, ${listing.district}` : regionName;
    const buyerName = currentUser?.storeName || currentUser?.name || 'Calon Pembeli';
    const msg = `Halo ${sellerDisp}, permisi... 👋\n\nSaya tertarik dengan iklan barang Anda di Pusat Jual Beli Solo Raya:\n📦 Barang: ${listing.title}\n💰 Harga: ${formatRupiah(listing.price)} (${listing.negoType === 'pas' ? 'Harga Pas' : 'Bisa Nego'})\n📍 Lokasi: ${locSnippet}\n${listing.codPoint ? `🤝 Titik COD: ${listing.codPoint}\n` : ''}\nApakah barang tersebut masih tersedia dan bisa COD?\n\nTerima kasih,\n— ${buyerName}`;
    waPreviewText.textContent = msg;

    const copyBtn = document.getElementById('btn-copy-wa-message');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(msg).then(() => {
          showToast("Format pesan WhatsApp berhasil disalin ke clipboard!", "success");
        }).catch(() => {
          showToast("Teks disalin", "info");
        });
      };
    }
  }

  const shareBtn = document.getElementById('btn-detail-share');
  if (shareBtn) {
    shareBtn.onclick = () => {
      openShareModal(listing);
    };
  }

  openModal('modal-product-detail');
  try { refreshIcons(); } catch (e) { }
}

export function openShareModal(listing) {
  if (!listing) return;
  const regName = getRegionById(listing.regionId)?.name || 'Solo Raya';
  const locSnippet = listing.district ? `${regName}, ${listing.district}` : regName;
  const shareUrl = window.location.origin + window.location.pathname + `?item=${listing.id}`;
  const shareText = `Cek iklan barang di Solo Raya:\n📦 *${listing.title}*\n💰 Harga: ${formatRupiah(listing.price)} (${listing.negoType === 'pas' ? 'Harga Pas' : 'Bisa Nego'})\n📍 Lokasi: ${locSnippet}\n\n👉 Klik link untuk melihat iklan lengkap di Pusat Jual Beli Solo Raya:\n${shareUrl}`;

  const itemImg = document.getElementById('share-modal-item-img');
  const itemTitle = document.getElementById('share-modal-item-title');
  const itemPrice = document.getElementById('share-modal-item-price');
  const itemLoc = document.getElementById('share-modal-item-loc');
  const linkInput = document.getElementById('share-modal-link-input');

  if (itemImg) itemImg.src = listing.images && listing.images[0] ? listing.images[0] : '';
  if (itemTitle) itemTitle.textContent = listing.title;
  if (itemPrice) itemPrice.textContent = formatRupiah(listing.price);
  if (itemLoc) itemLoc.innerHTML = `<i data-lucide="map-pin" class="w-3 h-3 text-rose-700"></i><span>${locSnippet}</span>`;
  if (linkInput) linkInput.value = shareUrl;

  const btnWa = document.getElementById('btn-share-whatsapp');
  if (btnWa) btnWa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const btnFb = document.getElementById('btn-share-facebook');
  if (btnFb) btnFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

  const btnIg = document.getElementById('btn-share-instagram');
  if (btnIg) {
    btnIg.onclick = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("Teks & tautan iklan berhasil disalin! Silakan tempel di Story / Feed / DM Instagram Anda.", "success");
      }).catch(() => {
        showToast("Teks iklan disalin ke clipboard", "info");
      });
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank");
      }, 350);
    };
  }

  const btnTg = document.getElementById('btn-share-telegram');
  if (btnTg) btnTg.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const btnWaGroup = document.getElementById('btn-share-wagroup');
  if (btnWaGroup) {
    const groupShareText = `*INFO JUAL BELI SOLO RAYA* 📢\n\nDijual: *${listing.title}*\n💰 Harga: ${formatRupiah(listing.price)} (${listing.negoType === 'pas' ? 'Harga Pas' : 'Bisa Nego'})\n📍 Lokasi: ${locSnippet}\n\n👉 Klik link untuk lihat foto lengkap & kontak penjual:\n${shareUrl}`;
    btnWaGroup.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(groupShareText)}`;
    btnWaGroup.onclick = () => {
      showToast("Membuka WhatsApp untuk dibagikan ke Grup WA...", "success");
    };
  }

  openModal('modal-share-product');
  try { refreshIcons(); } catch (e) { }
}

if (typeof window !== 'undefined') {
  window.getActiveSessionUserId = getActiveSessionUserId;
  window.getTrackingUserUUID = getTrackingUserUUID;
  window.trackUserInterest = trackUserInterest;
  window.getUserTopInterests = getUserTopInterests;
  window.handleProductClick = handleProductClick;
  window.openProductDetail = openProductDetail;
  window.openShareModal = openShareModal;
}
