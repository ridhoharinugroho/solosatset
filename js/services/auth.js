/**
 * Client authentication facade.
 *
 * Security boundary:
 * - Passwords are NEVER stored in browser state, localStorage, sessionStorage,
 *   or the in-memory user model.
 * - Login / registration / OTP verification are handled by server API modules.
 * - Supabase is used here only for non-secret profile/public-user data.
 */

import { supabase } from '../lib/supabase.js';
import { sbUploadAvatar, sbUpdateUserAvatar, sbDeleteAvatar, extractAvatarFilePath } from './supabaseDB.js';

const SESSION_KEY_USER_ID = 'solosatset_session_user_id';
const SESSION_KEY_USER_DATA = 'solosatset_session_user_data';
const listeners = [];
let inMemoryActiveUser = null;
let inMemoryRegisteredUsers = [];
let pendingResetState = null;

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const clean = { ...user };
  delete clean.password;
  delete clean.password_hash;
  delete clean.otp_code;
  delete clean.otp_expires_at;
  return clean;
}

function normalizeUser(row) {
  if (!row) return null;
  return sanitizeUser({
    id: row.id,
    name: row.name,
    storeName: row.storeName ?? row.store_name ?? row.name,
    email: row.email,
    phone: row.phone,
    region: row.region,
    district: row.district,
    avatar: row.avatar ?? null,
    bio: row.bio ?? '',
    status: row.status || 'active',
    deletedAt: row.deletedAt ?? row.deleted_at ?? null,
    isDemo: Boolean(row.isDemo ?? row.is_demo),
    createdAt: row.createdAt ?? row.created_at ?? null,
    isProfileConfigured: row.isProfileConfigured ?? true
  });
}

function persistSession(user) {
  const clean = sanitizeUser(user);
  inMemoryActiveUser = clean;
  try {
    if (clean?.id) {
      sessionStorage.removeItem('solosatset_logged_out');
      localStorage.removeItem('solosatset_logged_out');
      sessionStorage.setItem(SESSION_KEY_USER_DATA, JSON.stringify(clean));
      sessionStorage.setItem(SESSION_KEY_USER_ID, clean.id);
    } else {
      sessionStorage.removeItem(SESSION_KEY_USER_DATA);
      sessionStorage.removeItem(SESSION_KEY_USER_ID);
    }
  } catch {}
  notifySubscribers();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: clean }));
  }
  return clean;
}

function readSession() {
  if (typeof window === 'undefined') return null;
  try {
    if (sessionStorage.getItem('solosatset_logged_out') === 'true' || localStorage.getItem('solosatset_logged_out') === 'true') return null;
    const raw = sessionStorage.getItem(SESSION_KEY_USER_DATA);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  return persistSession(user);
}

export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    try {
      if (sessionStorage.getItem('solosatset_logged_out') === 'true' || localStorage.getItem('solosatset_logged_out') === 'true') return null;
    } catch {}
  }
  const sessionUser = readSession();
  if (sessionUser) {
    inMemoryActiveUser = sessionUser;
    return sessionUser;
  }
  return normalizeUser(inMemoryActiveUser);
}

export function isUserLoggedIn() {
  return Boolean(getCurrentUser());
}

export function subscribeAuth(callback) {
  if (typeof callback !== 'function') return () => {};
  listeners.push(callback);
  callback(getCurrentUser());
  return () => {
    const index = listeners.indexOf(callback);
    if (index >= 0) listeners.splice(index, 1);
  };
}

function notifySubscribers() {
  const user = getCurrentUser();
  listeners.slice().forEach((callback) => {
    try { callback(user); } catch (error) { console.error('[Auth subscriber]', error); }
  });
}

export function formatRegionTitle(rawRegion) {
  if (!rawRegion) return 'Solo';
  const value = String(rawRegion).trim().toLowerCase();
  const map = {
    solo: 'Solo', surakarta: 'Solo', karanganyar: 'Karanganyar', sukoharjo: 'Sukoharjo',
    wonogiri: 'Wonogiri', sragen: 'Sragen', boyolali: 'Boyolali', klaten: 'Klaten',
    soloraya: 'Solo Raya', 'solo raya': 'Solo Raya'
  };
  return map[value] || value.charAt(0).toUpperCase() + value.slice(1);
}
window.formatRegionTitle = formatRegionTitle;

export function formatDistrictTitle(rawDistrict) {
  if (!rawDistrict) return '';
  const clean = String(rawDistrict).trim().replace(/^Kec\.?\s*/i, '').replace(/\.+$/, '');
  return clean.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
window.formatDistrictTitle = formatDistrictTitle;

export function formatJoinedDate(rawDate) {
  if (!rawDate) return '01 Agustus 2026';
  const value = String(rawDate).trim();
  if (!value || value === '-' || value === 'null' || value === 'undefined') return '01 Agustus 2026';
  if (/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|sep|okt|nov|des)/i.test(value) && /\d{4}/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
window.formatJoinedDate = formatJoinedDate;

export function isDemoUser(userOrId) {
  if (!userOrId) return false;
  if (typeof userOrId === 'object' && userOrId.isDemo) return true;
  const id = typeof userOrId === 'string' ? userOrId : userOrId.id || userOrId.sellerId;
  return typeof id === 'string' && /^user-10[2-7]$/.test(id);
}

export function getRegisteredUsers() {
  return inMemoryRegisteredUsers;
}

function publicUserFields() {
  return 'id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at';
}

export async function syncUsersFromCloud() {
  if (!supabase) return getRegisteredUsers();
  try {
    const { data, error } = await supabase.from('users').select(publicUserFields()).order('created_at', { ascending: false });
    if (error) throw error;
    inMemoryRegisteredUsers = Array.isArray(data) ? data.map(normalizeUser).filter(Boolean) : [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('registeredUsersChanged', { detail: inMemoryRegisteredUsers }));
    }
  } catch (error) {
    console.warn('[Auth] User directory sync failed:', error?.message || error);
  }
  return getRegisteredUsers();
}

export async function syncAllUsersToCloudOnStartup() {
  return syncUsersFromCloud();
}

export async function fetchFreshCurrentUserFromSupabase() {
  const current = getCurrentUser();
  if (!current || !supabase) return current;
  try {
    let query = supabase.from('users').select(publicUserFields()).limit(1);
    if (current.id) query = query.eq('id', current.id);
    else if (current.email) query = query.eq('email', current.email.toLowerCase());
    const { data, error } = await query.maybeSingle();
    if (error || !data) return current;
    return persistSession({ ...current, ...normalizeUser(data) });
  } catch {
    return current;
  }
}

export function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const value = String(identifier).trim().toLowerCase();
  const digits = value.replace(/\D/g, '');
  return getRegisteredUsers().find((user) => {
    if (!user) return false;
    if (user.email?.toLowerCase() === value) return true;
    if (user.name?.toLowerCase() === value) return true;
    if (user.storeName?.toLowerCase() === value) return true;
    if (digits.length >= 7 && user.phone) {
      const phone = String(user.phone).replace(/\D/g, '');
      return phone === digits || phone.endsWith(digits) || digits.endsWith(phone);
    }
    return false;
  }) || null;
}

export function getUserById(userId) {
  if (!userId) return null;
  const id = String(userId).trim().toLowerCase();
  return getRegisteredUsers().find((user) => String(user?.id || '').toLowerCase() === id || String(user?.email || '').toLowerCase() === id) || null;
}

export function getUserByReviewAuthor(userId, authorName) {
  const byId = getUserById(userId);
  if (byId) return byId;
  if (!authorName) return null;
  const name = String(authorName).replace(/\(.*?\)/g, '').trim().toLowerCase();
  return getRegisteredUsers().find((user) => user?.name?.toLowerCase() === name || user?.storeName?.toLowerCase() === name) || null;
}

async function callJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok || !data.success) throw new Error(data.error || 'Layanan autentikasi gagal diproses.');
  return data;
}

export async function loginUser(identifier, password) {
  if (!identifier?.trim() || !password) throw new Error('Identifier dan password wajib diisi.');
  const data = await callJson('/api/auth-login', { identifier: identifier.trim(), password });
  const user = persistSession({ ...data.user, loggedInAt: new Date().toISOString() });
  await syncUsersFromCloud();
  return user;
}

export async function registerUser(fields) {
  const required = ['name', 'storeName', 'phone', 'email', 'region', 'district', 'password'];
  if (!fields || required.some((key) => !String(fields[key] ?? '').trim())) throw new Error('Lengkapi seluruh data pendaftaran.');
  if (String(fields.password).length < 5) throw new Error('Password minimal 5 karakter.');
  const email = String(fields.email).trim().toLowerCase();
  await callJson('/api/auth-otp', { action: 'request', purpose: 'registration', email });
  throw new Error('OTP pendaftaran telah dikirim. Lanjutkan verifikasi melalui form OTP.');
}

export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail.includes('@')) throw new Error('Masukkan alamat email valid.');
  await callJson('/api/auth-otp', { action: 'request', purpose: 'password_reset', email: cleanEmail });
  pendingResetState = { email: cleanEmail, createdAt: Date.now() };
  return { success: true, email: cleanEmail };
}

export async function confirmPasswordReset(email, resetCode, newPassword) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const code = String(resetCode || '').replace(/\D/g, '');
  if (!cleanEmail.includes('@') || !/^\d{6}$/.test(code)) throw new Error('Email dan OTP 6 digit wajib diisi.');
  if (!newPassword || String(newPassword).length < 5) throw new Error('Password baru minimal 5 karakter.');
  const verification = await callJson('/api/auth-otp', { action: 'verify', purpose: 'password_reset', email: cleanEmail, code });
  await callJson('/api/auth-otp', { action: 'reset_password', purpose: 'password_reset', email: cleanEmail, verificationToken: verification.verificationToken, newPassword: String(newPassword) });
  pendingResetState = null;
  return { success: true, email: cleanEmail };
}

export function savePendingReset(state) {
  pendingResetState = state || null;
  if (typeof window !== 'undefined') window._globalPendingResetState = pendingResetState;
}

export function getPendingResetState() {
  return pendingResetState;
}

export async function updateProfile({ name, storeName, email, phone, region, district, bio, avatar }) {
  const current = getCurrentUser();
  if (!current) throw new Error('Pengguna belum login.');
  if (!supabase) throw new Error('Database tidak tersedia.');
  const payload = {
    name: name?.trim() || current.name || null,
    store_name: storeName?.trim() || current.storeName || null,
    email: email?.trim().toLowerCase() || current.email || null,
    phone: phone?.trim() || current.phone || null,
    region: region || current.region || null,
    district: district?.trim() || current.district || null,
    bio: bio !== undefined ? String(bio).trim() : current.bio || null,
    avatar: avatar !== undefined ? avatar : current.avatar || null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('users').update(payload).eq('id', current.id).select(publicUserFields()).maybeSingle();
  if (error) throw error;
  const updated = normalizeUser(data || { ...current, ...payload });
  persistSession(updated);
  await syncUsersFromCloud();
  return updated;
}

export async function saveUserAvatarDirectly(userOrId, avatarUrl) {
  const current = getCurrentUser();
  const targetId = typeof userOrId === 'string' ? userOrId : userOrId?.id || current?.id;
  if (!targetId || !supabase) throw new Error('Pengguna tidak ditemukan.');
  const cleanAvatar = avatarUrl ? String(avatarUrl).trim() : null;
  const { error } = await supabase.from('users').update({ avatar: cleanAvatar, updated_at: new Date().toISOString() }).eq('id', targetId);
  if (error) throw error;
  if (current?.id === targetId) persistSession({ ...current, avatar: cleanAvatar });
  return { success: true, avatar: cleanAvatar };
}

export async function removeUserAvatar(userId) {
  const current = getCurrentUser();
  const targetId = String(userId || current?.id || '').trim();
  if (!targetId) throw new Error('Pengguna tidak ditemukan.');
  const oldAvatar = current?.avatar;
  const filePath = extractAvatarFilePath(oldAvatar);
  if (filePath && supabase?.storage) {
    try { await supabase.storage.from('avatars').remove([filePath]); } catch (error) { console.warn('[Auth] Avatar storage cleanup:', error?.message || error); }
  }
  await saveUserAvatarDirectly(targetId, null);
  return { success: true, message: 'Foto profil / avatar berhasil dihapus.' };
}

export async function deactivateUser(userIdOrEmail) {
  const current = getCurrentUser();
  const target = userIdOrEmail || current?.id;
  if (!target || !supabase) throw new Error('Pengguna tidak ditemukan.');
  const query = String(target).includes('@') ? supabase.from('users').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('email', String(target).trim().toLowerCase()) : supabase.from('users').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', target);
  const { error } = await query;
  if (error) throw error;
  if (current && (String(current.id) === String(target) || current.email?.toLowerCase() === String(target).toLowerCase())) await logout();
  return { success: true, message: 'Akun berhasil dinonaktifkan.' };
}

export async function logout() {
  inMemoryActiveUser = null;
  try {
    sessionStorage.removeItem(SESSION_KEY_USER_DATA);
    sessionStorage.removeItem(SESSION_KEY_USER_ID);
    sessionStorage.setItem('solosatset_logged_out', 'true');
    localStorage.removeItem('solosatset_logged_out');
  } catch {}
  try {
    if (supabase?.auth) await supabase.auth.signOut();
  } catch (error) {
    console.warn('[Auth] Supabase signOut:', error?.message || error);
  }
  notifySubscribers();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: null }));
}

export function purgeLegacyDemoCache() {
  // Intentionally no seeded credentials or user data are kept client-side anymore.
  try {
    localStorage.removeItem('pusat_barkas_registered_users');
    localStorage.removeItem('pusat_barkas_user');
    localStorage.removeItem('barkas_user_session');
  } catch {}
}

export async function seedUsersToSupabase() {
  // Seeding credentials from the browser is intentionally disabled.
  return;
}

export async function syncRegisteredUsersToSupabase(users) {
  // Kept as a compatibility no-op. User records must be created/changed through server auth APIs.
  if (Array.isArray(users)) inMemoryRegisteredUsers = users.map(normalizeUser).filter(Boolean);
}

export async function cleanupAndDeduplicateUsers() {
  // Destructive account cleanup must not run automatically from a browser client.
  return { success: false, skipped: true };
}

purgeLegacyDemoCache();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY_USER_DATA || event.key === 'solosatset_logged_out') notifySubscribers();
  });
}
