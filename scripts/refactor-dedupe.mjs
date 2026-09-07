import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = {
  app: path.join(ROOT, 'js/app.js'),
  toko: path.join(ROOT, 'js/toko-saya.js'),
  auth: path.join(ROOT, 'js/services/auth.js'),
  storage: path.join(ROOT, 'js/services/storage.js'),
  runtime: path.join(ROOT, 'js/utils/runtime.js')
};

const runtimeContent = `/**
 * Shared runtime helpers and application-wide constants.
 */

export const CURRENT_SW_VERSION = '20260902_v214';

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
  if (!rawRegion) return 'Solo';
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
  const clean = rawDistrict.toString().trim().replace(/^Kec\\.?\\s*/i, '').replace(/\\.+$/, '');
  return clean.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
`;

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function writePreservingEol(file, sourceLike, value) {
  const eol = sourceLike.includes('\r\n') ? '\r\n' : '\n';
  const normalized = value.replace(/\r?\n/g, '\n');
  fs.writeFileSync(file, normalized.replaceAll('\n', eol), 'utf8');
}

function removeSharedRuntimeBlock(text, rel) {
  const startMarker = '// ========================================================\n// HIGH-PERFORMANCE NON-BLOCKING INP OPTIMIZATIONS\n// ========================================================\n';
  const normalized = text.replace(/\r\n/g, '\n');
  const start = normalized.indexOf(startMarker);
  if (start === -1) return normalized;
  const endMarker = 'window.deferTask = deferTask;';
  const end = normalized.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Could not find runtime block end in ${rel}`);
  return normalized.slice(0, start) + normalized.slice(end + endMarker.length).replace(/^\n+/, '\n');
}

function removeSwConstant(text) {
  return text.replace(/^const CURRENT_SW_VERSION = ['\"][^'\"]+['\"];\n?/m, '');
}

function removeFormatterImport(text) {
  return text.replace(/,\s*formatRegionTitle,\s*formatDistrictTitle(?=\s*\n?\s*}\s*from ['\"]\.\/services\/storage\.js['\"])/, '');
}

function addRuntimeImport(text, marker, local) {
  if (text.includes(local ? "./utils/runtime.js" : "../utils/runtime.js")) return text;
  const importLine = local
    ? "import { refreshIcons, deferTask, CURRENT_SW_VERSION, formatRegionTitle, formatDistrictTitle } from './utils/runtime.js';\n"
    : "import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\n";
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`Could not find import marker: ${marker}`);
  return text.slice(0, idx) + importLine + text.slice(idx);
}

let app = read(files.app);
const appOriginal = app;
app = removeSharedRuntimeBlock(app, 'js/app.js');
app = removeSwConstant(app);
app = removeFormatterImport(app);
app = addRuntimeImport(app, '/**\n * Pusat Jual Beli Solo Raya - Main Application Controller', true);
writePreservingEol(files.app, appOriginal, app);

let toko = read(files.toko);
const tokoOriginal = toko;
toko = removeSharedRuntimeBlock(toko, 'js/toko-saya.js');
toko = removeSwConstant(toko);
toko = removeFormatterImport(toko);
toko = addRuntimeImport(toko, '/**\n * Toko Saya Standalone Page Controller', true);
writePreservingEol(files.toko, tokoOriginal, toko);

const formatterBlock = /export function formatRegionTitle\(rawRegion\) \{[\s\S]*?\n\}\n\s*export function formatDistrictTitle\(rawDistrict\) \{[\s\S]*?\n\}\n/;

let storage = read(files.storage);
const storageOriginal = storage;
const storageNormalized = storage.replace(/\r\n/g, '\n');
if (!storageNormalized.match(formatterBlock)) {
  throw new Error('Expected formatter implementations in storage.js');
}
storage = storageNormalized.replace(formatterBlock, '');
if (!storage.includes("../utils/runtime.js")) {
  storage = storage.replace("import { supabase } from '../lib/supabase.js';\n", "import { supabase } from '../lib/supabase.js';\nimport { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\nexport { formatRegionTitle, formatDistrictTitle };\n");
} else if (!storage.includes('export { formatRegionTitle, formatDistrictTitle };')) {
  storage = storage.replace("import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\n", "import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\nexport { formatRegionTitle, formatDistrictTitle };\n");
}
writePreservingEol(files.storage, storageOriginal, storage);

let auth = read(files.auth);
const authOriginal = auth;
const authNormalized = auth.replace(/\r\n/g, '\n');
if (!authNormalized.includes('export function formatRegionTitle')) {
  throw new Error('Expected formatter implementations in auth.js');
}
const authFormatterBlock = /\/\*\*\n \* Helper Format Nama Wilayah Kabupaten \/ Kota\n \*\/\nexport function formatRegionTitle\(rawRegion\) \{[\s\S]*?\n\}\nwindow\.formatRegionTitle = formatRegionTitle;\n\n\/\*\*\n \* Helper Format Nama Wilayah Kecamatan\n \*\/\nexport function formatDistrictTitle\(rawDistrict\) \{[\s\S]*?\n\}\nwindow\.formatDistrictTitle = formatDistrictTitle;\n\n/;
auth = authNormalized.replace(authFormatterBlock, '');
if (!auth.includes("../utils/runtime.js")) {
  auth = auth.replace("import { supabase } from '../lib/supabase.js';\n", "import { supabase } from '../lib/supabase.js';\nimport { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\nexport { formatRegionTitle, formatDistrictTitle };\n");
} else if (!auth.includes('export { formatRegionTitle, formatDistrictTitle };')) {
  auth = auth.replace("import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\n", "import { formatRegionTitle, formatDistrictTitle } from '../utils/runtime.js';\nexport { formatRegionTitle, formatDistrictTitle };\n");
}
writePreservingEol(files.auth, authOriginal, auth);

fs.writeFileSync(files.runtime, runtimeContent.replace(/\n/g, '\n'), 'utf8');

const allJs = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.vercel') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) allJs.push(full);
  }
}
walk(path.join(ROOT, 'js'));
const combined = allJs.map(read).join('\n');
const checks = {
  refreshIcons: (combined.match(/function\s+refreshIcons\s*\(/g) || []).length,
  deferTask: (combined.match(/function\s+deferTask\s*\(/g) || []).length,
  currentSwAssignments: (combined.match(/CURRENT_SW_VERSION\s*=\s*['\"]/g) || []).length,
  formatRegionTitle: (combined.match(/(?:export\s+)?function\s+formatRegionTitle\s*\(/g) || []).length,
  formatDistrictTitle: (combined.match(/(?:export\s+)?function\s+formatDistrictTitle\s*\(/g) || []).length,
};
for (const [key, count] of Object.entries(checks)) {
  console.log(`${key}: ${count}`);
  if (count !== 1) throw new Error(`${key} expected 1, got ${count}`);
}
if (!read(files.app).includes("from './utils/runtime.js'")) throw new Error('app.js runtime import missing');
if (!read(files.toko).includes("from './utils/runtime.js'")) throw new Error('toko-saya.js runtime import missing');
if (!read(files.auth).includes("from '../utils/runtime.js'")) throw new Error('auth.js runtime import missing');
if (!read(files.storage).includes("from '../utils/runtime.js'")) throw new Error('storage.js runtime import missing');
if (read(files.toko).includes('20260901_v151')) throw new Error('stale toko-saya SW version remains');
console.log('TARGETED_DEDUPE_VERIFICATION=PASS');
