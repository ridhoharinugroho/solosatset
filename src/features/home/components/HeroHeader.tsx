import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, PlusCircle, CheckCircle2, MapPin } from "lucide-react";

export interface HeroHeaderProps {
  onCreateListingClick?: () => void;
  className?: string;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  onCreateListingClick,
  className = "",
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
      setActiveSlide((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
      setActiveSlide((prev) => Math.min(2, prev + 1));
    }
  };

  const handleDotClick = (index: number) => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.scrollWidth / 3;
      carouselRef.current.scrollTo({ left: slideWidth * index, behavior: "smooth" });
      setActiveSlide(index);
    }
  };

  return (
    <section id="hero-banner-section" className={`relative overflow-hidden group mt-0 pt-0 pb-0 mb-0 w-full ${className}`.trim()}>
      {/* Left & Right Nav Buttons (Desktop & Hover) */}
      <button
        type="button"
        id="btn-carousel-prev"
        onClick={handlePrev}
        className="hidden sm:flex absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white backdrop-blur-sm items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer opacity-70 hover:opacity-100"
        title="Banner Sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        id="btn-carousel-next"
        onClick={handleNext}
        className="hidden sm:flex absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white backdrop-blur-sm items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer opacity-70 hover:opacity-100"
        title="Banner Selanjutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Carousel Track with Peek-a-boo Snapping */}
      <div
        id="hero-banner-carousel"
        ref={carouselRef}
        className="relative z-10 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 px-[calc(50%-146.64px)] pt-0 pb-0 scroll-smooth w-full items-center"
      >
        {/* Slide 1: Welcome & Hub Solo Raya */}
        <div
          data-slide="0"
          className="hero-carousel-slide snap-center flex-none w-[293.28px] min-w-[293.28px] max-w-[293.28px] h-[146.64px] min-h-[146.64px] max-h-[146.64px] overflow-hidden rounded-xl relative bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white p-4 sm:p-5 shadow-md flex flex-col justify-between gap-1 select-none sm:w-[min(75vw,760px)] sm:h-auto sm:aspect-video sm:min-w-0 sm:max-w-none sm:min-h-0 sm:max-h-none sm:rounded-2xl"
        >
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-800/80 border border-rose-700/60 text-amber-300 text-[10px] sm:text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Pusat Jual Beli Komunitas</span>
            </div>
            <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight line-clamp-1 sm:line-clamp-2">
              Cari & Jual Barang Terdekat di Mana Saja
            </h2>
            <p className="text-[10px] sm:text-sm text-rose-100/90 leading-tight font-medium opacity-90 line-clamp-2">
              Temukan barang terdekat di mana saja, pantau barangnya, cocokkan barangnya, hubungi penjualnya, bayar langsung ke orangnya, bawa pulang barang idamannya.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCreateListingClick}
              className="btn-trigger-create-listing px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[10px] sm:text-sm font-black flex items-center gap-1 shadow-xs transition-transform hover:scale-105 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Pasang Iklan Gratis</span>
            </button>
            <span className="text-[10px] sm:text-sm text-amber-200/80 font-bold hidden sm:inline line-clamp-1">
              ⚡ Pantau Cocok Bayar
            </span>
          </div>
        </div>

        {/* Slide 2: Panduan Transaksi Aman COD */}
        <div
          data-slide="1"
          className="hero-carousel-slide snap-center flex-none w-[293.28px] min-w-[293.28px] max-w-[293.28px] h-[146.64px] min-h-[146.64px] max-h-[146.64px] overflow-hidden rounded-xl relative bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white p-4 sm:p-5 shadow-md flex flex-col justify-between gap-1 select-none sm:w-[min(75vw,760px)] sm:h-auto sm:aspect-video sm:min-w-0 sm:max-w-none sm:min-h-0 sm:max-h-none sm:rounded-2xl"
        >
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] sm:text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Panduan Transaksi Amanah</span>
            </div>
            <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight line-clamp-1 sm:line-clamp-2">
              Tips Aman Pantau Cocok Bayar (COD)
            </h2>
            <p className="text-[10px] sm:text-sm text-slate-300 leading-tight font-medium opacity-90 line-clamp-2">
              Utamakan bertemu di tempat terang & ramai. Pastikan selalu cek fungsi & fisik barang secara langsung sebelum melakukan pembayaran!
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] sm:text-sm font-black">
              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
              <span>Utamakan Cek Fisik Barang</span>
            </span>
          </div>
        </div>

        {/* Slide 3: Jangkauan Wilayah Indonesia */}
        <div
          data-slide="2"
          className="hero-carousel-slide snap-center flex-none w-[293.28px] min-w-[293.28px] max-w-[293.28px] h-[146.64px] min-h-[146.64px] max-h-[146.64px] overflow-hidden rounded-xl relative bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950 text-white p-4 sm:p-5 shadow-md flex flex-col justify-between gap-1 select-none sm:w-[min(75vw,760px)] sm:h-auto sm:aspect-video sm:min-w-0 sm:max-w-none sm:min-h-0 sm:max-h-none sm:rounded-2xl"
        >
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-900/60 border border-amber-700/50 text-amber-300 text-[10px] sm:text-xs font-bold shadow-xs">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Jangkauan Wilayah Indonesia</span>
            </div>
            <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight line-clamp-1 sm:line-clamp-2">
              Belanja Barang Terdekat dari Rumahmu
            </h2>
            <p className="text-[10px] sm:text-sm text-amber-100/90 leading-tight font-medium opacity-90 line-clamp-2">
              Gunakan filter wilayah di bawah untuk memantau barang jualan per wilayah dan kecamatan terdekat dari lokasi Anda.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 pt-1">
            <span className="px-3 py-1.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-lg text-[10px] sm:text-sm font-black">
              📍 Cari Wilayah Terdekat • Transaksi Langsung
            </span>
          </div>
        </div>
      </div>

      {/* Carousel Pagination Dots */}
      <div
        id="hero-carousel-dots"
        className="relative z-10 flex items-center justify-center gap-1.5 mt-2 mb-0 h-auto py-0 leading-none"
      >
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`hero-dot w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === idx
                ? "bg-rose-700 scale-110 shadow-xs"
                : "bg-rose-300/60 scale-100 hover:bg-rose-400"
            }`}
            data-slide-index={idx}
          />
        ))}
      </div>
    </section>
  );
};
