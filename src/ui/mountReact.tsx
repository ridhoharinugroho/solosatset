import React from "react";
import { createRoot, Root } from "react-dom/client";

const activeRoots = new Map<HTMLElement, Root>();

/**
 * Mounts a React component into a target DOM container in coexistence mode with Vanilla JS.
 * Does not throw errors if element is missing.
 */
export function mountReactElement(
  container: HTMLElement | null,
  element: React.ReactElement
): Root | null {
  if (!container) return null;

  let root = activeRoots.get(container);
  if (!root) {
    root = createRoot(container);
    activeRoots.set(container, root);
  }

  root.render(element);
  return root;
}

/**
 * Unmounts React root from container if present.
 */
export function unmountReactElement(container: HTMLElement | null): boolean {
  if (!container) return false;
  const root = activeRoots.get(container);
  if (root) {
    root.unmount();
    activeRoots.delete(container);
    return true;
  }
  return false;
}
