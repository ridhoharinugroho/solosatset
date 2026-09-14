export interface UserProfile {
  id: string;
  name: string;
  storeName: string;
  email: string;
  phone: string;
  region: string;
  district: string;
  provinceCode: string | null;
  regencyCode: string | null;
  districtCode: string | null;
  village: string | null;
  avatar: string | null;
  bio: string;
  status: "active" | "suspended" | "deleted" | string;
  deletedAt: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SellerProfile {
  id: string;
  name: string;
  storeName: string;
  phone: string;
  avatar: string | null;
  region: string;
  district: string;
}
