/**
 * Load a controller module once and reuse the same in-flight promise.
 * This keeps entrypoints small without changing controller behavior.
 */
const controllerLoads = new Map();

export function loadController(path) {
  if (!controllerLoads.has(path)) {
    controllerLoads.set(path, import(path));
  }
  return controllerLoads.get(path);
}
