import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENTRYPOINTS = ['index.html', 'admin.html'];
const ATTRIBUTE_PATTERN = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const SKIP_PREFIXES = ['http://', 'https://', '//', 'data:', 'javascript:', 'mailto:', 'tel:', '#'];

function isLocalReference(value) {
  const normalized = value.trim();
  return normalized && !SKIP_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function stripUrlDecorators(value) {
  return value.split('#')[0].split('?')[0];
}

function resolveLocalPath(reference) {
  const cleaned = stripUrlDecorators(reference.trim());
  if (!cleaned || cleaned.endsWith('/')) return null;
  const withoutLeadingSlash = cleaned.replace(/^\//, '');
  return path.resolve(ROOT, withoutLeadingSlash);
}

const missing = [];
const checked = new Set();

for (const entrypoint of ENTRYPOINTS) {
  const filePath = path.join(ROOT, entrypoint);
  if (!fs.existsSync(filePath)) {
    missing.push(`${entrypoint}: entrypoint file is missing`);
    continue;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const reference = match[1].trim();
    if (!isLocalReference(reference)) continue;

    const resolved = resolveLocalPath(reference);
    if (!resolved || !resolved.startsWith(ROOT + path.sep)) continue;
    if (checked.has(resolved)) continue;
    checked.add(resolved);

    if (!fs.existsSync(resolved)) {
      missing.push(`${entrypoint}: ${reference}`);
    }
  }
}

console.log('=== solosatset local asset integrity audit ===');
console.log(`Entrypoints checked: ${ENTRYPOINTS.length}`);
console.log(`Local references checked: ${checked.size}`);
console.log(`Missing local references: ${missing.length}`);

for (const item of missing) {
  console.error(`  ${item}`);
}

if (missing.length > 0) {
  process.exitCode = 1;
}
