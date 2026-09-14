import React from "react";

export interface TokoHeaderProps {
  storeName?: string;
  location?: string;
  isVerified?: boolean;
  onCreateListingClick?: () => void;
  className?: string;
}

export const TokoHeader: React.FC<TokoHeaderProps> = ({
  storeName = "Toko Saya",
  location = "Indonesia",
  isVerified = true,
  onCreateListingClick,
  className = "",
}) => {
  return (
    <div className={`bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`.trim()}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-800 to-rose-950 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
          {storeName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            {isVerified && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                Verifikasi OK
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">📍 {location}</p>
        </div>
      </div>

      {onCreateListingClick && (
        <button
          type="button"
          onClick={onCreateListingClick}
          className="w-full sm:w-auto px-5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>+</span> Buat Listing Baru
        </button>
      )}
    </div>
  );
};
