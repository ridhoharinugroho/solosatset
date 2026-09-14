import assert from "node:assert/strict";
import {
  getProvinces,
  getRegenciesByProvince,
  getDistrictsByRegency,
  REGIONS,
  SOLO_RAYA_REGIONS,
  getRegionById,
  getDistrictsByRegionId,
} from "../src/lib/regions.ts";
import { processAndBroadcastSupabaseListings } from "../src/services/listingService.ts";

// Test 1: National Location Lookup Functions
const provinces = getProvinces();
assert(Array.isArray(provinces) && provinces.length > 0, "provinces array should not be empty");
const jateng = provinces.find((p) => p.code === "33");
assert(jateng, "Jawa Tengah (33) should exist in ref_provinces data");
assert.equal(jateng.name, "Jawa Tengah");

const regenciesJateng = getRegenciesByProvince("33");
assert(Array.isArray(regenciesJateng) && regenciesJateng.length > 0, "regencies for Central Java should not be empty");
const surakarta = regenciesJateng.find((r) => r.code === "33.72" || r.code === "3372");
assert(surakarta, "Kota Surakarta (33.72) should exist");
assert(surakarta.name.includes("Surakarta"), "Surakarta should be in name");

const districtsSurakarta = getDistrictsByRegency("33.72");
assert(Array.isArray(districtsSurakarta) && districtsSurakarta.length > 0, "districts for Surakarta should not be empty");
const laweyan = districtsSurakarta.find((d) => d.name === "Laweyan");
assert(laweyan, "Kecamatan Laweyan should exist");
assert.equal(laweyan.name, "Laweyan");

// Test invalid / empty lookups return arrays
assert.deepEqual(getRegenciesByProvince("invalid"), []);
assert.deepEqual(getDistrictsByRegency("invalid"), []);
assert.deepEqual(getRegenciesByProvince(null), []);

// Test 2: Backward Compatibility for Legacy Region Lookups
assert(Array.isArray(REGIONS) && REGIONS.length > 0, "REGIONS legacy array should remain intact");
assert(Array.isArray(SOLO_RAYA_REGIONS) && SOLO_RAYA_REGIONS.length > 0, "SOLO_RAYA_REGIONS should remain intact");

const legacySolo = getRegionById("solo");
assert(legacySolo, "getRegionById('solo') should work");
assert(legacySolo.name.includes("Solo"), "Solo should be in legacy region name");

const legacySurakarta = getRegionById("surakarta");
assert(legacySurakarta, "getRegionById('surakarta') should work via dynamic fallback");
assert.equal(legacySurakarta.name, "Surakarta");

const legacyDistricts = getDistrictsByRegionId("solo");
assert(Array.isArray(legacyDistricts) && legacyDistricts.length > 0, "getDistrictsByRegionId('solo') should work");
assert(legacyDistricts.includes("Laweyan"), "Laweyan should be in legacy districts list");

// Test 3: Listing Data Processing with New Location Code Fields & Backward Compatibility
const legacyInput = [
  {
    id: "item-101",
    title: "Sepeda Bekas",
    price: 500000,
    region: "surakarta",
    district: "Laweyan",
    seller_name: "Penjual A",
  },
];

const processedLegacy = processAndBroadcastSupabaseListings(legacyInput)[0];
assert.equal(processedLegacy.district, "Laweyan");
assert.equal(processedLegacy.provinceCode, null);
assert.equal(processedLegacy.regencyCode, null);
assert.equal(processedLegacy.districtCode, null);
assert.equal(processedLegacy.village, "");

const nationalInput = [
  {
    id: "item-102",
    title: "Kamera DSLR",
    price: 2500000,
    region: "surakarta",
    district: "Laweyan",
    province_code: "33",
    regency_code: "33.72",
    district_code: "33.72.01",
    village: "Pajang",
    seller_name: "Penjual B",
  },
];

const processedNational = processAndBroadcastSupabaseListings(nationalInput)[0];
assert.equal(processedNational.district, "Laweyan");
assert.equal(processedNational.provinceCode, "33");
assert.equal(processedNational.regencyCode, "33.72");
assert.equal(processedNational.districtCode, "33.72.01");
assert.equal(processedNational.village, "Pajang");

console.log("Phase 2 National Location & Backward Compatibility checks passed successfully!");
process.exit(0);
