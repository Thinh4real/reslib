import { defaultStr } from '@utils/defaultStr';
import { isEmpty } from '@utils/isEmpty';
import { isNonNullString } from '@utils/isNonNullString';
import { isNumber } from '@utils/isNumber';
import type {
  ValidatorResult,
  ValidatorRuleParams,
  ValidatorRuleParamTypes,
  ValidatorValidateOptions,
} from '../types';
import { Validator } from '../validator';
import { toNumber } from './utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

/**
 * @decorator  MinLength
 *
 * Validator rule that checks if a given string meets a minimum length requirement.
 * This rule ensures that the input string has at least the specified number of characters.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The string value to validate.
 *   - `ruleParams`: An array where the first element specifies the minimum length required.
 *
 * ### Return Value:
 * - `boolean | string`: Returns `true` if the value is empty or meets the minimum length requirement;
 *   otherwise, returns an error message indicating that the minimum length is not met.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @MinLength(3) //"This field must have a minimum of 3 characters"
 *     myString: string;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input meets a minimum length requirement.
 * - The error message can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `isEmpty` utility function is used to check for empty values, which may include `null`, `undefined`, or empty strings.
 */
export const MinLength = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MinLength']
>(function minLength(options: ValidatorValidateOptions) {
  let { value, ruleParams, i18n } = options;
  ruleParams = Array.isArray(ruleParams) ? ruleParams : [];
  const mLength = parseFloat(ruleParams[0]) || 0;
  const message = i18n.t('validator.minLength', {
    ...options,
    minLength: mLength,
  });
  return (
    isEmpty(value) ||
    (value && typeof value === 'string' && String(value).length >= mLength) ||
    message
  );
});

/**
 * @decorator  MaxLength
 * 
 * Validator rule that checks if a given string does not exceed a maximum length.
 * This rule ensures that the input string has at most the specified number of characters.
 * 
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The string value to validate.
 *   - `ruleParams`: An array where the first element specifies the maximum length allowed.
 * 
 * ### Return Value:
 * - `boolean | string`: Returns `true` if the value is empty or meets the maximum length requirement; 
 *   otherwise, returns an error message indicating that the maximum length is exceeded.
 * 
 * ### Example Usage:
 * ```typescript
    import {  MaxLength } from 'reslib';
    class MyClass {
        @MaxLength(10)
        myProperty: string;
    }
 * ```
 * 
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input does not exceed a specified length.
 * - The error message can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `isEmpty` utility function is used to check for empty values, which may include `null`, `undefined`, or empty strings.
 */
export const MaxLength = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MaxLength']
>(function maxLength(options: ValidatorValidateOptions) {
  let { value, ruleParams, i18n } = options;
  ruleParams = Array.isArray(ruleParams) ? ruleParams : [];
  const mLength = parseFloat(ruleParams[0]) || 0;
  const message = i18n.t('validator.maxLength', {
    ...options,
    maxLength: mLength,
  });
  return (
    isEmpty(value) ||
    (value && typeof value === 'string' && String(value).length <= mLength) ||
    message
  );
});

/**
 * ### IsNonNullString Decorator
 *
 * Validates that a property value is a non-null, non-empty string. This
 * decorator is stricter than IsRequired as it also ensures the value is
 * a string with actual content (not just whitespace).
 *
 * @example
 * ```typescript
 * class Article {
 *   @IsNonNullString()
 *   title: string;
 *
 *   @IsNonNullString()
 *   content: string;
 *
 *   @IsNonNullString()
 *   author: string;
 * }
 *
 * // Valid data
 * const article = {
 *   title: "How to Validate Data",
 *   content: "This article explains validation...",
 *   author: "John Doe"
 * };
 *
 * // Invalid data
 * const invalid = {
 *   title: "",           // Empty string
 *   content: "   ",      // Only whitespace
 *   author: null         // Null value
 * };
 * ```
 *
 * @decorator
 *
 * @see {@link IsRequired} - Less strict alternative
 * @public
 */
export const IsNonNullString = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NonNullString']
>(function NonNullString(options) {
  const { value, i18n } = options;
  return isNonNullString(value) || i18n.t('validator.isNonNullString', options);
}, 'NonNullString');

/**
 * @decorator  Length
 *
 * Validator rule that validates the length of a string. This rule checks if the length of the input string
 * falls within a specified range or matches a specific length.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The string value to validate.
 *   - `ruleParams`: An array where:
 *     - The first element specifies the minimum length (optional).
 *     - The second element specifies the maximum length (optional).
 *
 * ### Return Value:
 * - `boolean | string`: Returns `true` if the string length is valid according to the specified rules;
 *   otherwise, returns an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 *
 * class MyClass {
 *     @Length(3, 10) //"This field must be between 3 and 10 characters long"
 *     myString: string;
 * }
 *
 * class MyClass {
 *     @Length(4) //"This field must be exactly 4 characters long"
 *     myString: string;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input meets specific length requirements.
 * - The error messages can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `defaultStr` utility function is used to ensure that the value is treated as a string, even if it is `null` or `undefined`.
 */
export const Length = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Length']
>(function stringLength({ value, ruleParams, i18n }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ruleParams as any) = Array.isArray(ruleParams) ? ruleParams : [];
  value = defaultStr(value);
  const minLength = toNumber(ruleParams[0]);
  const maxLength = toNumber(ruleParams[1]);
  const i18nParams = { value, minLength, maxLength, length: minLength };
  const message =
    isNumber(minLength) && isNumber(maxLength)
      ? i18n.t('validator.lengthRange', i18nParams)
      : i18n.t('validator.length', i18nParams);
  if (isNumber(minLength) && isNumber(maxLength)) {
    return (value.length >= minLength && value.length <= maxLength) || message;
  }
  if (isNumber(minLength)) {
    ///on valide la longueur
    return String(value).trim().length == minLength || message;
  }
  return true;
});

/**
 * ### EndsWithOneOf Rule
 *
 * Validates that the field under validation ends with one of the given values.
 *
 * #### Parameters
 * - List of values that the field must end with
 *
 * @example
 * ```typescript
 * // Class validation
 * class FileUpload {
 *   @EndsWithOneOf('jpg', 'png', 'gif', 'webp')
 *   imageFile: string;
 *
 *   @EndsWithOneOf('.com', '.org', '.net')
 *   websiteUrl: string;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array of valid ending values
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const EndsWithOneOf = Validator.buildRuleDecorator<(string | number)[]>(
  function _EndsWith({
    value,
    ruleParams,
    fieldName,
    translatedPropertyName,
    i18n,
    ...rest
  }): ValidatorResult {
    return new Promise((resolve, reject) => {
      if (typeof value !== 'string') {
        const message = i18n.t('validator.endsWithOneOf', {
          field: translatedPropertyName || fieldName,
          value,
          endings: ruleParams?.join(', ') || '',
          ...rest,
        });
        return reject(message);
      }

      if (!ruleParams || ruleParams.length === 0) {
        const message = i18n.t('validator.invalidRuleParams', {
          rule: 'EndsWithOneOf',
          field: translatedPropertyName || fieldName,
          ruleParams,
          ...rest,
        });
        return reject(message);
      }
      const endsWithAny = ruleParams.some(
        (ending) => isNonNullString(ending) && value.endsWith(ending)
      );
      if (endsWithAny) {
        resolve(true);
      } else {
        const message = i18n.t('validator.endsWithOneOf', {
          field: translatedPropertyName || fieldName,
          value,
          endings: ruleParams.join(', '),
          ...rest,
        });
        reject(message);
      }
    });
  }
);

/**
 * ### StartsWithOneOf Decorator
 *
 * Validates that a string field starts with one of the specified prefixes.
 * This decorator is useful for validating URLs, file paths, identifiers, or any string
 * that must begin with specific patterns.
 *
 * ### Purpose
 * Ensures that the input string begins with at least one of the provided prefix values.
 * Common use cases include:
 * - Validating URLs that must start with 'http://' or 'https://'
 * - Checking file paths that must start with specific directories
 * - Validating identifiers that must have specific prefixes (e.g., 'USER_', 'ADMIN_')
 * - Ensuring configuration values follow naming conventions
 *
 * ### Parameters
 * The decorator accepts a variable number of string prefixes that the field value must start with.
 * At least one prefix must be provided.
 *
 * ### Validation Logic
 * 1. **Type Check**: Ensures the value is a string
 * 2. **Parameter Validation**: Verifies that prefixes are provided
 * 3. **Prefix Matching**: Checks if the value starts with any of the specified prefixes
 * 4. **Result**: Passes if any prefix matches, fails otherwise
 *
 * ### Return Behavior
 * - **Success**: Resolves with `true` if validation passes
 * - **Failure**: Rejects with localized error message if validation fails
 * - **Type Error**: Rejects if value is not a string
 * - **Parameter Error**: Rejects if no prefixes are provided
 *
 * ### Examples
 *
 * #### Basic URL Validation
 * ```typescript
 * class ApiConfig {
 *   @StartsWithOneOf('http://', 'https://')
 *   baseUrl: string;
 * }
 *
 * // Valid: 'https://api.example.com'
 * // Valid: 'http://localhost:3000'
 * // Invalid: 'ftp://files.example.com'
 * ```
 *
 * #### Identifier Prefix Validation
 * ```typescript
 * class User {
 *   @StartsWithOneOf('USER_', 'ADMIN_', 'MOD_')
 *   userId: string;
 * }
 *
 * // Valid: 'USER_12345'
 * // Valid: 'ADMIN_67890'
 * // Invalid: 'GUEST_11111'
 * ```
 *
 * #### File Path Validation
 * ```typescript
 * class FileUpload {
 *   @StartsWithOneOf('/uploads/', '/temp/', '/cache/')
 *   filePath: string;
 * }
 *
 * // Valid: '/uploads/avatar.jpg'
 * // Valid: '/temp/session.tmp'
 * // Invalid: '/downloads/file.zip'
 * ```
 *
 * ### Error Messages
 * Uses i18n translations for error messages:
 * - `validator.startsWithOneOf`: When value doesn't start with any prefix
 * - `validator.invalidRuleParams`: When no prefixes are provided
 *
 * ### Type Safety
 * - Strongly typed with TypeScript generics
 * - Parameter types enforced at compile time
 * - Runtime type checking for string values
 *
 * ### Performance Notes
 * - Uses `Array.some()` for early termination on first match
 * - Efficient string prefix checking with native `startsWith()`
 * - Minimal memory allocation
 *
 * ### Related Decorators
 * - {@link EndsWithOneOf}: Validates string endings
 * - {@link IsString}: Validates string type
 * - {@link MinLength}: Validates minimum length
 *
 * @decorator
 * @public
 */
export const StartsWithOneOf = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['StartsWithOneOf']
>(function _StartsWith({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<string[]>): ValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== 'string') {
      const message = i18n.t('validator.startsWithOneOf', {
        field: translatedPropertyName || fieldName,
        value,
        prefixes: ruleParams?.join(', ') || '',
        ...rest,
      });
      return reject(message);
    }
    if (!ruleParams || ruleParams.length === 0) {
      const message = i18n.t('validator.invalidRuleParams', {
        rule: 'StartsWithOneOf',
        field: translatedPropertyName || fieldName,
        ...rest,
        ruleParams,
      });
      return reject(message);
    }

    const startsWithAny = ruleParams.some(
      (prefix) => isNonNullString(prefix) && value.startsWith(prefix)
    );

    if (startsWithAny) {
      resolve(true);
    } else {
      const message = i18n.t('validator.startsWithOneOf', {
        field: translatedPropertyName || fieldName,
        value,
        prefixes: ruleParams.join(', '),
        ...rest,
      });
      reject(message);
    }
  });
});

/**
 * ### IsString Rule
 *
 * Validates that the field under validation is a string. If you would like to
 * allow the field to also be null, you should assign the nullable rule to the field.
 *
 * @example
 * ```typescript
 * // Class validation
 * class TextContent {
 *   @IsRequired()
 *   @IsString()
 *   title: String;
 *
 *   @IsString()
 *   description?: String | null;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsString = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['String']
>(function _String({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  return typeof value === 'string'
    ? true
    : i18n.t('validator.string', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
}, 'String');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### String Rule
     *
     * Validates that the field under validation is a string. If you would like to
     * allow the field to also be null, you should assign the nullable rule to the field.
     *
     * @example
     * ```typescript
     * // Valid String values
     * await Validator.validate({
     *   value: 'Hello World',
     *   rules: ['String']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '',
     *   rules: ['String']
     * }); // ✓ Valid (empty String)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 123,
     *   rules: ['String']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['String']
     * }); // ✗ Invalid (use nullable for null support)
     *
     * // With nullable support
     * await Validator.validate({
     *   value: null,
     *   rules: ['nullable', 'String']
     * }); // ✓ Valid
     *
     * // Class validation
     * class TextContent {
     *   @Required
     *   @String()
     *   title: String;
     *
     *   @String()
     *   description?: String | null;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    String: ValidatorRuleParams<[]>;

    /**
     * ### StartsWithOneOf Rule
     *
     * Validates that the field under validation starts with one of the given values.
     *
     * #### Parameters
     * - List of values that the field must start with
     *
     * @example
     * ```typescript
     * // Valid beginnings
     * await Validator.validate({
     *   value: 'https://example.com',
     *   rules: [{StartsWithOneOf:"http://","https://"}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'USER_12345',
     *   rules: [{StartsWithOneOf:"USER_","ADMIN_"}]
     * }); // ✓ Valid
     *
     * // Invalid example
     * await Validator.validate({
     *   value: 'ftp://example.com',
     *   rules: [{StartsWithOneOf:"http://","https://"}]
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Configuration {
     *   @StartsWithOneOf('http://', 'https://')
     *   apiUrl: string;
     *
     *   @StartsWithOneOf('prod_', 'dev_', 'test_')
     *   environment: string;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array of valid starting values
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    StartsWithOneOf: ValidatorRuleParams<string[]>;

    /**
     * ### Ends With Rule
     *
     * Validates that the field under validation ends with one of the given values.
     *
     * #### Parameters
     * - List of values that the field must end with
     *
     * @example
     * ```typescript
     * // Valid endings
     * await Validator.validate({
     *   value: 'profile.jpg',
     *   rules: [{EndsWithOneOf:["jpg","png","gif"]}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'document.pdf',
     *   rules: [{EndsWithOneOf:["pdf","doc","docx"]}]
     * }); // ✓ Valid
     *
     * // Invalid example
     * await Validator.validate({
     *   value: 'image.txt',
     *   rules: [{EndsWithOneOf:["jpg","png","gif"]}]
     * }); // ✗ Invalid
     *
     * // Class validation
     * class FileUpload {
     *   @EndsWithOneOf("jpg", "png", "gif", "webp")
     *   imageFile: string;
     *
     *   @EndsWithOneOf(".com", ".org", ".net")
     *   websiteUrl: string;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array of valid ending values
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    EndsWithOneOf: ValidatorRuleParams<string[]>;

    /**
     * ### Length Rule
     *
     * Validates that the field under validation has a string length that meets
     * the specified criteria. Supports both exact length matching and range validation.
     *
     * #### Parameters
     * - `lengthOrMinLength`: Required number - If only one parameter, exact length required.
     *   If two parameters provided, this is the minimum length.
     * - `maxLength`: Optional number - Maximum length when range validation is used.
     *
     * #### Validation Modes
     * 1. **Exact Length**: `@Length(5)` - String must be exactly 5 characters
     * 2. **Range Validation**: `@Length(3, 10)` - String must be 3-10 characters
     *
     * @example
     * ```typescript
     * // Exact length validation
     * await Validator.validate({
     *   value: 'Hello',
     *   rules: [{Length: [5]}]
     * }); // ✓ Valid (exactly 5 characters)
     *
     * await Validator.validate({
     *   value: 'Hi',
     *   rules: [{Length: [5]}]
     * }); // ✗ Invalid (only 2 characters)
     *
     * // Range validation
     * await Validator.validate({
     *   value: 'Hello World',
     *   rules: [{Length: [5, 15]}]
     * }); // ✓ Valid (10 characters, within 5-15 range)
     *
     * await Validator.validate({
     *   value: 'This is a very long string that exceeds the maximum',
     *   rules: [{Length: [5, 15]}]
     * }); // ✗ Invalid (too long)
     *
     * // Class validation
     * class User {
     *   @Length(8, 20)      // Username: 8-20 characters
     *   username: string;
     *
     *   @Length(4)          // PIN: exactly 4 digits
     *   pinCode: string;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array with [lengthOrMinLength, maxLength?]
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    Length: ValidatorRuleParams<
      [lengthOrMinLength: number, maxLength?: number]
    >;

    /**
     * Validator rule that checks if a string meets a minimum length requirement.
     */
    MinLength: ValidatorRuleParams<[minLength: number]>;

    /**
     * Validator rule that checks if a string does not exceed a maximum length.
     */
    MaxLength: ValidatorRuleParams<[maxLength: number]>;

    /**
     * Validator rule that checks if a value is a non-null string.
     */
    NonNullString: ValidatorRuleParams<[]>;
  }
}
