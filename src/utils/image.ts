import { getFileExtension } from './file';
import { isNonNullString } from './isNonNullString';
import { isDataUrl } from './uri';

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
  if (src.startsWith('blob:http')) {
    src = src.ltrim('blob:');
  }
  // Basic data URI regex pattern
  const dataUriRegex =
    /^data:image\/(jpeg|jpg|png|gif|bmp|webp|svg\+xml|x-icon|vnd\.microsoft\.icon|tiff|avif|heic);base64,([A-Za-z0-9+/=]+)$/;
  // Also support data URIs without explicit base64 declaration (implied)
  const dataUriRegexImplied =
    /^data:image\/(jpeg|jpg|png|gif|bmp|webp|svg\+xml|x-icon|vnd\.microsoft\.icon|tiff|avif|heic),([A-Za-z0-9+/=]+)$/;
  if (dataUriRegex.test(src) || dataUriRegexImplied.test(src)) {
    return true;
  }
  return (
    isDataUrl(src, { validateBase64: true }) ||
    src.startsWith('data:image/') ||
    hasImageExtension(src)
  );
};

function hasImageExtension(url: string): boolean {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  const ext = getFileExtension(cleanUrl, false).toLowerCase().trim();
  return [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',
    '.ico',
    '.tiff',
    '.tif',
    '.avif',
    '.heic',
  ].includes(ext);
}
