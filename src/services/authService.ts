/**
 * Client authentication & session facade (TypeScript)
 * SOPALOKA Pure Next.js / React / TypeScript Engine
 */

export interface RegisteredUser {
  id: string;
  name: string;
  storeName?: string;
  email?: string;
  phone?: string;
  region?: string;
  district?: string;
  provinceCode?: string;
  regencyCode?: string;
  districtCode?: string;
  village?: string;
  avatar?: string;
  bio?: string;
  status?: string;
  isDemo?: boolean;
  isProfileConfigured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  loggedInAt?: string;
}

export interface PendingResetState {
  email: string;
  expiresAt?: string | null;
  createdAt?: number;
}

const SESSION_KEY_USER_ID = "solosatset_session_user_id";
const SESSION_KEY_USER_DATA = "solosatset_session_user_data";
const STORAGE_KEY_USER = "pusat_barkas_user";
const STORAGE_KEY_REGISTERED_USERS = "pusat_barkas_registered_users";
const STORAGE_KEY_PENDING_RESET = "pusat_barkas_pending_reset";

export const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: "user-102",
    name: "Joko Supriyanto",
    storeName: "Toko Pak Joko",
    email: "joko.kra@gmail.com",
    phone: "085725012345",
    region: "karanganyar",
    district: "Jaten",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    bio: "Pusat perabot rumah tangga & elektronik seken berkualitas Karanganyar.",
    status: "active",
    isDemo: true,
    createdAt: "18 Juli 2026",
  },
  {
    id: "user-103",
    name: "Rian Kurniawan",
    storeName: "Rian Gadget Kartasura",
    email: "rian.gadget@gmail.com",
    phone: "089678123456",
    region: "sukoharjo",
    district: "Kartasura",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    bio: "Thrift & gadget bekas garansi personal area UMS Kartasura & Solo Baru.",
    status: "active",
    isDemo: true,
    createdAt: "10 Juli 2026",
  },
  {
    id: "user-104",
    name: "Siti Aisyah",
    storeName: "Aisyah's Crafts Solo",
    email: "aisyah.crafts@example.com",
    phone: "081234567890",
    region: "solo",
    district: "Mojosongo",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    bio: "Handmade crafts, artwork, dan souvenir khas Solo. Fast WA response.",
    status: "active",
    isDemo: true,
    createdAt: "25 Agustus 2026",
  },
];

type AuthListener = (user: RegisteredUser | null) => void;
const listeners: AuthListener[] = [];

function stripCredentialFields(user: any): RegisteredUser | null {
  if (!user || typeof user !== "object") return null;
  const clean = { ...user };
  for (const key of ["password", "password_hash", "otp_code", "otp_expires_at", "resetCode", "pendingReset"]) {
    delete clean[key];
  }
  return clean as RegisteredUser;
}

let inMemoryRegisteredUsers: RegisteredUser[] = DEFAULT_REGISTERED_USERS.map((u) => stripCredentialFields(u)!);
let inMemoryActiveUser: RegisteredUser | null = null;
let pendingResetState: PendingResetState | null = null;

function notifySubscribers(): void {
  const user = getCurrentUser();
  listeners.forEach((callback) => {
    try {
      callback(user);
    } catch (error) {
      console.error("[Auth Subscriber]", error);
    }
  });
}

async function postJson(url: string, body: any): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || "Permintaan autentikasi gagal diproses.");
  }
  return payload;
}

export function isDemoUser(userOrId?: string | RegisteredUser | null): boolean {
  if (!userOrId) return false;
  if (typeof userOrId === "object" && userOrId.isDemo) return true;
  const id = typeof userOrId === "string" ? userOrId : userOrId.id || "";
  return ["user-102", "user-103", "user-104", "user-105", "user-106", "user-107"].includes(id);
}

export function formatRegionTitle(rawRegion?: string | null, fallback: string = "Semua Wilayah"): string {
  const reg = String(rawRegion || "")
    .trim()
    .toLowerCase();
  if (!reg) return fallback;
  const map: Record<string, string> = {
    solo: "Solo",
    surakarta: "Solo",
    karanganyar: "Karanganyar",
    sukoharjo: "Sukoharjo",
    wonogiri: "Wonogiri",
    sragen: "Sragen",
    boyolali: "Boyolali",
    klaten: "Klaten",
    soloraya: "Solo Raya",
    "solo raya": "Solo Raya",
  };
  return map[reg] || reg.split(/[-_ ]+/).map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : "")).join(" ");
}

export function formatDistrictTitle(rawDistrict?: string | null): string {
  const clean = String(rawDistrict || "")
    .trim()
    .replace(/^Kec\.?\s*/i, "")
    .replace(/\.+$/, "");
  return clean
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export function formatJoinedDate(rawDate?: string | null): string {
  if (!rawDate) return "01 Agustus 2026";
  const value = String(rawDate).trim();
  if (!value || value === "-" || value === "null" || value === "undefined") return "01 Agustus 2026";
  if (
    /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|sep|okt|nov|des)/i.test(
      value,
    ) &&
    /\d{4}/.test(value)
  ) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function getRegisteredUsers(): RegisteredUser[] {
  return inMemoryRegisteredUsers;
}

export async function syncRegisteredUsersToSupabase(users?: RegisteredUser[]): Promise<RegisteredUser[]> {
  if (Array.isArray(users)) {
    inMemoryRegisteredUsers = users.map((u) => stripCredentialFields(u)!);
  }
  return inMemoryRegisteredUsers;
}

export async function syncUsersFromCloud(): Promise<RegisteredUser[]> {
  return getRegisteredUsers();
}

export async function cleanupAndDeduplicateUsers(): Promise<void> {}

export function purgeLegacyDemoCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of [
      STORAGE_KEY_REGISTERED_USERS,
      STORAGE_KEY_USER,
      "barkas_user_session",
      "solosatset_profile_cache",
      "solosatset_seller_cache",
      "solosatset_user_cache",
    ]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("[Auth Legacy Cache Cleanup]", error);
  }
}

export function setCurrentUser(user: RegisteredUser | null): void {
  const clean = stripCredentialFields(user);
  inMemoryActiveUser = clean;
  try {
    if (typeof window !== "undefined") {
      if (clean) {
        sessionStorage.removeItem("solosatset_logged_out");
        localStorage.removeItem("solosatset_logged_out");
        sessionStorage.setItem(SESSION_KEY_USER_DATA, JSON.stringify(clean));
        sessionStorage.setItem(SESSION_KEY_USER_ID, clean.id || "");
      } else {
        sessionStorage.removeItem(SESSION_KEY_USER_DATA);
        sessionStorage.removeItem(SESSION_KEY_USER_ID);
      }
    }
  } catch (error) {}
  if (typeof window !== "undefined") (window as any).__currentUser = clean;
  notifySubscribers();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: clean }));
  }
}

export function getCurrentUser(): RegisteredUser | null {
  if (typeof window !== "undefined") {
    try {
      if (
        sessionStorage.getItem("solosatset_logged_out") === "true" ||
        localStorage.getItem("solosatset_logged_out") === "true"
      ) {
        return null;
      }
      const raw = sessionStorage.getItem(SESSION_KEY_USER_DATA) || localStorage.getItem("pusat_barkas_current_user");
      if (raw) {
        const parsed = stripCredentialFields(JSON.parse(raw));
        if (parsed?.id) {
          inMemoryActiveUser = parsed;
          return parsed;
        }
      }
    } catch (error) {}
  }
  return inMemoryActiveUser;
}

export function isUserLoggedIn(): boolean {
  return Boolean(getCurrentUser());
}

export function subscribeAuth(callback: AuthListener): () => void {
  listeners.push(callback);
  callback(getCurrentUser());
  return () => {
    const index = listeners.indexOf(callback);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export async function loginUser(identifier?: string, password?: string): Promise<RegisteredUser | null> {
  const cleanIdentifier = String(identifier || "").trim();
  const cleanPassword = String(password || "");
  if (!cleanIdentifier) throw new Error("Nomor WhatsApp, Email, atau Nama Toko harus diisi.");
  if (!cleanPassword) throw new Error("Password harus diisi.");
  const payload = await postJson("/api/auth-login", { identifier: cleanIdentifier, password: cleanPassword });
  const user = stripCredentialFields(payload.user);
  if (user) {
    setCurrentUser({ ...user, loggedInAt: new Date().toISOString() });
  }
  return getCurrentUser();
}

export async function registerUser({
  name,
  storeName,
  phone,
  email,
  region,
  district,
  password,
  confirmPassword,
}: any): Promise<RegisteredUser | null> {
  const payload = await postJson("/api/auth-register", {
    name,
    storeName,
    phone,
    email,
    region,
    district,
    password,
    confirmPassword: confirmPassword ?? password,
  });
  const user = stripCredentialFields(payload.user);
  if (user) {
    setCurrentUser({ ...user, loggedInAt: new Date().toISOString() });
  }
  return getCurrentUser();
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth-logout", { method: "POST", headers: { Accept: "application/json" }, keepalive: true });
  } catch (error) {
    console.warn("[Auth Logout] Server session cleanup failed:", error);
  }
  inMemoryActiveUser = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("solosatset_logged_out", "true");
      sessionStorage.setItem("solosatset_logged_out", "true");
      [
        SESSION_KEY_USER_DATA,
        SESSION_KEY_USER_ID,
        STORAGE_KEY_USER,
        "barkas_user_session",
        "solosatset_profile_cache",
        "solosatset_seller_cache",
        "solosatset_user_cache",
      ].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {}
  }
  savePendingReset(null);
  setCurrentUser(null);
}

export async function saveUserAvatarDirectly(userOrId: any, avatarUrl?: string | null): Promise<{ success: boolean; avatar: string | null }> {
  const current = getCurrentUser();
  const targetId = typeof userOrId === "string" ? userOrId : userOrId?.id || current?.id;
  if (!targetId || !current || String(targetId) !== String(current.id)) throw new Error("Pengguna tidak ditemukan.");
  const cleanAvatar = typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null;
  const payload = await postJson("/api/user-profile", { avatar: cleanAvatar });
  const user = stripCredentialFields(payload.user);
  if (user) {
    setCurrentUser({ ...current, ...user });
  }
  return { success: true, avatar: cleanAvatar };
}

export async function fetchFreshCurrentUserFromSupabase(): Promise<RegisteredUser | null> {
  const current = getCurrentUser();
  if (!current) return null;
  try {
    const response = await fetch("/api/user-profile", { headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.user) {
      const fresh = stripCredentialFields(payload.user);
      if (fresh) {
        setCurrentUser({ ...current, ...fresh });
        return getCurrentUser();
      }
    }
  } catch (error) {
    console.warn("[Auth Fresh User]", error);
  }
  return current;
}

export function findUserByIdentifier(identifier?: string | null): RegisteredUser | null {
  const normalized = String(identifier || "")
    .trim()
    .toLowerCase();
  const digits = normalized.replace(/\D/g, "");
  return (
    getRegisteredUsers().find(
      (user) =>
        user &&
        ((user.email && user.email.toLowerCase() === normalized) ||
          (user.name && user.name.toLowerCase() === normalized) ||
          (user.storeName && user.storeName.toLowerCase() === normalized) ||
          (digits.length >= 7 && user.phone && user.phone.replace(/\D/g, "") === digits)),
    ) || null
  );
}

export async function deactivateUser(userIdOrEmail?: string): Promise<{ success: boolean; message: string }> {
  const current = getCurrentUser();
  if (!current || (userIdOrEmail && String(userIdOrEmail) !== String(current.id))) {
    throw new Error("Pengguna tidak ditemukan.");
  }
  await postJson("/api/user-profile", { action: "deactivate" });
  await logout();
  return { success: true, message: "Akun berhasil dinonaktifkan." };
}

export function savePendingReset(state: PendingResetState | null): void {
  pendingResetState = state && typeof state === "object" ? { ...state } : null;
  if (typeof window !== "undefined") {
    try {
      if (pendingResetState) sessionStorage.setItem(STORAGE_KEY_PENDING_RESET, JSON.stringify(pendingResetState));
      else sessionStorage.removeItem(STORAGE_KEY_PENDING_RESET);
    } catch (error) {}
  }
}

export function getPendingResetState(): PendingResetState | null {
  if (pendingResetState?.email) return pendingResetState;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_PENDING_RESET);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.email && (!parsed.expiresAt || Date.now() <= new Date(parsed.expiresAt).getTime())) {
        pendingResetState = parsed;
        return parsed;
      }
    } catch (error) {}
  }
  return null;
}

export async function requestPasswordReset(email?: string): Promise<{ success: boolean; email: string }> {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Masukkan alamat email valid yang terdaftar pada akun Anda.");
  }
  const payload = await postJson("/api/auth-otp", { action: "request", email: cleanEmail, purpose: "password_reset" });
  savePendingReset({ email: cleanEmail, expiresAt: payload.expiresAt || null, createdAt: Date.now() });
  return { success: true, email: cleanEmail };
}

export async function confirmPasswordReset(email?: string, resetCode?: string, newPassword?: string): Promise<{ success: boolean; email: string }> {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanCode = String(resetCode || "")
    .replace(/\D/g, "")
    .slice(0, 6);
  const cleanPassword = String(newPassword || "");
  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Email reset tidak valid.");
  if (cleanCode.length !== 6) throw new Error("Masukkan 6 digit kode verifikasi yang Anda terima di email.");
  if (cleanPassword.length < 8) throw new Error("Password baru minimal 8 karakter.");
  const verifyPayload = await postJson("/api/auth-otp", { action: "verify", email: cleanEmail, code: cleanCode });
  const resetPayload = await postJson("/api/auth-otp", {
    action: "reset_password",
    email: cleanEmail,
    verificationToken: verifyPayload.verificationToken,
    newPassword: cleanPassword,
  });
  savePendingReset(null);
  return { success: true, email: resetPayload.email || cleanEmail };
}

export async function updateProfile({ name, storeName, email, phone, region, district, bio, avatar }: any): Promise<RegisteredUser | null> {
  const current = getCurrentUser();
  if (!current) throw new Error("Pengguna belum login.");
  let finalAvatar = avatar !== undefined ? avatar : current.avatar;
  const payload = await postJson("/api/user-profile", {
    name,
    storeName,
    email,
    phone,
    region,
    district,
    bio,
    avatar: finalAvatar,
  });
  const user = stripCredentialFields(payload.user);
  if (user) {
    setCurrentUser({ ...current, ...user, isProfileConfigured: true, updatedAt: new Date().toISOString() });
    const index = inMemoryRegisteredUsers.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      inMemoryRegisteredUsers[index] = stripCredentialFields({ ...inMemoryRegisteredUsers[index], ...user })!;
    }
  }
  return getCurrentUser();
}

export function getUserById(userId?: string | null): RegisteredUser | null {
  if (!userId) return null;
  const target = String(userId).trim().toLowerCase();
  return (
    getRegisteredUsers().find(
      (user) =>
        (user.id && String(user.id).toLowerCase() === target) || (user.email && user.email.toLowerCase() === target),
    ) || null
  );
}

export function getUserByReviewAuthor(userId?: string | null, authorName?: string | null): RegisteredUser | null {
  if (userId) {
    const found = getUserById(userId);
    if (found) return found;
  }
  if (!authorName) return null;
  const target = String(authorName)
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase();
  return (
    getRegisteredUsers().find(
      (user) =>
        (user.name && user.name.toLowerCase() === target) ||
        (user.storeName && user.storeName.toLowerCase() === target) ||
        (user.name && user.name.toLowerCase().includes(target)) ||
        (user.storeName && user.storeName.toLowerCase().includes(target)),
    ) || null
  );
}
