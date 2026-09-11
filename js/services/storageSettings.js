/**
 * Storage Settings Module - Site Settings & Custom Texts
 */

export const DEFAULT_SITE_SETTINGS = {
  fontFamily: "sans", // 'sans', 'serif', 'mono', 'poppins', 'inter', 'roboto', 'montserrat', 'outfit', 'playfair'
  layoutStyle: "grid", // 'grid', 'list'
  layoutColumns: "grid2", // 'grid2', 'grid3'
  filterPosition: "below_hero", // 'below_hero', 'above_hero'
  announcementText: "📢 Selamat Datang di Pusat Jual Beli Solo Raya! Jual Beli Sat-Set Ra Nggo Ribet!!!",
  showAnnouncement: true,
  logoIcon: "shopping-bag",
  logoGradient: "from-rose-900 to-rose-700",
  logoImageUrl: "assets/img/app-logo.png",
  detailImageSettings: {
    aspectRatio: "aspect-square",
    maxWidth: 448,
    maxHeight: 560,
    objectFit: "cover",
    isAspectLocked: true,
  },
  textStyles: {},
  updatedAt: null,
};

export const DEFAULT_CUSTOM_TEXTS = {
  announcement_text: "📢 Selamat Datang di Pusat Jual Beli Solo Raya! Jual Beli Sat-Set Ra Nggo Ribet!!!",
  brand_name: "solosatset",
  brand_tagline: "",
  search_placeholder: "Cari hp, motor, tanah, baju seken di Solo...",
  btn_filter: "Filter",
  btn_post_ad: "+ Pasang Iklan",
  hero_title_1: "Pusat Jual Beli Solo Raya",
  hero_subtitle_1: "Solusi Jual Beli Barang Bekas & Baru Sat-Set Tanpa Potongan Komisi!",
  hero_btn_explore_1: "Jelajahi Lapak",
  hero_btn_post_1: "+ Pasang Iklan Gratis",
  hero_title_2: "Barang Terjual Cepat dalam 24 Jam",
  hero_subtitle_2: "Jangkau ribuan calon pembeli aktif di 7 Kota/Kabupaten Solo Raya setiap hari.",
  hero_btn_explore_2: "Lihat Iklan Terbaru",
  hero_btn_post_2: "+ Pasang Iklan Sekarang",
  hero_title_3: "100% Gratis Tanpa Komisi",
  hero_subtitle_3: "Transaksi langsung COD dengan penjual atau pembeli tanpa biaya tersembunyi.",
  hero_btn_explore_3: "Cari Barang Imut",
  hero_btn_post_3: "+ Jual Barang Sekarang",
  region_indicator_all: "Menampilkan: 7 Wilayah Solo Raya",
  sort_newest: "Terbaru",
  sort_price_low: "Termurah",
  sort_price_high: "Termahal",
  sort_views: "Populer",
  nav_beranda: "Beranda",
  nav_pasang: "Pasang",
  nav_toko_saya: "Toko Saya",
  nav_profil: "Profil",
  empty_title: "Belum Ada Iklan di Wilayah / Kategori Ini",
  empty_desc: "Jadilah yang pertama memasang iklan di kategori ini dan jangkau calon pembeli di Solo Raya!",
  empty_btn: "+ Pasang Iklan Sekarang",
  btn_chat_wa: "Chat WA Penjual",
  btn_share: "Bagikan",
  btn_favorite: "Favorit",
  btn_chat_wa_card: "Chat WA",
  btn_detail_card: "Detail",
};

const STORAGE_KEY_SITE_SETTINGS = "pusat_barkas_site_settings";
const STORAGE_KEY_CUSTOM_TEXTS = "pusat_barkas_custom_texts";

export function getCustomTexts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_TEXTS);
    if (!raw) return { ...DEFAULT_CUSTOM_TEXTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CUSTOM_TEXTS, ...parsed };
  } catch (err) {
    console.warn("[getCustomTexts] Warning reading storage:", err);
    return { ...DEFAULT_CUSTOM_TEXTS };
  }
}

export async function saveCustomTexts(texts) {
  if (!texts || typeof texts !== "object") return getCustomTexts();
  try {
    const current = getCustomTexts();
    const merged = { ...current, ...texts };
    localStorage.setItem(STORAGE_KEY_CUSTOM_TEXTS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("siteTextsChanged", { detail: merged }));
    return merged;
  } catch (err) {
    console.error("[saveCustomTexts] Error saving:", err);
    return getCustomTexts();
  }
}

export async function resetCustomTexts() {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_TEXTS);
    const resetObj = { ...DEFAULT_CUSTOM_TEXTS };
    window.dispatchEvent(new CustomEvent("siteTextsChanged", { detail: resetObj }));
    return resetObj;
  } catch (err) {
    console.error("[resetCustomTexts] Error resetting:", err);
    return { ...DEFAULT_CUSTOM_TEXTS };
  }
}

export function getSiteSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITE_SETTINGS);
    if (!raw) return { ...DEFAULT_SITE_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...parsed,
      detailImageSettings: {
        ...DEFAULT_SITE_SETTINGS.detailImageSettings,
        ...(parsed.detailImageSettings || {}),
      },
    };
  } catch (err) {
    console.warn("[getSiteSettings] Warning reading storage:", err);
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

export async function saveSiteSettings(settings) {
  if (!settings || typeof settings !== "object") return getSiteSettings();
  try {
    const current = getSiteSettings();
    const merged = {
      ...current,
      ...settings,
      detailImageSettings: {
        ...current.detailImageSettings,
        ...(settings.detailImageSettings || {}),
      },
      textStyles: {
        ...(current.textStyles || {}),
        ...(settings.textStyles || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_SITE_SETTINGS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("siteSettingsChanged", { detail: merged }));
    return merged;
  } catch (err) {
    console.error("[saveSiteSettings] Error saving:", err);
    return getSiteSettings();
  }
}
