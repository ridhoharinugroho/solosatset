import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', '.vercel']);
const ROOTS = ['js', 'scripts', 'api'];
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = ROOTS.flatMap((dir) => walk(path.join(ROOT, dir)));
const failures = [];

for (const file of files) {
  const relativePath = path.relative(ROOT, file).replaceAll(path.sep, '/');
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    failures.push({
      file: relativePath,
      output: `${result.stderr || result.stdout || 'Unknown syntax error'}`.trim()
    });
  }
}

console.log(`=== solosatset JavaScript syntax audit ===`);
console.log(`JS files checked: ${files.length}`);
console.log(`Syntax failures: ${failures.length}`);

for (const failure of failures) {
  console.error(`\n${failure.file}`);
  console.error(failure.output);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
