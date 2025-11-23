import { isDOMElement } from "./isDOMElement";

/**
 * Returns the maximum z-index value of all elements in the document body.
 *
 * This function iterates through all elements in the document body, excluding those with a `data-highest` attribute or a class of `yetHigher`.
 * It then retrieves the `zIndex` style property of each element using `getComputedStyle` and filters out any non-numeric values.
 * Finally, it returns the maximum z-index value found.
 *
 * @returns The maximum z-index value of all elements in the document body.
 */
export function getMaxZindex(): number {
  if (typeof document === "undefined" || !document) {
    return 1000; // Default fallback value if document is not available
  }
  let highestZIndex = 0;

  // later, potentially repeatedly
  highestZIndex = Math.max(highestZIndex, ...Array.from(document.querySelectorAll("body *:not([data-highest]):not(.yetHigher)"), (elem) => parseFloat(getComputedStyle(elem).zIndex)).filter((zIndex) => !isNaN(zIndex)));
  return highestZIndex;
}
/**
 * Checks if an HTML element has a specific class name.
 *
 * This function takes an HTML element and an optional class name as input.
 * It first checks if the element is a valid DOM element and if the class name is provided.
 * If both conditions are true, it uses a regular expression to test if the class name is present in the element's `className` property.
 *
 * @param elem The HTML element to check.
 * @param className The class name to search for (optional).
 * @returns `true` if the element has the specified class name, `false` otherwise.
 *
 * Example:
 * ```ts
 * const element = document.getElementById("myElement");
 * console.log(hasClassName(element, "active")); // Output: true or false
 * ```
 */
export function hasClassName(elem: any, className?: string | null): boolean {
  /**
   * Check if the element is a valid DOM element and if the class name is provided.
   */
  if (!isDOMElement(elem) || !className) return false;

  /**
   * Use a regular expression to test if the class name is present in the element's `className` property.
   *
   * The regular expression is wrapped in spaces to ensure that the class name is matched as a whole word.
   */
  return new RegExp(" " + className + " ").test(" " + elem.className + " ");
}
/**
 * Adds one or more class names to an HTML element.
 *
 * This function takes an HTML element and a variable number of class names as input.
 * It checks if the element is a valid DOM element and then iterates through the provided class names.
 * If a class name is not already present on the element, it is appended to the element's `className` property.
 *
 * @param elem The HTML element to add class names to.
 * @param args One or more class names to add.
 * @example
 * ```typescript
 * const elem = document.getElementById('myElement');
 * addClassName(elem, 'class1', 'class2', 'class3');
 * console.log(elem.className); // Output: "class1 class2 class3"
 * ```
 */
export function addClassName(elem: any, ...args: string[]): void {
  if (!isDOMElement(elem)) return;
  for (let i = 0; i < args.length; i++) {
    const className = args[i];
    if (className && !hasClassName(elem, className)) {
      elem.className += " " + className;
    }
  }
}
/**
 * Removes one or more class names from an HTML element.
 *
 * This function takes an HTML element and a variable number of class names as input.
 * It checks if the element is a valid DOM element and then iterates through the provided class names.
 * If a class name is present on the element, it is removed from the element's `className` property.
 *
 * @param elem The HTML element to remove class names from.
 * @param args One or more class names to remove.
 * @example
 * ```typescript
 * const elem = document.getElementById('myElement');
 * elem.className = 'class1 class2 class3';
 * removeClassName(elem, 'class2');
 * console.log(elem.className); // Output: "class1 class3"
 * ```
 */
export function removeClassName(elem: any, ...args: string[]): void {
  if (!elem || !isDOMElement(elem)) return;
  for (let i = 0; i < args.length; i++) {
    const className = args[i];
    if (className && elem.className && typeof elem.className === "string") {
      const reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
      elem.className = elem.className.replace(reg, " ");
      elem.className = elem.className.replace(className, "");
    }
  }
}

export { isDOMElement };
