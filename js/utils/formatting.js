/**
 * Shared display-formatting utilities.
 *
 * Keep presentation-only normalization here so feature services do not
 * maintain their own copies of the same region/district/date rules.
 */

const REGION_LABELS = Object.freeze({
  solo: 'Solo',
  surakarta: 'Solo',
  karanganyar: 'Karanganyar',
  sukoharjo: 'Sukoharjo',
  wonogiri: 'Wonogiri',
  sragen: 'Sragen',
  boyolali: 'Boyolali',
  klaten: 'Klaten',
  soloraya: 'Solo Raya',
  'solo raya': 'Solo Raya'
});

const FALLBACK_JOINED_DATE = '01 Agustus 2026';
const INDO_MONTH_PATTERN = /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)/i;

/**
 * Format kabupaten/kota label without mutating source data.
 * @param {unknown} rawRegion
 * @param {string} fallback
 * @returns {string}
 */
export function formatRegionTitle(rawRegion, fallback = 'Solo') {
  if (!rawRegion) return fallback;

  const normalized = String(rawRegion).trim().toLowerCase();
  if (!normalized) return fallback;

  return REGION_LABELS[normalized]
    || normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Format kecamatan label consistently.
 * @param {unknown} rawDistrict
 * @returns {string}
 */
export function formatDistrictTitle(rawDistrict) {
  if (!rawDistrict) return '';

  const clean = String(rawDistrict)
    .trim()
    .replace(/^Kec\.?\s*/i, '')
    .replace(/\.+$/, '');

  if (!clean) return '';

  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format joined/created date for the Indonesian UI.
 * Existing Indonesian date labels are preserved; ISO/standard dates are
 * normalized through the browser's id-ID locale.
 * @param {string|Date|number|null|undefined} rawDate
 * @param {string} fallback
 * @returns {string}
 */
export function formatJoinedDate(rawDate, fallback = FALLBACK_JOINED_DATE) {
  if (!rawDate) return fallback;

  const value = String(rawDate).trim();
  if (!value || value === '-' || value === 'null' || value === 'undefined') {
    return fallback;
  }

  if (INDO_MONTH_PATTERN.test(value) && /\d{4}/.test(value)) {
    return value;
  }

  try {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (_) {
    // Preserve the original value below rather than throwing in the UI.
  }

  return value;
}

export { FALLBACK_JOINED_DATE };
