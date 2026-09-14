import React from "react";

export interface ListingGalleryProps {
  images: string[];
  title: string;
  activeIndex: number;
  onImageSelect: (index: number) => void;
  className?: string;
}

export const ListingGallery: React.FC<ListingGalleryProps> = ({
  images = [],
  title,
  activeIndex = 0,
  onImageSelect,
  className = "",
}) => {
  const displayImages =
    images && images.length > 0
      ? images
      : ["https://via.placeholder.com/600x400?text=SOPALOKA"];

  const currentImage = displayImages[activeIndex] || displayImages[0];

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {/* Main Large Image */}
      <div className="relative aspect-4/3 w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
        <img
          src={currentImage}
          alt={`${title} - foto ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
            {activeIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onImageSelect(idx)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                idx === activeIndex
                  ? "border-red-600 ring-2 ring-red-500/20"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
