import { Validator } from '../validator';

/**
 * ValidateNested Decorator - Property decorator for validating nested class objects
 *
 * Validates an object property by delegating to the validation rules defined on another
 * decorated class. Enables hierarchical object validation where a property value must
 * satisfy all validation rules of a nested class.
 *
 * @usage Basic Example:
 * ```typescript
 * class Address {
 *   @IsRequired
 *   street: string;
 *
 *   @IsRequired
 *   city: string;
 * }
 *
 * class User {
 *   @IsRequired
 *   name: string;
 *
 *   @ValidateNested([Address])
 *   address: Address;
 * }
 *
 * const result = await Validator.validateTarget(User, {
 *   data: {
 *     name: "John",
 *     address: { street: "123 Main St", city: "Springfield" }
 *   }
 * });
 * ```
 *
 * @usage Multi-level Nesting Example:
 * ```typescript
 * class Coordinates {
 *   @IsRequired
 *   @IsNumber
 *   latitude: number;
 *
 *   @IsRequired
 *   @IsNumber
 *   longitude: number;
 * }
 *
 * class Location {
 *   @IsRequired
 *   @ValidateNested([Coordinates])
 *   coordinates: Coordinates;
 * }
 *
 * class Event {
 *   @IsRequired
 *   name: string;
 *
 *   @ValidateNested([Location])
 *   location: Location;
 * }
 * ```
 *
 * @usage Optional Nested Objects:
 * ```typescript
 * class Contact {
 *   @IsRequired
 *   @IsEmail()
 *   email: string;
 * }
 *
 * class Person {
 *   @IsRequired
 *   name: string;
 *
 *   @IsOptional
 *   @ValidateNested([Contact])
 *   contact?: Contact;
 * }
 *
 * const result = await Validator.validateTarget(Person, {
 *   data: { name: "Alice" }
 * });
 * ```
 *
 * @param options - Configuration object containing the target class constructor
 *   The nested class must have validation decorators to be useful
 *
 * @returns Promise<ValidatorValidateTargetResult> containing:
 *   - isValid: boolean indicating if validation passed
 *   - errors: object mapping field names to error arrays (includes nested path info)
 *   - data: the original validated data on success
 *
 * How It Works:
 * 1. Accepts an array containing a class constructor: [NestedClass]
 * 2. When parent class is validated via Validator.validateTarget(), this decorator
 *    triggers validation of the nested object against the NestedClass schema
 * 3. Delegates to Validator.validateNestedRule() for actual nested validation
 * 4. Returns errors with nested field path information (e.g., [address]: [street]: error)
 * 5. Supports arbitrary nesting depth through recursive validation
 * 6. All nested validations run in parallel for optimal performance
 *
 * Features:
 * - Recursive nesting support for complex object hierarchies
 * - Context propagation through validation layers
 * - Parallel validation of multiple nested properties
 * - Works with @IsOptional for optional nested objects
 * - Compatible with all other validation decorators
 * - Custom error messages via errorMessageBuilder callback
 *
 * Error Examples:
 * - Nested object missing: errors would show field not provided
 * - Invalid nested property: errors show "[parentField]: [nestedField]: error message"
 * - Multi-level nesting: errors include full path like "[parent]: [child]: [field]: error"
 *
 * Performance Considerations:
 * - All field validations run in parallel via Promise.all()
 * - Optional nested fields are skipped if not provided
 * - Simple delegation with minimal wrapper overhead
 *
 * Implementation:
 * Created using Validator.buildTargetRuleDecorator() which:
 * - Attaches validation metadata to the class property
 * - Enables property validation when validateTarget() is called
 * - Works seamlessly with other validation decorators
 *
 * @decorator
 * @property Applied to class properties to validate nested objects
 * @remarks
 * - Must be applied to class properties with decorated classes
 * - The property must be typed as the nested class
 * - Nested class should have validation decorators
 * - Supports partial data validation
 * - Errors include nested field information for clarity
 * @see Validator.validateNestedRule - Core validation logic
 * @see Validator.validateTarget - Parent validation method
 * @see Validator.buildTargetRuleDecorator - Decorator factory
 * @public
 */
// Create the base ValidateNested function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateNestedFunction = function ValidateNested(options: any) {
  return Validator.validateNestedRule(options);
};

// Mark it with a symbol so it can be reliably identified even in minified code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(validateNestedFunction as any)[Symbol.for('validatorNestedRuleMarker')] = true;

// Create a wrapper decorator that captures the target class
export const ValidateNested = Validator.buildTargetRuleDecorator(
  validateNestedFunction
);
