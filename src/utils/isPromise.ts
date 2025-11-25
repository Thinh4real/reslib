/**
 * Checks if the provided value is a native Promise.
 *
 * A value is considered a native Promise if it is an instance of the Promise constructor, or if its constructor is a function that is similar to the Promise constructor.
 *
 * @param {any} p The value to check.
 * @returns {boolean} True if the value is a native Promise, false otherwise.
 * @example
 * ```typescript
 * console.log(isNativePromise(Promise.resolve())); // Output: true
 * console.log(isNativePromise({})); // Output: false
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNativePromise(p: any): boolean {
  if (
    typeof p === 'boolean' ||
    !p ||
    typeof p === 'number' ||
    typeof p === 'string' ||
    typeof p == 'symbol'
  ) {
    return false;
  }

  /**
   * If the value is an instance of the Promise constructor, it's a Promise.
   */
  if (Object(p).constructor === Promise) {
    return true;
  }

  /**
   * If the value's constructor is named 'Promise' or 'AsyncFunction', it's a Promise.
   */
  if (
    p.constructor &&
    (p.constructor.name === 'Promise' || p.constructor.name === 'AsyncFunction')
  ) {
    return true;
  }

  /**
   * If the value is an instance of Promise, it's a Promise.
   */
  if (p instanceof Promise) {
    return true;
  }
  if (
    typeof p?.then == 'function' &&
    typeof p?.catch === 'function' &&
    typeof p?.finally === 'function'
  ) {
    return true;
  }

  /**
   * If the value's constructor is a function that is similar to the Promise constructor, it's a Promise.
   */
  return (
    p &&
    typeof p.constructor === 'function' &&
    Function.prototype.toString.call(p.constructor).replace(/\(.*\)/, '()') ===
      Function.prototype.toString
        .call(Function)
        .replace('Function', 'Promise') // replacing Identifier
        .replace(/\(.*\)/, '()')
  ); // removing possible FormalParameterList
}

/**
 * Checks if the provided value is a Promise.
 *
 * A value is considered a Promise if it is a native Promise or if it has a Promise-like interface.
 *
 * @param {any} value The value to check.
 * @returns {boolean} True if the value is a Promise, false otherwise.
 * @example
 * ```typescript
 * console.log(isPromise(Promise.resolve())); // Output: true
 * console.log(isPromise({})); // Output: false
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(value: any): boolean {
  /**
   * Check if the value is a native Promise.
   */
  return value && Object.prototype.toString.call(value) === '[object Promise]'
    ? true
    : isNativePromise(value);
}
