import type { SupabaseListingRowDTO, ListingCreateDTO } from "./listing.dto";
import type { ListingModel, ListingSeller } from "./listing.contract";

export function mapListingDtoToDomain(dto: SupabaseListingRowDTO | null | undefined): ListingModel {
  if (!dto || typeof dto !== "object") {
    return {
      id: "",
      title: "",
      description: "",
      price: 0,
      category: "Lainnya",
      condition: "good",
      negoType: "pass",
      paymentMethod: "cod",
      regionId: "",
      district: "",
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      village: null,
      codPoint: "",
      storeMapsUrl: "",
      seller: {
        id: "",
        name: "Penjual",
        storeName: "Penjual",
        phone: "",
        avatar: null,
      },
      images: [],
      status: "active",
      isBu: false,
      buExpiresAt: null,
      isQrisVerified: false,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
  }

  const sellerId = String(dto.seller?.id || dto.seller_id || dto.sellerId || "");
  const sellerName = String(dto.seller?.name || dto.seller_name || dto.sellerName || "Penjual");
  const storeName = String(dto.seller?.storeName || sellerName);
  const sellerPhone = String(dto.seller?.phone || dto.seller_phone || dto.sellerPhone || "");
  const sellerAvatar = dto.seller?.avatar || dto.seller_avatar || dto.sellerAvatar || null;

  const seller: ListingSeller = {
    id: sellerId,
    name: sellerName,
    storeName,
    phone: sellerPhone,
    avatar: sellerAvatar,
  };

  const negoType = String(dto.negoType || dto.nego_type || "pass");
  const paymentMethod = String(dto.paymentMethod || dto.payment_method || "cod");
  const regionId = String(dto.regionId || dto.region || "");
  const provinceCode = dto.provinceCode || dto.province_code || null;
  const regencyCode = dto.regencyCode || dto.regency_code || null;
  const districtCode = dto.districtCode || dto.district_code || null;
  const village = dto.village || null;
  const codPoint = String(dto.codPoint || dto.cod_point || "");
  const storeMapsUrl = String(dto.storeMapsUrl || dto.store_maps_url || "");

  const isBu = Boolean(dto.isBu ?? dto.is_bu);
  const buExpiresAt = isBu ? (dto.buExpiresAt || dto.bu_expires_at || null) : null;
  const isQrisVerified = Boolean(dto.isQrisVerified ?? dto.qris_verified);
  const views = Number(dto.views) || 0;
  const createdAt = String(dto.createdAt || dto.created_at || new Date().toISOString());
  const updatedAt = dto.updatedAt || dto.updated_at || null;

  return {
    id: String(dto.id || ""),
    title: String(dto.title || "").trim(),
    description: String(dto.description || "").trim(),
    price: Number(dto.price) || 0,
    category: String(dto.category || "Lainnya"),
    condition: String(dto.condition || "good"),
    negoType,
    paymentMethod,
    regionId,
    district: String(dto.district || "").trim(),
    provinceCode,
    regencyCode,
    districtCode,
    village,
    codPoint,
    storeMapsUrl,
    seller,
    images: Array.isArray(dto.images) ? dto.images : [],
    status: String(dto.status || "active").toLowerCase(),
    isBu,
    buExpiresAt,
    isQrisVerified,
    views,
    createdAt,
    updatedAt,
  };
}

export function mapDomainToListingCreateDto(listing: ListingModel): ListingCreateDTO {
  return {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    nego_type: listing.negoType,
    payment_method: listing.paymentMethod,
    region: listing.regionId,
    district: listing.district,
    province_code: listing.provinceCode,
    regency_code: listing.regencyCode,
    district_code: listing.districtCode,
    village: listing.village,
    cod_point: listing.codPoint,
    store_maps_url: listing.storeMapsUrl,
    seller_id: listing.seller.id,
    seller_name: listing.seller.storeName || listing.seller.name,
    seller_phone: listing.seller.phone,
    seller_avatar: listing.seller.avatar || undefined,
    images: listing.images,
    is_bu: listing.isBu,
    bu_expires_at: listing.buExpiresAt,
  };
}
