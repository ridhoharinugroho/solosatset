/**
 * Storage Reviews Module - Seller Reviews & App Reviews Engine
 */

import { getCurrentUser, getUserByReviewAuthor } from './auth.js';
import { supabase } from '../lib/supabase.js';
import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';
import { getMyListings, getPublicListings } from './storageListings.js';

export const DEFAULT_REVIEWS = [
  {
    id: "rev-001",
    sellerId: "user-1787309560138",
    buyerId: "buyer-01",
    buyerName: "Bagus Setiawan (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Barang sangat sesuai deskripsi, sepeda lipat mulus dan bonus helm masih bagus. COD di Manahan fast response & ramah!",
    createdAt: "2026-08-18T14:30:00Z"
  },
  {
    id: "rev-002",
    sellerId: "user-1787309560138",
    buyerId: "buyer-02",
    buyerName: "Dewi Anggraini (Solo Baru)",
    buyerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Penjual terpercaya se-Solo. Komunikasi lewat WhatsApp sangat cepat dan ramah.",
    createdAt: "2026-08-19T09:15:00Z"
  },
  {
    id: "rev-003",
    sellerId: "user-1787309560138",
    buyerId: "buyer-03",
    buyerName: "Agus Triyanto (Banjarsari)",
    buyerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Smart TV LG gambar bening banget, dicoba di lokasi lancar jaya. Zamir Shop top!",
    createdAt: "2026-08-17T11:00:00Z"
  },
  {
    id: "rev-004",
    sellerId: "user-1787309560138",
    buyerId: "buyer-04",
    buyerName: "Fajar Nugraha (Kartasura)",
    buyerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Kamera Sony A6000 shutter count rendah sesuai janji. Recommended seller Solo!",
    createdAt: "2026-08-16T16:45:00Z"
  },
  {
    id: "rev-005",
    sellerId: "user-1787309560138",
    buyerId: "buyer-05",
    buyerName: "Rudi Hartono (Laweyan)",
    buyerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Sofa L-Shape sudah sampai rumah, busa tebal dan kain bersih. Transaksi amanah.",
    createdAt: "2026-08-15T10:20:00Z"
  },
  {
    id: "rev-006",
    sellerId: "user-1787309560138",
    buyerId: "buyer-06",
    buyerName: "Hendra Wijaya (Jebres)",
    buyerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Kulkas Polytron dingin pol! Terima kasih mas Ridho dibantu angkut ke mobil.",
    createdAt: "2026-08-14T13:10:00Z"
  },
  {
    id: "rev-007",
    sellerId: "user-1787309560138",
    buyerId: "buyer-07",
    buyerName: "Siti Rahayu (Pasar Kliwon)",
    buyerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Helm KYT TTC wangi dan mulus seperti baru. Packing rapi, penjual ramah pol.",
    createdAt: "2026-08-13T17:40:00Z"
  },
  {
    id: "rev-008",
    sellerId: "user-1787309560138",
    buyerId: "buyer-08",
    buyerName: "Budi Santoso (Serengan)",
    buyerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Drone DJI Mini 2 normal pol, terbang stabil 4K jernih. Mantap banget pelayanannya!",
    createdAt: "2026-08-12T15:00:00Z"
  },
  {
    id: "rev-009",
    sellerId: "user-1787309560138",
    buyerId: "buyer-09",
    buyerName: "Eko Prasetyo (Palur)",
    buyerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1507457379470-08b800bebc67?auto=format&fit=crop&w=400&q=80",
    rating: 4,
    comment: "PS4 Slim lancar jaya buat main bareng anak-anak. Respon WA cepat dan sopan.",
    createdAt: "2026-08-11T12:30:00Z"
  },
  {
    id: "rev-010",
    sellerId: "user-1787309560138",
    buyerId: "buyer-10",
    buyerName: "Wahyu Saputra (Colomadu)",
    buyerAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Jaket kulit Garut tebal dan asli kulit domba. Harga nego bersahabat. Matur nuwun mas!",
    createdAt: "2026-08-10T18:00:00Z"
  },
  {
    id: "rev-011",
    sellerId: "user-1787309560138",
    buyerId: "buyer-11",
    buyerName: "Bayu Anggoro (Kartasura)",
    buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Gitar Yamaha F310 action ceper no fret buzz, suara renyah. Sukses terus Zamir Shop!",
    createdAt: "2026-08-09T08:45:00Z"
  },
  {
    id: "rev-012",
    sellerId: "user-1787309560138",
    buyerId: "buyer-12",
    buyerName: "Indra Permana (Gilingan)",
    buyerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Toko paling recommended di Karanganyar & Solo. Barang berkualitas dan no tipu-tipu.",
    createdAt: "2026-08-08T19:15:00Z"
  },
  {
    id: "rev-013",
    sellerId: "user-1787309560138",
    buyerId: "buyer-13",
    buyerName: "Dimas Arianto (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Pelayanan sangat memuaskan, fast response WA dan jujur apa adanya terkait kondisi barang.",
    createdAt: "2026-08-07T14:10:00Z"
  },
  {
    id: "rev-014",
    sellerId: "user-1787309560138",
    buyerId: "buyer-14",
    buyerName: "Rina Kusuma (Mojosongo)",
    buyerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "COD aman di Shelter Manahan, transaksi santai sambil ngobrol. Mantap toko lokal Solo!",
    createdAt: "2026-08-06T11:25:00Z"
  },
  {
    id: "rev-015",
    sellerId: "user-1787309560138",
    buyerId: "buyer-15",
    buyerName: "Galih Pratama (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    rating: 4,
    comment: "Barang bagus, kondisi fisik 90% sesuai foto. Nego harga juga gampang.",
    createdAt: "2026-08-05T16:00:00Z"
  },
  {
    id: "rev-016",
    sellerId: "user-1787309560138",
    buyerId: "buyer-16",
    buyerName: "Lukman Hakim (Kerten)",
    buyerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Sudah langganan beli barang hobi disini. Selalu puas dengan kualitasnya.",
    createdAt: "2026-08-04T10:40:00Z"
  },
  {
    id: "rev-017",
    sellerId: "user-1787309560138",
    buyerId: "buyer-17",
    buyerName: "Ahmad Fauzi (Kadipiro)",
    buyerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Penjual ramah dan tepat waktu saat COD di Kota Barat. Sukses terus lapaknya!",
    createdAt: "2026-08-03T15:50:00Z"
  },
  {
    id: "rev-018",
    sellerId: "user-1787309560138",
    buyerId: "buyer-18",
    buyerName: "Bambang Irawan (Solo Baru)",
    buyerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Barang elektronik dites bareng-bareng sampai tuntas. Sangat transparan dan profesional.",
    createdAt: "2026-08-02T13:20:00Z"
  },
  {
    id: "rev-019",
    sellerId: "user-1787309560138",
    buyerId: "buyer-19",
    buyerName: "Tri Wibowo (Banjarsari)",
    buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Harga barang paling masuk akal di Solo. Kualitas terjamin!",
    createdAt: "2026-08-01T09:10:00Z"
  },
  {
    id: "rev-020",
    sellerId: "user-1787309560138",
    buyerId: "buyer-20",
    buyerName: "Surya Kencana (Manahan)",
    buyerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1507457379470-08b800bebc67?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Layanan cepat dan ramah, barang sesuai ekspektasi. Terima kasih mas Ridho!",
    createdAt: "2026-07-30T17:30:00Z"
  },
  {
    id: "rev-021",
    sellerId: "user-1787309560138",
    buyerId: "buyer-21",
    buyerName: "Wahid Hasyim (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Penjual sangat amanah. Barang sesuai janji, no minus tersembunyi.",
    createdAt: "2026-07-28T11:15:00Z"
  },
  {
    id: "rev-022",
    sellerId: "user-1787309560138",
    buyerId: "buyer-22",
    buyerName: "Nur Hidayat (Solo)",
    buyerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Pusat Jual Beli Solo Raya memang mantap, nemu toko Zamir Shop yang terpercaya.",
    createdAt: "2026-07-25T14:00:00Z"
  },
  {
    id: "rev-023",
    sellerId: "user-102",
    buyerId: "buyer-23",
    buyerName: "Agus Triyanto (Palur)",
    buyerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Mesin cuci sudah dites di tempat lancar jaya. Pak Joko ramah dan ngasih tips perawatan. Mantap Toko Lokal Karanganyar!",
    createdAt: "2026-08-17T11:00:00Z"
  },
  {
    id: "rev-024",
    sellerId: "user-103",
    buyerId: "buyer-24",
    buyerName: "Fajar Nugraha (Kartasura)",
    buyerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    productImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "HP iPhone & gadget kondisi oke banget, batre awet dan garansi personal jelas. Recommended seller Kartasura!",
    createdAt: "2026-08-20T16:45:00Z"
  }
];

// Native Browser BroadcastChannel for 0ms Instant Real-Time Cross-Tab Synchronization
const realtimeChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('pusat_barkas_realtime_v2')
  : null;


export function getAllReviews() {
  const raw = window.__reviews;
  if (!raw || !raw.length) {
    window.__reviews = [...DEFAULT_REVIEWS];
    return window.__reviews;
  }
  return raw;
}

export function getSellerReviews(sellerId, includeHidden = false) {
  if (!sellerId) return [];
  const all = getAllReviews();
  return all
    .filter((r) => r.sellerId === sellerId && (includeHidden || !r.isHidden))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function toggleHideSellerReview(reviewId) {
  if (sessionStorage.getItem('pusat_barkas_admin_auth') !== 'true') {
    throw new Error("Akses ditolak: Hanya admin yang berwenang untuk menyembunyikan ulasan toko.");
  }
  const all = getAllReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  all[idx].isHidden = !all[idx].isHidden;
  window.__reviews = all;

  const updatedReview = all[idx];
  window.dispatchEvent(new CustomEvent('sellerReviewsChanged', { detail: { sellerId: updatedReview.sellerId, review: updatedReview } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'REVIEW_UPDATED', payload: { sellerId: updatedReview.sellerId, review: updatedReview } });
  }
  return updatedReview;
}

export async function deleteSellerReview(reviewId) {
  if (sessionStorage.getItem('pusat_barkas_admin_auth') !== 'true') {
    throw new Error("Akses ditolak: Hanya admin yang berwenang untuk menghapus ulasan toko.");
  }
  const all = getAllReviews();
  const idx = all.findIndex((r) => r.id === reviewId);
  if (idx === -1) return false;

  const targetSellerId = all[idx].sellerId;

  if (supabase) {
    try {
      await supabase.from('seller_reviews').delete().eq('id', reviewId);
    } catch (e) {}
  }

  all.splice(idx, 1);
  window.__reviews = all;

  window.dispatchEvent(new CustomEvent('sellerReviewsChanged', { detail: { sellerId: targetSellerId, deletedReviewId: reviewId } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'REVIEW_DELETED', payload: { sellerId: targetSellerId, reviewId } });
  }
  return true;
}

export function addSellerReview({ sellerId, rating, comment, productImage }) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan ulasan toko.");
  }

  if (currentUser.id === sellerId) {
    throw new Error("Anda tidak dapat memberikan ulasan untuk toko Anda sendiri.");
  }

  // Validasi wajib foto produk yang dibeli: Ulasan tanpa foto produk akan ditolak sistem
  if (!productImage || productImage.trim() === '') {
    throw new Error("Ulasan ditolak sistem: Anda wajib melampirkan foto produk/barang yang dibeli sebagai bukti ulasan terverifikasi.");
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new Error("Rating harus bernilai 1 hingga 5 bintang.");
  }

  const cleanComment = (comment || '').trim();
  if (!cleanComment) {
    throw new Error("Tuliskan ulasan atau pengalaman transaksi Anda.");
  }

  const all = getAllReviews();
  const districtName = currentUser.district ? formatDistrictTitle(currentUser.district) : '';
  const regionName = currentUser.region ? formatRegionTitle(currentUser.region) : 'Solo Raya';
  const locationTag = districtName || regionName;
  const buyerDisplayName = currentUser.storeName || currentUser.name || 'Pengguna';

  const newReview = {
    id: `rev-${Date.now()}`,
    sellerId,
    buyerId: currentUser.id,
    buyerName: `${buyerDisplayName} (${locationTag})`,
    buyerAvatar: currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productImage: productImage,
    rating: numRating,
    comment: cleanComment,
    createdAt: new Date().toISOString()
  };

  all.unshift(newReview);
  window.__reviews = all;

  window.dispatchEvent(new CustomEvent('sellerReviewsChanged', { detail: { sellerId, review: newReview } }));
  if (realtimeChannel) {
    realtimeChannel.postMessage({ type: 'REVIEW_ADDED', payload: { sellerId, review: newReview } });
  }

  // Supabase sync
  if (supabase) {
    const sbReviewPayload = {
      id: newReview.id,
      seller_id: newReview.sellerId,
      buyer_id: newReview.buyerId,
      buyer_name: newReview.buyerName,
      buyer_avatar: newReview.buyerAvatar,
      product_image: newReview.productImage,
      rating: newReview.rating,
      comment: newReview.comment,
      created_at: newReview.createdAt
    };

    console.log('[Supabase Review Sync] Mengirim payload data ulasan ke database Supabase:', sbReviewPayload);

    supabase.from('seller_reviews').insert([sbReviewPayload]).then(({ data, error }) => {
      if (error) {
        console.error('[Supabase Error] Gagal menyimpan ulasan ke tabel seller_reviews Supabase:', error.message || error, error);
      } else {
        console.log('[Supabase Success] Ulasan berhasil disimpan ke tabel seller_reviews Supabase:', data || sbReviewPayload.id);
      }
    }).catch((err) => {
      console.error('[Supabase Exception] Kendala koneksi/eksekusi saat insert ulasan ke Supabase:', err);
    });
  }

  return newReview;
}

export function getSellerRatingStats(sellerId) {
  // Hanya hitung ulasan yang tidak disembunyikan
  const reviews = getSellerReviews(sellerId, false);
  if (reviews.length === 0) {
    return {
      averageRating: 0.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const totalReviews = reviews.length;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    sum += r.rating;
  });

  const averageRating = Number((sum / totalReviews).toFixed(1));

  return {
    averageRating,
    totalReviews,
    ratingCounts
  };
}

// -------------------------------------------------------------
// 5 STRICT CRITERIA FOR SELLER VERIFICATION BADGE
// -------------------------------------------------------------
/**
 * Logika Sistem Syarat Badge 'Terverifikasi / Toko Lokal':
 * 1. Minimal 20 ulasan positif (rating >= 4).
 * 2. Rating rata-rata minimal 4.5.
 * 3. Telah memposting minimal 10 barang jualan.
 * 4. Profil lengkap (Foto Avatar, Lokasi Kab/Kec, dan No. WA).
 * 5. Usia akun minimal 30 hari.
 */
export function checkSellerVerification(sellerUserOrId) {
  const user = typeof sellerUserOrId === 'string' ? getUserById(sellerUserOrId) : sellerUserOrId;
  if (!user) {
    return {
      isVerified: false,
      seller: null,
      passedCount: 0,
      totalCriteria: 5,
      criteria: {
        reviewsPositive: { passed: false, current: 0, required: 20 },
        averageRating: { passed: false, current: 0, required: 4.5 },
        totalListings: { passed: false, current: 0, required: 10 },
        profileComplete: { passed: false, missing: ['Foto Avatar', 'Lokasi', 'No. WhatsApp'] },
        accountAgeDays: { passed: false, current: 0, required: 30 }
      }
    };
  }

  const sellerId = user.id;
  const listings = getListingsBySellerId(sellerId);
  const reviews = getSellerReviews(sellerId);
  const ratingStats = getSellerRatingStats(sellerId);

  // 1. Sudah memiliki minimal 20 ulasan positif (rating >= 4)
  const positiveReviewsCount = reviews.filter((r) => r.rating >= 4).length;
  const reviewsPassed = positiveReviewsCount >= 20;

  // 2. Memiliki rating rata-rata minimal 4.5
  const avgRating = ratingStats.totalReviews > 0 ? ratingStats.averageRating : 0;
  const ratingPassed = ratingStats.totalReviews > 0 && avgRating >= 4.5;

  // 3. Telah memposting minimal 10 barang jualan
  const totalListingsCount = listings.length;
  const listingsPassed = totalListingsCount >= 10;

  // 4. Profil (Foto, Lokasi, dan No. WA) sudah lengkap
  const hasAvatar = Boolean(user.avatar && user.avatar.trim() !== '');
  const hasLocation = Boolean(user.region && user.region.trim() !== '' && user.district && user.district.trim() !== '');
  const hasPhone = Boolean(user.phone && user.phone.replace(/\D/g, '').length >= 8);
  
  const missingFields = [];
  if (!hasAvatar) missingFields.push('Foto Avatar');
  if (!hasLocation) missingFields.push('Lokasi (Kabupaten & Kecamatan)');
  if (!hasPhone) missingFields.push('No. WhatsApp Aktif');
  const profilePassed = missingFields.length === 0;

  // 5. Akun telah berusia minimal 30 hari
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  const now = new Date();
  const diffTime = Math.max(0, now - createdAt);
  const accountAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const agePassed = accountAgeDays >= 30;

  const passedList = [reviewsPassed, ratingPassed, listingsPassed, profilePassed, agePassed];
  const passedCount = passedList.filter(Boolean).length;
  const isVerified = reviewsPassed && ratingPassed && listingsPassed && profilePassed && agePassed;

  return {
    isVerified,
    seller: user,
    passedCount,
    totalCriteria: 5,
    criteria: {
      reviewsPositive: { passed: reviewsPassed, current: positiveReviewsCount, required: 20 },
      averageRating: { passed: ratingPassed, current: avgRating, required: 4.5 },
      totalListings: { passed: listingsPassed, current: totalListingsCount, required: 10 },
      profileComplete: { passed: profilePassed, missing: missingFields },
      accountAgeDays: { passed: agePassed, current: accountAgeDays, required: 30 }
    }
  };
}

export function isSellerVerified(sellerUserOrId) {
  const result = checkSellerVerification(sellerUserOrId);
  return result.isVerified;
}

// -------------------------------------------------------------
// APP & DEVELOPER REVIEWS & COMMUNITY FEEDBACK
// Dipindahkan ke storageAppReviews.js - re-export di bawah
// -------------------------------------------------------------

export {
  STORAGE_KEY_APP_REVIEWS,
  DEFAULT_APP_REVIEWS,
  fetchAppReviewsFromSupabase,
  getAppReviews,
  addAppReview,
  deleteAppReview,
  updateAppReview,
  toggleHideAppReview,
  getAppRatingStats
} from './storageAppReviews.js';
