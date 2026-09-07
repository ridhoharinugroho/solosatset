export const FALLBACK_JOINED_DATE = 'Bergabung';

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function formatRegionTitle(value, fallback = 'Solo') {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return fallback;
  if (normalized === 'surakarta' || normalized === 'solo') return 'Solo';
  if (normalized === 'solo raya') return 'Solo Raya';
  const names = {
    karanganyar: 'Karanganyar',
    sukoharjo: 'Sukoharjo',
    klaten: 'Klaten',
    boyolali: 'Boyolali',
    wonogiri: 'Wonogiri',
    sragen: 'Sragen'
  };
  return names[normalized] || normalizeText(value);
}

export function formatDistrictTitle(value) {
  const normalized = normalizeText(value).replace(/^kec\.\s*/i, '').replace(/\.$/, '').trim();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

export function formatJoinedDate(value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === '-' || normalized.toLowerCase() === 'null') return FALLBACK_JOINED_DATE;
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(date);
  }
  return normalized;
}
