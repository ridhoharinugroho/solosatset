import { getAllListings } from './storageListings.js';
import { supabase } from '../lib/supabase.js';

export function getMyListings(userOrId) {
  if (!userOrId) return [];
  const targetId = typeof userOrId === 'string' ? userOrId.trim() : (userOrId.id || '').trim();
  const targetPhone = typeof userOrId === 'object' ? (userOrId.phone || '').replace(/\D/g, '') : '';
  const targetEmail = typeof userOrId === 'object' ? (userOrId.email || '').toLowerCase().trim() : '';
  const targetName = typeof userOrId === 'object' ? (userOrId.storeName || userOrId.name || '').toLowerCase().trim() : '';

  const listings = getAllListings();
  return listings.filter((item) => {
    if (!item || item.status === 'deleted') return false;

    const sId = item.seller?.id || item.seller_id || item.user_id || item.userId;
    if (targetId && sId && String(sId).trim() === targetId) {
      return true;
    }

    if (targetId && (targetId === 'user-ridho' || targetId === 'user-1787309560138')) {
      if (sId === 'user-ridho' || sId === 'user-1787309560138') return true;
    }

    const sPhone = (item.seller?.phone || item.seller_phone || '').replace(/\D/g, '');
    if (targetPhone && sPhone && (sPhone === targetPhone || sPhone.endsWith(targetPhone) || targetPhone.endsWith(sPhone))) {
      return true;
    }

    const sEmail = (item.seller?.email || item.seller_email || '').toLowerCase().trim();
    if (targetEmail && sEmail && sEmail === targetEmail) {
      return true;
    }

    const sName = (item.seller?.storeName || item.seller?.name || item.seller_name || '').toLowerCase().trim();
    if (targetName && sName && (sName === targetName || targetName.includes(sName) || sName.includes(targetName))) {
      return true;
    }

    return false;
  });
}

export function isSellerVerified(sellerOrId) {
  if (!sellerOrId) return false;
  if (typeof sellerOrId === 'object') {
    if (sellerOrId.isVerified || sellerOrId.is_verified || sellerOrId.badge_verified) return true;
    if (sellerOrId.qris_verified || sellerOrId.isQrisVerified) return true;
  }
  const sellerId = typeof sellerOrId === 'string' ? sellerOrId : (sellerOrId.id || sellerOrId.seller_id);
  if (!sellerId) return false;
  const listings = getAllListings();
  return listings.some(l => {
    const sId = l.seller?.id || l.seller_id;
    return sId === sellerId && (l.qris_verified || l.isQrisVerified);
  });
}
