import { I18n } from '@/i18n';
import { InputFormatterResult } from '@/inputFormatter/types';
import { ClassConstructor, Dictionary } from '@/types';
import { CountryCode } from '@countries/types';

/**
 * ## Validation Result Type
 *
 * The fundamental return type for all validation operations in the validator system.
 * This union type represents the possible outcomes of any validation rule execution,
 * supporting both synchronous and asynchronous validation patterns.
 *
 * ### Union Members
 *
 * #### Synchronous Results
 * - **`boolean`**: Direct success/failure indication
 *   - `true`: Validation passed
 *   - `false`: Validation failed
 *
 * - **`string`**: Validation failure with error message
 *   - Contains the error message explaining why validation failed
 *   - Used when validation fails and provides specific feedback
 *
 * #### Asynchronous Results
 * - **`Promise<boolean | string>`**: Asynchronous validation result
 *   - Resolves to `true` for success
 *   - Resolves to `string` for failure with error message
 *   - Enables complex validations requiring I/O, network calls, or async operations
 *
 * ### Usage Patterns
 *
 * #### Synchronous Validation
 * ```typescript
 * function validateEmail(value: string): ValidatorResult {
 *   if (!value.includes("@")) {
 *     return "Invalid email format";  // string = failure
 *   }
 *   return true;  // boolean = success
 * }
 * ```
 *
 * #### Asynchronous Validation
 * ```typescript
 * async function validateUniqueUsername(username: string): Promise<ValidatorResult> {
 *   const exists = await checkUsernameInDatabase(username);
 *   if (exists) {
 *     return "Username already taken";  // Promise<string> = failure
 *   }
 *   return true;  // Promise<boolean> = success
 * }
 * ```
 *
 * #### In Validation Rules
 * ```typescript
 * const customRule: ValidatorRuleFunction = async ({ value }) => {
 *   // Synchronous check
 *   if (!value) return "Value is required";
 *
 *   // Asynchronous check
 *   const isValid = await externalValidationAPI(value);
 *   return isValid || "External validation failed";
 * };
 * ```
 *
 * ### Type Safety and Flexibility
 * This type provides maximum flexibility while maintaining type safety:
 * - **Synchronous rules** can return immediate results
 * - **Asynchronous rules** can perform complex operations
 * - **Error messages** provide detailed feedback
 * - **Boolean results** for simple pass/fail scenarios
 *
 * ### Integration with Validation System
 * All validation rule functions return this type, enabling:
 * - Consistent error handling across all rules
 * - Support for both sync and async validation logic
 * - Standardized result processing in the validator core
 * - Flexible error message generation and i18n support
 *
 * ### Best Practices
 *
 * #### Prefer Specific Error Messages
 * ```typescript
 * // ✅ Good: Specific error messages
 * return "Email must contain @ symbol";
 *
 * // ❌ Avoid: Generic failures
 * return false;
 * ```
 *
 * #### Handle Async Operations Properly
 * ```typescript
 * // ✅ Good: Proper async handling
 * const result = await externalCheck(value);
 * return result ? true : "Validation failed externally";
 *
 * // ❌ Avoid: Unhandled promises
 * return externalCheck(value);  // Returns Promise<Promise<...>>
 * ```
 *
 * #### Consistent Return Patterns
 * ```typescript
 * // ✅ Good: Consistent boolean/string returns
 * if (condition) return true;
 * return "Error message";
 *
 * // ❌ Avoid: Mixed return types without clear logic
 * if (success) return true;
 * if (warning) return "Warning message";
 * return false;  // Inconsistent with string returns above
 * ```
 *
 * @example
 * ```typescript
 * // Synchronous validation rule
 * function validateMinLength(value: string, minLength: number): ValidatorResult {
 *   if (value.length < minLength) {
 *     return `Must be at least ${minLength} characters long`;
 *   }
 *   return true;
 * }
 *
 * // Asynchronous validation rule
 * async function validateUniqueEmail(email: string): Promise<ValidatorResult> {
 *   try {
 *     const exists = await userRepository.exists({ email });
 *     return exists ? "Email already registered" : true;
 *   } catch (error) {
 *     return "Unable to verify email uniqueness";
 *   }
 * }
 * ```
 *
 * @public
 *
 * @see {@link ValidatorRuleFunction} - Functions that return this type
 * @see {@link ValidatorValidateResult} - Higher-level validation results
 * @see {@link Validator.validate} - Main validation method
 */
export type ValidatorResult = boolean | string | Promise<boolean | string>;

/**
 * ## Validation Rule Type
 *
 * The core union type representing all possible ways to specify a validation rule in the validator system.
 * This type provides maximum flexibility by supporting multiple rule specification formats while maintaining
 * type safety and runtime validation capabilities.
 *
 * ### Purpose
 * Defines the complete set of valid rule specifications that can be used in validation operations.
 * Supports four different rule formats to accommodate various use cases and developer preferences.
 *
 * ### Union Members
 *
 * #### 1. Function Rules (`ValidatorRuleFunction`)
 * Custom validation logic defined as functions. Most flexible but requires implementation.
 * ```typescript
 * ({ value, context }) => value.length > 5
 * ```
 *
 * #### 2. Named Rules (`ValidatorRuleName`)
 * Simple string references to built-in validation rules. Most concise format.
 * ```typescript
 * "Required" | "Email" | "MinLength" | etc.
 * ```
 *
 * #### 3. Parameterized Rules (Template Literal)
 * Built-in rules with parameters specified in string format. Readable and concise.
 * ```typescript
 * "MinLength[5]" | "MaxLength[100]" | "NumberBetween[0,100]"
 * ```
 *
 * #### 4. Object Rules (`ValidatorRuleObject`)
 * Structured object format with type-safe parameters. Most type-safe format.
 * ```typescript
 * { MinLength: [5] } | { Email: [] } | { NumberBetween: [0, 100] }
 * ```
 *
 * ### Type Parameters
 * - **TParams**: Array type for rule parameters (default: `Array<any>`)
 * - **Context**: Type of optional validation context (default: `unknown`)
 *
 * ### Usage Examples
 *
 * #### Mixed Rule Array
 * ```typescript
 * const rules: ValidatorRules = [
 *   "Required",                    // Named rule
 *   "MinLength[3]",               // Parameterized rule
 *   { MaxLength: [50] },          // Object rule
 *   ({ value }) => value !== "",  // Function rule
 * ];
 * ```
 *
 * #### Type-Safe Rule Creation
 * ```typescript
 * // All these are valid ValidatorRule instances
 * const rule1: ValidatorRule = "Email";
 * const rule2: ValidatorRule = "MinLength[5]";
 * const rule3: ValidatorRule = { Required: [] };
 * const rule4: ValidatorRule = ({ value }) => typeof value === 'string';
 * ```
 *
 * #### In Validation Operations
 * ```typescript
 * // Single rule validation
 * const result = await Validator.validate({
 *   value: "test@example.com",
 *   rules: "Email",  // ValidatorRule
 * });
 *
 * // Multiple rules validation
 * const multiResult = await Validator.validate({
 *   value: "hello",
 *   rules: ["Required", "MinLength[3]", { MaxLength: [10] }],  // ValidatorRule[]
 * });
 * ```
 *
 * ### Rule Resolution Process
 * When a rule is processed, the system:
 * 1. **Identifies the format** based on the union member
 * 2. **Resolves to a function** using {@link Validator.getRule}
 * 3. **Applies parameters** if specified
 * 4. **Executes validation** with value and context
 *
 * ### Type Safety Benefits
 * - **Compile-time validation** of rule names and parameters
 * - **IDE autocomplete** for built-in rules
 * - **Refactoring safety** - rule signature changes are caught
 * - **Runtime safety** - invalid rules are rejected during parsing
 *
 * ### Performance Considerations
 * - **Function rules**: Fastest (direct execution)
 * - **Named rules**: Fast (lookup table)
 * - **Parameterized rules**: Medium (parsing required)
 * - **Object rules**: Medium (type mapping required)
 *
 * ### Best Practices
 *
 * #### Choose Rule Format Wisely
 * ```typescript
 * // ✅ Use named rules for simple cases
 * const simpleRules = ["Required", "Email"];
 *
 * // ✅ Use parameterized rules for single parameters
 * const lengthRules = ["MinLength[5]", "MaxLength[100]"];
 *
 * // ✅ Use object rules for complex parameters or type safety
 * const complexRules = [{ NumberBetween: [0, 100] }];
 *
 * // ✅ Use function rules for custom logic
 * const customRules = [({ value }) => value % 2 === 0];
 * ```
 *
 * #### Combine Rule Types
 * ```typescript
 * const comprehensiveRules: ValidatorRules = [
 *   "Required",           // Built-in
 *   "MinLength[3]",      // Parameterized
 *   { Email: [] },       // Object (type-safe)
 *   ({ value, context }) => {  // Custom function
 *     return context?.allowSpecialChars || !/[!@#$%]/.test(value);
 *   },
 * ];
 * ```
 *
 * ### Error Handling
 * Invalid rules are caught during validation:
 * ```typescript
 * // These will throw validation errors:
 * const invalid1 = "UnknownRule";        // Rule doesn't exist
 * const invalid2 = "MinLength[abc]";     // Invalid parameter type
 * const invalid3 = { UnknownRule: [] };  // Unknown rule name
 * ```
 *
 * ### Relationship to Validation System
 * This type is the foundation of the validation system and is used by:
 * - All validation decorators and rule builders
 *
 * @template TParams - Array type for rule parameters, defaults to any array
 * @template Context - Type of optional validation context, defaults to unknown
 *
 * @example
 * ```typescript
 * // Define flexible validation rules
 * type UserRules = ValidatorRule[];
 *
 * const userValidationRules: UserRules = [
 *   "Required",
 *   "MinLength[2]",
 *   { MaxLength: [50] },
 *   ({ value }) => !/\s/.test(value),  // No spaces
 * ];
 *
 * // Use in validation
 * const result = await Validator.validate({
 *   value: "john_doe",
 *   rules: userValidationRules,
 * });
 * ```
 *
 *
 * @see {@link ValidatorRuleFunction} - Function-based rules
 * @see {@link ValidatorRuleName} - Built-in rule names
 * @see {@link ValidatorRuleObject} - Object-based rules
 * @see {@link ValidatorRuleParamTypes} - Built-in rule definitions
 * @see {@link Validator} - Main validation class
 * @public
 */
export type ValidatorRule<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRuleFunction<TParams, Context>
  | ValidatorOptionalOrEmptyRuleNames
  | ValidatorRuleObject;

/**
 * @typedef {ValidatorOptionalOrEmptyRuleNames}
 * Union of rule names whose **runtime parameter list** is either
 *  - completely empty (`[]`), or
 *  - contains only optional elements (e.g. `[countryCode?: string]`).
 *
 * These are the rules that can be invoked without supplying arguments
 * or whose arguments are truly optional at the call-site.
 *
 * ┌-------------------------------------------------------------------------┐
 * │  EXAMPLES                                                               │
 * │  ----------                                                             │
 * │  ✔  "Email"                // Array<[]>                                │
 * │  ✔  "PhoneNumber"          // Array<[countryCode?: string]>            │
 * │  ✘  "Length"               // Array<[number, number?]>        │
 * │  ✘  "NumberLessThan"       // Array<[number]>                          │
 * └-------------------------------------------------------------------------┘
 *
 * The type is built in two steps:
 *  1. `ExtractOptionalOrEmptyKeys` keeps the keys whose tuple is empty or
 *     fully optional (see helper below).
 *  2. `& keyof ValidatorRuleParamTypes` is a sanity filter that guarantees we
 *     never leak alien keys should the utility mis-behave.
 */
export type ValidatorOptionalOrEmptyRuleNames =
  ExtractOptionalOrEmptyKeys<ValidatorRuleParamTypes>;

/**
 * ## Tuple Allows Empty Type
 *
 * A conditional type that determines if a tuple type allows empty invocation (no arguments).
 * This type is fundamental to the validator's parameter system, enabling type-safe determination
 * of which validation rules can be called without supplying arguments.
 *
 * ### Purpose
 * Provides compile-time type safety for determining whether validation rule parameter tuples
 * support empty invocation. This is crucial for distinguishing between rules that require
 * parameters (like `MinLength[5]`) and rules that can be called without them (like `Required`).
 *
 * ### Type Logic
 * The type uses conditional type checking to evaluate tuple structures:
 * - **Empty tuples `[]`**: Always allow empty invocation (returns `true`)
 * - **Non-empty tuples**: Check if empty array is assignable using `[] extends T`
 *   - If assignable: All parameters are optional (returns `true`)
 *   - If not assignable: At least one parameter is required (returns `false`)
 *
 * ### Examples
 *
 * #### Empty Parameter Rules (returns `true`)
 * ```typescript
 * // Rules with no parameters - can be called without arguments
 * type EmailParams = [];                                    // true
 * type RequiredParams = [];                                 // true
 * type PhoneParams = [countryCode?: string];               // true (optional param)
 * type NullableParams = [];                                 // true
 * ```
 *
 * #### Required Parameter Rules (returns `false`)
 * ```typescript
 * // Rules with required parameters - must be called with arguments
 * type MinLengthParams = [number];                          // false
 * type MaxLengthParams = [number];                          // false
 * type LengthParams = [number, number?];                   // false (first param required)
 * type NumberBetweenParams = [number, number];             // false
 * ```
 *
 * ### Usage in Validation System
 * This type is used internally by the validator to:
 * - **Generate rule unions**: Create {@link ValidatorOptionalOrEmptyRuleNames}
 * - **Type parameter extraction**: Determine which rules can be called without args
 * - **Rule registry filtering**: Separate parameterless from parameterized rules
 *
 * ### Advanced Type-Level Operations
 * ```typescript
 * // Extract rules that can be called without parameters
 * type ParameterlessRules = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends true ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 *
 * // Extract rules that require parameters
 * type ParameterizedRules = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends false ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ExtractOptionalOrEmptyKeys} to filter rule parameter types
 * - **Enables**: {@link ValidatorOptionalOrEmptyRuleNames} union type creation
 * - **Supports**: Type-safe rule invocation without parameters
 * - **Foundation**: Core type for parameter validation logic
 *
 * ### Type Safety Benefits
 * - **Compile-time validation**: Prevents calling parameterized rules without args
 * - **IDE support**: Better autocomplete for parameterless rules
 * - **Refactoring safety**: Changes to rule parameters are caught by TypeScript
 * - **Runtime safety**: Ensures proper parameter handling in rule implementations
 *
 * ### Implementation Details
 * The type uses advanced TypeScript conditional types and assignability checks:
 * - `T extends []`: Direct check for empty tuple literals
 * - `[] extends T`: Covariant assignability check for optional parameters
 * - This correctly handles both mutable and readonly array types
 *
 * ### Best Practices
 *
 * #### When Adding New Rules
 * ```typescript
 * // ✅ Parameterless rules (can be called as "RuleName")
 * Required: [];                    // No parameters needed
 * Email: [];                       // No parameters needed
 * PhoneNumber: [countryCode?: string]; // Optional parameter
 *
 * // ❌ Parameterized rules (must be called as "RuleName[param]")
 * MinLength: [number];             // Required parameter
 * MaxLength: [number];             // Required parameter
 * Length: [number, number?];       // First parameter required
 * ```
 *
 * #### Type-Level Programming
 * ```typescript
 * // Create union of parameterless rule names
 * type ParameterlessRuleNames = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends true ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 * // Result: "Required" | "Email" | "PhoneNumber" | "Empty" | "Nullable" | "Optional"
 * ```
 *
 * @template T - The tuple type to check (must extend Array<any>)
 *
 * @public
 *
 * @see {@link ValidatorOptionalOrEmptyRuleNames} - Union type created using this
 * @see {@link ExtractOptionalOrEmptyKeys} - Helper type that uses this
 * @see {@link ValidatorRuleParamTypes} - Rule parameter definitions checked by this
 * @see {@link ValidatorRuleName} - Rule names validated by this type
 */
export type ValidatorTupleAllowsEmpty<T extends Array<unknown>> = T extends []
  ? true
  : [] extends T
    ? true
    : false;

/**
 * Extracts keys whose rule parameter tuple is empty or fully optional.
 * This correctly captures cases like `[countryCode?: CountryCode]`.
 */
type ExtractOptionalOrEmptyKeys<T> = {
  [K in keyof T]: T[K] extends Array<unknown>
    ? ValidatorTupleAllowsEmpty<T[K]> extends true
      ? K
      : never
    : never;
}[keyof T];

/**
 * ## Validation Rule Object Type
 *
 * Represents a structured object format for specifying validation rules with their parameters.
 * This type creates a mapped type that ensures type safety when defining rules as objects
 * rather than strings or functions.
 *
 * ### Purpose
 * Provides a strongly-typed way to specify validation rules with parameters using object notation.
 * This is particularly useful when you need to ensure type safety for rule parameters at compile time.
 *
 * ### Type Structure
 * This is a mapped type that creates an object where:
 * - **Key**: Must be a valid `ValidatorRuleName` (e.g., "MinLength", "Email", etc.)
 * - **Value**: Must match the parameter type defined in `ValidatorRuleParamTypes` for that rule
 *
 * ### Generated Structure
 * For each rule in `ValidatorRuleParamTypes`, this type generates an object like:
 * ```typescript
 * {
 *   MinLength: [number];        // Requires array with one number
 *   Email: [];                  // Requires empty array
 *   NumberBetween: [number, number]; // Requires array with two numbers
 * }
 * ```
 *
 * ### Usage Examples
 *
 * #### Basic Rule Objects
 * ```typescript
 * // Valid rule objects
 * const minLengthRule: ValidatorRuleObject = {
 *   MinLength: [5]  // Must be array with one number
 * };
 *
 * const emailRule: ValidatorRuleObject = {
 *   Email: []  // Must be empty array
 * };
 *
 * const betweenRule: ValidatorRuleObject = {
 *   NumberBetween: [0, 100]  // Must be array with two numbers
 * };
 * ```
 *
 * #### In Validation Rules Array
 * ```typescript
 * const rules: ValidatorRules = [
 *   "Required",                    // String rule
 *   "MinLength[5]",               // Parameterized string rule
 *   { MinLength: [5] },           // Object rule (this type)
 *   ({ value }) => value > 0,     // Function rule
 * ];
 * ```
 *
 * #### Type Safety Benefits
 * ```typescript
 * // TypeScript will catch these errors:
 * const invalid1: ValidatorRuleObject = {
 *   MinLength: 5  // ❌ Error: Must be array, not number
 * };
 *
 * const invalid2: ValidatorRuleObject = {
 *   MinLength: [5, 10]  // ❌ Error: MinLength only takes one parameter
 * };
 *
 * const invalid3: ValidatorRuleObject = {
 *   UnknownRule: []  // ❌ Error: UnknownRule not in ValidatorRuleName
 * };
 * ```
 *
 * ### Relationship to Other Rule Types
 * This type is one of four union members in {@link ValidatorRule}:
 * - `ValidatorRuleFunction` - Custom validation functions
 * - `ValidatorRuleName` - Simple rule names (strings)
 * - `` `${ValidatorRuleName}[${string}]` `` - Parameterized rule strings
 * - `ValidatorRuleObject` - Structured rule objects (this type)
 *
 * ### When to Use
 * Use this type when you need:
 * - **Type Safety**: Compile-time validation of rule parameters
 * - **IDE Support**: Better autocomplete and error detection
 * - **Complex Parameters**: Rules with multiple typed parameters
 * - **Refactoring Safety**: Changes to rule signatures are caught by TypeScript
 *
 * ### Comparison with String Rules
 * | Aspect | Object Rules | String Rules |
 * |--------|-------------|--------------|
 * | Type Safety | ✅ Full compile-time checking | ⚠️ Runtime parameter validation |
 * | Autocomplete | ✅ Parameter types shown | ❌ No parameter hints |
 * | Refactoring | ✅ Breaking changes caught | ❌ May break silently |
 * | Readability | ✅ Self-documenting | ⚠️ Requires knowledge of syntax |
 * | Flexibility | ✅ Strongly typed | ✅ Dynamic |
 *
 * @template Context - Type of the optional validation context
 *
 * @example
 * ```typescript
 * // Define rules with full type safety
 * const userRules: ValidatorRules = [
 *   { Required: [] },
 *   { Email: [] },
 *   { MinLength: [3] },
 *   { MaxLength: [50] },
 * ];
 *
 * // TypeScript ensures parameter types match
 * const result = await Validator.validate({
 *   value: "test@example.com",
 *   rules: userRules,
 * });
 * ```
 *
 *
 * @see {@link ValidatorRule} - Union type that includes this
 * @see {@link ValidatorRuleName} - Valid rule names
 * @see {@link ValidatorRuleParamTypes} - Parameter type definitions
 * @see {@link ValidatorRuleFunction} - Function-based rules
 * @public
 */
export type ValidatorRuleObject = Partial<{
  [K in ValidatorRuleName]: ValidatorRuleParamTypes[K];
}>;

/**
 * Represents an array of validation rules to be applied to a value.
 *
 * This type defines a collection of validation rules that will be executed
 * in sequence against a single value. Each rule in the array can be specified
 * in various formats and will be processed by the validator.
 *
 * @template Context - The type of the optional validation context
 *
 * @example
 * ```typescript
 * // Using rule names
 * const rules1: ValidatorRules = ["Required", "Email"];
 *
 * // Using parameterized rules
 * const rules2: ValidatorRules = ["Required", "MinLength[5]", "MaxLength[100]"];
 *
 * // Using validation functions
 * const rules3: ValidatorRules = [
 *   "Required",
 *   ({ value }) => value.length >= 5 || "Too short"
 * ];
 *
 * // Using rule objects
 * const rules4: ValidatorRules = [
 *   { ruleName: "Required" },
 *   { ruleName: "MinLength", params: [8] }
 * ];
 * ```
 *
 * @public
 *
 * @see {@link ValidatorRule} - Individual rule type
 * @see {@link ValidatorValidateOptions} - Options interface that uses this type
 * @see {@link Validator.validate} - Validation method that accepts these rules
 */
export type ValidatorRules<Context = unknown> = Array<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValidatorRule<Array<any>, Context>
>;
/**
 * @typedef ValidatorSanitizedRule
 * Represents a sanitized validation rule.
 *
 * This type can either be a validation rule function or an object that contains
 * detailed information about a validation rule, including its name, parameters,
 * and the function that implements the validation logic.
 *
 * @example
 * // Example of a validation rule function
 * const minLengthRule: ValidatorSanitizedRule = ({ value }) => {
 *     return value.length >= 5 || "Minimum length is 5 characters.";
 * };
 *
 * // Example of a sanitized rule object
 * const sanitizedRule: ValidatorSanitizedRule = {
 *     ruleName: "minLength",
 *     params: [5],
 *     ruleFunction: minLengthRule,
 * };
 */
export type ValidatorSanitizedRule<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRuleFunction<TParams, Context>
  | ValidatorSanitizedRuleObject<TParams>;

/**
 * ## Sanitized Rule Object
 *
 * Represents a structured object containing parsed and sanitized validation rule information.
 * This interface defines the shape of objects that contain all the necessary details
 * for executing a validation rule after it has been processed from its raw form.
 *
 * ### Purpose
 * After validation rules are parsed from strings like "MinLength[5]" or objects like
 * `{ ruleName: "Required" }`, they are converted into this standardized object format
 * that contains all the information needed to execute the validation.
 *
 * ### Properties Overview
 * - **ruleName**: The parsed rule identifier (e.g., "MinLength")
 * - **params**: Array of parameters extracted from the rule (e.g., `[5]`)
 * - **ruleFunction**: The actual validation function to execute
 * - **rawRuleName**: The original unparsed rule string (e.g., "MinLength[5]")
 *
 * ### Usage in Validation Pipeline
 * ```typescript
 * // Raw rule input
 * const rawRule = "MinLength[8]";
 *
 * // After parsing/sanitization
 * const sanitizedRule: ValidatorSanitizedRuleObject = {
 *   ruleName: "MinLength",
 *   params: [8],
 *   ruleFunction: minLengthFunction,
 *   rawRuleName: "MinLength[8]"
 * };
 *
 * // During validation
 * const result = await sanitizedRule.ruleFunction({
 *   value: "password123",
 *   ruleParams: sanitizedRule.params,
 *   // ... other options
 * });
 * ```
 *
 * ### Relationship to ValidatorSanitizedRule
 * This interface is one of the union members of {@link ValidatorSanitizedRule}.
 * The union allows rules to be represented as either:
 * - A direct function (`ValidatorRuleFunction`)
 * - A structured object (`ValidatorSanitizedRuleObject`)
 *
 * @template TParams - The type of parameters that the rule accepts (default: Array<any>)
 * @template Context - The type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorSanitizedRule} - Union type that includes this interface
 * @see {@link ValidatorRuleFunction} - The validation function type
 * @see {@link ValidatorRuleName} - Rule name type
 */
export interface ValidatorSanitizedRuleObject<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> {
  /**
   * The parsed name of the validation rule
   *
   * This is the rule identifier extracted from the original rule specification.
   * For example, if the raw rule was "MinLength[5]", this would be "MinLength".
   * Must be a valid rule name from {@link ValidatorRuleName}.
   *
   * @type {ValidatorRuleName}
   * @example "MinLength"
   * @example "Required"
   * @example "Email"
   *
   * @see {@link ValidatorRuleName}
   */
  ruleName: ValidatorRuleName;

  /**
   * The parameters extracted from the rule specification
   *
   * Array of values that were parsed from the rule's parameter brackets.
   * For example, "MinLength[5,10]" would result in `[5, 10]`.
   * Empty array for rules that don't take parameters.
   *
   * @type {TParams}
   * @example [] // For "Required" rule
   * @example [5] // For "MinLength[5]" rule
   * @example [0, 100] // For "NumberBetween[0,100]" rule
   */
  params: TParams;

  /**
   * The validation function that implements the rule logic
   *
   * The actual executable function that performs the validation.
   * This function receives validation options and returns a result
   * indicating whether the validation passed or failed.
   *
   * @type {ValidatorRuleFunction<TParams>}
   * @see {@link ValidatorRuleFunction}
   */
  ruleFunction: ValidatorRuleFunction<TParams, Context>;

  /**
   * The original unparsed rule specification
   *
   * The raw rule string as it was originally provided, before parsing.
   * This is useful for error reporting and debugging, as it shows
   * exactly what the user specified.
   *
   * @type {ValidatorRuleName | string}
   * @example "MinLength[5]"
   * @example "Required"
   * @example "Email"
   */
  rawRuleName: ValidatorRuleName | string;
}
/**
 * @typedef ValidatorSanitizedRules
 * Represents an array of sanitized validation rules.
 *
 * This type is a collection of sanitized rules, allowing for multiple
 * validation rules to be applied in a structured manner.
 *
 * @template Context The type of the optional validation context.
 *
 * @example
 * const sanitizedRules: ValidatorSanitizedRules = [
 *     {
 *         ruleName: "required",
 *         params: [],
 *         ruleFunction: ({ value }) => !!value || "This field is required.",
 *     },
 *     {
 *         ruleName: "minLength",
 *         params: [5],
 *         ruleFunction: ({ value }) => value.length >= 5 || "Minimum length is 5 characters.",
 *     },
 * ];
 */
export type ValidatorSanitizedRules<Context = unknown> = ValidatorSanitizedRule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Array<any>,
  Context
>[];

/**
 * @typedef ValidatorRuleFunction
 *
 * Represents a validation rule function that is used within the validation system.
 * This function takes a set of options and performs validation on a given value,
 * returning the result of the validation process.
 *
 * @template TParams The type of the parameters that the rule function accepts.
 *
 * ### Structure:
 * - The function accepts a single parameter:
 *   - `options` (ValidatorValidateOptions): An object containing the necessary parameters for validation.
 *
 * ### Parameters:
 * - **options**: An object of type `ValidatorValidateOptions` which includes:
 *   - `rules`: A collection of validation rules to apply. This can be a single rule or an array of rules.
 *   - `rule`: An optional specific validation rule to apply, overriding the rules defined in the `rules` property.
 *   - `value`: The actual value that needs to be validated against the specified rules.
 *   - `ruleParams`: Optional parameters that may be required for specific validation rules.
 *
 * ### Return Value:
 * - The function returns an `ValidatorResult`, which can be one of the following:
 *   - A `Promise<boolean | string>`: Indicates asynchronous validation. If resolved to `true`, the validation has succeeded; if resolved to a `string`, it represents an error message indicating a validation failure.
 *   - A `string`: Represents an invalid validation result, where the string contains an error message.
 *   - A `boolean`: Indicates the success (`true`) or failure (`false`) of the validation.
 *
 * ### Example Usage:
 * ```typescript
 * const validateEmail: ValidatorRuleFunction = ({ value }) => {
 *     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     if (!emailPattern.test(value)) {
 *         return "Invalid email format."; // Invalid validation
 *     }
 *     return true; // Valid validation
 * };
 *
 * // Example of using the validation function
 * const result = validateEmail({ value: "test@example.com" });
 * if (typeof result === "string") {
 *     console.error(result); // Output: "Invalid email format." if validation fails
 * } else {
 *     console.log("Validation passed."); // Output: "Validation passed." if validation succeeds
 * }
 * ```
 *
 * ### Notes:
 * - This type is essential for defining custom validation logic in forms, allowing developers to create reusable and flexible validation rules.
 * - The function can be synchronous or asynchronous, depending on the validation logic implemented.
 */
export type ValidatorRuleFunction<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> = (options: ValidatorValidateOptions<TParams, Context>) => ValidatorResult;

/**
 * ## Validation Rule Parameters Type
 *
 * A conditional type that defines the parameter structure for validation rules.
 * This type handles both mutable and readonly array parameters, providing flexibility
 * for validation rules that accept different parameter formats.
 *
 * ### Type Behavior
 * - **Empty Arrays**: When `TParams` is an empty array `[]`, resolves to `[]`
 * - **Non-Empty Arrays**: Resolves to either the original `TParams` or its readonly variant `Readonly<TParams>`
 * - **Readonly Support**: Accepts both `Array<any>` and `ReadonlyArray<any>` as input types
 *
 * ### Purpose
 * This type enables validation rules to accept parameters in multiple formats:
 * - Regular arrays: `[minLength: number]` for `MinLength[5]`
 * - Readonly arrays: `readonly [minLength: number]` for const assertions
 * - Empty parameters: `[]` for rules like `Required` that take no parameters
 *
 * ### Generic Parameters
 * - **TParams**: The parameter array type (must extend `Array<any>` or `ReadonlyArray<any>`)
 * - **Context**: Optional context type (defaults to `unknown`)
 *
 * ### Usage in Rule Definitions
 * ```typescript
 * // Rule that takes a single number parameter
 * MinLength: ValidatorRuleParams<[minLength: number]>;
 *
 * // Rule that takes min and max number parameters
 * Length: ValidatorRuleParams<[lengthOrMin: number, maxLength?: number]>;
 *
 * // Rule that takes no parameters
 * Required: ValidatorRuleParams<[]>;
 *
 * // Rule that accepts readonly arrays (e.g., const assertions)
 * IsEnum: ValidatorRuleParams<ReadonlyArray<string>>;
 * ```
 *
 * ### Type Resolution Examples
 * ```typescript
 * // Empty array resolves to empty array
 * type RequiredParams = ValidatorRuleParams<[]>; // []
 *
 * // Single parameter array
 * type MinLengthParams = ValidatorRuleParams<[number]>; // [number] | readonly [number]
 *
 * // Multiple parameters
 * type BetweenParams = ValidatorRuleParams<[number, number]>; // [number, number] | readonly [number, number]
 * ```
 *
 * ### Relationship to Validation System
 * - Used by {@link ValidatorRuleParamTypes} to define parameter types for each rule
 * - Compatible with {@link ValidatorRuleFunction} parameter signatures
 * - Supports both mutable and immutable parameter arrays for flexibility
 *
 * @template TParams - The parameter array type (extends Array<any> | ReadonlyArray<any>)
 * @template Context - Optional context type for validation (defaults to unknown)
 *
 * @public
 *
 * @see {@link ValidatorRuleParamTypes} - Uses this type for rule parameter definitions
 * @see {@link ValidatorRuleFunction} - Validation function that receives these parameters
 * @see {@link ValidatorRule} - Complete rule definition including this parameter type
 */
export type ValidatorRuleParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TParams extends Array<any> | ReadonlyArray<any> = Array<any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Context = unknown,
> = TParams extends [] ? [] : TParams;

/**
 * ## Nested Rule Function Options
 *
 * Configuration interface for validating nested objects or complex data structures
 * within the validation system. This interface is specifically designed for rule functions
 * that need to validate target objects (classes with decorators) rather than simple values.
 *
 * ### Purpose
 * Provides a specialized options interface for validation rule functions that operate on
 * nested or complex data structures. Unlike {@link ValidatorValidateOptions} which handles
 * single values, this interface is tailored for scenarios where validation rules need to
 * work with entire class instances or nested object hierarchies.
 *
 * ### Key Differences from ValidatorValidateOptions
 * - **Extends from ValidatorValidateTargetOptions**: Inherits target-specific properties
 * - **Omits "data" property**: Uses its own `data` property instead
 * - **Optional value property**: Accepts target data instead of single values
 * - **Flexible data property**: Allows any record structure for nested validation
 *
 * ### Inheritance Structure
 * ```
 * ValidatorNestedRuleFunctionOptions
 *   ↳ extends Omit<ValidatorValidateTargetOptions<Target, Context, [target: Target]>, "data">
 *     ↳ extends Omit<ValidatorValidateOptions<TParams, Context>, "data" | "rule" | "value">
 *       ↳ extends Omit<Partial<InputFormatterResult>, "value">
 *         ↳ extends BaseData<Context>
 * ```
 *
 * ### Generic Parameters
 * - **Target**: The class constructor type being validated (extends `ClassConstructor`)
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 *
 * ### Properties Overview
 *
 * #### Inherited Properties
 * - **rules**: Array of validation rules to apply
 * - **ruleParams**: Parameters for the current rule
 * - **ruleName**: Name of the validation rule
 * - **rawRuleName**: Original unparsed rule name
 * - **message**: Custom error message
 * - **fieldName**: Form field identifier
 * - **propertyName**: Object property name
 * - **translatedPropertyName**: Localized property name
 * - **i18n**: Internationalization instance
 * - **sanitizedRules**: Preprocessed rules
 * - **startTime**: Performance tracking timestamp
 * - **errorMessageBuilder**: Custom error message builder
 * - **parentData**: Parent context for nested validations
 *
 * #### Own Properties
 * - **value**: Optional target data to validate
 * - **data**: Flexible data object for nested validation context
 *
 * ### Usage in Nested Validation
 * ```typescript
 * class UserProfile {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @ValidateNested
 *   address: Address;
 * }
 *
 * // Custom nested validation rule
 * const validateNestedProfile: ValidatorRuleFunction<
 *   [target: UserProfile],
 *   ValidationContext
 * > = async (options: ValidatorNestedRuleFunctionOptions<UserProfile, ValidationContext>) => {
 *   const { value, data, context } = options;
 *
 *   // Validate the nested profile
 *   if (value && typeof value === 'object') {
 *     // Perform nested validation logic
 *     const result = await Validator.validateTarget(UserProfile, value);
 *     return result.success || "Profile validation failed";
 *   }
 *
 *   return true;
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateNestedRule} method
 * - **Complements**: {@link ValidatorValidateTargetOptions} for target validation
 * - **Extends**: {@link ValidatorValidateOptions} with target-specific modifications
 * - **Supports**: Complex nested object validation scenarios
 *
 * ### Common Use Cases
 *
 * #### 1. Nested Object Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<User, Context> = {
 *   value: userInstance,        // Full user object
 *   data: { parentForm: form }, // Additional context
 *   propertyName: "user",       // Property being validated
 *   context: validationContext, // Typed context
 * };
 * ```
 *
 * #### 2. Array of Objects Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<Item[], Context> = {
 *   value: itemsArray,          // Array of items
 *   data: { index: 0 },         // Current index context
 *   propertyName: "items",      // Array property name
 * };
 * ```
 *
 * #### 3. Conditional Nested Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<Address, Context> = {
 *   value: addressData,         // Address object (if present)
 *   data: { required: true },   // Validation requirements
 *   propertyName: "shippingAddress",
 *   context: { userType: "premium" },
 * };
 * ```
 *
 * ### Type Safety Benefits
 * - **Compile-time validation** of target types
 * - **Type-safe property access** on nested objects
 * - **Context propagation** through validation hierarchy
 * - **Flexible data structures** for complex validation scenarios
 *
 * ### Performance Considerations
 * - **Target validation overhead**: More expensive than single-value validation
 * - **Parallel processing**: Multiple nested validations can run concurrently
 * - **Memory usage**: Larger data structures require more memory
 * - **Serialization**: Complex objects may need special handling
 *
 * @template Target - The class constructor type being validated (must extend ClassConstructor)
 * @template Context - Optional context type for validation (defaults to unknown)
 *
 * @public
 *
 * @see {@link ValidatorValidateTargetOptions} - Base target validation options
 * @see {@link ValidatorValidateOptions} - Single-value validation options
 * @see {@link Validator.validateNestedRule} - Method that uses this interface
 * @see {@link ValidatorValidateTargetData} - Target data type
 * @see {@link ClassConstructor} - Class constructor constraint
 */
export interface ValidatorNestedRuleFunctionOptions<
  Target extends ClassConstructor = ClassConstructor,
  Context = unknown,
> extends Omit<
    ValidatorValidateTargetOptions<Target, Context, [target: Target]>,
    'data'
  > {
  value?: ValidatorValidateTargetData<Target>;

  data?: Dictionary;
}

/**
 * @interface ValidatorRuleName
 * Represents the name of a validation rule as defined in the `ValidatorRuleParamTypes`.
 *
 * The `ValidatorRuleName` type is a union of string literal types that correspond to the keys
 * of the `ValidatorRuleParamTypes` interface. This allows for type-safe access to the names of
 * validation rules, ensuring that only valid rule names can be used in contexts where a rule name
 * is required.
 *
 * ### Structure:
 * - The type is derived from the keys of the `ValidatorRuleParamTypes`, meaning it will include
 *   all the rule names defined in that map.
 *
 * ### Example:
 *
 * ```typescript
 * const ruleName: ValidatorRuleName = "required"; // Valid
 * const anotherRuleName: ValidatorRuleName = "minLength"; // Valid
 *
 * // Usage in a function that accepts a rule name
 * function getValidationRule(ruleName: ValidatorRuleName) {
 *     return validationRules[ruleName];
 * }
 *
 * const rule = getValidationRule("maxLength"); // Valid usage
 * // const invalidRule = getValidationRule("unknownRule"); // TypeScript will throw an error
 * ```
 *
 * This type enhances type safety in your code by ensuring that only valid validation rule names
 * can be used, reducing the risk of runtime errors due to typos or invalid rule names.
 */
export type ValidatorRuleName = keyof ValidatorRuleParamTypes & string;
/**
 * ## Validation Rules Parameter Map
 *
 * Central type definition mapping validation rule names to their parameter signatures.
 * This interface serves as the authoritative source for all built-in validation rules,
 * defining the exact parameter types each rule accepts.
 *
 * ### Purpose
 * Provides compile-time type safety for validation rule parameters across the entire
 * validation system. Each property represents a built-in validation rule and its
 * expected parameter structure. This is a static interface with no generics.
 *
 * ### Type Structure
 * - **Key**: Rule name (string literal from {@link ValidatorRuleName})
 * - **Value**: Parameter array type (extends {@link ValidatorRuleParams})
 *
 * ### Parameter Type Patterns
 * - **Empty Arrays `[]`**: Rules that take no parameters (e.g., "Required", "Email")
 * - **Single Parameters `[Type]`**: Rules with one required parameter (e.g., "MinLength[number]")
 * - **Optional Parameters `[Type?]`**: Rules with optional parameters (e.g., "PhoneNumber[string?]")
 * - **Multiple Parameters `[Type1, Type2]`**: Rules with multiple required parameters
 * - **Complex Parameters**: Rules with mixed required/optional parameters
 *
 * ### Usage in Type System
 * This interface is used throughout the validator to:
 * - Type-check rule parameters at compile time
 * - Generate {@link ValidatorRuleName} union type
 * - Create {@link ValidatorRuleFunctionsMap} registry type
 * - Validate rule definitions in rule implementation files
 *
 * ### Rule Categories
 *
 * #### Presence Validation
 * - **Required**: Ensures value is present and not empty
 * - **Nullable**: Allows null/undefined values (skips validation)
 * - **Optional**: Allows undefined values (skips validation)
 * - **Empty**: Allows empty strings (validation skipped if "")
 *
 * #### Type Validation
 * - **String**: Validates value is a string
 * - **Number**: Validates value is a number
 * - **NonNullString**: Validates value is a non-null string
 *
 * #### String Validation
 * - **MinLength**: Minimum character length requirement
 * - **MaxLength**: Maximum character length limit
 * - **Length**: Exact length or length range (min and optional max)
 * - **FileName**: Valid file name format
 *
 * #### Numeric Validation
 * - **NumberGreaterThan**: Value must be greater than specified number
 * - **NumberGreaterThanOrEqual**: Value must be >= specified number
 * - **NumberLessThan**: Value must be less than specified number
 * - **NumberLessThanOrEqual**: Value must be <= specified number
 * - **NumberEqual**: Value must equal specified number
 * - **NumberIsDifferentFrom**: Value must differ from specified number
 *
 * #### Format Validation
 * - **Email**: Valid email address format
 * - **Url**: Valid URL format
 * - **PhoneNumber**: Valid phone number (with optional country code)
 * - **EmailOrPhoneNumber**: Valid email or phone number
 *
 * ### Parameter Examples
 * ```typescript
 * // Rules with no parameters
 * Required: ValidatorRuleParams<[]>;           // "Required"
 * Email: ValidatorRuleParams<[]>;              // "Email"
 *
 * // Rules with single parameters
 * MinLength: ValidatorRuleParams<[number]>;    // "MinLength[5]"
 * NumberEqual: ValidatorRuleParams<[number]>;  // "NumberEqual[42]"
 *
 * // Rules with optional parameters
 * PhoneNumber: ValidatorRuleParams<[CountryCode?]>; // "PhoneNumber" or "PhoneNumber[US]"
 *
 * // Rules with multiple parameters
 * Length: ValidatorRuleParams<[number, number?]>; // "Length[5]" or "Length[5,10]"
 * ```
 *
 * ### Extending the Rules Map
 * When adding new validation rules:
 * 1. Add the rule name and parameter type to this interface
 * 2. Implement the rule function in the appropriate rule file
 * 3. Register the rule in the validator's rule registry
 * 4. Update rule name unions and type definitions as needed
 *
 * ### Relationship to Validation System
 * - **Foundation**: Base type for all rule definitions
 * - **Type Safety**: Ensures parameter type checking
 * - **Rule Discovery**: Used to generate valid rule names
 * - **Function Signatures**: Defines parameter types for rule functions
 * - **Runtime Validation**: Parameters validated against these types
 *
 * @public
 * @template Context - Type of the optional validation context
 * @see {@link ValidatorRuleName} - Union type derived from this interface's keys
 * @see {@link ValidatorRuleFunctionsMap} - Registry type using this interface
 * @see {@link ValidatorRuleParams} - Base parameter type for all rules
 * @see {@link Validator} - Main validator class that uses these rules
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ValidatorRuleParamTypes<Context = unknown> {
  /**
   * Validator rule that checks if a number is less than or equals a specified value.
   */
  NumberLessThanOrEqual: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a number is less than a specified value.
   */
  NumberLessThan: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a number is greater than or equals a specified value.
   */
  NumberGreaterThanOrEqual: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a number is greater than a specified value.
   */
  NumberGreaterThan: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a number is equal to a specified value.
   */
  NumberEqual: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a number is different from a specified value.
   */
  NumberIsDifferentFrom: ValidatorRuleParams<[number]>;

  /**
   * Validator rule that checks if a value is present and not empty.
   */
  Required: ValidatorRuleParams<[]>;

  /**
   * Validator rule that validates the length of a string.
   */
  Length: ValidatorRuleParams<[lengthOrMinLength: number, maxLength?: number]>;

  /**
   * Validator rule that checks if a string meets a minimum length requirement.
   */
  MinLength: ValidatorRuleParams<[minLength: number]>;

  /**
   * Validator rule that checks if a string does not exceed a maximum length.
   */
  MaxLength: ValidatorRuleParams<[maxLength: number]>;

  /**
   * Validator rule that checks if a value is a valid email address format.
   */
  Email: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a valid URL format.
   */
  Url: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a valid file name.
   */
  FileName: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a number.
   */
  Number: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a non-null string.
   */
  NonNullString: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a string.
   */
  String: ValidatorRuleParams<[]>;

  /**
   * Validator rule that checks if a value is a valid phone number.
   */
  PhoneNumber: ValidatorRuleParams<[countryCode?: CountryCode]>;

  /**
   * Validator rule that checks if a value is a valid email or phone number.
   */
  EmailOrPhoneNumber: ValidatorRuleParams<[]>;

  /**
   * Validator rule that marks a field as allowing empty strings (validation skipped if "").
   */
  Empty: ValidatorRuleParams<[]>;

  /**
   * Validator rule that marks a field as nullable (validation skipped if null or undefined).
   */
  Nullable: ValidatorRuleParams<[]>;

  /**
   * Validator rule that marks a field as sometimes validated (validation skipped if undefined).
   */
  Optional: ValidatorRuleParams<[]>;
}

export interface ValidatorValidateOptions<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> extends Omit<Partial<InputFormatterResult>, 'value'>,
    BaseData<Context> {
  /**
   * The list of validation rules to apply
   *
   * Array of rules that will be executed in sequence against the value.
   * Each rule can have its own parameters and configuration.
   *
   * @type {ValidatorRule[]}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "example@test.com",
   *   rules: [
   *     { ruleName: "Required" },
   *     { ruleName: "Email" },
   *     { ruleName: "MaxLength", params: [100] }
   *   ]
   * };
   * ```
   *
   * @see {@link ValidatorRule}
   */
  rules?: ValidatorRules<Context>;

  /**
   * Internal: Sanitized rules after preprocessing
   *
   * This property is used internally by the validator after rules have been
   * parsed and sanitized. Users typically do not need to set this manually.
   *
   * @type {ValidatorSanitizedRules<Context>}
   * @internal
   * @optional
   */
  sanitizedRules?: ValidatorSanitizedRules<Context>;

  /**
   * The current/primary validation rule being applied
   *
   * Specifies the specific rule to apply. Can be used to override or specify
   * a particular rule from the `rules` array, or to apply a single rule directly.
   *
   * @type {ValidatorRule<TParams, Context>}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "test",
   *   rule: { ruleName: "Required" },
   *   propertyName: "username"
   * };
   * ```
   *
   * @see {@link ValidatorRule}
   */
  rule?: ValidatorRule<TParams, Context>;

  /**
   * Parameters passed to the validation rule
   *
   * Contains the parameters required by the current rule. For example, for a
   * MinLength rule, this would be `[5]` to require minimum 5 characters.
   * These are typically extracted from raw rule names like "MinLength[5]".
   *
   * @type {TParams}
   * @optional
   *
   * @example
   * ```typescript
   * // For MinLength rule
   * const options: ValidatorValidateOptions = {
   *   value: "password123",
   *   rule: { ruleName: "MinLength" },
   *   ruleParams: [8],  // Minimum 8 characters
   *   propertyName: "password"
   * };
   *
   * // For NumberBetween rule
   * const options2: ValidatorValidateOptions = {
   *   value: 50,
   *   rule: { ruleName: "NumberBetween" },
   *   ruleParams: [0, 100],  // Between 0 and 100
   *   propertyName: "percentage"
   * };
   * ```
   */
  ruleParams?: TParams;

  /**
   * The name of the validation rule
   *
   * Identifies which validation rule is being applied. Examples include:
   * "Required", "Email", "MinLength", "MaxLength", "Regex", "Custom", etc.
   *
   * @type {ValidatorRuleName}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "user@example.com",
   *   ruleName: "Email",
   *   propertyName: "email"
   * };
   * ```
   *
   * @see {@link ValidatorRuleName}
   */
  ruleName?: ValidatorRuleName;

  /**
   * The raw rule name as originally specified (before parsing)
   *
   * The unparsed rule name including any parameters in brackets.
   * For example, "MinLength[5]" or "NumberGreaterThan[0]" before the name
   * and parameters are extracted into `ruleName` and `ruleParams`.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "test",
   *   rawRuleName: "MinLength[5]",        // Raw form
   *   ruleName: "MinLength",               // Parsed name
   *   ruleParams: [5],                     // Parsed params
   *   propertyName: "username"
   * };
   * ```
   */
  rawRuleName?: ValidatorRuleName | string;

  /**
   * Custom error message for validation failure
   *
   * Allows specifying a custom error message to display when validation fails.
   * If provided, this message will be used instead of the default rule-generated message.
   * Supports i18n translations and dynamic content.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "invalid-email",
   *   rules: ["Email"],
   *   message: "Please enter a valid email address (e.g., user@example.com)",
   *   propertyName: "email"
   * };
   *
   * // Custom message for specific context
   * const options2: ValidatorValidateOptions = {
   *   value: "short",
   *   rule: { ruleName: "MinLength" },
   *   ruleParams: [8],
   *   message: "Your password must be at least 8 characters for security",
   *   propertyName: "password"
   * };
   * ```
   */
  message?: string;

  /**
   * The form field name/identifier
   *
   * Identifies the field in a form or data structure. Typically used for
   * form attributes like `name="field_name"` or `id="field_id"`.
   * Used to map errors back to UI elements or log error context.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorValidateOptions = {
   *   value: "invalid@",
   *   rules: ["Email"],
   *   fieldName: "email_input",         // HTML form field ID
   *   propertyName: "email",            // JS object property name
   *   message: "Invalid email format"
   * };
   * ```
   */
  fieldName?: string;

  /**
   * The label of the field being validated
   *
   * Identifies the label of the field being validated.
   * This is typically the actual label of your data class.
   * Used for error reporting and mapping validation errors back to properties.
   * This is used to display the field label in the error message.
   * If translatedPropertyName is provided, it will have the same value otherwise it will be the fieldName.
   *
   * @type {string}
   * @optional
   */
  fieldLabel?: string;

  /**
   * The object property name being validated
   *
   * Identifies the property on the object/class being validated.
   * This is typically the actual property name on your data class.
   * Used for error reporting and mapping validation errors back to properties.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * class UserData {
   *   email: string;
   *   password: string;
   * }
   *
   * const options: ValidatorValidateOptions = {
   *   value: "invalid-email",
   *   rules: ["Email"],
   *   propertyName: "email",  // Maps to UserData.email
   *   fieldName: "email_field", // HTML field identifier
   *   message: "Invalid email"
   * };
   * ```
   */
  propertyName?: string;

  /**
   * The translated/localized property name
   *
   * A user-friendly or localized version of the property name for display in
   * error messages. For example, if `propertyName` is "user_birth_date",
   * `translatedPropertyName` might be "Date of Birth" in English or
   * "Date de Naissance" in French.
   *
   * This property is typically populated by the validator's translation system.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * // Before translation
   * const options: ValidatorValidateOptions = {
   *   value: "invalid",
   *   rules: ["Required"],
   *   propertyName: "user_phone_number"
   * };
   *
   * // After translation (populated by validator)
   * // options.translatedPropertyName = "Phone Number"
   * // options.message = "[Phone Number]: Must not be empty"
   * ```
   */
  translatedPropertyName?: string;

  /**
   * Internationalization instance for translations
   *
   * Provides access to the i18n system for translating messages and property names.
   */
  i18n: I18n;
}
/**
 * ## OneOf Rule Validation Options
 *
 * Configuration interface for validating a value against an array of alternative validation rules
 * where at least one rule must pass. This interface extends {@link ValidatorValidateOptions}
 * with specialized properties for OneOf rule validation.
 *
 * ### Purpose
 * Used specifically by {@link Validator.validateOneOfRule} to handle the "OneOf" validation logic,
 * which allows validation to succeed if any one of the provided sub-rules passes validation.
 *
 * ### Key Differences from Base Options
 * - **ruleParams**: Overrides base to require an array of rule functions (not mixed rule types)
 * - **rules**: Excluded via `Omit` since OneOf uses `ruleParams` instead
 * - **startTime**: Optional timestamp for performance tracking
 *
 * ### Rule Parameter Structure
 * The `ruleParams` property contains an array of validation rule functions that will be
 * executed in parallel. Each function should follow the {@link ValidatorRuleFunction} signature.
 *
 * ### Usage Context
 * This interface is primarily used internally by the validator when processing "OneOf" rules,
 * but can also be used directly when calling {@link Validator.validateOneOfRule}.
 *
 * ### Examples
 *
 * #### Basic OneOf Validation Setup
 * ```typescript
 * const options: ValidatorValidateMultiRuleOptions = {
 *   value: "user@example.com",
 *   ruleParams: [
 *     ({ value }) => value.includes("@") || "Must contain @",
 *     ({ value }) => value.endsWith(".com") || "Must end with .com",
 *     ({ value }) => value.length > 10 || "Must be longer than 10 chars"
 *   ],
 *   fieldName: "contact",
 *   propertyName: "contact",
 *   translatedPropertyName: "Contact Information",
 *   startTime: Date.now()
 * };
 *
 * const result = await Validator.validateOneOfRule(options);
 * ```
 *
 * #### With Context and Additional Options
 * ```typescript
 * interface ValidationContext {
 *   userId: number;
 *   allowedDomains: string[];
 * }
 *
 * const options: ValidatorValidateMultiRuleOptions<ValidationContext> = {
 *   value: "admin@company.com",
 *   ruleParams: [
 *     // Email validation
 *     ({ value }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Invalid email",
 *
 *     // Phone validation
 *     ({ value }) => /^\+?[\d\s\-\(\)]+$/.test(value) || "Invalid phone",
 *
 *     // Context-aware validation
 *     ({ value, context }) => {
 *       if (!context) return "Context required";
 *       const domain = value.split("@")[1];
 *       return context.allowedDomains.includes(domain) || "Domain not allowed";
 *     }
 *   ],
 *   context: {
 *     userId: 123,
 *     allowedDomains: ["company.com", "partner.org"]
 *   },
 *   data: { formId: "registration" },
 *   fieldName: "contact_input",
 *   propertyName: "contact",
 *   i18n: defaultI18n,
 *   startTime: Date.now()
 * };
 * ```
 *
 * ### Performance Considerations
 * - All rules in `ruleParams` are executed in parallel using `Promise.all`
 * - Validation stops immediately when the first rule succeeds (early exit optimization)
 * - The `startTime` property enables duration tracking for performance monitoring
 *
 * ### Error Handling
 * When all rules fail, error messages are aggregated with semicolons ("; ") as separators.
 * Each failed rule's error message is collected and joined for comprehensive error reporting.
 *
 * @template Context - Type of the optional validation context object
 *
 * @public
 * @see {@link Validator.validateOneOfRule} - Method that uses this interface
 * @see {@link ValidatorValidateOptions} - Base options interface being extended
 * @see {@link ValidatorRuleFunction} - Type of functions in ruleParams array
 * @see {@link ValidatorValidateResult} - Result type returned by validation
 */
export interface ValidatorValidateMultiRuleOptions<
  Context = unknown,
  RulesFunctions extends
    ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
> extends ValidatorValidateOptions<RulesFunctions, Context> {
  startTime?: number;
}
/**
 * ## Default Multi-Rule Type
 *
 * A generic type alias representing an array of validation rules with configurable parameter types.
 * This type serves as the default constraint for multi-rule validation functions that accept
 * arrays of rules with varying parameter signatures.
 *
 * ### Purpose
 * Provides a flexible type for representing collections of validation rules where each rule
 * can have different parameter types. Used as a constraint for {@link ValidatorMultiRuleFunction}
 * and {@link ValidatorValidateMultiRuleOptions} to ensure type safety in multi-rule scenarios.
 *
 * ### Type Parameters
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **ParamsTypes**: Parameter types for the rules (defaults to `any` for maximum flexibility)
 *
 * ### Usage in Multi-Rule Validation
 * This type is used internally by the validator for operations that process multiple rules
 * simultaneously, such as "OneOf" and "AllOf" validation patterns.
 *
 * ### Example
 * ```typescript
 * // Array of rules with different parameter types
 * const rules: ValidatorDefaultMultiRule = [
 *   { ruleName: "Required" },                    // No params
 *   { ruleName: "MinLength", params: [5] },      // Number param
 *   { ruleName: "Email" },                       // No params
 * ];
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ValidatorValidateMultiRuleOptions} as constraint
 * - **Constrains**: {@link ValidatorMultiRuleFunction} parameter types
 * - **Enables**: Type-safe multi-rule validation operations
 *
 * @template Context - Type of the optional validation context
 * @template ParamsTypes - Type of rule parameters (defaults to any for flexibility)
 *
 * @public
 *
 * @see {@link ValidatorValidateMultiRuleOptions} - Uses this as constraint
 * @see {@link ValidatorMultiRuleFunction} - Function type that accepts this
 * @see {@link ValidatorRule} - Individual rule type
 */
export type ValidatorDefaultMultiRule<
  Context = unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParamsTypes extends ValidatorRuleParams = any,
> = Array<ValidatorRule<ParamsTypes, Context>>;

/**
 * ## Multi-Rule Validation Function Type
 *
 * A specialized validation function type for operations that process multiple validation rules
 * simultaneously. This type is used for complex validation patterns like "OneOf" and "AllOf"
 * where multiple rules need to be evaluated together.
 *
 * ### Purpose
 * Defines the signature for validation functions that accept arrays of rules as parameters,
 * enabling advanced validation logic that depends on multiple rule outcomes. Used by
 * {@link Validator.validateOneOfRule} and {@link Validator.validateAllOfRule} methods.
 *
 * ### Type Parameters
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **RulesFunctions**: Array type of rules accepted as parameters (constrained by {@link ValidatorDefaultMultiRule})
 *
 * ### Function Signature
 * ```typescript
 * (options: ValidatorValidateOptions<RulesFunctions, Context>) => ValidatorResult
 * ```
 *
 * ### Usage in Validation System
 * This type enables the creation of higher-order validation rules that combine multiple
 * simpler rules with logical operators (AND, OR, etc.).
 *
 * ### Example
 * ```typescript
 * // OneOf validation function
 * const validateOneOf: ValidatorMultiRuleFunction = async (options) => {
 *   const { ruleParams, value } = options;
 *
 *   // ruleParams is an array of validation functions
 *   for (const ruleFunc of ruleParams) {
 *     const result = await ruleFunc({ ...options, rule: undefined });
 *     if (result === true) return true; // At least one rule passed
 *   }
 *
 *   return "None of the rules passed validation";
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: Multi-rule validation methods in {@link Validator}
 * - **Constrained by**: {@link ValidatorDefaultMultiRule} for parameter types
 * - **Returns**: Standard {@link ValidatorResult} for consistency
 * - **Enables**: Complex validation logic with multiple rules
 *
 * @template Context - Type of the optional validation context
 * @template RulesFunctions - Type of the rules array parameter
 *
 * @public
 *
 * @see {@link ValidatorDefaultMultiRule} - Constrains the RulesFunctions parameter
 * @see {@link Validator.validateOneOfRule} - Uses this function type
 * @see {@link Validator.validateAllOfRule} - Uses this function type
 * @see {@link ValidatorResult} - Return type
 */
export type ValidatorMultiRuleFunction<
  Context = unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RulesFunctions extends Array<ValidatorRule<Array<any>, Context>> = Array<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ValidatorRule<Array<any>, Context>
  >,
> = ValidatorRuleFunction<RulesFunctions, Context>;

/**
 * ## Target Validation Data Type
 *
 * A mapped type representing the data structure expected for class-based validation using
 * {@link Validator.validateTarget}. This type creates a partial record mapping class properties
 * to their values, enabling type-safe validation of entire class instances.
 *
 * ### Purpose
 * Provides compile-time type safety for data passed to {@link Validator.validateTarget} method.
 * Ensures that the data object matches the structure of the target class constructor, allowing
 * validation decorators to be applied to class properties with full type checking.
 *
 * ### Type Construction
 * ```typescript
 * Partial<Record<keyof InstanceType<Target>, any>>
 * ```
 * - **Target**: Class constructor type (must extend `ClassConstructor`)
 * - **InstanceType<Target>**: Properties of the class instance
 * - **Partial**: All properties are optional (validation fills in defaults)
 * - **Record<..., any>**: Values can be any type (validation will check)
 *
 * ### Usage in Target Validation
 * ```typescript
 * class UserForm {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([3])
 *   name: string;
 *
 *   @IsOptional
 *   age?: number;
 * }
 *
 * // Type-safe data object
 * const data: ValidatorValidateTargetData<UserForm> = {
 *   email: "user@example.com",  // ✓ Matches UserForm.email
 *   name: "John",               // ✓ Matches UserForm.name
 *   age: 25,                    // ✓ Matches UserForm.age
 * };
 *
 * const result = await Validator.validateTarget(UserForm, data);
 * ```
 *
 * ### Key Features
 * - **Partial Mapping**: Not all class properties need to be provided
 * - **Type Safety**: Property names and types are checked at compile time
 * - **Decorator Integration**: Works with validation decorators on class properties
 * - **Flexible Values**: Accepts any value type (validation rules determine validity)
 *
 * ### Comparison with Single-Value Validation
 * | Aspect | Target Data | Single Value |
 * |--------|-------------|--------------|
 * | Structure | Object with multiple properties | Single value |
 * | Validation | Multiple fields simultaneously | One value at a time |
 * | Type Safety | Class property mapping | Any value type |
 * | Use Case | Form validation | Field validation |
 *
 * ### Runtime Behavior
 * - **Missing Properties**: Validation decorators determine if properties are required
 * - **Extra Properties**: Ignored (only decorated properties are validated)
 * - **Type Coercion**: Values are validated according to decorator rules, not TypeScript types
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateTarget} as input data type
 * - **Mapped from**: Class constructor type via `InstanceType<Target>`
 * - **Validated by**: Decorator-based rules on class properties
 * - **Returns**: {@link ValidatorValidateTargetResult} with validated instance
 *
 * @template Target - The class constructor type being validated
 *
 * @public
 *
 * @see {@link Validator.validateTarget} - Method that accepts this data type
 * @see {@link ValidatorValidateTargetOptions} - Options type that includes this
 * @see {@link ValidatorValidateTargetResult} - Result type returned after validation
 * @see {@link ClassConstructor} - Base constructor type constraint
 */
export type ValidatorValidateTargetData<
  Target extends ClassConstructor = ClassConstructor,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = Partial<Record<keyof InstanceType<Target>, any>>;

/**
 * ## Target Validation Options
 *
 * Configuration interface for validating entire class instances with decorated properties.
 * This interface extends {@link ValidatorValidateOptions} with target-specific properties
 * for complex object validation scenarios.
 *
 * ### Purpose
 * Provides a specialized options interface for validating class instances where multiple
 * properties have validation decorators. Unlike single-value validation, this interface
 * handles validation of entire objects with potentially many fields and nested structures.
 *
 * ### Key Differences from ValidatorValidateOptions
 * - **data property**: Required and typed as target data (not optional generic data)
 * - **Omits "rule" and "value"**: Uses target-specific data structure instead
 * - **parentData**: Supports nested validation context
 * - **errorMessageBuilder**: Customizable error message formatting for target validation
 * - **startTime**: Performance tracking for multi-field validation
 *
 * ### Inheritance Structure
 * ```
 * ValidatorValidateTargetOptions
 *   ↳ extends Omit<ValidatorValidateOptions<ParamsTypes, Context>, "data" | "rule" | "value">
 *     ↳ extends Omit<Partial<InputFormatterResult>, "value">
 *       ↳ extends BaseData<Context> (but overrides data property)
 * ```
 *
 * ### Generic Parameters
 * - **Target**: The class constructor type being validated (extends `ClassConstructor`)
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **ParamsTypes**: Parameter types for validation rules (defaults to `ValidatorRuleParams`)
 *
 * ### Properties Overview
 *
 * #### Inherited Properties (from ValidatorValidateOptions)
 * - **rules**: Array of validation rules to apply to the target
 * - **ruleParams**: Parameters for the current rule
 * - **ruleName**: Name of the validation rule
 * - **rawRuleName**: Original unparsed rule name
 * - **message**: Custom error message
 * - **fieldName**: Form field identifier
 * - **propertyName**: Object property name
 * - **translatedPropertyName**: Localized property name
 * - **i18n**: Internationalization instance
 * - **sanitizedRules**: Preprocessed rules
 *
 * #### Target-Specific Properties
 * - **data**: Required target data to validate (typed as `ValidatorValidateTargetData<Target>`)
 * - **parentData**: Parent context for nested validations
 * - **startTime**: Performance tracking timestamp
 * - **errorMessageBuilder**: Custom error message builder function
 *
 * ### Usage in Target Validation
 * ```typescript
 * class UserProfile {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([2])
 *   name: string;
 *
 *   @ValidateNested
 *   address: Address;
 * }
 *
 * // Basic target validation
 * const options: ValidatorValidateTargetOptions<UserProfile> = {
 *   data: {
 *     email: "user@example.com",
 *     name: "John",
 *     address: { street: "123 Main St", city: "Anytown" }
 *   },
 *   propertyName: "userProfile",
 *   context: validationContext,
 *   i18n: defaultI18n,
 * };
 *
 * const result = await Validator.validateTarget(UserProfile, options.data);
 * ```
 *
 * ### Error Message Builder
 * The `errorMessageBuilder` allows customization of error message formatting:
 * ```typescript
 * const customErrorBuilder = (
 *   translatedPropertyName: string,
 *   error: string,
 *   options: ValidatorValidationError & {
 *     propertyName: string;
 *     translatedPropertyName: string;
 *     i18n: I18n;
 *     separators: { multiple: string; single: string };
 *     data: Partial<Record<keyof Target, any>>;
 *   }
 * ) => {
 *   return `[${translatedPropertyName}]: ${error}`;
 * };
 *
 * const options: ValidatorValidateTargetOptions<UserProfile> = {
 *   data: userData,
 *   errorMessageBuilder: customErrorBuilder,
 * };
 * ```
 *
 * ### Nested Validation Context
 * The `parentData` property enables context sharing in nested validations:
 * ```typescript
 * // Parent validation
 * const parentOptions: ValidatorValidateTargetOptions<Company> = {
 *   data: {
 *     name: "ACME Corp",
 *     employees: [employeeData1, employeeData2]
 *   },
 *   parentData: undefined, // Root level
 * };
 *
 * // Nested validation (for each employee)
 * const nestedOptions: ValidatorValidateTargetOptions<Employee> = {
 *   data: employeeData,
 *   parentData: { companyName: "ACME Corp" }, // Context from parent
 *   propertyName: "employee",
 * };
 * ```
 *
 * ### Performance Tracking
 * The `startTime` property enables duration measurement:
 * ```typescript
 * const startTime = Date.now();
 * const options: ValidatorValidateTargetOptions<UserForm> = {
 *   data: formData,
 *   startTime, // Track when validation began
 * };
 *
 * const result = await Validator.validateTarget(UserForm, formData, options);
 * if (result.success) {
 *   console.log(`Validation took ${result.duration}ms`);
 * }
 * ```
 *
 * ### Type Safety Benefits
 * - **Compile-time validation** of target class types
 * - **Property type checking** for data objects
 * - **Context propagation** through validation hierarchy
 * - **Error message customization** with proper typing
 *
 * ### Common Use Cases
 *
 * #### 1. Form Validation
 * ```typescript
 * const formOptions: ValidatorValidateTargetOptions<RegistrationForm> = {
 *   data: {
 *     email: submittedEmail,
 *     password: submittedPassword,
 *     confirmPassword: submittedConfirm,
 *   },
 *   fieldName: "registration_form",
 *   context: { userType: "new" },
 * };
 * ```
 *
 * #### 2. API Request Validation
 * ```typescript
 * const apiOptions: ValidatorValidateTargetOptions<CreateUserRequest> = {
 *   data: requestBody,
 *   propertyName: "request",
 *   context: { requestId: req.id, userAgent: req.headers['user-agent'] },
 * };
 * ```
 *
 * #### 3. Nested Object Validation
 * ```typescript
 * const nestedOptions: ValidatorValidateTargetOptions<OrderItem> = {
 *   data: itemData,
 *   parentData: { orderId: "12345", customerId: "67890" },
 *   propertyName: "item",
 *   errorMessageBuilder: customFormatter,
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateTarget} method
 * - **Extends**: {@link ValidatorValidateOptions} with target-specific modifications
 * - **Supports**: Multi-field validation with error aggregation
 * - **Integrates with**: Decorator-based validation system
 *
 * @template Target - The class constructor type being validated (must extend ClassConstructor)
 * @template Context - Optional context type for validation (defaults to unknown)
 * @template ParamsTypes - Parameter types for validation rules (defaults to ValidatorRuleParams)
 *
 * @public
 *
 * @see {@link ValidatorValidateOptions} - Base options interface being extended
 * @see {@link ValidatorValidateTargetData} - Target data type
 * @see {@link Validator.validateTarget} - Method that uses this interface
 * @see {@link ClassConstructor} - Class constructor constraint
 * @see {@link ValidatorValidationError} - Error type for errorMessageBuilder
 */
export interface ValidatorValidateTargetOptions<
  Target extends ClassConstructor = ClassConstructor,
  Context = unknown,
  ParamsTypes extends ValidatorRuleParams = ValidatorRuleParams,
> extends Omit<
    ValidatorValidateOptions<ParamsTypes, Context>,
    'data' | 'rule' | 'value'
  > {
  data: ValidatorValidateTargetData<Target>;
  /**
   * The parent data/context for nested validations
   *
   * When validating nested objects, this property holds the parent
   */
  parentData?: Dictionary;
  startTime?: number;
  errorMessageBuilder?: (
    translatedPropertyName: string,
    error: string,
    builderOptions: ValidatorValidationError & {
      propertyName: keyof InstanceType<Target> | string;
      translatedPropertyName: string;
      i18n: I18n;
      separators: {
        multiple: string;
        single: string;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: Partial<Record<keyof InstanceType<Target>, any>>;
    }
  ) => string;
}

/**
 * ## Multi-Rule Names Union
 *
 * A union type defining the names of validation rules that operate on multiple sub-rules.
 * These rules combine the results of several validation rules using logical operations.
 *
 * ### Purpose
 * Defines the specific rule names that support multi-rule validation patterns.
 * These rules allow combining multiple validation conditions with logical operators
 * like "one of" or "all of", enabling complex validation scenarios.
 *
 * ### Supported Multi-Rules
 * - **'OneOf'**: Passes if at least one of the sub-rules passes (logical OR)
 * - **'AllOf'**: Passes only if all sub-rules pass (logical AND)
 *
 * ### Type Structure
 * Simple string literal union with two possible values:
 * ```typescript
 * 'OneOf' | 'AllOf'
 * ```
 *
 * ### Usage in Validation
 * Multi-rule names are used in {@link ValidatorMultiRuleFunction} to specify
 * which logical operation to apply to a collection of validation rules.
 *
 * ```typescript
 * // Example: Email must be valid OR be empty (optional email field)
 * const rule: ValidatorMultiRuleFunction = (rules, context) => {
 *   return rules.OneOf([
 *     rules.Email([], context),
 *     rules.IsEmpty([], context)
 *   ]);
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ValidatorMultiRuleFunction} as operation selector
 * - **Implemented in**: Rule registry as special multi-rule handlers
 * - **Combines with**: Regular validation rules via logical operations
 * - **Returns**: Single validation result from multiple rule evaluations
 *
 * ### Key Characteristics
 * - **Logical Operations**: Supports OR ('OneOf') and AND ('AllOf') combinations
 * - **Rule Composition**: Enables building complex validation logic from simple rules
 * - **Type Safety**: Compile-time guarantees for valid multi-rule names
 * - **Extensible**: New logical operations can be added by extending this union
 *
 * ### Comparison with Single Rules
 * | Aspect | Single Rule | Multi-Rule |
 * |--------|-------------|------------|
 * | Operation | One condition | Multiple conditions |
 * | Logic | Direct validation | Logical combination |
 * | Use Case | Basic validation | Complex conditional validation |
 * | Example | "IsEmail" | "OneOf(IsEmail, IsEmpty)" |
 *
 * ### Runtime Behavior
 * - **OneOf**: Returns success if any sub-rule passes, failure if all fail
 * - **AllOf**: Returns success only if all sub-rules pass, failure if any fails
 * - **Short-circuiting**: May stop evaluation early based on logical operation
 * - **Error Aggregation**: Collects errors from all evaluated rules
 *
 * @public
 *
 * @see {@link ValidatorMultiRuleFunction} - Function type that uses these names
 * @see {@link ValidatorDefaultMultiRule} - Default multi-rule configuration
 * @see {@link ValidatorRuleName} - General rule names (includes these)
 */
export type ValidatorMultiRuleNames = 'OneOf' | 'AllOf';
/**
 * ## Validation Result Types (Either Pattern)
 *
 * Uses the Either<L, R> pattern where Left represents failure and Right represents success.
 * This provides strong type safety and prevents accessing wrong properties based on the result state.
 */

/**
 * ## Validation Error Details
 *
 * Comprehensive error information structure for validation failures.
 * This interface defines the complete error object that is returned when validation rules fail,
 * providing detailed context about what went wrong and where.
 *
 * ### Purpose
 * Serves as the standardized error format across the entire validation system.
 * Contains all necessary information for error reporting, debugging, and user feedback.
 * Used by both single-value and target validation failure results.
 *
 * ### Key Properties
 * - **status**: Always "error" for type discrimination
 * - **name**: Error class name ("ValidatorValidationError")
 * - **message**: Human-readable error message (translated if available)
 * - **ruleName**: The specific validation rule that failed
 * - **value**: The actual value that failed validation
 * - **propertyName**: Object property name (for target validation)
 * - **fieldName**: Form field identifier
 *
 * ### Usage in Validation Results
 * This interface is used in failure results:
 * - {@link ValidatorValidateFailure.error} - Single value validation failures
 * - {@link ValidatorValidateTargetFailure.errors} - Array of errors in target validation
 *
 * ### Error Message Structure
 * Error messages follow a consistent format:
 * ```
 * "[PropertyName]: Error message from rule"
 * ```
 * For example: `"[Email]: Must be valid email format"`
 *
 * ### Internationalization Support
 * - **translatedPropertyName**: Localized property name for user-facing messages
 * - **message**: Can be translated based on i18n configuration
 * - **timestamp**: When the error occurred (for logging/debugging)
 *
 * ### Metadata and Extensibility
 * - **code**: Programmatic error code for conditional handling
 * - **severity**: Error level ("error", "warning", "info")
 * - **metadata**: Additional error context as key-value pairs
 *
 * ### Example Error Object
 * ```typescript
 * const error: ValidatorValidationError = {
 *   status: "error",
 *   name: "ValidatorValidationError",
 *   message: "[Email]: Must be valid email format",
 *   ruleName: "Email",
 *   ruleParams: [],
 *   rawRuleName: "Email",
 *   propertyName: "email",
 *   fieldName: "email_input",
 *   translatedPropertyName: "Email Address",
 *   value: "invalid-email",
 *   code: "INVALID_EMAIL",
 *   severity: "error",
 *   timestamp: new Date(),
 *   metadata: {
 *     suggestion: "Please use format: user@example.com",
 *     domain: "example.com"
 *   }
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Created by**: Validation rule functions when they return failure strings
 * - **Processed by**: {@link Validator.validate} and {@link Validator.validateTarget}
 * - **Used in**: Error aggregation and reporting throughout the system
 * - **Compatible with**: Standard error handling patterns and logging systems
 *
 * ### Best Practices
 *
 * #### Error Message Guidelines
 * ```typescript
 * // ✅ Good: Specific, actionable messages
 * message: "[Password]: Must contain at least one uppercase letter"
 *
 * // ❌ Avoid: Generic or unhelpful messages
 * message: "Invalid input"
 * ```
 *
 * #### Using Error Codes
 * ```typescript
 * // Enable programmatic error handling
 * if (error.code === "EMAIL_INVALID_FORMAT") {
 *   highlightEmailField();
 *   showEmailFormatHint();
 * }
 * ```
 *
 * #### Metadata for Rich Errors
 * ```typescript
 * // Provide additional context
 * error.metadata = {
 *   minLength: 8,
 *   actualLength: 5,
 *   missingChars: ["uppercase", "number"]
 * };
 * ```
 *
 * @public
 *
 * @see {@link ValidatorValidateFailure} - Single validation failure result
 * @see {@link ValidatorValidateTargetFailure} - Target validation failure result
 * @see {@link Validator.validate} - Method that creates these errors
 * @see {@link Validator.validateTarget} - Method that creates these errors
 */
export interface ValidatorValidationError {
  /** Always 'error' for failures */
  status: 'error';

  name: 'ValidatorValidationError';

  /** The property name that failed validation (required) */
  fieldName?: string;

  /** Alias for fieldName (required) */
  propertyName?: string;

  /** The validation error message (required) */
  message: string;

  /** Localized field name for user-facing messages */
  translatedPropertyName?: string;

  /** The specific rule that failed */
  ruleName?: ValidatorRuleName;

  /** Parameters passed to the failing rule */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleParams: any[];

  /** The value that failed validation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;

  /** Raw rule name with parameters (e.g., "minLength[5]") */
  rawRuleName?: ValidatorRuleName | string;

  /** Error code for programmatic handling */
  code?: string;

  /** Error severity level */
  severity?: 'error' | 'warning' | 'info';

  /** When the validation failed */
  timestamp?: Date;

  /** Additional error metadata */
  metadata?: Dictionary;
}

// Single value validation (reuse base types directly)
/**
 * ## Single Value Validation Success Result
 *
 * Represents a successful validation result for a single value.
 * This type is used as the success branch of the {@link ValidatorValidateResult} discriminated union.
 *
 * ### Type Guard
 * Can be narrowed using {@link Validator.isSuccess}:
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // TypeScript knows: result satisfies ValidatorValidateSuccess
 *   // Can safely access result.value, result.validatedAt, result.duration
 * }
 * ```
 *
 * ### Properties
 * - **success**: Literal `true` for type discrimination
 * - **value**: The original value that passed validation
 * - **validatedAt**: ISO timestamp indicating when validation completed
 * - **duration**: Duration in milliseconds from validation start to completion
 * - **error**: Explicitly `undefined` for success (aids type narrowing)
 * - **failedAt**: Explicitly `undefined` for success (aids type narrowing)
 * - **data**: Optional context data (inherited from BaseData)
 * - **context**: Optional validation context (inherited from BaseData)
 *
 * ### Example
 * ```typescript
 * const result = await Validator.validate({
 *   value: "user@example.com",
 *   rules: ["Required", "Email"],
 * });
 *
 * if (result.success) {
 *   // result is ValidatorValidateSuccess
 *   console.log("Validated:", result.value);
 *   console.log("Took:", result.duration, "ms");
 *   console.log("Completed at:", result.validatedAt.toISOString());
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorValidateResult}
 * @see {@link ValidatorValidateFailure}
 * @see {@link Validator.validate}
 * @see {@link Validator.isSuccess}
 */
export interface ValidatorValidateSuccess<Context = unknown>
  extends BaseData<Context> {
  /** Discriminant for type narrowing - always `true` for success */
  success: true;

  /**
   * ISO timestamp indicating when validation completed successfully
   * @example "2024-11-08T10:30:45.123Z"
   */
  validatedAt?: Date;

  /**
   * Duration of validation in milliseconds (from start to completion)
   * @example 15 (milliseconds)
   */
  duration?: number;

  /** Always undefined for success results (type narrowing aid) */
  error?: undefined;

  /** Always undefined for success results (type narrowing aid) */
  failedAt?: undefined;
}
/**
 * ## Base Data Structure
 *
 * Shared data structure for both validation success and failure results.
 * Contains the core properties that exist in all validation outcomes.
 *
 * ### Purpose
 * Provides a common interface for passing data through the validation pipeline
 * and in the result objects. Used by both {@link ValidatorValidateSuccess}
 * and {@link ValidatorValidateFailure}.
 *
 * ### Properties
 * - **value**: The actual value being validated (required)
 * - **data**: Optional contextual data available to validation rules
 * - **context**: Optional typed context object for advanced validations
 *
 * ### Usage in Validation Results
 * ```typescript
 * // In ValidatorValidateSuccess
 * const successResult: ValidatorValidateSuccess = {
 *   success: true,
 *   value: "user@example.com",  // Original validated value
 *   data: { userId: 123 },      // Additional context
 *   context: { ... },           // Typed context object
 *   validatedAt: new Date(),
 *   duration: 5,
 * };
 *
 * // In ValidatorValidateFailure
 * const failureResult: ValidatorValidateFailure = {
 *   success: false,
 *   value: "invalid-email",     // Value that failed
 *   data: { userId: 123 },      // Available during failure too
 *   context: { ... },           // Context from validation request
 *   error: { ... },
 *   failedAt: new Date(),
 *   duration: 2,
 * };
 * ```
 *
 * @template Context - Type parameter for optional typed context object
 *
 * @public
 *
 * @see {@link ValidatorValidateOptions} - Options passed to validation
 * @see {@link ValidatorValidateSuccess} - Success result type
 * @see {@link ValidatorValidateFailure} - Failure result type
 */
interface BaseData<Context = unknown> {
  /**
   * The value to use for performing the validation.
   * This is the actual data that will be validated against the specified rules.
   *
   * @type {any}
   *
   * @example
   * ```typescript
   * const result = await Validator.validate({
   *   value: "user@example.com",  // This is the value being validated
   *   rules: ["Required", "Email"],
   * });
   * ```
   *
   * @remarks
   * - This is the core data being validated
   * - Type can be any JavaScript value: string, number, object, array, etc.
   * - Available in both success and failure results
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;

  /**
   * Optional data object providing contextual information for validation rules.
   *
   * This property is used to provide additional context for the validation rule.
   * It can be used to pass any additional data that might be needed for validation,
   * such as form data, related field values, or other contextual information.
   *
   * @type {Dictionary | undefined}
   *
   * @example
   * ```typescript
   * const result = await Validator.validate({
   *   value: "test@example.com",
   *   rules: ["Required", "Email"],
   *   data: {
   *     userId: 123,
   *     formId: "user_form",
   *   },
   * });
   * ```
   *
   * @remarks
   * - Optional property (not required)
   * - Passed to validation rule functions via options.data
   * - Useful for multi-field validation scenarios
   * - Commonly used for form data context in validateTarget
   */
  data?: Dictionary;

  /**
   * Optional typed context object for validation.
   *
   * Provides a typed context that can be passed to validation rules for
   * advanced validation scenarios requiring external data or permissions.
   *
   * @template Context - Type of the context object
   *
   * @example
   * ```typescript
   * interface UserContext {
   *   userId: number;
   *   permissions: string[];
   *   isAdmin: boolean;
   * }
   *
   * const result = await Validator.validate<UserContext>({
   *   value: "admin_action",
   *   rules: ["Required"],
   *   context: {
   *     userId: 123,
   *     permissions: ["read", "write", "admin"],
   *     isAdmin: true,
   *   },
   * });
   * ```
   *
   * @remarks
   * - Optional property (not required)
   * - Type is defined by the Context generic parameter
   * - Passed to all validation rule functions
   * - Enables context-aware validation rules
   * - Commonly used for permission-based or user-specific validations
   */
  context?: Context;
}
/**
 * ## Single Value Validation Failure Result
 *
 * Represents a failed validation result for a single value.
 * This type is used as the failure branch of the {@link ValidatorValidateResult} discriminated union.
 *
 * ### Type Guard
 * Can be narrowed using {@link Validator.isFailure}:
 * ```typescript
 * if (Validator.isFailure(result)) {
 *   // TypeScript knows: result satisfies ValidatorValidateFailure
 *   // Can safely access result.error, result.failedAt, result.duration
 * }
 * ```
 *
 * ### Properties
 * - **success**: Literal `false` for type discrimination
 * - **error**: Validation error details (name, message, rule info)
 * - **failedAt**: ISO timestamp indicating when validation failed
 * - **duration**: Duration in milliseconds until failure
 * - **validatedAt**: Explicitly `undefined` for failure (aids type narrowing)
 * - **value**: The original value that failed validation
 * - **data**: Optional context data (inherited from BaseData)
 * - **context**: Optional validation context (inherited from BaseData)
 *
 * ### Error Object Structure
 * The `error` property contains:
 * ```typescript
 * {
 *   name: "ValidatorValidationError",
 *   message: "Error message (translated if available)",
 *   ruleName: "Email",              // Name of failing rule
 *   ruleParams: [],                 // Parameters passed to rule
 *   rawRuleName: "Email",           // Original rule specification
 *   fieldName: "email_field",       // Optional field identifier
 *   propertyName: "email",          // Optional property name
 *   translatedPropertyName?: "Email Address", // Translated name
 *   value: "invalid@",              // Value that failed
 * }
 * ```
 *
 * ### Example
 * ```typescript
 * const result = await Validator.validate({
 *   value: "not-an-email",
 *   rules: ["Required", "Email"],
 * });
 *
 * if (!result.success) {
 *   // result is ValidatorValidateFailure
 *   console.error("Validation failed:");
 *   console.error("  Value:", result.value);
 *   console.error("  Error:", result.error.message);
 *   console.error("  Rule:", result.error.ruleName);
 *   console.error("  Failed at:", result.failedAt.toISOString());
 *   console.error("  Duration:", result.duration, "ms");
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorValidateResult}
 * @see {@link ValidatorValidateSuccess}
 * @see {@link ValidatorValidationError}
 * @see {@link Validator.validate}
 * @see {@link Validator.isFailure}
 */
export interface ValidatorValidateFailure<Context = unknown>
  extends BaseData<Context> {
  /** Discriminant for type narrowing - always `false` for failure */
  success: false;

  /**
   * The validation error details
   *
   * Contains complete information about what validation rule failed
   * and why, including the rule name, parameters, and error message.
   *
   * @type {ValidatorValidationError}
   * @see {@link ValidatorValidationError}
   */
  error: ValidatorValidationError;

  /**
   * ISO timestamp indicating when validation failed
   * @example "2024-11-08T10:30:45.118Z"
   */
  failedAt?: Date;

  /**
   * Duration of validation before failure in milliseconds
   * @example 2 (milliseconds - failed quickly on first rule)
   */
  duration?: number;

  /** Always undefined for failure results (type narrowing aid) */
  validatedAt?: undefined;
}

/**
 * ## Validation Result Type (Discriminated Union)
 *
 * Represents the result of a single-value validation operation.
 * This is a discriminated union that can be narrowed to either success or failure.
 *
 * ### Type Narrowing Strategies
 *
 * #### Approach 1: Check the `success` property
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * if (result.success) {
 *   // TypeScript knows: ValidatorValidateSuccess
 *   console.log(result.value);      // ✓ Available
 *   console.log(result.validatedAt); // ✓ Available
 *   console.log(result.error);      // ✗ Type error (undefined for success)
 * } else {
 *   // TypeScript knows: ValidatorValidateFailure
 *   console.log(result.value);      // ✓ Available
 *   console.log(result.error);      // ✓ Available
 *   console.log(result.validatedAt); // ✗ Type error (undefined for failure)
 * }
 * ```
 *
 * #### Approach 2: Use type guard functions
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * if (Validator.isSuccess(result)) {
 *   // result is ValidatorValidateSuccess<Context>
 *   console.log(result.value);
 *   console.log(result.validatedAt);
 * } else if (Validator.isFailure(result)) {
 *   // result is ValidatorValidateFailure<Context>
 *   console.log(result.error.message);
 *   console.log(result.error.ruleName);
 * }
 * ```
 *
 * #### Approach 3: Use switch on discriminant
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * switch (result.success) {
 *   case true:
 *     console.log("Validated:", result.value);
 *     break;
 *   case false:
 *     console.error("Failed:", result.error.message);
 *     break;
 * }
 * ```
 *
 * ### Union Members
 * - {@link ValidatorValidateSuccess} - When validation passes (success: true)
 * - {@link ValidatorValidateFailure} - When validation fails (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   userId: number;
 * }
 *
 * const result: ValidatorValidateResult<MyContext> = await Validator.validate({
 *   value: "test@example.com",
 *   rules: ["Required", "Email"],
 *   context: { userId: 123 },
 * });
 * ```
 *
 * @public
 *
 * @see {@link ValidatorValidateSuccess} - Success variant
 * @see {@link ValidatorValidateFailure} - Failure variant
 * @see {@link Validator.validate} - Main validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 */
export type ValidatorValidateResult<Context = unknown> =
  | ValidatorValidateSuccess<Context>
  | ValidatorValidateFailure<Context>;

/**
 * ## Validate Target Result Types
 *
 * Types for class-based validation using decorators.
 * Supports accumulation of multiple field errors across all decorated properties.
 *
 * ### Key Differences from Single-Value Validation
 * - **Multiple Errors**: Collects errors from all fields that fail validation
 * - **Parallel Validation**: All fields are validated concurrently
 * - **Error Aggregation**: Returns array of errors with field-level details
 * - **Class-Based**: Works with decorated class properties rather than single values
 * - **FieldMeta Mapping**: Maps validated data back to class structure with proper typing
 */

/**
 * ## Class Validation Failure Result
 *
 * Represents a failed multi-field validation result when using {@link Validator.validateTarget}.
 * Unlike single-value validation, this accumulates errors from all fields that fail.
 *
 * ### Type Guard
 * Can be narrowed by checking the `success` property:
 * ```typescript
 * const result = await Validator.validateTarget(UserForm, data);
 *
 * if (!result.success) {
 *   // result is ValidatorValidateTargetFailure
 *   console.log(result.errors);      // Array of field errors
 *   console.log(result.failureCount); // Number of failed fields
 *   console.log(result.message);     // Summary message
 * }
 * ```
 *
 * ### Properties
 * - **success**: Literal `false` for type discrimination
 * - **errors**: Array of ValidatorValidationError, one per failed field
 * - **failureCount**: Number of fields that failed validation
 * - **message**: Summary message (e.g., "Validation failed for 3 fields")
 * - **status**: Always "error" for consistency
 * - **failedAt**: ISO timestamp of when validation failed
 * - **duration**: Milliseconds elapsed during validation
 * - **data**: Always `undefined` for target failures
 * - **value**: Always `undefined` for target (use `errors` instead)
 * - **context**: Optional validation context provided
 *
 * ### Error Array Structure
 * Each error in the `errors` array contains:
 * ```typescript
 * {
 *   name: "ValidatorValidationError",
 *   status: "error",
 *   fieldName: "email_field",       // Form field identifier
 *   propertyName: "email",          // Class property name
 *   message: "[Email]: Must be valid email",  // Formatted error message
 *   ruleName: "Email",              // Name of failing rule
 *   ruleParams: [],                 // Rule parameters
 *   value: "invalid@",              // Value that failed
 * }
 * ```
 *
 * ### Example
 * ```typescript
 * class UserForm {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([3])
 *   name: string;
 * }
 *
 * const result = await Validator.validateTarget(UserForm, {
 *   email: "invalid-email",
 *   name: "ab",  // Too short
 * });
 *
 * if (!result.success) {
 *   // result.failureCount === 2
 *   // result.errors.length === 2
 *   result.errors.forEach(error => {
 *     console.error(`${error.propertyName}: ${error.message}`);
 *   });
 * }
 * ```
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorValidateTargetResult}
 * @see {@link ValidatorValidationError}
 * @see {@link Validator.validateTarget}
 */
export interface ValidatorValidateTargetFailure<Context = unknown>
  extends Omit<BaseData<Context>, 'value' | 'data'> {
  /** Discriminant for type narrowing - always `false` for failures */
  success: false;

  /**
   * Summary message describing the failure
   *
   * Typically formatted as "Validation failed for N fields" where N is the number of failures.
   * Can be customized via i18n translations.
   *
   * @type {string}
   * @example "Validation failed for 3 fields"
   */
  message: string;

  /**
   * Array of validation errors for each field that failed
   *
   * Contains one error object per field that failed validation.
   * Each error includes the field name, error message, rule name, and value.
   *
   * @type {ValidatorValidationError[]}
   * @see {@link ValidatorValidationError}
   */
  errors: ValidatorValidationError[];

  /**
   * Number of fields that failed validation
   *
   * Equal to errors.length. Provided for convenience.
   *
   * @type {number}
   * @example 3
   */
  failureCount: number;

  /**
   * Status indicator for this result
   *
   * Always "error" for failures. Provided for consistency with HTTP and API conventions.
   *
   * @type {"error"}
   */
  status: 'error';

  /**
   * ISO timestamp of when validation failed
   *
   * Indicates the exact time validation completed with failures.
   *
   * @type {Date | undefined}
   * @example new Date("2024-11-08T10:30:45.523Z")
   */
  failedAt?: Date;

  /**
   * Duration of validation in milliseconds
   *
   * Measures time from validation start until failures were detected.
   * Note: All fields are validated in parallel, so this is not the sum of individual field times.
   *
   * @type {number | undefined}
   * @example 45 (milliseconds)
   */
  duration?: number;

  /** Validation context (if provided) */
  context?: Context;

  /** Always `undefined` for target failures (type narrowing aid) */
  validatedAt?: undefined;

  data: Dictionary;
}

/**
 * ## Class Validation Success Result
 *
 * Represents a successful multi-field validation result when using {@link Validator.validateTarget}.
 * All decorated fields passed their respective validation rules.
 *
 * ### Type Guard
 * Can be narrowed by checking the `success` property:
 * ```typescript
 * const result = await Validator.validateTarget(UserForm, data);
 *
 * if (result.success) {
 *   // result is ValidatorValidateTargetSuccess
 *   console.log(result.data);        // Validated instance of T
 *   console.log(result.validatedAt); // Timestamp of validation
 * }
 * ```
 *
 * ### Properties vs Single-Value Success
 * Unlike {@link ValidatorValidateSuccess}, target success uses:
 * - **data**: The validated class instance (not `value`)
 * - **value**: Always `undefined` (type narrowing aid)
 * - **errors**: Always `undefined` (type narrowing aid)
 *
 * ### Data Property
 * The `data` property contains the fully validated class instance with type `T`.
 * This is the instance you pass after decoration is complete.
 *
 * ```typescript
 * class UserForm {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([3])
 *   name: string;
 * }
 *
 * const result = await Validator.validateTarget(UserForm, {
 *   email: "user@example.com",
 *   name: "John",
 * });
 *
 * if (result.success) {
 *   // result.data is UserForm instance
 *   console.log(result.data.email); // "user@example.com"
 *   console.log(result.data.name);  // "John"
 *
 *   // Timing information
 *   console.log(result.validatedAt); // ISO timestamp
 *   console.log(result.duration);    // Milliseconds (approximately)
 * }
 * ```
 *
 * ### Comparison with Single-Value Success
 * | Aspect | Single-Value | Target |
 * |--------|-------------|--------|
 * | Property | `value` | `data` |
 * | Validates | One value | Multiple fields |
 * | Returns | Original value | Class instance |
 * | Error accumulation | Not applicable | Multiple errors collected |
 * | Use case | Single field | Entire form/object |
 *
 * ### Practical Usage
 * ```typescript
 * const form = new UserForm();
 * form.email = "user@example.com";
 * form.name = "John";
 *
 * const result = await Validator.validateTarget(UserForm, form);
 *
 * if (result.success) {
 *   // Safe to use result.data
 *   await saveUser(result.data);
 *   console.log(`Validation took ${result.duration}ms`);
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorValidateTargetResult}
 * @see {@link ValidatorValidateSuccess} - Single-value equivalent
 * @see {@link Validator.validateTarget}
 */
export interface ValidatorValidateTargetSuccess<Context = unknown>
  extends Omit<BaseData<Context>, 'data'> {
  /** Discriminant for type narrowing - always `true` for success */
  success: true;

  message?: undefined;

  /**
   * Status indicator for this result
   *
   * Always "success" for successful validations. Provided for consistency with HTTP
   * and API conventions.
   *
   * @type {"success"}
   */
  status: 'success';

  /**
   * ISO timestamp of when validation succeeded
   *
   * Indicates the exact time validation completed successfully.
   *
   * @type {Date | undefined}
   * @example new Date("2024-11-08T10:30:45.123Z")
   */
  validatedAt?: Date;

  /**
   * Duration of validation in milliseconds
   *
   * Measures time from validation start until all fields completed validation.
   * Note: All fields are validated in parallel, so this is not the sum of individual field times.
   *
   * @type {number | undefined}
   * @example 23 (milliseconds)
   */
  duration?: number;

  data: Dictionary;
}

/**
 * ## Class Validation Result Type (Discriminated Union)
 *
 * Discriminated union type representing the result of a {@link Validator.validateTarget} operation.
 * Can be either {@link ValidatorValidateTargetSuccess} or {@link ValidatorValidateTargetFailure}.
 *
 * ### Type Narrowing Strategies
 *
 * **Strategy 1: Check `success` property**
 * ```typescript
 * const result = await Validator.validateTarget(UserForm, data);
 *
 * if (result.success) {
 *   // result is ValidatorValidateTargetSuccess<T>
 *   console.log(result.data);        // Class instance with all fields valid
 *   console.log(result.validatedAt); // Validation timestamp
 * } else {
 *   // result is ValidatorValidateTargetFailure
 *   console.log(result.errors);      // Array of field-level errors
 *   console.log(result.failureCount); // Number of failed fields
 * }
 * ```
 *
 * **Strategy 2: Use switch statement**
 * ```typescript
 * switch (result.status) {
 *   case "success":
 *     // result is ValidatorValidateTargetSuccess
 *     await saveToDatabase(result.data);
 *     break;
 *   case "error":
 *     // result is ValidatorValidateTargetFailure
 *     logErrors(result.errors);
 *     break;
 * }
 * ```
 *
 * **Strategy 3: Use type guard helper**
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // result is ValidatorValidateTargetSuccess
 *   return result.data;
 * }
 * // result is ValidatorValidateTargetFailure
 * throw new Error(result.message);
 * ```
 *
 * ### Comparison with Single-Value Result
 * | Aspect | Single-Value | Target |
 * |--------|-------------|--------|
 * | Success Property | `value` | `data` |
 * | On Failure | Single error | Array of errors |
 * | Type Param | One generic | Two generics (T, Context) |
 * | Use Case | Single field validation | Multiple field validation |
 *
 * ### Real-World Example
 * ```typescript
 * class RegistrationForm {
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([8])
 *   password: string;
 *
 *   @IsRequired
 *   @Equals([{{ value: "password" }}])
 *   confirmPassword: string;
 * }
 *
 * const result = await Validator.validateTarget(RegistrationForm, {
 *   email: "user@example.com",
 *   password: "SecurePass123",
 *   confirmPassword: "SecurePass123",
 * });
 *
 * if (result.success) {
 *   // All validations passed
 *   console.log("Ready to register:", result.data);
 * } else {
 *   // Display field-level errors to user
 *   result.errors.forEach(error => {
 *     console.error(`[${error.propertyName}]: ${error.message}`);
 *   });
 * }
 * ```
 *
 * ### Union Members
 * - {@link ValidatorValidateTargetSuccess} - When all fields pass (success: true)
 * - {@link ValidatorValidateTargetFailure} - When one or more fields fail (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorValidateTargetSuccess} - Success variant
 * @see {@link ValidatorValidateTargetFailure} - Failure variant
 * @see {@link Validator.validateTarget} - Main target validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 * @see {@link ValidatorValidateResult} - Single-value equivalent
 */
export type ValidatorValidateTargetResult<Context = unknown> =
  | ValidatorValidateTargetSuccess<Context>
  | ValidatorValidateTargetFailure<Context>;

/**
 * ## Validator Rule Functions Map
 *
 * A type-safe mapped type that creates a lookup table of validation rule names to their corresponding validation functions.
 * This mapped type provides compile-time guarantees that only valid rule names can be used as keys
 * to access their associated validation functions, preventing runtime errors from invalid rule lookups.
 *
 * ### Purpose
 * Serves as the central type definition for the validation rule function lookup table in the validator system.
 * Enables type-safe retrieval and execution of validation functions by their string names,
 * ensuring that each validation rule has a properly typed function with correct parameters and context.
 *
 * ### Type Structure
 * - **Key**: `ValidatorRuleName` - Valid rule names from {@link ValidatorRuleParamTypes}
 * - **Value**: `ValidatorRuleFunction<Params, Context>` - Corresponding validation function with proper typing
 * - **Mapped Type**: `[K in ValidatorRuleName]` ensures every rule name maps to its function
 *
 * ### Type Safety Benefits
 * - **Compile-time Validation**: Only valid rule names can be used as keys
 * - **Parameter Type Safety**: Each rule function has correctly typed parameters based on the rule
 * - **Context Propagation**: Context types are properly maintained throughout the validation pipeline
 * - **Function Signature Consistency**: Ensures all rule functions follow the same signature pattern
 *
 * ### Usage in Validator Class
 * This type is primarily used internally by the {@link Validator} class:
 * - {@link Validator.getRules} returns an instance of this mapped type
 * - {@link Validator.validateTarget} uses it to retrieve rule functions by name
 * - Rule execution methods access functions through this type-safe lookup table
 *
 * ### Example Structure
 * ```typescript
 * const rules: ValidatorRuleFunctionsMap = {
 *   Required: (params, context) => {
 *     // validation logic here
 *   },
 *   Email: (params, context) => {
 *     // email validation logic
 *   },
 *   MinLength: ([minLen], context) => {
 *     // length validation logic
 *   },
 *   // ... all other built-in rules
 * };
 * ```
 *
 * ### Relationship to Other Types
 * - **Source of Keys**: Keys come from {@link ValidatorRuleName} (derived from {@link ValidatorRuleParamTypes})
 * - **Function Signatures**: Values are {@link ValidatorRuleFunction} instances with proper generic parameters
 * - **Parameter Types**: Parameters typed via {@link ValidatorRuleParamTypes} lookups for each specific rule
 * - **Context**: Context type propagated from generic parameter throughout the validation system
 *
 * ### Runtime Usage
 * ```typescript
 * // Type-safe rule retrieval
 * const rules = Validator.getRules();
 * const emailRule = rules.Email;        // ✓ Type-safe access
 * const unknownRule = rules.Unknown;    // ✗ TypeScript error
 *
 * // Parameter type safety
 * const minLengthRule = rules.MinLength; // Function<[number], Context>
 * minLengthRule([5], context);           // ✓ Correct parameter types
 * minLengthRule("5", context);          // ✗ Type error
 * ```
 *
 * @template Context - Type of the optional validation context object
 *
 * @public
 *
 * @see {@link ValidatorRuleName} - Valid rule names (keys of this map)
 * @see {@link ValidatorRuleParamTypes} - Rule parameter definitions
 * @see {@link ValidatorRuleFunction} - Validation function signature
 * @see {@link Validator.getRules} - Method that returns this map
 * @see {@link Validator.validateTarget} - Method that uses this map
 */
export type ValidatorRuleFunctionsMap<Context = unknown> = {
  [K in ValidatorRuleName]: ValidatorRuleFunction<
    ValidatorRuleParamTypes<Context>[K],
    Context
  >;
};
