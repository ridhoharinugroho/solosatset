import React, { useState } from "react";
import { Share2, MapPin, MessageCircle, Send, Users, Copy, Check, X } from "lucide-react";
import type { ListingModel } from "../../domain/listing/listing.contract";

export interface SocialShareModalProps {
  isOpen: boolean;
  listing?: ListingModel | null;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  listing,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !listing) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const formattedPrice = typeof listing.price === "number" ? `Rp ${listing.price.toLocaleString("id-ID")}` : listing.price;
  const shareText = `Lihat ${listing.title} - ${formattedPrice} di SOPALOKA!`;
  const locationText = listing.district ? `${listing.district}, ${listing.regionId}` : listing.regionId || "Solo Raya";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-share-product"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="modal-content relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-4 sm:p-5 space-y-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Bagikan Iklan</h3>
              <p className="text-[11px] text-slate-500">Pilih media sosial untuk membagikan iklan ini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Preview Snippet */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
          <img
            src={listing.images?.[0] || "/assets/img/app-logo.png"}
            alt={listing.title}
            className="w-12 h-12 rounded-lg object-cover border border-slate-300 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate">{listing.title}</div>
            <div className="font-black text-xs text-rose-900">{formattedPrice}</div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-rose-700 flex-shrink-0" />
              <span>{locationText}</span>
            </div>
          </div>
        </div>

        {/* 5 Social Media Share Options */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs font-semibold">
          {/* WA */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex flex-col items-center gap-1 transition-all hover:scale-105 group shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">WA</span>
          </a>

          {/* FB */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 flex flex-col items-center gap-1 transition-all hover:scale-105 group shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-black text-xs">f</span>
            </div>
            <span className="text-[10px] font-bold">FB</span>
          </a>

          {/* IG */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 sm:p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-800 flex flex-col items-center gap-1 transition-all hover:scale-105 group shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform font-black text-xs">
              IG
            </div>
            <span className="text-[10px] font-bold">IG</span>
          </button>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 flex flex-col items-center gap-1 transition-all hover:scale-105 group shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold">Telegram</span>
          </a>

          {/* Grup WA */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex flex-col items-center gap-1 transition-all hover:scale-105 group shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-[10px] font-bold">Grup WA</span>
          </a>
        </div>

        {/* Copy Link Row */}
        <div className="space-y-1 pt-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Salin Tautan Iklan:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Tersalin!" : "Salin"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
