import React from "react";

export interface NavBrandProps {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  href?: string;
}

export const NavBrand: React.FC<NavBrandProps> = ({
  title = "SOPALOKA",
  subtitle = "Pusat Jual Beli Terdekat",
  logoSrc,
  href = "#",
}) => {
  return (
    <a href={href} className="flex items-center space-x-3 group text-decoration-none">
      {logoSrc ? (
        <img src={logoSrc} alt={title} className="h-8 w-auto object-contain" />
      ) : (
        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:bg-red-700 transition-colors">
          S
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-lg font-bold text-gray-900 leading-none tracking-tight group-hover:text-red-600 transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </a>
  );
};
