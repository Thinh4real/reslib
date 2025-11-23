/**
 * Checks if the given object is a DOM element.
 *
 * This function performs a series of checks to determine if the object is a DOM element.
 * It first checks if the `window` and `document` objects are available, and if the `HTMLElement` constructor is defined.
 * Then, it checks if the object is an instance of `HTMLElement` or if it has the characteristics of a DOM element (e.g., `nodeType` equals 1 and `nodeName` is defined).
 *
 * @param element The object to check.
 * @returns `true` if the object is a DOM element, `false` otherwise.
 */
export function isDOMElement(element: any): element is HTMLElement {
  if (typeof window !== "object" || !window || typeof document === "undefined" || typeof HTMLElement === "undefined") return false;
  if ((element as any) === document) return true;
  //if(element === window) return true;
  if ("HTMLElement" in window) return !!element && element instanceof HTMLElement;
  return !!element && typeof element === "object" && element.nodeType === 1 && !!element.nodeName;
}
