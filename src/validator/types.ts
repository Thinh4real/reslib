import { I18n } from "@/i18n";
import { IInputFormatterResult } from "@/inputFormatter/types";
import { IClassConstructor } from "@/types";
import { ICountryCode } from "@countries/types";

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
 * function validateEmail(value: string): IValidatorResult {
 *   if (!value.includes("@")) {
 *     return "Invalid email format";  // string = failure
 *   }
 *   return true;  // boolean = success
 * }
 * ```
 *
 * #### Asynchronous Validation
 * ```typescript
 * async function validateUniqueUsername(username: string): Promise<IValidatorResult> {
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
 * const customRule: IValidatorRuleFunction = async ({ value }) => {
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
 * function validateMinLength(value: string, minLength: number): IValidatorResult {
 *   if (value.length < minLength) {
 *     return `Must be at least ${minLength} characters long`;
 *   }
 *   return true;
 * }
 *
 * // Asynchronous validation rule
 * async function validateUniqueEmail(email: string): Promise<IValidatorResult> {
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
 * @since 1.0.0
 * @see {@link IValidatorRuleFunction} - Functions that return this type
 * @see {@link IValidatorValidateResult} - Higher-level validation results
 * @see {@link Validator.validate} - Main validation method
 */
export type IValidatorResult = boolean | string | Promise<boolean | string>;

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
 * #### 1. Function Rules (`IValidatorRuleFunction`)
 * Custom validation logic defined as functions. Most flexible but requires implementation.
 * ```typescript
 * ({ value, context }) => value.length > 5
 * ```
 *
 * #### 2. Named Rules (`IValidatorRuleName`)
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
 * #### 4. Object Rules (`IValidatorRuleObject`)
 * Structured object format with type-safe parameters. Most type-safe format.
 * ```typescript
 * { MinLength: [5] } | { Email: [] } | { NumberBetween: [0, 100] }
 * ```
 *
 * ### Type Parameters
 * - **ParamsType**: Array type for rule parameters (default: `Array<any>`)
 * - **Context**: Type of optional validation context (default: `unknown`)
 *
 * ### Usage Examples
 *
 * #### Mixed Rule Array
 * ```typescript
 * const rules: IValidatorRules = [
 *   "Required",                    // Named rule
 *   "MinLength[3]",               // Parameterized rule
 *   { MaxLength: [50] },          // Object rule
 *   ({ value }) => value !== "",  // Function rule
 * ];
 * ```
 *
 * #### Type-Safe Rule Creation
 * ```typescript
 * // All these are valid IValidatorRule instances
 * const rule1: IValidatorRule = "Email";
 * const rule2: IValidatorRule = "MinLength[5]";
 * const rule3: IValidatorRule = { Required: [] };
 * const rule4: IValidatorRule = ({ value }) => typeof value === 'string';
 * ```
 *
 * #### In Validation Operations
 * ```typescript
 * // Single rule validation
 * const result = await Validator.validate({
 *   value: "test@example.com",
 *   rules: "Email",  // IValidatorRule
 * });
 *
 * // Multiple rules validation
 * const multiResult = await Validator.validate({
 *   value: "hello",
 *   rules: ["Required", "MinLength[3]", { MaxLength: [10] }],  // IValidatorRule[]
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
 * const comprehensiveRules: IValidatorRules = [
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
 * @template ParamsType - Array type for rule parameters, defaults to any array
 * @template Context - Type of optional validation context, defaults to unknown
 *
 * @example
 * ```typescript
 * // Define flexible validation rules
 * type UserRules = IValidatorRule[];
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
 * @since 1.0.0
 * @see {@link IValidatorRuleFunction} - Function-based rules
 * @see {@link IValidatorRuleName} - Built-in rule names
 * @see {@link IValidatorRuleObject} - Object-based rules
 * @see {@link IValidatorRulesMap} - Built-in rule definitions
 * @see {@link Validator} - Main validation class
 * @public
 */
export type IValidatorRule<ParamsType extends IValidatorRuleParams = IValidatorRuleParams, Context = unknown> = IValidatorRuleFunction<ParamsType, Context> | IValidatorOptionalOrEmptyRuleNames | IValidatorRuleObject<Context>;

/**
 * @typedef {IValidatorOptionalOrEmptyRuleNames}
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
 * │  ✘  "Length"               // Array<[number, number?], Context>        │
 * │  ✘  "NumberLessThan"       // Array<[number]>                          │
 * └-------------------------------------------------------------------------┘
 *
 * The type is built in two steps:
 *  1. `ExtractOptionalOrEmptyKeys` keeps the keys whose tuple is empty or
 *     fully optional (see helper below).
 *  2. `& keyof IValidatorRulesMap` is a sanity filter that guarantees we
 *     never leak alien keys should the utility mis-behave.
 */
export type IValidatorOptionalOrEmptyRuleNames = ExtractOptionalOrEmptyKeys<IValidatorRulesMap> & keyof IValidatorRulesMap;

/**
 * Helper that returns true when a tuple type allows an empty invocation.
 * Examples:
 * - []                         => true
 * - [A?]                       => true (can be called with no args)
 * - [A?, B?]                   => true (all optional)
 * - [A, B?]                    => false (A required)
 * - [A]                        => false (A required)
 */
type TupleAllowsEmpty<T extends any[]> = T extends [] ? true : [] extends T ? true : false;

/**
 * Extracts keys whose rule parameter tuple is empty or fully optional.
 * This correctly captures cases like `[countryCode?: ICountryCode]`.
 */
type ExtractOptionalOrEmptyKeys<T> = {
  [K in keyof T]: T[K] extends any[] ? (TupleAllowsEmpty<T[K]> extends true ? K : never) : never;
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
 * - **Key**: Must be a valid `IValidatorRuleName` (e.g., "MinLength", "Email", etc.)
 * - **Value**: Must match the parameter type defined in `IValidatorRulesMap` for that rule
 *
 * ### Generated Structure
 * For each rule in `IValidatorRulesMap`, this type generates an object like:
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
 * const minLengthRule: IValidatorRuleObject = {
 *   MinLength: [5]  // Must be array with one number
 * };
 *
 * const emailRule: IValidatorRuleObject = {
 *   Email: []  // Must be empty array
 * };
 *
 * const betweenRule: IValidatorRuleObject = {
 *   NumberBetween: [0, 100]  // Must be array with two numbers
 * };
 * ```
 *
 * #### In Validation Rules Array
 * ```typescript
 * const rules: IValidatorRules = [
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
 * const invalid1: IValidatorRuleObject = {
 *   MinLength: 5  // ❌ Error: Must be array, not number
 * };
 *
 * const invalid2: IValidatorRuleObject = {
 *   MinLength: [5, 10]  // ❌ Error: MinLength only takes one parameter
 * };
 *
 * const invalid3: IValidatorRuleObject = {
 *   UnknownRule: []  // ❌ Error: UnknownRule not in IValidatorRuleName
 * };
 * ```
 *
 * ### Relationship to Other Rule Types
 * This type is one of four union members in {@link IValidatorRule}:
 * - `IValidatorRuleFunction` - Custom validation functions
 * - `IValidatorRuleName` - Simple rule names (strings)
 * - `` `${IValidatorRuleName}[${string}]` `` - Parameterized rule strings
 * - `IValidatorRuleObject` - Structured rule objects (this type)
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
 * const userRules: IValidatorRules = [
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
 * @since 1.0.0
 * @see {@link IValidatorRule} - Union type that includes this
 * @see {@link IValidatorRuleName} - Valid rule names
 * @see {@link IValidatorRulesMap} - Parameter type definitions
 * @see {@link IValidatorRuleFunction} - Function-based rules
 * @public
 */
export type IValidatorRuleObject<Context = unknown> = Partial<{
  [K in IValidatorRuleName]: IValidatorRulesMap<Context>[K];
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
 * const rules1: IValidatorRules = ["Required", "Email"];
 *
 * // Using parameterized rules
 * const rules2: IValidatorRules = ["Required", "MinLength[5]", "MaxLength[100]"];
 *
 * // Using validation functions
 * const rules3: IValidatorRules = [
 *   "Required",
 *   ({ value }) => value.length >= 5 || "Too short"
 * ];
 *
 * // Using rule objects
 * const rules4: IValidatorRules = [
 *   { ruleName: "Required" },
 *   { ruleName: "MinLength", params: [8] }
 * ];
 * ```
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorRule} - Individual rule type
 * @see {@link IValidatorValidateOptions} - Options interface that uses this type
 * @see {@link Validator.validate} - Validation method that accepts these rules
 */
export type IValidatorRules<Context = unknown> = Array<IValidatorRule<Array<any>, Context>>;
/**
 * @typedef IValidatorSanitizedRule
 * Represents a sanitized validation rule.
 *
 * This type can either be a validation rule function or an object that contains
 * detailed information about a validation rule, including its name, parameters,
 * and the function that implements the validation logic.
 *
 * @example
 * // Example of a validation rule function
 * const minLengthRule: IValidatorSanitizedRule = ({ value }) => {
 *     return value.length >= 5 || "Minimum length is 5 characters.";
 * };
 *
 * // Example of a sanitized rule object
 * const sanitizedRule: IValidatorSanitizedRule = {
 *     ruleName: "minLength",
 *     params: [5],
 *     ruleFunction: minLengthRule,
 * };
 */
export type IValidatorSanitizedRule<ParamsType extends IValidatorRuleParams = IValidatorRuleParams, Context = unknown> = IValidatorRuleFunction<ParamsType, Context> | IValidatorSanitizedRuleObject<ParamsType, Context>;

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
 * const sanitizedRule: IValidatorSanitizedRuleObject = {
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
 * ### Relationship to IValidatorSanitizedRule
 * This interface is one of the union members of {@link IValidatorSanitizedRule}.
 * The union allows rules to be represented as either:
 * - A direct function (`IValidatorRuleFunction`)
 * - A structured object (`IValidatorSanitizedRuleObject`)
 *
 * @template ParamsType - The type of parameters that the rule accepts (default: Array<any>)
 * @template Context - The type of the optional validation context
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorSanitizedRule} - Union type that includes this interface
 * @see {@link IValidatorRuleFunction} - The validation function type
 * @see {@link IValidatorRuleName} - Rule name type
 */
export interface IValidatorSanitizedRuleObject<ParamsType extends IValidatorRuleParams = IValidatorRuleParams, Context = unknown> {
  /**
   * The parsed name of the validation rule
   *
   * This is the rule identifier extracted from the original rule specification.
   * For example, if the raw rule was "MinLength[5]", this would be "MinLength".
   * Must be a valid rule name from {@link IValidatorRuleName}.
   *
   * @type {IValidatorRuleName}
   * @example "MinLength"
   * @example "Required"
   * @example "Email"
   *
   * @see {@link IValidatorRuleName}
   */
  ruleName: IValidatorRuleName;

  /**
   * The parameters extracted from the rule specification
   *
   * Array of values that were parsed from the rule's parameter brackets.
   * For example, "MinLength[5,10]" would result in `[5, 10]`.
   * Empty array for rules that don't take parameters.
   *
   * @type {ParamsType}
   * @example [] // For "Required" rule
   * @example [5] // For "MinLength[5]" rule
   * @example [0, 100] // For "NumberBetween[0,100]" rule
   */
  params: ParamsType;

  /**
   * The validation function that implements the rule logic
   *
   * The actual executable function that performs the validation.
   * This function receives validation options and returns a result
   * indicating whether the validation passed or failed.
   *
   * @type {IValidatorRuleFunction<ParamsType, Context>}
   * @see {@link IValidatorRuleFunction}
   */
  ruleFunction: IValidatorRuleFunction<ParamsType, Context>;

  /**
   * The original unparsed rule specification
   *
   * The raw rule string as it was originally provided, before parsing.
   * This is useful for error reporting and debugging, as it shows
   * exactly what the user specified.
   *
   * @type {IValidatorRuleName | string}
   * @example "MinLength[5]"
   * @example "Required"
   * @example "Email"
   */
  rawRuleName: IValidatorRuleName | string;
}
/**
 * @typedef IValidatorSanitizedRules
 * Represents an array of sanitized validation rules.
 *
 * This type is a collection of sanitized rules, allowing for multiple
 * validation rules to be applied in a structured manner.
 *
 * @template Context The type of the optional validation context.
 *
 * @example
 * const sanitizedRules: IValidatorSanitizedRules = [
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
export type IValidatorSanitizedRules<Context = unknown> = IValidatorSanitizedRule<Array<any>, Context>[];

/**
 * @typedef IValidatorRuleFunction
 *
 * Represents a validation rule function that is used within the validation system.
 * This function takes a set of options and performs validation on a given value,
 * returning the result of the validation process.
 *
 * @template ParamsType The type of the parameters that the rule function accepts.
 *
 * ### Structure:
 * - The function accepts a single parameter:
 *   - `options` (IValidatorValidateOptions): An object containing the necessary parameters for validation.
 *
 * ### Parameters:
 * - **options**: An object of type `IValidatorValidateOptions` which includes:
 *   - `rules`: A collection of validation rules to apply. This can be a single rule or an array of rules.
 *   - `rule`: An optional specific validation rule to apply, overriding the rules defined in the `rules` property.
 *   - `value`: The actual value that needs to be validated against the specified rules.
 *   - `ruleParams`: Optional parameters that may be required for specific validation rules.
 *
 * ### Return Value:
 * - The function returns an `IValidatorResult`, which can be one of the following:
 *   - A `Promise<boolean | string>`: Indicates asynchronous validation. If resolved to `true`, the validation has succeeded; if resolved to a `string`, it represents an error message indicating a validation failure.
 *   - A `string`: Represents an invalid validation result, where the string contains an error message.
 *   - A `boolean`: Indicates the success (`true`) or failure (`false`) of the validation.
 *
 * ### Example Usage:
 * ```typescript
 * const validateEmail: IValidatorRuleFunction = ({ value }) => {
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
export type IValidatorRuleFunction<ParamsType extends IValidatorRuleParams = IValidatorRuleParams, Context = unknown> = (options: IValidatorValidateOptions<ParamsType, Context>) => IValidatorResult;

/**
 * ## Validation Rule Parameters Type
 *
 * A conditional type that defines the parameter structure for validation rules.
 * This type handles both mutable and readonly array parameters, providing flexibility
 * for validation rules that accept different parameter formats.
 *
 * ### Type Behavior
 * - **Empty Arrays**: When `ParamsType` is an empty array `[]`, resolves to `[]`
 * - **Non-Empty Arrays**: Resolves to either the original `ParamsType` or its readonly variant `Readonly<ParamsType>`
 * - **Readonly Support**: Accepts both `Array<any>` and `ReadonlyArray<any>` as input types
 *
 * ### Purpose
 * This type enables validation rules to accept parameters in multiple formats:
 * - Regular arrays: `[minLength: number]` for `MinLength[5]`
 * - Readonly arrays: `readonly [minLength: number]` for const assertions
 * - Empty parameters: `[]` for rules like `Required` that take no parameters
 *
 * ### Generic Parameters
 * - **ParamsType**: The parameter array type (must extend `Array<any>` or `ReadonlyArray<any>`)
 * - **Context**: Optional context type (defaults to `unknown`)
 *
 * ### Usage in Rule Definitions
 * ```typescript
 * // Rule that takes a single number parameter
 * MinLength: IValidatorRuleParams<[minLength: number], Context>;
 *
 * // Rule that takes min and max number parameters
 * Length: IValidatorRuleParams<[lengthOrMin: number, maxLength?: number], Context>;
 *
 * // Rule that takes no parameters
 * Required: IValidatorRuleParams<[], Context>;
 *
 * // Rule that accepts readonly arrays (e.g., const assertions)
 * IsEnum: IValidatorRuleParams<ReadonlyArray<string>, Context>;
 * ```
 *
 * ### Type Resolution Examples
 * ```typescript
 * // Empty array resolves to empty array
 * type RequiredParams = IValidatorRuleParams<[], Context>; // []
 *
 * // Single parameter array
 * type MinLengthParams = IValidatorRuleParams<[number], Context>; // [number] | readonly [number]
 *
 * // Multiple parameters
 * type BetweenParams = IValidatorRuleParams<[number, number], Context>; // [number, number] | readonly [number, number]
 * ```
 *
 * ### Relationship to Validation System
 * - Used by {@link IValidatorRulesMap} to define parameter types for each rule
 * - Compatible with {@link IValidatorRuleFunction} parameter signatures
 * - Supports both mutable and immutable parameter arrays for flexibility
 *
 * @template ParamsType - The parameter array type (extends Array<any> | ReadonlyArray<any>)
 * @template Context - Optional context type for validation (defaults to unknown)
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorRulesMap} - Uses this type for rule parameter definitions
 * @see {@link IValidatorRuleFunction} - Validation function that receives these parameters
 * @see {@link IValidatorRule} - Complete rule definition including this parameter type
 */
export type IValidatorRuleParams<ParamsType extends Array<any> | ReadonlyArray<any> = Array<any>, Context = unknown> = ParamsType extends [] ? [] : ParamsType;

/**
 * ## Nested Rule Function Options
 *
 * Configuration interface for validating nested objects or complex data structures
 * within the validation system. This interface is specifically designed for rule functions
 * that need to validate target objects (classes with decorators) rather than simple values.
 *
 * ### Purpose
 * Provides a specialized options interface for validation rule functions that operate on
 * nested or complex data structures. Unlike {@link IValidatorValidateOptions} which handles
 * single values, this interface is tailored for scenarios where validation rules need to
 * work with entire class instances or nested object hierarchies.
 *
 * ### Key Differences from IValidatorValidateOptions
 * - **Extends from IValidatorValidateTargetOptions**: Inherits target-specific properties
 * - **Omits "data" property**: Uses its own `data` property instead
 * - **Optional value property**: Accepts target data instead of single values
 * - **Flexible data property**: Allows any record structure for nested validation
 *
 * ### Inheritance Structure
 * ```
 * IValidatorNestedRuleFunctionOptions
 *   ↳ extends Omit<IValidatorValidateTargetOptions<Target, Context, [target: Target]>, "data">
 *     ↳ extends Omit<IValidatorValidateOptions<ParamsType, Context>, "data" | "rule" | "value">
 *       ↳ extends Omit<Partial<IInputFormatterResult>, "value">
 *         ↳ extends BaseData<Context>
 * ```
 *
 * ### Generic Parameters
 * - **Target**: The class constructor type being validated (extends `IClassConstructor`)
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
 * const validateNestedProfile: IValidatorRuleFunction<
 *   [target: UserProfile],
 *   ValidationContext
 * > = async (options: IValidatorNestedRuleFunctionOptions<UserProfile, ValidationContext>) => {
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
 * - **Complements**: {@link IValidatorValidateTargetOptions} for target validation
 * - **Extends**: {@link IValidatorValidateOptions} with target-specific modifications
 * - **Supports**: Complex nested object validation scenarios
 *
 * ### Common Use Cases
 *
 * #### 1. Nested Object Validation
 * ```typescript
 * const options: IValidatorNestedRuleFunctionOptions<User, Context> = {
 *   value: userInstance,        // Full user object
 *   data: { parentForm: form }, // Additional context
 *   propertyName: "user",       // Property being validated
 *   context: validationContext, // Typed context
 * };
 * ```
 *
 * #### 2. Array of Objects Validation
 * ```typescript
 * const options: IValidatorNestedRuleFunctionOptions<Item[], Context> = {
 *   value: itemsArray,          // Array of items
 *   data: { index: 0 },         // Current index context
 *   propertyName: "items",      // Array property name
 * };
 * ```
 *
 * #### 3. Conditional Nested Validation
 * ```typescript
 * const options: IValidatorNestedRuleFunctionOptions<Address, Context> = {
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
 * @template Target - The class constructor type being validated (must extend IClassConstructor)
 * @template Context - Optional context type for validation (defaults to unknown)
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorValidateTargetOptions} - Base target validation options
 * @see {@link IValidatorValidateOptions} - Single-value validation options
 * @see {@link Validator.validateNestedRule} - Method that uses this interface
 * @see {@link IValidatorValidateTargetData} - Target data type
 * @see {@link IClassConstructor} - Class constructor constraint
 */
export interface IValidatorNestedRuleFunctionOptions<Target extends IClassConstructor = IClassConstructor, Context = unknown> extends Omit<IValidatorValidateTargetOptions<Target, Context, [target: Target]>, "data"> {
  value?: IValidatorValidateTargetData<Target>;
  data?: Record<string, any>;
}

/**
 * @interface IValidatorRuleName
 * Represents the name of a validation rule as defined in the `IValidatorRulesMap`.
 *
 * The `IValidatorRuleName` type is a union of string literal types that correspond to the keys
 * of the `IValidatorRulesMap` interface. This allows for type-safe access to the names of
 * validation rules, ensuring that only valid rule names can be used in contexts where a rule name
 * is required.
 *
 * ### Structure:
 * - The type is derived from the keys of the `IValidatorRulesMap`, meaning it will include
 *   all the rule names defined in that map.
 *
 * ### Example:
 *
 * ```typescript
 * const ruleName: IValidatorRuleName = "required"; // Valid
 * const anotherRuleName: IValidatorRuleName = "minLength"; // Valid
 *
 * // Usage in a function that accepts a rule name
 * function getValidationRule(ruleName: IValidatorRuleName) {
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
export type IValidatorRuleName = keyof IValidatorRulesMap & string;
/**
 * Represents a mapping of validation rule names to their corresponding validation rules.
 *
 * The `IValidatorRulesMap` interface defines an object where each key is a string
 * representing the name of a validation rule, and the value is the corresponding validation rule
 * of type `IValidatorRule`. This allows for easy retrieval and management of validation rules
 * by name.
 *
 * ### Structure:
 * - **Key**: A string representing the name of the validation rule.
 * - **Value**: An `IValidatorRule`, which can be a string, a function, or an array of rules.
 *
 * ### Example:
 *
 * ```typescript
 * const validationRules: IValidatorRulesMap = {
 *     required: "required",
 *     minLength: ({ value }) => value.length >= 5 || "Minimum length is 5 characters.",
 *     maxLength: ({ value }) => value.length <= 10 || "Maximum length is 10 characters.",
 * };
 *
 * // Usage
 * const requiredRule = validationRules["required"]; // "required"
 * const minLengthRule = validationRules["minLength"]; // Function for min length validation
 * ```
 *
 * This interface is useful for organizing and managing validation rules in a structured way,
 * making it easier to apply and reference them in  validation scenarios.
 */
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
 * expected parameter structure.
 *
 * ### Type Structure
 * - **Key**: Rule name (string literal from {@link IValidatorRuleName})
 * - **Value**: Parameter array type (extends {@link IValidatorRuleParams})
 * - **Context**: Optional validation context type (defaults to `unknown`)
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
 * - Generate {@link IValidatorRuleName} union type
 * - Create {@link IValidatorRegisteredRules} registry type
 * - Validate rule definitions in rule implementation files
 *
 * ### Rule Categories
 *
 * #### Presence Validation
 * - **Required**: Ensures value is present and not empty
 * - **Nullable**: Allows null/undefined values (skips validation)
 * - **Optional**: Allows undefined values (skips validation)
 * - **Empty**: Allows empty strings (skips validation for "")
 *
 * #### Type Validation
 * - **String**: Validates value is a string
 * - **Number**: Validates value is a number
 * - **NonNullString**: Validates value is a non-null string
 *
 * #### String Validation
 * - **MinLength**: Minimum character length requirement
 * - **MaxLength**: Maximum character length limit
 * - **Length**: Exact length or length range requirement
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
 * Required: IValidatorRuleParams<[], Context>;           // "Required"
 * Email: IValidatorRuleParams<[], Context>;              // "Email"
 *
 * // Rules with single parameters
 * MinLength: IValidatorRuleParams<[number], Context>;    // "MinLength[5]"
 * NumberEqual: IValidatorRuleParams<[number], Context>;  // "NumberEqual[42]"
 *
 * // Rules with optional parameters
 * PhoneNumber: IValidatorRuleParams<[ICountryCode?], Context>; // "PhoneNumber" or "PhoneNumber[US]"
 *
 * // Rules with multiple parameters
 * Length: IValidatorRuleParams<[number, number?], Context>; // "Length[5]" or "Length[5,10]"
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
 * @template Context - Type of the optional validation context (defaults to unknown)
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorRuleName} - Union type derived from this interface's keys
 * @see {@link IValidatorRegisteredRules} - Registry type using this interface
 * @see {@link IValidatorRuleParams} - Base parameter type for all rules
 * @see {@link Validator} - Main validator class that uses these rules
 */
export interface IValidatorRulesMap<Context = unknown> {
  /**
   * Validator rule that checks if a number is less than or equals a specified value.
   */
  NumberLessThanOrEqual: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a number is less than a specified value.
   */
  NumberLessThan: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a number is greater than or equals a specified value.
   */
  NumberGreaterThanOrEqual: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a number is greater than a specified value.
   */
  NumberGreaterThan: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a number is equal to a specified value.
   */
  NumberEqual: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a number is different from a specified value.
   */
  NumberIsDifferentFrom: IValidatorRuleParams<[number], Context>;

  /**
   * Validator rule that checks if a value is present and not empty.
   */
  Required: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that validates the length of a string.
   */
  Length: IValidatorRuleParams<[lengthOrMinLength: number, maxLength?: number], Context>;

  /**
   * Validator rule that checks if a string meets a minimum length requirement.
   */
  MinLength: IValidatorRuleParams<[minLength: number], Context>;

  /**
   * Validator rule that checks if a string does not exceed a maximum length.
   */
  MaxLength: IValidatorRuleParams<[maxLength: number], Context>;

  /**
   * Validator rule that checks if a value is a valid email address format.
   */
  Email: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a valid URL format.
   */
  Url: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a valid file name.
   */
  FileName: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a number.
   */
  Number: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a non-null string.
   */
  NonNullString: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a string.
   */
  String: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that checks if a value is a valid phone number.
   */
  PhoneNumber: IValidatorRuleParams<[countryCode?: ICountryCode], Context>;

  /**
   * Validator rule that checks if a value is a valid email or phone number.
   */
  EmailOrPhoneNumber: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that marks a field as allowing empty strings (validation skipped if "").
   */
  Empty: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that marks a field as nullable (validation skipped if null or undefined).
   */
  Nullable: IValidatorRuleParams<[], Context>;

  /**
   * Validator rule that marks a field as sometimes validated (validation skipped if undefined).
   */
  Optional: IValidatorRuleParams<[], Context>;
}

export interface IValidatorValidateOptions<ParamsType extends IValidatorRuleParams = IValidatorRuleParams, Context = unknown> extends Omit<Partial<IInputFormatterResult>, "value">, BaseData<Context> {
  /**
   * The list of validation rules to apply
   *
   * Array of rules that will be executed in sequence against the value.
   * Each rule can have its own parameters and configuration.
   *
   * @type {IValidatorRule[]}
   * @optional
   *
   * @example
   * ```typescript
   * const options: IValidatorValidateOptions = {
   *   value: "example@test.com",
   *   rules: [
   *     { ruleName: "Required" },
   *     { ruleName: "Email" },
   *     { ruleName: "MaxLength", params: [100] }
   *   ]
   * };
   * ```
   *
   * @see {@link IValidatorRule}
   */
  rules?: IValidatorRules<Context>;

  /**
   * Internal: Sanitized rules after preprocessing
   *
   * This property is used internally by the validator after rules have been
   * parsed and sanitized. Users typically do not need to set this manually.
   *
   * @type {IValidatorSanitizedRules<Context>}
   * @internal
   * @optional
   */
  sanitizedRules?: IValidatorSanitizedRules<Context>;

  /**
   * The current/primary validation rule being applied
   *
   * Specifies the specific rule to apply. Can be used to override or specify
   * a particular rule from the `rules` array, or to apply a single rule directly.
   *
   * @type {IValidatorRule<ParamsType, Context>}
   * @optional
   *
   * @example
   * ```typescript
   * const options: IValidatorValidateOptions = {
   *   value: "test",
   *   rule: { ruleName: "Required" },
   *   propertyName: "username"
   * };
   * ```
   *
   * @see {@link IValidatorRule}
   */
  rule?: IValidatorRule<ParamsType, Context>;

  /**
   * Parameters passed to the validation rule
   *
   * Contains the parameters required by the current rule. For example, for a
   * MinLength rule, this would be `[5]` to require minimum 5 characters.
   * These are typically extracted from raw rule names like "MinLength[5]".
   *
   * @type {ParamsType}
   * @optional
   *
   * @example
   * ```typescript
   * // For MinLength rule
   * const options: IValidatorValidateOptions = {
   *   value: "password123",
   *   rule: { ruleName: "MinLength" },
   *   ruleParams: [8],  // Minimum 8 characters
   *   propertyName: "password"
   * };
   *
   * // For NumberBetween rule
   * const options2: IValidatorValidateOptions = {
   *   value: 50,
   *   rule: { ruleName: "NumberBetween" },
   *   ruleParams: [0, 100],  // Between 0 and 100
   *   propertyName: "percentage"
   * };
   * ```
   */
  ruleParams?: ParamsType;

  /**
   * The name of the validation rule
   *
   * Identifies which validation rule is being applied. Examples include:
   * "Required", "Email", "MinLength", "MaxLength", "Regex", "Custom", etc.
   *
   * @type {IValidatorRuleName}
   * @optional
   *
   * @example
   * ```typescript
   * const options: IValidatorValidateOptions = {
   *   value: "user@example.com",
   *   ruleName: "Email",
   *   propertyName: "email"
   * };
   * ```
   *
   * @see {@link IValidatorRuleName}
   */
  ruleName?: IValidatorRuleName;

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
   * const options: IValidatorValidateOptions = {
   *   value: "test",
   *   rawRuleName: "MinLength[5]",        // Raw form
   *   ruleName: "MinLength",               // Parsed name
   *   ruleParams: [5],                     // Parsed params
   *   propertyName: "username"
   * };
   * ```
   */
  rawRuleName?: IValidatorRuleName | string;

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
   * const options: IValidatorValidateOptions = {
   *   value: "invalid-email",
   *   rules: ["Email"],
   *   message: "Please enter a valid email address (e.g., user@example.com)",
   *   propertyName: "email"
   * };
   *
   * // Custom message for specific context
   * const options2: IValidatorValidateOptions = {
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
   * const options: IValidatorValidateOptions = {
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
   * const options: IValidatorValidateOptions = {
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
   * const options: IValidatorValidateOptions = {
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
 * where at least one rule must pass. This interface extends {@link IValidatorValidateOptions}
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
 * executed in parallel. Each function should follow the {@link IValidatorRuleFunction} signature.
 *
 * ### Usage Context
 * This interface is primarily used internally by the validator when processing "OneOf" rules,
 * but can also be used directly when calling {@link Validator.validateOneOfRule}.
 *
 * ### Examples
 *
 * #### Basic OneOf Validation Setup
 * ```typescript
 * const options: IValidatorValidateMultiRuleOptions = {
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
 * const options: IValidatorValidateMultiRuleOptions<ValidationContext> = {
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
 * @since 1.35.0
 * @see {@link Validator.validateOneOfRule} - Method that uses this interface
 * @see {@link IValidatorValidateOptions} - Base options interface being extended
 * @see {@link IValidatorRuleFunction} - Type of functions in ruleParams array
 * @see {@link IValidatorValidateResult} - Result type returned by validation
 */
export interface IValidatorValidateMultiRuleOptions<Context = unknown, RulesFunctions extends IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>> extends IValidatorValidateOptions<RulesFunctions, Context> {
  startTime?: number;
}
export type IValidatorDefaultMultiRule<Context = unknown, ParamsTypes extends IValidatorRuleParams = any> = Array<IValidatorRule<ParamsTypes, Context>>;

export type IValidatorMultiRuleFunction<Context = unknown, RulesFunctions extends Array<IValidatorRule<Array<any>, Context>> = Array<IValidatorRule<Array<any>, Context>>> = IValidatorRuleFunction<RulesFunctions, Context>;

export type IValidatorValidateTargetData<Target extends IClassConstructor = IClassConstructor> = Partial<Record<keyof InstanceType<Target>, any>>;

/**
 * ## Target Validation Options
 *
 * Configuration interface for validating entire class instances with decorated properties.
 * This interface extends {@link IValidatorValidateOptions} with target-specific properties
 * for complex object validation scenarios.
 *
 * ### Purpose
 * Provides a specialized options interface for validating class instances where multiple
 * properties have validation decorators. Unlike single-value validation, this interface
 * handles validation of entire objects with potentially many fields and nested structures.
 *
 * ### Key Differences from IValidatorValidateOptions
 * - **data property**: Required and typed as target data (not optional generic data)
 * - **Omits "rule" and "value"**: Uses target-specific data structure instead
 * - **parentData**: Supports nested validation context
 * - **errorMessageBuilder**: Customizable error message formatting for target validation
 * - **startTime**: Performance tracking for multi-field validation
 *
 * ### Inheritance Structure
 * ```
 * IValidatorValidateTargetOptions
 *   ↳ extends Omit<IValidatorValidateOptions<ParamsTypes, Context>, "data" | "rule" | "value">
 *     ↳ extends Omit<Partial<IInputFormatterResult>, "value">
 *       ↳ extends BaseData<Context> (but overrides data property)
 * ```
 *
 * ### Generic Parameters
 * - **Target**: The class constructor type being validated (extends `IClassConstructor`)
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **ParamsTypes**: Parameter types for validation rules (defaults to `IValidatorRuleParams`)
 *
 * ### Properties Overview
 *
 * #### Inherited Properties (from IValidatorValidateOptions)
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
 * - **data**: Required target data to validate (typed as `IValidatorValidateTargetData<Target>`)
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
 * const options: IValidatorValidateTargetOptions<UserProfile> = {
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
 *   options: IValidatorValidationError & {
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
 * const options: IValidatorValidateTargetOptions<UserProfile> = {
 *   data: userData,
 *   errorMessageBuilder: customErrorBuilder,
 * };
 * ```
 *
 * ### Nested Validation Context
 * The `parentData` property enables context sharing in nested validations:
 * ```typescript
 * // Parent validation
 * const parentOptions: IValidatorValidateTargetOptions<Company> = {
 *   data: {
 *     name: "ACME Corp",
 *     employees: [employeeData1, employeeData2]
 *   },
 *   parentData: undefined, // Root level
 * };
 *
 * // Nested validation (for each employee)
 * const nestedOptions: IValidatorValidateTargetOptions<Employee> = {
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
 * const options: IValidatorValidateTargetOptions<UserForm> = {
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
 * const formOptions: IValidatorValidateTargetOptions<RegistrationForm> = {
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
 * const apiOptions: IValidatorValidateTargetOptions<CreateUserRequest> = {
 *   data: requestBody,
 *   propertyName: "request",
 *   context: { requestId: req.id, userAgent: req.headers['user-agent'] },
 * };
 * ```
 *
 * #### 3. Nested Object Validation
 * ```typescript
 * const nestedOptions: IValidatorValidateTargetOptions<OrderItem> = {
 *   data: itemData,
 *   parentData: { orderId: "12345", customerId: "67890" },
 *   propertyName: "item",
 *   errorMessageBuilder: customFormatter,
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateTarget} method
 * - **Extends**: {@link IValidatorValidateOptions} with target-specific modifications
 * - **Supports**: Multi-field validation with error aggregation
 * - **Integrates with**: Decorator-based validation system
 *
 * @template Target - The class constructor type being validated (must extend IClassConstructor)
 * @template Context - Optional context type for validation (defaults to unknown)
 * @template ParamsTypes - Parameter types for validation rules (defaults to IValidatorRuleParams)
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorValidateOptions} - Base options interface being extended
 * @see {@link IValidatorValidateTargetData} - Target data type
 * @see {@link Validator.validateTarget} - Method that uses this interface
 * @see {@link IClassConstructor} - Class constructor constraint
 * @see {@link IValidatorValidationError} - Error type for errorMessageBuilder
 */
export interface IValidatorValidateTargetOptions<Target extends IClassConstructor = IClassConstructor, Context = unknown, ParamsTypes extends IValidatorRuleParams = IValidatorRuleParams> extends Omit<IValidatorValidateOptions<ParamsTypes, Context>, "data" | "rule" | "value"> {
  data: IValidatorValidateTargetData<Target>;
  /**
   * The parent data/context for nested validations
   *
   * When validating nested objects, this property holds the parent
   */
  parentData?: Record<string, any>;
  startTime?: number;
  errorMessageBuilder?: (
    translatedPropertyName: string,
    error: string,
    builderOptions: IValidatorValidationError & {
      propertyName: keyof InstanceType<Target> | string;
      translatedPropertyName: string;
      i18n: I18n;
      separators: {
        multiple: string;
        single: string;
      };
      data: Partial<Record<keyof InstanceType<Target>, any>>;
    }
  ) => string;
}

export type IValidatorMultiRuleNames = "OneOf" | "AllOf";
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
 * - {@link IValidatorValidateFailure.error} - Single value validation failures
 * - {@link IValidatorValidateTargetFailure.errors} - Array of errors in target validation
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
 * const error: IValidatorValidationError = {
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
 * @since 1.0.0
 * @see {@link IValidatorValidateFailure} - Single validation failure result
 * @see {@link IValidatorValidateTargetFailure} - Target validation failure result
 * @see {@link Validator.validate} - Method that creates these errors
 * @see {@link Validator.validateTarget} - Method that creates these errors
 */
export interface IValidatorValidationError {
  /** Always 'error' for failures */
  status: "error";

  name: "ValidatorValidationError";

  /** The property name that failed validation (required) */
  fieldName?: string;

  /** Alias for fieldName (required) */
  propertyName?: string;

  /** The validation error message (required) */
  message: string;

  /** Localized field name for user-facing messages */
  translatedPropertyName?: string;

  /** The specific rule that failed */
  ruleName?: IValidatorRuleName;

  /** Parameters passed to the failing rule */
  ruleParams: any[];

  /** The value that failed validation */
  value: any;

  /** Raw rule name with parameters (e.g., "minLength[5]") */
  rawRuleName?: IValidatorRuleName | string;

  /** Error code for programmatic handling */
  code?: string;

  /** Error severity level */
  severity?: "error" | "warning" | "info";

  /** When the validation failed */
  timestamp?: Date;

  /** Additional error metadata */
  metadata?: Record<string, any>;
}

// Single value validation (reuse base types directly)
/**
 * ## Single Value Validation Success Result
 *
 * Represents a successful validation result for a single value.
 * This type is used as the success branch of the {@link IValidatorValidateResult} discriminated union.
 *
 * ### Type Guard
 * Can be narrowed using {@link Validator.isSuccess}:
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // TypeScript knows: result satisfies IValidatorValidateSuccess
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
 *   // result is IValidatorValidateSuccess
 *   console.log("Validated:", result.value);
 *   console.log("Took:", result.duration, "ms");
 *   console.log("Completed at:", result.validatedAt.toISOString());
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorValidateResult}
 * @see {@link IValidatorValidateFailure}
 * @see {@link Validator.validate}
 * @see {@link Validator.isSuccess}
 */
export interface IValidatorValidateSuccess<Context = unknown> extends BaseData<Context> {
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
 * and in the result objects. Used by both {@link IValidatorValidateSuccess}
 * and {@link IValidatorValidateFailure}.
 *
 * ### Properties
 * - **value**: The actual value being validated (required)
 * - **data**: Optional contextual data available to validation rules
 * - **context**: Optional typed context object for advanced validations
 *
 * ### Usage in Validation Results
 * ```typescript
 * // In IValidatorValidateSuccess
 * const successResult: IValidatorValidateSuccess = {
 *   success: true,
 *   value: "user@example.com",  // Original validated value
 *   data: { userId: 123 },      // Additional context
 *   context: { ... },           // Typed context object
 *   validatedAt: new Date(),
 *   duration: 5,
 * };
 *
 * // In IValidatorValidateFailure
 * const failureResult: IValidatorValidateFailure = {
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
 * @since 1.0.0
 * @see {@link IValidatorValidateOptions} - Options passed to validation
 * @see {@link IValidatorValidateSuccess} - Success result type
 * @see {@link IValidatorValidateFailure} - Failure result type
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
  value: any;

  /**
   * Optional data object providing contextual information for validation rules.
   *
   * This property is used to provide additional context for the validation rule.
   * It can be used to pass any additional data that might be needed for validation,
   * such as form data, related field values, or other contextual information.
   *
   * @type {Record<string, any> | undefined}
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
  data?: Record<string, any>;

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
 * This type is used as the failure branch of the {@link IValidatorValidateResult} discriminated union.
 *
 * ### Type Guard
 * Can be narrowed using {@link Validator.isFailure}:
 * ```typescript
 * if (Validator.isFailure(result)) {
 *   // TypeScript knows: result satisfies IValidatorValidateFailure
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
 *   // result is IValidatorValidateFailure
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
 * @since 1.0.0
 * @see {@link IValidatorValidateResult}
 * @see {@link IValidatorValidateSuccess}
 * @see {@link IValidatorValidationError}
 * @see {@link Validator.validate}
 * @see {@link Validator.isFailure}
 */
export interface IValidatorValidateFailure<Context = unknown> extends BaseData<Context> {
  /** Discriminant for type narrowing - always `false` for failure */
  success: false;

  /**
   * The validation error details
   *
   * Contains complete information about what validation rule failed
   * and why, including the rule name, parameters, and error message.
   *
   * @type {IValidatorValidationError}
   * @see {@link IValidatorValidationError}
   */
  error: IValidatorValidationError;

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
 *   // TypeScript knows: IValidatorValidateSuccess
 *   console.log(result.value);      // ✓ Available
 *   console.log(result.validatedAt); // ✓ Available
 *   console.log(result.error);      // ✗ Type error (undefined for success)
 * } else {
 *   // TypeScript knows: IValidatorValidateFailure
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
 *   // result is IValidatorValidateSuccess<Context>
 *   console.log(result.value);
 *   console.log(result.validatedAt);
 * } else if (Validator.isFailure(result)) {
 *   // result is IValidatorValidateFailure<Context>
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
 * - {@link IValidatorValidateSuccess} - When validation passes (success: true)
 * - {@link IValidatorValidateFailure} - When validation fails (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   userId: number;
 * }
 *
 * const result: IValidatorValidateResult<MyContext> = await Validator.validate({
 *   value: "test@example.com",
 *   rules: ["Required", "Email"],
 *   context: { userId: 123 },
 * });
 * ```
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorValidateSuccess} - Success variant
 * @see {@link IValidatorValidateFailure} - Failure variant
 * @see {@link Validator.validate} - Main validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 */
export type IValidatorValidateResult<Context = unknown> = IValidatorValidateSuccess<Context> | IValidatorValidateFailure<Context>;

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
 * - **Field Mapping**: Maps validated data back to class structure with proper typing
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
 *   // result is IValidatorValidateTargetFailure
 *   console.log(result.errors);      // Array of field errors
 *   console.log(result.failureCount); // Number of failed fields
 *   console.log(result.message);     // Summary message
 * }
 * ```
 *
 * ### Properties
 * - **success**: Literal `false` for type discrimination
 * - **errors**: Array of IValidatorValidationError, one per failed field
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
 * @since 1.0.0
 * @see {@link IValidatorValidateTargetResult}
 * @see {@link IValidatorValidationError}
 * @see {@link Validator.validateTarget}
 */
export interface IValidatorValidateTargetFailure<Context = unknown> extends Omit<BaseData<Context>, "value" | "data"> {
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
   * @type {IValidatorValidationError[]}
   * @see {@link IValidatorValidationError}
   */
  errors: IValidatorValidationError[];

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
  status: "error";

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

  data: Record<string, any>;
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
 *   // result is IValidatorValidateTargetSuccess
 *   console.log(result.data);        // Validated instance of T
 *   console.log(result.validatedAt); // Timestamp of validation
 * }
 * ```
 *
 * ### Properties vs Single-Value Success
 * Unlike {@link IValidatorValidateSuccess}, target success uses:
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
 * @since 1.0.0
 * @see {@link IValidatorValidateTargetResult}
 * @see {@link IValidatorValidateSuccess} - Single-value equivalent
 * @see {@link Validator.validateTarget}
 */
export interface IValidatorValidateTargetSuccess<Context = unknown> extends Omit<BaseData<Context>, "data"> {
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
  status: "success";

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

  data: Record<string, any>;
}

/**
 * ## Class Validation Result Type (Discriminated Union)
 *
 * Discriminated union type representing the result of a {@link Validator.validateTarget} operation.
 * Can be either {@link IValidatorValidateTargetSuccess} or {@link IValidatorValidateTargetFailure}.
 *
 * ### Type Narrowing Strategies
 *
 * **Strategy 1: Check `success` property**
 * ```typescript
 * const result = await Validator.validateTarget(UserForm, data);
 *
 * if (result.success) {
 *   // result is IValidatorValidateTargetSuccess<T>
 *   console.log(result.data);        // Class instance with all fields valid
 *   console.log(result.validatedAt); // Validation timestamp
 * } else {
 *   // result is IValidatorValidateTargetFailure
 *   console.log(result.errors);      // Array of field-level errors
 *   console.log(result.failureCount); // Number of failed fields
 * }
 * ```
 *
 * **Strategy 2: Use switch statement**
 * ```typescript
 * switch (result.status) {
 *   case "success":
 *     // result is IValidatorValidateTargetSuccess
 *     await saveToDatabase(result.data);
 *     break;
 *   case "error":
 *     // result is IValidatorValidateTargetFailure
 *     logErrors(result.errors);
 *     break;
 * }
 * ```
 *
 * **Strategy 3: Use type guard helper**
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // result is IValidatorValidateTargetSuccess
 *   return result.data;
 * }
 * // result is IValidatorValidateTargetFailure
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
 * - {@link IValidatorValidateTargetSuccess} - When all fields pass (success: true)
 * - {@link IValidatorValidateTargetFailure} - When one or more fields fail (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 * @since 1.0.0
 * @see {@link IValidatorValidateTargetSuccess} - Success variant
 * @see {@link IValidatorValidateTargetFailure} - Failure variant
 * @see {@link Validator.validateTarget} - Main target validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 * @see {@link IValidatorValidateResult} - Single-value equivalent
 */
export type IValidatorValidateTargetResult<Context = unknown> = IValidatorValidateTargetSuccess<Context> | IValidatorValidateTargetFailure<Context>;

/**
 * ## Registered Validation Rules Registry
 *
 * A type-safe registry mapping validation rule names to their corresponding validation functions.
 * This mapped type provides compile-time guarantees that only valid rule names can be used
 * to access their associated validation functions.
 *
 * ### Purpose
 * Serves as the central registry for all built-in validation rules in the validator system.
 * Enables type-safe retrieval and execution of validation functions by their string names,
 * preventing runtime errors from invalid rule name lookups.
 *
 * ### Type Structure
 * - **Key**: `IValidatorRuleName` - Valid rule names from {@link IValidatorRulesMap}
 * - **Value**: `IValidatorRuleFunction<Params, Context>` - Corresponding validation function
 * - **Mapped Type**: `[K in IValidatorRuleName]` ensures all rule names have functions
 *
 * ### Type Safety Benefits
 * - **Compile-time Validation**: Only valid rule names can be used as keys
 * - **Parameter Type Safety**: Each rule function has correctly typed parameters
 * - **Context Propagation**: Context types are properly maintained throughout
 * - **Rule Function Signature**: Ensures consistent function signatures across all rules
 *
 * ### Usage in Validator Class
 * This type is primarily used internally by the {@link Validator} class:
 * - {@link Validator.getRules} returns an instance of this type
 * - {@link Validator.validateTarget} uses it to retrieve rule functions by name
 * - Rule execution methods access functions through this registry
 *
 * ### Example Structure
 * ```typescript
 * const rules: IValidatorRegisteredRules = {
 *   Required: (params, context) => { /* validation logic *\/ },
 *   Email: (params, context) => { /* email validation *\/ },
 *   MinLength: ([minLen], context) => { /* length validation *\/ },
 *   // ... all other built-in rules
 * };
 * ```
 *
 * ### Relationship to Other Types
 * - **Source of Keys**: Keys come from {@link IValidatorRuleName} (derived from {@link IValidatorRulesMap})
 * - **Function Signatures**: Values are {@link IValidatorRuleFunction} instances
 * - **Parameter Types**: Parameters typed via {@link IValidatorRulesMap} lookups
 * - **Context**: Context type propagated from generic parameter
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
 * @since 1.0.0
 * @see {@link IValidatorRuleName} - Valid rule names (keys of this registry)
 * @see {@link IValidatorRulesMap} - Rule parameter definitions
 * @see {@link IValidatorRuleFunction} - Validation function signature
 * @see {@link Validator.getRules} - Method that returns this registry
 * @see {@link Validator.validateTarget} - Method that uses this registry
 */
export type IValidatorRegisteredRules<Context = unknown> = {
  [K in IValidatorRuleName]: IValidatorRuleFunction<IValidatorRulesMap<Context>[K], Context>;
};
