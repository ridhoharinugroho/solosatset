import { SOLO_RAYA_REGIONS, getDistrictsByRegionId } from "../../data/regions.js";
import { refreshIcons } from "../../utils/runtime.js";

export const FORM_CATEGORY_META = {
  elektronik: { name: "Elektronik & Gadget", icon: "smartphone" },
  kendaraan: { name: "Kendaraan & Otomotif", icon: "bike" },
  perabot: { name: "Perabot & Rumah Tangga", icon: "armchair" },
  pakaian: { name: "Pakaian & Aksesoris", icon: "shirt" },
  kuliner: { name: "Makanan & Minuman", icon: "utensils" },
  "bayi-anak": { name: "Perlengkapan Bayi & Anak", icon: "baby" },
  pertukangan: { name: "Pertukangan / Bahan Bangunan", icon: "hammer" },
  hobi: { name: "Hobi, Musik & Olahraga", icon: "trophy" },
  hewan: { name: "Hewan & Perlengkapan", icon: "cat" },
  "alat-sekolah": { name: "Peralatan Sekolah", icon: "book-open" },
  "perawatan-diri": { name: "Perawatan Diri", icon: "sparkles" },
  properti: { name: "Properti", icon: "building-2" },
  jasa: { name: "Jasa", icon: "wrench" },
  lainnya: { name: "Lain-lain / Aneka Barang", icon: "package" },
};

export const FORM_CONDITION_META = {
  new: { name: "Baru (Gres / Segel)", icon: "sparkles" },
  like_new: { name: "Bekas - Seperti Baru", icon: "gem" },
  good: { name: "Bekas - Mulus / Normal", icon: "check-circle-2" },
  fair: { name: "Bekas - Wajar Pemakaian", icon: "clock" },
  repair: { name: "Bekas - Butuh Servis / Bahan", icon: "wrench" },
};

export const FORM_NEGO_META = {
  pas: { name: "Harga Pas / Nett", icon: "tag" },
  nego_alus: { name: "Nego Alus (Wajar)", icon: "badge-percent" },
  nego_bebas: { name: "Nego Bebas (Asal Jadi)", icon: "coins" },
};

export const FORM_PAYMENT_METHOD_META = {
  cod: { name: "COD (Ketemuan Langsung)", icon: "handshake" },
  in_store: { name: "Ambil di Toko / Toko Fisik", icon: "store" },
};

export function selectFormCategory(catId) {
  const selectedId = catId || "elektronik";
  const input = document.getElementById("form-input-category");
  if (input) input.value = selectedId;

  const meta = FORM_CATEGORY_META[selectedId] || { name: "Elektronik & Gadget", icon: "smartphone" };

  const textEl = document.getElementById("category-trigger-text");
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById("category-trigger-icon-wrapper");
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="category-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll(".picker-item-category").forEach((btn) => {
    const isSelected = btn.getAttribute("data-id") === selectedId;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");
    const iconBox = btn.querySelector(".item-icon-box");
    const title = btn.querySelector(".item-title");

    if (isSelected) {
      btn.className =
        "picker-item-category w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
      if (iconBox)
        iconBox.className =
          "w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center flex-shrink-0 border border-rose-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-900 item-title";
    } else {
      btn.className =
        "picker-item-category w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
      if (iconBox)
        iconBox.className =
          "w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 item-icon-box";
      if (title) title.className = "text-sm font-black text-slate-800 item-title";
    }
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export function selectFormCondition(condId) {
  const selectedId = condId || "good";
  const input = document.getElementById("form-input-condition");
  if (input) input.value = selectedId;

  const meta = FORM_CONDITION_META[selectedId] || { name: "Mulus / Normal", icon: "check-circle-2" };

  const textEl = document.getElementById("condition-trigger-text");
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById("condition-trigger-icon-wrapper");
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="condition-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll(".picker-item-condition").forEach((btn) => {
    const isSelected = btn.getAttribute("data-id") === selectedId;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");

    if (isSelected) {
      btn.className =
        "picker-item-condition w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
    } else {
      btn.className =
        "picker-item-condition w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
    }
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export function selectFormNego(negoId) {
  const selectedId = negoId || "nego_alus";
  const input = document.getElementById("form-input-nego");
  if (input) input.value = selectedId;

  const meta = FORM_NEGO_META[selectedId] || { name: "Nego Alus (Wajar)", icon: "badge-percent" };

  const textEl = document.getElementById("nego-trigger-text");
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById("nego-trigger-icon-wrapper");
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="nego-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  document.querySelectorAll(".picker-item-nego").forEach((btn) => {
    const isSelected = btn.getAttribute("data-id") === selectedId;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");

    if (isSelected) {
      btn.className =
        "picker-item-nego w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
    } else {
      btn.className =
        "picker-item-nego w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
    }
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export function selectFormPaymentMethod(methodId) {
  const selectedId = methodId || "cod";
  const input = document.getElementById("form-input-payment-method");
  if (input) input.value = selectedId;

  const meta = FORM_PAYMENT_METHOD_META[selectedId] || { name: "COD (Ketemuan Langsung)", icon: "handshake" };

  const textEl = document.getElementById("payment-method-trigger-text");
  if (textEl) textEl.textContent = meta.name;

  const iconWrapper = document.getElementById("payment-method-trigger-icon-wrapper");
  if (iconWrapper) {
    iconWrapper.innerHTML = `<i data-lucide="${meta.icon}" id="payment-method-trigger-icon" class="w-3.5 h-3.5"></i>`;
  }

  // eslint-disable-next-line no-unused-vars
  const codPointContainer = document.getElementById("form-cod-point-container");
  const mapsUrlContainer = document.getElementById("form-maps-url-container");
  const labelCodPoint = document.getElementById("label-form-cod-point");

  if (selectedId === "in_store") {
    if (labelCodPoint) labelCodPoint.textContent = "Alamat Lengkap / Patokan Toko Fisik (Opsional)";
    if (mapsUrlContainer) mapsUrlContainer.classList.remove("hidden");
  } else {
    if (labelCodPoint) labelCodPoint.textContent = "Titik / Patokan Lokasi COD (Opsional)";
    if (mapsUrlContainer) mapsUrlContainer.classList.add("hidden");
  }

  document.querySelectorAll(".picker-item-payment-method").forEach((btn) => {
    const isSelected = btn.getAttribute("data-id") === selectedId;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");

    if (isSelected) {
      btn.className =
        "picker-item-payment-method w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
    } else {
      btn.className =
        "picker-item-payment-method w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
    }
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export function selectFormRegion(regionId) {
  const selectedRegId = regionId || "surakarta";
  const inputRegion = document.getElementById("form-input-region");
  if (inputRegion) inputRegion.value = selectedRegId;

  const regObj = SOLO_RAYA_REGIONS.find((r) => r.id === selectedRegId) || SOLO_RAYA_REGIONS[0];

  const textEl = document.getElementById("region-trigger-text");
  if (textEl) textEl.textContent = regObj.name;

  const dotEl = document.getElementById("region-trigger-dot");
  if (dotEl) dotEl.style.backgroundColor = regObj.accentColor || "#be123c";

  document.querySelectorAll(".picker-item-region").forEach((btn) => {
    const isSelected = btn.getAttribute("data-id") === selectedRegId;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");

    if (isSelected) {
      btn.className =
        "picker-item-region w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
    } else {
      btn.className =
        "picker-item-region w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
    }
  });

  renderDistrictPickerOptions(selectedRegId);
  const districts = getDistrictsByRegionId(selectedRegId);
  if (districts.length > 0) {
    selectFormDistrict(districts[0].name);
  }
}

export function renderDistrictPickerOptions(regionId) {
  const container = document.getElementById("picker-district-list-container");
  if (!container) return;

  const districts = getDistrictsByRegionId(regionId);
  if (districts.length === 0) {
    container.innerHTML =
      '<div class="p-4 text-center text-xs font-bold text-slate-500">Pilih Kota/Kabupaten terlebih dahulu</div>';
    return;
  }

  let html = "";
  districts.forEach((d) => {
    html += `
      <button
        type="button"
        data-district-name="${d.name}"
        class="picker-item-district w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
            <i data-lucide="map-pin" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="text-sm font-black text-slate-800">Kec. ${d.name}</div>
          </div>
        </div>
        <div class="check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0">
          <div class="check-dot w-2.5 h-2.5 rounded-full bg-rose-900 hidden"></div>
        </div>
      </button>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll(".picker-item-district").forEach((btn) => {
    btn.onclick = () => {
      const dName = btn.getAttribute("data-district-name");
      selectFormDistrict(dName);
    };
  });

  try {
    refreshIcons();
  } catch (_e) {}
}

export function selectFormDistrict(districtName) {
  const inputDistrict = document.getElementById("form-input-district");
  if (inputDistrict) inputDistrict.value = districtName || "";

  const textEl = document.getElementById("district-trigger-text");
  if (textEl) textEl.textContent = districtName ? `Kec. ${districtName}` : "Pilih Kecamatan";

  document.querySelectorAll(".picker-item-district").forEach((btn) => {
    const isSelected = btn.getAttribute("data-district-name") === districtName;
    const checkDot = btn.querySelector(".check-dot");
    const checkBox = btn.querySelector(".check-box");

    if (isSelected) {
      btn.className =
        "picker-item-district w-full px-3.5 py-2.5 rounded-2xl border-2 border-rose-900 bg-rose-50/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ring-2 ring-rose-900/20";
      if (checkDot) checkDot.classList.remove("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-rose-900 flex items-center justify-center flex-shrink-0";
    } else {
      btn.className =
        "picker-item-district w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer";
      if (checkDot) checkDot.classList.add("hidden");
      if (checkBox)
        checkBox.className =
          "check-box w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0";
    }
  });

  try {
    refreshIcons();
  } catch (_e) {}
}
