import { useState, useCallback } from "react";

export interface UseImageUploadProps {
  initialImages?: string[];
  maxImages?: number;
}

export function useImageUpload({ initialImages = [], maxImages = 5 }: UseImageUploadProps = {}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback(
    (newImageUrls: string[]) => {
      setError(null);
      setImages((prev) => {
        const combined = [...prev, ...newImageUrls];
        if (combined.length > maxImages) {
          setError(`Maksimal ${maxImages} foto produk.`);
          return combined.slice(0, maxImages);
        }
        return combined;
      });
    },
    [maxImages]
  );

  const removeImage = useCallback((index: number) => {
    setError(null);
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearImages = useCallback(() => {
    setError(null);
    setImages([]);
  }, []);

  const setAllImages = useCallback((newImages: string[]) => {
    setError(null);
    setImages(newImages.slice(0, maxImages));
  }, [maxImages]);

  return {
    images,
    error,
    addImages,
    removeImage,
    clearImages,
    setAllImages,
  };
}
