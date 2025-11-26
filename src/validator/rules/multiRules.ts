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
 *   @OneOf("Email", "PhoneNumber")
 *   contact: string;
 *
 *   // Accept either a UUID OR a custom ID format
 *   @OneOf(
 *     "UUID",
 *     ({ value }) => value.startsWith('CUSTOM-') || 'Must start with CUSTOM-'
 *   )
 *   identifier: string;
 *
 *   // Accept either a string name OR a number ID
 *   @OneOf(
 *     "IsNonNullString",
 *     "IsNumber"
 *   )
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
 *   @OneOf(
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
 *   )
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
 *   @OneOf(
 *     "IsUrl",
 *     ({ value }) => value.startsWith('/') || 'Path must start with /'
 *   )
 *   imagePath: string;
 *
 *   // Accept either a standard email OR an internal company email
 *   @OneOf(
 *     "Email",
 *     ({ value }) => value.endsWith('@company.com') || 'Must be company email'
 *   )
 *   contactEmail: string;
 * }
 * ```
 *
 * ### Error Handling
 * ```typescript
 * class FlexibleForm {
 *   @OneOf("Email", "PhoneNumber", "UUID")
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
 *   @IsRequired()  // Must be present
 *   @OneOf(    // And must satisfy at least one of these
 *     "Email",
 *     "PhoneNumber"
 *   )
 *   contact: string;
 *
 *   @IsOptional()  // Can be omitted
 *   @OneOf(    // But if present, must satisfy one of these
 *     "IsUrl",
 *     ({ value }) => value.startsWith('file://') || 'Must be file:// URL'
 *   )
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
 * @see {@link ValidatorValidateMultiRuleOptions} - Type definition for validation options
 *
 * @public
 * @decorator
 */
export const OneOf = Validator.buildMultiRuleDecorator(function OneOf(options) {
  return Validator.validateOneOfRule(options);
}, Symbol.for('validatorOneOfRuleMarker'));

/**
 * ## AllOf Validation Decorator
 *
 * A powerful validation decorator that implements "AllOf" logic, where validation succeeds
 * only if ALL of the provided sub-rules validate successfully. This decorator enables
 * strict validation scenarios where multiple validation conditions must all be met simultaneously.
 *
 * ### AllOf Validation Concept
 * Unlike OneOf which uses OR logic (any rule can pass), AllOf uses AND logic - every single
 * sub-rule must pass for validation to succeed. This is perfect for scenarios requiring
 * multiple validation criteria to be satisfied at the same time.
 *
 * ### Key Features
 * - **Strict Validation**: Require values to satisfy ALL specified validation criteria
 * - **Sequential Execution**: Sub-rules are validated in order until one fails
 * - **Early Failure**: Returns immediately when the first sub-rule fails
 * - **Error Aggregation**: Combines error messages from all failed sub-rules
 * - **Type Safe**: Full TypeScript support with generic context typing
 * - **Decorator Pattern**: Easy to apply to class properties using the `@AllOf()` syntax
 *
 * ### Common Use Cases
 * - **Password Requirements**: Must be long enough AND contain numbers AND contain uppercase
 * - **Product Codes**: Must match format AND be correct length AND start with prefix
 * - **Address Validation**: Must be non-empty AND valid characters AND within length limits
 * - **Complex Business Rules**: Multiple conditions that must all be satisfied
 * - **Security Constraints**: Multiple security requirements that must all pass
 *
 * ### Validation Behavior
 * - **Success Condition**: ALL sub-rules must return successful validation results
 * - **Failure Condition**: Any single sub-rule fails, validation stops and fails
 * - **Empty Rules**: If no sub-rules are provided, validation fails with "invalidRule" error
 * - **Rule Processing**: Each sub-rule is validated using the standard `Validator.validate` method
 *
 * @example
 * ```typescript
 * // Password must be string, min 8 chars, contain number and uppercase
 * // AllOf ensures ALL these conditions are met simultaneously
 * ['AllOf', 'IsString', [{'MinLength': [8]}], [{Matches: [/.*\\d.*\/]}], [{'Matches': [/.*[A-Z].*\/]}]
 * ```
 *
 * @example
 * ```typescript
 * // Product code must start with PROD, be 10 chars, alphanumeric only
 * // AllOf requires ALL criteria to pass
 * ['AllOf', 'IsString', [{'Matches': [/^PROD/]}], [{'Length': [10]}], [{'Matches': [/^[A-Z0-9]+$/]}]]
 * ```
 *
 * @example
 * ```typescript
 * // Address must be required, 5-100 chars, valid characters
 * // AllOf validates that ALL rules succeed
 * ['AllOf', 'IsString', 'IsNotEmpty', ['MinLength', 5], ['MaxLength', 100]]
 * ```
 *
 * ### Advanced Usage with Context
 * ```typescript
 * interface ValidationContext {
 *   environment: 'production' | 'staging' | 'development';
 *   strictMode: boolean;
 * }
 *
 * class SecureEntity {
 *   @AllOf(
 *     "IsString",
 *     [{"MinLength": [12]}],
 *     ({ value, context }) => {
 *       // Additional security rules based on context
 *       const ctx = context as ValidationContext;
 *       if (ctx?.environment === 'production' && ctx?.strictMode) {
 *         return /.*[!@#$%^&*].*\/.test(value) || 'Production requires special characters';
 *       }
 *       return true; // Skip this rule in non-production or non-strict mode
 *     }
 *   )
 *   secureToken: string;
 * }
 * ```
 *
 * ### Error Handling
 * ```typescript
 * class StrictForm {
 *   @AllOf("IsString", [{"MinLength": [5]}], [{"MaxLength": [10]}])
 *   code: string;
 * }
 *
 * const form = new StrictForm();
 * form.code = "hi"; // ❌ Fails (too short)
 *
 * // When validation fails, you get the first error encountered:
 * // "Value must be at least 5 characters long"
 *
 * // Use with validateTarget for comprehensive error reporting
 * const result = await Validator.validateTarget(StrictForm, {
 *   code: "hi"
 * });
 *
 * if (!result.success) {
 *   console.log(result.errors[0].message);
 *   // Output: "Value must be at least 5 characters long"
 * }
 * ```
 *
 * ### Integration with Other Decorators
 * ```typescript
 * class ComprehensiveUser {
 *   @IsRequired()  // Must be present
 *   @AllOf(    // And must satisfy ALL of these
 *     "IsString",
 *     [{"MinLength": [8]}],
 *     [{"Matches": [/.*\\d.*\/, { message: 'Must contain a number' }]}]
 *   )
 *   password: string;
 *
 *   @IsOptional()  // Can be omitted
 *   @AllOf(    // But if present, must satisfy ALL of these
 *     "IsString",
 *     [{"MinLength": [10]}],
 *     [{"MaxLength": [50]}]
 *   )
 *   description?: string;
 * }
 * ```
 *
 * @template Context - Optional type for the validation context object
 *
 * @param rules - Array of validation rules where ALL must pass for validation to succeed
 * @param rules - Each rule can be a string (rule name), object (rule with parameters), or function (custom validation)
 *
 * @returns Property decorator that applies AllOf validation logic to class properties
 *
 * @throws {string} When any sub-rule fails, throws the error message from the first failing rule
 * @throws {string} When no sub-rules are provided, throws "invalidRule" error
 *
 * @see {@link Validator.validateAllOfRule} - The underlying validation method
 * @see {@link Validator.buildMultiRuleDecorator} - Factory method that creates this decorator
 * @see {@link Validator.validateTarget} - For class-based validation using decorators
 * @see {@link ValidatorValidateMultiRuleOptions} - Type definition for validation options
 *
 * @public
 * @decorator
 */
export const AllOf = Validator.buildMultiRuleDecorator(function AllOf(options) {
  return Validator.validateAllOfRule(options);
}, Symbol.for('validatorAllOfRuleMarker'));

/**
 * ## ArrayOf Validation Decorator
 *
 * A powerful validation decorator that validates arrays where each element must satisfy
 * ALL of the provided sub-rules. This decorator combines array validation with AllOf logic,
 * ensuring that every item in an array meets multiple validation criteria simultaneously.
 *
 * ### ArrayOf Validation Concept
 * ArrayOf first validates that the value is an array, then applies AllOf validation to each
 * element. This means every single item in the array must pass ALL specified validation rules.
 * It's perfect for validating collections where each item has multiple requirements.
 *
 * ### Key Features
 * - **Array Validation**: Ensures the value is an array before validating elements
 * - **Element-wise AllOf**: Each array element must satisfy ALL sub-rules
 * - **Comprehensive Coverage**: Validates all elements against all rules
 * - **Detailed Error Reporting**: Provides specific error messages for failed elements
 * - **Type Safe**: Full TypeScript support with generic context typing
 * - **Decorator Pattern**: Easy to apply to array properties using the `@ArrayOf()` syntax
 *
 * ### Common Use Cases
 * - **Email Lists**: Array of strings where each must be valid email AND not empty
 * - **Product IDs**: Array of codes where each must match format AND be correct length
 * - **User Permissions**: Array of permission strings with specific format requirements
 * - **Numeric Ranges**: Array of numbers within bounds AND meeting precision requirements
 * - **File Lists**: Array of file paths that must exist AND have valid extensions
 *
 * ### Validation Behavior
 * - **Array Check**: First validates that the value is actually an array
 * - **Element Validation**: Each element is validated against ALL sub-rules
 * - **All-or-Nothing**: Every element must pass all rules for overall validation to succeed
 * - **Empty Arrays**: Empty arrays are considered valid (no elements to validate)
 * - **Rule Processing**: Each sub-rule is applied to each element using `Validator.validate`
 *
 * ### Common Use Cases
 * - **Email Lists**: Each email must be valid format AND not empty
 * - **Product Codes**: Each code must match pattern AND be correct length
 * - **User IDs**: Each ID must be valid format AND within length limits
 * - **Numeric Arrays**: Each number must be within range AND meet precision rules
 * - **Permission Lists**: Each permission must be valid format AND recognized
 *
 * ### Validation Behavior
 * - **Array Validation**: First ensures the value is an array
 * - **Element-wise Validation**: Each array element must pass ALL sub-rules
 * - **Comprehensive Checking**: All elements are validated against all rules
 * - **Empty Arrays**: Valid (no elements means no validation failures)
 * - **Error Details**: Specific error messages indicate which element failed which rule
 *
 * @example
 * ```typescript
 * import { ArrayOf } from 'reslib/validator';
 *
 * class User {
 *   // Each email in the list must be a valid email AND not empty
 *   @ArrayOf("Email", "IsNonNullString")
 *   emailAddresses: string[];
 *
 *   // Each permission must be a string AND match the permission format
 *   @ArrayOf(
 *     "IsString",
 *     [{Matches: [/^perm\./, {message: 'Permission must start with perm.'}]}]
 *   )
 *   permissions: string[];
 * }
 *
 * // Validation examples
 * const user1 = new User();
 * user1.emailAddresses = ["user@example.com", "admin@test.com"]; // ✅ Passes
 *
 * const user2 = new User();
 * user2.emailAddresses = ["invalid-email", "user@example.com"]; // ❌ Fails
 * // Error: "Invalid email format (at index 0)"
 * ```
 *
 * @example
 * ```typescript
 * class Product {
 *   // Each product code must be string, 10 chars, start with PROD, alphanumeric
 *   @ArrayOf(
 *     "IsString",
 *     ["Length", 10, { message: 'Each product code must be exactly 10 characters' }],
 *     [{Matches: [/^PROD/, { message: 'Each product code must start with PROD' }]}],
 *     [{Matches: [/^[A-Z0-9]+$/, { message: 'Each product code must be alphanumeric' }]}]
 *   )
 *   productCodes: string[];
 *
 *   // Each price must be a positive number within reasonable range
 *   @ArrayOf(
 *     "IsNumber",
 *     [{Min: [0.01, { message: 'Each price must be greater than 0' }]}],
 *     [{Max: [999999.99, { message: 'Each price cannot exceed $999,999.99' }]}]
 *   )
 *   prices: number[];
 * }
 *
 * // Validation examples
 * const product1 = new Product();
 * product1.productCodes = ["PROD123456", "PROD789012"]; // ✅ Passes
 *
 * const product2 = new Product();
 * product2.productCodes = ["PROD123456", "INVALID123"]; // ❌ Fails
 * // Error: "Each product code must start with PROD (at index 1)"
 * ```
 *
 * @example
 * ```typescript
 * class Configuration {
 *   // Each tag must be non-empty string AND within length limits AND valid format
 *   @ArrayOf(
 *     "IsString",
 *     ["IsNotEmpty"],
 *     [{MinLength: [2]}],
 *     [{MaxLength: [50]}],
 *     [{Matches: [/^[a-zA-Z0-9_-]+$/, { message: 'Tags can only contain letters, numbers, hyphens, and underscores' }]}]
 *   )
 *   tags: string[];
 * }
 *
 * // Validation examples
 * const config1 = new Configuration();
 * config1.tags = ["important", "urgent", "review"]; // ✅ Passes
 *
 * const config2 = new Configuration();
 * config2.tags = ["important", "", "review"]; // ❌ Fails
 * // Error: "Tags cannot be empty (at index 1)"
 *
 * const config3 = new Configuration();
 * config3.tags = ["important", "tag with spaces", "review"]; // ❌ Fails
 * // Error: "Tags can only contain letters, numbers, hyphens, and underscores (at index 1)"
 * ```
 *
 * @template Context - Optional type for the validation context object
 *
 * @param rules - Array of validation rules where ALL must pass for each array element
 * @param rules - Each rule can be a string (rule name), object (rule with parameters), or function (custom validation)
 *
 * @returns Property decorator that applies ArrayOf validation logic to array properties
 *
 * @throws {string} When value is not an array, throws "Value must be an array" error
 * @throws {string} When any array element fails any sub-rule, throws detailed error message
 * @throws {string} When no sub-rules are provided, throws "invalidRule" error
 *
 * @see {@link Validator.validateArrayOfRule} - The underlying validation method
 * @see {@link Validator.buildMultiRuleDecorator} - Factory method that creates this decorator
 * @see {@link Validator.validateTarget} - For class-based validation using decorators
 * @see {@link ValidatorValidateMultiRuleOptions} - Type definition for validation options
 *
 * @public
 * @decorator
 */
export const ArrayOf = Validator.buildMultiRuleDecorator(function ArrayOf(
  options
) {
  return Validator.validateArrayOfRule(options);
}, Symbol.for('validatorArrayOfRuleMarker'));
