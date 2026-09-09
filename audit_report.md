# 📋 Audit Laporan: `app.js` & `toko-saya.js`

---

## 🔎 Ringkasan Statistik
| Metrik | **app.js** | **toko-saya.js** |
|--------|------------|-------------------|
| **Total baris** | 8 216 | 3 041 |
| **Fungsi total** | 120 | 37 |
| **Fungsi terbesar** | `initEventListeners` – 1 150 baris | `initEventListeners` – 578 baris |
| **Baris dalam fungsi** | 7 747 (94 % dari total) | 2 786 (92 % dari total) |
| **Duplikasi kode** | 30 fungsi identik dengan `toko-saya.js` | 30 fungsi identik dengan `app.js` |
| **Baris persis sama** | – | 1 625 baris (53 % dari `toko-saya.js`) |

---

## ❗ Penyebab Utama Pembengkakan
1. **Monolitik (God File)** – Semua logika UI, auth, storage, editor, notifikasi, dll. berada di satu file.
2. **Fungsi Raksasa** – Lebih dari 100 baris per fungsi, contohnya `initEventListeners`, `renderListings`, `openProductDetail`.
3. **Duplikasi kode** – 30 fungsi sama disalin ke `toko-saya.js`; lebih dari setengah baris `toko‑saya.js` merupakan copy‑paste.
4. **Tidak ada lazy‑load** – Modul admin/editor dimuat pada setiap halaman.
5. **Inline HTML dalam template literals** – Membuat parser JavaScript memuat ratusan baris markup sekaligus.
6. **Banyak `try / catch`** – Menambah baris tanpa menambah fungsionalitas.

---

## 🚀 Rekomendasi Perbaikan (Roadmap)
### 1️⃣ Modularisasi & Pemisahan Concern
- Buat folder `js/modules/` dengan sub‑folder:
  - `common/` – `modalManager.js`, `toast.js`, `imagePicker.js`
  - `profile/` – `profileController.js`
  - `listings/` – `listingFormModal.js`, `productDetailModal.js`, `listingsFeed.js`
  - `filter/` – `filterController.js`
  - `reviews/` – `sellerReviews.js`, `appReviews.js`
  - `notifications/` – `notificationsCenter.js`
  - `editor/` – `liveVisualEditor.js`
  - `ui/` – `heroCarousel.js`
- Setiap modul **export** fungsi yang diperlukan dan **import** hanya yang dipakai.

### 2️⃣ Lazy‑load Modul Berat
```js
if (window.location.search.includes('mode=admin_editor')) {
  import('./modules/editor/liveVisualEditor.js').then(m => m.initLiveVisualEditor());
}
```
- Memungkinkan halaman utama hanya memuat ~150 baris bootstrap.

### 3️⃣ Hapus Duplikasi
- Semua fungsi yang terdapat di kedua file dipindahkan ke modul **common** atau **profile/listings**.
- `toko-saya.js` menjadi **thin wrapper** yang hanya meng‑import modul yang diperlukan.

### 4️⃣ Refactor Fungsi Besar
- Bagi `initEventListeners` menjadi grup listener per fitur (search, filter, modal, carousel, dll.).
- Bagi `renderListings` menjadi `renderGrid`, `renderSkeleton`, `renderEmptyState`.
- Setiap sub‑fungsi < 100 baris, memudahkan unit‑test.

### 5️⃣ Tambahkan Unit Test & Linting
- Jest + @testing-library/dom untuk UI.
- ESLint + Prettier (aturan `max-lines-per-function: 100`).

### 6️⃣ Optimasi Build
- Gunakan **Vite** (atau esbuild) untuk tree‑shaking & code‑splitting.
- `npm run build` menghasilkan bundle < 150 KB (gzip) untuk front‑end.

---

## 📦 Implementasi Awal (Tahap 1)
1. **Ekstrak modul common** (`modalManager.js`, `toast.js`, `imagePicker.js`).
2. **Ubah `toko-saya.js`** menjadi:
   ```js
   import { initEventListeners } from './modules/common/modalManager.js';
   import { showToast } from './modules/common/toast.js';
   // …import fungsi lain yang dibutuhkan
   initTokoSayaPage();
   ```
3. **Commit** perubahan kecil, jalankan aplikasi, pastikan tidak ada regressi.

---

## 📑 Referensi File
- **app.js** – `file:///c:/Users/Thinkpad%20T470/Documents/GitHub/solosatset/js/app.js`
- **toko-saya.js** – `file:///c:/Users/Thinkpad%20T470/Documents/GitHub/solosatset/js/toko-saya.js`

---

*Dokumen ini dibuat sebagai artefak audit untuk tim pengembangan. Silakan tinjau, beri persetujuan, dan lanjutkan ke tahapan implementasi.*
