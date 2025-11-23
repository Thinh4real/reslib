/**
 * Checks if the provided value is a class.
 *
 * A value is considered a class if it is a function, has a prototype, and its prototype's constructor is the same as the value itself.
 *
 * @param {any} variable The value to check.
 * @returns {boolean} True if the value is a class, false otherwise.
 * @example
 * ```typescript
 * class MyClass {}
 * console.log(isClass(MyClass)); // Output: true
 * console.log(isClass({})); // Output: false
 * console.log(isClass(function() {})); // Output: false
 * ```
 */
export function isClass(variable: any): boolean {
  if (variable === null || variable === undefined) {
    return false;
  }
  // Handle class constructors
  if (typeof variable === "function") {
    const str = variable.toString();
    return str.startsWith("class") || str.includes("_classCallCheck");
  }
  // Handle class instances
  if (typeof variable === "object") {
    const proto = Object.getPrototypeOf(variable);
    if (!proto || proto === Object.prototype) return false;
    const constructor = proto.constructor;
    if (!constructor || !constructor?.toString) return false;
    const str = constructor.toString();
    return /^\s*class\s+/.test(str);
  }
  return false;
}
