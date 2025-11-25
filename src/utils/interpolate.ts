import { Dictionary } from '@/types';
import { defaultStr } from './defaultStr';
import { isPrimitive } from './isPrimitive';
import { isRegExp } from './isRegex';
import { isObj } from './object';

/**
 * Options for the interpolate function.
 */
export interface InterpolateOptions {
  /**
   * Custom regex pattern to match placeholders.
   * Defaults to `\%\{([^}]+)\}` for `%{key}` format.
   * The regex should have a capturing group for the key.
   */
  tagRegex?: RegExp;
  /**
   * Custom function to format values before interpolation.
   * If not provided, a default formatter will be used.
   * @param value - The value to format
   * @param tagName - The name of the tag being replaced
   * @param defaultFormatter - The default value formatter function
   * @returns The formatted string representation
   */
  valueFormatter?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    tagName: string,
    defaultFormatter: typeof defaultValueFormatter
  ) => string;
}

/**
 * Interpolates placeholders in a string with values from a parameters object.
 *
 * This function is particularly useful for internationalization (i18n) and dynamic string formatting,
 * where text templates contain placeholders that need to be replaced with actual values.
 * By default, placeholders are in the format `%{key}`, where `key` can be a simple string or a dotted path.
 *
 * If a placeholder's key is not found in the params object or the value is empty,
 * the placeholder is replaced with an empty string.
 *
 * @param text - The template string containing placeholders.
 * @param params - An object containing key-value pairs for interpolation.
 * @param options - Optional configuration object for interpolation behavior.
 * @returns The interpolated string with placeholders replaced by their corresponding values.
 *
 * @example
 * // Basic interpolation with default %{key} format
 * const result = interpolate("Hello, %{name}!", { name: "World" });
 * // Result: "Hello, World!"
 *
 * @example
 * // Multiple placeholders
 * const result = interpolate("User %{firstName} %{lastName} is %{age} years old.", {
 *   firstName: "John",
 *   lastName: "Doe",
 *   age: 30
 * });
 * // Result: "User John Doe is 30 years old."
 *
 * @example
 * // Missing or empty parameters - placeholders are removed
 * const result = interpolate("Welcome %{user} to %{location}.", {
 *   user: "Alice"
 * });
 * // Result: "Welcome Alice to ."
 *
 * @example
 * // Dotted keys (treated as flat keys)
 * const result = interpolate("Contact: %{user.email}", {
 *   "user.email": "alice@example.com"
 * });
 * // Result: "Contact: alice@example.com"
 *
 * @example
 * // Custom regex for double braces {{key}}
 * const result = interpolate("Hello, {{name}}!", { name: "World" }, { tagRegex: /\{\{([^}]+)\}\}/g });
 * // Result: "Hello, World!"
 *
 * @example
 * // Custom value formatter for uppercase strings
 * const result = interpolate("Hello %{name}!", { name: "world" }, {
 *   valueFormatter: (value, tagName) => typeof value === 'string' ? value.toUpperCase() : String(value)
 * });
 * // Result: "Hello WORLD!"
 *
 * @example
 * // Custom value formatter for numbers with currency
 * const result = interpolate("Price: %{amount}", { amount: 99.99 }, {
 *   valueFormatter: (value, tagName) => typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)
 * });
 * // Result: "Price: $99.99"
 *
 * @example
 * // Custom value formatter based on tag name
 * const result = interpolate("User: %{name}, Age: %{age}", { name: "John", age: 25 }, {
 *   valueFormatter: (value, tagName) => {
 *     if (tagName === 'age') return `${value} years old`;
 *     return String(value);
 *   }
 * });
 * // Result: "User: John, Age: 25 years old"
 *
 * @example
 * // No params provided - returns original string
 * const result = interpolate("No placeholders here.");
 * // Result: "No placeholders here."
 *
/**
 * Default value formatter for interpolation.
 * Handles all common JavaScript value types.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function defaultValueFormatter(value: any, tagName: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    (typeof value === 'object' && value instanceof Number)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (value as any).formatNumber === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).formatNumber();
    }
  }
  if (
    value instanceof Date ||
    (typeof value === 'object' && value !== null && value.constructor === Date)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (value as any).toFormat === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).toFormat();
    }
    return (value as Date).toISOString();
  }
  if (value instanceof Error) {
    return `Error: ${value.message}`;
  }
  if (isRegExp(value)) {
    return value.toString();
  }
  if (isPrimitive(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object' && value !== null) {
    // For objects with custom toString methods (not Object.prototype.toString)
    if (
      typeof value.toString === 'function' &&
      value.toString !== Object.prototype.toString
    ) {
      return value.toString();
    }
    // For other objects, try toString first (for Map, Set, etc.), then fall back to JSON.stringify
    if (typeof value.toString === 'function') {
      const str = value.toString();
      if (str !== '[object Object]') {
        return str;
      }
    }
    return JSON.stringify(value);
  }
  if (typeof value?.toString === 'function') {
    return value.toString();
  }
  // For other types (functions, symbols, etc.), convert to string
  return String(value);
}
export function interpolate(
  text?: string,
  params?: Dictionary,
  options?: InterpolateOptions
): string {
  const valueFormatter = options?.valueFormatter || defaultValueFormatter;

  let processedContent = defaultStr(text);
  if (!isObj(params) || !params) {
    return processedContent;
  }
  // Use custom tag regex or default to %{key} format
  const tagRegex = options?.tagRegex || /%\{([^}]+)\}/g;
  const usedTags = new Set<string>();
  let match;
  const content = defaultStr(text);
  while ((match = tagRegex.exec(content)) !== null) {
    const tagPath = match[1];
    // Only add if the regex has a capture group (tagPath is not undefined)
    if (tagPath !== undefined) {
      usedTags.add(tagPath);
    }
  }
  usedTags.forEach((tagPath) => {
    // Reconstruct the full tag based on the regex pattern
    // For default %{key}, it's %{tagPath}
    // For custom patterns, we need to build the replacement string
    let tag: string;
    if (options?.tagRegex) {
      // For custom regex, we need to reconstruct the tag from the match
      // This is tricky, so we'll use a different approach: replace all occurrences directly
      const customRegex = new RegExp(
        options.tagRegex.source,
        options.tagRegex.flags
      );
      const matches = [...content.matchAll(customRegex)];
      matches.forEach((match) => {
        const fullMatch = match[0];
        // Check if the regex has a capture group
        if (!match[1]) {
          // No capture group found, skip this match
          return;
        }
        const key = match[1];
        const value = Object.prototype.hasOwnProperty.call(params, key)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (params as any)[key]
          : undefined;
        const stringValue =
          value === undefined
            ? ''
            : (() => {
                try {
                  return valueFormatter(value, key, defaultValueFormatter);
                } catch {
                  return defaultValueFormatter(value, key);
                }
              })();
        const escapedMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        processedContent = processedContent.replace(
          new RegExp(escapedMatch, 'g'),
          stringValue
        );
      });
      return; // Skip the default logic
    } else {
      tag = `%{${tagPath}}`;
    }
    // Look for the value in params using the exact path as key
    // params has keys like "user.firstName", "domain.field", etc.
    const value = Object.prototype.hasOwnProperty.call(params, tagPath)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params as any)[tagPath]
      : undefined;
    const stringValue =
      value === undefined
        ? ''
        : (() => {
            try {
              return valueFormatter(value, tagPath, defaultValueFormatter);
            } catch {
              return defaultValueFormatter(value, tagPath);
            }
          })();
    // Escape special regex characters in the tag for safe replacement
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processedContent = processedContent.replace(
      new RegExp(escapedTag, 'g'),
      stringValue
    );
  });
  return processedContent;
}
