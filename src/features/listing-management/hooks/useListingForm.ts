import { useState, useCallback, useEffect } from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { UserProfile } from "../../../domain/user/user.contract";
import { useImageUpload } from "../../upload/hooks/useImageUpload";

export interface UseListingFormProps {
  initialListing?: ListingModel | null;
  currentUser?: UserProfile | null;
  onSaveSubmit?: (listingData: Partial<ListingModel>) => Promise<boolean>;
}

export function useListingForm({
  initialListing = null,
  currentUser = null,
  onSaveSubmit,
}: UseListingFormProps = {}) {
  const [title, setTitle] = useState(initialListing?.title || "");
  const [description, setDescription] = useState(initialListing?.description || "");
  const [price, setPrice] = useState<number | string>(initialListing?.price ?? "");
  const [category, setCategory] = useState(initialListing?.category || "Elektronik");
  const [condition, setCondition] = useState(initialListing?.condition || "good");
  const [negoType, setNegoType] = useState(initialListing?.negoType || "pass");
  const [paymentMethod, setPaymentMethod] = useState(initialListing?.paymentMethod || "cod");
  const [provinceCode, setProvinceCode] = useState<string | null>(initialListing?.provinceCode || null);
  const [regencyCode, setRegencyCode] = useState<string | null>(initialListing?.regencyCode || null);
  const [districtCode, setDistrictCode] = useState<string | null>(initialListing?.districtCode || null);
  const [village, setVillage] = useState<string | null>(initialListing?.village || null);
  const [regionId, setRegionId] = useState<string>(initialListing?.regionId || "solo");
  const [district, setDistrict] = useState<string>(initialListing?.district || "");
  const [codPoint, setCodPoint] = useState(initialListing?.codPoint || "");
  const [isBu, setIsBu] = useState<boolean>(initialListing?.isBu || false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { images, addImages, removeImage, setAllImages } = useImageUpload({
    initialImages: initialListing?.images || [],
    maxImages: 5,
  });

  useEffect(() => {
    if (initialListing) {
      setTitle(initialListing.title || "");
      setDescription(initialListing.description || "");
      setPrice(initialListing.price ?? "");
      setCategory(initialListing.category || "Elektronik");
      setCondition(initialListing.condition || "good");
      setNegoType(initialListing.negoType || "pass");
      setPaymentMethod(initialListing.paymentMethod || "cod");
      setProvinceCode(initialListing.provinceCode || null);
      setRegencyCode(initialListing.regencyCode || null);
      setDistrictCode(initialListing.districtCode || null);
      setVillage(initialListing.village || null);
      setRegionId(initialListing.regionId || "solo");
      setDistrict(initialListing.district || "");
      setCodPoint(initialListing.codPoint || "");
      setIsBu(initialListing.isBu || false);
      setAllImages(initialListing.images || []);
    }
  }, [initialListing, setAllImages]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!title.trim() || !price || !currentUser) {
      setError("Judul barang, harga, dan sesi penjual wajib diisi.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    const payload: Partial<ListingModel> = {
      id: initialListing?.id || `lst-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      category,
      condition,
      negoType,
      paymentMethod,
      provinceCode,
      regencyCode,
      districtCode,
      village,
      regionId,
      district,
      codPoint,
      isBu,
      images,
      seller: {
        id: currentUser.id,
        name: currentUser.name,
        storeName: currentUser.storeName || currentUser.name,
        phone: currentUser.phone,
        avatar: currentUser.avatar,
      },
      status: initialListing?.status || "active",
    };

    try {
      if (onSaveSubmit) {
        const ok = await onSaveSubmit(payload);
        setIsLoading(false);
        return ok;
      }
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan barang.");
      setIsLoading(false);
      return false;
    }
  }, [
    title,
    description,
    price,
    category,
    condition,
    negoType,
    paymentMethod,
    provinceCode,
    regencyCode,
    districtCode,
    village,
    regionId,
    district,
    codPoint,
    isBu,
    images,
    currentUser,
    initialListing,
    onSaveSubmit,
  ]);

  return {
    title,
    description,
    price,
    category,
    condition,
    negoType,
    paymentMethod,
    provinceCode,
    regencyCode,
    districtCode,
    village,
    regionId,
    district,
    codPoint,
    isBu,
    images,
    isLoading,
    error,
    setTitle,
    setDescription,
    setPrice,
    setCategory,
    setCondition,
    setNegoType,
    setPaymentMethod,
    setProvinceCode,
    setRegencyCode,
    setDistrictCode,
    setVillage,
    setRegionId,
    setDistrict,
    setCodPoint,
    setIsBu,
    addImages,
    removeImage,
    handleSubmit,
  };
}
