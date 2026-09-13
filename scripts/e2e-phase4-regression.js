import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

console.log("=== PHASE 4: LOCAL E2E & REGRESSION TEST SOPALOKA ===");

// 1. Setup simulated browser DOM environment using JSDOM
const dom = new JSDOM("<!DOCTYPE html><html><body><div id='app'></div></body></html>", {
  url: "http://localhost:3000/",
  runScripts: "outside-only",
});

const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
try {
  Object.defineProperty(global, "navigator", { value: window.navigator, writable: true, configurable: true });
} catch {}
try {
  Object.defineProperty(global, "location", { value: window.location, writable: true, configurable: true });
} catch {}

global.HTMLElement = window.HTMLElement;
global.Event = window.Event;
global.CustomEvent = window.CustomEvent;

// Mock window.fetch for local testing
global.fetch = async (_url, _opts) => {
  return {
    ok: true,
    status: 200,
    text: async () => "",
    json: async () => ({ success: true, user: { id: "user-e2e-123" } }),
  };
};

const results = [];

async function runE2E() {
  const { setCurrentUser, getCurrentUser, logout } = await import("../js/services/auth.js");
  const { saveListing, updateListing, getAllListings, processAndBroadcastSupabaseListings } = await import("../js/services/storageListings.js");
  const { getProvinces, getRegenciesByProvince, getDistrictsByRegency, getRegionById, getDistrictsByRegionId } = await import("../js/data/regions.js");

  // --------------------------------------------------------------------------
  // Skenario 1: Register user
  // --------------------------------------------------------------------------
  try {
    const newUser = {
      id: "user-e2e-101",
      name: "Budi Sopaloka",
      email: "budi.e2e@sopaloka.id",
      phone: "081234567890",
      region: "solo",
      district: "Laweyan",
    };
    setCurrentUser(newUser);
    const active = getCurrentUser();
    assert.equal(active.email, "budi.e2e@sopaloka.id", "User registered email must match");
    console.log("✓ Skenario 1 (Register User): PASS");
    results.push({ scenario: "1. Register User", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 1 (Register User): FAIL -", err.message);
    results.push({ scenario: "1. Register User", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 2: Login User
  // --------------------------------------------------------------------------
  try {
    const loggedUser = getCurrentUser();
    assert(loggedUser && loggedUser.id, "Session user should be logged in");
    console.log("✓ Skenario 2 (Login User): PASS");
    results.push({ scenario: "2. Login User", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 2 (Login User): FAIL -", err.message);
    results.push({ scenario: "2. Login User", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 3: Edit Profile (Provinsi -> Regency -> District -> Village)
  // --------------------------------------------------------------------------
  try {
    const provinces = getProvinces();
    const jateng = provinces.find((p) => p.code === "33");
    assert(jateng, "Provinsi Jawa Tengah (33) should exist");

    const regencies = getRegenciesByProvince("33");
    const surakarta = regencies.find((r) => r.code === "33.72" || r.code === "3372");
    assert(surakarta, "Kota Surakarta (33.72) should exist");

    const districts = getDistrictsByRegency("33.72");
    const laweyan = districts.find((d) => d.name === "Laweyan");
    assert(laweyan, "Kecamatan Laweyan should exist");

    const updatedProfile = {
      ...getCurrentUser(),
      province_code: "33",
      regency_code: "33.72",
      district_code: laweyan.code,
      village: "Manahan",
      region: "solo",
      district: "Laweyan",
    };
    setCurrentUser(updatedProfile);

    const currentUser = getCurrentUser();
    assert.equal(currentUser.province_code, "33");
    assert.equal(currentUser.regency_code, "33.72");
    assert.equal(currentUser.village, "Manahan");
    assert.equal(currentUser.district, "Laweyan");
    console.log("✓ Skenario 3 (Edit Profile Lokasi Nasional): PASS");
    results.push({ scenario: "3. Edit Profile Lokasi Nasional", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 3 (Edit Profile): FAIL -", err.message);
    results.push({ scenario: "3. Edit Profile Lokasi Nasional", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 4: Buat Listing dengan Lokasi Nasional & Simpan
  // --------------------------------------------------------------------------
  let createdListingId = null;
  try {
    const listingPayload = {
      title: "Kamera Canon EOS M50 Second Mulus",
      category: "elektronik",
      condition: "good",
      price: 6500000,
      negoType: "nego_alus",
      paymentMethod: "cod",
      province_code: "33",
      regency_code: "33.72",
      district_code: "33.72.01",
      village: "Pajang",
      provinceCode: "33",
      regencyCode: "33.72",
      districtCode: "33.72.01",
      regionId: "solo",
      region: "solo",
      district: "Laweyan",
      description: "Kamera lengkap kardus mulus nominus.",
      seller: getCurrentUser(),
    };

    const saved = saveListing(listingPayload);
    assert(saved && saved.id, "Saved listing should have valid ID");
    createdListingId = saved.id;
    assert.equal(saved.provinceCode, "33");
    assert.equal(saved.regencyCode, "33.72");
    assert.equal(saved.districtCode, "33.72.01");
    assert.equal(saved.village, "Pajang");
    assert.equal(saved.district, "Laweyan");
    console.log("✓ Skenario 4 (Buat Listing Lokasi Nasional): PASS");
    results.push({ scenario: "4. Buat Listing Lokasi Nasional", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 4 (Buat Listing): FAIL -", err.message);
    results.push({ scenario: "4. Buat Listing Lokasi Nasional", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 5: Edit Listing & Pastikan Lokasi Tetap Benar
  // --------------------------------------------------------------------------
  try {
    assert(createdListingId, "Created listing ID must exist");
    const updatedData = {
      price: 6200000,
      village: "Manahan",
    };
    const updatedItem = updateListing(createdListingId, updatedData);
    assert.equal(updatedItem.price, 6200000);
    assert.equal(updatedItem.provinceCode, "33");
    assert.equal(updatedItem.regencyCode, "33.72");
    assert.equal(updatedItem.districtCode, "33.72.01");
    assert.equal(updatedItem.village, "Manahan");
    assert.equal(updatedItem.district, "Laweyan");
    console.log("✓ Skenario 5 (Edit Listing & Verifikasi Lokasi): PASS");
    results.push({ scenario: "5. Edit Listing & Verifikasi Lokasi", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 5 (Edit Listing): FAIL -", err.message);
    results.push({ scenario: "5. Edit Listing & Verifikasi Lokasi", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 6: Cari/Filter Listing Berdasarkan Lokasi
  // --------------------------------------------------------------------------
  try {
    const allListings = getAllListings();

    // Filter by Regency ("33.72" or "solo")
    const filteredByRegency = allListings.filter((item) => {
      const pCode = String(item.provinceCode || item.province_code || "").toLowerCase().replace(/\./g, "");
      const rCode = String(item.regencyCode || item.regency_code || "").toLowerCase().replace(/\./g, "");
      const rId = String(item.regionId || item.region || "").toLowerCase().replace(/\./g, "");
      return rCode === "3372" || rId === "solo" || pCode === "33";
    });
    assert(filteredByRegency.length > 0, "Filter by Regency 33.72 should find created item");

    // Filter by District ("33.72.01" or "laweyan")
    const filteredByDistrict = allListings.filter((item) => {
      const dCode = String(item.districtCode || item.district_code || "").toLowerCase().replace(/\./g, "");
      const dName = String(item.district || "").toLowerCase().replace(/\./g, "");
      return dCode === "337201" || dName === "laweyan";
    });
    assert(filteredByDistrict.length > 0, "Filter by District 33.72.01 / Laweyan should find item");
    console.log("✓ Skenario 6 (Cari & Filter Lokasi): PASS");
    results.push({ scenario: "6. Cari & Filter Lokasi", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 6 (Cari & Filter): FAIL -", err.message);
    results.push({ scenario: "6. Cari & Filter Lokasi", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 7: Buka Detail Listing
  // --------------------------------------------------------------------------
  try {
    const all = getAllListings();
    const item = all.find((i) => i.id === createdListingId);
    assert(item, "Target listing for detail view should exist");
    assert.equal(item.title, "Kamera Canon EOS M50 Second Mulus");
    assert.equal(item.seller.name, "Budi Sopaloka");
    console.log("✓ Skenario 7 (Buka Detail Listing): PASS");
    results.push({ scenario: "7. Buka Detail Listing", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 7 (Buka Detail Listing): FAIL -", err.message);
    results.push({ scenario: "7. Buka Detail Listing", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 8: Refresh Halaman -> Session & Data Tetap Benar
  // --------------------------------------------------------------------------
  try {
    // Simulate page refresh by fetching active user from session storage/state
    const sessionUser = getCurrentUser();
    assert(sessionUser && sessionUser.email === "budi.e2e@sopaloka.id", "User session should persist after refresh");
    const listingsAfterRefresh = getAllListings();
    assert(listingsAfterRefresh.some((l) => l.id === createdListingId), "Listings data should persist");
    console.log("✓ Skenario 8 (Refresh & Sesi Persist): PASS");
    results.push({ scenario: "8. Refresh & Sesi Persist", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 8 (Refresh Sesi): FAIL -", err.message);
    results.push({ scenario: "8. Refresh & Sesi Persist", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 9: Test Data Lama (Legacy region/district) -> Tetap Tampil
  // --------------------------------------------------------------------------
  try {
    const legacyRawItems = [
      {
        id: "legacy-item-999",
        title: "Sepeda Ontel Kuno Solo",
        price: 750000,
        region: "solo",
        district: "Serengan",
        seller_name: "Penjual Lama",
      },
    ];

    const processedLegacy = processAndBroadcastSupabaseListings(legacyRawItems)[0];
    assert.equal(processedLegacy.district, "Serengan");
    assert.equal(processedLegacy.provinceCode, null);
    assert.equal(processedLegacy.regencyCode, null);

    const legacyRegion = getRegionById("solo");
    assert(legacyRegion, "getRegionById('solo') legacy lookup must succeed");
    const legacyDistricts = getDistrictsByRegionId("solo");
    assert(legacyDistricts.includes("Serengan"), "Serengan district must exist in legacy region");

    console.log("✓ Skenario 9 (Kompatibilitas Data Lama): PASS");
    results.push({ scenario: "9. Kompatibilitas Data Lama", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 9 (Data Lama): FAIL -", err.message);
    results.push({ scenario: "9. Kompatibilitas Data Lama", status: "FAIL", error: err.message });
  }

  // --------------------------------------------------------------------------
  // Skenario 10: Test Logout & Login Kembali
  // --------------------------------------------------------------------------
  try {
    await logout();
    const afterLogout = getCurrentUser();
    assert.equal(afterLogout, null, "Active user must be null after logout");

    // Re-login user
    setCurrentUser({
      id: "user-e2e-101",
      name: "Budi Sopaloka",
      email: "budi.e2e@sopaloka.id",
    });
    const reLoggedIn = getCurrentUser();
    assert(reLoggedIn && reLoggedIn.id === "user-e2e-101", "User should re-login successfully");
    console.log("✓ Skenario 10 (Logout & Re-login): PASS");
    results.push({ scenario: "10. Logout & Re-login", status: "PASS" });
  } catch (err) {
    console.error("❌ Skenario 10 (Logout & Re-login): FAIL -", err.message);
    results.push({ scenario: "10. Logout & Re-login", status: "FAIL", error: err.message });
  }

  console.log("\n=================== RINGKASAN E2E ===================");
  let hasFailures = false;
  results.forEach((r) => {
    console.log(`${r.status === "PASS" ? "✅" : "❌"} ${r.scenario}: ${r.status}`);
    if (r.status === "FAIL") hasFailures = true;
  });

  if (hasFailures) {
    console.error("\n❌ Phase 4 E2E Test Suite FAILED!");
    process.exit(1);
  } else {
    console.log("\n🎉 Phase 4 E2E Test Suite PASSED 100%!");
    process.exit(0);
  }
}

runE2E().catch((err) => {
  console.error("Fatal E2E execution error:", err);
  process.exit(1);
});
