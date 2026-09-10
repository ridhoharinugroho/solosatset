/**
 * filterMeta.js
 * Konstanta metadata untuk pilihan filter: wilayah, kategori, kondisi.
 * Dipecah dari filterController.js untuk pemerataan beban kerja.
 */

export const FILTER_REGION_META = {
  'all': { name: 'Semua Wilayah Solo Raya', icon: 'map-pin' },
  'solo': { name: 'Kota Solo (Surakarta)', icon: 'map-pin' },
  'karanganyar': { name: 'Kab. Karanganyar', icon: 'map-pin' },
  'sukoharjo': { name: 'Kab. Sukoharjo', icon: 'map-pin' },
  'wonogiri': { name: 'Kab. Wonogiri', icon: 'map-pin' },
  'sragen': { name: 'Kab. Sragen', icon: 'map-pin' },
  'boyolali': { name: 'Kab. Boyolali', icon: 'map-pin' },
  'klaten': { name: 'Kab. Klaten', icon: 'map-pin' }
};

export const FILTER_CATEGORY_META = {
  'all': { name: 'Semua Kategori', icon: 'grid' },
  'elektronik': { name: 'Elektronik & Gadget', icon: 'smartphone' },
  'kendaraan': { name: 'Kendaraan & Otomotif', icon: 'bike' },
  'perabot': { name: 'Perabot & Rumah Tangga', icon: 'armchair' },
  'pakaian': { name: 'Pakaian & Aksesoris', icon: 'shirt' },
  'kuliner': { name: 'Makanan & Minuman', icon: 'utensils' },
  'bayi-anak': { name: 'Perlengkapan Bayi & Anak', icon: 'baby' },
  'pertukangan': { name: 'Pertukangan / Bahan Bangunan', icon: 'hammer' },
  'hobi': { name: 'Hobi, Musik & Olahraga', icon: 'trophy' },
  'hewan': { name: 'Hewan & Perlengkapan', icon: 'cat' },
  'alat-sekolah': { name: 'Peralatan Sekolah', icon: 'book-open' },
  'perawatan-diri': { name: 'Perawatan Diri', icon: 'sparkles' },
  'properti': { name: 'Properti', icon: 'building-2' },
  'jasa': { name: 'Jasa', icon: 'wrench' },
  'lainnya': { name: 'Lain-lain / Aneka Barang', icon: 'package' }
};

export const FILTER_CONDITION_META = {
  'all': { name: 'Semua Kondisi', icon: 'layers' },
  'new': { name: 'Baru (Gres / Segel)', icon: 'sparkles' },
  'like_new': { name: 'Bekas - Seperti Baru', icon: 'gem' },
  'good': { name: 'Bekas - Mulus / Normal', icon: 'check-circle-2' },
  'fair': { name: 'Bekas - Wajar Pemakaian', icon: 'clock' },
  'repair': { name: 'Bekas - Butuh Servis / Bahan', icon: 'wrench' }
};
