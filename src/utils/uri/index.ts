import { ltrim, rtrim } from '../string';

import queryString, { IParseBaseOptions, IStringifyBaseOptions } from 'qs';

import { IDict } from '../../types';
import { isNonNullString } from '../isNonNullString';
/**
 * Returns the query string from a given URL.
 *
 * This function takes a URL and an optional flag as input.
 * It parses the URL to extract the query string, which is the part of the URL after the `?` character.
 * If the `addQuestionSeparator` flag is true, the query string is returned with a leading `?` character.
 *
 * @param uri The URL to extract the query string from.
 * @param addQuestionSeparator Whether to include the `?` character in the returned query string (default: true).
 * @returns The query string associated with the given URL.
 * @example
 * ```typescript
 * const url = 'https://example.com/path?a=1&b=2';
 * console.log(extractQueryString(url)); // Output: "?a=1&b=2"
 * console.log(extractQueryString(url, false)); // Output: "a=1&b=2"
 * ```
 */
export const extractQueryString = (
  uri?: string,
  addQuestionSeparator: boolean = true
): string => {
  if (typeof uri !== 'string') return '';
  let parse = parseURI(uri);
  uri = typeof parse.search === 'string' ? parse.search : '';
  if (addQuestionSeparator && uri) {
    return '?' + ltrim(uri, '?');
  } else {
    uri = rtrim(ltrim(uri.trim(), '?'), '?');
  }
  return uri;
};
/**
 * Returns the query parameters from a given URL as an object.
 *
 * This function takes a URL and an optional options object as input.
 * It extracts the query string from the URL using the `extractQueryString` function and then parses it into an object using the `queryString.parse` method.
 * The `queryString.parse` method is configured to allow sparse arrays and to merge the provided options with the default options.
 *
 * @param uri The URL to extract the query parameters from.
 * @param queryStringOpts Options for the `queryString.parse` method (default: {}).
 * @returns An object containing the query parameters.
 * @example
 * ```typescript
 * const url = 'https://example.com/path?a=1&b=2&c[]=3&c[]=4';
 * console.log(getQueryParams(url)); // Output: { a: '1', b: '2', c: [ '3', '4' ] }
 * ```
 */
export const getQueryParams = function (
  uri: string | null | undefined,
  queryStringOpts: IParseBaseOptions = {}
): IDict {
  if (typeof uri !== 'string') return {};
  return queryString.parse(extractQueryString(uri, false), {
    allowSparse: true,
    ...Object.assign({}, queryStringOpts),
  });
};

/**
 * Removes the query string from a given URL and returns the resulting URL.
 *
 * This function takes a URL and an optional flag as input.
 * It removes the query string and any fragment identifier from the URL using regular expressions.
 * If the `_decodeURIComponent` flag is true, the resulting URL is decoded using the `decodeURIComponent` function.
 *
 * @param uri The URL to remove the query string from.
 * @param _decodeURIComponent Whether to decode the resulting URL using `decodeURIComponent` (default: false).
 * @returns The URL with the query string removed.
 * @example
 * ```typescript
 * const url = 'https://example.com/path?a=1&b=2#fragment';
 * console.log(removeQueryString(url)); // Output: "https://example.com/path"
 * console.log(removeQueryString(url, true)); // Output: "https://example.com/path" (decoded)
 * ```
 */
export const removeQueryString = function (
  uri: string | undefined | null,
  _decodeURIComponent: boolean = false
): string {
  if (typeof uri !== 'string') return '';
  uri = uri.replace(/#.*$/, '').replace(/\?.*$/, '');
  if (_decodeURIComponent === true) {
    return decodeURIComponent(uri);
  }
  return uri;
};

const defaultStringifyOptions: IStringifyBaseOptions = {
  indices: true,
  encodeValuesOnly: false,
  skipNulls: false,
  arrayFormat: 'indices',
  encoder: (str: string) => {
    // Encode everything except [ and ]
    return encodeURIComponent(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
  },
};

/**
 * Adds query parameters to a given URL.
 *
 * This function takes a URL, a key-value pair or an object of key-value pairs, and optional options as input.
 * It removes any existing query string from the URL, merges the new query parameters with the existing ones, and then appends the resulting query string to the URL.
 *
 * @param url The URL to add query parameters to.
 * @param key A string key or an object of key-value pairs to add to the query string.
 * @param value The value associated with the key, only applicable when key is a string.
 * @param options Options for the `queryString.stringify` method (default: {}).
 * @returns The URL with the query parameters added.
 * @example
 * ```typescript
 * const url = 'https://example.com/path';
 * console.log(setQueryParams(url, 'a', 1)); // Output: "https://example.com/path?a=1"
 * console.log(setQueryParams(url, { a: 1, b: 2 })); // Output: "https://example.com/path?a=1&b=2"
 * ```
 */
export function setQueryParams(
  url: string | undefined | null,
  key: any,
  value?: any,
  options: IStringifyBaseOptions = {}
): string {
  if (typeof url !== 'string') return '';
  if (!url) url = '';
  let params = getQueryParams(url);
  // Preserve fragment
  const urlParts = url.split('#');
  const baseUrl = urlParts[0];
  const fragment = urlParts[1] ? '#' + urlParts[1] : '';

  url = removeQueryString(baseUrl);
  if (typeof key === 'object') {
    if (!key) key = {};
    options =
      typeof options == 'object' && options
        ? options
        : typeof value == 'object' && value
          ? value
          : {};
  } else if (typeof key == 'string') {
    key = { [key]: value };
  }
  if (typeof key == 'object' && key && !Array.isArray(key)) {
    Object.assign(params, key);
  }
  const queryStr = queryString.stringify(params, {
    ...defaultStringifyOptions,
    ...Object.assign({}, options),
  });

  return url + (queryStr ? '?' + queryStr : '') + fragment;
}

/**
 * Converts an object to a query string.
 *
 * This function takes an object and an optional flag as input.
 * It recursively iterates through the object's properties and converts them to a query string format.
 * If the `encodeURI` flag is true, the values are encoded using the `encodeURIComponent` function.
 *
 * @param o The object to convert to a query string.
 * @param encodeURI Whether to encode the values using `encodeURIComponent` (default: false).
 * @returns The object converted to a query string.
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2, c: { d: 3, e: 4 } };
 * console.log(objectToQueryString(obj)); // Output: "a=1&b=2&c[d]=3&c[e]=4"
 * console.log(objectToQueryString(obj, true)); // Output: "a=1&b=2&c%5Bd%5D=3&c%5Be%5D=4"
 * ```
 */
export function objectToQueryString(
  o: any,
  encodeURI: boolean = false
): string {
  if (o == null || typeof o !== 'object') return '';
  function iter(o: any, path: string) {
    if (Array.isArray(o)) {
      o.forEach(function (a) {
        iter(a, path + '[]');
      });
      return;
    }
    if (o !== null && typeof o === 'object') {
      Object.keys(o).forEach(function (k) {
        iter(o[k], path + '[' + k + ']');
      });
      return;
    }
    data.push(
      (encodeURI ? encodeURIComponent(path) : path) +
        '=' +
        (encodeURI ? encodeURIComponent(o) : o)
    );
  }

  const data: string[] = [];
  Object.keys(o).forEach(function (k) {
    iter(o[k], k);
  });
  return data.join('&');
}
/**
 * Parses a URI and returns the parsed object.
 *
 * This function takes a URI as input and returns an object containing the parsed components of the URI.
 * The object includes properties for the hash, host, hostname, href, origin, pathname, port, protocol, search, username, and password.
 *
 * @param uri The URI to parse.
 * @returns The parsed URI object.
 * @example
 * ```typescript
 * const uri = 'http://username:password@localhost:257/deploy/?asd=asd#asd';
 * console.log(parseURI(uri));
 * // Output:
 * // {
 * //   hash: "#asd",
 * //   host: "localhost:257",
 * //   hostname: "localhost",
 * //   href: "http://username:password@localhost:257/deploy/?asd=asd#asd",
 * //   origin: "http://username:password@localhost:257",
 * //   pathname: "/deploy/",
 * //   port: "257",
 * //   protocol: "http:",
 * //   search: "?asd=asd",
 * //   username: "username",
 * //   password: "password"
 * // }
 * ```
 */
export const parseURI = (
  uri: string | null | undefined
): {
  hash?: string; // URL hash
  host?: string;
  hostname?: string;
  href?: string;
  origin?: string;
  pathname?: string;
  port?: string;
  protocol?: string;
  search?: string;
  username?: string;
  password?: string;
} => {
  if (typeof uri !== 'string') return {};
  if (typeof URL !== 'undefined' && URL && isUrl(uri)) {
    try {
      return new URL(uri);
    } catch {
      // Fallback to regex parsing
    }
  }
  uri = isUriEncoded(uri) ? decodeURIComponent(uri) : uri;
  var m = uri.match(
    /^(([^:\/?#]+:)?(?:\/\/((?:([^\/?#:]*):([^\/?#:]*)@)?([^\/?#:]*)(?::([^\/?#:]*))?)))?([^?#]*)(\?[^#]*)?(#.*)?$/
  );
  let r = !m
    ? {}
    : {
        hash: m[10] || '', // #asd
        host: m[3] || '', // localhost:257
        hostname: m[6] || '', // localhost
        href: m[0] || '', // http://username:password@localhost:257/deploy/?asd=asd#asd
        origin: m[1] || '', // http://username:password@localhost:257
        pathname: m[8] || (m[1] ? '/' : ''), // /deploy/
        port: m[7] || '', // 257
        protocol: m[2] || '', // http:
        search: m[9] || '', // ?asd=asd
        username: m[4] || '', // username
        password: m[5] || '', // password
      };
  if (r.protocol && r.protocol.length == 2) {
    r.protocol = 'file:///' + r.protocol.toUpperCase();
    r.origin = r.protocol + '//' + r.host;
  }
  if (r.protocol) {
    r.href = r.origin + r.pathname + r.search + r.hash;
  }
  return r;
};

/**
 * Options for configuring URL validation behavior.
 *
 * @public
 */
export interface IsUrlOptions {
  /**
   * If true, only allows protocols that require a hostname (http, https, ftp, etc.).
   * If false, allows all valid protocols including mailto, tel, data, etc.
   *
   * @defaultValue true
   */
  requireHost?: boolean;

  /**
   * List of allowed protocols. If provided, only URLs with these protocols are considered valid.
   * Protocols should be specified without the trailing colon (e.g., 'http', not 'http:').
   *
   * @defaultValue undefined (all protocols allowed based on requireHost setting)
   *
   * @example
   * ```typescript
   * // Only allow HTTPS URLs
   * isUrl('https://example.com', { allowedProtocols: ['https'] }); // true
   * isUrl('http://example.com', { allowedProtocols: ['https'] }); // false
   * ```
   */
  allowedProtocols?: string[];
}

/**
 * Validates whether a given string is a valid, full URL.
 *
 * @remarks
 * This function uses a dual-approach validation strategy:
 * 1. First attempts to use the native URL constructor if available (modern environments)
 * 2. Falls back to a comprehensive regex pattern for environments without URL support
 *
 * By default, a valid full URL must include:
 * - A protocol (http, https, ftp, etc.)
 * - A domain/host (for protocols that require one)
 * - Optional path, query parameters, and hash fragments
 *
 * The function can be configured to:
 * - Accept only host-requiring protocols (default)
 * - Accept any valid URI including mailto:, tel:, data:, etc.
 * - Restrict to specific protocols only
 *
 * @param value - The string to test for URL validity
 * @param options - Optional configuration for validation behavior
 *
 * @returns `true` if the string is a valid full URL, `false` otherwise
 *
 * @example
 * Basic usage:
 * ```typescript
 * isUrl('https://example.com'); // true
 * isUrl('example.com'); // false (missing protocol)
 * isUrl('mailto:user@example.com'); // false (default requires host)
 * ```
 *
 * @example
 * Allow all valid URIs:
 * ```typescript
 * isUrl('mailto:user@example.com', { requireHost: false }); // true
 * isUrl('tel:+1234567890', { requireHost: false }); // true
 * isUrl('data:text/plain,hello', { requireHost: false }); // true
 * ```
 *
 * @example
 * Restrict to specific protocols:
 * ```typescript
 * isUrl('https://example.com', { allowedProtocols: ['https'] }); // true
 * isUrl('http://example.com', { allowedProtocols: ['https'] }); // false
 * ```
 *
 * @public
 */
export function isUrl(value: string, options: IsUrlOptions = {}): boolean {
  const { requireHost = true, allowedProtocols } = Object.assign({}, options);

  // Early return for non-string or empty values
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  // Trim whitespace for consistent validation
  const trimmedValue = value.trim();

  // Strategy 1: Try using native URL constructor (preferred method)
  if (typeof URL !== 'undefined' && URL) {
    try {
      const url = new URL(trimmedValue);
      // Ensure the URL has a valid protocol (scheme)
      // Valid protocols must end with ':' and not be empty
      if (!url.protocol || url.protocol === ':') {
        return false;
      }

      // Remove the trailing colon for comparison
      const protocol = url.protocol.slice(0, -1);

      // Check if protocol is in the allowed list (if specified)
      if (allowedProtocols && allowedProtocols.length > 0) {
        if (!allowedProtocols.includes(protocol)) {
          return false;
        }
      }

      // If requireHost is true, ensure protocols that need hosts have them
      if (requireHost) {
        // Protocols that require a hostname/host
        // Note: This is not exhaustive but covers common web protocols
        const protocolsRequiringHost = [
          'http',
          'https',
          'ftp',
          'ftps',
          'ws',
          'wss',
        ];

        if (protocolsRequiringHost.includes(protocol)) {
          // These protocols MUST have a hostname
          // Check for both empty hostname and empty string (URL constructor is inconsistent)
          if (
            !isNonNullString(url.hostname) ||
            !url.hostname.trim() ||
            !isNonNullString(url.host) ||
            !url.host.trim()
          ) {
            return false;
          }

          // CRITICAL: Validate against the original input string to catch malformed URLs
          // The URL constructor is too forgiving and interprets "https:///path" as "https://path/"
          // We need to ensure the original input has the correct format: protocol://hostname
          // Check that after the protocol, we have exactly two slashes followed by a valid host
          const protocolPrefix = `${protocol}://`;
          if (!trimmedValue.startsWith(protocolPrefix)) {
            return false;
          }

          // Extract what comes after protocol:// in the original string
          const afterProtocol = trimmedValue.slice(protocolPrefix.length);

          // Check for triple slash patterns like "https:///path" which are invalid
          // This happens when the original input has 3+ slashes after the protocol
          if (afterProtocol.startsWith('/')) {
            return false;
          }

          // Validate IPv4 addresses (URL constructor is too permissive)
          // Check if hostname looks like an IPv4 address
          const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
          const ipv4Match = url.hostname.match(ipv4Pattern);

          if (ipv4Match) {
            // Validate each octet is in range 0-255
            const octets = ipv4Match.slice(1, 5).map(Number);
            const isValidIPv4 = octets.every(
              (octet) => octet >= 0 && octet <= 255
            );

            if (!isValidIPv4) {
              return false;
            }
          }
        } else {
          // For non-web protocols, reject them when requireHost is true
          // This ensures we only accept traditional web URLs by default
          return false;
        }
      }
      return true;
    } catch {
      // URL constructor throws for invalid URLs
      return false;
    }
  }

  // Strategy 2: Fallback regex pattern for environments without URL support
  // This regex validates traditional web URLs with protocols that require hosts
  // Pattern breakdown:
  // - Protocol: required (e.g., http://, https://, ftp://)
  // - Domain: required with TLD or localhost or IP
  // - Port: optional (e.g., :8080)
  // - Path: optional (e.g., /path/to/resource)
  // - Query: optional (e.g., ?key=value)
  // - Fragment: optional (e.g., #section)

  if (requireHost) {
    // Strict regex for host-requiring protocols
    let protocolPattern = '[a-zA-Z][a-zA-Z\\d+\\-.]*';

    // If allowedProtocols is specified, create a pattern for those specific protocols
    if (allowedProtocols && allowedProtocols.length > 0) {
      protocolPattern = `(?:${allowedProtocols.join('|')})`;
    }

    const urlRegex = new RegExp(
      `^(${protocolPattern}):\/\/` + // Protocol
        '([a-zA-Z\\d-]+(\\.[a-zA-Z\\d-]+)*|' + // Domain with dots
        '\\[[0-9a-fA-F:]+\\]|' + // IPv6
        'localhost|' + // Localhost
        '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})' + // IPv4
        '(:\\d{1,5})?' + // Optional port
        '(\\/[^\\s]*)?$' // Optional path
    );

    return urlRegex.test(trimmedValue);
  } else {
    // More permissive regex that accepts various URI schemes
    // This will match: protocol:// OR protocol: (for schemes like mailto:, tel:)
    let protocolPattern = '[a-zA-Z][a-zA-Z\\d+\\-.]*';

    if (allowedProtocols && allowedProtocols.length > 0) {
      protocolPattern = `(?:${allowedProtocols.join('|')})`;
    }

    const uriRegex = new RegExp(`^(${protocolPattern}):.+$`);
    return uriRegex.test(trimmedValue);
  }
}

/**
 * Detects if a URL string has been encoded using encodeURIComponent.
 *
 * This function uses multiple heuristics to determine if a string has been
 * encoded with encodeURIComponent. It checks for:
 * 1. Presence of valid encoded character sequences (%XX where XX are hex digits)
 * 2. Whether decoding changes the string (indicating encoded content)
 * 3. Handles mixed encoded/unencoded content properly
 *
 * @param {any} str - The string to check for encoding
 * @returns {boolean} - Returns true if the string appears to be encoded, false otherwise
 *
 * @example
 * console.log(isUriEncoded('hello%20world')); // true
 * console.log(isUriEncoded('hello world')); // false
 * console.log(isUriEncoded('hello%2Bworld')); // true
 * console.log(isUriEncoded('hello+world')); // false
 * console.log(isUriEncoded('https%3A%2F%2Fexample.com')); // true
 * console.log(isUriEncoded('https://example.com')); // false
 * console.log(isUriEncoded('hello%20world%21normal')); // true (mixed)
 */
export const isUriEncoded = (str: any): boolean => {
  // Check if input is a valid string
  if (!isNonNullString(str)) return false;

  // Quick check: if no percent signs, definitely not encoded
  if (!str.includes('%')) return false;

  // Check for valid percent-encoded sequences (%XX where XX are hex digits)
  const percentEncodedRegex = /%[0-9A-Fa-f]{2}/g;
  const matches = str.match(percentEncodedRegex);

  // If no valid percent-encoded sequences found, not encoded
  if (!matches) return false;

  try {
    // Try to decode the string
    const decoded = decodeURIComponent(str);

    // If decoding changed the string, it contains encoded content
    if (decoded !== str) return true;

    // If decoding didn't change the string, check for double-encoding
    // (e.g., %2520 should decode to %20, then to space)
    try {
      const doubleDecoded = decodeURIComponent(decoded);
      if (doubleDecoded !== decoded) {
        return true; // Double-encoded content detected
      }
    } catch {
      // Double decode failed, but we have valid encoding, so it's encoded
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

/**
 * Options for configuring Data URL validation behavior.
 *
 * @public
 */
export interface IsDataUrlOptions {
  /**
   * List of allowed MIME types. If provided, only Data URLs with these MIME types are considered valid.
   * MIME types should be specified in lowercase (e.g., 'image/png', 'text/plain').
   *
   * @defaultValue undefined (all MIME types allowed)
   *
   * @example
   * ```typescript
   * // Only allow image Data URLs
   * isDataUrl('data:image/png;base64,ABC', { allowedMimeTypes: ['image/png', 'image/jpeg'] }); // true
   * isDataUrl('data:text/plain;base64,ABC', { allowedMimeTypes: ['image/png'] }); // false
   * ```
   */
  allowedMimeTypes?: string[];

  /**
   * If true, requires the Data URL to use base64 encoding.
   * If false, allows both base64 and URL-encoded data.
   *
   * @defaultValue false
   *
   * @example
   * ```typescript
   * isDataUrl('data:text/plain;base64,SGVsbG8=', { requireBase64: true }); // true
   * isDataUrl('data:text/plain,Hello', { requireBase64: true }); // false
   * ```
   */
  requireBase64?: boolean;

  /**
   * If true, validates that base64-encoded data appears to be valid base64.
   * Performs basic validation of base64 character set and padding.
   *
   * @defaultValue false
   *
   * @example
   * ```typescript
   * isDataUrl('data:text/plain;base64,SGVsbG8=', { validateBase64: true }); // true
   * isDataUrl('data:text/plain;base64,!!!invalid', { validateBase64: true }); // false
   * ```
   */
  validateBase64?: boolean;
}

/**
 * Validates whether a given string is a valid Data URL (RFC 2897).
 *
 * @remarks
 * Data URLs allow embedding small files inline in documents using the format:
 * `data:[<mediatype>][;base64],<data>`
 *
 * This function validates:
 * - Proper data: protocol prefix
 * - Valid MIME type format (if present)
 * - Proper encoding declaration (base64 or URL-encoded)
 * - Data payload presence
 *
 * Components of a Data URL:
 * - Protocol: Always "data:"
 * - Media type (optional): MIME type like "text/plain" or "image/png" (defaults to "text/plain;charset=US-ASCII")
 * - Encoding (optional): ";base64" for base64 encoding (defaults to URL encoding)
 * - Data: The actual content after the comma
 *
 * The function uses a dual-approach validation strategy:
 * 1. First attempts to use the native URL constructor if available (modern environments)
 * 2. Falls back to a comprehensive regex pattern for environments without URL support
 *
 * @param value - The string to test for Data URL validity
 * @param options - Optional configuration for validation behavior
 *
 * @returns `true` if the string is a valid Data URL, `false` otherwise
 *
 * @example
 * Basic usage:
 * ```typescript
 * isDataUrl('data:text/plain,Hello%20World'); // true
 * isDataUrl('data:text/plain;base64,SGVsbG8gV29ybGQ='); // true
 * isDataUrl('data:image/png;base64,iVBORw0KG...'); // true
 * isDataUrl('not a data url'); // false
 * ```
 *
 * @example
 * With MIME type filtering:
 * ```typescript
 * isDataUrl('data:image/png;base64,ABC', { allowedMimeTypes: ['image/png'] }); // true
 * isDataUrl('data:text/plain,Hello', { allowedMimeTypes: ['image/png'] }); // false
 * ```
 *
 * @example
 * Require base64 encoding:
 * ```typescript
 * isDataUrl('data:text/plain;base64,SGVsbG8=', { requireBase64: true }); // true
 * isDataUrl('data:text/plain,Hello', { requireBase64: true }); // false
 * ```
 *
 * @public
 */
export function isDataUrl(
  value: string,
  options: IsDataUrlOptions = {}
): boolean {
  const {
    allowedMimeTypes,
    requireBase64 = false,
    validateBase64 = false,
  } = Object.assign({}, options);

  // Early return for non-string or empty values
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  // Trim whitespace for consistent validation
  const trimmedValue = value.trim();

  // Data URLs must start with "data:"
  if (!trimmedValue.toLowerCase().startsWith('data:')) {
    return false;
  }

  // Strategy 1: Try using native URL constructor (preferred method)
  if (typeof URL !== 'undefined') {
    try {
      const url = new URL(trimmedValue);

      // Verify protocol is exactly "data:"
      if (url.protocol !== 'data:') {
        return false;
      }

      // Parse the Data URL manually since URL API doesn't provide structured access
      // Format: data:[<mediatype>][;base64],<data>
      const dataUrlPattern = /^data:([^,;]*)(;[^,]*)?,(.*)$/i;
      const match = trimmedValue.match(dataUrlPattern);

      if (!match) {
        return false;
      }

      const [, mimeType, encodingPart, data] = match;

      // Validate data is present (after the comma)
      if (data === undefined || data.length === 0) {
        return false;
      }

      // Parse MIME type (defaults to text/plain;charset=US-ASCII if empty)
      const normalizedMimeType = (mimeType || 'text/plain')
        .trim()
        .toLowerCase();

      // Validate MIME type format: type/subtype
      // MIME type can be empty (defaults to text/plain), or must match pattern
      if (mimeType && mimeType.trim() !== '') {
        const mimeTypePattern = /^[a-z]+\/[a-z0-9][a-z0-9\-+.]*$/i;
        if (!mimeTypePattern.test(normalizedMimeType)) {
          return false;
        }
      }

      // Check if MIME type is in allowed list
      if (allowedMimeTypes && allowedMimeTypes.length > 0) {
        const isAllowed = allowedMimeTypes.some(
          (allowed) => allowed.toLowerCase() === normalizedMimeType
        );
        if (!isAllowed) {
          return false;
        }
      }

      // Check encoding
      const isBase64 = encodingPart?.toLowerCase().includes('base64') || false;

      // If base64 is required but not present, reject
      if (requireBase64 && !isBase64) {
        return false;
      }

      // Validate base64 data if requested
      if (validateBase64 && isBase64) {
        // Base64 character set: A-Z, a-z, 0-9, +, /, and = for padding
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;

        if (!base64Pattern.test(data)) {
          return false;
        }

        // Additional validation: base64 length should be multiple of 4 (with padding)
        if (data.length % 4 !== 0) {
          return false;
        }

        // Padding validation: only last 2 characters can be '='
        const paddingMatch = data.match(/=+$/);
        if (paddingMatch && paddingMatch[0].length > 2) {
          return false;
        }

        // If there's padding, ensure proper placement
        if (data.includes('=')) {
          const paddingIndex = data.indexOf('=');
          const afterPadding = data.slice(paddingIndex);
          if (!/^=+$/.test(afterPadding)) {
            return false; // Invalid: non-padding characters after padding
          }
        }
      }

      return true;
    } catch {
      // URL constructor throws for invalid URLs
      return false;
    }
  }

  // Strategy 2: Fallback regex pattern for environments without URL support
  // Data URL format: data:[<mediatype>][;charset=<charset>][;base64],<data>
  // Breaking down the pattern:
  // - data: - literal protocol
  // - ([^,;]*) - optional MIME type (anything except comma or semicolon)
  // - (;[^,]*)? - optional parameters like ;base64 or ;charset=...
  // - , - literal comma separator
  // - (.+) - the actual data (must not be empty)
  const dataUrlPattern = /^data:([^,;]*)(;[^,]*)?,(.+)$/i;
  const match = trimmedValue.match(dataUrlPattern);

  if (!match) {
    return false;
  }

  const [, mimeType, encodingPart, data] = match;

  // Validate MIME type format if present
  const normalizedMimeType = (mimeType || 'text/plain').trim().toLowerCase();

  if (mimeType && mimeType.trim() !== '') {
    const mimeTypePattern = /^[a-z]+\/[a-z0-9][a-z0-9\-+.]*$/i;
    if (!mimeTypePattern.test(normalizedMimeType)) {
      return false;
    }
  }

  // Check if MIME type is in allowed list
  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const isAllowed = allowedMimeTypes.some(
      (allowed) => allowed.toLowerCase() === normalizedMimeType
    );
    if (!isAllowed) {
      return false;
    }
  }

  // Check encoding
  const isBase64 = encodingPart?.toLowerCase().includes('base64') || false;

  // If base64 is required but not present, reject
  if (requireBase64 && !isBase64) {
    return false;
  }

  // Validate base64 data if requested
  if (validateBase64 && isBase64) {
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;

    if (!base64Pattern.test(data)) {
      return false;
    }

    if (data.length % 4 !== 0) {
      return false;
    }

    const paddingMatch = data.match(/=+$/);
    if (paddingMatch && paddingMatch[0].length > 2) {
      return false;
    }

    if (data.includes('=')) {
      const paddingIndex = data.indexOf('=');
      const afterPadding = data.slice(paddingIndex);
      if (!/^=+$/.test(afterPadding)) {
        return false;
      }
    }
  }

  return true;
}
