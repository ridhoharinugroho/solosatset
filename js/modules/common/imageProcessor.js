/**
 * Pemrosesan gambar presisi rasio 1:1 persegi dengan pemotongan tengah (center-crop)
 * dan kompresi JPEG kualitas ~0.8 untuk mereduksi ukuran file dari HP.
 * @param {File} file - File gambar yang diunggah
 * @returns {Promise<string>} Data URL base64 gambar yang telah diproses
 */
export function processSquareImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("File yang diunggah harus berupa gambar (JPG, PNG, WEBP)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak valid atau rusak."));
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const minDim = Math.min(naturalW, naturalH);
        const startX = (naturalW - minDim) / 2;
        const startY = (naturalH - minDim) / 2;

        const targetSize = Math.min(1000, minDim);
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        console.log(`[processSquareImage] Foto diproses ke 1:1 Persegi (${targetSize}x${targetSize}px, Quality 0.8)`);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (typeof window !== "undefined") {
  window.processSquareImage = processSquareImage;
}
