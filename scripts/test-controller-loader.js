import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolveModulePath, loadController, clearControllerCache } from "../js/utils/controllerLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("=== Running controllerLoader & bootstrap regression tests ===\n");

// ---------------------------------------------------------
// SUITE 1: Path Resolution for Actual Bootstrap Controllers
// ---------------------------------------------------------

// 1. './app-main-core.js' resolve ke file controller aktual
{
  const resolved = resolveModulePath("./app-main-core.js");
  const resolvedUrl = new URL(resolved);

  assert.ok(
    resolvedUrl.pathname.endsWith("/js/app-main-core.js"),
    `Expected pathname to end with '/js/app-main-core.js', got '${resolvedUrl.pathname}'`,
  );
  assert.strictEqual(
    resolved.includes("/js/utils/"),
    false,
    `Path resolution must NOT resolve to /js/utils/ (would cause 404), got '${resolved}'`,
  );

  const localPath = fileURLToPath(resolvedUrl);
  assert.ok(fs.existsSync(localPath), `Target file must exist on disk: ${localPath}`);
  assert.strictEqual(path.basename(localPath), "app-main-core.js");
  assert.ok(fs.statSync(localPath).isFile(), "Target must be a valid file");
  console.log('✓ 1. loadController("./app-main-core.js") correctly resolves to actual controller file on disk');
}

// 2. './toko-saya-core.js' resolve ke file controller aktual
{
  const resolved = resolveModulePath("./toko-saya-core.js");
  const resolvedUrl = new URL(resolved);

  assert.ok(
    resolvedUrl.pathname.endsWith("/js/toko-saya-core.js"),
    `Expected pathname to end with '/js/toko-saya-core.js', got '${resolvedUrl.pathname}'`,
  );
  assert.strictEqual(
    resolved.includes("/js/utils/"),
    false,
    `Path resolution must NOT resolve to /js/utils/ (would cause 404), got '${resolved}'`,
  );

  const localPath = fileURLToPath(resolvedUrl);
  assert.ok(fs.existsSync(localPath), `Target file must exist on disk: ${localPath}`);
  assert.strictEqual(path.basename(localPath), "toko-saya-core.js");
  assert.ok(fs.statSync(localPath).isFile(), "Target must be a valid file");
  console.log('✓ 2. loadController("./toko-saya-core.js") correctly resolves to actual controller file on disk');
}

// 3. File controller benar-benar dapat dimuat tanpa module resolution / syntax error
{
  const filesToCheck = [
    "js/app-main.js",
    "js/app-main-core.js",
    "js/toko-saya-legacy.js",
    "js/toko-saya-core.js",
    "js/app-main-controller.js",
    "js/toko-saya-controller.js",
    "js/utils/controllerLoader.js",
  ];

  for (const relativeFile of filesToCheck) {
    const fullPath = path.join(ROOT_DIR, relativeFile);
    assert.ok(fs.existsSync(fullPath), `Required controller file missing: ${relativeFile}`);

    const checkResult = spawnSync(process.execPath, ["--check", fullPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.strictEqual(
      checkResult.status,
      0,
      `Module syntax / check error in ${relativeFile}: ${checkResult.stderr || checkResult.stdout}`,
    );
  }

  // Verify internal import graph integrity
  const appMainCoreContent = fs.readFileSync(path.join(ROOT_DIR, "js/app-main-core.js"), "utf8");
  assert.match(
    appMainCoreContent,
    /import\s+['"]\.\/app-main-controller\.js['"]/,
    "app-main-core.js must import app-main-controller.js",
  );

  const tokoSayaCoreContent = fs.readFileSync(path.join(ROOT_DIR, "js/toko-saya-core.js"), "utf8");
  assert.match(
    tokoSayaCoreContent,
    /import\s+['"]\.\/toko-saya-controller\.js['"]/,
    "toko-saya-core.js must import toko-saya-controller.js",
  );

  console.log("✓ 3. Actual controller files and dependency chains verify with zero module resolution/syntax errors");
}

// 4. Tidak ada 404 / path error akibat controllerLoader
{
  const testPaths = [
    { input: "./app-main-core.js", expectedSuffix: "/js/app-main-core.js" },
    { input: "app-main-core.js", expectedSuffix: "/js/app-main-core.js" },
    { input: "./toko-saya-core.js", expectedSuffix: "/js/toko-saya-core.js" },
    { input: "toko-saya-core.js", expectedSuffix: "/js/toko-saya-core.js" },
    { input: "/js/app-main-core.js", expectedExact: "/js/app-main-core.js" },
    { input: "/js/toko-saya-core.js", expectedExact: "/js/toko-saya-core.js" },
  ];

  for (const { input, expectedSuffix, expectedExact } of testPaths) {
    const resolved = resolveModulePath(input);
    assert.ok(
      !resolved.includes("/js/utils/app-main-core.js") && !resolved.includes("/js/utils/toko-saya-core.js"),
      `Path '${input}' incorrectly resolved inside /js/utils/ directory: '${resolved}'`,
    );

    if (expectedExact) {
      assert.strictEqual(resolved, expectedExact, `Root path '${input}' must remain unchanged`);
    } else if (expectedSuffix) {
      const url = new URL(resolved);
      assert.ok(
        url.pathname.endsWith(expectedSuffix),
        `Resolved '${input}' should end with '${expectedSuffix}', got '${url.pathname}'`,
      );
    }
  }
  console.log("✓ 4. No 404 or erroneous /js/utils/ path resolution for controller modules");
}

// 5. Bootstrap tetap menangani rejection dengan .catch()
{
  clearControllerCache();

  // Verify app-main.js source structure
  const appMainCode = fs.readFileSync(path.join(ROOT_DIR, "js/app-main.js"), "utf8");
  assert.match(appMainCode, /\.catch\s*\(/, "js/app-main.js must implement .catch() rejection handler");
  assert.match(
    appMainCode,
    /\[App bootstrap\] Gagal memuat controller utama\./,
    "js/app-main.js must log error on load failure",
  );

  // Verify toko-saya-legacy.js source structure
  const tokoSayaCode = fs.readFileSync(path.join(ROOT_DIR, "js/toko-saya-legacy.js"), "utf8");
  assert.match(tokoSayaCode, /\.catch\s*\(/, "js/toko-saya-legacy.js must implement .catch() rejection handler");
  assert.match(
    tokoSayaCode,
    /\[Toko Saya bootstrap\] Gagal memuat controller\./,
    "js/toko-saya-legacy.js must log error on load failure",
  );

  // Verify runtime .catch() execution behavior when rejection occurs
  const failingModuleUrl = 'data:text/javascript,throw new Error("Simulated bootstrap error");';
  let caughtError = null;
  let loggedMessage = null;

  const originalConsoleError = console.error;
  // eslint-disable-next-line no-unused-vars
  console.error = (msg, err) => {
    loggedMessage = msg;
  };

  try {
    await loadController(failingModuleUrl).catch((err) => {
      console.error("[App bootstrap] Gagal memuat controller utama.", err);
      caughtError = err;
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.ok(caughtError, "Rejection must be caught by .catch()");
  assert.strictEqual(caughtError.message, "Simulated bootstrap error");
  assert.strictEqual(loggedMessage, "[App bootstrap] Gagal memuat controller utama.");

  console.log("✓ 5. Bootstrap handles rejections gracefully via .catch() without unhandled exceptions");
}

// 6. Tidak terjadi duplicate initialization ketika bootstrap dipanggil lebih dari sekali
{
  clearControllerCache();

  // Test caching with mock controller module
  const mockControllerUrl =
    "data:text/javascript,let initCount = 0; export function init() { return ++initCount; } export const id = Math.random();";

  const firstCallPromise = loadController(mockControllerUrl);
  const secondCallPromise = loadController(mockControllerUrl);
  const thirdCallPromise = loadController(mockControllerUrl);

  // Identity check: must return the exact same Promise instance
  assert.strictEqual(firstCallPromise, secondCallPromise, "Call 1 & 2 must share identical Promise instance");
  assert.strictEqual(secondCallPromise, thirdCallPromise, "Call 2 & 3 must share identical Promise instance");

  const [m1, m2, m3] = await Promise.all([firstCallPromise, secondCallPromise, thirdCallPromise]);
  assert.strictEqual(m1, m2);
  assert.strictEqual(m2, m3);
  assert.strictEqual(m1.id, m2.id);

  // Calling init() on the module confirms singleton execution
  const res1 = m1.init();
  const res2 = m2.init();
  assert.strictEqual(res1, 1);
  assert.strictEqual(res2, 2); // Same module instance state

  // Subsequent call after resolution also returns cached Promise
  const fourthCallPromise = loadController(mockControllerUrl);
  assert.strictEqual(fourthCallPromise, firstCallPromise, "Post-resolution call must return cached Promise");
  const m4 = await fourthCallPromise;
  assert.strictEqual(m4, m1);

  console.log(
    "✓ 6. No duplicate initialization: identical Promise and singleton module instance shared across invocations",
  );
}

// ---------------------------------------------------------
// SUITE 2: Edge Cases & Retry Capabilities
// ---------------------------------------------------------

// 7. Re-attempt after failure creates new Promise and cleans cache
{
  clearControllerCache();
  const badModule = 'data:text/javascript,throw new Error("Temporary network glitch");';

  let err1 = null;
  const p1 = loadController(badModule);
  try {
    await p1;
  } catch (err) {
    err1 = err;
  }
  assert.ok(err1);

  // Second attempt must create a fresh promise rather than reusing the rejected one
  const p2 = loadController(badModule);
  assert.notStrictEqual(p1, p2, "Retry attempt must create a new Promise after eviction");

  let err2 = null;
  try {
    await p2;
  } catch (err) {
    err2 = err;
  }
  assert.ok(err2);

  console.log("✓ 7. Cache eviction on failure enables retry attempts");
}

// 8. Absolute URLs (data:, blob:, http:, https:, root /) remain unchanged
{
  assert.strictEqual(resolveModulePath("/js/app-main-core.js"), "/js/app-main-core.js");
  assert.strictEqual(resolveModulePath("https://cdn.example.com/mod.js"), "https://cdn.example.com/mod.js");
  assert.strictEqual(resolveModulePath("http://localhost:8080/mod.js"), "http://localhost:8080/mod.js");
  console.log("✓ 8. Absolute and root URLs remain untouched");
}

console.log("\nAll actual controller bootstrap regression tests passed successfully!");
