import React, { useState, useEffect } from "react";
import type { ListingModel } from "../../../domain/listing/listing.contract";
import { Heart, MapPin, CheckCircle, MessageCircle, Eye, Tag } from "lucide-react";
import { isFavorite as checkIsFavorite, toggleFavorite } from "../../../services/listingService";

export interface ListingCardProps {
  listing: ListingModel;
  onCardClick?: (listing: ListingModel) => void;
  onFavoriteToggle?: (listingId: string, event: React.MouseEvent) => void;
  onChatWaClick?: (listing: ListingModel, event: React.MouseEvent) => void;
  isFavorite?: boolean;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onCardClick,
  onFavoriteToggle,
  onChatWaClick,
  isFavorite: propIsFavorite,
  className = "",
}) => {
  const [isFav, setIsFav] = useState<boolean>(() => {
    if (propIsFavorite !== undefined) return propIsFavorite;
    return checkIsFavorite(listing.id);
  });

  useEffect(() => {
    if (propIsFavorite !== undefined) {
      setIsFav(propIsFavorite);
    }
  }, [propIsFavorite]);

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const mainImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : "https://via.placeholder.com/400x300?text=SOPALOKA";

  const locationText = listing.village
    ? `${listing.district || listing.regionId || "Solo"} • ${listing.village}`
    : listing.district
    ? `Solo • ${listing.district}`
    : listing.regionId || "Solo Raya";

  const isNego = listing.negoType !== "pass";
  const sellerName = listing.seller?.name || "Danang";

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = await toggleFavorite(listing.id);
    setIsFav(nextState);
    onFavoriteToggle?.(listing.id, e);
  };

  return (
    <div
      onClick={() => onCardClick?.(listing)}
      className={`product-card group bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between overflow-hidden relative cursor-pointer ${className}`.trim()}
    >
      <div>
        {/* Image Container with Aspect Square Ratio */}
        <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
          <img
            src={mainImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Top Left: DEMO Account Badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-500 shadow-md flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" />
              <span>DEMO</span>
            </span>
          </div>

          {/* Top Right: Favorite Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 shadow-sm transition-all cursor-pointer ${
              isFav ? "text-rose-600 fill-rose-600" : "text-slate-400 hover:text-rose-600 hover:scale-110"
            }`}
            title="Simpan ke favorit"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-rose-600 text-rose-600" : ""}`} />
          </button>

          {/* Bottom Left: Location Pill */}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-800 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[140px]">{locationText}</span>
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-2.5 pb-1 space-y-1.5">
          {/* Price & Price Badges */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-rose-900 font-black text-sm sm:text-base tracking-tight leading-tight">
              {formattedPrice}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-bold shadow-2xs ${
                  isNego
                    ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                }`}
              >
                {isNego ? "Bisa Nego" : "Nett"}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>COD</span>
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-slate-800 font-bold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-rose-900 transition-colors">
            {listing.title}
          </h3>

          {/* Seller Status & Post Time */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
            <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-slate-700 truncate max-w-[80px]">
              {sellerName}
            </span>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[8px] px-1 rounded">
              DEMO
            </span>
            <span className="text-slate-400">• Aktif</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Chat WA + Detail Eye Button */}
      <div className="pt-2 mt-1 border-t border-slate-100 flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onChatWaClick) {
              onChatWaClick(listing, e);
            } else {
              const waUrl = `https://wa.me/6281228198765?text=${encodeURIComponent(
                `Halo ${sellerName}, saya berminat dengan barang "${listing.title}" di SOPALOKA.`
              )}`;
              window.open(waUrl, "_blank");
            }
          }}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Chat WA</span>
        </button>

        <button
          type="button"
          onClick={() => onCardClick?.(listing)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl p-1.5 flex items-center justify-center transition-colors cursor-pointer"
          title="Lihat Detail Barang"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

