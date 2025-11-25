import { ValidatorRuleParamTypes, type ValidatorRuleParams } from '../types';
import { Validator } from '../validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

/**
 * ### IsRequired Decorator
 *
 * Validates that a property has a non-null, non-undefined value, non empty string. This is
 * one of the most commonly used validation decorators and should be applied
 * to any property that must have a value.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired()
 *   username: string;
 *
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   // Optional field - no @IsRequired()
 *   bio?: string;
 * }
 *
 * // Valid data
 * const user = { username: "john_doe", email: "john@example.com" };
 *
 * // Invalid data
 * const invalid = { email: "john@example.com" }; // Missing username
 * // Will fail validation with error: "Username is required"
 * ```
 *
 * @decorator
 *
 * @see {@link IsOptional} - For optional fields
 * @public
 */
export const IsRequired = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Required']
>(function Required(options) {
  const { value, i18n } = options;
  // Check if value is truly empty (null, undefined, or empty string)
  // Empty arrays, empty objects, 0, false, NaN are NOT considered empty
  const isValueEmpty =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value === '');
  return !isValueEmpty || i18n.t('validator.required', options);
}, 'Required');

/**
 * ### Empty Decorator
 *
 * Marks a field as allowing empty strings, meaning validation will be skipped if the value is an empty string ("").
 * If the value is not an empty string, other validation rules will still be applied.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsEmpty
 *   @IsString()  // Only skipped if bio is an empty string
 *   bio: string;
 * }
 * ```
 *
 * @decorator
 *
 * @public
 */
export const IsEmpty = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Empty']
>(function Empty() {
  // This rule always passes - its presence indicates that empty string values should skip validation
  return true;
}, 'Empty');

/**
 * ### Nullable Decorator
 *
 * Marks a field as nullable, meaning validation will be skipped if the value is null or undefined.
 * If the value is not null or undefined, other validation rules will still be applied.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsNullable
 *   @IsString()  // Only skipped if bio is null or undefined
 *   bio?: string;
 * }
 * ```
 *
 * @decorator
 *
 * @public
 */
export const IsNullable = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Nullable']
>(function Nullable() {
  // This rule always passes - its presence indicates that null or undefined values should skip validation
  return true;
}, 'Nullable');

/**
 * ### Optional Decorator
 *
 * Marks a field as sometimes validated, meaning validation will be skipped if the value is undefined.
 * If the field is not present in the data object, validation is also skipped.
 * This is useful for optional fields that should only be validated when explicitly provided.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsOptional()
 *   @IsUrl()  // Only validated if website is present in data and not undefined
 *   website?: string;
 * }
 * ```
 *
 * @decorator
 *
 * @public
 */
export const IsOptional = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Optional']
>(function Optional() {
  // This rule always passes - its presence indicates that undefined values should skip validation
  return true;
}, 'Optional');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Required Rule
     *
     * Validates that a property has a non-null, non-undefined value and non-empty string.
     * This is one of the most commonly used validation rules and should be applied
     * to any property that must have a value.
     *
     * #### Validation Logic
     * - Rejects `null` values
     * - Rejects `undefined` values
     * - Rejects empty strings `""`
     * - Accepts `0`, `false`, `NaN`, empty arrays `[]`, and empty objects `{}`
     *
     * @example
     * ```typescript
     * // Valid examples (non-empty values)
     * await Validator.validate({
     *   value: "hello",
     *   rules: ['Required']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 0,
     *   rules: ['Required']
     * }); // ✓ Valid (zero is not empty)
     *
     * await Validator.validate({
     *   value: false,
     *   rules: ['Required']
     * }); // ✓ Valid (false is not empty)
     *
     * await Validator.validate({
     *   value: [],
     *   rules: ['Required']
     * }); // ✓ Valid (empty array is not empty)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: null,
     *   rules: ['Required']
     * }); // ✗ Invalid (null)
     *
     * await Validator.validate({
     *   value: undefined,
     *   rules: ['Required']
     * }); // ✗ Invalid (undefined)
     *
     * await Validator.validate({
     *   value: "",
     *   rules: ['Required']
     * }); // ✗ Invalid (empty string)
     *
     * // Class validation
     * class User {
     *   @IsRequired()
     *   username: string;
     *
     *   @IsRequired()
     *   @IsEmail()
     *   email: string;
     * }
     * ```
     *
     * @returns Promise resolving to true if value is present and not empty, rejecting with error message if empty
     *
     * @public
     */
    Required: ValidatorRuleParams<[]>;

    /**
     * ### Empty Rule
     *
     * Marks a field as allowing empty strings, meaning validation will be skipped
     * if the value is an empty string (""). This rule only takes effect when the
     * value is considered "empty" by the `isEmpty()` utility (null, undefined,
     * empty string, or empty array), and specifically when the value equals "".
     *
     * #### Validation Logic
     * - Skips validation only when `value === ""` (empty string)
     * - Only applies when `isEmpty(value)` returns true
     * - Does not affect validation for non-empty values (including null, undefined, or empty arrays)
     *
     * #### Use Cases
     * - Optional text fields that can be left blank
     * - Comments or notes that may be empty
     * - Form fields with placeholder text
     *
     * @example
     * ```typescript
     * // Validation skipped for empty strings only
     * await Validator.validate({
     *   value: "",
     *   rules: ['Empty', 'IsString']
     * }); // ✓ Valid (validation skipped)
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['Empty', 'IsString']
     * }); // ✗ Invalid (fails IsString validation - Empty doesn't apply to null)
     *
     * await Validator.validate({
     *   value: undefined,
     *   rules: ['Empty', 'IsString']
     * }); // ✗ Invalid (fails IsString validation - Empty doesn't apply to undefined)
     *
     * await Validator.validate({
     *   value: "hello",
     *   rules: ['Empty', 'IsString']
     * }); // ✓ Valid (passes IsString validation)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Empty', 'IsString']
     * }); // ✗ Invalid (fails IsString validation)
     *
     * // Class validation
     * class User {
     *   @IsRequired()
     *   @IsEmail()
     *   email: string;
     *
     *   @IsEmpty
     *   @IsString()  // Only skipped if bio is exactly an empty string ""
     *   bio: string;
     * }
     * ```
     *
     * @returns Promise resolving to true (always passes, acts as a skip condition)
     *
     * @public
     */
    Empty: ValidatorRuleParams<[]>;

    /**
     * ### Nullable Rule
     *
     * Marks a field as nullable, meaning validation will be skipped if the value
     * is null or undefined. This rule only takes effect when the value is considered
     * "empty" by the `isEmpty()` utility (null, undefined, empty string, or empty array).
     * If the value is not null or undefined, other validation rules will still be applied.
     *
     * #### Validation Logic
     * - Skips validation when `value === null || value === undefined`
     * - Only applies when `isEmpty(value)` returns true
     * - Does not skip validation for empty strings (use Empty rule for that)
     *
     * #### Use Cases
     * - Database fields that can be NULL
     * - Optional references that may not exist
     * - API responses where fields might be null
     *
     * @example
     * ```typescript
     * // Validation skipped for null/undefined
     * await Validator.validate({
     *   value: null,
     *   rules: ['Nullable', 'IsString']
     * }); // ✓ Valid (validation skipped)
     *
     * await Validator.validate({
     *   value: undefined,
     *   rules: ['Nullable', 'IsString']
     * }); // ✓ Valid (validation skipped)
     *
     * await Validator.validate({
     *   value: "",
     *   rules: ['Nullable', 'IsString']
     * }); // ✗ Invalid (fails IsString validation - Nullable doesn't apply to empty strings)
     *
     * await Validator.validate({
     *   value: "hello",
     *   rules: ['Nullable', 'IsString']
     * }); // ✓ Valid (passes IsString validation)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Nullable', 'IsString']
     * }); // ✗ Invalid (fails IsString validation)
     *
     * // Class validation
     * class User {
     *   @IsRequired()
     *   @IsEmail()
     *   email: string;
     *
     *   @IsNullable
     *   @IsString()  // Only skipped if bio is null or undefined
     *   bio?: string;
     * }
     * ```
     *
     * @returns Promise resolving to true (always passes, acts as a skip condition)
     *
     * @public
     */
    Nullable: ValidatorRuleParams<[]>;

    /**
     * ### Optional Rule
     *
     * Marks a field as sometimes validated, meaning validation will be skipped
     * if the value is undefined. This rule only takes effect when the value is
     * considered "empty" (null, undefined, empty string, or empty array).
     * If the field is not present in the data object, validation is also skipped.
     * This is useful for optional fields that should only be validated when explicitly provided.
     *
     * #### Validation Logic
     * - Skips validation only when `value === undefined`
     * - Only applies when `isEmpty(value)` returns true
     * - Does not skip validation for null values (use Nullable for that)
     * - Fields omitted from data are automatically skipped
     *
     * #### Use Cases
     * - PATCH API updates where only changed fields are sent
     * - Optional form fields that may not be submitted
     * - Configuration objects with optional properties
     *
     * @example
     * ```typescript
     * // Validation skipped for undefined or missing fields
     * await Validator.validate({
     *   value: undefined,
     *   rules: ['Optional', 'IsString']
     * }); // ✓ Valid (validation skipped)
     *
     * // Field not present in validation data
     * await Validator.validate({
     *   value: undefined, // Field omitted from data
     *   rules: ['Optional', 'IsString']
     * }); // ✓ Valid (validation skipped)
     *
     * await Validator.validate({
     *   value: "hello",
     *   rules: ['Optional', 'IsString']
     * }); // ✓ Valid (passes IsString validation)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Optional', 'IsString']
     * }); // ✗ Invalid (fails IsString validation)
     *
     * // Class validation
     * class User {
     *   @IsRequired()
     *   @IsEmail()
     *   email: string;
     *
     *   @IsOptional()
     *   @IsUrl()  // Only validated if website is present in data and not undefined
     *   website?: string;
     * }
     * ```
     *
     * @returns Promise resolving to true (always passes, acts as a skip condition)
     *
     * @public
     */
    Optional: ValidatorRuleParams<[]>;
  }
}
