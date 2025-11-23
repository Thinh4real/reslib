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
export function defaultBool(...args: any[]): boolean {
  /**
   * Iterate over the provided arguments.
   *
   * We use a for...in loop to iterate over the arguments, which allows us to access each argument by its index.
   */
  for (let i in args) {
    /**
     * Check if the current argument is a boolean value.
     *
     * We use the typeof operator to check if the current argument is a boolean value.
     */
    if (typeof args[i] === "boolean") {
      /**
       * If a boolean value is found, return it immediately.
       *
       * We return the boolean value as soon as we find one, which ensures that we return the first boolean value.
       */
      return args[i];
    }
  }
  /**
   * If no boolean value is found, return false.
   *
   * If we iterate over all the arguments and don't find a boolean value, we return false by default.
   */
  return false;
}
