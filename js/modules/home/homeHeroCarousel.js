export function initHeroCarousel() {
  const carousel = document.getElementById("hero-banner-carousel");
  if (!carousel) return;

  const dots = document.querySelectorAll("#hero-carousel-dots .hero-dot");
  const prevBtn = document.getElementById("btn-carousel-prev");
  const nextBtn = document.getElementById("btn-carousel-next");
  const slides = Array.from(carousel.querySelectorAll(".hero-carousel-slide"));
  if (slides.length <= 1) return;

  let autoTimer = null;

  // eslint-disable-next-line no-unused-vars
  function updateDots(index) {
    if (!dots || !dots.length) return;
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add("bg-rose-700", "scale-110");
        dot.classList.remove("bg-rose-300/60", "scale-100");
      } else {
        dot.classList.remove("bg-rose-700", "scale-110");
        dot.classList.add("bg-rose-300/60", "scale-100");
      }
    });
  }

  function startAutoTimer() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      const currentScroll = carousel.scrollLeft;
      const slideWidth = slides[0].offsetWidth || 300;
      let nextScroll = currentScroll + slideWidth;
      if (nextScroll >= carousel.scrollWidth - slideWidth / 2) {
        nextScroll = 0;
      }
      carousel.scrollTo({ left: nextScroll, behavior: "smooth" });
    }, 5000);
  }

  function resetAutoTimer() {
    startAutoTimer();
  }

  nextBtn?.addEventListener("click", () => {
    resetAutoTimer();
    const slideWidth = slides[0].offsetWidth || 300;
    carousel.scrollBy({ left: slideWidth, behavior: "smooth" });
  });

  prevBtn?.addEventListener("click", () => {
    resetAutoTimer();
    const slideWidth = slides[0].offsetWidth || 300;
    carousel.scrollBy({ left: -slideWidth, behavior: "smooth" });
  });

  carousel.addEventListener("mouseenter", () => clearInterval(autoTimer));
  carousel.addEventListener("mouseleave", () => resetAutoTimer());
  carousel.addEventListener("touchstart", () => clearInterval(autoTimer), { passive: true });
  carousel.addEventListener("touchend", () => resetAutoTimer(), { passive: true });

  startAutoTimer();
}
