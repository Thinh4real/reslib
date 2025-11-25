import { isNonNullString } from './isNonNullString';

/**
 * Returns the first non-null string value among the provided arguments.
 *
 * This function takes a variable number of arguments and returns the first one that is a non-null string.
 * It iterates through the arguments and checks each one using the `isNonNullString` function.
 * If a non-null string is found, it is returned immediately. If no non-null string is found, an empty string is returned.
 *
 * @param {...any[]} args The values to check for a non-null string.
 * @returns {string} The first non-null string value found, or an empty string if none is found.
 * @example
 * ```typescript
 * console.log(defaultStr(1,2,"hello", null, "world")); // Output: "hello"
 * console.log(defaultStr(null, null, "world")); // Output: "world"
 * console.log(defaultStr(null, null, null)); // Output: ""
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaultStr(...args: any[]): string {
  for (var i in args) {
    const v = args[i];

    if (isNonNullString(v)) {
      return v;
    }
  }
  return '';
}
