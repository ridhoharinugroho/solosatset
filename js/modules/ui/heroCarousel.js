import { refreshIcons } from '../../utils/runtime.js';

export function initHeroBannerCarousel() {
  const container = document.getElementById('hero-banner-carousel');
  const slides = container ? container.querySelectorAll('.hero-banner-slide') : [];
  const dots = document.querySelectorAll('.hero-carousel-dot');
  const btnPrev = document.getElementById('btn-hero-carousel-prev');
  const btnNext = document.getElementById('btn-hero-carousel-next');

  if (!container || slides.length <= 1) return;

  let currentSlideIndex = 0;
  let autoTimer = null;
  let isScrollLock = false;

  function getSlideOffset(slideIndex) {
    if (!slides[slideIndex]) return 0;
    return slides[slideIndex].offsetLeft;
  }

  function scrollToSlide(slideIndex, smooth = true) {
    if (slideIndex < 0 || slideIndex >= slides.length) return;
    currentSlideIndex = slideIndex;
    isScrollLock = true;

    const targetOffset = getSlideOffset(slideIndex);
    container.scrollTo({
      left: targetOffset,
      behavior: smooth ? 'smooth' : 'auto'
    });

    updateDots(slideIndex);

    setTimeout(() => {
      isScrollLock = false;
    }, 450);
  }

  function updateDots(activeIdx) {
    dots.forEach((dot, idx) => {
      const isSelected = idx === activeIdx;
      if (isSelected) {
        dot.className = "hero-carousel-dot w-6 h-2.5 rounded-full bg-rose-900 shadow-sm transition-all duration-300 cursor-pointer";
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.className = "hero-carousel-dot w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-all duration-300 cursor-pointer";
        dot.setAttribute('aria-selected', 'false');
      }
    });
  }

  function updateDotsOnScroll() {
    if (isScrollLock) return;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth || 1;

    let closestIdx = 0;
    let minDistance = Infinity;

    slides.forEach((slide, idx) => {
      const distance = Math.abs(slide.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== currentSlideIndex) {
      currentSlideIndex = closestIdx;
      updateDots(closestIdx);
    }
  }

  let scrollTimeout = null;
  container.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateDotsOnScroll, 60);
  }, { passive: true });

  function nextSlide() {
    const nextIdx = (currentSlideIndex + 1) % slides.length;
    scrollToSlide(nextIdx, true);
  }

  function prevSlide() {
    const prevIdx = (currentSlideIndex - 1 + slides.length) % slides.length;
    scrollToSlide(prevIdx, true);
  }

  if (btnNext) {
    btnNext.onclick = (e) => {
      e.preventDefault();
      nextSlide();
      resetAutoTimer();
    };
  }

  if (btnPrev) {
    btnPrev.onclick = (e) => {
      e.preventDefault();
      prevSlide();
      resetAutoTimer();
    };
  }

  dots.forEach((dot) => {
    dot.onclick = (e) => {
      e.preventDefault();
      const targetIdx = parseInt(dot.getAttribute('data-slide-index'), 10);
      if (!isNaN(targetIdx)) {
        scrollToSlide(targetIdx, true);
        resetAutoTimer();
      }
    };
  });

  function startAutoTimer() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      nextSlide();
    }, 5500);
  }

  function resetAutoTimer() {
    if (autoTimer) clearInterval(autoTimer);
    startAutoTimer();
  }

  container.addEventListener('mouseenter', () => {
    if (autoTimer) clearInterval(autoTimer);
  });

  container.addEventListener('mouseleave', () => {
    startAutoTimer();
  });

  container.addEventListener('touchstart', () => {
    if (autoTimer) clearInterval(autoTimer);
  }, { passive: true });

  container.addEventListener('touchend', () => {
    resetAutoTimer();
  }, { passive: true });

  scrollToSlide(0, false);
  startAutoTimer();
}

if (typeof window !== 'undefined') {
  window.initHeroBannerCarousel = initHeroBannerCarousel;
}
