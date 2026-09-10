import { getSiteSettings } from "../../services/storage.js";

export function updateSortRadioUI() {
  const state = window.state || {};
  const currentSort = state.sortBy || "newest";
  const sortLabels = {
    newest: "Terbaru",
    price_low: "Termurah",
    price_high: "Termahal",
    views: "Banyak dilihat",
  };
  const labelEl = document.getElementById("current-sort-label");
  if (labelEl) labelEl.textContent = sortLabels[currentSort] || "Terbaru";
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = currentSort;

  document.querySelectorAll(".sort-option-item").forEach((item) => {
    const isSelected = item.getAttribute("data-sort-val") === currentSort;
    const indicator = item.querySelector(".sort-radio-indicator");
    const dot = item.querySelector(".sort-radio-dot");
    if (isSelected) {
      item.classList.add("bg-rose-50/80", "border-rose-200/90", "shadow-2xs");
      item.classList.remove("border-transparent", "hover:bg-slate-50");
      if (indicator) {
        indicator.className =
          "sort-radio-indicator flex-shrink-0 w-4.5 h-4.5 rounded-full border-2 border-rose-900 bg-white flex items-center justify-center shadow-xs";
      }
      if (dot) dot.className = "sort-radio-dot w-2 h-2 rounded-full bg-rose-900";
    } else {
      item.classList.remove("bg-rose-50/80", "border-rose-200/90", "shadow-2xs");
      item.classList.add("border-transparent", "hover:bg-slate-50");
      if (indicator) {
        indicator.className =
          "sort-radio-indicator flex-shrink-0 w-4.5 h-4.5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center";
      }
      if (dot) dot.className = "sort-radio-dot w-2 h-2 rounded-full bg-transparent";
    }
  });

  document.querySelectorAll(".sort-option-pill").forEach((pill) => {
    const isSelected = pill.getAttribute("data-sort-val") === currentSort;
    const icon =
      pill.querySelector("svg") ||
      pill.querySelector(".lucide") ||
      pill.querySelector('i[data-lucide="arrow-up-down"]');
    if (isSelected) {
      pill.classList.add(
        "bg-rose-900",
        "text-white",
        "border-rose-900",
        "ring-2",
        "ring-rose-900/20"
      );
      pill.classList.remove(
        "bg-white",
        "text-slate-700",
        "border-slate-200/90",
        "hover:bg-slate-50",
        "hover:border-slate-300"
      );
      if (icon) {
        icon.classList.remove("text-slate-400", "group-hover:text-slate-600");
        icon.classList.add("text-amber-300");
      }
    } else {
      pill.classList.remove(
        "bg-rose-900",
        "text-white",
        "border-rose-900",
        "ring-2",
        "ring-rose-900/20"
      );
      pill.classList.add(
        "bg-white",
        "text-slate-700",
        "border-slate-200/90",
        "hover:bg-slate-50",
        "hover:border-slate-300"
      );
      if (icon) {
        icon.classList.remove("text-amber-300");
        icon.classList.add("text-slate-400", "group-hover:text-slate-600");
      }
    }
  });
}

export function applyDetailImageSettings(customSettings = null) {
  const state = window.state || {};
  const settings = customSettings ||
    (state.siteSettings && state.siteSettings.detailImageSettings) ||
    getSiteSettings().detailImageSettings || {
      aspectRatio: "aspect-square",
      maxWidth: 448,
      maxHeight: 448,
      objectFit: "cover",
    };
  const container = document.getElementById("detail-photo-container");
  const img = document.getElementById("detail-image");
  if (container && img) {
    container.classList.remove(
      "aspect-[4/5]",
      "aspect-[4/3]",
      "aspect-square",
      "aspect-video"
    );
    if (settings.aspectRatio) container.classList.add(settings.aspectRatio);
    img.style.objectFit = settings.objectFit || "cover";
  }
}
