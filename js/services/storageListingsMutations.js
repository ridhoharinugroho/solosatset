import { getCurrentUser } from './auth.js';
import { supabase } from '../lib/supabase.js';
import { sbUploadMultipleImages, sbBroadcastBuNotification, updateUserInterest } from './supabaseDB.js';
import { getAllListings, safeBroadcastToCloud, realtimeChannel } from './storageListings.js';

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

  const listings = getAllListings();
  listings.unshift(newListing);

  if (newListing.is_bu && newListing.payment_status !== 'pending') {
    if (typeof sbBroadcastBuNotification === 'function') {
      sbBroadcastBuNotification(newListing.id, newListing.category, {
        title: newListing.title,
        price: newListing.price,
        image: (newListing.images && newListing.images[0]) || ''
      }).catch((e) => {});
    } else if (typeof window !== 'undefined' && typeof window.triggerBuNotification === 'function') {
      window.triggerBuNotification(newListing.id, newListing.category);
    }
  }

  if (activeSellerId && newListing.category) {
    try {
      if (typeof updateUserInterest === 'function') {
        updateUserInterest(activeSellerId, newListing.category);
      }
    } catch (e) {}
  }

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }
  safeBroadcastToCloud('LISTINGS_UPDATED', listings);

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
        } catch (e) {}
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

      supabase.from('listings').upsert([sbRow], { onConflict: 'id' }).catch(() => {});
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

  const updatedItem = listings[index];
  if (updatedItem.is_bu && updatedItem.payment_status !== 'pending') {
    if (typeof sbBroadcastBuNotification === 'function') {
      sbBroadcastBuNotification(updatedItem.id, updatedItem.category, {
        title: updatedItem.title,
        price: updatedItem.price,
        image: (updatedItem.images && updatedItem.images[0]) || ''
      }).catch((e) => {});
    } else if (typeof window !== 'undefined' && typeof window.triggerBuNotification === 'function') {
      window.triggerBuNotification(updatedItem.id, updatedItem.category);
    }
  }

  const activeSellerUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const currentSellerId = activeSellerUser?.id || updatedItem?.seller?.id || updatedItem?.seller_id;
  if (currentSellerId && updatedItem?.category) {
    try {
      if (typeof updateUserInterest === 'function') {
        updateUserInterest(currentSellerId, updatedItem.category);
      }
    } catch (e) {}
  }

  window.dispatchEvent(new CustomEvent('listingsChanged', { detail: listings }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'LISTINGS_UPDATED', payload: listings });
  }

  safeBroadcastToCloud('LISTINGS_UPDATED', listings);

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
        } catch (e) {}
      }

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
      if (updatedFieldsCopy.storeMapsUrl !== undefined || updatedFieldsCopy.store_maps_url !== undefined) cleanUpdatePayload.store_maps_url = updatedFieldsCopy.store_maps_url || updatedFieldsUrl.storeMapsUrl || '';
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

      supabase.from('listings').update(cleanUpdatePayload).eq('id', targetId).catch(() => {});
    })();
  }

  return listings[index];
}
