import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".git", ".vercel"]);
const JS_ROOTS = ["js", "scripts", "api"];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = JS_ROOTS.flatMap((dir) => walk(path.join(ROOT, dir)));
const definitions = new Map();
const storageKeys = new Map();
const swVersions = new Map();

for (const file of files) {
  const rel = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const source = fs.readFileSync(file, "utf8");

  for (const match of source.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = match[1];
    const list = definitions.get(name) || [];
    list.push(rel);
    definitions.set(name, list);
  }

  for (const match of source.matchAll(
    /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['\"]([^'\"]+)['\"]/g,
  )) {
    const key = match[1];
    const list = storageKeys.get(key) || [];
    list.push(rel);
    storageKeys.set(key, list);
  }

  for (const match of source.matchAll(/(?:SW_VERSION|CACHE_NAME|v20\d{6}(?:_v\d+)?)/g)) {
    const value = match[0];
    if (/^v20\d/.test(value)) {
      const list = swVersions.get(value) || [];
      list.push(rel);
      swVersions.set(value, list);
    }
  }
}

const duplicateFunctions = [...definitions.entries()].filter(([, locations]) => new Set(locations).size > 1);
const duplicateStorageKeys = [...storageKeys.entries()].filter(([, locations]) => new Set(locations).size > 1);

console.log("=== solosatset duplicate audit ===");
console.log(`JS files scanned: ${files.length}`);
console.log(`Duplicate function names (review candidates): ${duplicateFunctions.length}`);
for (const [name, locations] of duplicateFunctions.sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  function ${name}: ${[...new Set(locations)].join(", ")}`);
}
console.log(`Storage keys referenced by multiple files (review candidates): ${duplicateStorageKeys.length}`);
for (const [key, locations] of duplicateStorageKeys.sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  key ${key}: ${[...new Set(locations)].join(", ")}`);
}
console.log(`Version-like literals found: ${swVersions.size}`);
for (const [value, locations] of [...swVersions.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${value}: ${[...new Set(locations)].join(", ")}`);
}

// Shared function names and browser storage keys are reported for refactoring review,
// but are not release blockers in this multi-entrypoint static application.
// Multiple version literals remain a hard failure because they can create cache skew.
if (swVersions.size > 1) process.exitCode = 1;
