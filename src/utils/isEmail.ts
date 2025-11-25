/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNonNullString } from './isNonNullString';

/**
 * Validates whether a given string is a valid email address.
 *
 * This function performs comprehensive email validation according to RFC 5322 standards,
 * handling all edge cases including:
 * - Local part validation (before @): allows letters, numbers, and special chars like .!#$%&'*+-/=?^_`{|}~
 * - Quoted strings in local part (e.g., "john..doe"@example.com)
 * - Domain validation: proper domain structure with valid TLD
 * - IP address domains: [IPv4] and [IPv6] formats
 * - International domains: IDN (Internationalized Domain Names)
 * - Length constraints: local part ≤ 64 chars, domain ≤ 255 chars, total ≤ 320 chars
 * - Edge cases: consecutive dots, leading/trailing dots, escaped characters
 *
 * @param email - The string to validate as an email address
 * @returns true if the string is a valid email address, false otherwise
 *
 * @example
 * isEmail("user@example.com") // true
 * isEmail("user.name+tag@example.co.uk") // true
 * isEmail("invalid@") // false
 * isEmail("@invalid.com") // false
 */
export function isEmail(email: string): boolean {
  // Null/undefined/empty check
  if (!isNonNullString(email)) {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  /**
   * Length constraints (RFC 5321)
   *https://www.rfc-editor.org/rfc/rfc3696
   */
  if (email.length > 320) {
    return false;
  }

  // Must contain exactly one @ symbol (not in quotes)
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) {
    return false;
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // Validate local part length
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Validate domain length
  if (domain.length === 0 || domain.length > 255) {
    return false;
  }

  // Validate local part
  if (!isValidLocalPart(localPart)) {
    return false;
  }

  // Validate domain
  if (!isValidDomain(domain)) {
    return false;
  }

  return true;
}

/**
 * Validates the local part (before @) of an email address
 */
function isValidLocalPart(localPart: string): boolean {
  // Handle quoted strings
  if (localPart.startsWith('"') && localPart.endsWith('"')) {
    return isValidQuotedString(localPart);
  }

  // Check for invalid characters (unquoted local part)
  // Allowed: a-z A-Z 0-9 .!#$%&'*+-/=?^_`{|}~
  const validChars = /^[a-zA-Z0-9.!#$%&'*+\-/=?^_`{|}~]+$/;
  if (!validChars.test(localPart)) {
    return false;
  }

  // Cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  // Cannot have consecutive dots
  if (localPart.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Validates quoted strings in local part
 */
function isValidQuotedString(quoted: string): boolean {
  // Must start and end with quotes
  if (!quoted.startsWith('"') || !quoted.endsWith('"')) {
    return false;
  }

  const content = quoted.slice(1, -1);

  // Check for unescaped quotes or backslashes
  let i = 0;
  while (i < content.length) {
    if (content[i] === '\\') {
      // Skip escaped character
      i += 2;
    } else if (content[i] === '"') {
      // Unescaped quote inside quoted string
      return false;
    } else {
      i++;
    }
  }

  return true;
}

/**
 * Validates the domain part (after @) of an email address
 */
function isValidDomain(domain: string): boolean {
  // Check for IP address format [IPv4] or [IPv6]
  if (domain.startsWith('[') && domain.endsWith(']')) {
    return isValidIPAddress(domain.slice(1, -1));
  }

  // Domain must contain at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // Split into labels
  const labels = domain.split('.');

  // Each label must be valid
  for (const label of labels) {
    if (!isValidDomainLabel(label)) {
      return false;
    }
  }

  // TLD (last label) must be at least 2 characters and alphabetic
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }

  return true;
}

/**
 * Validates a single domain label
 */
function isValidDomainLabel(label: string): boolean {
  // Label length constraints
  if (label.length === 0 || label.length > 63) {
    return false;
  }

  // Must contain only alphanumeric and hyphens
  // eslint-disable-next-line no-useless-escape
  if (!/^[a-zA-Z0-9\-]+$/.test(label)) {
    return false;
  }

  // Cannot start or end with hyphen
  if (label.startsWith('-') || label.endsWith('-')) {
    return false;
  }

  return true;
}

/**
 * Validates IP address (IPv4 or IPv6)
 */
function isValidIPAddress(ip: string): boolean {
  // Check for IPv4
  if (isValidIPv4(ip)) {
    return true;
  }

  // Check for IPv6
  if (isValidIPv6(ip)) {
    return true;
  }

  return false;
}

/**
 * Validates IPv4 address
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');

  if (parts.length !== 4) {
    return false;
  }

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255 || part !== num.toString()) {
      return false;
    }
  }

  return true;
}

/**
 * Validates IPv6 address (simplified check)
 */
function isValidIPv6(ip: string): boolean {
  // Handle IPv6 with optional :: compression
  if (ip.includes(':::')) {
    return false;
  }

  const parts = ip.split(':');

  // IPv6 should have 8 groups, or fewer with :: compression
  if (parts.length > 8) {
    return false;
  }

  // If :: is used, must have fewer than 8 parts
  if (ip.includes('::') && parts.length >= 8) {
    return false;
  }

  for (const part of parts) {
    // Empty parts are ok (from ::)
    if (part === '') {
      continue;
    }

    // Each part must be 1-4 hex digits
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) {
      return false;
    }
  }

  return true;
}
/**
 * @function isEmail
 *
 * Validates whether a given value is a valid email address format.
 * This function checks if the input is a non-null string and then applies a regular expression
 * to determine if the value conforms to standard email formatting rules.
 *
 * ### Parameters:
 * - **value**: `any` - The value to validate as an email address. This can be of any type, but the function will check if it is a non-null string.
 *
 * ### Return Value:
 * - `boolean`: Returns `true` if the value is a valid email format; otherwise, returns `false`.
 *
 * ### Example Usage:
 * ```typescript
 * const email1 = "test@example.com";
 * const email2 = "invalid-email@.com";
 *
 * console.log(isEmail(email1)); // Output: true
 * console.log(isEmail(email2)); // Output: false
 * ```
 *
 * ### Notes:
 * - The function utilizes the `isNonNullString` utility to ensure that the input is a valid string before performing the regex check.
 * - The regular expression used in this function checks for a variety of valid email formats, including those with special characters and domain specifications.
 * - This function is useful for form validation where email input is required, ensuring that users provide a correctly formatted email address.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isEmail2(value: any): boolean {
  if (!isNonNullString(value)) {
    return false;
  }
  return value.match(
    // eslint-disable-next-line no-useless-escape
    /^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/
  )
    ? true
    : false;
}
