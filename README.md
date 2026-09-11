# solosatset - Pusat Jual Beli Solo Raya 🛍️✨

Platform marketplace web barang skala regional berbasis komunitas terpercaya untuk **7 wilayah Solo Raya**:

- Kota Surakarta (Solo)
- Kabupaten Karanganyar
- Kabupaten Sukoharjo
- Kabupaten Wonogiri
- Kabupaten Sragen
- Kabupaten Boyolali
- Kabupaten Klaten

---

## 🌟 Fitur Utama

1. **Katalog Produk & Filter 7 Wilayah Solo Raya**:
   - Filter cepat berdasarkan wilayah kabupaten/kota dan kecamatan.
   - Filter berdasarkan kategori barang (_Elektronik, Kendaraan, Perabot, Pakaian, Hobi, Alat Usaha, dll._).
   - Filter rentang harga dan kondisi barang (_Like New, Mulus, Wajar Pemakaian, Butuh Servis_).
   - Pengurutan berdasarkan harga termurah/termahal, waktu unggah terbaru, dan paling banyak dilihat.

2. **Hubungi Penjual Langsung via WhatsApp (Instant CTA)**:
   - Integrasi langsung ke WhatsApp penjual dengan pesan terformat otomatis (_Judul barang, harga, jenis nego, lokasi wilayah/kecamatan, rekomendasi titik COD, dan nama calon pembeli_).

3. **Autentikasi & Session Server-Side**:
   - Alur autentikasi dikelola oleh server dengan session cookie HttpOnly.
   - OTP digunakan untuk alur yang memerlukannya sesuai konfigurasi production.

4. **Kelola Iklan Saya**:
   - Penjual dapat menandai status barang (_Tersedia / Terjual_) atau menghapus iklan miliknya secara mandiri.

5. **Panel Admin Terproteksi & Moderasi Produk**:
   - Akses admin tidak didokumentasikan dengan kredensial di repository.
   - Moderasi iklan (_Sembunyikan/Tampilkan ke publik, Tandai Terjual, Hapus Permanen_).
   - Statistik real-time iklan aktif, disembunyikan, dan terjual.

6. **Hidden Admin Trigger (5x Klik Logo)**:
   - Tombol admin tersembunyi dari publik.
   - Buka akses admin dengan melakukan klik/tap 5 kali berturut-turut pada logo di pojok kiri atas.

7. **Global Text Editor & Pengaturan Tampilan Real-Time**:
   - Ubah teks apa pun pada aplikasi dari panel admin tanpa terkecuali.
   - Pilihan jenis font (_Sans-Serif, Poppins, Serif, Monospace_).
   - Pilihan susunan tata letak (_Grid Responsif 2-4 Kolom_ vs _Daftar Memanjang / List View_).
   - Banner pengumuman situs dinamis.
   - Tersimpan permanen ke database lokal dan tersinkronisasi instan antar peramban.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dibangun menggunakan HTML5, Tailwind CSS, Lucide Icons, dan Modern Vanilla JavaScript (ES Modules).

### Menggunakan PowerShell Local Server:

```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```

Buka peramban di: `http://localhost:5500`

---

## 📁 Struktur Direktori

```text
solosatset/
├── index.html              # Halaman Utama Marketplace Publik
├── admin.html              # Panel Admin Terproteksi
├── server.ps1              # Local Web Server
├── README.md               # Dokumentasi Proyek
├── .gitignore              # Konfigurasi Git Ignore
├── css/
│   └── styles.css          # Styling kustom & Google Fonts
└── js/
    ├── app.js              # Controller Utama Aplikasi Publik
    ├── admin.js            # Controller Panel Admin & Text Editor
    └── services/           # Service layer aplikasi
```

---

## 🔐 Security

Jangan commit password, API secret, SMTP credential, VAPID private key, session secret, atau credential admin ke repository. Gunakan environment variables pada deployment production.

---

## 📜 Lisensi

MIT License © 2026 solosatset - Pusat Jual Beli Solo Raya.
