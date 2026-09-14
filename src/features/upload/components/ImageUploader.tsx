import React from "react";

export interface ImageUploaderProps {
  images: string[];
  onAddImages: (urls: string[]) => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
  error?: string | null;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],
  onAddImages,
  onRemoveImage,
  maxImages = 5,
  error = null,
  className = "",
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<string>[] = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      onAddImages(dataUrls);
      e.target.value = "";
    });
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label className="block text-xs font-semibold text-gray-700">
        Foto Produk ({images.length}/{maxImages})
      </label>

      {error && (
        <p className="text-xs text-red-600 font-medium">⚠️ {error}</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {/* Existing Image Thumbnails */}
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
            <img src={img} alt={`Foto produk ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveImage(idx)}
              title="Hapus foto"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
            >
              ✕
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold backdrop-blur-xs">
                Utama
              </span>
            )}
          </div>
        ))}

        {/* Add Image Button Input */}
        {images.length < maxImages && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-red-600">
            <span className="text-xl font-bold">+</span>
            <span className="text-[10px] font-semibold mt-1">Upload Foto</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};
