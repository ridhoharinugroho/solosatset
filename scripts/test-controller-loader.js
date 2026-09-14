import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("=== Running React & Next.js Module Resolution & Structure Regression Tests ===\n");

// 1. Verify Next.js App Router route entry points exist
const requiredRoutes = [
  "app/page.tsx",
  "app/admin/page.tsx",
  "app/toko-saya/page.tsx",
  "app/api/[...path]/route.ts",
];

for (const routePath of requiredRoutes) {
  const fullPath = path.join(ROOT_DIR, routePath);
  assert.ok(fs.existsSync(fullPath), `Next.js App Router entry point must exist: ${routePath}`);
  console.log(`✓ Next.js App Router route verified: ${routePath}`);
}

// 2. Verify TypeScript core services exist in src/services
const requiredServices = [
  "src/services/authService.ts",
  "src/services/listingService.ts",
  "src/services/notificationService.ts",
  "src/services/pushNotificationService.ts",
  "src/services/reviewService.ts",
  "src/services/settingsService.ts",
  "src/lib/regions.ts",
  "src/lib/sampleListings.ts",
  "src/lib/supabase.ts",
];

for (const servicePath of requiredServices) {
  const fullPath = path.join(ROOT_DIR, servicePath);
  assert.ok(fs.existsSync(fullPath), `TypeScript service/lib layer must exist: ${servicePath}`);
  console.log(`✓ TypeScript service layer verified: ${servicePath}`);
}

console.log("\nAll React & Next.js module resolution tests passed successfully!");
