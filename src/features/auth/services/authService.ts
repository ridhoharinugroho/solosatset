import { getCurrentUser, loginUser, logout } from "../../../services/authService";
import { mapUserDtoToDomain } from "../../../domain/user/user.mapper";
import type { UserProfile } from "../../../domain/user/user.contract";

export async function getAuthSession(): Promise<UserProfile | null> {
  try {
    const user = getCurrentUser();
    if (!user) return null;
    return mapUserDtoToDomain(user);
  } catch (error) {
    console.error("[AuthService] getAuthSession error:", error);
    return null;
  }
}

export async function performLogin(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await loginUser(identifier, password);
    if (!res) {
      return { success: false, error: "Login gagal" };
    }
    return { success: true, user: mapUserDtoToDomain(res) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan sistem saat login" };
  }
}

export async function performLogout(): Promise<void> {
  try {
    await logout();
  } catch (error) {
    console.error("[AuthService] performLogout error:", error);
  }
}

