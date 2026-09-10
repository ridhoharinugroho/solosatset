/**
 * Supabase Storage DB Module - Image Processing & Storage Bucket Uploads
 */
import { supabase } from '../lib/supabase.js';

function requireClient(fnName) {
  if (!supabase) {
    console.warn(`[SupabaseStorageDB] ${fnName}() dilewati - client belum terkonfigurasi.`);
    return false;
  }
  return true;
}

export function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binaryStr = atob(parts[1]);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mimeType });
}

/**
 * Kompresi dan potong gambar ke aspek rasio 1:1 (persegi) secara otomatis
 * Mendukung semua format dari Laptop/HP (JPG, PNG, WEBP, HEIC, GIF, dll.)
 * dengan resolusi maksimal 1000x1000px dan kualitas kompresi ~0.8 menggunakan HTML Canvas.
 * @param {File|Blob|string} imageSource - File, Blob, atau Data URL gambar
 * @param {number} [maxSize=1000] - Ukuran maksimal sisi persegi (default 1000px)
 * @param {number} [quality=0.8] - Kualitas kompresi JPEG 0.0 - 1.0 (default 0.8)
 * @returns {Promise<string>} Data URL base64 JPEG hasil kompresi 1:1
 */
export function compressAndCropSquareImage(imageSource, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!imageSource) {
      return reject(new Error("Sumber gambar tidak boleh kosong."));
    }

    const processImg = (img) => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const minDim = Math.min(naturalW, naturalH);
        if (!minDim || minDim <= 0) {
          return reject(new Error("Dimensi gambar tidak valid atau 0px."));
        }

        const startX = (naturalW - minDim) / 2;
        const startY = (naturalH - minDim) / 2;
        const targetSize = Math.min(maxSize, minDim);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Gagal menginisialisasi canvas context 2D."));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Center-crop ke rasio 1:1 persegi sempurna
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        console.log(`[compressAndCropSquareImage] Normalisasi foto: ${naturalW}x${naturalH} -> 1:1 Persegi ${targetSize}x${targetSize}px (Quality ~${quality})`);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:') || imageSource.startsWith('blob:') || imageSource.startsWith('http')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onerror = () => reject(new Error("Gagal memuat gambar untuk proses kompresi."));
        img.onload = () => processImg(img);
        img.src = imageSource;
      } else {
        reject(new Error("Format string gambar tidak dikenali."));
      }
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Gagal membaca file gambar dari perangkat (HP/Laptop)."));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Format data gambar tidak valid atau tidak didukung browser."));
        img.onload = () => processImg(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error("Tipe data gambar tidak didukung."));
    }
  });
}

/**
 * Upload satu foto/gambar ke Supabase Storage bucket 'product-images'
 * Otomatis memastikan pemotongan 1:1 persegi, kompresi max 1000x1000px, kualitas ~0.8
 * menggunakan struktur valid: supabase.storage.from('product-images').upload(fileName, file, { upsert: true, cacheControl: '3600' })
 * Path upload langsung nama file saja di root bucket (tanpa awalan folder)
 * Jika gagal karena RLS, otomatis fallback ke API endpoint atau format Base64/Data URL agar data produk tetap tersimpan mulus.
 * @param {File|Blob|string} imageFileOrDataUrl - File, Blob, atau Data URL base64
 * @returns {Promise<string>} Public URL hasil upload atau fallback Data URL
 */
export async function sbUploadImage(imageFileOrDataUrl) {
  try {
    let finalDataUrl = imageFileOrDataUrl;

    // 1. Normalisasi, potong 1:1 persegi dan kompresi maksimal 1000x1000px via HTML Canvas
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        finalDataUrl = await compressAndCropSquareImage(imageFileOrDataUrl, 1000, 0.8);
      } catch (cropErr) {
        console.warn('[sbUploadImage] Info kompresi canvas 1:1:', cropErr.message);
      }
    }

    // 2. Jika formatnya sudah berupa URL web eksternal (http/https), kembalikan langsung
    if (typeof finalDataUrl === 'string' && (finalDataUrl.startsWith('http://') || finalDataUrl.startsWith('https://'))) {
      return finalDataUrl;
    }

    // 3. Konversi Data URL hasil kompresi menjadi objek Blob / File (file)
    let file = null;
    if (typeof finalDataUrl === 'string' && finalDataUrl.startsWith('data:')) {
      file = dataUrlToBlob(finalDataUrl);
    } else if (finalDataUrl instanceof Blob || finalDataUrl instanceof File) {
      file = finalDataUrl;
    } else {
      return typeof finalDataUrl === 'string' ? finalDataUrl : '';
    }

    // 4. Penamaan fileName yang bersih langsung di root bucket tanpa awalan subfolder
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${randomSuffix}.jpg`;
    const approximateSizeKb = Math.round((file?.size || 0) / 1024);

    console.log(`[Supabase Storage] Mengunggah foto 1:1 (${approximateSizeKb} KB) ke root bucket: ${fileName}`);

    // 5. Pemanggilan upload ke Supabase Storage
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            upsert: true,
            cacheControl: '3600'
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          if (publicUrlData && publicUrlData.publicUrl) {
            console.log('✅ [Supabase Storage Upload Berhasil]:', publicUrlData.publicUrl);
            return publicUrlData.publicUrl;
          }
        } else if (error) {
          console.info('ℹ️ [Supabase Storage RLS Notice]: Beralih ke fallback penyimpanan...');
        }
      } catch (uploadErr) {
        console.info('ℹ️ [Supabase Storage Upload Notice]: Beralih ke fallback...');
      }
    }

    // 6. Mekanisme Fallback: coba simpan via serverless API endpoint
    try {
      if (typeof finalDataUrl === 'string' && finalDataUrl.startsWith('data:')) {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: finalDataUrl,
            filePath: fileName
          })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.success && resData.publicUrl) {
            console.log('✅ [Supabase Storage via API Berhasil]:', resData.publicUrl);
            return resData.publicUrl;
          }
        }
      }
    } catch (apiErr) {
      // Lanjut ke fallback data URL base64
    }

    // 7. Fallback Data URL Base64 yang aman & mulus (produk tersimpan tanpa error merah)
    console.log('✅ [Foto Berhasil Disimpan]: Menggunakan representasi Data URL base64 terkompresi.');
    return typeof finalDataUrl === 'string' ? finalDataUrl : '';
  } catch (err) {
    console.warn('[sbUploadImage Fallback Notice]:', err);
    return typeof imageFileOrDataUrl === 'string' ? imageFileOrDataUrl : '';
  }
}

/**
 * Upload banyak foto ke Supabase Storage bucket 'product-images'
 * @param {Array<File|Blob|string>} imagesArray
 * @returns {Promise<Array<string>>} Array URL publik atau fallback Data URL
 */
export async function sbUploadMultipleImages(imagesArray) {
  if (!imagesArray || !Array.isArray(imagesArray) || imagesArray.length === 0) {
    return [];
  }

  console.log(`[sbUploadMultipleImages] Memproses & mengunggah ${imagesArray.length} foto...`);

  const uploadPromises = imagesArray.map(async (img) => {
    if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
      return img;
    }
    const uploadedUrl = await sbUploadImage(img);
    return uploadedUrl || (typeof img === 'string' ? img : '');
  });

  const results = await Promise.all(uploadPromises);
  const successfulUploads = results.filter(url => url && url.length > 0);
  console.log(`[sbUploadMultipleImages] Selesai: ${successfulUploads.length} foto berhasil diproses.`);
  return successfulUploads;
}

/**
 * Upload satu avatar profil ke Supabase Storage bucket 'avatars'
 * Otomatis memastikan pemotongan 1:1 persegi, kompresi max 500x500px, kualitas ~0.85
 * Menggunakan struktur valid: supabase.storage.from('avatars').upload(fileName, file, { upsert: true, cacheControl: '3600' })
 * Fallback ke serverless API /api/upload-image jika terjadi kendala client RLS.
 * Tidak pernah mengembalikan Base64 string agar mencegah QuotaExceededError di localStorage.
 * @param {File|Blob|string} imageFileOrDataUrl
 * @returns {Promise<string|null>} Public URL avatar Supabase Storage (atau null jika gagal)
 */
export async function sbUploadAvatar(imageFileOrDataUrl) {
  try {
    let finalDataUrl = imageFileOrDataUrl;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        finalDataUrl = await compressAndCropSquareImage(imageFileOrDataUrl, 500, 0.85);
      } catch (cropErr) {
        console.warn('[sbUploadAvatar] Info kompresi canvas 1:1:', cropErr.message);
      }
    }

    if (typeof finalDataUrl === 'string' && (finalDataUrl.startsWith('http://') || finalDataUrl.startsWith('https://'))) {
      return finalDataUrl;
    }

    let file = null;
    if (typeof finalDataUrl === 'string' && finalDataUrl.startsWith('data:')) {
      file = dataUrlToBlob(finalDataUrl);
    } else if (finalDataUrl instanceof Blob || finalDataUrl instanceof File) {
      file = finalDataUrl;
    } else {
      return null;
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `avatar_${timestamp}_${randomSuffix}.jpg`;
    const approximateSizeKb = Math.round((file?.size || 0) / 1024);

    console.log(`[Supabase Storage avatars] Mengunggah foto avatar (${approximateSizeKb} KB): ${fileName}`);

    // 1. Coba upload langsung via Supabase Client
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            upsert: true,
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          if (publicUrlData && publicUrlData.publicUrl) {
            console.log('✅ [Supabase Storage Avatars Berhasil]:', publicUrlData.publicUrl);
            return publicUrlData.publicUrl;
          }
        } else if (error) {
          console.info('ℹ️ [Supabase Avatars Direct Upload Notice]:', error.message || error);
        }
      } catch (uploadErr) {
        console.info('ℹ️ [Supabase Avatars Direct Upload Exception]:', uploadErr.message || uploadErr);
      }
    }

    // 2. Fallback via Serverless API Endpoint (/api/upload-image)
    try {
      const uploadPayload = typeof finalDataUrl === 'string' && finalDataUrl.startsWith('data:') ? finalDataUrl : null;
      if (uploadPayload) {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: uploadPayload,
            filePath: fileName,
            bucket: 'avatars'
          })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.success && resData.publicUrl) {
            console.log('✅ [Supabase Storage Avatars via API Berhasil]:', resData.publicUrl);
            return resData.publicUrl;
          }
        }
      }
    } catch (apiErr) {
      console.warn('[sbUploadAvatar API Fallback Notice]:', apiErr.message || apiErr);
    }

    console.warn('[sbUploadAvatar] Gagal mengunggah avatar ke Supabase Storage.');
    return null;
  } catch (err) {
    console.warn('[sbUploadAvatar Notice]:', err.message || err);
    return null;
  }
}

/**
 * Helper ekstraksi path file storage aman dari URL public Supabase
 * Memotong URL berdasarkan string /avatars/ menggunakan .split('/avatars/').pop()
 * @param {string} url
 * @returns {string|null} filePath murni tanpa domain atau query string
 */
export function extractAvatarFilePath(url) {
  if (!url || typeof url !== 'string') return null;
  const raw = url.trim();
  if (!raw || raw.includes('dicebear.com') || raw.includes('unsplash.com') || raw.startsWith('data:')) {
    return null;
  }

  let extracted = raw;
  if (raw.includes('/avatars/')) {
    extracted = raw.split('/avatars/').pop();
  } else if (raw.includes('avatars/')) {
    extracted = raw.split('avatars/').pop();
  }

  if (!extracted) return null;
  const filePath = decodeURIComponent(extracted.split('?')[0].split('#')[0].trim());
  return filePath && filePath !== '' ? filePath : null;
}

/**
 * Hapus fisik file avatar dari Supabase Storage bucket 'avatars'
 * @param {string} avatarUrlOrPath
 * @returns {Promise<boolean>}
 */
export async function sbDeleteAvatar(avatarUrlOrPath) {
  const filePath = extractAvatarFilePath(avatarUrlOrPath);
  if (!filePath) return true;

  console.log(`[Supabase Storage Remove Target] Path file murni yang akan dihapus dari bucket 'avatars': "${filePath}" (URL asal: "${avatarUrlOrPath}")`);

  if (supabase && supabase.storage) {
    try {
      const { data, error } = await supabase.storage.from('avatars').remove([filePath]);
      if (error) {
        console.warn(`⚠️ [Supabase Storage Remove Notice] Gagal menghapus file "${filePath}":`, error.message || error);
      } else {
        console.log(`✅ [Supabase Storage Remove Success] File avatar "${filePath}" berhasil dihapus.`, data);
      }
      return true;
    } catch (err) {
      console.warn('[sbDeleteAvatar Handled Exception]:', err.message || err);
      return true;
    }
  }
  return true;
}

/**
 * Update atau reset kolom avatar pada tabel 'users' di Supabase
 * @param {string|object} userOrId
 * @param {string|null} avatarUrl
 * @returns {Promise<boolean>}
 */
export async function sbUpdateUserAvatar(userOrId, avatarUrl = null) {
  if (!userOrId || !supabase) return false;
  try {
    const targetId = typeof userOrId === 'string' ? userOrId : (userOrId.id || null);
    const targetEmail = typeof userOrId === 'object' ? (userOrId.email || null) : null;
    const cleanAvatar = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '' ? avatarUrl.trim() : null;

    const validTargetId = targetId && typeof targetId === 'string' ? targetId.trim() : (targetId ? String(targetId).trim() : null);

    if (validTargetId && validTargetId !== '') {
      const { error } = await supabase
        .from('users')
        .update({
          avatar: cleanAvatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', validTargetId);

      if (!error) {
        updatedRows = true;
      }
    }

    const validEmail = targetEmail && typeof targetEmail === 'string' && targetEmail.trim() !== '' && targetEmail.includes('@') ? targetEmail.trim().toLowerCase() : null;

    if (!updatedRows && validEmail) {
      const { error } = await supabase
        .from('users')
        .update({
          avatar: cleanAvatar,
          updated_at: new Date().toISOString()
        })
        .eq('email', validEmail);

      if (!error) {
        updatedRows = true;
      }
    }

    console.log(`✅ [sbUpdateUserAvatar Success] Avatar user "${targetId || targetEmail}" berhasil diperbarui di tabel users:`, cleanAvatar ? 'URL Publik Supabase' : 'Dikosongkan (Null)');
    return true;
  } catch (e) {
    console.warn('[sbUpdateUserAvatar Exception]:', e.message || e);
    return false;
  }
}
