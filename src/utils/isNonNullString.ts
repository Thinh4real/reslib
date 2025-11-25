/**
 * Checks if the provided value is a non-empty string.
 *
 * A value is considered a non-empty string if it is not null and is a string.
 *
 * @param {any} val The value to check.
 * @returns {boolean} True if the value is a non-empty string, false otherwise.
 * @example
 * ```typescript
 * console.log(isNonNullString('hello')); // Output: true
 * console.log(isNonNullString('')); // Output: false
 * console.log(isNonNullString(null)); // Output: false
 * console.log(isNonNullString(undefined)); // Output: false
 * console.log(isNonNullString(123)); // Output: false
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNonNullString<T = any>(val: T): val is T & string {
  /**
   * Check if the value is not null and is a string.
   */
  return val && typeof val === 'string' ? true : false;
}
