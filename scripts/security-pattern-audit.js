import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_PATHS = ['index.html', 'admin.html', 'js', 'api', 'scripts'];
const SKIP = new Set(['node_modules', '.git', '.vercel']);

const RULES = [
  {
    id: 'wildcard-postmessage',
    description: "postMessage dengan target origin '*'",
    pattern: /\.postMessage\s*\([^,]+,\s*['"]\*['"]\s*\)/g,
  },
  {
    id: 'service-role-in-client',
    description: 'Referensi service-role secret/credential di source aplikasi',
    pattern: /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role[_-]?(?:key|secret)/gi,
  },
  {
    id: 'vapid-private-key',
    description: 'VAPID private key tertanam sebagai literal',
    pattern: /VAPID_PRIVATE_KEY\s*=\s*(?:process\.env\.[A-Z0-9_]+\s*\|\|\s*)?['"][^'"]+['"]/gi,
  },
  {
    id: 'plaintext-password-field',
    description: 'Password literal di object source (perlu review; dapat berupa data demo)',
    pattern: /\bpassword\s*:\s*['"][^'"]{4,}['"]/gi,
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else if (/\.(html|js|mjs|cjs)$/.test(entry.name)) output.push(full);
  }
  return output;
}

const files = SCAN_PATHS.flatMap((entry) => {
  const full = path.join(ROOT, entry);
  if (!fs.existsSync(full)) return [];
  return fs.statSync(full).isDirectory() ? walk(full) : [full];
});

const findings = [];

for (const file of files) {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, '/');
  const source = fs.readFileSync(file, 'utf8');

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const prefix = source.slice(0, match.index);
      const line = prefix.split('\n').length;
      findings.push({ id: rule.id, file: relative, line, description: rule.description });
    }
  }
}

console.log('=== solosatset security pattern audit ===');
console.log(`Files scanned: ${files.length}`);
console.log(`Findings: ${findings.length}`);

for (const finding of findings) {
  console.warn(`[${finding.id}] ${finding.file}:${finding.line} — ${finding.description}`);
}

// Informational-only by design. This audit must never alter or block application runtime.
process.exitCode = 0;
