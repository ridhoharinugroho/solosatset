// @ts-ignore
import { getCurrentUser, saveUserProfile } from "../../../../js/services/auth.js";
import { mapUserDtoToDomain } from "../../../domain/user/user.mapper";
import type { UserProfile } from "../../../domain/user/user.contract";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    return mapUserDtoToDomain(user);
  } catch (error) {
    console.error("[ProfileService] fetchUserProfile error:", error);
    return null;
  }
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await saveUserProfile({
      name: data.name,
      email: data.email,
      phone: data.phone,
      province_code: data.provinceCode,
      regency_code: data.regencyCode,
      district_code: data.districtCode,
    });
    if (!res || !res.success) {
      return { success: false, error: res?.error || "Gagal memperbarui profil" };
    }
    return { success: true, user: mapUserDtoToDomain(res.user) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat menyimpan profil" };
  }
}

