/**
 * Checks if the provided value is empty.
 *
 * A value is considered empty if it is null, undefined, an empty string, or an empty array.
 *
 * @param {any} value The value to check.
 * @returns {boolean} True if the value is empty, false otherwise.
 * @example
 * ```typescript
 * console.log(isEmpty(null)); // Output: true
 * console.log(isEmpty(undefined)); // Output: true
 * console.log(isEmpty('')); // Output: true
 * console.log(isEmpty([])); // Output: true
 * console.log(isEmpty('hello')); // Output: false
 * console.log(isEmpty([1, 2, 3])); // Output: false
 * ```
 */
export function isEmpty(value: any): boolean {
  /**
   * Check if the value is null or undefined.
   */
  if (value === null || value === undefined || typeof value == "undefined") {
    return true;
  }

  /**
   * Check if the value is an empty string.
   */
  if (typeof value === "string" && value === "") {
    return true;
  }

  /**
   * Check if the value is an empty array.
   */
  if (Array.isArray(value) && !value.length) {
    return true;
  }

  /**
   * If none of the above conditions are met, the value is not empty.
   */
  return false;
}
