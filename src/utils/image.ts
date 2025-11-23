import { getFileExtension } from "./file";
import { isNonNullString } from "./isNonNullString";

/**
 * Regular expression to validate data URLs.
 *
 * This regex checks if a given string is formatted as a valid data URL.
 * A data URL typically consists of a scheme (`data:`), a media type (e.g.,
 * `image/png`), an optional character set, and the actual data, which may be
 * base64 encoded.
 *
 * The regex supports various media types and ensures that the structure of
 * the data URL is correct, including optional parameters and base64 encoding.
 *
 * @constant {RegExp}
 */
const isDataUrlRegex = /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)$/i;

/**
 * Checks if the provided string is a valid data URL.
 *
 * This function verifies that the input string is a non-null string, does not
 * contain the specific data URL for `.x-icon` images, and matches the
 * `isDataUrlRegex` regular expression for data URLs.
 *
 * The function returns `true` if the string is a valid data URL and `false`
 * otherwise.
 *
 * @param {string} s - The string to check for being a data URL.
 * @returns {boolean} - Returns `true` if the string is a valid data URL,
 *                      `false` otherwise.
 *
 * @example
 * // Valid data URLs
 * console.log(isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...')); // true
 * console.log(isDataUrl('data:text/plain;charset=utf-8,Hello%20World!')); // true
 *
 * // Invalid data URLs
 * console.log(isDataUrl('data:image/x-icon;base64,...')); // false (contains x-icon)
 * console.log(isDataUrl('not-a-data-url')); // false
 * console.log(isDataUrl(null)); // false
 */
export const isDataUrl = function isDataUrl(s: string): boolean {
  return isNonNullString(s) && !s.includes("data:image/x-icon") && !!s.match(isDataUrlRegex);
};

/**
 * Checks if the provided source is a valid image source.
 *
 * This function verifies whether the input `src` is a valid image source by performing
 * several checks:
 *
 * 1. **Non-null String Check**: It first checks if `src` is a non-null string using the
 *    `isNonNullString` function.
 *
 * 2. **Trim Whitespace**: The function trims any leading or trailing whitespace from the
 *    source string to ensure accurate validation.
 *
 * 3. **Blob URL Handling**: If the source starts with `blob:http`, it removes the `blob:`
 *    prefix for further validation. Note that `ltrim` should be defined elsewhere in your code.
 *
 * 4. **Validation Checks**: The function then checks if the modified source is:
 *    - A valid data URL using the `isDataUrl` function.
 *    - A string that matches common image file extensions (e.g., `.bmp`, `.jpg`, `.jpeg`,
 *      `.png`, `.gif`, `.svg`) using a regular expression.
 *    - A string that starts with `data:image/`, indicating it is a data URL for an image.
 *
 * The function returns `true` if any of these conditions are met, indicating that the source
 * is a valid image source; otherwise, it returns `false`.
 *
 * @param {any} src - The source to validate as an image source.
 * @returns {boolean} - Returns `true` if the source is a valid image source,
 *                      `false` otherwise.
 *
 * @example
 * // Valid image sources
 * console.log(isValidImageSrc('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...')); // true
 * console.log(isValidImageSrc('https://example.com/image.jpg')); // true
 * console.log(isValidImageSrc('image.png')); // true (if file extension is valid)
 *
 * // Invalid image sources
 * console.log(isValidImageSrc(null)); // false
 * console.log(isValidImageSrc('')); // false
 * console.log(isValidImageSrc('not-a-valid-url')); // false
 * console.log(isValidImageSrc('blob:http://example.com/...')); // true (if valid blob URL)
 */
export const isValidImageSrc = (src: any) => {
  if (!isNonNullString(src)) return false;
  src = src.trim();
  if (src.startsWith("blob:http")) {
    src = src.ltrim("blob:");
  }
  // Basic data URI regex pattern
  const dataUriRegex = /^data:image\/(jpeg|jpg|png|gif|bmp|webp|svg\+xml|x-icon|vnd\.microsoft\.icon|tiff|avif|heic);base64,([A-Za-z0-9+/=]+)$/;
  // Also support data URIs without explicit base64 declaration (implied)
  const dataUriRegexImplied = /^data:image\/(jpeg|jpg|png|gif|bmp|webp|svg\+xml|x-icon|vnd\.microsoft\.icon|tiff|avif|heic),([A-Za-z0-9+/=]+)$/;
  if (dataUriRegex.test(src) || dataUriRegexImplied.test(src)) {
    return true;
  }
  return isDataUrl(src) || src.startsWith("data:image/") || hasImageExtension(src);
};

function hasImageExtension(url: string): boolean {
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  const ext = getFileExtension(cleanUrl, false).toLowerCase().trim();
  return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico", ".tiff", ".tif", ".avif", ".heic"].includes(ext);
}
