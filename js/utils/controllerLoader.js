// Centralized Controller Loader with Path Resolution & Caching
// Resolves relative controller paths to /js/ base directory instead of /js/utils/

const controllerCache = new Map();

// Define static glob for Vite bundler to analyze and include controller modules in build
const viteControllerModules =
  typeof import.meta !== "undefined" && typeof import.meta.glob === "function"
    ? import.meta.glob("../**/*.js")
    : null;

function getGlobKey(modulePath) {
  if (!modulePath || typeof modulePath !== "string") return null;

  let clean = modulePath;
  if (clean.includes("://")) {
    try {
      clean = new URL(clean).pathname;
    } catch {
      // ignore
    }
  }

  const jsIndex = clean.lastIndexOf("/js/");
  if (jsIndex !== -1) {
    clean = clean.slice(jsIndex + 4);
  } else if (clean.startsWith("./")) {
    clean = clean.slice(2);
  } else if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }

  return `../${clean}`;
}

/**
 * Resolves controller module path relative to /js/ base directory.
 * Prevents 404 errors caused by relative paths resolving to /js/utils/.
 *
 * @param {string} modulePath - Relative or absolute path to controller
 * @returns {string} Fully resolved absolute or root-relative URL
 */
export function resolveModulePath(modulePath) {
  if (!modulePath || typeof modulePath !== "string") {
    return modulePath;
  }

  // If already absolute URL or root path, keep as-is
  if (
    modulePath.startsWith("/") ||
    modulePath.startsWith("http://") ||
    modulePath.startsWith("https://") ||
    modulePath.startsWith("data:") ||
    modulePath.startsWith("blob:") ||
    modulePath.startsWith("file:")
  ) {
    return modulePath;
  }

  // Strip leading './' if present
  const cleanPath = modulePath.startsWith("./") ? modulePath.slice(2) : modulePath;

  // Resolve relative to /js/ base directory (one level up from /js/utils/)
  try {
    return new URL(`../${cleanPath}`, import.meta.url).href;
  } catch {
    return `/js/${cleanPath}`;
  }
}

/**
 * Loads controller dynamically with caching to prevent duplicate imports.
 *
 * @param {string} modulePath - Path to controller module
 * @returns {Promise<any>} Import promise for the requested controller
 */
export function loadController(modulePath) {
  const resolvedPath = resolveModulePath(modulePath);

  if (controllerCache.has(resolvedPath)) {
    return controllerCache.get(resolvedPath);
  }

  let loadPromise;
  const globKey = getGlobKey(modulePath);

  if (viteControllerModules && globKey && viteControllerModules[globKey]) {
    loadPromise = viteControllerModules[globKey]();
  } else {
    loadPromise = import(/* @vite-ignore */ resolvedPath);
  }

  const cachedPromise = loadPromise.catch((error) => {
    controllerCache.delete(resolvedPath);
    throw error;
  });

  controllerCache.set(resolvedPath, cachedPromise);
  return cachedPromise;
}

export function clearControllerCache() {
  controllerCache.clear();
}

