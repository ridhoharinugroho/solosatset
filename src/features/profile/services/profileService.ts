import { getCurrentUser, updateProfile } from "../../../services/authService";
import { mapUserDtoToDomain } from "../../../domain/user/user.mapper";
import type { UserProfile } from "../../../domain/user/user.contract";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const user = getCurrentUser();
    if (!user) return null;
    return mapUserDtoToDomain(user);
  } catch (error) {
    console.error("[ProfileService] fetchUserProfile error:", error);
    return null;
  }
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await updateProfile({
      name: data.name,
      email: data.email,
      phone: data.phone,
      provinceCode: data.provinceCode,
      regencyCode: data.regencyCode,
      districtCode: data.districtCode,
    });
    if (!res) {
      return { success: false, error: "Gagal memperbarui profil" };
    }
    return { success: true, user: mapUserDtoToDomain(res) };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat menyimpan profil" };
  }
}

