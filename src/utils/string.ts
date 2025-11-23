import { isNonNullString } from "./isNonNullString";

/**
 * Removes all occurrences of the specified string from the left side of the current string.
 *
 * This function takes two parameters: the current string and the string to remove.
 * If the string to remove is not provided, it defaults to an empty string and the function simply trims the current string.
 *
 * @param {string} current The string to modify.
 * @param {string} [str=""] The string to remove from the left side of the current string.
 * @returns {string} The modified string with all occurrences of the specified string removed from the left side.
 * @example
 * ```typescript
 * console.log(ltrim("   hello world", " ")); // Output: "hello world"
 * console.log(ltrim("hello world", " ")); // Output: "hello world"
 * console.log(ltrim("   hello world")); // Output: "hello world"
 * ```
 */
export const ltrim = function (current: string, str: string = "") {
  if (!current || typeof current !== "string") return "";
  if (!str || typeof str !== "string") {
    return current.trim();
  }
  let index = current.length;

  /**
   * Loop until the current string no longer starts with the string to remove.
   */
  while (current.startsWith(str) && index >= 0) {
    /**
     * Remove the string to remove from the left side of the current string.
     */
    current = current.slice(str.length);
    --index;
  }

  /**
   * Return the modified string.
   */
  return current.toString();
};

/**
 * Removes all occurrences of the specified string from the right side of the current string.
 *
 * This function takes two parameters: the current string and the string to remove.
 * If the string to remove is not provided, it defaults to an empty string and the function simply trims the current string.
 *
 * @param {string} current The string to modify.
 * @param {string} [str=""] The string to remove from the right side of the current string.
 * @returns {string} The modified string with all occurrences of the specified string removed from the right side.
 * @example
 * ```typescript
 * console.log(rtrim("test heee", "e")); // Output: "test h"
 * console.log(rtrim("hello world", " ")); // Output: "hello world"
 * console.log(rtrim("   hello world")); // Output: "   hello world"
 * ```
 */
export const rtrim = function (current: string, str: string = ""): string {
  if (!current || typeof current !== "string") return "";
  if (!str || typeof str !== "string") {
    return current.trim();
  }
  let index = current.length;

  /**
   * Loop until the current string no longer ends with the string to remove.
   */
  while (current.endsWith(str) && index >= 0) {
    /**
     * Remove the string to remove from the right side of the current string.
     */
    current = current.slice(0, -str.length);
    --index;
  }

  /**
   * Return the modified string.
   */
  return current.toString();
};

/**
 * Checks if the provided string consists only of numbers.
 *
 * This function takes two parameters: the string to check and an optional flag to indicate whether to consider decimal points.
 *
 * @param {string} str The string to check.
 * @param {boolean} [withDecimal=true] Whether to consider decimal points in the check.
 * @returns {boolean} True if the string consists only of numbers, false otherwise.
 * @example
 * ```typescript
 * console.log(isStringNumber("123")); // Output: true
 * console.log(isStringNumber("123.45")); // Output: true
 * console.log(isStringNumber("123.45", false)); // Output: false
 * console.log(isStringNumber("abc")); // Output: false
 * ```
 */
export const isStringNumber = (str: string, withDecimal: boolean = true) => {
  /**
   * If the input is not a string, return false.
   */
  if (typeof str !== "string") return false;

  /**
   * If decimal points are allowed, check for a string that consists of digits and an optional decimal point.
   */
  if (withDecimal !== false) {
    return /^\d*\.?\d+$/.test(str);
  }

  /**
   * If decimal points are not allowed, check for a string that consists only of digits.
   */
  return /^\d+$/.test(str);
};

/**
 * Extends the String interface with additional methods for string manipulation.
 */
declare global {
  interface String {
    /**
     * Removes all occurrences of the specified string from the left side of the string.
     * @param {string} [str=""] The string to remove from the left side.
     * @returns {string} The modified string with all occurrences of the specified string removed from the left side.
     */
    ltrim(str?: string): string;

    /**
     * Removes all occurrences of the specified string from the right side of the string.
     * @param {string} [str=""] The string to remove from the right side.
     * @returns {string} The modified string with all occurrences of the specified string removed from the right side.
     */
    rtrim(str?: string): string;

    /**
     * Checks if the string consists only of numbers.
     * @param {boolean} [withDecimal=true] Whether to consider decimal points in the check.
     * @returns {boolean} True if the string consists only of numbers, false otherwise.
     */
    isNumber(withDecimal?: boolean): boolean;

    /**
     * Converts the string to snake case (e.g. "hello world" becomes "hello_world").
     * @returns {string} The string in snake case.
     */
    toSnakeCase(): string;

    /**
     * Converts the string to camel case (e.g. "hello world" becomes "helloWorld").
     * @returns {string} The string in camel case.
     */
    toCamelCase(): string;

    /**
     * Converts the first character of the string to uppercase.
     * @returns {string} The string with the first character in uppercase.
     */
    upperFirst(): string;

    /**
     * Converts the first character of the string to lowercase.
     * @returns {string} The string with the first character in lowercase.
     */
    lowerFirst(): string;

    /**
     * Replaces all occurrences of the specified string with another string.
     * @param {string} find The string to replace.
     * @param {string} replace The string to replace with.
     * @returns {string} The string with all occurrences replaced.
     */
    replaceAll(find: string, replace: string): string;
  }
}

String.prototype.ltrim = function (str?: string): string {
  return ltrim(this.toString(), str);
};

String.prototype.rtrim = function (str?: string): string {
  return rtrim(this.toString(), str);
};

String.prototype.isNumber = function (withDecimal = true) {
  return isStringNumber(this.toString(), withDecimal);
};

String.prototype.replaceAll = function (find, replace) {
  if (!isNonNullString(find) || !isNonNullString(replace)) return this.toString();
  return this.toString().split(find).join(replace);
};

/**
 * Converts a string from camel case to snake case (e.g. "addElementComponent" becomes "ADD_ELEMENT_COMPONENT").
 *
 * This function takes a string as input, trims it, and then replaces all occurrences of camel case with underscores.
 * The resulting string is then converted to uppercase.
 *
 * @param {string} text The string to convert.
 * @returns {string} The string in snake case.
 * @example
 * ```typescript
 * console.log(toSnakeCase("thisISDifficult")); // Output: "THIS_IS_DIFFICULT"
 * console.log(toSnakeCase("thisISNT")); // Output: "THIS_ISNT"
 * console.log(toSnakeCase("addElementComponent")); // Output: "ADD_ELEMENT_COMPONENT"
 * ```
 */
export const toSnakeCase = (text: string): string => {
  /**
   * If the input string is empty, return an empty string.
   */
  if (!isNonNullString(text)) return "";

  /**
   * Trim the input string to remove any leading or trailing whitespace.
   */
  text = text.trim();

  /**
   * Replace all occurrences of camel case with underscores.
   * The regular expression /(.)([A-Z][a-z]+)/ matches any character followed by an uppercase letter and one or more lowercase letters.
   * The regular expression /([a-z0-9])([A-Z])/ matches any lowercase letter or digit followed by an uppercase letter.
   */
  return text
    .replace(/(.)([A-Z][a-z]+)/, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/, "$1_$2")
    .toUpperCase();
};

String.prototype.toSnakeCase = function () {
  return toSnakeCase(this.toString());
};
/**
 * Converts a string from snake case to camel case (e.g. "ADD_ELEMENT_COMPONENT" becomes "addElementComponent").
 *
 * This function takes a string as input, trims it, and then replaces all occurrences of underscores with uppercase letters.
 * The resulting string is then converted to camel case by making the first character lowercase.
 *
 * @param {string} text The string to convert.
 * @returns {string} The string in camel case.
 * @example
 * ```typescript
 * console.log(toCamelCase("THIS_IS_DIFFICULT")); // Output: "thisISDifficult"
 * console.log(toCamelCase("THIS_ISNT")); // Output: "thisISNT"
 * console.log(toCamelCase("ADD_ELEMENT_COMPONENT")); // Output: "addElementComponent"
 * ```
 */
export const toCamelCase = (text: string): string => {
  /**
   * If the input string is empty, return an empty string.
   */
  if (!isNonNullString(text)) return "";

  /**
   * Trim the input string to remove any leading or trailing whitespace.
   */
  text = text.trim();

  /**
   * Replace all occurrences of underscores with uppercase letters.
   * The regular expression /(_\w)/g matches any underscore followed by a word character.
   * The replacement string k => k[1].toUpperCase() converts the matched character to uppercase.
   */
  return text.charAt(0) + text.replace(/(_\w)/g, (k) => k[1].toUpperCase()).substring(1);
};
String.prototype.toCamelCase = function () {
  return toCamelCase(this.toString());
};

/**
 * Converts the first character of a string to uppercase.
 *
 * This function takes a string as input, trims it, and then converts the first character to uppercase.
 *
 * @param {string} str The string to modify.
 * @returns {string} The modified string with the first character in uppercase.
 * @example
 * ```typescript
 * console.log(upperFirst("hello world")); // Output: "Hello world"
 * console.log(upperFirst("HELLO WORLD")); // Output: "HELLO WORLD"
 * console.log(upperFirst("")); // Output: ""
 * ```
 */
export const upperFirst = function (str: string): string {
  /**
   * If the input string is empty or not a string, return an empty string.
   */
  if (!str || typeof str !== "string") return "";

  /**
   * Trim the input string to remove any leading or trailing whitespace.
   */
  str = str.trim();

  /**
   * Convert the first character of the string to uppercase and concatenate it with the rest of the string.
   */
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/***
  met en majuscule le premier caractère de la chaine string
  @return {string} la chaine de caractère modifiée
*/
String.prototype.upperFirst = function () {
  return upperFirst(this.toString());
};
/**
 * Converts the first character of a string to lowercase.
 *
 * This function takes a string as input, trims it, and then converts the first character to lowercase.
 *
 * @param {string} str The string to modify.
 * @returns {string} The modified string with the first character in lowercase.
 * @example
 * ```typescript
 * console.log(lowerFirst("Hello World")); // Output: "hello World"
 * console.log(lowerFirst("HELLO WORLD")); // Output: "hello WORLD"
 * console.log(lowerFirst("")); // Output: ""
 * ```
 */
export const lowerFirst = function (str: string): string {
  /**
   * If the input string is empty or not a string, return an empty string.
   */
  if (!str || typeof str !== "string") return "";

  /**
   * Trim the input string to remove any leading or trailing whitespace.
   */
  str = str.trim();

  /**
   * Convert the first character of the string to lowercase and concatenate it with the rest of the string.
   */
  return str.charAt(0).toLowerCase() + str.slice(1);
};
/**
 * met en miniscule le premier caractère de de la chaine string
 * @returns {string}, la chaine de caractère modifiée
 */
String.prototype.lowerFirst = function () {
  return lowerFirst(this.toString());
};
