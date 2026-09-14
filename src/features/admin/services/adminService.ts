import { getAllListings, deleteListing, toggleHideListing, toggleSoldStatus } from "../../../services/listingService";
import type { AdminListingItem, AdminStats } from "../hooks/useAdminDashboard";
import type { AdminUser } from "../hooks/useAdminAuth";

const SESSION_ENDPOINT = "/api/admin-auth";

export async function fetchAdminSessionApi(): Promise<{ authenticated: boolean; user: AdminUser | null }> {
  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=session`, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { authenticated: false, user: null };
    const payload = await response.json();
    if (payload?.authenticated && payload?.user) {
      return { authenticated: true, user: payload.user };
    }
    return { authenticated: false, user: null };
  } catch (error) {
    console.error("[AdminService] fetchAdminSessionApi error:", error);
    return { authenticated: false, user: null };
  }
}

export async function loginAdminApi(username: string, password: string): Promise<{ authenticated: boolean; user?: AdminUser; error?: string }> {
  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=login`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.authenticated) {
      return { authenticated: false, error: payload?.error || "Login admin gagal. Username atau Password salah." };
    }
    return { authenticated: true, user: payload.user };
  } catch (err: any) {
    return { authenticated: false, error: err.message || "Gagal terhubung ke layanan otentikasi admin." };
  }
}

export async function logoutAdminApi(): Promise<void> {
  try {
    await fetch(`${SESSION_ENDPOINT}?action=logout`, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error("[AdminService] logoutAdminApi error:", error);
  }
}

export function getAdminListingsData(): { rawListings: AdminListingItem[]; stats: AdminStats } {
  try {
    const rawListings = (getAllListings() || []) as unknown as AdminListingItem[];
    const total = rawListings.length;
    const active = rawListings.filter((l) => !l.isHidden && !l.isSold).length;
    const hidden = rawListings.filter((l) => l.isHidden).length;
    const sold = rawListings.filter((l) => l.isSold).length;
    return { rawListings, stats: { total, active, hidden, sold } };
  } catch (error) {
    console.error("[AdminService] getAdminListingsData error:", error);
    return { rawListings: [], stats: { total: 0, active: 0, hidden: 0, sold: 0 } };
  }
}

export function performAdminToggleHide(id: string): any {
  return toggleHideListing(id);
}

export function performAdminToggleSold(id: string): any {
  return toggleSoldStatus(id);
}

export function performAdminRemoveListing(id: string): any {
  return deleteListing(id);
}
