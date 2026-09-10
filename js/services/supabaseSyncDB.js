/**
 * Supabase Sync DB Module - Site Settings, Custom Texts & Reviews
 */
import { supabase } from '../lib/supabase.js';

function requireClient(fnName) {
  if (!supabase) {
    console.warn(`[SupabaseSyncDB] ${fnName}() dilewati - client belum terkonfigurasi.`);
    return false;
  }
  return true;
}

export async function sbGetSiteSettings() {
  if (!requireClient('sbGetSiteSettings')) return null;
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'global')
    .single();
  if (error) { console.error('[SupabaseDB] getSiteSettings:', error.message); return null; }
  return data?.settings || null;
}

/** Simpan/update site settings */
export async function sbSaveSiteSettings(settings) {
  if (!requireClient('sbSaveSiteSettings')) return false;
  const payload = {
    id: 'global',
    settings: { ...settings, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from('site_settings')
    .upsert([payload], { onConflict: 'id' });
  if (error) { console.error('[SupabaseDB] saveSiteSettings:', error.message); return false; }
  return true;
}

// ============================================================
// CUSTOM TEXTS - Teks Branding
// ============================================================

/** Ambil custom texts */
export async function sbGetCustomTexts() {
  if (!requireClient('sbGetCustomTexts')) return null;
  const { data, error } = await supabase
    .from('custom_texts')
    .select('*')
    .eq('id', 'global')
    .single();
  if (error) { console.error('[SupabaseDB] getCustomTexts:', error.message); return null; }
  return data?.texts || null;
}

/** Simpan/update custom texts */
export async function sbSaveCustomTexts(texts) {
  if (!requireClient('sbSaveCustomTexts')) return false;
  const payload = {
    id: 'global',
    texts: { ...texts, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from('custom_texts')
    .upsert([payload], { onConflict: 'id' });
  if (error) { console.error('[SupabaseDB] saveCustomTexts:', error.message); return false; }
  return true;
}

// ============================================================
// SELLER REVIEWS - Ulasan Penjual
// ============================================================

/** Ambil ulasan berdasarkan seller ID */
export async function sbGetSellerReviews(sellerId) {
  if (!requireClient('sbGetSellerReviews')) return null;
  const { data, error } = await supabase
    .from('seller_reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('[SupabaseDB] getSellerReviews:', error.message); return null; }
  return data;
}

/** Tambahkan ulasan baru */
export async function sbAddSellerReview(review) {
  if (!requireClient('sbAddSellerReview')) return null;
  console.log('[SupabaseDB] Mengirim payload ulasan ke tabel seller_reviews Supabase:', review);
  try {
    const { data, error } = await supabase
      .from('seller_reviews')
      .insert([review])
      .select()
      .single();
    if (error) {
      console.error('[SupabaseDB Error] Gagal menyimpan ulasan ke tabel seller_reviews:', error.message || error, error);
      return null;
    }
    console.log('[SupabaseDB Success] Ulasan berhasil disimpan ke Supabase:', data);
    return data;
  } catch (err) {
    console.error('[SupabaseDB Exception] Kendala koneksi/eksekusi saat insert ulasan ke Supabase:', err);
    return null;
  }
}

/** Hapus ulasan */
export async function sbDeleteSellerReview(reviewId) {
  if (!requireClient('sbDeleteSellerReview')) return false;
  const { error } = await supabase.from('seller_reviews').delete().eq('id', reviewId);
  if (error) { console.error('[SupabaseDB] deleteSellerReview:', error.message); return false; }
  return true;
}

// ============================================================
// APP REVIEWS (ULASAN APLIKASI / KOMUNITAS)
// ============================================================

/** Ambil seluruh ulasan aplikasi dari Supabase */
export async function sbGetAppReviews() {
  if (!requireClient('sbGetAppReviews')) return null;
  try {
    const { data, error } = await supabase
      .from('app_reviews')
      .select('id, user_id, user_name, user_location, rating, category, review_text, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[SupabaseDB] getAppReviews notice:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

/** Tambahkan ulasan aplikasi baru ke tabel app_reviews */
export async function sbAddAppReview(review) {
  if (!requireClient('sbAddAppReview')) return null;
  console.log('[SupabaseDB] Mengirim ulasan aplikasi ke tabel app_reviews Supabase:', review);
  try {
    const { data, error } = await supabase
      .from('app_reviews')
      .insert([review])
      .select()
      .single();
    if (error) {
      console.error('[SupabaseDB Error] Gagal insert ke tabel app_reviews:', error.message || error, error);
      return null;
    }
    console.log('[SupabaseDB Success] Ulasan aplikasi berhasil disimpan:', data);
    return data;
  } catch (err) {
    console.error('[SupabaseDB Exception] Kendala koneksi saat insert ke app_reviews:', err);
    return null;
  }
}

/** Hapus ulasan aplikasi */
export async function sbDeleteAppReview(reviewId) {
  if (!requireClient('sbDeleteAppReview')) return false;
  try {
    const { error } = await supabase.from('app_reviews').delete().eq('id', reviewId);
    if (error) { console.error('[SupabaseDB] deleteAppReview error:', error.message); return false; }
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================
// REALTIME SUBSCRIPTIONS - Live Data Sync
// ============================================================

/**
 * Subscribe ke perubahan listings secara realtime
 * @param {function} onInsert - Callback saat listing baru ditambah
 * @param {function} onUpdate - Callback saat listing diupdate
 * @param {function} onDelete - Callback saat listing dihapus
 * @returns {object} channel - Panggil .unsubscribe() untuk berhenti
 */
export function sbSubscribeSettings(onChange) {
  if (!requireClient('sbSubscribeSettings')) return null;
  const channel = supabase
    .channel('realtime-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings', filter: 'id=eq.global' }, (payload) => {
      if (onChange && payload.new?.settings) onChange(payload.new.settings);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_texts', filter: 'id=eq.global' }, (payload) => {
      // Gunakan event 'siteTextsChanged' agar storage.js bisa menangkapnya
      if (payload.new?.texts) {
        window.dispatchEvent(new CustomEvent('siteTextsChanged', { detail: payload.new.texts }));
      }
    })
    .subscribe((status) => {
      console.log('[Supabase Realtime] settings channel:', status);
    });
  return channel;
}

// ============================================================
// USER INTERESTS - Tracking Minat Pengguna & Rekomendasi (users.interests)
// ============================================================

/**
 * Helper untuk memperbarui array interests pada tabel users setiap kali pengguna berinteraksi dengan kategori barang
 * Menyimpan maksimal 3 kategori teratas dengan mekanisme shift/push
 * @param {string} userId - ID Pengguna (atau Email)
 * @param {string} newCategory - Kategori baru yang diakses
 */