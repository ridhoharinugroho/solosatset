import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

console.log("=== STARTING BROWSER FUNCTIONAL SIMULATION TEST ===");

const htmlPath = path.resolve(process.cwd(), "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

const dom = new JSDOM(htmlContent, {
  url: "http://localhost:3000/",
  runScripts: "outside-only",
});

const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
try {
  Object.defineProperty(global, "navigator", { value: window.navigator, writable: true, configurable: true });
} catch {}
try {
  Object.defineProperty(global, "location", { value: window.location, writable: true, configurable: true });
} catch {}
global.HTMLElement = window.HTMLElement;
global.Event = window.Event;
global.CustomEvent = window.CustomEvent;
  // eslint-disable-next-line no-unused-vars
global.fetch = async (url) => ({
  ok: true,
  status: 200,
  text: async () => "",
  json: async () => ({ success: true, data: [] }),
});

let errors = [];

async function runTests() {
  console.log("[1/5] Testing Entrypoints runtime resolution...");
  try {
    const appModule = await import("../js/app-main.js");
    if (appModule.bootstrapPromise) await appModule.bootstrapPromise;
    console.log("      app-main.js runtime resolution: OK");
  } catch (err) {
    console.error("      ❌ Error in app-main.js:", err);
    errors.push(`app-main.js runtime: ${err.message}`);
  }

  try {
    const tokoModule = await import("../js/toko-saya-legacy.js");
    if (tokoModule.bootstrapPromise) await tokoModule.bootstrapPromise;
    console.log("      toko-saya-legacy.js runtime resolution: OK");
  } catch (err) {
    console.error("      ❌ Error in toko-saya-legacy.js:", err);
    errors.push(`toko-saya-legacy.js runtime: ${err.message}`);
  }

  console.log("[1b/5] Testing App Main Controller imports and initial state...");
  try {
    const controller = await import("../js/app-main-controller.js");
    console.log("      Controller state verified:", typeof controller.state === "object" ? "OK" : "FAIL");
  } catch (err) {
    console.error("      ❌ Error in app-main-controller:", err);
    errors.push(`app-main-controller: ${err.message}`);
  }

  console.log("[2/5] Testing Toko-Saya Controller imports...");
  try {
    const tokoController = await import("../js/toko-saya-controller.js");
    console.log("      Toko Saya functions verified:", typeof tokoController.openModal === "function" ? "OK" : "FAIL");
  } catch (err) {
    console.error("      ❌ Error in toko-saya-controller:", err);
    errors.push(`toko-saya-controller: ${err.message}`);
  }

  console.log("[3/5] Testing App Bootstrap module...");
  try {
    const bootstrap = await import("../js/modules/app/appBootstrap.js");
    console.log("      Bootstrap functions verified:", typeof bootstrap.startApp === "function" ? "OK" : "FAIL");
  } catch (err) {
    console.error("      ❌ Error in appBootstrap:", err);
    errors.push(`appBootstrap: ${err.message}`);
  }

  console.log("[4/5] Scanning HTML inline event handler globals...");
  const htmlFiles = [
    "index.html",
    "toko-saya.html",
    "admin.html",
    "components/modals/auth-profile.html",
    "components/modals/pickers.html",
    "components/modals/product-seller.html",
    "components/modals/profile-settings.html",
  ];

  let missingGlobals = new Set();
  const funcRegex = /on[a-z]+=["'](?:javascript:)?([a-zA-Z0-9_$]+)\s*\(/g;

  for (const relPath of htmlFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      if (funcName && funcName !== "window" && funcName !== "event" && funcName !== "preventDefault") {
        if (typeof window[funcName] !== "function" && typeof global[funcName] !== "function") {
          missingGlobals.add(`${funcName} (${relPath})`);
        }
      }
    }
  }

  if (missingGlobals.size > 0) {
    console.error("      ❌ MISSING GLOBAL WINDOW FUNCTIONS IN INLINE EVENT HANDLERS:");
    missingGlobals.forEach((item) => console.error(`         - ${item}`));
    errors.push(`Missing inline functions: ${Array.from(missingGlobals).join(", ")}`);
  } else {
    console.log("      ✓ All inline event handler functions exist on window!");
  }

  console.log("[5/5] Testing Auth, Profile, and Listing modules...");
  try {
    const auth = await import("../js/services/auth.js");
    const authUI = await import("../js/modules/auth/authUI.js");
    const userProfile = await import("../js/modules/profile/userProfile.js");
    const productDetail = await import("../js/modules/products/productDetailModal.js");
    const listingsController = await import("../js/modules/products/listingsController.js");

    console.log("      Auth module getCurrentUser:", typeof auth.getCurrentUser === "function");
    console.log("      AuthUI openAuthModal:", typeof authUI.openAuthModal === "function");
    console.log("      UserProfile openUserProfileModal:", typeof userProfile.openUserProfileModal === "function");
    console.log("      ProductDetail openProductDetail:", typeof productDetail.openProductDetail === "function");
    console.log("      ListingsController renderListings:", typeof listingsController.renderListings === "function");
  } catch (err) {
    console.error("      ❌ Error testing core modules:", err);
    errors.push(`Core modules: ${err.message}`);
  }

  console.log("\n=== TEST RESULTS ===");
  if (errors.length > 0) {
    console.error(`FAILED with ${errors.length} error(s).`);
    process.exit(1);
  } else {
    console.log("SUCCESS: All browser functional simulation tests PASSED!");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
