// Centralized Controller Loader with Path Resolution & Caching
// Resolves relative controller paths to /js/ base directory instead of /js/utils/

const controllerCache = new Map();

// Static glob for Vite bundler to analyze and bundle all controllers
const controllerModules =
  typeof import.meta !== "undefined" && import.meta.glob
    ? import.meta.glob("../**/*.js")
    : null;

/**
 * Normalizes any module path string into relative glob key starting with "../"
 * relative to /js/utils/controllerLoader.js
 */
export function getGlobKey(modulePath) {
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

  if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }

  return `../${clean}`;
}

/**
 * Resolves controller module path relative to /js/ base directory for Node.js environments.
 */
export function resolveModulePath(modulePath) {
  if (!modulePath || typeof modulePath !== "string") {
    return modulePath;
  }

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

  const cleanPath = modulePath.startsWith("./") ? modulePath.slice(2) : modulePath;

  if (typeof import.meta !== "undefined" && import.meta.url && import.meta.url.startsWith("file:")) {
    try {
      const parentDir = import.meta.url.substring(0, import.meta.url.lastIndexOf("/"));
      const jsDir = parentDir.substring(0, parentDir.lastIndexOf("/"));
      return `${jsDir}/${cleanPath}`;
    } catch {
      // ignore
    }
  }

  return `../${cleanPath}`;
}

/**
 * Loads controller dynamically with caching to prevent duplicate imports.
 */
export function loadController(modulePath) {
  const globKey = getGlobKey(modulePath);

  // 1. Primary Vite production/dev pathway via import.meta.glob
  if (controllerModules && globKey && controllerModules[globKey]) {
    if (controllerCache.has(globKey)) {
      return controllerCache.get(globKey);
    }

    const loadPromise = controllerModules[globKey]().catch((error) => {
      controllerCache.delete(globKey);
      throw error;
    });

    controllerCache.set(globKey, loadPromise);
    return loadPromise;
  }

  // 2. Fallback pathway for Node.js test runner only
  const resolvedPath = resolveModulePath(modulePath);
  if (controllerCache.has(resolvedPath)) {
    return controllerCache.get(resolvedPath);
  }

  const loadPromise = import(/* @vite-ignore */ resolvedPath).catch((error) => {
    controllerCache.delete(resolvedPath);
    throw error;
  });

  controllerCache.set(resolvedPath, loadPromise);
  return loadPromise;
}

export function clearControllerCache() {
  controllerCache.clear();
}




