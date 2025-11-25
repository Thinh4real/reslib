/**
 * Returns the first non-null and non-undefined value among the provided arguments.
 *
 * This function takes a variable number of arguments and returns the first one that is not null or undefined.
 * It iterates through the arguments and checks each one. If a non-null and non-undefined value is found, it is returned immediately.
 * If no non-null and non-undefined value is found, but a null value is found, null is returned. Otherwise, undefined is returned.
 *
 * @param {...any[]} args The values to check for a non-null and non-undefined value.
 * @returns {any} The first non-null and non-undefined value found, or null if a null value is found, or undefined if no value is found.
 * @example
 * ```typescript
 * console.log(defaultVal("hello", null, "world")); // Output: "hello"
 * console.log(defaultVal(null, null, "world")); // Output: "world"
 * console.log(defaultVal(null, null, null)); // Output: null
 * console.log(defaultVal(undefined, undefined)); // Output: undefined
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaultVal(...args: any[]) {
  let nullV = undefined;
  for (let i in args) {
    if (args[i] !== undefined && args[i] !== null) {
      return args[i];
    }
    if (args[i] === null) {
      nullV = null;
    }
  }
  return nullV;
}
