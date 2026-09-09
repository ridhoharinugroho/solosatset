// Centralized Controller Loader with Path Resolution & Caching
// Resolves relative controller paths to /js/ base directory instead of /js/utils/

const controllerCache = new Map();

/**
 * Resolves controller module path relative to /js/ base directory.
 * Prevents 404 errors caused by relative paths resolving to /js/utils/.
 * 
 * @param {string} modulePath - Relative or absolute path to controller
 * @returns {string} Fully resolved absolute or root-relative URL
 */
export function resolveModulePath(modulePath) {
  if (!modulePath || typeof modulePath !== 'string') {
    return modulePath;
  }

  // If already absolute URL or root path, keep as-is
  if (modulePath.startsWith('/') || modulePath.startsWith('http://') || modulePath.startsWith('https://') || modulePath.startsWith('data:') || modulePath.startsWith('blob:') || modulePath.startsWith('file:')) {
    return modulePath;
  }

  // Strip leading './' if present
  const cleanPath = modulePath.startsWith('./') ? modulePath.slice(2) : modulePath;

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
