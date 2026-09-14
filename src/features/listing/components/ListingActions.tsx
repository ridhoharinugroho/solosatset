import React from "react";
import { Button } from "../../../components/ui/Button";
import type { ListingModel } from "../../../domain/listing/listing.contract";

export interface ListingActionsProps {
  listing: ListingModel;
  onContactClick?: (phone: string, title: string) => void;
  onShareClick?: (listing: ListingModel) => void;
  onClose?: () => void;
  className?: string;
}

export const ListingActions: React.FC<ListingActionsProps> = ({
  listing,
  onContactClick,
  onShareClick,
  onClose,
  className = "",
}) => {
  const handleChat = () => {
    if (onContactClick) {
      onContactClick(listing.seller.phone, listing.title);
      return;
    }
    const cleanPhone = (listing.seller.phone || "").replace(/\D/g, "");
    const targetPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const msg = encodeURIComponent(
      `Halo ${listing.seller.storeName}, saya tertarik dengan barang "${listing.title}" di SOPALOKA.`
    );
    window.open(`https://wa.me/${targetPhone}?text=${msg}`, "_blank");
  };

  const handleShare = () => {
    if (onShareClick) {
      onShareClick(listing);
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Cek barang ${listing.title} di SOPALOKA!`,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan barang berhasil disalin!");
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 ${className}`.trim()}>
      <div className="flex items-center space-x-2 flex-1">
        <Button
          variant="primary"
          size="md"
          onClick={handleChat}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 font-semibold"
        >
          💬 Chat Penjual (WhatsApp)
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={handleShare}
          title="Bagikan barang"
        >
          🔗 Bagikan
        </Button>
      </div>

      {onClose && (
        <Button variant="ghost" size="md" onClick={onClose}>
          Tutup
        </Button>
      )}
    </div>
  );
};
