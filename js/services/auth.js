/**
 * Service Autentikasi Pengguna & Penjual Pusat Jual Beli Solo Raya
 * Login & Registrasi dengan No. WA / Email / Nama Toko + Password
 * Reset Password via Email & Penyimpanan Sesi Persisten
 * Murni sinkronisasi dengan tabel 'users' Supabase (kolom name & store_name)
 */

import { broadcastToCloud } from './cloudSync.js';
import { sendWelcomeRegistrationEmail, sendPasswordResetEmail } from './emailService.js';
import { supabase } from '../lib/supabase.js';
import { sbUploadAvatar, sbUpdateUserAvatar, sbDeleteAvatar, extractAvatarFilePath } from './supabaseDB.js';
import { formatRegionTitle, formatDistrictTitle, formatJoinedDate } from '../utils/formatting.js';

// Safe broadcast helper to prevent unhandled reference or network errors
function safeBroadcastToCloud(type, data) {
  try {
    if (typeof broadcastToCloud === 'function') {
      broadcastToCloud(type, data).catch((e) => console.warn('[Auth CloudSync Warning]', e));
    }
  } catch (e) {
    console.warn('[Auth CloudSync Exception]', e);
  }
}

const STORAGE_KEY_USER = 'pusat_barkas_user';
const STORAGE_KEY_REGISTERED_USERS = 'pusat_barkas_registered_users';
const listeners = [];

// Akun Penjual Awal (Default Seeded Users / Akun Demo Peraga)
const DEFAULT_REGISTERED_USERS = [
  {
    id: "user-102",
    name: "Joko Supriyanto",
    storeName: "Toko Pak Joko",
    email: "joko.kra@gmail.com",
    phone: "085725012345",
    region: "karanganyar",
    district: "Jaten",
    password: "barkas123",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    bio: "Pusat perabot rumah tangga & elektronik seken berkualitas Karanganyar.",
    status: "active",
    deletedAt: null,
    createdAt: "18 Juli 2026",
    isDemo: true
  },
  {
    id: "user-103",
    name: "Rian Kurniawan",
    storeName: "Rian Gadget Kartasura",
    email: "rian.gadget@gmail.com",
    phone: "089678123456",
    region: "sukoharjo",
    district: "Kartasura",
    password: "barkas123",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    bio: "Thrift & gadget bekas garansi personal area UMS Kartasura & Solo Baru.",
    status: "active",
    deletedAt: null,
    createdAt: "10 Juli 2026",
    isDemo: true
  },
  {
    id: "user-104",
    name: "Siti Aisyah",
    storeName: "Aisyah's Crafts Solo",
    email: "aisyah.crafts@example.com",
    phone: "081234567890",
    region: "solo",
    district: "Mojosongo",
    password: "barkas123",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    bio: "Handmade crafts, artwork, dan souvenir khas Solo. Fast WA response.",
    status: "active",
    deletedAt: null,
    createdAt: "25 Agustus 2026",
    isDemo: true
  },
  {
    id: "user-1787309560138",
    name: "Ridho Hari Nugroho",
    storeName: "Zamir Shop",
    email: "ridho.harinugroho@gmail.com",
    phone: "081251018765",
    region: "karanganyar",
    district: "Jaten",
    password: "Semangat.45",
    avatar: null,
    bio: "Dodol Opo Wae",
    status: "active",
    deletedAt: null,
    createdAt: "1 September 2026",
    isDemo: false
  }
];
export { DEFAULT_REGISTERED_USERS };

export function isDemoUser(userOrId) {
  if (!userOrId) return false;
  const id = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.sellerId || '');
  if (typeof userOrId === 'object' && userOrId.isDemo) return true;
  if (id && (id === 'user-102' || id === 'user-103' || id === 'user-104' || id === 'user-105' || id === 'user-106' || id === 'user-107')) {
    return true;
  }
  const email = typeof userOrId === 'object' ? (userOrId.email || '') : '';
  if (email && (email.includes('joko.kra') || email.includes('rian.gadget') || email.includes('@example.com'))) {
    return true;
  }
  return false;
}

// Backward-compatible formatter exports. Implementation lives in js/utils/formatting.js.
export { formatRegionTitle, formatDistrictTitle, formatJoinedDate };
window.formatRegionTitle = formatRegionTitle;
window.formatDistrictTitle = formatDistrictTitle;
window.formatJoinedDate = formatJoinedDate;

let inMemoryRegisteredUsers = [...DEFAULT_REGISTERED_USERS];
let inMemoryActiveUser = null;
const SESSION_KEY_USER_ID = 'solosatset_session_user_id';
const SESSION_KEY_USER_DATA = 'solosatset_session_user_data';
let pendingResetState = null;

/**
 * Inisialisasi dan Dapatkan Daftar Seluruh Akun Terdaftar (Murni In-Memory & Cloud)
 */