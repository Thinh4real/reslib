/**
 * A utility class providing helper methods for JSON manipulation, including
 * handling circular references, stringification, validation, and parsing.
 *
 * This class offers robust JSON operations that go beyond standard JSON methods,
 * particularly useful for complex data structures with circular references or
 * nested JSON strings.
 *
 * @example
 * ```typescript
 * import { JsonHelper } from './json';
 *
 * // Handle circular references
 * const circular = { name: 'test' };
 * circular.self = circular;
 * const safe = JsonHelper.decycle(circular);
 * console.log(JsonHelper.stringify(safe)); // '{"name":"test","self":null}'
 *
 * // Validate JSON strings
 * console.log(JsonHelper.isJSON('{"key": "value"}')); // true
 * console.log(JsonHelper.isJSON('not json')); // false
 *
 * // Parse nested JSON
 * const nested = { data: '{"inner": "value"}' };
 * const parsed = JsonHelper.parse(nested);
 * console.log(parsed.data.inner); // 'value'
 * ```
 */
export class JsonHelper {
  /**
   * Removes circular references from an object by replacing them with `null`.
   *
   * This method recursively traverses objects and arrays, detecting when an object
   * references itself (directly or indirectly) and replacing such references with
   * `null` to prevent infinite recursion during JSON serialization.
   *
   * Functions are converted to `undefined` as they cannot be reliably serialized.
   * Primitive values (strings, numbers, booleans) and `null`/`undefined` are returned as-is.
   *
   * @param obj - The object to decycle. Can be any type.
   * @param stack - Internal parameter used for tracking visited objects during recursion.
   *                Should not be provided by external callers.
   * @returns A new object with circular references removed, or the original value if it's not an object.
   *
   * @example
   * ```typescript
   * const circular = { name: 'test' };
   * circular.self = circular; // Creates circular reference
   *
   * console.log(JSON.stringify(circular)); // Throws TypeError: Converting circular structure to JSON
   *
   * const decycled = JsonHelper.decycle(circular);
   * console.log(JSON.stringify(decycled)); // '{"name":"test","self":null}'
   * ```
   *
   * @example
   * ```typescript
   * const nested = {
   *   a: { b: {} },
   *   c: {}
   * };
   * nested.a.b = nested.c; // Cross-reference
   * nested.c.ref = nested.a; // Creates cycle
   *
   * const safe = JsonHelper.decycle(nested);
   * console.log(JSON.stringify(safe)); // No circular references
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static decycle(obj: any, stack: Array<any> = []): any {
    /**
     * If the object is a function, return undefined.
     */
    if (typeof obj === 'function') {
      return undefined;
    }

    /**
     * If the object is not an object, return it as is.
     */
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    /**
     * If the object is already in the stack, return null to avoid infinite recursion.
     */
    if (stack.includes(obj)) {
      return null;
    }

    /**
     * Create a new stack by concatenating the current stack with the current object.
     */
    let s = stack.concat([obj]);

    /**
     * If the object is an array, decycle each element recursively.
     */
    if (Array.isArray(obj)) {
      return obj.map((x) => JsonHelper.decycle(x, s));
    }

    /**
     * If the object is an object, decycle each property recursively.
     */
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, JsonHelper.decycle(v, s)])
    );
  }

  /**
   * Converts a JavaScript value to a JSON string, with optional circular reference handling.
   *
   * This method wraps `JSON.stringify()` and provides an option to automatically
   * remove circular references before serialization. If the input is already a string,
   * it is returned as-is.
   *
   * @param jsonObj - The value to convert to a JSON string. Can be any type.
   * @param decylcleVal - Whether to remove circular references before stringification.
   *                      Defaults to `false` for performance. Set to `true` to handle
   *                      objects with circular references.
   * @returns A JSON string representation of the input value.
   *
   * @throws Will throw the same errors as `JSON.stringify()` if the value cannot be serialized
   *         and `decylcleVal` is `false`, or if circular references cannot be resolved.
   *
   * @example
   * ```typescript
   * // Basic usage
   * const obj = { name: 'John', age: 30 };
   * console.log(JsonHelper.stringify(obj)); // '{"name":"John","age":30}'
   * ```
   *
   * @example
   * ```typescript
   * // Handle circular references
   * const circular = { name: 'test' };
   * circular.self = circular;
   *
   * // Without decycling - would throw
   * // console.log(JsonHelper.stringify(circular)); // TypeError
   *
   * // With decycling
   * console.log(JsonHelper.stringify(circular, true)); // '{"name":"test","self":null}'
   * ```
   *
   * @example
   * ```typescript
   * // String input is returned as-is
   * console.log(JsonHelper.stringify('already a string')); // 'already a string'
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static stringify(jsonObj: any, decylcleVal: boolean = false): string {
    if (typeof jsonObj === 'string') {
      return jsonObj;
    }
    return JSON.stringify(
      decylcleVal !== false ? JsonHelper.decycle(jsonObj) : jsonObj
    );
  }

  /**
   * Determines whether a given value is a valid JSON string representing an object or array.
   *
   * This method performs strict validation, only accepting JSON strings that parse to
   * objects `{}` or arrays `[]`. Primitive JSON values (strings, numbers, booleans, null)
   * are considered invalid for this helper's purposes.
   *
   * The method includes performance optimizations like checking the first character
   * and trimming whitespace before attempting to parse.
   *
   * @param json_string - The value to test. Only strings are considered valid input.
   * @returns `true` if the input is a string containing valid JSON for an object or array,
   *          `false` otherwise.
   *
   * @example
   * ```typescript
   * // Valid JSON objects and arrays
   * console.log(JsonHelper.isJSON('{"key": "value"}')); // true
   * console.log(JsonHelper.isJSON('[1, 2, 3]')); // true
   * console.log(JsonHelper.isJSON('{"nested": {"key": "value"}}')); // true
   * ```
   *
   * @example
   * ```typescript
   * // Invalid inputs
   * console.log(JsonHelper.isJSON('not json')); // false
   * console.log(JsonHelper.isJSON('"string"')); // false (primitive)
   * console.log(JsonHelper.isJSON('42')); // false (primitive)
   * console.log(JsonHelper.isJSON('true')); // false (primitive)
   * console.log(JsonHelper.isJSON('null')); // false (primitive)
   * console.log(JsonHelper.isJSON(123)); // false (not a string)
   * console.log(JsonHelper.isJSON(null)); // false (not a string)
   * console.log(JsonHelper.isJSON('')); // false (empty string)
   * console.log(JsonHelper.isJSON('   ')); // false (whitespace only)
   * ```
   *
   * @example
   * ```typescript
   * // Edge cases
   * console.log(JsonHelper.isJSON('{invalid json')); // false (malformed)
   * console.log(JsonHelper.isJSON('starts with [ but invalid')); // false
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isJSON(json_string: any): boolean {
    // We only consider strings as valid JSON input for this helper
    if (typeof json_string !== 'string') {
      return false;
    }

    const text = json_string.trim();
    if (text.length === 0) {
      return false;
    }

    // For the helper we only want to parse object/array JSON strings, not
    // primitive JSON values like numbers, booleans or quoted strings.
    // Quick check for starting token helps avoid parsing primitives.
    const first = text[0];
    if (first !== '{' && first !== '[') {
      return false;
    }

    try {
      const parsed = JSON.parse(text);
      // Only accept objects or arrays as the parse root
      return parsed !== null && typeof parsed === 'object';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  }

  /**
   * Parses JSON strings with support for nested JSON parsing and custom revivers.
   *
   * This method extends `JSON.parse()` by recursively parsing any string properties
   * within objects that contain valid JSON. It's particularly useful for deserializing
   * data structures that have been serialized with nested JSON strings.
   *
   * If the input is not a string, it's returned as-is. If parsing fails, the original
   * input is returned instead of throwing an error.
   *
   * @template T - The expected return type. Defaults to `any`.
   * @param jsonStr - The value to parse. If it's a string, attempts JSON parsing.
   *                  If it's an object, recursively parses any JSON string properties.
   * @param reviver - An optional function to transform the parsed values, passed to `JSON.parse()`.
   * @returns The parsed value, or the original input if parsing fails or input is not a string.
   *
   * @example
   * ```typescript
   * // Basic JSON parsing
   * const parsed = JsonHelper.parse('{"name": "John", "age": 30}');
   * console.log(parsed.name); // 'John'
   * console.log(parsed.age); // 30
   * ```
   *
   * @example
   * ```typescript
   * // Parse nested JSON strings within objects
   * const nested = {
   *   user: '{"name": "John", "age": 30}',
   *   metadata: '{"created": "2023-01-01"}',
   *   notes: 'not json'
   * };
   *
   * const parsed = JsonHelper.parse(nested);
   * console.log(parsed.user.name); // 'John'
   * console.log(parsed.metadata.created); // '2023-01-01'
   * console.log(parsed.notes); // 'not json' (unchanged)
   * ```
   *
   * @example
   * ```typescript
   * // Using a reviver function
   * const json = '{"date": "2023-01-01", "count": "42"}';
   * const parsed = JsonHelper.parse(json, (key, value) => {
   *   if (key === 'date') return new Date(value);
   *   if (key === 'count') return parseInt(value);
   *   return value;
   * });
   * console.log(parsed.date instanceof Date); // true
   * console.log(typeof parsed.count); // 'number'
   * ```
   *
   * @example
   * ```typescript
   * // Non-string inputs are returned as-is
   * console.log(JsonHelper.parse(42)); // 42
   * console.log(JsonHelper.parse(null)); // null
   * console.log(JsonHelper.parse({ already: 'parsed' })); // { already: 'parsed' }
   * ```
   *
   * @example
   * ```typescript
   * // Invalid JSON returns original input
   * console.log(JsonHelper.parse('{invalid json}')); // '{invalid json}'
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse<T = any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonStr: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviver?: (this: any, key: string, value: any) => any
  ): T {
    // If the input is a string, try to parse any valid JSON value (objects, arrays, or primitives)
    if (typeof jsonStr === 'string') {
      try {
        const parsed = JSON.parse(jsonStr, reviver);
        jsonStr = parsed;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Not a JSON string: return original input
        return jsonStr;
      }
    }
    // If the value is an object, recursively parse each property
    if (jsonStr && typeof jsonStr === 'object') {
      for (const i in jsonStr) {
        const json = jsonStr[i];
        if (JsonHelper.isJSON(json)) {
          jsonStr[i] = JsonHelper.parse(json, reviver);
        }
      }
    }
    return jsonStr;
  }
}
