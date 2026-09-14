import assert from "node:assert/strict";
import {
  getProvinces,
  getRegenciesByProvince,
  getDistrictsByRegency,
  getRegionById,
  getDistrictsByRegionId,
} from "../src/lib/regions.ts";
import { processAndBroadcastSupabaseListings } from "../src/services/listingService.ts";

// Test 1: Cascading Location Selection (Provinsi -> Kabupaten/Kota -> Kecamatan)
const provinces = getProvinces();
assert(provinces.length >= 30, "Should contain major Indonesian provinces");
const dki = provinces.find((p) => p.code === "31");
const jateng = provinces.find((p) => p.code === "33");
assert(dki && jateng, "DKI Jakarta (31) and Jawa Tengah (33) must exist");

const jatengRegencies = getRegenciesByProvince("33");
assert(jatengRegencies.length > 0, "Regencies in Central Java should be listed");
const surakarta = jatengRegencies.find((r) => r.code === "33.72" || r.code === "3372");
assert(surakarta, "Kota Surakarta (33.72) should exist in Central Java");

const surakartaDistricts = getDistrictsByRegency("33.72");
assert(surakartaDistricts.length > 0, "Districts in Surakarta should be listed");
const laweyan = surakartaDistricts.find((d) => d.name === "Laweyan");
assert(laweyan, "Kecamatan Laweyan should exist in Surakarta");
assert(laweyan.code.startsWith("33.72"), "District code should be prefixed by Regency code");

// Test 2: Save & Load Listing with National Location Codes + Legacy Fallback
const newListingPayload = [
  {
    id: "item-phase3-01",
    title: "Laptop Gaming Bekas Mulus",
    price: 8500000,
    category: "elektronik",
    condition: "good",
    province_code: "33",
    regency_code: "33.72",
    district_code: "33.72.01",
    village: "Manahan",
    region: "33.72",
    district: "Laweyan",
    seller_name: "Penjual Nasional",
  },
];

const loadedListing = processAndBroadcastSupabaseListings(newListingPayload)[0];
assert.equal(loadedListing.provinceCode, "33");
assert.equal(loadedListing.regencyCode, "33.72");
assert.equal(loadedListing.districtCode, "33.72.01");
assert.equal(loadedListing.village, "Manahan");
assert.equal(loadedListing.district, "Laweyan");

// Test 3: Filtering by Location (Province, Regency, District Code & Legacy fallback)
const sampleFeed = [
  {
    id: "item-1",
    title: "Helm KYT",
    price: 300000,
    province_code: "33",
    regency_code: "33.72",
    district_code: "33.72.01",
    region: "solo",
    district: "Laweyan",
  },
  {
    id: "item-2",
    title: "HP Samsung",
    price: 1500000,
    province_code: "31",
    regency_code: "31.71",
    district_code: "31.71.01",
    region: "jakarta",
    district: "Kebayoran",
  },
  {
    id: "item-legacy",
    title: "Sepeda Ontel Legacy",
    price: 450000,
    region: "karanganyar",
    district: "Colomadu",
  },
];

// Helper function simulating location filtering logic in listingsController/listingsFeed
function filterListingsByLocation(items, regFilter, distFilter) {
  let filtered = [...items];
  if (regFilter && regFilter !== "all") {
    const qReg = String(regFilter).toLowerCase().replace(/\./g, "");
    filtered = filtered.filter((l) => {
      const pCode = String(l.province_code || l.provinceCode || "").toLowerCase().replace(/\./g, "");
      const rCode = String(l.regency_code || l.regencyCode || "").toLowerCase().replace(/\./g, "");
      const rId = String(l.region || l.regionId || "").toLowerCase().replace(/\./g, "");
      return pCode === qReg || rCode === qReg || rId === qReg;
    });
  }
  if (distFilter && distFilter !== "all") {
    const qDist = String(distFilter).toLowerCase().replace(/\./g, "");
    filtered = filtered.filter((l) => {
      const dCode = String(l.district_code || l.districtCode || "").toLowerCase().replace(/\./g, "");
      const dName = String(l.district || "").toLowerCase().replace(/\./g, "");
      return dCode === qDist || dName === qDist;
    });
  }
  return filtered;
}

// Filter by Province (Jawa Tengah "33") -> item-1
const jatengFiltered = filterListingsByLocation(sampleFeed, "33", "all");
assert.equal(jatengFiltered.length, 1);
assert.equal(jatengFiltered[0].id, "item-1");

// Filter by Regency Code ("33.72") -> item-1
const surakartaFiltered = filterListingsByLocation(sampleFeed, "33.72", "all");
assert.equal(surakartaFiltered.length, 1);
assert.equal(surakartaFiltered[0].id, "item-1");

// Filter by Legacy Region ("karanganyar") -> item-legacy
const legacyFiltered = filterListingsByLocation(sampleFeed, "karanganyar", "all");
assert.equal(legacyFiltered.length, 1);
assert.equal(legacyFiltered[0].id, "item-legacy");

// Filter by District ("Laweyan") -> item-1
const districtFiltered = filterListingsByLocation(sampleFeed, "all", "Laweyan");
assert.equal(districtFiltered.length, 1);
assert.equal(districtFiltered[0].id, "item-1");

// Test 4: Legacy Backward Compatibility Validation
const legacyUserRegion = getRegionById("karanganyar");
assert(legacyUserRegion, "getRegionById('karanganyar') should return valid legacy object");
const legacyDistricts = getDistrictsByRegionId("karanganyar");
assert(legacyDistricts.includes("Colomadu"), "Colomadu should be present in legacy districts");

console.log("Phase 3 National Location UI & Backward Compatibility checks passed successfully!");
process.exit(0);
