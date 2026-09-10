import { generateWhatsAppUrl, generateShareWhatsAppUrl, formatRupiah } from "../../services/whatsapp.js";
import { isFavorite, toggleFavorite } from "../../services/storageFavorites.js";

export function handleShareListing(item) {
  if (!item) return;
  const shareUrl = generateShareWhatsAppUrl(item);
  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }
}

export function handleToggleFavorite(itemId) {
  if (!itemId) return false;
  return toggleFavorite(itemId);
}

export function checkIsFavorite(itemId) {
  if (!itemId) return false;
  return isFavorite(itemId);
}

export function getFormattedPrice(price) {
  return formatRupiah(price || 0);
}
