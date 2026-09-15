import React from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import type { UserProfile } from "../../../domain/user/user.contract";
import { useListingForm, UseListingFormProps } from "../hooks/useListingForm";
import { Button } from "../../../components/ui/Button";
import { ImageUploader } from "../../upload/components/ImageUploader";
import { CategoryPicker } from "../../search-filter/components/CategoryPicker";
import { LocationPicker } from "../../search-filter/components/LocationPicker";

export interface ListingFormProps extends UseListingFormProps {
  initialListing?: ListingModel | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  className?: string;
}

export const ListingForm: React.FC<ListingFormProps> = ({
  initialListing,
  currentUser,
  onSaveSubmit,
  onClose,
  className = "",
}) => {
  const isEditMode = Boolean(initialListing?.id);

  const {
    title,
    description,
    price,
    category,
    condition,
    negoType,
    paymentMethod,
    provinceCode,
    regencyCode,
    regionId,
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
    setRegionId,
    setCodPoint,
    setIsBu,
    addImages,
    removeImage,
    handleSubmit,
  } = useListingForm({ initialListing, currentUser, onSaveSubmit });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmit();
    if (ok) onClose();
  };

  return (
    <form onSubmit={onSubmit} className={`space-y-4 text-left ${className}`.trim()}>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">
          {isEditMode ? "Edit Barang Jualan" : "Pasang Iklan Barang Baru"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Image Uploader */}
      <ImageUploader
        images={images}
        onAddImages={addImages}
        onRemoveImage={removeImage}
        maxImages={5}
      />

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Judul Barang *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: iPhone 13 Pro 128GB Mulus Fullset"
          required
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Price & BU Checkbox */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Harga (Rp) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="500000"
            required
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-end pb-2">
          <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200 w-full">
            <input
              type="checkbox"
              checked={isBu}
              onChange={(e) => setIsBu(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span>Label Butuh Uang (BU)</span>
          </label>
        </div>
      </div>

      {/* Category & Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Kategori
          </label>
          <CategoryPicker
            selectedCategory={category}
            onChange={setCategory}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Kondisi Barang
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          >
            <option value="new">Baru</option>
            <option value="like_new">Seperti Baru</option>
            <option value="good">Bagus (Mulus)</option>
            <option value="fair">Cukup (Ada Minus)</option>
          </select>
        </div>
      </div>

      {/* Nego & Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Status Nego
          </label>
          <select
            value={negoType}
            onChange={(e) => setNegoType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          >
            <option value="pass font-bold">Harga Pas (Nett)</option>
            <option value="nego_alus">Nego Alus</option>
            <option value="free">Gratis</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Metode Pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          >
            <option value="cod">COD (Bayar di Tempat)</option>
            <option value="transfer">Transfer Bank</option>
            <option value="qris">QRIS</option>
            <option value="bebas">Bebas</option>
          </select>
        </div>
      </div>

      {/* BPS Location & COD Point */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          Lokasi COD & Wilayah Terdekat
        </label>
        <LocationPicker
          provinceCode={provinceCode}
          regencyCode={regencyCode}
          regionId={regionId}
          onProvinceChange={setProvinceCode}
          onRegencyChange={setRegencyCode}
          onRegionIdChange={setRegionId}
        />
        <input
          type="text"
          value={codPoint}
          onChange={(e) => setCodPoint(e.target.value)}
          placeholder="Patokan Titik COD (Contoh: Depan Solo Grand Mall)"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Deskripsi Lengkap
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Jelaskan kondisi barang, kelengkapan, garansi, atau minus..."
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || !title.trim() || !price}
          className="px-5 font-bold"
        >
          {isLoading ? "Memproses..." : isEditMode ? "Simpan Perubahan" : "Pasang Iklan"}
        </Button>
      </div>
    </form>
  );
};
