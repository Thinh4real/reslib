import { Validator } from "../validator";

Validator.registerRule("Required", function Required(options) {
  const { value, i18n } = options;
  // Check if value is truly empty (null, undefined, or empty string)
  // Empty arrays, empty objects, 0, false, NaN are NOT considered empty
  const isValueEmpty = value === null || value === undefined || (typeof value === "string" && value === "");
  return !isValueEmpty || i18n.t("validator.required", options);
});

/**
 * ### IsRequired Decorator
 *
 * Validates that a property has a non-null, non-undefined value. This is
 * one of the most commonly used validation decorators and should be applied
 * to any property that must have a value.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired
 *   username: string;
 *
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   // Optional field - no @IsRequired
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
 * @since 1.0.0
 * @see {@link IsOptional} - For optional fields
 * @public
 */
export const IsRequired = Validator.buildPropertyDecorator(["Required"]);

// Nullable validation rules - allow skipping validation under specific conditions

Validator.registerRule("Empty", function Empty() {
  // This rule always passes - its presence indicates that empty string values should skip validation
  return true;
});

/**
 * ### Empty Decorator
 *
 * Marks a field as allowing empty strings, meaning validation will be skipped if the value is an empty string ("").
 * If the value is not an empty string, other validation rules will still be applied.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsEmpty
 *   @IsString  // Only skipped if bio is an empty string
 *   bio: string;
 * }
 * ```
 *
 * @decorator
 * @since 1.23.0
 * @public
 */
export const IsEmpty = Validator.buildPropertyDecorator(["Empty"]);

Validator.registerRule("Nullable", function Nullable() {
  // This rule always passes - its presence indicates that null/undefined values should skip validation
  return true;
});

/**
 * ### Nullable Decorator
 *
 * Marks a field as nullable, meaning validation will be skipped if the value is null or undefined.
 * If the value is not null or undefined, other validation rules will still be applied.
 *
 * @example
 * ```typescript
 * class User {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsNullable
 *   @IsString  // Only skipped if bio is null or undefined
 *   bio?: string;
 * }
 * ```
 *
 * @decorator
 * @since 1.23.0
 * @public
 */
export const IsNullable = Validator.buildPropertyDecorator(["Nullable"]);

Validator.registerRule("Optional", function Optional() {
  // This rule always passes - its presence indicates that undefined values should skip validation
  return true;
});

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
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsOptional
 *   @IsUrl  // Only validated if website is present in data and not undefined
 *   website?: string;
 * }
 * ```
 *
 * @decorator
 * @since 1.23.0
 * @public
 */
export const IsOptional = Validator.buildPropertyDecorator(["Optional"]);
