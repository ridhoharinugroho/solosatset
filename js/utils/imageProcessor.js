  // eslint-disable-next-line no-unused-vars
import { showToast } from "./modalRouter.js";

export function processSquareImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File yang diunggah harus berupa gambar (JPG, PNG, WEBP)."));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar dari perangkat."));
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
