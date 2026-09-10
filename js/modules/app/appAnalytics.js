import { getCurrentUser } from '../../services/auth.js';
import { getListingById } from '../../services/storage.js';
import { sbTrackUserInterest, sbGetUserInterests } from '../../services/supabaseDB.js';
import { supabase } from '../../lib/supabase.js';
import { deferTask } from '../../utils/runtime.js';

export function getActiveSessionUserId() {
  try {
    let user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user && typeof window !== 'undefined' && window.state?.currentUser) {
      user = window.state.currentUser;
    }
    if (!user && typeof sessionStorage !== 'undefined') {
      try {
        const sess = sessionStorage.getItem('solosatset_current_user_data');
        if (sess) user = JSON.parse(sess);
      } catch (e) {}
    }
    if (!user && typeof localStorage !== 'undefined') {
      try {
        const local = localStorage.getItem('pusat_barkas_current_user') || localStorage.getItem('solosatset_user');
        if (local) user = JSON.parse(local);
      } catch (e) {}
    }
    if (user && user.id) return String(user.id);
    if (user && user.email) return String(user.email);

    let deviceUUID = window.__solosatset_user_uuid || (typeof localStorage !== 'undefined' ? localStorage.getItem('solosatset_device_uuid') : null);
    if (!deviceUUID) {
      deviceUUID = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      window.__solosatset_user_uuid = deviceUUID;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('solosatset_device_uuid', deviceUUID);
        }
      } catch (e) {}
    }
    return deviceUUID;
  } catch (e) {
    return 'guest-' + Date.now();
  }
}

if (typeof window !== 'undefined') {
  window.getActiveSessionUserId = getActiveSessionUserId;
}

export async function trackUserInterest(productOrCategoryOrId, score = 1) {
  if (!productOrCategoryOrId) return;
  let categoryId = null;
  let productId = null;

  if (typeof productOrCategoryOrId === 'object' && productOrCategoryOrId !== null) {
    categoryId = productOrCategoryOrId.category || productOrCategoryOrId.categoryId;
    productId = productOrCategoryOrId.id;
  } else if (typeof productOrCategoryOrId === 'string') {
    const trimmed = productOrCategoryOrId.trim();
    let foundProduct = null;
    if (typeof getListingById === 'function') {
      foundProduct = getListingById(trimmed);
    }
    if (foundProduct) {
      productId = foundProduct.id;
      categoryId = foundProduct.category || foundProduct.categoryId;
    } else {
      categoryId = trimmed;
    }
  }

  if (!categoryId || categoryId === 'all') {
    return void console.warn('[trackUserInterest] Gagal mengekstrak category_id yang valid dari parameter:', productOrCategoryOrId);
  }

  const cleanCatId = String(categoryId).toLowerCase().trim();
  const activeBuyerUserId = getActiveSessionUserId();
  const sellerId = (typeof productOrCategoryOrId === 'object' && productOrCategoryOrId !== null && (productOrCategoryOrId.user_id || productOrCategoryOrId.sellerId || productOrCategoryOrId.seller_id)) || '-';

  console.log(`[trackUserInterest] 🎯 Tracking Minat Pembeli Aktif: Buyer="${activeBuyerUserId}", Kategori="${cleanCatId}" (Produk: ${productId || '-'}, Seller: ${sellerId})`);

  if (typeof window !== 'undefined') {
    window.__solosatset_user_interests = window.__solosatset_user_interests || {};
    window.__solosatset_user_interests[cleanCatId] = (Number(window.__solosatset_user_interests[cleanCatId]) || 0) + score;
  }

  deferTask(async () => {
    try {
      if (typeof sbTrackUserInterest === 'function') {
        await sbTrackUserInterest(activeBuyerUserId, cleanCatId, score);
      }
    } catch (err) {
      console.error('[trackUserInterest Exception]', err);
    }
  });

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('userInterestTracked', {
          detail: {
            categoryId: cleanCatId,
            userId: activeBuyerUserId,
            score: score,
            productId: productId,
            sellerId: sellerId,
          },
        })
      );
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  window.trackUserInterest = trackUserInterest;
}

export async function getUserTopInterests(userId = null, limit = 3) {
  const targetUid = userId || getActiveSessionUserId();
  const topCats = [];

  if (typeof sbGetUserInterests === 'function' && targetUid) {
    try {
      const sbCats = await sbGetUserInterests(targetUid);
      if (Array.isArray(sbCats)) {
        sbCats.forEach((cat) => {
          const clean = String(cat || '').toLowerCase().trim();
          if (clean && !topCats.includes(clean) && topCats.length < limit) {
            topCats.push(clean);
          }
        });
      }
    } catch (e) {}
  } else if (supabase && targetUid) {
    try {
      let query = supabase.from('users').select('interests');
      query = typeof targetUid === 'string' && targetUid.includes('@')
        ? query.eq('email', targetUid.toLowerCase().trim())
        : query.eq('id', targetUid);
      const { data: user } = await query.maybeSingle();
      if (Array.isArray(user?.interests)) {
        user.interests.forEach((cat) => {
          const clean = String(cat || '').toLowerCase().trim();
          if (clean && !topCats.includes(clean) && topCats.length < limit) {
            topCats.push(clean);
          }
        });
      }
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.__solosatset_user_interests) {
    const memorySorted = Object.entries(window.__solosatset_user_interests)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    memorySorted.forEach((cat) => {
      if (!topCats.includes(cat) && topCats.length < limit) {
        topCats.push(cat);
      }
    });
  }

  return topCats.length > 0 ? topCats : ['elektronik', 'otomotif', 'hobi'];
}

if (typeof window !== 'undefined') {
  window.getUserTopInterests = getUserTopInterests;
}
