/**
 * Checks if the provided value is a regular expression.
 *
 * A value is considered a regular expression if it is an instance of the RegExp constructor, or if it can be converted to a RegExp.
 *
 * @param {any} regExp The value to check.
 * @returns {boolean} True if the value is a regular expression, false otherwise.
 * @example
 * ```typescript
 * console.log(isRegExp(/hello/)); // Output: true
 * console.log(isRegExp("hello")); // Output: true
 * console.log(isRegExp({})); // Output: false
 * ```
 */
export function isRegExp(regExp: any): regExp is RegExp {
  /**
   * If the value is an instance of the RegExp constructor, it's a regular expression.
   */
  if (regExp instanceof RegExp) {
    return true;
  }

  /**
   * If the value is not an object or does not have a toString method that includes "RegExp", it's not a regular expression.
   */
  if (!regExp || typeof regExp !== "object" || !Object.prototype.toString.call(regExp).includes("RegExp")) {
    return false;
  }
  try {
    new RegExp(regExp);
    return true;
  } catch (e) {
    return false;
  }
}
