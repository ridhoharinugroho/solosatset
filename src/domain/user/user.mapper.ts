import type { SupabaseUserRowDTO, UserProfileUpdateDTO } from "./user.dto";
import type { UserProfile, SellerProfile } from "./user.contract";

export function mapUserDtoToDomain(dto: SupabaseUserRowDTO | null | undefined): UserProfile {
  if (!dto || typeof dto !== "object") {
    return {
      id: "",
      name: "",
      storeName: "",
      email: "",
      phone: "",
      region: "",
      district: "",
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      village: null,
      avatar: null,
      bio: "",
      status: "active",
      deletedAt: null,
      isDemo: false,
      createdAt: "",
      updatedAt: null,
    };
  }

  const name = String(dto.name || "").trim();
  const storeName = String(dto.storeName || dto.store_name || name).trim();
  const provinceCode = dto.provinceCode || dto.province_code || null;
  const regencyCode = dto.regencyCode || dto.regency_code || null;
  const districtCode = dto.districtCode || dto.district_code || null;
  const village = dto.village || null;
  const deletedAt = dto.deletedAt || dto.deleted_at || null;
  const isDemo = Boolean(dto.isDemo ?? dto.is_demo);
  const createdAt = String(dto.createdAt || dto.created_at || "");
  const updatedAt = dto.updatedAt || dto.updated_at || null;

  return {
    id: String(dto.id || ""),
    name,
    storeName,
    email: String(dto.email || "").trim(),
    phone: String(dto.phone || "").trim(),
    region: String(dto.region || "").trim(),
    district: String(dto.district || "").trim(),
    provinceCode,
    regencyCode,
    districtCode,
    village,
    avatar: dto.avatar ?? null,
    bio: String(dto.bio || "").trim(),
    status: String(dto.status || "active").toLowerCase(),
    deletedAt,
    isDemo,
    createdAt,
    updatedAt,
  };
}

export function mapDomainToUserUpdateDto(user: Partial<UserProfile>): UserProfileUpdateDTO {
  return {
    name: user.name,
    store_name: user.storeName,
    phone: user.phone,
    region: user.region,
    district: user.district,
    province_code: user.provinceCode,
    regency_code: user.regencyCode,
    district_code: user.districtCode,
    village: user.village,
    avatar: user.avatar,
    bio: user.bio,
  };
}

export function extractSellerProfile(user: UserProfile | SupabaseUserRowDTO): SellerProfile {
  const domainUser = "storeName" in user && typeof user.storeName === "string" 
    ? (user as UserProfile) 
    : mapUserDtoToDomain(user as SupabaseUserRowDTO);

  return {
    id: domainUser.id,
    name: domainUser.name,
    storeName: domainUser.storeName || domainUser.name,
    phone: domainUser.phone,
    avatar: domainUser.avatar,
    region: domainUser.region,
    district: domainUser.district,
  };
}
