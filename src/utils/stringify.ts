import { defaultStr } from './defaultStr';
import { isNumber } from './isNumber';

function escapeString(str: string): string {
  return defaultStr(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\v/g, '\\v')
    .replace(/[\b]/g, '\\b')
    .replace(/\f/g, '\\f');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isType(obj: any, type: string): boolean {
  var t = Object.prototype.toString.call(obj);
  return t === '[object ' + type + ']';
}

/**
 * Converts a variable to a string representation.
 *
 * This function takes a variable as input and returns a string representation of it.
 * It works similarly to the JSON.stringify function, but with additional options.
 *
 * @param {any} obj The variable to convert to a string.
 * @param {{parenthesis: boolean}} [options] Additional options.
 * @param {boolean} [options.parenthesis=false] Whether to wrap the result in parentheses.
 * @param {boolean} [options.escapeString=true] Whether to escape quotes and other special characters in the string representation.
 * @returns {string} The string representation of the variable.
 * @example
 * ```typescript
 * console.log(stringify({ a: 1, b: 2 })); // Output: "{a:1,b:2}"
 * console.log(stringify({ a: 1, b: 2 }, { parenthesis: true })); // Output: "({a:1,b:2})"
 * console.log(stringify(null)); // Output: "null"
 * console.log(stringify(undefined)); // Output: "undefined"
 * ```
 */
export function stringify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  options?: { parenthesis?: boolean; escapeString?: boolean }
): string {
  if (['boolean', 'undefined'].includes(typeof obj) || obj === null) {
    return String(obj);
  }
  if (isNumber(obj)) {
    return (obj as number).formatNumber();
  }
  if (obj instanceof Date) {
    return obj.toFormat();
  }
  if (obj instanceof Error) {
    return obj?.toString();
  }
  options = Object.assign({}, options);
  const { parenthesis } = options;
  const openParen = parenthesis ? '(' : '';
  const closeParen = parenthesis ? ')' : '';
  /**
   * If the input is a string, return its string representation wrapped in single quotes.
   */
  if (typeof obj === 'string') {
    return options?.escapeString !== false
      ? "'" + escapeString(obj as string) + "'"
      : obj;
  }
  if (
    isType(obj, 'RegExp') ||
    isType(obj, 'Number') ||
    isType(obj, 'Boolean')
  ) {
    return obj.toString();
  }

  /**
   * If the input is a Date object, return its string representation as a new Date object.
   */
  if (isType(obj, 'Date')) {
    return 'new Date(' + obj.getTime() + ')';
  }

  /**
   * If the input is an array, return its string representation as a comma-separated list of string representations.
   */
  if (Array.isArray(obj)) {
    return '[' + obj.map((v) => stringify(v, options)).join(',') + ']';
  }

  /**
   * If the input is an object, return its string representation as a comma-separated list of key-value pairs.
   */
  if (typeof obj === 'object') {
    return (
      openParen +
      '{' +
      Object.keys(obj)
        .map((k) => {
          var v = obj[k];
          return stringify(k, options) + ':' + stringify(v, options);
        })
        .join(',') +
      '}' +
      closeParen
    );
  }
  if (!obj) return String(obj);
  return typeof obj?.toString == 'function' ? obj?.toString() : String(obj);
}
