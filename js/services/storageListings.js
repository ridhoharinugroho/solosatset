/**
 * Pusat Jual Beli Solo Raya - Persistent Storage & Cloud Real-Time Engine
 * Synchronizes across PC, Laptop, and Mobile/HP via Cloud Real-time PubSub + Supabase
 */

import { SAMPLE_LISTINGS } from '../data/sampleListings.js';
import { getCurrentUser, getUserById, getUserByReviewAuthor, DEFAULT_REGISTERED_USERS } from './auth.js';
import { supabase } from '../lib/supabase.js';
import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';
export { formatRegionTitle, formatDistrictTitle };
import { sbUploadMultipleImages, sbDeleteAvatar, sbBroadcastBuNotification, updateUserInterest } from './supabaseDB.js';
export { sbDeleteAvatar };

/**
 * Hapus fisik file avatar dari Supabase Storage bucket 'avatars'
 */
export async function deleteAvatarFile(avatarUrlOrPath) {
  if (!avatarUrlOrPath || typeof avatarUrlOrPath !== 'string') return true;
  const rawUrl = avatarUrlOrPath.trim();
  if (!rawUrl || rawUrl.includes('dicebear.com') || rawUrl.includes('unsplash.com') || rawUrl.startsWith('data:')) {
    return true; // Dilewati dengan aman untuk URL kosong, data URL, atau aset eksternal
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

    console.log(`[Storage deleteAvatarFile] Target cleanPath hapus avatar: "${cleanPath}" (URL asal: "${rawUrl}")`);

    if (supabase && supabase.storage) {
      const { error } = await supabase.storage.from('avatars').remove([cleanPath]);
      if (error) {
        console.warn(`[Storage deleteAvatarFile Notice] Gagal menghapus file avatar "${cleanPath}":`, error.message || error);
      } else {
        console.log(`✅ [Storage deleteAvatarFile Success] File avatar "${cleanPath}" berhasil dihapus dari bucket 'avatars'.`);
      }
      return true;
    }
  } catch (err) {
    console.warn('[Storage deleteAvatarFile Exception]:', err.message || err);
    return true;
  }
  return true;
}

import { initCloudRealtimeSync, broadcastToCloud } from './cloudSync.js';

// Safe broadcast helper to prevent unhandled reference or network errors
function safeBroadcastToCloud(type, data) {
  try {
    if (typeof broadcastToCloud === 'function') {
      broadcastToCloud(type, data).catch((e) => console.warn('[CloudSync Broadcast Warning]', e));
    }
  } catch (e) {
    console.warn('[CloudSync Broadcast Exception]', e);
  }
}

const STORAGE_KEY_LISTINGS = 'pusat_barkas_listings';
const STORAGE_KEY_FAVORITES = 'pusat_barkas_favorites';
const STORAGE_KEY_SETTINGS = 'pusat_barkas_site_settings';
const STORAGE_KEY_TEXTS = 'pusat_barkas_custom_texts';
const STORAGE_KEY_REVIEWS = 'pusat_barkas_seller_reviews';


// Default Sample Reviews for Initial Trust & Moderation
// Default Sample Reviews for Initial Trust & Moderation (22+ Positive Reviews for Seed Verified Seller)

export async function initializeStorage() {
  if (isStorageInitialized) return;
  isStorageInitialized = true;

  try {
    // 1. In-memory listings fallback & purge any Danang references
    if (!Array.isArray(inMemoryListings) || inMemoryListings.length === 0) {
      inMemoryListings = [...SAMPLE_LISTINGS];
    }

    // Auto-seed ke Supabase jika tabel kosong
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

    // Initialize reviews from Supabase or fallback to default
    let reviews = [];
    try {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error) {
        console.warn('[Supabase] fetch reviews error:', error.message);
        reviews = DEFAULT_REVIEWS;
      } else {
        reviews = data.length ? data : DEFAULT_REVIEWS;
      }
    } catch (e) {
      console.error('[Supabase] exception fetching reviews:', e);
      reviews = DEFAULT_REVIEWS;
    }
    // Store in memory (no localStorage) for further use
    window.__reviews = reviews;

    // Fetch static database file fallback with Cache-Busting for fresh user sessions
    try {
      const cb = Date.now();
      fetch(`db/site_settings.json?_cb=${cb}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      })
        .then(r => r.ok ? r.json() : null)
        .then(dbSettings => {
          if (dbSettings) {
            const curRaw = window.__siteSettingsCache;
            if (!curRaw) {
              window.__siteSettingsCache = dbSettings;
              window.dispatchEvent(new CustomEvent('siteSettingsChanged', { detail: dbSettings }));
            }
          }
        }).catch(() => {});

      fetch(`db/custom_texts.json?_cb=${cb}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      })
        .then(r => r.ok ? r.json() : null)
        .then(dbTexts => {
          if (dbTexts) {
            const curRaw = window.__siteTextsCache;
            if (!curRaw) {
              window.__siteTextsCache = dbTexts;
              window.dispatchEvent(new CustomEvent('siteTextsChanged', { detail: dbTexts }));
            }
          }
        }).catch(() => {});
    } catch (e) {}

    // 2. Setup BroadcastChannel listener for 0ms cross-tab sync
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
        } catch (err) {
          console.info('[BroadcastChannel Message Info]:', err.message || err);
        }
      };
    }

    // 3. Initialize Worldwide Cloud Real-Time Synchronization
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

// -------------------------------------------------------------
// GLOBAL CUSTOM TEXTS (GET / SAVE / RESET)
// -------------------------------------------------------------

export async function seedListingsToSupabaseIfEmpty() {
  if (!supabase) return;
  try {
    const { data: existing, error } = await supabase.from('listings').select('id');
    if (!error && Array.isArray(existing) && existing.length === 0) {
      console.log('[Supabase Listings Seed] Tabel listings kosong di Supabase. Melakukan INSERT otomatis 4 barang demo resmi...');
      
      // 1. Ensure seller users exist in Supabase 'users' table first (to prevent foreign key constraint violation)
      const sellerUsers = SAMPLE_LISTINGS.map(l => ({
        id: l.seller.id,
        name: l.seller.name || l.seller.storeName,
        store_name: l.seller.storeName || l.seller.name,
        email: l.seller.email || `seller-${l.seller.id}@solosatset.my.id`,
        phone: l.seller.phone || '081234567890',
        region: l.seller.region || l.regionId || 'solo',
        district: l.seller.district || l.district || 'Banjarsari',
        avatar: l.seller.avatar || null,
        bio: (DEFAULT_REGISTERED_USERS.find(u => u.id === l.seller.id)?.bio) || `Penjual Resmi ${l.seller.storeName || l.seller.name}`,
        password: null,
        is_demo: true,
        updated_at: new Date().toISOString()
      }));
      try {
        await supabase.from('users').upsert(sellerUsers, { onConflict: 'id' });
      } catch (uErr) {}

      // 2. Insert sample listings into Supabase
      const seedRows = SAMPLE_LISTINGS.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price,
        category: l.category,
        condition: l.condition,
        nego_type: l.negoType,
        payment_method: l.paymentMethod || 'cod',
        region: l.regionId,
        district: l.district,
        cod_point: l.codPoint,
        seller_id: l.seller.id,
        seller_name: l.seller.storeName || l.seller.name,
        seller_phone: l.seller.phone,
        seller_avatar: l.seller.avatar,
        images: l.images,
        status: l.status || 'active',
        views: l.views || 0,
        created_at: l.createdAt || new Date().toISOString(),
        updated_at: l.createdAt || new Date().toISOString()
      }));

      const { error: insErr } = await supabase.from('listings').upsert(seedRows, { onConflict: 'id' });
      if (!insErr) {
        console.log('[Supabase Listings Seed Success] Berhasil insert 4 barang demo resmi');
      } else {
        console.warn('[Supabase Listings Seed Error]', insErr.message);
      }
    }
  } catch (err) {
    console.warn('[Supabase Listings Seed Exception]', err);
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

/** Helper: merge Supabase listings dengan local listings tanpa duplikasi */
function mergeListings(local, cloud) {
  const map = new Map();
  local.forEach(l => {
    map.set(l.id, l);
  });
  cloud.forEach(c => {
    const existing = map.get(c.id);
    if (!existing) {
      map.set(c.id, c);
    } else {
      const localTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const cloudTime = c.updated_at ? new Date(c.updated_at).getTime() : (c.updatedAt ? new Date(c.updatedAt).getTime() : 0);
      if (cloudTime >= localTime) {
        map.set(c.id, c);
      }
    }
  });
  return Array.from(map.values());
}

export function getListingById(id) {
  const listings = getAllListings();
  return listings.find((item) => item.id === id) || null;
}

export function saveListing(listingData) {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memasang iklan.");
  }

  const activeSellerId = currentUser.id;
  const activeSellerName = currentUser.storeName || currentUser.name || 'Penjual';
  const activeSellerPhone = currentUser.phone || '081234567890';
  const activeSellerEmail = currentUser.email || '';
  const activeSellerAvatar = currentUser.avatar || '';
  const activeSellerRegion = currentUser.region || listingData.regionId || 'solo';

  const isBu = Boolean(listingData.is_bu || listingData.isBu);
  const buExpiresAt = isBu ? (listingData.bu_expires_at || null) : null;
  const buActivatedAt = isBu ? (listingData.bu_activated_at || new Date().toISOString()) : null;

  const newListing = {
    id: `barkas-${Date.now()}`,
    title: listingData.title.trim(),
    price: Number(listingData.price) || 0,
    category: listingData.category || 'lainnya',
    condition: listingData.condition || 'good',
    negoType: listingData.negoType || listingData.nego_type || 'nego_alus',
    nego_type: listingData.nego_type || listingData.negoType || 'nego_alus',
    // ✅ Baca dari kedua format agar tidak pernah null
    paymentMethod: listingData.paymentMethod || listingData.payment_method || 'cod',
    payment_method: listingData.payment_method || listingData.paymentMethod || 'cod',
    storeMapsUrl: listingData.storeMapsUrl || listingData.store_maps_url || '',
    store_maps_url: listingData.store_maps_url || listingData.storeMapsUrl || '',
    is_bu: isBu,
    isBu: isBu,
    bu_expires_at: buExpiresAt,
    qris_verified: Boolean(listingData.qris_verified || listingData.isQrisVerified || listingData.payment_status === 'verified'),
    regionId: listingData.regionId || listingData.region || activeSellerRegion,
    region: listingData.region || listingData.regionId || activeSellerRegion,
    district: listingData.district || currentUser.district || 'Banjarsari',
    // ✅ Baca dari kedua format cod_point / codPoint
    codPoint: listingData.codPoint || listingData.cod_point || ('COD di ' + (listingData.district || listingData.region || 'Solo Raya')),
    cod_point: listingData.cod_point || listingData.codPoint || ('COD di ' + (listingData.district || listingData.region || 'Solo Raya')),
    description: listingData.description ? listingData.description.trim() : '',
    images: listingData.images && listingData.images.length > 0 ? listingData.images : [],
    seller: {
      id: activeSellerId,
      name: activeSellerName,
      storeName: activeSellerName,
      phone: activeSellerPhone,
      email: activeSellerEmail,
      avatar: activeSellerAvatar,
      region: activeSellerRegion
    },
    createdAt: new Date().toISOString(),
    status: listingData.status || 'active',
    payment_amount: listingData.payment_amount,
    payment_status: listingData.payment_status || (isBu ? 'pending' : 'none')
  };

  // 1. Simpan ke in-memory listings (instant)
  const listings = getAllListings();
  listings.unshift(newListing);

  // Trigger BU Notification Broadcast if is_bu is active and paid/verified
  if (newListing.is_bu && newListing.payment_status !== 'pending') {
    if (typeof sbBroadcastBuNotification === 'function') {
      sbBroadcastBuNotification(newListing.id, newListing.category, {
        title: newListing.title,
        price: newListing.price,
        image: (newListing.images && newListing.images[0]) || ''
      }).catch((e) => console.warn('[BU Broadcast saveListing Error]', e));
    } else if (typeof window !== 'undefined' && typeof window.triggerBuNotification === 'function') {
      window.triggerBuNotification(newListing.id, newListing.category);
    }
  }

  // Otomatis catat kategori barang yang dipasang sebagai salah satu minat akun pembuat iklan
  if (activeSellerId && newListing.category) {
    try {
      if (typeof updateUserInterest === 'function') {
        updateUserInterest(activeSellerId, newListing.category);
      }
    } catch (e) {
      console.warn('[saveListing updateUserInterest error]', e);
    }
  }

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }
  safeBroadcastToCloud('LISTINGS_UPDATED', listings);

  // 2. Async sync ke Supabase (non-blocking)
  if (supabase) {
    (async () => {
      let finalImages = newListing.images;
      if (finalImages && Array.isArray(finalImages) && finalImages.some(img => typeof img === 'string' && img.startsWith('data:'))) {
        try {
          const uploadedUrls = await sbUploadMultipleImages(finalImages, '');
          if (uploadedUrls && uploadedUrls.length > 0) {
            finalImages = uploadedUrls;
            newListing.images = finalImages;
            const currentListings = getAllListings();
            const idx = currentListings.findIndex((item) => item.id === newListing.id);
            if (idx !== -1) {
              currentListings[idx].images = finalImages;
            }
          }
        } catch (e) {
          console.warn('[Supabase Storage] Listing image upload error:', e);
        }
      }

      const sbRow = {
        id: newListing.id,
        title: newListing.title,
        description: newListing.description,
        price: Number(newListing.price) || 0,
        category: newListing.category,
        condition: newListing.condition,
        nego_type: newListing.negoType || newListing.nego_type || 'nego_alus',
        payment_method: newListing.paymentMethod || newListing.payment_method || 'cod',
        region: newListing.regionId || newListing.region || activeSellerRegion,
        district: newListing.district || '',
        cod_point: newListing.codPoint || newListing.cod_point || '',
        store_maps_url: newListing.storeMapsUrl || newListing.store_maps_url || '',
        seller_id: activeSellerId,
        seller_name: activeSellerName,
        seller_phone: activeSellerPhone,
        seller_avatar: activeSellerAvatar,
        images: finalImages,
        status: newListing.status || 'active',
        is_bu: newListing.is_bu,
        bu_expires_at: newListing.bu_expires_at,
        qris_verified: newListing.qris_verified,
        views: Number(newListing.views) || 0,
        payment_amount: newListing.payment_amount,
        payment_status: newListing.payment_status,
        created_at: newListing.createdAt || new Date().toISOString(),
        updated_at: newListing.createdAt || new Date().toISOString()
      };
      console.log("Debug Payment Amount:", sbRow.payment_amount);

      supabase.from('listings').upsert([sbRow], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Supabase] saveListing sync error:', error.message);
          else console.log(`✅ [Supabase] Listing ${newListing.id} synced to DB directly with is_bu=${newListing.is_bu} and expires_at=${newListing.bu_expires_at}`);
        }).catch(() => {});
    })();
  }

  return newListing;
}

export function updateListing(id, updatedFields) {
  const targetId = String(id || '').trim();
  const listings = getAllListings();
  let index = listings.findIndex((item) => String(item.id).trim() === targetId);

  let updatedFieldsCopy = { ...updatedFields };
  if (updatedFieldsCopy.is_bu !== undefined || updatedFieldsCopy.isBu !== undefined) {
    const isBuVal = Boolean(updatedFieldsCopy.is_bu !== undefined ? updatedFieldsCopy.is_bu : updatedFieldsCopy.isBu);
    updatedFieldsCopy.is_bu = isBuVal;
    updatedFieldsCopy.isBu = isBuVal;
    updatedFieldsCopy.bu_expires_at = isBuVal ? (updatedFieldsCopy.bu_expires_at || null) : null;
    updatedFieldsCopy.bu_activated_at = isBuVal ? (updatedFieldsCopy.bu_activated_at || new Date().toISOString()) : null;
  }

  if (index === -1) {
    const newEntry = {
      id: targetId,
      ...updatedFieldsCopy,
      updatedAt: new Date().toISOString()
    };
    listings.unshift(newEntry);
    index = 0;
  } else {
    listings[index] = {
      ...listings[index],
      ...updatedFieldsCopy,
      updatedAt: new Date().toISOString()
    };
  }

  // Trigger BU Notification Broadcast if is_bu is active and paid/verified
  const updatedItem = listings[index];
  if (updatedItem.is_bu && updatedItem.payment_status !== 'pending') {
    if (typeof sbBroadcastBuNotification === 'function') {
      sbBroadcastBuNotification(updatedItem.id, updatedItem.category, {
        title: updatedItem.title,
        price: updatedItem.price,
        image: (updatedItem.images && updatedItem.images[0]) || ''
      }).catch((e) => console.warn('[BU Broadcast updateListing Error]', e));
    } else if (typeof window !== 'undefined' && typeof window.triggerBuNotification === 'function') {
      window.triggerBuNotification(updatedItem.id, updatedItem.category);
    }
  }

  // Otomatis catat kategori barang yang diperbarui sebagai salah satu minat akun pembuat iklan
  const activeSellerUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const currentSellerId = activeSellerUser?.id || updatedItem?.seller?.id || updatedItem?.seller_id;
  if (currentSellerId && updatedItem?.category) {
    try {
      if (typeof updateUserInterest === 'function') {
        updateUserInterest(currentSellerId, updatedItem.category);
      }
    } catch (e) {
      console.warn('[updateListing updateUserInterest error]', e);
    }
  }
  
  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }

  safeBroadcastToCloud('LISTINGS_UPDATED', listings);

  // Supabase sync
  if (supabase) {
    (async () => {
      if (updatedFieldsCopy.images && Array.isArray(updatedFieldsCopy.images) && updatedFieldsCopy.images.some(img => typeof img === 'string' && img.startsWith('data:'))) {
        try {
          const uploadedUrls = await sbUploadMultipleImages(updatedFieldsCopy.images, '');
          if (uploadedUrls && uploadedUrls.length > 0) {
            updatedFieldsCopy.images = uploadedUrls;
            const currentListings = getAllListings();
            const idx = currentListings.findIndex((item) => String(item.id).trim() === targetId);
            if (idx !== -1) {
              currentListings[idx].images = uploadedUrls;
            }
          }
        } catch (e) {
          console.warn('[Supabase Storage] Update image upload error:', e);
        }
      }

      // Sanitize payload agar kolom valid tabel listings (termasuk is_bu & bu_expires_at) dikirim ke Supabase
      const cleanUpdatePayload = {};
      if (updatedFieldsCopy.title !== undefined) cleanUpdatePayload.title = updatedFieldsCopy.title;
      if (updatedFieldsCopy.description !== undefined) cleanUpdatePayload.description = updatedFieldsCopy.description;
      if (updatedFieldsCopy.price !== undefined) cleanUpdatePayload.price = Number(updatedFieldsCopy.price) || 0;
      if (updatedFieldsCopy.category !== undefined) cleanUpdatePayload.category = updatedFieldsCopy.category;
      if (updatedFieldsCopy.condition !== undefined) cleanUpdatePayload.condition = updatedFieldsCopy.condition;
      if (updatedFieldsCopy.negoType !== undefined || updatedFieldsCopy.nego_type !== undefined) cleanUpdatePayload.nego_type = updatedFieldsCopy.negoType || updatedFieldsCopy.nego_type;
      if (updatedFieldsCopy.paymentMethod !== undefined || updatedFieldsCopy.payment_method !== undefined) cleanUpdatePayload.payment_method = updatedFieldsCopy.payment_method || updatedFieldsCopy.paymentMethod || 'cod';
      if (updatedFieldsCopy.regionId !== undefined || updatedFieldsCopy.region !== undefined) cleanUpdatePayload.region = updatedFieldsCopy.regionId || updatedFieldsCopy.region;
      if (updatedFieldsCopy.district !== undefined) cleanUpdatePayload.district = updatedFieldsCopy.district;
      if (updatedFieldsCopy.codPoint !== undefined || updatedFieldsCopy.cod_point !== undefined) cleanUpdatePayload.cod_point = updatedFieldsCopy.cod_point || updatedFieldsCopy.codPoint || '';
      if (updatedFieldsCopy.storeMapsUrl !== undefined || updatedFieldsCopy.store_maps_url !== undefined) cleanUpdatePayload.store_maps_url = updatedFieldsCopy.store_maps_url || updatedFieldsCopy.storeMapsUrl || '';
      if (updatedFieldsCopy.status !== undefined) cleanUpdatePayload.status = updatedFieldsCopy.status;
      if (updatedFieldsCopy.views !== undefined) cleanUpdatePayload.views = Number(updatedFieldsCopy.views) || 0;
      if (updatedFieldsCopy.images !== undefined) cleanUpdatePayload.images = updatedFieldsCopy.images;
      if (updatedFieldsCopy.is_bu !== undefined) cleanUpdatePayload.is_bu = updatedFieldsCopy.is_bu;
      if (updatedFieldsCopy.bu_expires_at !== undefined) cleanUpdatePayload.bu_expires_at = updatedFieldsCopy.bu_expires_at;
      if (updatedFieldsCopy.payment_amount !== undefined) cleanUpdatePayload.payment_amount = updatedFieldsCopy.payment_amount;
      if (updatedFieldsCopy.payment_status !== undefined) cleanUpdatePayload.payment_status = updatedFieldsCopy.payment_status;
      if (updatedFieldsCopy.qris_verified !== undefined || updatedFieldsCopy.isQrisVerified !== undefined) cleanUpdatePayload.qris_verified = Boolean(updatedFieldsCopy.qris_verified || updatedFieldsCopy.isQrisVerified);

      const activeUser = getCurrentUser();
      if (activeUser?.id) cleanUpdatePayload.seller_id = activeUser.id;
      if (activeUser?.storeName || activeUser?.name) cleanUpdatePayload.seller_name = activeUser.storeName || activeUser.name;
      if (activeUser?.phone) cleanUpdatePayload.seller_phone = activeUser.phone;
      if (activeUser?.avatar !== undefined) cleanUpdatePayload.seller_avatar = activeUser.avatar;
      cleanUpdatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('listings').update(cleanUpdatePayload).eq('id', targetId);
      if (error) {
        console.error('❌ [Supabase] updateListing error:', error.message);
      } else {
        console.log(`✅ [Supabase] updateListing sukses diperbarui untuk ID "${targetId}":`, cleanUpdatePayload.title || targetId, `(is_bu=${cleanUpdatePayload.is_bu})`);
      }
    })();
  }

  return listings[index];
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

  // Supabase sync
  if (supabase) {
    supabase.from('listings').delete().eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Supabase] deleteListing:', error.message); })
      .catch(() => {});
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

export function getMyListings(userOrId) {
  if (!userOrId) return [];
  const targetId = typeof userOrId === 'string' ? userOrId.trim() : (userOrId.id || '').trim();
  const targetPhone = typeof userOrId === 'object' ? (userOrId.phone || '').replace(/\D/g, '') : '';
  const targetEmail = typeof userOrId === 'object' ? (userOrId.email || '').toLowerCase().trim() : '';
  const targetName = typeof userOrId === 'object' ? (userOrId.storeName || userOrId.name || '').toLowerCase().trim() : '';

  const listings = getAllListings();
  return listings.filter((item) => {
    if (!item || item.status === 'deleted') return false;

    // 1. Cocokkan berdasarkan ID Penjual Langsung
    const sId = item.seller?.id || item.seller_id || item.user_id || item.userId;
    if (targetId && sId && String(sId).trim() === targetId) {
      return true;
    }

    // 2. Cocokkan ID Aliases (ridho / zamir shop)
    if (targetId && (targetId === 'user-ridho' || targetId === 'user-1787309560138')) {
      if (sId === 'user-ridho' || sId === 'user-1787309560138') return true;
    }

    // 3. Cocokkan berdasarkan Nomor WhatsApp
    const sPhone = (item.seller?.phone || item.seller_phone || '').replace(/\D/g, '');
    if (targetPhone && sPhone && (sPhone === targetPhone || sPhone.endsWith(targetPhone) || targetPhone.endsWith(sPhone))) {
      return true;
    }

    // 4. Cocokkan berdasarkan Email Penjual
    const sEmail = (item.seller?.email || item.seller_email || '').toLowerCase().trim();
    if (targetEmail && sEmail && sEmail === targetEmail) {
      return true;
    }

    // 5. Cocokkan berdasarkan Nama Toko / Penjual
    const sName = (item.seller?.storeName || item.seller?.name || item.seller_name || '').toLowerCase().trim();
    if (targetName && sName && (sName === targetName || targetName.includes(sName) || sName.includes(targetName))) {
      return true;
    }

    return false;
  });
}

// -------------------------------------------------------------
// FAVORITES & SELLER STATS
// Dipindahkan ke storageFavorites.js - re-export di bawah
// -------------------------------------------------------------
export {
  getFavoriteIds,
  toggleFavorite,
  isFavorite,
  getListingsBySellerId,
  getSellerStats
} from './storageFavorites.js';
