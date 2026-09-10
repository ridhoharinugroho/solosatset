import { SAMPLE_LISTINGS } from '../data/sampleListings.js';
import { getCurrentUser } from './auth.js';
import { supabase } from '../lib/supabase.js';
import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';
import { sbUploadMultipleImages, sbDeleteAvatar, sbBroadcastBuNotification, updateUserInterest } from './supabaseDB.js';
import { DEFAULT_SITE_SETTINGS, DEFAULT_CUSTOM_TEXTS } from './storageSettings.js';
import { DEFAULT_REVIEWS } from './storageReviews.js';
import { initCloudRealtimeSync, broadcastToCloud } from './cloudSync.js';
import { seedListingsToSupabaseIfEmpty } from './supabaseListingsSeeder.js';
import { getMyListings, isSellerVerified } from './storageSellerQueries.js';
import { saveListing, updateListing } from './storageListingsMutations.js';

export { formatRegionTitle, formatDistrictTitle, sbDeleteAvatar, seedListingsToSupabaseIfEmpty, getMyListings, isSellerVerified, saveListing, updateListing };

export async function deleteAvatarFile(avatarUrlOrPath) {
  if (!avatarUrlOrPath || typeof avatarUrlOrPath !== 'string') return true;
  const rawUrl = avatarUrlOrPath.trim();
  if (!rawUrl || rawUrl.includes('dicebear.com') || rawUrl.includes('unsplash.com') || rawUrl.startsWith('data:')) {
    return true;
  }

  try {
    let rawCleaned = rawUrl;
    if (rawUrl.includes('/avatars/')) {
      rawCleaned = rawUrl.split('/avatars/').pop();
    } else if (rawUrl.includes('avatars/')) {
      rawCleaned = rawUrl.split('avatars/').pop();
    }

    const cleanPath = decodeURIComponent(rawCleaned.split('?')[0].split('#')[0].trim());
    if (!cleanPath || cleanPath === '') return true;

    if (supabase && supabase.storage) {
      const { error } = await supabase.storage.from('avatars').remove([cleanPath]);
      if (error) {
        console.warn(`[Storage deleteAvatarFile Notice] Gagal menghapus file avatar "${cleanPath}":`, error.message || error);
      } else {
        console.log(`✅ [Storage deleteAvatarFile Success] File avatar "${cleanPath}" berhasil dihapus.`);
      }
      return true;
    }
  } catch (err) {
    console.warn('[Storage deleteAvatarFile Exception]:', err.message || err);
    return true;
  }
  return true;
}

export function safeBroadcastToCloud(type, data) {
  try {
    if (typeof broadcastToCloud === 'function') {
      broadcastToCloud(type, data).catch((e) => console.warn('[CloudSync Broadcast Warning]', e));
    }
  } catch (e) {
    console.warn('[CloudSync Broadcast Exception]', e);
  }
}

export const realtimeChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pusat_barkas_realtime_v2') : null;
let isStorageInitialized = false;

export async function initializeStorage() {
  if (isStorageInitialized) return;
  isStorageInitialized = true;

  try {
    if (!Array.isArray(inMemoryListings) || inMemoryListings.length === 0) {
      inMemoryListings = [...SAMPLE_LISTINGS];
    }

    if (supabase) {
      seedListingsToSupabaseIfEmpty().catch(() => {});
    }

    window.__siteSettings = { ...DEFAULT_SITE_SETTINGS };

    try {
      const { data: textsData } = await supabase.from('custom_texts').select('*').limit(1);
      const firstText = (textsData && textsData.length > 0) ? textsData[0] : null;
      window.__customTexts = firstText ? { ...DEFAULT_CUSTOM_TEXTS, ...firstText } : { ...DEFAULT_CUSTOM_TEXTS };
    } catch (tErr) {
      window.__customTexts = { ...DEFAULT_CUSTOM_TEXTS };
    }

    let reviews = [];
    try {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error) {
        reviews = DEFAULT_REVIEWS;
      } else {
        reviews = data.length ? data : DEFAULT_REVIEWS;
      }
    } catch (e) {
      reviews = DEFAULT_REVIEWS;
    }
    window.__reviews = reviews;

    try {
      const cb = Date.now();
      fetch(`db/site_settings.json?_cb=${cb}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      })
        .then(r => r.ok ? r.json() : null)
        .then(dbSettings => {
          if (dbSettings && !window.__siteSettingsCache) {
            window.__siteSettingsCache = dbSettings;
            window.dispatchEvent(new CustomEvent('siteSettingsChanged', { detail: dbSettings }));
          }
        }).catch(() => {});

      fetch(`db/custom_texts.json?_cb=${cb}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      })
        .then(r => r.ok ? r.json() : null)
        .then(dbTexts => {
          if (dbTexts && !window.__siteTextsCache) {
            window.__siteTextsCache = dbTexts;
            window.dispatchEvent(new CustomEvent('siteTextsChanged', { detail: dbTexts }));
          }
        }).catch(() => {});
    } catch (e) {}

    if (realtimeChannel) {
      realtimeChannel.onmessage = (event) => {
        try {
          const msg = event.data;
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'SETTINGS_UPDATED') {
            window.__siteSettings = msg.payload;
            window.dispatchEvent(new CustomEvent('siteSettingsChanged', { detail: msg.payload }));
          } else if (msg.type === 'TEXTS_UPDATED') {
            window.__customTexts = msg.payload;
            window.dispatchEvent(new CustomEvent('siteTextsChanged', { detail: msg.payload }));
          } else if (msg.type === 'LISTINGS_UPDATED') {
            inMemoryListings = msg.payload;
            window.dispatchEvent(new CustomEvent('listingsChanged', { detail: msg.payload }));
          }
        } catch (err) {}
      };
    }

    initCloudRealtimeSync(
      (cloudTexts) => {
        if (!cloudTexts || typeof cloudTexts !== 'object') return;
        window.__customTexts = cloudTexts;
        window.dispatchEvent(new CustomEvent('siteTextsChanged', { detail: cloudTexts }));
      },
      (cloudSettings) => {
        if (!cloudSettings || typeof cloudSettings !== 'object') return;
        window.__siteSettings = cloudSettings;
        window.dispatchEvent(new CustomEvent('siteSettingsChanged', { detail: cloudSettings }));
      },
      (cloudListings) => {
        if (Array.isArray(cloudListings) && cloudListings.length > 0) {
          inMemoryListings = cloudListings;
          window.dispatchEvent(new CustomEvent('listingsChanged', { detail: cloudListings }));
        }
      },
      (cloudUsers) => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          window.dispatchEvent(new CustomEvent('registeredUsersChanged', { detail: cloudUsers }));
        }
      }
    );
  } catch (err) {
    console.error("Storage init:", err);
  }
}

let inMemoryListings = [...SAMPLE_LISTINGS];

export function getAllListings() {
  if (!Array.isArray(inMemoryListings) || inMemoryListings.length === 0) {
    inMemoryListings = [...SAMPLE_LISTINGS];
  }
  return inMemoryListings;
}

export function processAndBroadcastSupabaseListings(cloudData) {
  if (!Array.isArray(cloudData)) return [];
  const cleanCloud = cloudData.filter((c) => {
    if (!c) return false;
    const sEmail = c.seller_email || (c.seller && c.seller.email) || '';
    const sName = c.seller_name || (c.seller && (c.seller.storeName || c.seller.name)) || '';
    return !sEmail.toLowerCase().includes('danang.solo') && !sName.toLowerCase().includes('danang') && c.status !== 'deleted';
  }).map((c) => {
    let parsedImages = [];
    if (Array.isArray(c.images)) {
      parsedImages = c.images;
    } else if (typeof c.images === 'string') {
      try {
        const p = JSON.parse(c.images);
        if (Array.isArray(p)) parsedImages = p;
        else if (c.images.startsWith('http')) parsedImages = [c.images];
      } catch (e) {
        if (c.images.startsWith('http')) parsedImages = [c.images];
      }
    }
    if (!parsedImages || parsedImages.length === 0) {
      parsedImages = ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"];
    }

    return {
      id: c.id,
      title: c.title || 'Barang Jualan',
      price: Number(c.price) || 0,
      category: c.category || 'lainnya',
      condition: c.condition || 'good',
      negoType: c.nego_type || c.negoType || 'nego_alus',
      paymentMethod: c.payment_method || c.paymentMethod || 'cod',
      regionId: c.region || c.regionId || 'solo',
      district: c.district || '',
      codPoint: c.cod_point || c.codPoint || ('COD ' + (c.district || 'Solo Raya')),
      description: c.description || '',
      images: parsedImages,
      seller: {
        id: c.seller_id || 'user-anon',
        name: c.seller_name || 'Penjual Solo',
        storeName: c.seller_name || 'Penjual Solo',
        phone: c.seller_phone || '081234567890',
        avatar: c.seller_avatar || '',
        region: c.region || 'solo'
      },
      status: c.status || 'active',
      isSold: c.status === 'sold',
      is_bu: Boolean(c.is_bu || c.isBu),
      isBu: Boolean(c.is_bu || c.isBu),
      bu_expires_at: c.bu_expires_at || null,
      bu_activated_at: c.bu_activated_at || null,
      qris_verified: Boolean(c.qris_verified),
      payment_status: c.payment_status || (c.is_bu ? 'verified' : 'none'),
      views: Number(c.views) || 0,
      createdAt: c.created_at || c.createdAt || new Date().toISOString()
    };
  });

  const finalData = cleanCloud.length > 0 ? cleanCloud : [...SAMPLE_LISTINGS];
  inMemoryListings = finalData;
  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: finalData }));
  return finalData;
}

let isFetchingListingsFromSupabase = false;
let lastFetchListingsTime = 0;

export async function fetchPublicListingsFromSupabase(force = false) {
  const now = Date.now();
  if (isFetchingListingsFromSupabase || (!force && (now - lastFetchListingsTime < 30000))) {
    return getPublicListings();
  }

  isFetchingListingsFromSupabase = true;
  lastFetchListingsTime = now;

  if (!supabase) {
    isFetchingListingsFromSupabase = false;
    return getPublicListings();
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length === 0) {
        await seedListingsToSupabaseIfEmpty();
        const { data: freshData } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
        if (freshData && freshData.length > 0) {
          return processAndBroadcastSupabaseListings(freshData);
        }
      } else {
        return processAndBroadcastSupabaseListings(data);
      }
    }
  } catch (err) {
    console.warn('[Supabase Fetch Exception]', err);
  } finally {
    isFetchingListingsFromSupabase = false;
  }
  return getPublicListings();
}

export function getPublicListings() {
  const all = getAllListings();
  let localListings = all.filter((item) => !item.isHidden && item.status !== 'deleted');
  if (localListings.length === 0 && Array.isArray(SAMPLE_LISTINGS) && SAMPLE_LISTINGS.length > 0) {
    localListings = [...SAMPLE_LISTINGS];
  }
  return localListings;
}

export function getListingById(id) {
  const listings = getAllListings();
  return listings.find((item) => item.id === id) || null;
}

export function updateListingStatus(id, newStatus) {
  return updateListing(id, {
    status: newStatus,
    isSold: newStatus === 'sold'
  });
}

export function toggleSoldStatus(id) {
  const listings = getAllListings();
  const index = listings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  listings[index].isSold = !listings[index].isSold;

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }

  safeBroadcastToCloud('LISTINGS_UPDATED', listings);
  return listings[index];
}

export function toggleHideListing(id) {
  const listings = getAllListings();
  const index = listings.findIndex((item) => item.id === id);
  if (index === -1) return null;

  listings[index].isHidden = !listings[index].isHidden;

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }

  safeBroadcastToCloud('LISTINGS_UPDATED', listings);
  return listings[index];
}

export function deleteListing(id) {
  inMemoryListings = inMemoryListings.filter((item) => String(item.id).trim() !== String(id).trim());

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: inMemoryListings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: inMemoryListings });
  }

  safeBroadcastToCloud('LISTINGS_UPDATED', inMemoryListings);

  if (supabase) {
    supabase.from('listings').delete().eq('id', id).catch(() => {});
  }

  return true;
}

export function incrementListingViews(id) {
  const listings = getAllListings();
  const item = listings.find((l) => l.id === id);
  if (item) {
    item.views = (item.views || 0) + 1;
  }
}

export {
  getFavoriteIds,
  toggleFavorite,
  isFavorite,
  getListingsBySellerId,
  getSellerStats
} from './storageFavorites.js';
