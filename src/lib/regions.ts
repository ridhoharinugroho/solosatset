/**
 * Data Wilayah Indonesia & Kontrak Lokasi Nasional SOPALOKA (TypeScript)
 */

export interface Region {
  id: string;
  code: string;
  provinceCode: string;
  name: string;
  shortName: string;
  badgeColor: string;
  accentColor: string;
  popularSpots: string[];
  districts: string[];
}

export interface Province {
  id: string;
  code: string;
  name: string;
}

export interface FormattedRegency extends Region {
  rawCode: string;
}

export interface FormattedDistrict {
  code: string;
  name: string;
}

export const REGIONS: Region[] = [
  {
    id: "solo",
    code: "3372",
    provinceCode: "33",
    name: "Kota Solo (Surakarta)",
    shortName: "Solo",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    accentColor: "#dc2626",
    popularSpots: [
      "Manahan",
      "Pasar Klewer",
      "Slamet Riyadi",
      "Singosaren",
      "Kentingan UNS",
      "Pasar Gede",
      "Mangkunegaran",
    ],
    districts: ["Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan"],
  },
  {
    id: "karanganyar",
    code: "3313",
    provinceCode: "33",
    name: "Kab. Karanganyar",
    shortName: "Karanganyar",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentColor: "#059669",
    popularSpots: ["Colomadu", "Alun-alun Karanganyar", "Palur", "Jaten", "Tawangmangu", "Tasikmadu", "Kebakkramat"],
    districts: [
      "Colomadu",
      "Jaten",
      "Karanganyar",
      "Karangpandan",
      "Tasikmadu",
      "Kebakkramat",
      "Gondangrejo",
      "Matesih",
      "Mojogedang",
      "Ngargoyoso",
      "Tawangmangu",
      "Jatipuro",
      "Jatiyoso",
      "Jumantono",
      "Jumapolo",
      "Kerjo",
      "Jenawi",
    ],
  },
  {
    id: "sukoharjo",
    code: "3311",
    provinceCode: "33",
    name: "Kab. Sukoharjo",
    shortName: "Sukoharjo",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    accentColor: "#2563eb",
    popularSpots: [
      "Solo Baru (The Park/Hartono)",
      "Kartasura (Goro Assalam / UMS)",
      "Baki",
      "Alun-alun Sukoharjo",
      "Mojolaban",
    ],
    districts: [
      "Kartasura",
      "Grogol (Solo Baru)",
      "Baki",
      "Sukoharjo Kota",
      "Mojolaban",
      "Gatak",
      "Bendosari",
      "Bulu",
      "Nguter",
      "Polokarto",
      "Tawangsari",
      "Weru",
    ],
  },
  {
    id: "wonogiri",
    code: "3312",
    provinceCode: "33",
    name: "Kab. Wonogiri",
    shortName: "Wonogiri",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    accentColor: "#d97706",
    popularSpots: [
      "Alun-alun Giri Krida Bakti",
      "Selogiri",
      "Baturetno",
      "Pracimantoro",
      "Waduk Gajah Mungkur",
      "Ngadirojo",
    ],
    districts: [
      "Wonogiri Kota",
      "Selogiri",
      "Baturetno",
      "Pracimantoro",
      "Ngadirojo",
      "Purwantoro",
      "Slogohimo",
      "Eromoko",
      "Giritontro",
      "Giriwoyo",
      "Manyaran",
      "Wuryantoro",
      "Sidoharjo",
      "Jatisrono",
      "Jatipurno",
      "Jatiroto",
      "Kismantoro",
      "Bulukerto",
      "Tirtomoyo",
    ],
  },
  {
    id: "sragen",
    code: "3314",
    provinceCode: "33",
    name: "Kab. Sragen",
    shortName: "Sragen",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    accentColor: "#7c3aed",
    popularSpots: ["Alun-alun Sragen", "Gemolong", "Masaran", "Kalijambe (Sangiran)", "Gondang", "Plupuh"],
    districts: [
      "Sragen Kota",
      "Gemolong",
      "Masaran",
      "Kalijambe",
      "Gondang",
      "Plupuh",
      "Sambungmacan",
      "Karangmalang",
      "Ngrampal",
      "Sumberlawang",
      "Kedawung",
      "Tanon",
      "Gesi",
      "Mondokan",
      "Miri",
      "Sukodono",
      "Tangen",
      "Jenar",
    ],
  },
  {
    id: "boyolali",
    code: "3309",
    provinceCode: "33",
    name: "Kab. Boyolali",
    shortName: "Boyolali",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    accentColor: "#0d9488",
    popularSpots: [
      "Patung Susu Tumpah Boyolali",
      "Ngemplak (Bandara Adi Soemarmo)",
      "Banyudono / Pengging",
      "Selo",
      "Ampel",
    ],
    districts: [
      "Boyolali Kota",
      "Mojosongo",
      "Ngemplak",
      "Banyudono",
      "Ampel",
      "Teras",
      "Sambi",
      "Sawit",
      "Simo",
      "Cepogo",
      "Selo",
      "Musuk",
      "Gladagsari",
      "Karanggede",
      "Klego",
      "Andong",
      "Nogosari",
      "Kemusu",
      "Juwangi",
    ],
  },
  {
    id: "klaten",
    code: "3310",
    provinceCode: "33",
    name: "Kab. Klaten",
    shortName: "Klaten",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    accentColor: "#4f46e5",
    popularSpots: ["Alun-alun Klaten", "Delanggu", "Prambanan", "Umbul Ponggok / Polanharjo", "Pedan", "Jogonalan"],
    districts: [
      "Klaten Kota",
      "Delanggu",
      "Prambanan",
      "Polanharjo",
      "Pedan",
      "Ceper",
      "Jogonalan",
      "Trucuk",
      "Cawas",
      "Wedi",
      "Tulung",
      "Bayat",
      "Karanganom",
      "Jatinom",
      "Juwiring",
      "Kalikotes",
      "Ngawen",
      "Kemalang",
    ],
  },
];

export const SOLO_RAYA_REGIONS = REGIONS;

export function getRegionById(id?: string | null): Region | null {
  if (!id) return null;
  const cleanId = String(id).trim().toLowerCase();
  const found = REGIONS.find((r) => r.id.toLowerCase() === cleanId || r.code === cleanId);
  if (found) return found;

  const formattedName = cleanId
    .split(/[-_ ]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");

  return {
    id: cleanId,
    code: "",
    provinceCode: "",
    name: formattedName,
    shortName: formattedName,
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    accentColor: "#475569",
    popularSpots: [],
    districts: [],
  };
}

export function getDistrictsByRegionId(regionId?: string | null): string[] {
  const region = getRegionById(regionId);
  return region ? region.districts || [] : [];
}

export const PROVINCES: Province[] = [
  { code: "31", id: "31", name: "DKI Jakarta" },
  { code: "32", id: "32", name: "Jawa Barat" },
  { code: "33", id: "33", name: "Jawa Tengah" },
  { code: "34", id: "34", name: "DI Yogyakarta" },
  { code: "35", id: "35", name: "Jawa Timur" },
  { code: "36", id: "36", name: "Banten" },
  { code: "51", id: "51", name: "Bali" },
  { code: "52", id: "52", name: "Nusa Tenggara Barat" },
  { code: "53", id: "53", name: "Nusa Tenggara Timur" },
  { code: "11", id: "11", name: "Aceh" },
  { code: "12", id: "12", name: "Sumatera Utara" },
  { code: "13", id: "13", name: "Sumatera Barat" },
  { code: "14", id: "14", name: "Riau" },
  { code: "15", id: "15", name: "Jambi" },
  { code: "16", id: "16", name: "Sumatera Selatan" },
  { code: "17", id: "17", name: "Bengkulu" },
  { code: "18", id: "18", name: "Lampung" },
  { code: "19", id: "19", name: "Kepulauan Bangka Belitung" },
  { code: "21", id: "21", name: "Kepulauan Riau" },
  { code: "61", id: "61", name: "Kalimantan Barat" },
  { code: "62", id: "62", name: "Kalimantan Tengah" },
  { code: "63", id: "63", name: "Kalimantan Selatan" },
  { code: "64", id: "64", name: "Kalimantan Timur" },
  { code: "65", id: "65", name: "Kalimantan Utara" },
  { code: "71", id: "71", name: "Sulawesi Utara" },
  { code: "72", id: "72", name: "Sulawesi Tengah" },
  { code: "73", id: "73", name: "Sulawesi Selatan" },
  { code: "74", id: "74", name: "Sulawesi Tenggara" },
  { code: "75", id: "75", name: "Gorontalo" },
  { code: "76", id: "76", name: "Sulawesi Barat" },
  { code: "81", id: "81", name: "Maluku" },
  { id: "82", code: "82", name: "Maluku Utara" },
  { id: "91", code: "91", name: "Papua" },
  { id: "92", code: "92", name: "Papua Barat" },
];

export function getProvinces(): Province[] {
  return PROVINCES;
}

export function getRegenciesByProvince(provCode?: string | null): FormattedRegency[] {
  if (!provCode) return [];
  const cleanProv = String(provCode).trim().replace(/\./g, "");
  const matched = REGIONS.filter((r) => !r.provinceCode || r.provinceCode.replace(/\./g, "") === cleanProv);
  return matched.map((r) => {
    const rawCode = String(r.code || "").replace(/\./g, "");
    const formattedCode = rawCode.length === 4 ? `${rawCode.slice(0, 2)}.${rawCode.slice(2)}` : r.code;
    return {
      ...r,
      code: formattedCode,
      rawCode: rawCode,
    };
  });
}

export function getDistrictsByRegency(regencyCode?: string | null): FormattedDistrict[] {
  if (!regencyCode) return [];
  const cleanReg = String(regencyCode).trim().toLowerCase().replace(/\./g, "");
  const region = REGIONS.find(
    (r) =>
      r.id.toLowerCase() === cleanReg ||
      String(r.code || "").toLowerCase().replace(/\./g, "") === cleanReg,
  );
  if (!region || !Array.isArray(region.districts)) return [];
  
  const baseRegCode = String(region.code || "").replace(/\./g, "");
  const formattedRegCode = baseRegCode.length === 4 ? `${baseRegCode.slice(0, 2)}.${baseRegCode.slice(2)}` : baseRegCode;

  return region.districts.map((d, index) => {
    const idxStr = String(index + 1).padStart(2, "0");
    const distName = typeof d === "string" ? d : (d as any).name || String(d);
    return {
      code: `${formattedRegCode}.${idxStr}`,
      name: distName,
    };
  });
}
