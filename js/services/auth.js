/**
 * Client authentication/session facade. Authentication authority lives on /api/*.
 * No password, OTP, SMTP or service-role credential is stored in browser state.
 */
import { supabase } from '../lib/supabase.js';
import { sbUploadAvatar, sbDeleteAvatar, extractAvatarFilePath } from './supabaseDB.js';

const listeners = [];
const SESSION_KEY_USER_ID = 'solosatset_session_user_id';
const SESSION_KEY_USER_DATA = 'solosatset_session_user_data';
const STORAGE_KEY_USER = 'pusat_barkas_user';
const STORAGE_KEY_REGISTERED_USERS = 'pusat_barkas_registered_users';
const STORAGE_KEY_PENDING_RESET = 'pusat_barkas_pending_reset';

const DEFAULT_REGISTERED_USERS = [
  { id: 'user-102', name: 'Joko Supriyanto', storeName: 'Toko Pak Joko', email: 'joko.kra@gmail.com', phone: '085725012345', region: 'karanganyar', district: 'Jaten', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80', bio: 'Pusat perabot rumah tangga & elektronik seken berkualitas Karanganyar.', status: 'active', isDemo: true, createdAt: '18 Juli 2026' },
  { id: 'user-103', name: 'Rian Kurniawan', storeName: 'Rian Gadget Kartasura', email: 'rian.gadget@gmail.com', phone: '089678123456', region: 'sukoharjo', district: 'Kartasura', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80', bio: 'Thrift & gadget bekas garansi personal area UMS Kartasura & Solo Baru.', status: 'active', isDemo: true, createdAt: '10 Juli 2026' },
  { id: 'user-104', name: 'Siti Aisyah', storeName: "Aisyah's Crafts Solo", email: 'aisyah.crafts@example.com', phone: '081234567890', region: 'solo', district: 'Mojosongo', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', bio: 'Handmade crafts, artwork, dan souvenir khas Solo. Fast WA response.', status: 'active', isDemo: true, createdAt: '25 Agustus 2026' }
];
export { DEFAULT_REGISTERED_USERS };

function stripCredentialFields(user) {
  if (!user || typeof user !== 'object') return user;
  const clean = { ...user };
  for (const key of ['password', 'password_hash', 'otp_code', 'otp_expires_at', 'resetCode', 'pendingReset']) delete clean[key];
  return clean;
}
function mapSupabaseUser(row) {
  if (!row) return null;
  return stripCredentialFields({ id: row.id, name: row.name, storeName: row.store_name || row.name, email: row.email, phone: row.phone, region: row.region, district: row.district, avatar: row.avatar ?? null, bio: row.bio ?? '', status: row.status || 'active', deletedAt: row.deleted_at || null, isDemo: row.is_demo || false, createdAt: row.created_at });
}
let inMemoryRegisteredUsers = DEFAULT_REGISTERED_USERS.map(stripCredentialFields);
let inMemoryActiveUser = null;
let pendingResetState = null;

function notifySubscribers() { const user = getCurrentUser(); listeners.forEach((callback) => { try { callback(user); } catch (error) { console.error('[Auth Subscriber]', error); } }); }
async function postJson(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || 'Permintaan autentikasi gagal diproses.');
  return payload;
}

export function isDemoUser(userOrId) {
  if (!userOrId) return false;
  if (typeof userOrId === 'object' && userOrId.isDemo) return true;
  const id = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.sellerId || '');
  return ['user-102', 'user-103', 'user-104', 'user-105', 'user-106', 'user-107'].includes(id);
}
export function formatRegionTitle(rawRegion) { const reg = String(rawRegion || '').trim().toLowerCase(); if (!reg) return 'Solo'; const map = { solo: 'Solo', surakarta: 'Solo', karanganyar: 'Karanganyar', sukoharjo: 'Sukoharjo', wonogiri: 'Wonogiri', sragen: 'Sragen', boyolali: 'Boyolali', klaten: 'Klaten', soloraya: 'Solo Raya', 'solo raya': 'Solo Raya' }; return map[reg] || `${reg.charAt(0).toUpperCase()}${reg.slice(1)}`; }
window.formatRegionTitle = formatRegionTitle;
export function formatDistrictTitle(rawDistrict) { const clean = String(rawDistrict || '').trim().replace(/^Kec\.?\s*/i, '').replace(/\.+$/, ''); return clean.split(' ').filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join(' '); }
window.formatDistrictTitle = formatDistrictTitle;
export function formatJoinedDate(rawDate) { if (!rawDate) return '01 Agustus 2026'; const value = String(rawDate).trim(); if (!value || value === '-' || value === 'null' || value === 'undefined') return '01 Agustus 2026'; if (/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|sep|okt|nov|des)/i.test(value) && /\d{4}/.test(value)) return value; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
window.formatJoinedDate = formatJoinedDate;

export function getRegisteredUsers() { return inMemoryRegisteredUsers; }
export async function syncRegisteredUsersToSupabase(users) { if (Array.isArray(users)) inMemoryRegisteredUsers = users.map(stripCredentialFields); return inMemoryRegisteredUsers; }
export async function syncUsersFromCloud() { if (!supabase) return getRegisteredUsers(); try { const { data, error } = await supabase.from('users').select('id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at').order('created_at', { ascending: false }); if (!error && Array.isArray(data)) { inMemoryRegisteredUsers = data.map(mapSupabaseUser).filter(Boolean); window.__registeredUsers = inMemoryRegisteredUsers; window.dispatchEvent(new CustomEvent('registeredUsersChanged', { detail: inMemoryRegisteredUsers })); } } catch (error) { console.warn('[Auth Users Sync]', error); } return getRegisteredUsers(); }
export async function cleanupAndDeduplicateUsers() { return; }
export function purgeLegacyDemoCache() { if (typeof window === 'undefined') return; try { for (const key of [STORAGE_KEY_REGISTERED_USERS, STORAGE_KEY_USER, 'barkas_user_session', 'solosatset_profile_cache', 'solosatset_seller_cache', 'solosatset_user_cache']) { localStorage.removeItem(key); sessionStorage.removeItem(key); } } catch (error) { console.warn('[Auth Legacy Cache Cleanup]', error); } }
purgeLegacyDemoCache();
export async function seedUsersToSupabase() { return; }

export async function saveUserAvatarDirectly(userOrId, avatarUrl) {
  const current = getCurrentUser();
  const targetId = typeof userOrId === 'string' ? userOrId : (userOrId?.id || current?.id);
  if (!targetId || !current || String(targetId) !== String(current.id)) throw new Error('Pengguna tidak ditemukan.');
  const cleanAvatar = typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null;
  const payload = await postJson('/api/user-profile', { avatar: cleanAvatar });
  const user = stripCredentialFields(payload.user);
  setCurrentUser({ ...current, ...user });
  return { success: true, avatar: cleanAvatar };
}
export async function fetchFreshCurrentUserFromSupabase() { const current = getCurrentUser(); if (!current) return null; try { const response = await fetch('/api/user-profile', { headers: { Accept: 'application/json' } }); const payload = await response.json().catch(() => ({})); if (response.ok && payload.user) { const fresh = stripCredentialFields(payload.user); setCurrentUser({ ...current, ...fresh }); return getCurrentUser(); } } catch (error) { console.warn('[Auth Fresh User]', error); } return current; }
// Startup must not query the private users table from the browser. Registered-user data
// is now server-authoritative and is loaded only through authenticated flows that need it.
export async function syncAllUsersToCloudOnStartup() { return getRegisteredUsers(); }
export function findUserByIdentifier(identifier) { const normalized = String(identifier || '').trim().toLowerCase(); const digits = normalized.replace(/\D/g, ''); return getRegisteredUsers().find((user) => user && ((user.email && user.email.toLowerCase() === normalized) || (user.name && user.name.toLowerCase() === normalized) || (user.storeName && user.storeName.toLowerCase() === normalized) || (digits.length >= 7 && user.phone && user.phone.replace(/\D/g, '') === digits))) || null; }

export function setCurrentUser(user) { const clean = stripCredentialFields(user); inMemoryActiveUser = clean || null; try { if (clean) { sessionStorage.removeItem('solosatset_logged_out'); localStorage.removeItem('solosatset_logged_out'); sessionStorage.setItem(SESSION_KEY_USER_DATA, JSON.stringify(clean)); sessionStorage.setItem(SESSION_KEY_USER_ID, clean.id || ''); } else { sessionStorage.removeItem(SESSION_KEY_USER_DATA); sessionStorage.removeItem(SESSION_KEY_USER_ID); } } catch (error) {} if (typeof window !== 'undefined') window.__currentUser = clean; notifySubscribers(); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: clean })); }
export function getCurrentUser() { try { if (sessionStorage.getItem('solosatset_logged_out') === 'true' || localStorage.getItem('solosatset_logged_out') === 'true') return null; const raw = sessionStorage.getItem(SESSION_KEY_USER_DATA) || localStorage.getItem('pusat_barkas_current_user'); if (raw) { const parsed = stripCredentialFields(JSON.parse(raw)); if (parsed?.id) { inMemoryActiveUser = parsed; return parsed; } } } catch (error) {} return inMemoryActiveUser; }
export function isUserLoggedIn() { return Boolean(getCurrentUser()); }
export function subscribeAuth(callback) { listeners.push(callback); callback(getCurrentUser()); return () => { const index = listeners.indexOf(callback); if (index >= 0) listeners.splice(index, 1); }; }

export async function loginUser(identifier, password) { const cleanIdentifier = String(identifier || '').trim(); const cleanPassword = String(password || ''); if (!cleanIdentifier) throw new Error('Nomor WhatsApp, Email, atau Nama Toko harus diisi.'); if (!cleanPassword) throw new Error('Password harus diisi.'); const payload = await postJson('/api/auth-login', { identifier: cleanIdentifier, password: cleanPassword }); const user = stripCredentialFields(payload.user); setCurrentUser({ ...user, loggedInAt: new Date().toISOString() }); return getCurrentUser(); }
export async function registerUser({ name, storeName, phone, email, region, district, password, confirmPassword }) { const payload = await postJson('/api/auth-register', { name, storeName, phone, email, region, district, password, confirmPassword: confirmPassword ?? password }); const user = stripCredentialFields(payload.user); setCurrentUser({ ...user, loggedInAt: new Date().toISOString() }); return getCurrentUser(); }
export async function deactivateUser(userIdOrEmail) { const current = getCurrentUser(); if (!current || (userIdOrEmail && String(userIdOrEmail) !== String(current.id))) throw new Error('Pengguna tidak ditemukan.'); await postJson('/api/user-profile', { action: 'deactivate' }); await logout(); return { success: true, message: 'Akun berhasil dinonaktifkan.' }; }
export async function requestPasswordReset(email) { const cleanEmail = String(email || '').trim().toLowerCase(); if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Masukkan alamat email valid yang terdaftar pada akun Anda.'); const payload = await postJson('/api/password-reset', { action: 'request', email: cleanEmail }); savePendingReset({ email: cleanEmail, expiresAt: payload.expiresAt || null, createdAt: Date.now() }); return { success: true, email: cleanEmail }; }
export function savePendingReset(state) { pendingResetState = state && typeof state === 'object' ? { ...state } : null; try { if (pendingResetState) sessionStorage.setItem(STORAGE_KEY_PENDING_RESET, JSON.stringify(pendingResetState)); else sessionStorage.removeItem(STORAGE_KEY_PENDING_RESET); } catch (error) {} }
export function getPendingResetState() { if (pendingResetState?.email) return pendingResetState; try { const raw = sessionStorage.getItem(STORAGE_KEY_PENDING_RESET); const parsed = raw ? JSON.parse(raw) : null; if (parsed?.email && (!parsed.expiresAt || Date.now() <= new Date(parsed.expiresAt).getTime())) { pendingResetState = parsed; return parsed; } } catch (error) {} return null; }
export async function confirmPasswordReset(email, resetCode, newPassword) { const cleanEmail = String(email || '').trim().toLowerCase(); const cleanCode = String(resetCode || '').replace(/\D/g, '').slice(0, 6); const cleanPassword = String(newPassword || ''); if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Email reset tidak valid.'); if (cleanCode.length !== 6) throw new Error('Masukkan 6 digit kode verifikasi yang Anda terima di email.'); if (cleanPassword.length < 8) throw new Error('Password baru minimal 8 karakter.'); const payload = await postJson('/api/password-reset', { action: 'reset', email: cleanEmail, otpCode: cleanCode, newPassword: cleanPassword }); savePendingReset(null); return { success: true, email: payload.email || cleanEmail }; }

export async function updateProfile({ name, storeName, email, phone, region, district, bio, avatar }) { const current = getCurrentUser(); if (!current) throw new Error('Pengguna belum login.'); let finalAvatar = avatar !== undefined ? avatar : current.avatar; if (typeof finalAvatar === 'string' && finalAvatar.startsWith('data:')) finalAvatar = await sbUploadAvatar(finalAvatar); const payload = await postJson('/api/user-profile', { name, storeName, email, phone, region, district, bio, avatar: finalAvatar }); const user = stripCredentialFields(payload.user); setCurrentUser({ ...current, ...user, isProfileConfigured: true, updatedAt: new Date().toISOString() }); const index = inMemoryRegisteredUsers.findIndex((item) => item.id === current.id); if (index >= 0) inMemoryRegisteredUsers[index] = stripCredentialFields({ ...inMemoryRegisteredUsers[index], ...user }); window.dispatchEvent(new CustomEvent('registeredUsersChanged', { detail: inMemoryRegisteredUsers })); return getCurrentUser(); }
export async function removeUserAvatar(userId) { const current = getCurrentUser(); const targetId = String(userId || current?.id || '').trim(); if (!current || targetId !== String(current.id)) throw new Error('Pengguna tidak ditemukan.'); const filePath = extractAvatarFilePath(current.avatar); if (filePath) await sbDeleteAvatar(filePath); const payload = await postJson('/api/user-profile', { avatar: null }); const user = stripCredentialFields(payload.user); setCurrentUser({ ...current, ...user }); return { success: true, message: 'Foto profil / avatar berhasil dihapus.' }; }
export async function logout() { try { await fetch('/api/auth-logout', { method: 'POST', headers: { Accept: 'application/json' }, keepalive: true }); } catch (error) { console.warn('[Auth Logout] Server session cleanup failed:', error); } inMemoryActiveUser = null; try { localStorage.setItem('solosatset_logged_out', 'true'); sessionStorage.setItem('solosatset_logged_out', 'true'); [SESSION_KEY_USER_DATA, SESSION_KEY_USER_ID, STORAGE_KEY_USER, 'barkas_user_session', 'solosatset_profile_cache', 'solosatset_seller_cache', 'solosatset_user_cache'].forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key); }); } catch (error) {} savePendingReset(null); setCurrentUser(null); }
export function getUserById(userId) { if (!userId) return null; const target = String(userId).trim().toLowerCase(); return getRegisteredUsers().find((user) => (user.id && String(user.id).toLowerCase() === target) || (user.email && user.email.toLowerCase() === target)) || null; }
export function getUserByReviewAuthor(userId, authorName) { if (userId) { const found = getUserById(userId); if (found) return found; } if (!authorName) return null; const target = String(authorName).replace(/\(.*?\)/g, '').trim().toLowerCase(); return getRegisteredUsers().find((user) => (user.name && user.name.toLowerCase() === target) || (user.storeName && user.storeName.toLowerCase() === target) || (user.name && user.name.toLowerCase().includes(target)) || (user.storeName && user.storeName.toLowerCase().includes(target))) || null; }

if (typeof window !== 'undefined') window.addEventListener('storage', (event) => { if ([STORAGE_KEY_USER, SESSION_KEY_USER_DATA, 'solosatset_logged_out'].includes(event.key)) notifySubscribers(); });
