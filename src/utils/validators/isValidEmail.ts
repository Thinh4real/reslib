import isEmail, { IsEmailOptions } from "validator/lib/isEmail";
import { isNonNullString } from "../isNonNullString";
/**
 * @function isValidEmail
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
 * console.log(isValidEmail(email1)); // Output: true
 * console.log(isValidEmail(email2)); // Output: false
 * ```
 *
 * ### Notes:
 * - The function utilizes the `isNonNullString` utility to ensure that the input is a valid string before performing the regex check.
 * - The regular expression used in this function checks for a variety of valid email formats, including those with special characters and domain specifications.
 * - This function is useful for form validation where email input is required, ensuring that users provide a correctly formatted email address.
 */
export function isValidEmail(value: any, options?: IsEmailOptions): boolean {
  if (!isNonNullString(value)) {
    return false;
  }
  return isEmail(value, options);
}
