import { refreshIcons, deferTask } from "../../utils/runtime.js";
import { SOLO_RAYA_REGIONS, getRegionById } from "../../data/regions.js";
import { CATEGORIES } from "../../data/categories.js";
import { getPublicListings, getCustomTexts } from "../../services/storage.js";
import { setRegionFilter } from "../filter/filterController.js";

export function showHomeLoadingSkeleton() {
  const grid =
    document.getElementById("listings-grid") ||
    document.getElementById("listings-container");
  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.classList.add("hidden");
  if (grid) {
    grid.innerHTML = `
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse hidden md:block">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
      <div class="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5 animate-pulse hidden lg:block">
        <div class="w-full aspect-[4/3] bg-slate-200/70 rounded-xl"></div>
        <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200/70 rounded w-1/2"></div>
      </div>
    `;
  }
}


export function renderRegionPills() {
  const container = document.getElementById("region-pills-container");
  if (!container) return;
  const listings = getPublicListings();
  const state = window.state || {};
  const isLoaded =
    window.hasInitialListingsLoaded ||
    (Array.isArray(listings) && listings.length > 0 && !window.isInitialFeedLoading);
  const allCount = isLoaded ? (Array.isArray(listings) ? listings.length : 0) : "-";

  let html = `
    <button
      type="button"
      data-region="all"
      class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${"all" === state.selectedRegion ? "bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20" : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"}"
    >
      <span class="pointer-events-none">🌟 Semua</span>
      <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none pointer-events-none ${"all" === state.selectedRegion ? "bg-rose-800 text-amber-300" : "bg-slate-100 text-slate-600"}">${allCount}</span>
    </button>
  `;

  SOLO_RAYA_REGIONS.forEach((reg) => {
    const isSelected = state.selectedRegion === reg.id;
    const count = isLoaded
      ? Array.isArray(listings)
        ? listings.filter((l) => l.regionId === reg.id).length
        : 0
      : "-";
    html += `
      <button
        type="button"
        data-region="${reg.id}"
        class="region-pill flex-shrink-0 flex items-center gap-1 h-6 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all select-none shadow-2xs cursor-pointer ${isSelected ? "bg-rose-900 text-white border-rose-900 ring-2 ring-rose-900/20" : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"}"
      >
        <span class="w-2 h-2 rounded-full flex-shrink-0 pointer-events-none" style="background-color: ${reg.accentColor}"></span>
        <span class="truncate pointer-events-none">${reg.shortName}</span>
        <span class="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black leading-none flex-shrink-0 pointer-events-none ${isSelected ? "bg-rose-800 text-amber-300" : "bg-slate-100 text-slate-600"}">${count}</span>
      </button>
    `;
  });

  container.innerHTML = html;
  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-region]");
      if (targetBtn) {
        e.preventDefault();
        e.stopPropagation();
        const regionId = targetBtn.getAttribute("data-region");
        if (regionId) setRegionFilter(regionId);
      }
    });
  }

  const indicator = document.getElementById("region-current-indicator");
  if (indicator) {
    if ("all" === state.selectedRegion) {
      indicator.textContent =
        state.customTexts?.region_indicator_all ||
        "Menampilkan: 7 Wilayah Solo Raya";
    } else {
      const reg = getRegionById(state.selectedRegion);
      indicator.textContent = `Menampilkan: ${reg ? reg.name : state.selectedRegion}`;
    }
  }
}

export function renderCategoryPills() {
  const container = document.getElementById("category-pills-container");
  if (!container) return;
  const state = window.state || {};
  let html = "";

  CATEGORIES.forEach((cat) => {
    const isSelected = state.selectedCategory === cat.id;
    const labelHtml = cat.displayHtml || cat.name;
    html += `
      <button
        type="button"
        data-category="${cat.id}"
        class="category-pill flex flex-col items-center justify-start flex-shrink-0 w-[52px] min-[380px]:w-[58px] sm:w-[68px] group cursor-pointer text-center select-none"
        title="${cat.name}"
      >
        <div class="w-[44px] h-[44px] min-[380px]:w-[48px] min-[380px]:h-[48px] sm:w-[56px] sm:h-[56px] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${isSelected ? "bg-rose-900 text-amber-300 shadow-sm ring-2 ring-rose-900/25 scale-105 border-2 border-rose-800" : "bg-white text-rose-900 border border-[#e2e8f2]/90 shadow-2xs group-hover:bg-slate-50 group-hover:border-rose-300 group-hover:scale-105"}">
          <i data-lucide="${cat.icon}" class="w-5 h-5 min-[380px]:w-5.5 min-[380px]:h-5.5 sm:w-6.5 sm:h-6.5 transition-transform group-hover:scale-110"></i>
        </div>
        <span class="mt-1 px-0.5 text-[8px] min-[360px]:text-[8.5px] min-[380px]:text-[9.5px] sm:text-[10.5px] font-bold leading-[1.15] text-center tracking-tight transition-colors h-5.5 min-[380px]:h-6 sm:h-6.5 flex items-start justify-center overflow-hidden ${isSelected ? "text-rose-950 font-black" : "text-slate-700 group-hover:text-rose-900"}">
          ${labelHtml}
        </span>
      </button>
    `;
  });

  container.innerHTML = html;
  if (!container.__hasDelegatedClick) {
    container.__hasDelegatedClick = true;
    container.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-category]");
      if (pill) {
        e.preventDefault();
        const catId = pill.getAttribute("data-category");
        if (catId && state.selectedCategory !== catId) {
          state.selectedCategory = catId;
          renderCategoryPills();
          deferTask(() => {
            if (typeof window.renderListings === "function") window.renderListings();
          });
        }
      }
    });
  }
  refreshIcons(container);
}

export function initHeroBannerCarousel() {
  const carousel = document.getElementById("hero-banner-carousel");
  const dotsContainer = document.getElementById("hero-carousel-dots");
  const prevBtn = document.getElementById("btn-carousel-prev");
  const nextBtn = document.getElementById("btn-carousel-next");
  if (!carousel || !dotsContainer) return;

  carousel
    .querySelectorAll(".btn-trigger-create-listing, #btn-hero-create-listing")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (typeof window.openCreateListingModal === "function") {
          window.openCreateListingModal();
        }
      };
    });

  const originalSlides = Array.from(
    carousel.querySelectorAll(".hero-carousel-slide:not(.clone)")
  );
  if (originalSlides.length < 2) return;
  const totalOriginal = originalSlides.length;

  carousel
    .querySelectorAll(".hero-carousel-slide.clone")
    .forEach((el) => el.remove());

  const firstClone = originalSlides[0].cloneNode(true);
  firstClone.classList.add("clone");
  firstClone.setAttribute("data-clone", "first");

  const lastClone = originalSlides[totalOriginal - 1].cloneNode(true);
  lastClone.classList.add("clone");
  lastClone.setAttribute("data-clone", "last");

  carousel.insertBefore(lastClone, originalSlides[0]);
  carousel.appendChild(firstClone);

  [firstClone, lastClone].forEach((clone) => {
    clone
      .querySelectorAll(".btn-trigger-create-listing, #btn-hero-create-listing")
      .forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          if (typeof window.openCreateListingModal === "function") {
            window.openCreateListingModal();
          }
        };
      });
  });

  const allSlides = Array.from(carousel.querySelectorAll(".hero-carousel-slide"));
  const dots = dotsContainer.querySelectorAll(".hero-dot");
  let currentIndex = 1;
  let isTransitioning = false;
  let autoTimer = null;

  function getSlideOffset(slideIndex) {
    const slide = allSlides[slideIndex];
    return slide
      ? slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2
      : 0;
  }

  function scrollToSlide(slideIndex, smooth = true) {
    if (slideIndex < 0 || slideIndex >= allSlides.length) return;
    currentIndex = slideIndex;
    const slide = allSlides[slideIndex];
    const offsetLeft =
      slide.offsetLeft - carousel.clientWidth / 2 + slide.clientWidth / 2;
    if (typeof carousel.scrollTo === "function") {
      if (smooth) {
        carousel.scrollTo({ left: offsetLeft, behavior: "smooth" });
      } else {
        carousel.style.scrollBehavior = "auto";
        carousel.scrollTo({ left: offsetLeft, behavior: "auto" });
        carousel.offsetWidth;
        carousel.style.scrollBehavior = "smooth";
      }
    } else {
      carousel.scrollLeft = offsetLeft;
    }
    updateDots();
  }

  function updateDots() {
    let realIdx =
      0 === currentIndex
        ? totalOriginal - 1
        : currentIndex === allSlides.length - 1
          ? 0
          : currentIndex - 1;

    dots.forEach((dot, idx) => {
      dot.className =
        idx === realIdx
          ? "hero-dot w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-700 transition-all duration-300 cursor-pointer shadow-xs scale-110"
          : "hero-dot w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-300/60 transition-all duration-300 cursor-pointer scale-100";
    });
  }

  const rAF = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
  rAF(() => {
    scrollToSlide(1, false);
    refreshIcons();
  });

  let scrollTimeout = null;
  let scrollRaf = null;

  function nextSlide() {
    if (currentIndex >= allSlides.length - 1) {
      scrollToSlide(1, false);
      setTimeout(() => scrollToSlide(2, true), 30);
    } else {
      scrollToSlide(currentIndex + 1, true);
    }
  }

  function startAutoTimer() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      nextSlide();
    }, 6000);
  }

  function resetAutoTimer() {
    startAutoTimer();
  }

  carousel.addEventListener(
    "scroll",
    () => {
      if (!scrollRaf) {
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = null;
          const currentScroll = carousel.scrollLeft;
          let closestIdx = 1;
          let minDiff = Infinity;
          allSlides.forEach((slide, idx) => {
            const diff = Math.abs(currentScroll - getSlideOffset(idx));
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = idx;
            }
          });
          if (closestIdx !== currentIndex) {
            currentIndex = closestIdx;
            updateDots();
          }
        });
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isTransitioning) return;
        const currentScroll = carousel.scrollLeft;
        let closestIdx = 1;
        let minDiff = Infinity;
        allSlides.forEach((slide, idx) => {
          const diff = Math.abs(currentScroll - getSlideOffset(idx));
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        currentIndex = closestIdx;
        updateDots();
        if (closestIdx === 0) {
          isTransitioning = true;
          scrollToSlide(totalOriginal, false);
          setTimeout(() => {
            isTransitioning = false;
          }, 60);
        } else if (closestIdx === allSlides.length - 1) {
          isTransitioning = true;
          scrollToSlide(1, false);
          setTimeout(() => {
            isTransitioning = false;
          }, 60);
        }
      }, 60);
    },
    { passive: true }
  );

  nextBtn?.addEventListener("click", () => {
    resetAutoTimer();
    nextSlide();
  });

  prevBtn?.addEventListener("click", () => {
    resetAutoTimer();
    if (currentIndex <= 0) {
      scrollToSlide(totalOriginal, false);
      setTimeout(() => scrollToSlide(totalOriginal - 1, true), 30);
    } else {
      scrollToSlide(currentIndex - 1, true);
    }
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      resetAutoTimer();
      scrollToSlide(
        parseInt(dot.getAttribute("data-slide-index") || "0", 10) + 1,
        true
      );
    });
  });

  carousel.addEventListener("touchstart", () => clearInterval(autoTimer), {
    passive: true,
  });
  carousel.addEventListener("touchend", () => resetAutoTimer(), {
    passive: true,
  });

  startAutoTimer();
}

export function applyCustomTexts(texts) {
  if (!texts) return;
  const state = window.state || {};
  state.customTexts = texts;
  document.querySelectorAll("[data-text-key]").forEach((el) => {
    const key = el.getAttribute("data-text-key");
    if (
      texts[key] !== undefined &&
      texts[key] !== null &&
      typeof texts[key] === "string" &&
      texts[key].trim() !== ""
    ) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("placeholder")) el.setAttribute("placeholder", texts[key]);
        else el.value = texts[key];
      } else {
        el.textContent = texts[key];
      }
    }
  });

  const indicator = document.getElementById("region-current-indicator");
  if (indicator && state.selectedRegion === "all") {
    indicator.textContent =
      texts.region_indicator_all || "Menampilkan: 7 Wilayah Solo Raya";
  }
}

export function applySiteSettings(settings) {
  if (!settings) return;
  const state = window.state || {};
  document.body.classList.remove(
    "font-sans",
    "font-serif",
    "font-mono",
    "font-poppins",
    "font-inter",
    "font-roboto",
    "font-montserrat",
    "font-outfit",
    "font-playfair"
  );
  if (settings.fontFamily === "serif") document.body.classList.add("font-serif");
  else if (settings.fontFamily === "mono") document.body.classList.add("font-mono");
  else if (settings.fontFamily === "poppins") document.body.classList.add("font-poppins");
  else if (settings.fontFamily === "inter") document.body.classList.add("font-inter");
  else if (settings.fontFamily === "roboto") document.body.classList.add("font-roboto");
  else if (settings.fontFamily === "montserrat") document.body.classList.add("font-montserrat");
  else if (settings.fontFamily === "outfit") document.body.classList.add("font-outfit");
  else if (settings.fontFamily === "playfair") document.body.classList.add("font-playfair");
  else document.body.classList.add("font-sans");

  if (settings.textStyles) {
    Object.keys(settings.textStyles).forEach((key) => {
      const style = settings.textStyles[key];
      if (style) {
        document.querySelectorAll(`[data-text-key="${key}"]`).forEach((el) => {
          if (style.fontFamily && style.fontFamily !== "inherit") el.style.fontFamily = style.fontFamily;
          if (style.fontSize) el.style.fontSize = style.fontSize;
          if (style.fontWeight) el.style.fontWeight = style.fontWeight;
          if (style.fontStyle) el.style.fontStyle = style.fontStyle;
          if (style.textDecoration) el.style.textDecoration = style.textDecoration;
          if (style.color) el.style.color = style.color;
        });
      }
    });
  }

  const heroSection = document.getElementById("hero-banner-section");
  const regionSection = document.getElementById("region-filter-section");
  const mainContainer = document.getElementById("main-content-container");
  if (heroSection && regionSection && mainContainer) {
    if (settings.filterPosition === "above_hero") {
      mainContainer.insertBefore(regionSection, heroSection);
    } else {
      mainContainer.insertBefore(heroSection, regionSection);
    }
  }

  const announcementBar = document.getElementById("site-announcement-bar");
  const announcementText = document.getElementById("site-announcement-text");
  if (announcementBar && announcementText) {
    if (settings.showAnnouncement !== false) {
      announcementBar.classList.remove("hidden");
      if (state.customTexts && state.customTexts.announcement_text) {
        announcementText.textContent = state.customTexts.announcement_text;
      } else if (settings.announcementText) {
        announcementText.textContent = settings.announcementText;
      }
    } else {
      announcementBar.classList.add("hidden");
    }
  }

  const logoContainer = document.getElementById("brand-logo-icon-container");
  if (logoContainer) {
    let finalImgUrl = "assets/img/app-logo.png?v=2.1";
    if (settings && settings.logoImageUrl && settings.logoImageUrl.trim() !== "") {
      const rawUrl = settings.logoImageUrl.trim();
      if (rawUrl.startsWith("data:")) finalImgUrl = rawUrl;
      else if (!rawUrl.includes("logo.png") && !rawUrl.includes("app-logo")) {
        finalImgUrl = `${rawUrl.split("?")[0]}?v=2.1`;
      }
    }
    logoContainer.className =
      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform bg-[#58111a] border border-white/20";
    logoContainer.innerHTML = `<img src="${finalImgUrl}" alt="Logo solosatset" class="w-full h-full object-contain pointer-events-none rounded-xl" onerror="this.src='assets/img/app-logo.png?v=2.1'">`;
  }
}

if (typeof window !== "undefined") {
  window.renderRegionPills = renderRegionPills;
  window.renderCategoryPills = renderCategoryPills;
  window.initHeroBannerCarousel = initHeroBannerCarousel;
  window.applyCustomTexts = applyCustomTexts;
  window.applySiteSettings = applySiteSettings;
}
