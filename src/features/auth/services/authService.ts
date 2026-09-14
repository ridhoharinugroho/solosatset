// @ts-ignore
import { getCurrentUser, loginUser, logoutUser } from "../../../../js/services/auth.js";
import { mapUserDtoToDomain } from "../../../domain/user/user.mapper";
import type { UserProfile } from "../../../domain/user/user.contract";

export async function getAuthSession(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser();
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
    if (!res || !res.success) {
      return { success: false, error: res?.error || "Login gagal" };
    }
    return { success: true, user: mapUserDtoToDomain(res.user) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan sistem saat login" };
  }
}

export async function performLogout(): Promise<void> {
  try {
    await logoutUser();
  } catch (error) {
    console.error("[AuthService] performLogout error:", error);
  }
}

