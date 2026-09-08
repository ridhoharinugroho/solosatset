/**
 * Shared runtime helpers and application-wide constants.
 */

export const CURRENT_SW_VERSION = '20260902_v215';

const iconRefreshQueue = new Set();
let iconRefreshScheduled = false;

export function refreshIcons(root = null) {
  if (typeof window === 'undefined' || !window.lucide || typeof window.lucide.createIcons !== 'function') return;

  if (root && root instanceof HTMLElement) {
    iconRefreshQueue.add(root);
  } else {
    iconRefreshQueue.add(document.body || document.documentElement);
  }

  if (iconRefreshScheduled) return;
  iconRefreshScheduled = true;

  const run = () => {
    iconRefreshScheduled = false;
    const roots = Array.from(iconRefreshQueue);
    iconRefreshQueue.clear();

    const hasGlobal = roots.some((item) => item === document.body || item === document.documentElement);
    if (hasGlobal) {
      try { window.lucide.createIcons(); } catch (e) {}
    } else {
      roots.forEach((item) => {
        try { window.lucide.createIcons({ root: item }); } catch (e) {}
      });
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 60 });
  } else {
    setTimeout(run, 1);
  }
}

export function deferTask(fn, timeout = 50) {
  if (typeof fn !== 'function') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => fn(), { timeout });
  } else {
    setTimeout(() => fn(), 0);
  }
}

if (typeof window !== 'undefined') {
  window.refreshIcons = refreshIcons;
  window.deferTask = deferTask;
}

export function formatRegionTitle(rawRegion) {
  if (!rawRegion) return 'Solo Raya';
  const reg = rawRegion.toString().trim().toLowerCase();
  const map = {
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
  };
  if (map[reg]) return map[reg];
  return reg.charAt(0).toUpperCase() + reg.slice(1);
}

export function formatDistrictTitle(rawDistrict) {
  if (!rawDistrict) return '';
  const clean = rawDistrict.toString().trim().replace(/^Kec\.?\s*/i, '').replace(/\.+$/, '');
  return clean.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
