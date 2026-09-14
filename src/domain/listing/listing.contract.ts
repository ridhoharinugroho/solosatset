export type NegoType = "pass" | "nego_alus" | "free" | string;
export type PaymentMethod = "cod" | "transfer" | "qris" | "bebas" | string;
export type ListingCondition = "new" | "like_new" | "good" | "fair" | string;
export type ListingStatus = "active" | "sold" | "archived" | "deleted" | string;

export interface ListingSeller {
  id: string;
  name: string;
  storeName: string;
  phone: string;
  avatar: string | null;
}

export interface ListingModel {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  negoType: NegoType;
  paymentMethod: PaymentMethod;
  regionId: string;
  district: string;
  provinceCode: string | null;
  regencyCode: string | null;
  districtCode: string | null;
  village: string | null;
  codPoint: string;
  storeMapsUrl: string;
  seller: ListingSeller;
  images: string[];
  status: ListingStatus;
  isBu: boolean;
  buExpiresAt: string | null;
  isQrisVerified: boolean;
  views: number;
  createdAt: string;
  updatedAt: string | null;
}
