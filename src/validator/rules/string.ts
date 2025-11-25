import { defaultStr } from '@utils/defaultStr';
import { isEmpty } from '@utils/isEmpty';
import { isNonNullString } from '@utils/isNonNullString';
import { isNumber } from '@utils/isNumber';
import { IValidatorResult, IValidatorValidateOptions } from '../types';
import { Validator } from '../validator';
import { toNumber } from './utils';

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
 *   @IsNonNullString
 *   title: string;
 *
 *   @IsNonNullString
 *   content: string;
 *
 *   @IsNonNullString
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
export const IsNonNullString = Validator.buildPropertyDecorator([
  'NonNullString',
]);

function stringLength({ value, ruleParams, i18n }: IValidatorValidateOptions) {
  ruleParams = Array.isArray(ruleParams) ? ruleParams : [];
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
}
Validator.registerRule('Length', stringLength);

function minLength(options: IValidatorValidateOptions) {
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
}
Validator.registerRule('MinLength', minLength);

/**
 * @decorator  MinLength
 *
 * Validator rule that checks if a given string meets a minimum length requirement.
 * This rule ensures that the input string has at least the specified number of characters.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
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
 *     @ MinLength([3]) //"This field must have a minimum of 3 characters"
 *     myString: string;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input meets a minimum length requirement.
 * - The error message can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `isEmpty` utility function is used to check for empty values, which may include `null`, `undefined`, or empty strings.
 */
export const MinLength =
  Validator.buildRuleDecorator<[minLength: number]>(minLength);

function maxLength(options: IValidatorValidateOptions) {
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
}
Validator.registerRule('MaxLength', maxLength);

/**
 * @decorator  MaxLength
 * 
 * Validator rule that checks if a given string does not exceed a maximum length.
 * This rule ensures that the input string has at most the specified number of characters.
 * 
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
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
        @ MaxLength([10])
        myProperty: string;
    }
 * ```
 * 
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input does not exceed a specified length.
 * - The error message can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `isEmpty` utility function is used to check for empty values, which may include `null`, `undefined`, or empty strings.
 */
export const MaxLength =
  Validator.buildRuleDecorator<[maxLength: number]>(maxLength);

Validator.registerRule('NonNullString', function NonNullString(options) {
  const { value, i18n } = options;
  return isNonNullString(value) || i18n.t('validator.isNonNullString', options);
});

/**
 * @decorator  Length
 *
 * Validator rule that validates the length of a string. This rule checks if the length of the input string
 * falls within a specified range or matches a specific length.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
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
 *     @ Length([3, 10]) //"This field must be between 3 and 10 characters long"
 *     myString: string;
 * }
 *
 * class MyClass {
 *     @ Length([4]) //"This field must be exactly 4 characters long"
 *     myString: string;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for validating user input in forms, ensuring that the input meets specific length requirements.
 * - The error messages can be customized based on the parameters provided, allowing for clear feedback to users.
 * - The `defaultStr` utility function is used to ensure that the value is treated as a string, even if it is `null` or `undefined`.
 */
export const Length =
  Validator.buildRuleDecorator<[minOrLength: number, maxLength?: number]>(
    stringLength
  );

function _EndsWith({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions<string[]>): IValidatorResult {
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
Validator.registerRule('EndsWithOneOf', _EndsWith);

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
 *   @EndsWithOneOf(['jpg', 'png', 'gif', 'webp'])
 *   imageFile: string;
 *
 *   @EndsWithOneOf(['.com', '.org', '.net'])
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
export const EndsWithOneOf = Validator.buildRuleDecorator<string[]>(_EndsWith);

function _StartsWith({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions<string[]>): IValidatorResult {
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
      (prefix) => isNonNullString(value) && value.startsWith(prefix)
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
}
Validator.registerRule('StartsWithOneOf', _StartsWith);
export const StartsWithOneOf =
  Validator.buildRuleDecorator<string[]>(_StartsWith);

function _String({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return typeof value === 'string'
    ? true
    : i18n.t('validator.string', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
}
Validator.registerRule('String', _String);

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
 *   @IsRequired
 *   @IsString
 *   title: String;
 *
 *   @IsString
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
export const IsString = Validator.buildPropertyDecorator<[]>(['String']);

declare module '../types' {
  export interface IValidatorRulesMap<Context = unknown> {
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
     *   @String
     *   title: String;
     *
     *   @String
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
    String: IValidatorRuleParams<[], Context>;

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
     *   rules: ['StartsWithOneOf[http://,https://]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'USER_12345',
     *   rules: ['StartsWithOneOf[USER_,ADMIN_]']
     * }); // ✓ Valid
     *
     * // Invalid example
     * await Validator.validate({
     *   value: 'ftp://example.com',
     *   rules: ['StartsWithOneOf[http://,https://]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Configuration {
     *   @StartsWithOneOf(['http://', 'https://'])
     *   apiUrl: string;
     *
     *   @StartsWithOneOf(['prod_', 'dev_', 'test_'])
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
    StartsWithOneOf: IValidatorRuleParams<string[], Context>;

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
     *   rules: ['EndsWithOneOf[jpg,png,gif]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'document.pdf',
     *   rules: ['EndsWithOneOf[pdf,doc,docx]']
     * }); // ✓ Valid
     *
     * // Invalid example
     * await Validator.validate({
     *   value: 'image.txt',
     *   rules: ['EndsWithOneOf[jpg,png,gif]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class FileUpload {
     *   @EndsWithOneOf(['jpg', 'png', 'gif', 'webp'])
     *   imageFile: string;
     *
     *   @EndsWithOneOf(['.com', '.org', '.net'])
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
    EndsWithOneOf: IValidatorRuleParams<string[], Context>;
  }
}
