// ============================================================
// AUTH & PROFILE MODALS LOADER
// Single source of truth for loading components/modals/auth-profile.html
// ============================================================

import {
  getProvinces,
  getRegenciesByProvince,
  getDistrictsByRegency,
  getDistrictsByRegionId,
} from "./data/regions.js";
import "./services/otpAuth.js";
import "./services/passwordChangeOtp.js";

let authProfileLoadPromise = null;

function populateRegistrationProvinces() {
  const provSelect = document.getElementById("reg-select-province");
  if (!provSelect) return;
  const provinces = getProvinces();
  provSelect.innerHTML = "";
  provinces.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.code;
    option.textContent = p.name;
    provSelect.appendChild(option);
  });
  // Default to Jawa Tengah (33) if available
  if (provinces.some((p) => p.code === "33")) {
    provSelect.value = "33";
  }
}

function populateRegistrationRegencies(preferredRegency = "") {
  const provSelect = document.getElementById("reg-select-province");
  const regSelect = document.getElementById("reg-select-region");
  if (!regSelect) return false;
  const provCode = provSelect ? provSelect.value || "33" : "33";
  const regencies = getRegenciesByProvince(provCode);
  regSelect.innerHTML = "";

  if (!regencies.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Kabupaten / Kota tidak tersedia";
    regSelect.appendChild(opt);
    populateRegistrationDistricts("");
    return false;
  }

  regencies.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.code || r.id;
    opt.textContent = r.name;
    regSelect.appendChild(opt);
  });

  const matchingReg = regencies.find((r) => r.code === preferredRegency || r.id === preferredRegency);
  regSelect.value = matchingReg ? (matchingReg.code || matchingReg.id) : (regencies[0].code || regencies[0].id);
  populateRegistrationDistricts(regSelect.value);
  return true;
}

function populateRegistrationDistricts(preferredDistrict = "") {
  const regSelect = document.getElementById("reg-select-region");
  const districtSelect = document.getElementById("reg-select-district");
  if (!regSelect || !districtSelect) return false;
  const regCode = regSelect.value || "";
  
  let districts = getDistrictsByRegency(regCode);
  if (districts.length === 0) {
    const legacyDist = getDistrictsByRegionId(regCode);
    districts = legacyDist.map((d) => (typeof d === "string" ? { code: d, name: d } : d));
  }

  const previousValue = preferredDistrict || districtSelect.value || "";
  districtSelect.replaceChildren();
  if (!districts.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Kecamatan tidak tersedia";
    districtSelect.appendChild(option);
    districtSelect.value = "";
    return false;
  }
  districts.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.code || d.name;
    option.textContent = d.name.startsWith("Kec.") ? d.name : `Kec. ${d.name}`;
    districtSelect.appendChild(option);
  });

  const matchingDistrict = districts.find((d) => d.code === previousValue || d.name === previousValue);
  districtSelect.value = matchingDistrict ? (matchingDistrict.code || matchingDistrict.name) : (districts[0].code || districts[0].name);
  return true;
}

function installRegistrationDistrictHandler() {
  const provSelect = document.getElementById("reg-select-province");
  const regSelect = document.getElementById("reg-select-region");
  const districtSelect = document.getElementById("reg-select-district");
  if (!regSelect || !districtSelect) return false;

  if (provSelect && !provSelect.dataset.provinceHandlerInstalled) {
    populateRegistrationProvinces();
    provSelect.addEventListener("change", () => populateRegistrationRegencies());
    provSelect.dataset.provinceHandlerInstalled = "true";
  }

  if (!regSelect.dataset.districtHandlerInstalled) {
    regSelect.addEventListener("change", () => populateRegistrationDistricts());
    regSelect.dataset.districtHandlerInstalled = "true";
  }
  
  populateRegistrationRegencies();
  return true;
}

export async function ensureAuthProfileModalsLoaded() {
  if (document.getElementById("modal-user-auth")) {
    installRegistrationDistrictHandler();
    return true;
  }
  if (authProfileLoadPromise) return authProfileLoadPromise;
  authProfileLoadPromise = (async () => {
    try {
      // Muat kedua file HTML secara paralel untuk efisiensi
      const [authRes, profileRes] = await Promise.all([
        fetch("/components/modals/auth-user.html", { cache: "no-cache" }),
        fetch("/components/modals/profile-settings.html", { cache: "no-cache" }),
      ]);

      if (!authRes.ok) {
        // Fallback ke file monolitik lama jika file baru belum ada
        const fallback = await fetch("/components/modals/auth-profile.html", { cache: "no-cache" });
        if (!fallback.ok) return false;
        const html = await fallback.text();
        if (!document.getElementById("modal-user-auth")) {
          document.body.insertAdjacentHTML("beforeend", html);
          if (typeof window.lucide !== "undefined" && typeof window.lucide.createIcons === "function") {
            try {
              window.lucide.createIcons();
            } catch (_e) {}
          }
        }
        installRegistrationDistrictHandler();
        window.dispatchEvent(new CustomEvent("auth-profile-modals:ready"));
        return true;
      }

      const [authHtml, profileHtml] = await Promise.all([
        authRes.text(),
        profileRes.ok ? profileRes.text() : Promise.resolve(""),
      ]);

      if (!document.getElementById("modal-user-auth")) {
        document.body.insertAdjacentHTML("beforeend", authHtml);
      }
      if (profileHtml && !document.getElementById("modal-user-profile")) {
        document.body.insertAdjacentHTML("beforeend", profileHtml);
      }

      if (typeof window.lucide !== "undefined" && typeof window.lucide.createIcons === "function") {
        try {
          window.lucide.createIcons();
        } catch (_e) {}
      }
      installRegistrationDistrictHandler();
      window.dispatchEvent(new CustomEvent("auth-profile-modals:ready"));
      return true;
    } catch (err) {
      console.error("[AUTH PROFILE MODALS] Error loading modals:", err);
      return false;
    } finally {
      authProfileLoadPromise = null;
    }
  })();
  return authProfileLoadPromise;
}

if (document.readyState === "loading")
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      ensureAuthProfileModalsLoaded();
    },
    { once: true },
  );
else setTimeout(ensureAuthProfileModalsLoaded, 0);
