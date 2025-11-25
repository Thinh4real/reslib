/**
 * Returns the first boolean value among the provided arguments.
 *
 * @param {...any[]} args The values to check for a boolean value.
 * @returns {boolean} The first boolean value found, or false if none is found.
 *
 * Example:
 * ```ts
 * console.log(defaultBool("a string", false, true)); // Output: false
 * console.log(defaultBool(1, 2, 3)); // Output: false
 * console.log(defaultBool("hello", 42,true, )); // Output: true
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaultBool(...args: any[]): boolean {
  /**
   * Iterate over the provided arguments.
   *
   * We use a for...in loop to iterate over the arguments, which allows us to access each argument by its index.
   */
  for (let i in args) {
    if (typeof args[i] === 'boolean') {
      return args[i];
    }
  }
  return false;
}
