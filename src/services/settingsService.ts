/**
 * Storage Settings Module (TypeScript)
 * Site Settings & Custom Texts
 */

export interface DetailImageSettings {
  aspectRatio: string;
  maxWidth: number;
  maxHeight: number;
  objectFit: string;
  isAspectLocked: boolean;
}

export interface SiteSettings {
  fontFamily: string;
  layoutStyle: string;
  layoutColumns: string;
  filterPosition: string;
  announcementText: string;
  showAnnouncement: boolean;
  logoIcon: string;
  logoGradient: string;
  logoImageUrl: string;
  detailImageSettings: DetailImageSettings;
  textStyles?: Record<string, any>;
  updatedAt?: string | null;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  fontFamily: "sans",
  layoutStyle: "grid",
  layoutColumns: "grid2",
  filterPosition: "below_hero",
  announcementText: "📢 Selamat Datang di SOPALOKA! Jual Beli Barang Terdekat — Pantau Cocok Bayar",
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

export const DEFAULT_CUSTOM_TEXTS: Record<string, string> = {
  announcement_text: "📢 Selamat Datang di SOPALOKA! Jual Beli Barang Terdekat — Pantau Cocok Bayar",
  brand_name: "sopaloka",
  brand_tagline: "Jual Beli Barang Terdekat — Pantau Cocok Bayar",
  search_placeholder: "Cari hp, motor, tanah, baju seken...",
  btn_filter: "Filter",
  btn_post_ad: "+ Pasang Iklan",
  hero_title_1: "SOPALOKA",
  hero_subtitle_1: "Jual Beli Barang Terdekat — Pantau Cocok Bayar",
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

export function getCustomTexts(): Record<string, string> {
  if (typeof window === "undefined") return { ...DEFAULT_CUSTOM_TEXTS };
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

export async function saveCustomTexts(texts?: Record<string, string>): Promise<Record<string, string>> {
  if (!texts || typeof texts !== "object") return getCustomTexts();
  try {
    const current = getCustomTexts();
    const merged = { ...current, ...texts };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TEXTS, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("siteTextsChanged", { detail: merged }));
    }
    return merged;
  } catch (err) {
    console.error("[saveCustomTexts] Error saving:", err);
    return getCustomTexts();
  }
}

export async function resetCustomTexts(): Promise<Record<string, string>> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_TEXTS);
    }
    const resetObj = { ...DEFAULT_CUSTOM_TEXTS };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("siteTextsChanged", { detail: resetObj }));
    }
    return resetObj;
  } catch (err) {
    console.error("[resetCustomTexts] Error resetting:", err);
    return { ...DEFAULT_CUSTOM_TEXTS };
  }
}

export function getSiteSettings(): SiteSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SITE_SETTINGS };
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

export async function saveSiteSettings(settings?: Partial<SiteSettings>): Promise<SiteSettings> {
  if (!settings || typeof settings !== "object") return getSiteSettings();
  try {
    const current = getSiteSettings();
    const merged: SiteSettings = {
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
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SITE_SETTINGS, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("siteSettingsChanged", { detail: merged }));
    }
    return merged;
  } catch (err) {
    console.error("[saveSiteSettings] Error saving:", err);
    return getSiteSettings();
  }
}
