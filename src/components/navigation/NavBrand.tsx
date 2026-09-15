import React from "react";

export interface NavBrandProps {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  href?: string;
  onLogoClick?: () => void;
}

export const NavBrand: React.FC<NavBrandProps> = ({
  title = "SOPALOKA",
  subtitle = "Pantau Cocok Bayar • Nego Langsung WA",
  logoSrc = "/assets/img/app-logo.png",
  href = "/",
  onLogoClick,
}) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onLogoClick) {
          e.preventDefault();
          onLogoClick();
        }
      }}
      id="brand-header"
      className="flex items-center gap-2 group flex-shrink min-w-0 select-none"
    >
      <div
        id="brand-logo-icon-container"
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform bg-white border border-rose-200"
        title={`${title} (Klik 10x untuk Akses Admin)`}
      >
        <img
          src={logoSrc}
          alt={`Logo ${title}`}
          className="w-full h-full object-contain pointer-events-none rounded-xl"
          width={36}
          height={36}
          loading="eager"
        />
      </div>
      <div className="flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
          <span
            data-text-key="brand_name"
            className="font-black text-base sm:text-xl tracking-tight text-rose-950 truncate cursor-pointer"
          >
            {title}
          </span>
        </div>
        <span
          data-text-key="brand_subtagline"
          className="text-[9.5px] sm:text-[11px] text-rose-700 font-bold tracking-tight mt-0.5 leading-tight truncate cursor-pointer"
        >
          {subtitle}
        </span>
      </div>
    </a>
  );
};


