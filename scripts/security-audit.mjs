import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtimeRoots = ["api", "js"];
const extensions = new Set([".js", ".mjs", ".html"]);
const ignored = new Set([path.normalize("api/call-exec-sql.js")]);

const findings = [];

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

function addFinding(file, name) {
  findings.push(`${file}: ${name}`);
}

const supabaseClientPath = path.join(root, "js", "lib", "supabase.js");
if (!fs.existsSync(supabaseClientPath)) {
  addFinding("js/lib/supabase.js", "browser Supabase client boundary is missing");
} else {
  const supabaseClient = fs.readFileSync(supabaseClientPath, "utf8");
  const guardRegex = /String\(\s*table\s*\|\|\s*['"]['"]\s*\)\s*\.trim\(\)\s*\.toLowerCase\(\)\s*===\s*['"]users['"]/g;
  if (!guardRegex.test(supabaseClient)) {
    addFinding("js/lib/supabase.js", `missing users-table browser guard: String(table || '').trim().toLowerCase() === 'users'`);
  }
  if (!supabaseClient.includes("Direct browser access to the users table is disabled.")) {
    addFinding("js/lib/supabase.js", `missing users-table browser guard: Direct browser access to the users table is disabled.`);
  }
}

for (const scanRoot of runtimeRoots) {
  const absRoot = path.join(root, scanRoot);
  if (!fs.existsSync(absRoot)) continue;

  for (const file of walk(absRoot)) {
    const rel = path.normalize(path.relative(root, file));
    if (ignored.has(rel)) continue;

    const content = fs.readFileSync(file, "utf8");
    const isClient = rel.startsWith(`js${path.sep}`);
    const isServer = rel.startsWith(`api${path.sep}`);

    if (/\/api\/otp(?:\.js)?\b/g.test(content)) {
      addFinding(rel, "legacy OTP endpoint reference");
    }
    if (/\/api\/users(?:\.js)?\b/g.test(content)) {
      addFinding(rel, "legacy users endpoint reference");
    }

    if (isClient) {
      if (/\bADMIN_CREDENTIALS\s*=\s*\{/g.test(content)) {
        addFinding(rel, "browser-side admin credential object");
      }
      if (/\b(?:adminPassword|ADMIN_PASSWORD)\s*[:=]\s*['"][^'"]+['"]/gi.test(content)) {
        addFinding(rel, "hardcoded admin password assignment");
      }
      if (/localStorage\.(?:setItem|getItem)\([^)]*(?:smtp|password)[^)]*/gi.test(content)) {
        addFinding(rel, "client SMTP/password persistence");
      }
      if (
        /sessionStorage\.(?:setItem|getItem)\([^)]*(?:password|password_hash|otp_code|otp_expires_at)[^)]*/gi.test(
          content,
        )
      ) {
        addFinding(rel, "credential persistence in browser session storage");
      }
      if (/\b(?:password_hash|otp_code|otp_expires_at)\s*:/g.test(content)) {
        addFinding(rel, "server credential field embedded in client data");
      }
      if (/rest\/v1\/users\b/g.test(content)) {
        addFinding(rel, "browser-side direct users REST query");
      }
    }

    if (isServer) {
      if (/(?:SMTP_PASS|smtpConfig\.pass)\s*[:=]\s*['"][^'"]+['"]/g.test(content)) {
        addFinding(rel, "hardcoded SMTP password assignment");
      }
      if (/\b(?:adminPassword|ADMIN_PASSWORD)\s*[:=]\s*['"][^'"]+['"]/gi.test(content)) {
        addFinding(rel, "hardcoded admin password assignment");
      }
      if (/\bADMIN_CREDENTIALS\s*=\s*\{/g.test(content)) {
        addFinding(rel, "hardcoded admin credential object");
      }
    }
  }
}

if (findings.length) {
  console.error("Security audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Security audit passed: users-table browser guard and credential controls are present.");
