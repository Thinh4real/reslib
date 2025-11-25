import { Validator } from '../validator';

/**
 * ## OneOf Validation Decorator
 *
 * A powerful validation decorator that implements "OneOf" logic, where validation succeeds
 * if at least one of the provided sub-rules validates successfully. This decorator enables
 * flexible validation scenarios where multiple validation paths are acceptable.
 *
 * ### OneOf Validation Concept
 * Unlike traditional AND validation (where all rules must pass), OneOf validation uses
 * OR logic - validation succeeds when any single sub-rule passes. This is ideal for
 * scenarios where data can be valid in multiple different formats or meet different criteria.
 *
 * ### Key Features
 * - **Flexible Validation**: Accept values that satisfy any one of several validation criteria
 * - **Parallel Execution**: Sub-rules are validated concurrently for optimal performance
 * - **Short-Circuit Success**: Returns immediately when the first sub-rule passes
 * - **Error Aggregation**: Combines error messages from all failed sub-rules when all fail
 * - **Type Safe**: Full TypeScript support with generic context typing
 * - **Decorator Pattern**: Easy to apply to class properties using the `@OneOf()` syntax
 *
 * ### Common Use Cases
 * - **Alternative Contact Methods**: Accept either email OR phone number
 * - **Multiple ID Formats**: Allow UUID, custom ID format, or database-generated ID
 * - **Flexible Input Types**: Accept string OR number for certain fields
 * - **Conditional Business Rules**: Different validation rules based on context
 * - **Format Alternatives**: Accept data in JSON, XML, or custom format
 *
 * ### Validation Behavior
 * - **Success Condition**: At least one sub-rule must return a successful validation result
 * - **Failure Condition**: All sub-rules fail, aggregated errors are returned
 * - **Empty Rules**: If no sub-rules are provided, validation fails with "invalidRule" error
 * - **Rule Processing**: Each sub-rule is validated using the standard `Validator.validate` method
 *
 * @example
 * ```typescript
 * import { OneOf } from 'reslib/validator';
 *
 * class User {
 *   // Accept either a valid email OR a valid phone number
 *   @OneOf(["Email", "PhoneNumber"])
 *   contact: string;
 *
 *   // Accept either a UUID OR a custom ID format
 *   @OneOf([
 *     "UUID",
 *     ({ value }) => value.startsWith('CUSTOM-') || 'Must start with CUSTOM-'
 *   ])
 *   identifier: string;
 *
 *   // Accept either a string name OR a number ID
 *   @OneOf([
 *     "IsNonNullString",
 *     "IsNumber"
 *   ])
 *   flexibleId: string | number;
 * }
 *
 * // Validation examples
 * const user1 = new User();
 * user1.contact = "user@example.com"; // ✅ Passes (Email rule)
 *
 * const user2 = new User();
 * user2.contact = "+1234567890"; // ✅ Passes (PhoneNumber rule)
 *
 * const user3 = new User();
 * user3.contact = "invalid-input"; // ❌ Fails (both Email and PhoneNumber fail)
 * // Error: "Invalid email format; Invalid phone number format"
 * ```
 *
 * ### Advanced Usage with Context
 * ```typescript
 * interface ValidationContext {
 *   userType: 'admin' | 'user';
 *   permissions: string[];
 * }
 *
 * class Entity {
 *   @OneOf([
 *     "Email",
 *     "UUID",
 *     ({ value, context }) => {
 *       // Custom rule that depends on context
 *       const ctx = context as ValidationContext;
 *       if (ctx?.userType === 'admin') {
 *         return value.startsWith('ADMIN-') || 'Admin IDs must start with ADMIN-';
 *       }
 *       return false; // Skip this rule for non-admins
 *     }
 *   ])
 *   identifier: string;
 * }
 *
 * // Context-aware validation
 * const adminEntity = new Entity();
 * adminEntity.identifier = "ADMIN-123"; // ✅ Passes (custom rule for admin)
 *
 * const userEntity = new Entity();
 * userEntity.identifier = "user@example.com"; // ✅ Passes (Email rule)
 * ```
 *
 * ### Complex Rule Combinations
 * ```typescript
 * class Product {
 *   // Accept either a valid URL OR a relative path starting with '/'
 *   @OneOf([
 *     "IsUrl",
 *     ({ value }) => value.startsWith('/') || 'Path must start with /'
 *   ])
 *   imagePath: string;
 *
 *   // Accept either a standard email OR an internal company email
 *   @OneOf([
 *     "Email",
 *     ({ value }) => value.endsWith('@company.com') || 'Must be company email'
 *   ])
 *   contactEmail: string;
 * }
 * ```
 *
 * ### Error Handling
 * ```typescript
 * class FlexibleForm {
 *   @OneOf(["Email", "PhoneNumber", "UUID"])
 *   identifier: string;
 * }
 *
 * const form = new FlexibleForm();
 * form.identifier = "invalid"; // ❌ All rules fail
 *
 * // When validation fails, you get aggregated error messages:
 * // "Invalid email format; Invalid phone number format; Invalid UUID format"
 *
 * // Use with validateTarget for comprehensive error reporting
 * const result = await Validator.validateTarget(FlexibleForm, {
 *   identifier: "invalid"
 * });
 *
 * if (!result.success) {
 *   console.log(result.errors[0].message);
 *   // Output: "Invalid email format; Invalid phone number format; Invalid UUID format"
 * }
 * ```
 *
 * ### Integration with Other Decorators
 * ```typescript
 * class ComprehensiveUser {
 *   @IsRequired  // Must be present
 *   @OneOf([     // And must satisfy at least one of these
 *     "Email",
 *     "PhoneNumber"
 *   ])
 *   contact: string;
 *
 *   @IsOptional  // Can be omitted
 *   @OneOf([     // But if present, must satisfy one of these
 *     "IsUrl",
 *     ({ value }) => value.startsWith('file://') || 'Must be file:// URL'
 *   ])
 *   avatarUrl?: string;
 * }
 * ```
 *
 * @template Context - Optional type for the validation context object
 *
 * @param rules - Array of validation rules where at least one must pass for validation to succeed
 * @param rules - Each rule can be a string (rule name), object (rule with parameters), or function (custom validation)
 *
 * @returns Property decorator that applies OneOf validation logic to class properties
 *
 * @throws {string} When all sub-rules fail, throws aggregated error messages joined with semicolons
 * @throws {string} When no sub-rules are provided, throws "invalidRule" error
 *
 *
 * @see {@link Validator.validateOneOfRule} - The underlying validation method
 * @see {@link Validator.buildMultiRuleDecorator} - Factory method that creates this decorator
 * @see {@link Validator.validateTarget} - For class-based validation using decorators
 * @see {@link IValidatorValidateMultiRuleOptions} - Type definition for validation options
 *
 * @public
 * @decorator
 */
export const OneOf = Validator.buildMultiRuleDecorator(function OneOf(options) {
  return Validator.validateOneOfRule(options);
});
Validator.markRuleWithSymbol(OneOf, Symbol.for('validatorOneOfRuleMarker'));

export const AllOf = Validator.buildMultiRuleDecorator(function AllOf(options) {
  return Validator.validateAllOfRule(options);
});
Validator.markRuleWithSymbol(AllOf, Symbol.for('validatorAllOfRuleMarker'));

/**
 * ## ArrayOf Validation Decorator
 *
 * Ensures a property value is an array and that every item satisfies all provided
 * sub-rules (AND logic per item). Delegates to `Validator.validateArrayOfRule`.
 *
 * @example
 * class Model {
 *   @ArrayOf(["Email"]) emails!: string[];
 * }
 */
export const ArrayOf = Validator.buildMultiRuleDecorator(
  function ArrayOf(options) {
    return Validator.validateArrayOfRule(options);
  }
);
Validator.markRuleWithSymbol(ArrayOf, Symbol.for('validatorArrayOfRuleMarker'));
