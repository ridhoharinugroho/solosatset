import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scanRoots = ['api', 'js'];
const extensions = new Set(['.js', '.mjs', '.html']);
const ignored = new Set([
  path.normalize('api/call-exec-sql.js')
]);

const forbiddenPatterns = [
  { name: 'legacy OTP endpoint reference', re: /\/api\/otp(?:\.js)?\b/g },
  { name: 'legacy users endpoint reference', re: /\/api\/users(?:\.js)?\b/g },
  { name: 'hardcoded SMTP password assignment', re: /(?:SMTP_PASS|smtpConfig\.pass)\s*[:=]\s*['"][^'"]+['"]/g },
  { name: 'client SMTP password persistence', re: /localStorage\.(?:setItem|getItem)\([^)]*(?:smtp|password)[^)]*/gi },
  { name: 'plain credential field in client auth data', re: /\b(?:password|password_hash|otp_code|otp_expires_at)\s*:/g },
  { name: 'browser-side admin credential object', re: /\bADMIN_CREDENTIALS\s*=\s*\{/g },
  { name: 'hardcoded admin password assignment', re: /\b(?:adminPassword|ADMIN_PASSWORD|password)\s*[:=]\s*['"][^'"]+['"]/gi }
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const findings = [];
for (const scanRoot of scanRoots) {
  const absRoot = path.join(root, scanRoot);
  if (!fs.existsSync(absRoot)) continue;
  for (const file of walk(absRoot)) {
    const rel = path.relative(root, file);
    if (ignored.has(path.normalize(rel))) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
      pattern.re.lastIndex = 0;
      if (pattern.re.test(content)) findings.push(`${rel}: ${pattern.name}`);
    }
  }
}

if (findings.length) {
  console.error('Security audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Security audit passed: no forbidden legacy credential patterns found in runtime sources.');
