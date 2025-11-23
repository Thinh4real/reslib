/**
 * Returns the global object for the current JavaScript environment.
 *
 * This function attempts to detect and return the global object, supporting a variety of environments:
 * - **Browser**: Returns `window` if available.
 * - **Web Worker**: Returns `self` if available.
 * - **Node.js**: Returns `global` if available.
 * - **Modern JS**: Returns `globalThis` if available.
 * - **Fallback**: Returns an empty object if none of the above are found.
 *
 * This utility is useful for writing universal (isomorphic) code that needs to access the global scope
 * regardless of the runtime environment.
 *
 * @returns {object} The detected global object, or an empty object if none is found.
 *
 * @example
 * ```typescript
 * // In a browser environment
 * const g = getGlobal();
 * console.log(g === window); // true
 * 
 * // In a Node.js environment
 * const g = getGlobal();
 * console.log(g === global); // true
 * ```
 *
 * @remarks
 * This function is especially useful for libraries that need to work in both browser and server environments.
 */
export function getGlobal() {
    if (typeof window !== 'undefined' && typeof window === "object") { return window; }
    if (typeof self !== 'undefined' && typeof self === "object") { return self; }
    if (typeof global !== 'undefined' && typeof global === "object") { return global; }
    if (typeof globalThis !== 'undefined' && typeof globalThis === "object") { return globalThis; }
    return {};
};
/**
 * The global object that provides access to the global scope in various environments.
 * This object is determined based on the following checks:
 * - If `window` is defined, it returns `window` (for browsers).
 * - If `self` is defined, it returns `self` (for web workers).
 * - If `global` is defined, it returns `global` (for Node.js).
 * - If `globalThis` is defined, it returns `globalThis` (for modern environments).
 * - If none of the above are defined, it returns an empty object.
 *
 * @returns {object} The global object or an empty object if none are found.
 *
 * @example
 * // Accessing the global object
 * const globalScope = gbl;
 * console.log(globalScope); // Logs the global object based on the environment
 *
 * @example
 * // Using the global object to access a global variable
 * if (gbl.myGlobalVar) {
 *     console.log(gbl.myGlobalVar);
 * }
 */
export const Global = (getGlobal)();
