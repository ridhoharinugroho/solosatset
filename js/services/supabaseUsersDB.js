/**
 * Supabase Users DB Module - User Profiles & Interest Tracking
 */
import { supabase } from '../lib/supabase.js';

function requireClient(fnName) {
  if (!supabase) {
    console.warn(`[SupabaseUsersDB] ${fnName}() dilewati - client belum terkonfigurasi.`);
    return false;
  }
  return true;
}

export async function sbGetAllUsers() {
  if (!requireClient('sbGetAllUsers')) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) { console.error('[SupabaseDB] getAllUsers:', error.message); return null; }
  return data;
}

/** Ambil satu user berdasarkan ID */
export async function sbGetUserById(id) {
  if (!requireClient('sbGetUserById')) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('[SupabaseDB] getUserById:', error.message); return null; }
  return data;
}

/** Simpan user baru (registrasi) */
export async function sbRegisterUser(user) {
  if (!requireClient('sbRegisterUser')) return null;
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();
  if (error) { console.error('[SupabaseDB] registerUser:', error.message); return null; }
  return data;
}

/** Update profil user berdasarkan ID atau Email */
export async function sbUpdateUser(idOrEmail, updates) {
  if (!requireClient('sbUpdateUser')) return null;
  const isEmail = typeof idOrEmail === 'string' && idOrEmail.trim() !== '' && idOrEmail.includes('@');
  let query = supabase.from('users').update(updates);
  if (isEmail) {
    query = query.eq('email', idOrEmail.toLowerCase().trim());
  } else if (idOrEmail) {
    query = query.eq('id', idOrEmail);
  } else {
    console.warn('[sbUpdateUser] Skipping query: idOrEmail is empty');
    return null;
  }
  const { data, error } = await query.select().maybeSingle();
  if (error) { console.error('[SupabaseDB] updateUser:', error.message); return null; }
  return data;
}

// ============================================================
// SITE SETTINGS - Pengaturan Tampilan Admin
// ============================================================

export async function updateUserInterest(userId, newCategory) {
  if (!requireClient('updateUserInterest')) return;
  if (!userId || !newCategory || newCategory === 'all') return;

  const cleanCategory = String(newCategory).toLowerCase().trim();

  try {
    // 1. Ambil data baris user saat ini dari Supabase (berdasarkan id atau email)
    let userRow = null;
    let queryField = 'id';

    const { data: userById, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, interests')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[updateUserInterest] Error select user by id:', fetchErr.message);
    }

    if (userById) {
      userRow = userById;
      queryField = 'id';
    } else if (typeof userId === 'string' && userId.includes('@')) {
      const { data: userByEmail, error: emailErr } = await supabase
        .from('users')
        .select('id, email, interests')
        .eq('email', userId.toLowerCase().trim())
        .maybeSingle();

      if (emailErr) console.warn('[updateUserInterest] Error select user by email:', emailErr.message);
      if (userByEmail) {
        userRow = userByEmail;
        queryField = 'email';
      }
    }

    let currentInterests = Array.isArray(userRow?.interests) ? [...userRow.interests] : [];

    // 2. Hapus jika kategori sudah ada (untuk di-push ke posisi paling baru)
    currentInterests = currentInterests.filter(cat => String(cat).toLowerCase().trim() !== cleanCategory);

    // 3. Masukkan kategori baru ke posisi paling belakang (terbaru)
    currentInterests.push(cleanCategory);

    // 4. Batasi maksimal 3 item (geser yang paling lama jika lebih dari 3)
    while (currentInterests.length > 3) {
      currentInterests.shift();
    }

    // 5. Simpan kembali ke database dengan update yang bersih
    if (userRow && userRow[queryField]) {
      const { error: updErr } = await supabase
        .from('users')
        .update({ interests: currentInterests })
        .eq(queryField, userRow[queryField]);

      if (updErr) {
        console.error('❌ [updateUserInterest] Gagal update kolom interests:', updErr.message);
      } else {
        console.log(`✅ [updateUserInterest] Sukses update interests user "${userRow.id}":`, currentInterests);
      }
    }

    // 6. Sinkronkan juga ke currentUser di auth session jika user sedang login
    if (typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('pusat_barkas_current_user') || 'null');
        if (storedUser && (storedUser.id === userId || storedUser.email === userId || (userRow && storedUser.id === userRow.id))) {
          storedUser.interests = currentInterests;
          localStorage.setItem('pusat_barkas_current_user', JSON.stringify(storedUser));
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('❌ [updateUserInterest Exception]', err);
  }
}

/**
 * Alias pembaruan minat untuk kompatibilitas ke updateUserInterest
 */
export async function sbTrackUserInterest(userId, categoryId) {
  await updateUserInterest(userId, categoryId);
  return { success: true };
}

/**
 * Ambil daftar minat kategori pengguna dari kolom array interests tabel users
 * @param {string} userId - UUID atau identifier pengguna
 * @returns {Promise<Array>}
 */
export async function sbGetUserInterests(userId) {
  if (!requireClient('sbGetUserInterests')) return [];
  if (!userId) return [];
  try {
    let query = supabase.from('users').select('interests');
    if (typeof userId === 'string' && userId.includes('@')) {
      query = query.eq('email', userId.toLowerCase().trim());
    } else {
      query = query.eq('id', userId);
    }
    const { data: user, error } = await query.maybeSingle();

    if (error) {
      console.warn('[SupabaseDB] getUserInterests error:', error.message);
      return [];
    }
    return Array.isArray(user?.interests) ? user.interests : [];
  } catch (e) {
    console.warn('[SupabaseDB] getUserInterests exception:', e.message);
    return [];
  }
}

// ============================================================
// NOTIFICATIONS - Broadcast Tertarget Fitur BU Berdasarkan Array interests
// ============================================================

/**
 * Kirim notifikasi BU tertarget HANYA ke pengguna yang memiliki minat (category_id yang cocok)
 * di kolom array interests tabel users
 * @param {string} productId - ID produk BU
 * @param {string} categoryId - Kategori produk
 * @param {object} [productDetails] - Metadata produk (title, price, image, etc.)
 * @returns {Promise<{success: boolean, userCount: number, error?: string, message?: string}>}
 */