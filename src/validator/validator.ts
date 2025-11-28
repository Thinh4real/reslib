import {
  buildPropertyDecorator,
  getDecoratedProperties,
} from '@/resources/decorators';
import { ClassConstructor, Dictionary, MakeOptional } from '@/types';
import {
  defaultStr,
  isEmpty,
  isNonNullString,
  isNumber,
  isObj,
  lowerFirst,
  stringify,
} from '@utils/index';
import { I18n, i18n as defaultI18n } from '../i18n';
import { VALIDATOR_RULE_MARKERS } from './rulesMarkers';
import {
  ValidatorAsyncResult,
  ValidatorDefaultMultiRule,
  ValidatorMultiRuleFunction,
  ValidatorMultiRuleNames,
  ValidatorNestedRuleFunctionOptions,
  ValidatorResult,
  ValidatorRule,
  ValidatorRuleFunction,
  ValidatorRuleFunctionsMap,
  ValidatorRuleName,
  ValidatorRuleObject,
  ValidatorRuleParams,
  ValidatorRules,
  ValidatorSanitizedRuleObject,
  ValidatorSanitizedRules,
  ValidatorValidateFailure,
  ValidatorValidateMultiRuleOptions,
  ValidatorValidateOptions,
  ValidatorValidateResult,
  ValidatorValidateSuccess,
  ValidatorValidateTargetOptions,
  ValidatorValidateTargetResult,
  ValidatorValidationError,
} from './types';

/**
 * # Validator Class
 *
 * A comprehensive validation system that provides flexible and powerful validation capabilities
 * for TypeScript/JavaScript applications. This class supports both synchronous and asynchronous
 * validation, decorator-based validation for classes, and a rich ecosystem of validation rules.
 *
 * ## Key Features
 * - **Type-Safe Validation**: Full TypeScript support with generic types
 * - **Decorator Support**: Class property validation using decorators
 * - **Async Validation**: Support for asynchronous validation rules
 * - **Internationalization**: Built-in i18n support for error messages
 * - **Extensible**: Easy to register custom validation rules
 * - **Rule Composition**: Combine multiple validation rules
 *
 * ## Basic Usage
 * ```typescript
 * // Register a custom validation rule
 * Validator.registerRule('CustomRule', ({ value }) => {
 *   return value > 10 || 'Value must be greater than 10';
 * });
 *
 * // Validate a single value
 * const result = await Validator.validate({
 *   value: 15,
 *   rules: ['Required', 'CustomRule']
 * });
 *
 * // Use with decorators
 * class User {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   @MinLength(3)
 *   name: string;
 * }
 *
 * const userData = { email: 'user@example.com', name: 'John' };
 * const validated = await Validator.validateTarget(User, userData);
 * ```
 *
 * ## Advanced Usage
 * ```typescript
 * // Complex validation with context
 * const validationOptions = {
 *   value: userData,
 *   rules: [
 *     'required',
 *     { minLength: [5] },
 *     async ({ value, context }) => {
 *       const exists = await checkIfUserExists(value);
 *       return !exists || 'User already exists';
 *     }
 *   ],
 *   context: { userId: 123 }
 * };
 *
 * try {
 *   const result = await Validator.validate(validationOptions);
 *   console.log('Validation passed!', result);
 * } catch (error) {
 *   console.error('Validation failed:', error.message);
 * }
 * ```
 *
 * @author Resk Framework Team
 *
 * @version 2.1.0
 * @see {@link https://docs.resk.dev/validation | Validation Documentation}
 * @public
 */
export class Validator {
  private static readonly RULES_METADATA_KEY = Symbol.for('validationRules');

  /**
   * ## Register Validation Rule
   *
   * Registers a new custom validation rule that can be used throughout the application.
   * This method provides type-safe registration of validation functions with proper
   * error handling and validation of input parameters.
   *
   * ### Type Parameters
   * - `TParams` - Array type defining the parameters the rule function accepts
   * - `Context` - Type of the validation context object passed to the rule
   *
   * ### Rule Function Signature
   * ```typescript
   * type RuleFunction<TParams, Context> = (options: {
   *   value: any;
   *   ruleParams: TParams;
   *   context?: Context;
   *   fieldName?: string;
   *   translatedPropertyName?: string;
   * }) => ValidatorResult
   * ```
   *
   * ### Rule Return Values
   * - `true` - Validation passed
   * - `false` - Validation failed (uses default error message)
   * - `string` - Validation failed with custom error message
   * - `ValidatorAsyncResult` - Async validation
   *
   * @example
   * ```typescript
   * // Simple synchronous rule
   * Validator.registerRule('MinValue', ({ value, ruleParams }) => {
   *   const [minValue] = ruleParams;
   *   return value >= minValue || `Value must be at least ${minValue}`;
   * });
   *
   * // Async rule with database check
   * Validator.registerRule('UniqueEmail', async ({ value, context }) => {
   *   const exists = await database.user.findByEmail(value);
   *   return !exists || 'Email address is already taken';
   * });
   *
   * // Rule with multiple parameters
   * Validator.registerRule('Between', ({ value, ruleParams }) => {
   *   const [min, max] = ruleParams;
   *   return (value >= min && value <= max) ||
   *          `Value must be between ${min} and ${max}`;
   * });
   *
   * // Rule with context
   * Validator.registerRule('DifferentFrom', ({ value, ruleParams, context }) => {
   *   const [fieldName] = ruleParams;
   *   const otherValue = context?.data?.[fieldName];
   *   return value !== otherValue ||
   *          `Must be different from ${fieldName}`;
   * });
   * ```
   *
   * @template TParams - Array type for rule parameters
   * @template Context - Type for validation context
   *
   * @param {ValidatorOptionalOrEmptyRuleNames} ruleName - Unique identifier for the validation rule (must be non-empty string). This type constrains registration to rules with optional or empty parameters only (e.g., Required[], Email[], PhoneNumber[countryCode?]) but not rules with required parameters (e.g., MinLength[number]).
   * @param ruleHandler - Function that performs the validation logic
   *
   * @throws {Error} When ruleName is not a non-empty string
   * @throws {Error} When ruleHandler is not a function
   *
   *
   * @see {@link getRule} - Find a registered rule
   * @see {@link getRules} - Get all registered rules
   * @public
   */
  static registerRule<
    TParams extends ValidatorDefaultArray = ValidatorDefaultArray,
    Context = unknown,
  >(
    ruleName: ValidatorRuleName,
    ruleHandler: ValidatorRuleFunction<TParams, Context>
  ): void {
    if (!isNonNullString(ruleName)) {
      throw new Error('Rule name must be a non-empty string');
    }

    if (typeof ruleHandler !== 'function') {
      throw new Error('Rule handler must be a function');
    }
    const existingRules = Validator.getRules();
    const updatedRules = { ...existingRules, [ruleName]: ruleHandler };
    Reflect.defineMetadata(
      Validator.RULES_METADATA_KEY,
      updatedRules,
      Validator
    );
  }

  /**
   * ## Get All Registered Rules
   *
   * Retrieves an immutable copy of all currently registered validation rules.
   * This method provides access to the internal rules registry that contains
   * all custom validation rules registered via {@link registerRule}.
   *
   * ### Rule Registry
   * The Validator maintains a centralized registry of validation rules using
   * TypeScript's Reflect Metadata API. This registry stores rule functions
   * that can be used throughout the validation system.
   *
   * ### Return Value
   * Returns a shallow copy of the rules registry to prevent external modification
   * while allowing inspection of available rules. The returned object maps
   * rule names to their corresponding validation functions.
   *
   * ### Rule Types
   * The registry contains rules registered through {@link registerRule}, which
   * are constrained by {@link ValidatorOptionalOrEmptyRuleNames} to only include
   * rules with optional or empty parameters (e.g., Required[], Email[], PhoneNumber[countryCode?]).
   *
   * ### Use Cases
   * - **Rule Discovery**: List all available validation rules for documentation
   * - **Debugging**: Inspect the current state of the rules registry
   * - **Testing**: Verify rule registration in unit tests
   * - **Introspection**: Build dynamic validation UIs or rule explorers
   * - **Rule Analysis**: Examine rule implementations programmatically
   *
   * ### Performance
   * This method performs a shallow copy of the rules object, ensuring that
   * external modifications cannot affect the internal registry while providing
   * efficient access to rule functions.
   *
   * @example
   * ```typescript
   * // Get all registered rules
   * const allRules = Validator.getRules();
   * console.log('Available rules:', Object.keys(allRules));
   * console.log('Total rules registered:', Object.keys(allRules).length);
   *
   * // Check if specific rules exist
   * const hasEmailRule = 'Email' in Validator.getRules();
   * const hasRequiredRule = 'Required' in Validator.getRules();
   *
   * // Access rule functions directly (not recommended for normal use)
   * const rules = Validator.getRules();
   * const emailRule = rules['Email'];
   * if (emailRule) {
   *   // Use rule directly (bypasses normal validation pipeline)
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   * }
   *
   * // Iterate through all rules for analysis
   * const rulesRegistry = Validator.getRules();
   * for (const [ruleName, ruleFunction] of Object.entries(rulesRegistry)) {
   *   console.log(`Rule: ${ruleName}, Type: ${typeof ruleFunction}`);
   * }
   *
   * // Use in testing to verify rule registration
   * describe('Rule Registration', () => {
   *   test('should register custom rules', () => {
   *     const rulesBefore = Object.keys(Validator.getRules());
   *     Validator.registerRule('CustomRule', ({ value }) => value === 'valid');
   *     const rulesAfter = Object.keys(Validator.getRules());
   *     expect(rulesAfter.length).toBe(rulesBefore.length + 1);
   *     expect(rulesAfter).toContain('CustomRule');
   *   });
   * });
   * ```
   *
   * @template Context - Optional type for validation context (passed through to rule functions)
   *
   * @returns A shallow copy of all registered validation rules as ValidatorRuleFunctionsMap<Context>
   *          - Keys: Rule names (ValidatorRuleName strings)
   *          - Values: Rule validation functions (ValidatorRuleFunction)
   *          - Empty object if no rules are registered
   *          - Immutable copy prevents external modification
   *
   * @remarks
   * - Returns a new object each time to prevent external mutations
   * - Rules are stored using Reflect Metadata API on the Validator class
   * - Only includes rules registered via registerRule (not built-in decorator rules)
   * - Rule functions maintain their original type signatures and context requirements
   * - Useful for debugging, testing, and building rule management interfaces
   *
   * @see {@link registerRule} - Register a new validation rule
   * @see {@link getRule} - Get a specific rule by name
   * @see {@link hasRule} - Check if a rule exists (type guard)
   * @see {@link ValidatorRuleFunctionsMap} - Type definition for the returned map
   * @see {@link ValidatorOptionalOrEmptyRuleNames} - Type constraint for registered rules
   * @public
   */
  static getRules<Context = unknown>(): ValidatorRuleFunctionsMap<Context> {
    const rules = Reflect.getMetadata(Validator.RULES_METADATA_KEY, Validator);
    return isObj(rules)
      ? { ...rules }
      : ({} as ValidatorRuleFunctionsMap<Context>);
  }
  /**
   * ## Get Registered Rule
   *
   * Retrieves a specific validation rule function by its registered name. This method
   * provides direct access to individual validation functions that have been registered
   * with the Validator system through {@link registerRule}.
   *
   * ### Rule Retrieval
   * This method looks up a single rule in the internal rules registry by name. It serves
   * as a convenience method that delegates to {@link getRules} but returns only the
   * requested rule function, or `undefined` if the rule doesn't exist.
   *
   * ### Registry Lookup
   * The method performs a direct key lookup in the rules registry maintained by
   * {@link getRules}. This registry contains only rules registered via {@link registerRule},
   * which are constrained by {@link ValidatorOptionalOrEmptyRuleNames}.
   *
   * ### Return Value
   * - Returns the validation rule function if found
   * - Returns `undefined` if no rule with the given name exists
   * - The returned function has the signature `ValidatorRuleFunction<TParams, Context>`
   *
   * ### Use Cases
   * - **Direct Rule Access**: Get a specific rule function for programmatic use
   * - **Rule Inspection**: Examine the implementation of a particular validation rule
   * - **Dynamic Validation**: Access rules by name at runtime
   * - **Rule Testing**: Verify rule registration and functionality in tests
   * - **Custom Validation Logic**: Build custom validation workflows using existing rules
   *
   * ### Performance
   * This method performs a single hash map lookup in the rules registry, making it
   * very efficient for retrieving individual rules. The underlying registry is
   * maintained as a shallow copy to prevent external mutations.
   *
   * @example
   * ```typescript
   * // Get a specific rule function
   * const emailRule = Validator.getRule('Email');
   * if (emailRule) {
   *   // Use the rule directly (bypasses normal validation pipeline)
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   *   console.log('Direct email validation result:', result);
   * }
   *
   * // Safe rule access with existence check
   * const customRule = Validator.getRule('CustomRule');
   * if (customRule) {
   *   console.log('CustomRule is available for use');
   *   // Rule exists and is ready to use
   * } else {
   *   console.log('CustomRule is not registered');
   *   // Handle missing rule case
   * }
   *
   * // Get rule for custom validation logic
   * const minLengthRule = Validator.getRule('MinLength');
   * if (minLengthRule) {
   *   const customValidator = async (value: string, minLen: number) => {
   *     const result = await minLengthRule({
   *       value,
   *       ruleParams: [minLen]
   *     });
   *     return result === true ? 'Valid' : 'Invalid';
   *   };
   *
   *   console.log(await customValidator('hello', 3)); // 'Valid'
   *   console.log(await customValidator('hi', 5));    // 'Invalid'
   * }
   *
   * // Rule inspection and analysis
   * const allRules = Validator.getRules();
   * for (const ruleName of Object.keys(allRules)) {
   *   const rule = Validator.getRule(ruleName);
   *   console.log(`Rule: ${ruleName}, Function: ${rule?.name || 'anonymous'}`);
   * }
   *
   * // Testing rule registration
   * describe('Rule Registration', () => {
   *   test('should register and retrieve custom rule', () => {
   *     Validator.registerRule('TestRule', ({ value }) => value === 'test');
   *     const retrievedRule = Validator.getRule('TestRule');
   *     expect(retrievedRule).toBeDefined();
   *     expect(typeof retrievedRule).toBe('function');
   *   });
   * });
   * ```
   *
   * @template Context - Optional type for validation context (passed through to rule functions)
   *
   * @param ruleName - The name of the validation rule to retrieve (must be a valid ValidatorRuleName)
   *
   * @returns The validation rule function if found, undefined otherwise
   *          - Function signature: `ValidatorRuleFunction<TParams, Context>`
   *          - Returns `undefined` if rule doesn't exist in registry
   *          - Rule function maintains its original type signatures and behavior
   *
   * @remarks
   * - This method delegates to `getRules()` internally for registry access
   * - Only returns rules registered via `registerRule()` (not built-in decorator rules)
   * - Rules are constrained by `ValidatorOptionalOrEmptyRuleNames` type constraints
   * - Direct rule function calls bypass the normal validation pipeline
   * - Always check for `undefined` return value before using the rule
   * - Useful for building custom validation logic and rule introspection
   * - Rule functions expect the standard `ValidatorRuleFunction` parameter structure
   *
   * @see {@link getRules} - Get all registered rules as a map
   * @see {@link registerRule} - Register a new validation rule
   * @see {@link getRule} - Type-safe rule retrieval with generics
   * @see {@link hasRule} - Check if a rule exists (type guard)
   * @see {@link ValidatorRuleFunction} - Type definition for rule functions
   * @see {@link ValidatorOptionalOrEmptyRuleNames} - Type constraint for registered rules
   * @public
   */
  static getRule<Context = unknown>(ruleName: ValidatorRuleName) {
    return this.getRules<Context>()[ruleName];
  }
  /**
   * ## Check Rule Existence (Type Guard)
   *
   * Type guard method that checks whether a validation rule with the given name
   * is registered in the Validator system. This method provides both existence
   * checking and TypeScript type narrowing for rule names.
   *
   * ### Type Guard Behavior
   * - **Input Validation**: First checks if the input is a non-null string
   * - **Rule Lookup**: Uses `getRule` to check if the rule exists in the registry
   * - **Type Narrowing**: Narrows `ruleName` to `ValidatorRuleName` if it returns true
   *
   * ### Use Cases
   * - **Safe Rule Access**: Verify rule existence before using `getRule`
   * - **Dynamic Validation**: Check rules at runtime before applying them
   * - **Type Safety**: Enable TypeScript to narrow types based on rule existence
   * - **Error Prevention**: Avoid undefined access when working with rule names
   *
   * @example
   * ```typescript
   * // Basic existence check
   * if (Validator.hasRule('Email')) {
   *   console.log('Email rule is available');
   * }
   *
   * // Type narrowing with type guard
   * function processRule(ruleName: string) {
   *   if (Validator.hasRule(ruleName)) {
   *     // TypeScript now knows ruleName is ValidatorRuleName
   *     const rule = Validator.getRule(ruleName); // Type safe
     return rule;
   *   } else {
   *     console.log(`${ruleName} is not a valid rule`);
     return null;
   *   }
   * }
   *
   * // Safe rule processing
   * const ruleNames = ['Email', 'Required', 'InvalidRule'];
   * const validRules = ruleNames.filter(Validator.hasRule);
   * console.log('Valid rules:', validRules); // ['Email', 'Required']
   *
   * // Dynamic rule application
   * function applyRuleIfExists(value: any, ruleName: string) {
   *   if (Validator.hasRule(ruleName)) {
   *     const rule = Validator.getRule(ruleName);
   *     return rule?.({ value, ruleParams: [] });
   *   }
   *   return 'Rule not found';
   * }
   * ```
   *
   * @param ruleName - The name to check for rule existence (any type, validated internally)
   *
   * @returns `true` if the rule exists and ruleName is a valid ValidatorRuleName, `false` otherwise
   *
   * 
   * @see {@link getRule} - Get the actual rule function
   * @see {@link getRules} - Get all registered rules
   * @see {@link registerRule} - Register a new validation rule
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static hasRule(ruleName: any): ruleName is ValidatorRuleName {
    if (!isNonNullString(ruleName)) {
      return false;
    }
    return !!this.getRule(ruleName);
  }

  private static getI18n(options?: { i18n?: I18n }): I18n {
    if (I18n.isI18nInstance(options?.i18n)) {
      return options.i18n;
    }
    return defaultI18n;
  }

  /**
   * ## Get Error Message Separators
   *
   * Retrieves the configured separators used for formatting validation error messages.
   * This method provides centralized access to internationalized separator strings that
   * ensure consistent error message formatting across different languages and locales.
   *
   * ### Purpose
   * Error message separators are crucial for creating readable, localized error messages
   * when multiple validation failures occur. Different languages use different punctuation
   * conventions (commas, semicolons, periods) for joining error messages, and this method
   * ensures proper internationalization support.
   *
   * ### Separator Types
   * - **`multiple`** - Primary separator for joining multiple error messages
   *   - Default: `", "` (comma + space)
   *   - Used when combining multiple validation errors
   *   - Examples: `"Field is required, Must be email, Too short"`
   * - **`single`** - Secondary separator for single error message formatting
   *   - Default: `", "` (comma + space)
   *   - Used for complex single error messages with multiple parts
   *   - Examples: `"Must be between 5 and 10, but received 15"`
   *
   * ### Internationalization Behavior
   * - Loads separators from i18n translation key: `validator.separators`
   * - Falls back to English defaults (`", "`) if translations unavailable
   * - Supports custom I18n instances for testing or specialized formatting
   * - Automatically adapts to language-specific punctuation conventions
   *
   * ### Use Cases
   * - **Custom Error Builders**: Create consistent error message formatting
   * - **Multi-Field Validation**: Join errors from multiple field validations
   * - **Complex Rules**: Format errors from rules with multiple conditions
   * - **UI Integration**: Ensure error messages match application locale
   * - **Testing**: Verify error message formatting in different languages
   *
   * @example
   * ```typescript
   * // Basic separator retrieval
   * const separators = Validator.getErrorMessageSeparators();
   * console.log(separators); // { multiple: ", ", single: ", " }
   *
   * // Custom error message formatting
   * function formatValidationErrors(fieldName: string, errors: string[]) {
   *   const seps = Validator.getErrorMessageSeparators();
   *   if (errors.length === 0) return null;
   *   if (errors.length === 1) return `${fieldName}: ${errors[0]}`;
   *   return `${fieldName}: ${errors.join(seps.multiple)}`;
   * }
   *
   * const errors = ['Field is required', 'Must be email', 'Too short'];
   * console.log(formatValidationErrors('email', errors));
   * // Output: "email: Field is required, Must be email, Too short"
   *
   * // Using separators in validation result processing
   * const result = await Validator.validate({
   *   value: '',
   *   rules: ['Required', 'Email', 'MinLength[5]'],
   *   fieldName: 'userEmail'
   * });
   *
   * if (!result.success) {
   *   // This would normally be done internally, but for demonstration:
   *   const seps = Validator.getErrorMessageSeparators();
   *   const customMessage = `Validation failed: ${result.error.message}`;
   *   console.log(customMessage);
   * }
   *
   * // Custom I18n instance for testing
   * const customI18n = new I18n({
   *   validator: {
   *     separators: {
   *       multiple: '; ',
   *       single: ' - '
   *     }
   *   }
   * });
   *
   * const customSeparators = Validator.getErrorMessageSeparators(customI18n);
   * console.log(customSeparators); // { multiple: "; ", single: " - " }
   *
   * // Language-specific formatting example
   * // French: "Champ requis, Doit être email, Trop court"
   * // German: "Feld erforderlich, Muss E-Mail sein, Zu kurz"
   * // Japanese: "フィールドは必須です、メールアドレスである必要があります、短すぎます"
   * ```
   *
   * @param customI18n - Optional custom I18n instance to override default translations
   *                     Useful for testing, custom formatting, or specialized locales
   *
   * @returns Object containing separator strings for error message formatting
   * @returns returns.multiple - Separator string for joining multiple error messages (default: `", "`)
   * @returns returns.single - Separator string for single error message formatting (default: `", "`)
   *
   * @remarks
   * - Separators are loaded from i18n key `validator.separators` with fallback defaults
   * - Method is used internally by `validate()` and `validateTarget()` for error formatting
   * - Supports both built-in i18n and custom I18n instances
   * - Thread-safe and stateless - can be called multiple times without side effects
   * - Default separators ensure English-compatible formatting when i18n unavailable
   *
   * @see {@link validate} - Uses these separators for formatting validation error messages
   * @see {@link validateTarget} - Uses these separators for multi-field validation errors
   * @see {@link validateMultiRule} - Uses separators for OneOf/AllOf error aggregation
   * @see {@link validateArrayOfRule} - Uses separators for array item error formatting
   * @see {@link I18n} - Internationalization system for custom separator configuration
   * @public
   */
  static getErrorMessageSeparators(customI18n?: I18n): {
    multiple: string;
    single: string;
  } {
    const i18n = this.getI18n({ i18n: customI18n });
    const translatedSeparator: Dictionary = Object.assign(
      {},
      i18n.getNestedTranslation('validator.separators')
    ) as Dictionary;
    return {
      multiple: defaultStr(translatedSeparator.multiple, ', '),
      single: defaultStr(translatedSeparator.single, ', '),
    };
  }

  /**
   * ## Parse and Validate Rules
   *
   * Core rule normalization method that converts diverse validation rule formats into a standardized,
   * executable representation while identifying and isolating invalid rules. This method serves as
   * the critical preprocessing step that enables flexible rule input while ensuring type safety
   * and consistent validation behavior across the entire validator system.
   *
   * ### Purpose
   * The `parseAndValidateRules` method bridges the gap between user-friendly rule specification
   * and the internal validation engine. It accepts rules in multiple formats (strings, objects, functions)
   * and transforms them into a uniform structure that the validation pipeline can process efficiently.
   * Invalid rules are separated out for error reporting rather than causing validation failures.
   *
   * ### Supported Input Formats
   *
   * #### 1. Function Rules (Direct Validation Functions)
   * ```typescript
   * // Synchronous function rule
   * const positiveRule = ({ value }) => value > 0 || 'Must be positive';
   *
   * // Asynchronous function rule with context
   * const asyncRule = async ({ value, context }) => {
   *   const result = await someAsyncCheck(value, context);
   *   return result || 'Async validation failed';
   * };
   *
   * // Function rules with custom error messages
   * const customRule = ({ value }) => {
   *   if (!value) return 'Value is required';
   *   if (value.length < 3) return 'Must be at least 3 characters';
   *   return true; // Valid
   * };
   * ```
   *
   * #### 2. String Rules (Bracket Notation for Parameters)
   * ```typescript
   * // Simple rules without parameters
   * 'Required'                    // Basic required field check
   * 'Email'                       // Email format validation
   * 'IsNumber'                    // Type checking
   *
   * // Rules with single parameter
   * 'MinLength[5]'               // Minimum length validation
   * 'MaxLength[100]'             // Maximum length validation
   * 'GreaterThan[0]'             // Numeric comparison
   *
   * // Rules with multiple parameters
   * 'Between[10,20]'             // Range validation (inclusive)
   * 'InArray["option1","option2","option3"]'  // Value enumeration
   * 'Matches[/^[A-Z]{2}\d{6}$/]' // Regex pattern matching
   * ```
   *
   * #### 3. Object Rules (Structured Parameter Passing)
   * ```typescript
   * // Rules without parameters
   * { Required: [] }              // Explicit empty parameter array
   * { Email: undefined }          // Undefined parameters (treated as [])
   *
   * // Rules with single parameter
   * { MinLength: [5] }           // Array with one element
   * { MaxLength: [100] }         // Array with one element
   *
   * // Rules with multiple parameters
   * { Between: [10, 20] }        // Range validation
   * { InArray: ['admin', 'user', 'guest'] }  // Multiple allowed values
   * { CustomRule: ['param1', 'param2', 42] } // Mixed parameter types
   * ```
   *
   * ### Processing Logic
   * The method follows a systematic approach to rule processing:
   *
   * 1. **Input Validation**: Accepts `undefined`, empty arrays, or arrays of mixed rule types
   * 2. **Function Detection**: Direct function rules are preserved unchanged in the output
   * 3. **String Parsing**: Bracket syntax is parsed to extract rule names and parameters
   * 4. **Object Processing**: Object notation is converted to standardized rule objects
   * 5. **Rule Registry Lookup**: Each parsed rule is validated against the registered rules map
   * 6. **Error Isolation**: Invalid/unregistered rules are collected separately for reporting
   * 7. **Type Safety**: All output maintains TypeScript type safety with proper generics
   *
   * ### Output Structure
   * The method returns a structured result object with two key properties:
   *
   * #### `sanitizedRules` - Successfully Processed Rules
   * Array of standardized rule objects with consistent structure:
   * ```typescript
   * interface SanitizedRule {
   *   ruleName: ValidatorRuleName;        // Extracted rule name
   *   params: any[];                     // Parameter array (empty for no params)
   *   ruleFunction: ValidatorRuleFunction; // Actual validation function
   *   rawRuleName: string;               // Original input string/object
   * }
   * ```
   *
   * #### `invalidRules` - Unprocessable Rules
   * Array of rules that couldn't be processed (maintains original input types):
   * - Unregistered rule names
   * - Malformed string syntax
   * - Invalid object structures
   * - Rules that failed registry lookup
   *
   * ### Error Handling Strategy
   * - **Graceful Degradation**: Invalid rules don't break the entire validation process
   * - **Error Reporting**: Invalid rules are collected for user feedback
   * - **Type Preservation**: Original rule formats are maintained in invalidRules array
   * - **Validation Continuation**: Valid rules proceed through the validation pipeline
   *
   * @example
   * ```typescript
   * // Mixed rule formats with validation
   * const mixedRules = [
   *   'Required',                           // String rule
   *   'MinLength[3]',                      // Parameterized string rule
   *   { MaxLength: [50] },                 // Object rule
   *   ({ value }) => value.includes('@') || 'Must contain @', // Function rule
   *   'InvalidRule',                       // Will be reported as invalid
   *   { NonExistentRule: ['param'] }       // Will be reported as invalid
   * ];
   *
   * const { sanitizedRules, invalidRules } = Validator.parseAndValidateRules(mixedRules);
   *
   * console.log('Successfully parsed rules:', sanitizedRules.length); // 4
   * console.log('Invalid rules found:', invalidRules.length);         // 2
   * console.log('Invalid rules:', invalidRules);
   * // Output: ['InvalidRule', { NonExistentRule: ['param'] }]
   *
   * // Each sanitized rule has consistent structure
   * sanitizedRules.forEach(rule => {
   *   console.log(`Rule: ${rule.ruleName}, Params: ${rule.params.length}, Raw: ${rule.rawRuleName}`);
   * });
   *
   * // Empty or undefined input handling
   * const { sanitizedRules: emptyRules } = Validator.parseAndValidateRules();
   * console.log('Empty input rules:', emptyRules.length); // 0
   *
   * const { sanitizedRules: undefinedRules } = Validator.parseAndValidateRules(undefined);
   * console.log('Undefined input rules:', undefinedRules.length); // 0
   *
   * // Complex validation scenarios
   * const complexRules = [
   *   'Between[1,100]',                    // Numeric range
   *   { InArray: ['admin', 'user'] },      // Value enumeration
   *   ({ value, context }) => {            // Context-aware function
   *     if (context?.userType === 'admin') return true;
   *     return value !== 'admin' || 'Admin access required';
   *   }
   * ];
   *
   * const result = Validator.parseAndValidateRules(complexRules);
   * console.log('Complex rules processed:', result.sanitizedRules.length); // 3
   * console.log('No invalid rules:', result.invalidRules.length); // 0
   *
   * // Error handling in validation pipeline
   * const validationRules = ['Required', 'Email', 'UnknownRule'];
   * const { sanitizedRules: validRules, invalidRules: errors } = Validator.parseAndValidateRules(validationRules);
   *
   * if (errors.length > 0) {
   *   console.warn('Some validation rules are invalid:', errors);
   *   // Could log to monitoring system or throw custom error
   * }
   *
   * // Proceed with valid rules only
   * const validationResult = await Validator.validate({
   *   value: 'test@example.com',
   *   rules: validRules.map(rule => rule.ruleFunction) // Extract functions for validation
   * });
   * ```
   *
   * @template Context - Optional validation context type passed to rule functions
   *
   * @param inputRules - Array of validation rules in various formats, or undefined
   *                     Supports strings, objects, and functions in any combination
   *                     Undefined or empty arrays are handled gracefully
   *
   * @returns Structured result object containing processed rules and errors
   * @returns returns.sanitizedRules - Array of successfully parsed rule objects with standardized structure
   * @returns returns.invalidRules - Array of rules that couldn't be processed (maintains original format)
   *
   * @remarks
   * - This method is the primary entry point for rule preprocessing in the validation pipeline
   * - Called internally by `validate()` and `validateTarget()` before rule execution
   * - Invalid rules are isolated rather than causing validation failures for better error handling
   * - Supports all rule formats: functions, bracket strings, and parameter objects
   * - Maintains type safety through TypeScript generics for context propagation
   * - Rule registry lookup ensures only registered rules are accepted
   * - Empty input (undefined/null) returns empty arrays without errors
   * - Processing is synchronous and performant for large rule sets
   * - Invalid rules preserve original input format for accurate error reporting
   *
   * @see {@link parseStringRule} - Internal method for parsing bracket notation strings
   * @see {@link parseObjectRule} - Internal method for processing object notation rules
   * @see {@link validate} - Main validation method that uses this preprocessing
   * @see {@link validateTarget} - Class-based validation that uses this preprocessing
   * @see {@link registerRule} - Method for registering custom rules in the system
   * @see {@link getRules} - Method to retrieve all registered rules
   * @see {@link ValidatorSanitizedRules} - Type definition for processed rules
   * @public
   */
  static parseAndValidateRules<Context = unknown>(
    inputRules?: ValidatorValidateOptions<
      ValidatorDefaultArray,
      Context
    >['rules']
  ): {
    sanitizedRules: ValidatorSanitizedRules<Context>;
    invalidRules: ValidatorRules<Context>[];
  } {
    const parsedRules: ValidatorSanitizedRules<Context> = [];
    const registeredRules = this.getRules<Context>();
    const invalidRules: ValidatorRules<Context>[] = [];

    const rulesToProcess = Array.isArray(inputRules) ? inputRules : [];

    for (const rule of rulesToProcess) {
      if (typeof rule === 'function') {
        parsedRules.push(rule);
      } else if (isNonNullString(rule)) {
        const parsedRule = this.parseStringRule<Context>(rule, registeredRules);
        if (parsedRule) {
          parsedRules.push(parsedRule);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          invalidRules.push(rule as any);
        }
      } else if (isObj(rule) && typeof rule === 'object') {
        const parsedObject = this.parseObjectRule<Context>(
          rule,
          registeredRules
        );
        if (parsedObject.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedRules.push(...(parsedObject as any));
        }
      }
    }
    return { sanitizedRules: parsedRules, invalidRules };
  }

  /**
   * ## Parse String-Based Validation Rules
   *
   * Internal helper method that parses string-format validation rules into standardized
   * rule objects. Currently handles simple rule names without parameter parsing.
   * This method is part of the rule preprocessing pipeline that converts various
   * rule formats into a consistent internal representation.
   *
   * ### Current Supported String Formats
   * - `"ruleName"` - Simple rule without parameters (e.g., `"Required"`, `"Email"`)
   *
   * ### Future Parameter Support (Currently Commented Out)
   * The method includes commented code for bracket notation parameter parsing:
   * - `"ruleName[param]"` - Rule with single parameter (planned)
   * - `"ruleName[param1,param2,param3]"` - Rule with multiple parameters (planned)
   *
   * ### Processing Logic
   * 1. **Input Validation**: Accepts any value, converts to trimmed string
   * 2. **Rule Lookup**: Searches registered rules map using the string as rule name
   * 3. **Function Retrieval**: Extracts the validation function if rule exists
   * 4. **Object Construction**: Creates standardized rule object with metadata
   * 5. **Error Handling**: Returns null if rule is not found in registry
   *
   * ### Parameter Handling
   * - Currently no parameter parsing is performed
   - All parameters must be provided via object notation: `{ RuleName: [params] }`
   - Bracket notation parsing is reserved for future implementation
   *
   * ### Return Value Structure
   * When successful, returns a complete rule object:
   * ```typescript
   * {
   *   ruleName: "Required",           // The rule identifier
   *   params: [],                     // Empty array (no parsing yet)
   *   ruleFunction: Function,         // The actual validation function
   *   rawRuleName: "Required"         // Original input string
   * }
   * ```
   *
   * ### Error Cases
   * - **Unknown Rule**: Returns `null` if rule name not found in registry
   * - **Invalid Input**: Any input is accepted (converted to string)
   * - **Empty String**: Empty/whitespace strings return `null`
   *
   * ### Examples
   *
   * #### Basic Rule Parsing
   * ```typescript
   * // Simple rule lookup
   * const rule = Validator.parseStringRule("Required", registeredRules);
   * // Returns: { ruleName: "Required", params: [], ruleFunction: fn, rawRuleName: "Required" }
   *
   * const emailRule = Validator.parseStringRule("Email", registeredRules);
   * // Returns: { ruleName: "Email", params: [], ruleFunction: fn, rawRuleName: "Email" }
   * ```
   *
   * #### Unknown Rule Handling
   * ```typescript
   * const unknownRule = Validator.parseStringRule("UnknownRule", registeredRules);
   * // Returns: null (rule not found)
   * ```
   *
   * #### Current Limitations
   * ```typescript
   * // These currently don't parse parameters (bracket notation commented out)
   * const minLengthRule = Validator.parseStringRule("MinLength[5]", registeredRules);
   * // Returns: null (looks for rule named "MinLength[5]")
   *
   * // Use object notation instead for parameters
   * const objectRule = { MinLength: [5] };
   * const parsedObject = Validator.parseObjectRule(objectRule, registeredRules);
   * // Returns: [{ ruleName: "MinLength", params: [5], ruleFunction: fn, rawRuleName: "MinLength" }]
   * ```
   *
   * #### Integration with Validation Pipeline
   * ```typescript
   * // Used internally by parseAndValidateRules
   * const mixedRules = ["Required", "Email", { MinLength: [3] }];
   * const { sanitizedRules, invalidRules } = Validator.parseAndValidateRules(mixedRules);
   *
   * // String rules are processed by this method
   * // Object rules are processed by parseObjectRule
   * // Function rules are used directly
   * ```
   *
   * ### Performance Characteristics
   * - **Fast Lookup**: O(1) hash map lookup in registered rules
   * - **Minimal Processing**: Only string trimming and function lookup
   * - **Memory Efficient**: Creates minimal rule objects
   * - **Synchronous**: No async operations or I/O
   *
   * ### Future Enhancements
   * - Implement bracket notation parameter parsing
   * - Support nested parameter structures
   * - Add parameter type validation
   * - Support quoted parameters with spaces
   *
   * @template Context - Optional validation context type for rule functions
   *
   * @param ruleString - The string representation of the rule to parse
   *                     Currently only supports simple rule names without parameters
   * @param registeredRules - Map of all currently registered validation rules
   *                          Used to lookup the validation function by rule name
   *
   * @returns ValidatorSanitizedRuleObject with standardized structure, or null if rule not found
   * @returns returns.ruleName - The rule identifier (same as input string)
   * @returns returns.params - Empty array (parameter parsing not implemented)
   * @returns returns.ruleFunction - The actual validation function from registry
   * @returns returns.rawRuleName - The original unparsed rule string
   *
   * @throws {Never} This method never throws errors; returns null for invalid rules
   *
   * @remarks
   * - This is an internal method used by `parseAndValidateRules`
   * - Parameter parsing via bracket notation is planned but currently commented out
   * - For rules with parameters, use object notation: `{ RuleName: [param1, param2] }`
   * - Rule registry lookup ensures only registered rules are accepted
   * - Maintains type safety through TypeScript generics for context propagation
   * - Processing is synchronous and performant for large rule sets
   *
   * @see {@link parseAndValidateRules} - Public method that orchestrates rule parsing
   * @see {@link parseObjectRule} - Handles object notation rules with parameters
   * @see {@link registerRule} - Method for registering rules in the system
   * @see {@link getRules} - Method to retrieve all registered rules
   * @see {@link ValidatorSanitizedRuleObject} - Type definition for parsed rules
   */
  static parseStringRule<Context = unknown>(
    ruleString: string,
    registeredRules: ValidatorRuleFunctionsMap<Context>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    let ruleName = String(ruleString).trim();
    const ruleParameters: string[] = [];
    const ruleFunction = registeredRules[ruleName as ValidatorRuleName];
    if (typeof ruleFunction === 'function') {
      return {
        ruleName: ruleName as ValidatorRuleName,
        params: ruleParameters,
        ruleFunction: ruleFunction as ValidatorRuleFunction,
        rawRuleName: String(ruleString),
      };
    }
    return null;
  }
  static parseFunctionRule<Context = unknown>(
    rule: ValidatorRuleFunction<ValidatorDefaultArray, Context>
  ): ValidatorSanitizedRuleObject<ValidatorDefaultArray, Context> {
    const ruleName =
      getMarkedRuleName(rule) ?? (rule.name as ValidatorRuleName);
    return {
      ruleFunction: rule as ValidatorRuleFunction<
        ValidatorDefaultArray,
        Context
      >,
      ruleName,
      rawRuleName: ruleName,
      params: [],
    };
  }

  /**
   * ## Parse Object Rule
   *
   * Parses object notation validation rules into standardized rule objects. This method handles
   * rules specified as key-value pairs where the key is the rule name and the value is an array
   * of parameters. Object notation allows for more complex rule configurations with explicit
   * parameter passing.
   *
   * ### Object Rule Format
   * Object rules are specified as JavaScript objects where:
   * - **Keys**: Rule names (strings) that correspond to registered validation functions
   * - **Values**: Arrays of parameters to pass to the validation rule function
   *
   * ### Processing Logic
   * 1. **Input Validation**: Ensures `rulesObject` is a valid object, returns empty array otherwise
   * 2. **Rule Iteration**: Iterates through each property in the rules object
   * 3. **Rule Lookup**: Checks if each rule name exists in the registered rules map
   * 4. **Parameter Extraction**: Retrieves the parameter array for each valid rule
   * 5. **Rule Construction**: Creates sanitized rule objects with function references and parameters
   * 6. **Result Aggregation**: Collects all valid rules into a result array
   *
   * ### Parameter Requirements
   * - Rule parameters must be arrays (e.g., `[5]` for MinLength, `[10, 100]` for range rules)
   * - Non-array parameters are ignored (future enhancement may support other formats)
   * - Invalid rule names (not registered) are silently skipped
   *
   * ### Examples
   *
   * #### Basic Object Rules
   * ```typescript
   * const rulesObject = {
   *   Required: [],           // No parameters
   *   MinLength: [5],         // Single parameter
   *   MaxLength: [50],        // Single parameter
   *   Pattern: ['^[A-Z]+$'],  // String parameter
   * };
   *
   * const parsedRules = Validator.parseObjectRule(rulesObject, registeredRules);
   * // Returns array of sanitized rule objects with function references
   * ```
   *
   * #### Complex Parameter Rules
   * ```typescript
   * const complexRules = {
   *   Range: [1, 100],                    // Multiple numeric parameters
   *   CustomPattern: ['^[0-9]{3}-[0-9]{3}$'], // Regex pattern
   *   Enum: [['active', 'inactive', 'pending']], // Array parameter
   * };
   * ```
   *
   * #### Mixed with String Rules
   * ```typescript
   * // Object rules are typically used alongside string rules
   * const allRules = [
   *   "Required",              // String rule
   *   "Email",                 // String rule
   *   { MinLength: [3] },      // Object rule
   *   { MaxLength: [100] },    // Object rule
   * ];
   *
   * const result = Validator.parseAndValidateRules(allRules);
   * ```
   *
   * #### Integration with Validation Pipeline
   * ```typescript
   * // Object rules are processed during rule parsing phase
   * const inputRules = [
   *   "Required",
   *   { MinLength: [5], MaxLength: [50] },
   *   "Email"
   * ];
   *
   * const { sanitizedRules } = Validator.parseAndValidateRules(inputRules);
   * // sanitizedRules contains both string and object rule objects
   * ```
   *
   * ### Error Handling
   * - **Invalid Input**: Returns empty array if `rulesObject` is not an object
   * - **Missing Rules**: Unregistered rule names are ignored (not added to result)
   * - **Invalid Parameters**: Non-array parameters are ignored
   * - **No Errors Thrown**: Method is robust and never throws exceptions
   *
   * ### Performance Characteristics
   * - **Linear Time**: O(n) where n is the number of properties in rules object
   * - **Memory Efficient**: Creates minimal objects with function references
   * - **Registry Lookup**: Fast hash map lookup for rule function existence
   * - **Parameter Validation**: Lightweight array type checking
   *
   * ### Future Enhancements
   * - Support for non-array parameter formats (single values, objects)
   * - Parameter type validation against rule function signatures
   * - Rule dependency resolution and ordering
   * - Enhanced error reporting for invalid configurations
   *
   * @template Context - Optional type for validation context passed to rule functions
   *
   * @param rulesObject - Object containing rule names as keys and parameter arrays as values
   * @param registeredRules - Map of registered validation rule functions for lookup
   *
   * @returns Array of sanitized rule objects with function references and parameters
   *          - Empty array if input is invalid or no valid rules found
   *          - Each object contains: ruleName, ruleFunction, params, rawRuleName
   *
   * @throws {Never} This method never throws errors; invalid inputs return empty arrays
   *
   * @remarks
   * - This method complements `parseStringRule` for different rule input formats
   * - Object rules enable complex parameter passing not possible with string notation
   * - Rules are validated against the registry to ensure only registered functions are used
   * - Parameter arrays are passed directly to rule functions without modification
   * - The method is part of the rule preprocessing pipeline in `parseAndValidateRules`
   *
   * @see {@link parseStringRule} - Handles string notation rules without parameters
   * @see {@link parseAndValidateRules} - Main rule parsing method that uses this function
   * @see {@link registerRule} - How rules are registered in the rule functions map
   * @see {@link ValidatorRuleObject} - Type definition for object rule format
   * @see {@link ValidatorSanitizedRuleObject} - Type definition for parsed rule objects
   *
   * @public
   * @static
   */
  static parseObjectRule<Context = unknown>(
    rulesObject: ValidatorRuleObject,
    registeredRules: ValidatorRuleFunctionsMap<Context>
  ): ValidatorSanitizedRuleObject<ValidatorDefaultArray, Context>[] {
    const result: ValidatorSanitizedRuleObject<
      ValidatorDefaultArray,
      Context
    >[] = [];
    if (!isObj(rulesObject)) {
      return result;
    }
    if (this.isSanitizedRuleObject(rulesObject)) {
      result.push(rulesObject);
      return result;
    }
    for (const propertyKey in rulesObject) {
      if (Object.hasOwnProperty.call(rulesObject, propertyKey)) {
        const ruleName: ValidatorRuleName = propertyKey as ValidatorRuleName;
        if (typeof registeredRules[ruleName] !== 'function') {
          continue;
        }
        const ruleFunction = registeredRules[ruleName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ruleParameters = (rulesObject as any)[ruleName];
        if (Array.isArray(ruleParameters)) {
          result.push({
            ruleName,
            ruleFunction: ruleFunction as ValidatorRuleFunction<
              ValidatorDefaultArray,
              Context
            >,
            params: ruleParameters,
            rawRuleName: ruleName,
          });
        }
      }
    }
    return result;
  }
  static isSanitizedRuleObject<
    TRuleParams extends ValidatorDefaultArray = ValidatorDefaultArray,
    Context = unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  >(rule: any): rule is ValidatorSanitizedRuleObject<TRuleParams, Context> {
    if (!isObj(rule)) {
      return false;
    }
    const sanitizedRule = rule as ValidatorSanitizedRuleObject<
      TRuleParams,
      Context
    >;
    return (
      typeof sanitizedRule.ruleFunction == 'function' &&
      typeof sanitizedRule.ruleName == 'string' &&
      Array.isArray(sanitizedRule.params)
    );
  }

  /**
   * ## Validate - Core Single-Value Validation Engine
   *
   * Executes comprehensive validation on a single value against an array of validation rules.
   * This method implements the core validation pipeline with sequential rule execution,
   * multi-rule delegation, and sophisticated error handling for complex validation scenarios.
   *
   * ### Validation Pipeline Overview
   * 1. **Rule Parsing**: Validates and sanitizes input rules using `parseAndValidateRules`
   * 2. **Invalid Rule Handling**: Returns failure result for any invalid rules
   * 3. **Nullable Skip Check**: Skips validation if value meets nullable rule conditions
   * 4. **Sequential Execution**: Processes rules one-by-one using Promise-based `next()` function
   * 5. **Multi-Rule Detection**: Delegates to specialized handlers for OneOf/AllOf/ArrayOf/ValidateNested
   * 6. **Result Processing**: Handles boolean, string, and Error results with proper error creation
   * 7. **Error Aggregation**: Returns discriminated union result (success/failure)
   *
   * ### Rule Execution Strategy
   * - **Sequential Processing**: Rules execute one after another, not in parallel
   * - **Early Exit**: Validation stops on first rule failure (fail-fast behavior)
   * - **Rule Context**: Each rule receives i18n context, field names, and validation options
   * - **Parameter Extraction**: Automatically extracts rule names and parameters from various formats
   *
   * ### Multi-Rule Support
   * The method automatically detects and delegates to specialized validators:
   * - **OneOf/AllOf**: Uses symbol markers to identify logical combination rules
   * - **ArrayOf**: Validates arrays where each item must satisfy sub-rules
   * - **ValidateNested**: Delegates to class-based validation for nested objects
   *
   * ### Error Handling Architecture
   * - **Boolean Results**: `false` → creates validation error with i18n message
   * - **String Results**: Direct error messages (validated for non-null strings)
   * - **Error Objects**: Stringifies thrown errors and creates validation errors
   * - **Invalid Messages**: Falls back to i18n for null/undefined string results
   *
   * ### Nullable Rule Behavior
   * Skips remaining validation when nullable conditions are met:
   * - **Empty**: Skips if value is empty string `""`
   * - **Nullable**: Skips if value is `null` or `undefined`
   * - **Optional**: Skips if value is `undefined` only
   *
   * ### Rule Format Support
   * Accepts rules in multiple formats with automatic parameter extraction:
   * - **String Rules**: `"Email"`, `"Required"`, `"MinLength[5]"`
   * - **Function Rules**: Direct validator functions with optional parameters
   * - **Object Rules**: `{ ruleFunction, params, ruleName }` structured objects
   *
   * ### Context Propagation
   * Builds comprehensive context for each rule execution:
   * - **i18n Options**: Translation keys, field names, rule information
   * - **Validation Data**: Current value, rule parameters, context object
   * - **Field Metadata**: Property names, translated names, data references
   *
   * #### Basic Usage Examples
   * ```typescript
   * // Simple string validation
   * const result1 = await Validator.validate({
   *   value: "test@example.com",
   *   rules: ["Required", "Email"],
   * });
   * // result1.success === true
   *
   * // Numeric validation with parameters
   * const result2 = await Validator.validate({
   *   value: 25,
   *   rules: ["Required", { Min: [18] }, { Max: [65] }],
   * });
   * // result2.success === true
   *
   * // Function-based validation
   * const result3 = await Validator.validate({
   *   value: "custom",
   *   rules: [({ value }) => value.startsWith("prefix") || "Must start with prefix"],
   * });
   * // result3.success === true
   * ```
   *
   * #### Nullable Rule Examples
   * ```typescript
   * // Empty allows skipping other rules
   * const result1 = await Validator.validate({
   *   value: "",
   *   rules: ["Empty", "Email"],
   * });
   * // result1.success === true (skips Email check)
   *
   * // Nullable allows null/undefined
   * const result2 = await Validator.validate({
   *   value: null,
   *   rules: ["Nullable", "IsNumber"],
   * });
   * // result2.success === true (skips IsNumber check)
   *
   * // Optional allows undefined only
   * const result3 = await Validator.validate({
   *   value: undefined,
   *   rules: ["Optional", "MinLength[5]"],
   * });
   * // result3.success === true (skips MinLength check)
   * ```
   *
   * #### Multi-Rule Examples
   * ```typescript
   * // OneOf: email OR phone required
   * const result1 = await Validator.validate({
   *   value: "user@example.com",
   *   rules: [Validator.oneOf(["Email", "PhoneNumber"])],
   * });
   * // result1.success === true
   *
   * // ArrayOf: validate array items
   * const result2 = await Validator.validate({
   *   value: ["a@b.com", "c@d.com"],
   *   rules: [Validator.arrayOf(["Email"])],
   * });
   * // result2.success === true
   *
   * // AllOf: must satisfy all conditions
   * const result3 = await Validator.validate({
   *   value: "hello",
   *   rules: [Validator.allOf(["String", { MinLength: [3] }])],
   * });
   * // result3.success === true
   * ```
   *
   * #### Type Guards for Result Narrowing
   * ```typescript
   * const result = await Validator.validate({
   *   value: "test",
   *   rules: ["Required"],
   * });
   *
   * // Using type guards
   * if (Validator.isSuccess(result)) {
   *   // TypeScript knows result.success === true
   *   console.log("Valid value:", result.value);
   * } else if (Validator.isFailure(result)) {
   *   // TypeScript knows result.success === false
   *   console.error("Error:", result.error.message);
   * }
   * ```
   *
   * ### Technical Implementation Details
   * - **Promise-Based Execution**: Uses recursive `next()` function for sequential processing
   * - **Symbol-Based Detection**: Identifies multi-rules using internal symbol markers
   * - **Context Building**: Constructs i18n and validation context for each rule
   * - **Error Creation**: Uses `createValidationError` for consistent error objects
   * - **Duration Tracking**: Measures validation execution time from start to finish
   *
   * @template Context - Optional type for the validation context object
   *
   * @param options - Validation options (MakeOptional<
    ValidatorValidateOptions<ValidatorDefaultArray, Context>,
    "i18n"
  >)
   * @param options.value - The value to validate (required)
   * @param options.rules - Array of validation rules to apply
   * @param options.context - Optional context object passed to rule functions
   * @param options.data - Optional data object for rule context
   * @param options.fieldName - Optional field identifier for error messages
   * @param options.propertyName - Optional property identifier for error messages
   * @param options.translatedPropertyName - Optional translated property name
   * @param options.message - Optional custom error message prefix
   *
   * @returns Promise resolving to ValidatorValidateResult<Context>
   *          - Success: object with success=true, value, validatedAt, duration
   *          - Failure: object with success=false, error, failedAt, duration
   *
   * @throws {Never} This method never throws. All errors are returned in the result object.
   *
   *
   * @see {@link validateTarget} - For class-based validation using decorators
   * @see {@link registerRule} - To register custom validation rules
   * @see {@link parseAndValidateRules} - Internal rule parsing and validation
   * @see {@link shouldSkipValidation} - Nullable rule checking logic
   * @see {@link validateMultiRule} - OneOf/AllOf rule implementation
   * @see {@link validateArrayOfRule} - ArrayOf rule implementation
   * @see {@link validateNestedRule} - ValidateNested rule implementation
   * @see {@link ValidatorValidateResult} - Result type documentation
   * @see {@link ValidatorValidationError} - Error details type
   *
   * @public
   * @async
   */
  static async validate<Context = unknown>({
    rules,
    ...extra
  }: MakeOptional<
    ValidatorValidateOptions<ValidatorDefaultArray, Context>,
    'i18n' | 'ruleParams'
  >): Promise<ValidatorValidateResult<Context>> {
    const i18n = this.getI18n(extra);
    const startTime = Date.now();
    const { sanitizedRules, invalidRules } =
      Validator.parseAndValidateRules<Context>(rules);
    const separators = Validator.getErrorMessageSeparators(i18n);
    const { value, context, data } = extra;

    const translateOptions = this.getI18nTranslateOptions(extra);
    const successOrErrorData = {
      ...translateOptions,
      context,
      value,
      data,
    };
    // Handle invalid rules - return failure result instead of rejecting
    if (invalidRules.length) {
      const message = invalidRules
        .map((rule) =>
          i18n.t('validator.invalidRule', {
            ...translateOptions,
            rule: isNonNullString(rule) ? rule : 'unnamed rule',
          })
        )
        .join(separators.multiple);
      const error = createValidationError(message, {
        value,
        fieldName: extra.fieldName,
        propertyName: extra.propertyName,
        ruleParams: [],
      });
      return createFailureResult<Context>(error, successOrErrorData, startTime);
    }

    // No rules to validate - return success
    if (!sanitizedRules.length) {
      return createSuccessResult<Context>(successOrErrorData, startTime);
    }

    if (
      this.shouldSkipValidation({
        value,
        rules: sanitizedRules as unknown as ValidatorSanitizedRules<Context>,
      })
    ) {
      // Value meets nullable conditions - validation succeeds
      return createSuccessResult<Context>(successOrErrorData, startTime);
    }

    extra.fieldName = extra.propertyName = defaultStr(
      extra.fieldName,
      extra.propertyName
    );
    return new Promise((resolve) => {
      let index = -1;
      const rulesLength = sanitizedRules.length;
      const next = async function (): Promise<void> {
        index++;
        if (index >= rulesLength) {
          return resolve(createSuccessResult(successOrErrorData, startTime));
        }
        const rule = sanitizedRules[index];
        let ruleName = undefined;
        let rawRuleName: ValidatorRuleName | string | undefined = undefined;
        let ruleParams: ValidatorRuleParams<Array<unknown>, Context>[] = [];
        let ruleFunc:
          | ValidatorRuleFunction<ValidatorDefaultArray, Context>
          | undefined = typeof rule === 'function' ? rule : undefined;
        if (Validator.isSanitizedRuleObject(rule)) {
          ruleFunc = rule.ruleFunction;
          ruleParams = (
            Array.isArray(rule.params) ? rule.params : []
          ) as ValidatorRuleParams<Array<unknown>, Context>[];
          ruleName = rule.ruleName;
          rawRuleName = rule.rawRuleName;
        } else if (typeof rule == 'function') {
          const parsedRuleFunc = Validator.parseFunctionRule<Context>(rule);
          if (parsedRuleFunc) {
            ruleName = parsedRuleFunc.ruleName;
          } else {
            ruleName = rule.name as ValidatorRuleName;
          }
          rawRuleName = ruleName;
        }

        const i18nRuleOptions = {
          //...extra,
          value,
          rules,
          ...translateOptions,
          rule: defaultStr(ruleName),
          ruleName,
          rawRuleName,
          ruleParams,
        };
        const validateOptions = {
          ...extra,
          data: data ?? Object.assign({}, data),
          startTime,
          ...i18nRuleOptions,
          ruleName,
          rule: ruleName,
          rawRuleName,
          ruleParams,
          rules,
          value,
          i18n,
        };
        const handleResult = (result: unknown) => {
          if (Validator.isFailure<Context>(result)) {
            const opts = {
              validatedValue: value,
              validatedRuleName: ruleName,
              validatedParams: ruleParams,
            };
            resolve({
              ...result,
              ...opts,
            });
          }
          result =
            typeof result === 'string'
              ? isNonNullString(result)
                ? result
                : i18n.t('validator.invalidMessage', i18nRuleOptions)
              : result;
          if (result === false) {
            const error = createValidationError(
              i18n.t('validator.invalidMessage', i18nRuleOptions),
              {
                value,
                ruleName,
                rawRuleName,
                ...translateOptions,
                ruleParams,
              }
            );
            return resolve(
              createFailureResult(error, successOrErrorData, startTime)
            );
          } else if (isNonNullString(result)) {
            const error = createValidationError(result, {
              value,
              ruleName,
              rawRuleName,
              ruleParams,
              ...translateOptions,
            });
            return resolve(
              createFailureResult(error, successOrErrorData, startTime)
            );
          } else if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as any) instanceof Error ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isNonNullString((result as any)?.message) ||
            isNonNullString(result)
          ) {
            const error = createValidationError(stringify(result), {
              value,
              ruleName,
              rawRuleName,
              ruleParams,
              ...translateOptions,
            });
            return resolve(
              createFailureResult(error, successOrErrorData, startTime)
            );
          }
          return next();
        };

        if (typeof ruleFunc !== 'function') {
          const error = createValidationError(
            i18n.t('validator.invalidRule', i18nRuleOptions),
            {
              value,
              ruleName,
              rawRuleName,
              ruleParams,
              ...translateOptions,
            }
          );
          return resolve(
            createFailureResult(error, successOrErrorData, startTime)
          );
        }
        try {
          /* console.log(
            'validating rule ',
            validateOptions.ruleName,
            ' is rule, ',
            validateOptions.ruleParams,
            ' are params heerin',
            ruleFunc,
            ' is rule function'
          ); */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await ruleFunc(validateOptions as any);
          return handleResult(result);
        } catch (e) {
          return handleResult(
            typeof e === 'string'
              ? e
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (e as any)?.message || e?.toString() || stringify(e)
          );
        }
      };
      return next();
    });
  }

  /**
   * ## Should Skip Validation
   *
   * Determines whether validation should be skipped based on the presence of nullable rules
   * and the current value. This method checks if the value meets the conditions for
   * skipping validation when nullable rules like Empty, Nullable, or Optional are present
   * in the rules array.
   *
   * ### Nullable Rules and Conditions
   * - **Empty**: Skips validation if value is an empty string ""
   * - **Nullable**: Skips validation if value is null or undefined
   * - **Optional**: Skips validation if value is undefined
   *
   * ### Logic
   * 1. Only checks when the value is considered "empty" (using isEmpty utility)
   * 2. Iterates through the rules array to find matching nullable rule names
   * 3. Supports both string rules ("Empty") and object rules ({ Empty: [] })
   * 4. Returns true if any matching nullable rule condition is met
   * 5. Function rules are ignored in this check
   *
   * @param options - The options object containing value and rules
   * @param options.value - The value to check for nullable conditions
   * @param options.rules - The array of validation rules to inspect for nullable rules
   *
   * @returns `true` if validation should be skipped due to nullable conditions, `false` otherwise
   *
   *
   * @see {@link validate} - Uses this method to conditionally skip validation
   * @see {@link validateTarget} - Also uses this method for class-based validation
   * @public
   */
  static shouldSkipValidation<Context = unknown>({
    value,
    rules,
  }: {
    rules: Array<ValidatorRuleName> | ValidatorSanitizedRules<Context>;
    value: unknown;
  }) {
    // Check for nullable rules - if value meets nullable conditions, skip validation
    if (isEmpty(value) && Array.isArray(rules)) {
      const nullableConditions = {
        /**
         * Empty rule
         */
        IsEmpty: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === '',
          symbol: VALIDATOR_RULE_MARKERS.empty,
        },
        Nullable: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === null || value === undefined,
          symbol: VALIDATOR_RULE_MARKERS.nullable,
        },
        Optional: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === undefined,

          symbol: VALIDATOR_RULE_MARKERS.optional,
        },
      } as const;
      for (const rule of rules) {
        const ruleF =
          typeof rule == 'object' && rule
            ? rule.ruleFunction
            : typeof rule == 'function'
              ? rule
              : undefined;
        if (typeof ruleF !== 'function') {
          continue;
        }
        for (const key in nullableConditions) {
          const nullableRule =
            nullableConditions[key as keyof typeof nullableConditions];

          const hasMarker = hasRuleMarker(ruleF, nullableRule.symbol);
          if (hasMarker && nullableRule.validate(value)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * ## Validate OneOf Rule
   *
   * Wrapper that applies OR logic across multiple sub-rules. Delegates to
   * {@link validateMultiRule} with `"OneOf"`. Succeeds on the first passing
   * sub-rule (early exit). If all sub-rules fail, returns a single error string
   * aggregating each sub-rule’s message joined by `; `.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to evaluate
   * @param options - Multi-rule validation options
   * @returns `ValidatorResult` (`ValidatorAsyncResult`)
   * @example
   * const res = await Validator.validateOneOfRule({
   *   value: "user@example.com",
   *   ruleParams: ["Email", "PhoneNumber"],
   * });
   * // res === true when any sub-rule succeeds
   *
   * @see {@link validateMultiRule}
   */
  static validateOneOfRule<
    Context = unknown,
    RulesFunctions extends
      ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorResult {
    return this.validateMultiRule<Context, RulesFunctions>('OneOf', options);
  }

  /**
   * ## Validate AllOf Rule
   *
   * Wrapper that applies AND logic across multiple sub-rules. Delegates to
   * {@link validateMultiRule} with `"AllOf"`. Succeeds only if all sub-rules
   * pass. When any sub-rule fails, returns a single aggregated error string
   * joining messages with `; `.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to evaluate
   * @param options - Multi-rule validation options
   * @returns `ValidatorResult` (`ValidatorAsyncResult`)
   * @example
   * const res = await Validator.validateAllOfRule({
   *   value: "hello",
   *   ruleParams: ["String", { MinLength: [5] }],
   * });
   * // res === true only if all sub-rules succeed
   *
   * @see {@link validateMultiRule}
   */
  static validateAllOfRule<
    Context = unknown,
    RulesFunctions extends
      ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorResult {
    return this.validateMultiRule<Context, RulesFunctions>('AllOf', options);
  }

  /**
   * ## Validate ArrayOf Rule
   *
   * Validates that a value is an array and that each item in the array
   * satisfies all of the provided sub-rules (AND logic per item).
   *
   * - Ensures `value` is an array; otherwise returns the localized `array` error.
   * - Applies {@link validateMultiRule} with `"AllOf"` to each item using the provided `ruleParams`.
   * - Aggregates failing item messages; returns `true` when all items pass.
   * - When any items fail, returns a localized summary using `failedForNItems`
   *   followed by concatenated item error messages.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules applied to each item
   * @param options - Multi-rule validation options
   * @returns `ValidatorResult` (`ValidatorAsyncResult`) - `true` if all items pass; otherwise an aggregated error string
   * @example
   * const res = await Validator.validateArrayOfRule({
   *   value: ["user@example.com", "admin@example.com"],
   *   ruleParams: ["Email"],
   * });
   * // res === true when every item is a valid email
   *
   */
  static async validateArrayOfRule<
    Context = unknown,
    RulesFunctions extends
      ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorAsyncResult {
    let { value, ruleParams, startTime, ...extra } = options;
    startTime = isNumber(startTime) ? startTime : Date.now();
    const subRules = (
      Array.isArray(ruleParams) ? ruleParams : []
    ) as RulesFunctions;
    const i18n = this.getI18n(extra);

    // Must be an array
    if (!Array.isArray(value)) {
      return i18n.t('validator.array', {
        field: extra.translatedPropertyName || extra.fieldName,
        value,
        ...extra,
        context: undefined,
      });
    }

    // No sub-rules means trivially valid
    if (subRules.length === 0 || value.length === 0) {
      return true;
    }

    const { multiple, single } = this.getErrorMessageSeparators(i18n);
    const failures: string[] = [];

    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      const res = await Validator.validateMultiRule<Context, RulesFunctions>(
        'AllOf',
        {
          value: item,
          ruleParams: subRules,
          startTime,
          ...extra,
        }
      );
      if (res !== true) {
        failures.push(`#${index}: ${String(res)}`);
      }
    }

    if (failures.length === 0) return true;

    const header = i18n.t('validator.failedForNItems', {
      count: failures.length,
    });
    return `${header}${single}${failures.join(multiple)}`;
  }
  static getI18nTranslateOptions<Context = unknown>({
    fieldName,
    propertyName,
    fieldLabel,
    translatedPropertyName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context,
    ...rest
  }: Partial<ValidatorValidateOptions<ValidatorDefaultArray, Context>>) {
    fieldName = defaultStr(fieldName, propertyName);
    fieldLabel = defaultStr(fieldLabel, translatedPropertyName, fieldName);
    const r: Partial<ValidatorValidateOptions<ValidatorDefaultArray, Context>> =
      {
        fieldLabel,
        translatedPropertyName: defaultStr(translatedPropertyName, fieldLabel),
        propertyName: defaultStr(propertyName, fieldName),
        fieldName,
      };
    /* if ('data' in rest && rest.data !== undefined) {
      r.data = rest.data;
    } */
    if ('value' in rest) {
      r.value = rest.value;
    }
    return r;
  }
  /**
   * ## Validate Nested Rule (Core Nested Validation Executor)
   *
   * Internal rule function that validates a nested object against a class constructor with
   * validation decorators. This method is the workhorse for nested class validation, delegating
   * to {@link validateTarget} for the actual multi-field validation logic.
   *
   * ### Purpose
   * This method implements the core logic for the `ValidateNested` rule, enabling validation of
   * complex hierarchical object structures where a property value must itself be validated against
   * a decorated class schema. It acts as the bridge between single-value rule validation and
   * multi-field class-based validation.
   *
   * ### Validation Flow
   * 1. **Parameter Extraction**: Extracts the target class constructor from `ruleParams[0]`
   * 2. **Validation**: Calls `validateTarget()` to validate the nested object against the class
   * 3. **Error Aggregation**: Collects nested validation errors with property path information
   * 4. **Result Formatting**: Returns either `true` (success) or error message string (failure)
   *
   * ### Error Handling Strategy
   * - **Missing Class Constructor**: Returns invalidRule error if no target class provided
   * - **Invalid Data Type**: Returns validateNested error if data is not an object
   * - **Nested Validation Failures**: Aggregates all nested field errors with property names in format:
   *   `"[propertyName]: error message; [propertyName]: error message"`
   * - **Successful Validation**: Returns `true` without modification
   *
   * ### Type Parameters
   * - `Target` - Class constructor extending ClassConstructor with validation decorators
   * - `Context` - Optional validation context type passed through nested validations
   *
   * ### Return Values
   * - `true` - Nested object validation succeeded
   * - `string` - Validation failed; returns i18n-formatted error message with nested error details
   *
   * ### Usage Context
   * This method is primarily used as:
   * - The internal handler for the `validateNested` factory function
   * - A sub-rule within multi-rule validators (OneOf, AllOf)
   * - Direct validator for nested object properties in class-based validation
   *
   * ### Example
   * ```typescript
   * class Address {
   *   @IsRequired()
   *   @MinLength(5)
   *   street: string;
   *
   *   @IsRequired()
   *   @IsPostalCode
   *   postalCode: string;
   * }
   *
   * class User {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Address])
   *   address: Address;
   * }
   *
   * // When validating a User instance with an Address property,
   * // validateNestedRule is called to validate the address against the Address class
   * const result = await Validator.validateTarget(User, {
   * data : {
   *   name: "John",
   *   address: { street: "123 Main St", postalCode: "12345" }
   * }});
   * ```
   *
   * ### Key Features
   * - **DRY Principle**: Reuses existing `validateTarget` logic to avoid code duplication
   * - **Error Context**: Preserves field hierarchy information in error messages
   * - **i18n Integration**: Uses translation system for localized error messages
   * - **Context Propagation**: Passes validation context through to nested validators
   * - **Timing Tracking**: Maintains duration tracking across nested validations
   *
   * @template Target - Class constructor type (must extend ClassConstructor)
   * @template Context - Optional validation context type
   *
   * @param options - Validation rule function options (ValidatorNestedRuleFunctionOptions<Target, Context>)
   * @param options.ruleParams - Array containing the nested class constructor at index [0]
   * @param options.value - The nested object value to validate (extracted to data property)
   * @param options.data - The nested object data to validate against the target class
   * @param options.context - Optional validation context passed to all validation rules
   * @param options.fieldName - Optional field identifier for error messages
   * @param options.propertyName - Optional property identifier for error messages
   * @param options.translatedPropertyName - Optional i18n property name for error messages
   * @param options.startTime - Optional timestamp for duration tracking
   * @param options.i18n - Optional i18n instance for error message translation
   *
   * @returns {ValidatorAsyncResult}
   * - Resolves to `true` if nested object validation succeeds
   * - Resolves to error message string if validation fails
   * - Never rejects; all errors are returned as resolution values
   * - Error messages include nested field paths: `"[fieldName]: error; [fieldName]: error"`
   *
   * @throws {Never} This method never throws errors; all failures are returned as strings
   *
   * @remarks
   * - This is an internal method primarily used by the `validateNested` factory
   * - Accepts ValidatorNestedRuleFunctionOptions which omits validateTarget's i18n parameter
   * - Delegates directly to validateTarget(target, options) maintaining all context
   * - Nested validation errors include property names for clear error tracing
   * - The method integrates seamlessly with the multi-rule validation system
   * - Supports recursive nesting of arbitrarily deep object structures
   * - Performance: Delegates to validateTarget which validates fields in parallel
   * - Error aggregation uses nested field paths for hierarchical clarity
   *
   *
   * @see {@link validateNested} - Factory function that creates rule functions using this method
   * @see {@link validateTarget} - The underlying class-based validation method (accepts options with data)
   * @see {@link ValidateNested} - Decorator that uses this method via the factory
   * @see {@link ValidatorNestedRuleFunctionOptions} - Options interface for this method
   * @see {@link buildMultiRuleDecorator} - Decorator builder for complex multi-rule scenarios
   * @internal
   * @async
   */
  static async validateNestedRule<
    Target extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >({
    ruleParams,
    ...options
  }: ValidatorNestedRuleFunctionOptions<
    Target,
    Context
  >): ValidatorAsyncResult {
    let { startTime, value, ...extra } = options;
    startTime = isNumber(startTime) ? startTime : Date.now();
    const i18n = this.getI18n(extra);
    const ruleParamsArray = Array.isArray(ruleParams) ? ruleParams : [];
    const target = ruleParamsArray[0] as Target | undefined;
    const translateProperties = {
      rule: 'ValidateNested',
      ...this.getI18nTranslateOptions(extra),
      startTime,
      value,
    };
    // Validate that a nested class was provided
    if (!target) {
      return i18n.t('validator.invalidRule', translateProperties);
    }

    // Validate value is an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      const receivedType = Array.isArray(value)
        ? 'array'
        : value === undefined
          ? 'undefined'
          : value === null
            ? 'null'
            : typeof value;
      return (
        i18n.t('validator.validateNestedInvalidType', {
          ...translateProperties,
          receivedType: receivedType,
        }) || `The field must be an object, but received ${receivedType}`
      );
    }

    //extra.data = extra.data ?? Object.assign({}, extra.data);

    // Delegate to validateTarget for nested class validation
    const nestedResult = await this.validateTarget<Target, Context>(target, {
      ...options,
      data: value,
      parentData: extra.data,
      startTime,
    });

    // If validation succeeded, return true
    if (nestedResult.success) {
      return true;
    }

    // Aggregate nested errors with field path information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nestedErrors = (nestedResult as any).errors || [];
    const errorMessages = nestedErrors
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any) =>
          `[${err.translatedPropertyName ?? err.propertyName}]: ${err.message}`
      )
      .join('; ');

    return i18n.t('validator.validateNested', {
      nestedErrors: errorMessages,
      ...translateProperties,
    });
  }

  /**
   * ## Validate Multi-Rule (OneOf / AllOf)
   *
   * Evaluates multiple sub-rules against a single value using either OR logic (`OneOf`) or
   * AND logic (`AllOf`). Each sub-rule is validated in sequence via {@link Validator.validate},
   * with early exit on success for `OneOf` and full aggregation of errors for `AllOf`.
   *
   * ### Behavior
   * - `OneOf`: Returns `true` as soon as any sub-rule succeeds (early exit). If all sub-rules fail,
   *   returns a concatenated error message string summarizing each failure.
   * - `AllOf`: Requires every sub-rule to succeed. If any sub-rule fails, returns a concatenated
   *   error message string summarizing all failures; otherwise returns `true`.
   * - Empty `ruleParams`: If no sub-rules are provided, returns `true`.
   *
   * ### Execution Notes
   * - Sub-rules are evaluated sequentially (not in parallel) to allow early exit optimization for `OneOf`.
   * - Error messages from failed sub-rules are collected and joined using `; ` as a separator.
   * - Internationalization: Uses `i18n` (if provided) to prefix the aggregated error message
   *   with the localized rule label (`validator.OneOf` or `validator.AllOf`).
   * - Timing: Initializes `startTime` when absent to enable duration tracking downstream.
   *
   * @template Context - Optional type for the validation context object
   * @template RulesFunctions - Array type of sub-rules; each sub-rule can be a named rule,
   *   parameterized rule object, or a rule function
   *
   * @param ruleName - Multi-rule mode to apply: `"OneOf"` or `"AllOf"`
   * @param options - Validation options extending {@link ValidatorValidateMultiRuleOptions}
   * @param options.value - The value to validate against the sub-rules
   * @param options.ruleParams - Array of sub-rules to evaluate (functions or named/object rules)
   * @param options.context - Optional context passed through to each sub-rule
   * @param options.data - Optional auxiliary data passed through to each sub-rule
   * @param options.startTime - Optional start timestamp used for duration tracking
   * @param options.fieldName - Optional field identifier used in error construction
   * @param options.propertyName - Optional property identifier used in error construction
   * @param options.translatedPropertyName - Optional localized property name for error messages
   * @param options.i18n - Optional i18n instance used to localize the error label
   *
   * @returns ValidatorResult
   * - `true` when validation succeeds (any sub-rule for `OneOf`, all sub-rules for `AllOf`)
   * - `string` containing aggregated error messages when validation fails
   *
   * @example
   * // OneOf: either email or phone must be valid
   * const resultOneOf = await Validator.validateOneOfRule({
   *   value: "user@example.com",
   *   ruleParams: ["Email", "PhoneNumber"],
   * });
   * // resultOneOf === true
   *
   * @example
   * // AllOf: must be a string and minimum length 5
   * const resultAllOf = await Validator.validateAllOfRule({
   *   value: "hello",
   *   ruleParams: ["String", { MinLength: [5] }],
   * });
   * // resultAllOf === true
   *
   *
   * @see {@link validateOneOfRule} - Convenience wrapper applying `OneOf` logic
   * @see {@link validateAllOfRule} - Convenience wrapper applying `AllOf` logic
   * @see {@link oneOf} - Factory to build a reusable `OneOf` rule function
   * @see {@link allOf} - Factory to build a reusable `AllOf` rule function
   * @see {@link validate} - Underlying validator used for each sub-rule
   * @public
   * @async
   */
  static async validateMultiRule<
    Context = unknown,
    RulesFunctions extends
      ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
  >(
    ruleName: ValidatorMultiRuleNames,
    {
      value,
      ruleParams,
      startTime,
      ...extra
    }: ValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startTime = isNumber(startTime) ? startTime : Date.now();
    // Special handling for OneOf: validate against each sub-rule in parallel
    const subRules = (
      Array.isArray(ruleParams) ? ruleParams : []
    ) as RulesFunctions;
    const i18n = this.getI18n(extra);
    const isAllOfRule = ruleName === 'AllOf';
    if (subRules.length === 0) {
      return true;
    }
    const errors: string[] = [];
    const allErrors: ValidatorValidateFailure<Context>[] = [];
    let firstSuccess: ValidatorValidateSuccess<Context> | null = null;
    for (const subRule of subRules) {
      const res = await Validator.validate<Context>({
        value,
        ...extra,
        rules: [subRule],
        i18n,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      //console.log(res, " is rest about validating ", value, "and rule name ", subRule);
      if (res.success) {
        if (!isAllOfRule) return true; // OneOf: first hit wins
        firstSuccess ??= res; // AllOf: keep first success
      } else {
        allErrors.push(res);
        if (isNonNullString(res?.error?.message)) {
          errors.push(res.error.message);
        }
      }
    }
    if (!isAllOfRule && firstSuccess) {
      return true;
    }
    if (allErrors.length === 0) return true;
    return i18n.t(`validator.${lowerFirst(ruleName)}`, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...this.getI18nTranslateOptions(extra as any),
      value,
      ruleName,
      rawRuleName: ruleName,
      rules: [ruleName],
      rule: ruleName,
      ruleParams: [],
      failedRulesErrors: errors.join('; '),
    });
  }
  /**
   * ## Create OneOf Validation Rule
   *
   * Factory method that creates a OneOf validation rule function. This method provides
   * a programmatic way to create validation rules that implement OR logic, where
   * validation succeeds if at least one of the specified sub-rules passes.
   *
   * ### OneOf Validation Concept
   * OneOf validation allows flexible validation scenarios where multiple validation
   * paths are acceptable. Instead of requiring all rules to pass (AND logic),
   * OneOf requires only one rule to pass (OR logic), making it ideal for:
   * - Alternative input formats (email OR phone number)
   * - Flexible validation requirements
   * - Multiple acceptable validation criteria
   *
   * ### Method Behavior
   * This factory method returns a validation rule function that can be used directly
   * in validation calls or registered as a named rule. The returned function delegates
   * to `validateOneOfRule` for the actual validation logic.
   *
   * ### Parallel Execution
   * When the returned rule function is executed, all sub-rules are validated in parallel
   * using `Promise.all()` for optimal performance. The method returns immediately upon
   * the first successful validation, avoiding unnecessary processing of remaining rules.
   *
   * ### Error Aggregation
   * When all sub-rules fail, error messages are collected and joined with semicolons
   * to provide comprehensive feedback about all validation failures.
   *
   * ### Examples
   *
   * #### Basic OneOf Rule Creation
   * ```typescript
   * // Create a OneOf rule that accepts either email or phone number
   * const contactRule = Validator.oneOf(['Email', 'PhoneNumber']);
   *
   * // Use the rule directly
   * const result = await contactRule({
   *   value: 'user@example.com',
   *   ruleParams: ['Email', 'PhoneNumber'],
   *   fieldName: 'contact'
   * });
   *
   * if (result === true) {
   *   console.log('Contact validation passed');
   * } else {
   *   console.log('Contact validation failed:', result);
   * }
   * ```
   *
   * #### Complex OneOf with Mixed Rule Types
   * ```typescript
   * // Create a rule that accepts UUID, custom format, or admin format
   * const identifierRule = Validator.oneOf([
   *   'UUID',                                    // Built-in UUID validation
   *   { MinLength: [5] },                       // Object rule with parameters
   *   ({ value }) => value.startsWith('ADMIN-') // Custom function rule
   * ]);
   *
   * const result = await identifierRule({
   *   value: '550e8400-e29b-41d4-a716-446655440000',
   *   ruleParams: ['UUID', { MinLength: [5] }, ({ value }) => value.startsWith('ADMIN-')],
   *   fieldName: 'identifier'
   * });
   * ```
   *
   * #### Registering as Named Rule
   * ```typescript
   * // Create and register a reusable OneOf rule
   * const contactValidator = Validator.oneOf(['Email', 'PhoneNumber']);
   * Validator.registerRule('Contact', contactValidator);
   *
   * // Now use it in validation
   * const result = await Validator.validate({
   *   value: '+1234567890',
   *   rules: ['Contact']
   * });
   * ```
   *
   * #### Context-Aware OneOf Rules
   * ```typescript
   * interface UserContext {
   *   userType: 'admin' | 'user';
   *   permissions: string[];
   * }
   *
   * const flexibleIdRule = Validator.oneOf<UserContext>([
   *   'UUID',
   *   ({ value, context }) => {
   *     if (context?.userType === 'admin') {
   *       return value.startsWith('ADMIN-') || 'Admin IDs must start with ADMIN-';
   *     }
   *     return false; // Skip for non-admins
   *   }
   * ]);
   *
   * const result = await flexibleIdRule({
   *   value: 'ADMIN-12345',
   *   ruleParams: ['UUID', 'customValidationFunction'],
   *   context: { userType: 'admin', permissions: ['manage'] },
   *   fieldName: 'identifier'
   * });
   * ```
   *
   * #### Error Aggregation Example
   * ```typescript
   * // When all rules fail, errors are aggregated
   * const strictRule = Validator.oneOf(['Email', 'PhoneNumber', { MinLength: [10] }]);
   *
   * const result = await strictRule({
   *   value: 'invalid',  // Fails all rules
   *   ruleParams: ['Email', 'PhoneNumber', { MinLength: [10] }],
   *   fieldName: 'contact'
   * });
   *
   * // result will be: "Invalid email format; Invalid phone number; Must be at least 10 characters"
   * ```
   *
   * ### Performance Characteristics
   * - **Parallel Execution**: All rules execute simultaneously
   * - **Early Success**: Returns immediately on first success
   * - **Full Error Collection**: Waits for all failures before rejecting
   * - **Memory Efficient**: No unnecessary rule processing after success
   *
   * ### Internationalization Support
   * Error messages are automatically translated using the provided i18n instance.
   * Custom error messages can be provided through rule functions.
   *
   * @template Context - Type of the validation context object passed to rules
   * @template RulesFunctions - Array type defining the structure of validation rules
   *
   * @param ruleParams - Array of sub-rules to validate against (required)
   *                     Can include strings, objects, or functions
   *
   * @returns Validation rule function that implements OneOf logic
   *          Returns `true` if validation passes, error message string if fails
   *
   * @throws {string} Aggregated error messages when all sub-rules fail
   *
   * @remarks
   * - Rules are executed in parallel for optimal performance
   * - Method returns immediately upon first successful validation
   * - Error messages from failed rules are joined with semicolons
   * - Empty ruleParams array results in immediate failure
   * - Supports both built-in rules and custom validation functions
   * - Context is passed through to all sub-rule validations
   *
   *
   * @see {@link validateOneOfRule} - The underlying validation method
   * @see {@link buildMultiRuleDecorator} - Creates decorators using this method
   * @see {@link registerRule} - Register the returned function as a named rule
   * @public
   */
  static oneOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function OneOf(options) {
      return Validator.validateOneOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorValidateMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }
  /**
   * ## Create AllOf Validation Rule
   *
   * Factory that returns a rule function implementing AND logic across multiple
   * sub-rules. The returned function delegates to {@link validateAllOfRule} and
   * succeeds only when every sub-rule passes; otherwise it returns a single
   * aggregated error string (messages joined with `; `).
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to combine
   * @param ruleParams - Array of sub-rules evaluated with AND logic
   * @returns `ValidatorRuleFunction` to use in `Validator.validate` or decorators
   * @example
   * const strongStringRule = Validator.allOf(["String", { MinLength: [5] }]);
   * const res = await strongStringRule({ value: "hello" });
   * // res === true
   *
   * @see {@link validateAllOfRule}
   * @see {@link buildMultiRuleDecorator}
   * @see {@link registerRule}
   * @public
   */
  static allOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function AllOf(
      options: ValidatorValidateOptions<ValidatorDefaultArray, Context>
    ) {
      return Validator.validateAllOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorValidateMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }

  /**
   * ## Create ArrayOf Validation Rule
   *
   * Factory that returns a rule function applying AND logic across provided sub-rules
   * to every item of an array value. Delegates to {@link validateArrayOfRule}.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules applied to each item
   * @param ruleParams - Sub-rules to apply to each array item
   * @returns `ValidatorRuleFunction` usable in `Validator.validate` or decorators
   * @example
   * const emails = Validator.arrayOf(["Email"]);
   * const res = await emails({ value: ["a@b.com", "c@d.com"] }); // true
   *
   */
  static arrayOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function ArrayOf(
      options: ValidatorValidateOptions<ValidatorDefaultArray, Context>
    ) {
      return Validator.validateArrayOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorValidateMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }

  /**
   * ## Create Nested Validation Rule Factory
   *
   * Factory function that creates a validation rule function for validating nested objects
   * against a decorated class schema. This method follows the factory pattern established by
   * {@link oneOf}, {@link allOf}, and {@link arrayOf} for consistency across complex validation rules.
   *
   * ### Purpose
   * The `validateNested` factory enables validation of hierarchical data structures by creating
   * a reusable rule function that validates object properties against class-based validation schemas.
   * It bridges the gap between single-value rules and multi-field class validation.
   *
   * ### How It Works
   * 1. **Factory Invocation**: Called with a class constructor `[target]` parameter
   * 2. **Returns Rule Function**: Returns a rule function that validates nested objects
   * 3. **Rule Execution**: When the rule is executed, it delegates to `validateNestedRule`
   * 4. **Result**: Returns `true` on success or error message string on failure
   *
   * ### Factory Pattern Consistency
   * Like `oneOf`, `allOf`, and `arrayOf`, this factory:
   * - Accepts rule parameters during factory creation
   * - Returns an `ValidatorRuleFunction` for use in validators
   * - Supports generic typing for Context
   * - Follows the nested function closure pattern
   * - Can be registered as a named rule via `Validator.registerRule()`
   *
   * ### Key Characteristics
   * - **Lazy Evaluation**: Rule parameters are captured at factory creation time
   * - **Composability**: Can be combined with other rules using OneOf, AllOf, ArrayOf
   * - **Type Safety**: Full TypeScript support with generic Target class type
   * - **Contextual Validation**: Supports optional validation context propagation
   * - **i18n Support**: Automatically uses i18n system for error messages
   *
   * ### Usage Patterns
   *
   * #### Direct Factory Usage
   * ```typescript
   * class Address {
   *   @IsRequired()
   *   street: string;
   *
   *   @IsRequired()
   *   postalCode: string;
   * }
   *
   * class UserForm {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @ValidateNested([Address])
   *   address: Address;
   * }
   *
   * // Validator.validateNested is called internally by the @ValidateNested decorator
   * ```
   *
   * #### Programmatic Rule Creation
   * ```typescript
   * const nestedAddressRule = Validator.validateNested([Address]);
   *
   * const result = await nestedAddressRule({
   *   data: { street: "123 Main St", postalCode: "12345" },
   *   fieldName: "address"
   * });
   * ```
   *
   * #### Registration as Named Rule
   * ```typescript
   * const addressValidator = Validator.validateNested([Address]);
   * Validator.registerRule('AddressValidator', addressValidator);
   *
   * // Now can be used by name in validation rules
   * class User {
   *   @ValidateNested([Address])
   *   address: Address;
   * }
   * ```
   *
   * #### Composition with MultiRule Validators
   * ```typescript
   * // Using ValidateNested within OneOf (e.g., either Address or simplified Location)
   * class Location {
   *   @IsRequired()
   *   coordinates: string; // e.g., "40.7128,-74.0060"
   * }
   *
   * const addressOrLocation = Validator.oneOf([
   *   Validator.validateNested(Address),
   *   Validator.validateNested(Location)
   * ]);
   * ```
   *
   * #### Nested Validation with Context
   * ```typescript
   * interface UserContext {
   *   userId: number;
   *   isAdmin: boolean;
   * }
   *
   * class AdminProfile {
   *   @IsRequired()
   *   role: string;
   *
   *   @IsRequired()
   *   permissions: string[];
   * }
   *
   * // When context is provided during validation
   * const result = await Validator.validateTarget(User, {
   *  data: userData,
   *   context: { userId: 1, isAdmin: true }
   * });
   * ```
   *
   * ### Type Parameters
   * - `Target` - Class constructor type (extends ClassConstructor) that the nested object must satisfy
   * - `Context` - Optional validation context type passed through nested validations
   *
   * ### Parameters
   * @param Target - The nested class constructor.
   *                     Must be a class decorated with validation rules.
   *
   * ### Returns
   * `ValidatorRuleFunction<[target: Target], Context>` - A rule function that:
   * - Accepts validation options with nested object data (ValidatorValidateOptions)
   * - Delegates to `validateNestedRule` for actual validation
   * - Returns `true` on successful nested object validation
   * - Returns error message string if any nested field validation fails
   * - Propagates context and i18n through nested validations
   *
   * ### Implementation Details
   * The returned rule function:
   * 1. Extracts the data property from validation options
   * 2. Creates a shallow copy of the data using `Object.assign`
   * 3. Calls `validateNestedRule` with the combined parameters
   * 4. Properly types the data as `ValidatorValidateTargetData<Target>`
   * 5. Delegates to validateTarget via validateNestedRule which expects options.data
   *
   * ### Error Message Format
   * When nested validation fails, error messages include field-level details:
   * ```
   * "Validation failed: [fieldName]: error message; [fieldName]: error message"
   * ```
   *
   * ### Performance Characteristics
   * - **Lazy Evaluation**: Parameters are captured but not executed until rule runs
   * - **Efficient Nesting**: Reuses validateTarget's parallel field validation
   * - **Memory Efficient**: Shallow copy of data prevents unnecessary object duplication
   * - **Async Optimized**: Properly awaits nested async validation rules
   *
   * ### Internationalization
   * - Error messages are automatically localized using the i18n system
   * - Supports translation keys: `validator.validateNested`, `validator.invalidRule`
   * - Property names can be translated based on i18n configuration
   *
   * ### Integration with Decorator System
   * This factory is the foundation for the `@ValidateNested` decorator:
   * ```typescript
   * const ValidateNested = buildMultiRuleDecorator(function ValidateNested(options) {
   *   return { validateNested: Validator.validateNested(options.nested) };
   * });
   * ```
   *
   * @template Target - Class constructor for the nested object schema
   * @template Context - Optional context type for validations
   *
   * @param ruleParams - Tuple `[target]` where target is the class constructor
   *
   * @returns ValidatorRuleFunction - Rule function for nested object validation
   *          - Accepts options with nested object data
   *          - Returns true on success, error string on failure
   *          - Supports context propagation
   *          - Integrates with validation pipeline
   *
   * @throws {Never} The returned rule function never throws; errors are returned as strings
   *
   * @remarks
   * - This factory closely parallels the `oneOf`, `allOf`, and `arrayOf` factory pattern
   * - The class constructor in ruleParams must have validation decorators
   * - Nested validation errors include property names for traceability
   * - Supports recursive nesting (nested class can have ValidateNested properties)
   * - Data is shallow-copied to prevent external modifications
   * - Fully compatible with TypeScript's strict type checking
   *
   * @example
   * ```typescript
   * // Simple nested validation
   * class Contact {
   *   @IsRequired() @IsEmail() email: string;
   *   @IsRequired() @IsPhoneNumber phone: string;
   * }
   *
   * class Person {
   *   @IsRequired() @MinLength(2) name: string;
   *   @ValidateNested([Contact]) contact: Contact;
   * }
   *
   * const person = {
   *   name: "Alice",
   *   contact: {
   *     email: "alice@example.com",
   *     phone: "+1234567890"
   *   }
   * };
   *
   * const result = await Validator.validateTarget(Person, {data:person});
   * if (result.success) {
   *   console.log("Valid person with contact", result.data);
   * } else {
   *   console.error("Validation errors", result.errors);
   * }
   * ```
   *
   *
   * @see {@link validateNestedRule} - The underlying validation executor that delegates to validateTarget
   * @see {@link ValidateNested} - Decorator using this factory
   * @see {@link validateTarget} - Multi-field class validation (signature: validateTarget<T, Context>(target, options))
   * @see {@link ValidatorValidateOptions} - Validation options interface for rule functions
   * @see {@link ValidatorValidateTargetOptions} - Target validation options interface
   * @see {@link oneOf} - Similar factory for OneOf rule creation
   * @see {@link allOf} - Similar factory for AllOf rule creation
   * @see {@link arrayOf} - Similar factory for ArrayOf rule creation
   * @see {@link buildMultiRuleDecorator} - Decorator builder for complex rules
   * @public
   */
  static validateNested<
    Target extends ClassConstructor<unknown> = ClassConstructor<unknown>,
    Context = unknown,
  >(target: Target): ValidatorRuleFunction<Array<unknown>, Context> {
    return function ValidateNested(
      options: ValidatorValidateOptions<Array<unknown>, Context>
    ) {
      return Validator.validateNestedRule<Target, Context>({
        ...options,
        ruleParams: [target],
      });
    };
  }

  static isSuccess<Context = unknown>(
    result: ValidatorValidateResult<Context>
  ): result is ValidatorValidateSuccess<Context> {
    return isObj(result) && result.success === true;
  }

  static isFailure<Context = unknown>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any
  ): result is ValidatorValidateFailure<Context> {
    return (
      isObj(result) &&
      result.success === false &&
      isObj(result.error) &&
      result.error.name == 'ValidatorValidationError'
    );
  }

  /**
   * ## Validate Target - Class-Based Validation
   *
   * Performs validation on all decorated properties of a class instance using decorator-based rules.
   * This method supports complex, multi-field validation with field-level error accumulation.
   *
   * ### Key Features
   * - **Decorator Support**: Uses @IsEmail(), @IsRequired(), @MinLength, etc. decorators
   * - **Multi-FieldMeta Validation**: Validates all decorated properties in parallel
   * - **Error Accumulation**: Collects all field validation errors into a single result
   * - **FieldMeta Mapping**: Maps validated data back to original structure with proper types
   * - **Internationalization**: Supports translated property names and error messages
   * - **Custom Error Formatting**: Allows custom error message builders per field
   * - **Async Rules**: Supports both sync and async validation rules for each field
   * - **Type Safe**: Full TypeScript support with generic typing for class instances
   *
   * ### Return Type: ValidatorValidateTargetResult
   * Returns a discriminated union that can be narrowed:
   * ```typescript
   * type ValidatorValidateTargetResult<T> =
   *   | ValidatorValidateTargetSuccess<T>  // success: true
   *   | ValidatorValidateTargetFailure<T>  // success: false
   * ```
   *
   * #### Success Result (success: true)
   * - `success`: true
   * - `data`: Validated object data matching the class structure
   * - `value`: undefined for target validation
   * - `validatedAt`: ISO timestamp when validation completed
   * - `duration`: Milliseconds elapsed during validation
   * - `status`: "success"
   * - `context`: Optional validation context of type Context
   *
   * #### Failure Result (success: false)
   * - `success`: false
   * - `data`: undefined for target failures
   * - `errors`: Array of ValidatorValidationError objects, one per failed field
   * - `failureCount`: Number of fields that failed validation
   * - `message`: Summary message (e.g., "Validation failed for 3 fields")
   * - `failedAt`: ISO timestamp when validation failed
   * - `duration`: Milliseconds elapsed before failure
   * - `status`: "error"
   *
   * ### Supported Decorators
   * - `@IsRequired()` / `@IsNullable` / `@IsEmpty()` / `@IsOptional()` - Conditional rules
   * - `@IsEmail()` / `@IsUrl` / `@IsPhoneNumber()` - Format validators
   * - `@MinLength(3)` / `@MaxLength(50)` - Length validators
   * - `@IsNumber()` / `@IsNonNullString()` - Type validators
   * - `@ Length[n]` - Exact length validator
   * - Custom decorators created with `Validator.buildPropertyDecorator()`
   *
   * ### Nullable Rule Behavior
   * - **@IsEmpty()**: Skips remaining rules if value is empty string ""
   * - **@IsNullable**: Skips remaining rules if value is null or undefined
   * - **@IsOptional()**: Skips remaining rules if value is undefined only
   * - **Skip if Absent**: @IsOptional() fields can be omitted from data entirely
   *
   * ### Examples
   *
   * #### Basic Class Validation
   * ```typescript
   * class UserForm {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   @MinLength(3)
   *   @MaxLength(50)
   *   name: string;
   *
   *   @IsNullable
   *   @IsNumber()
   *   age?: number;
   * }
   *
   * const result = await Validator.validateTarget(UserForm, {
   *   email: "user@example.com",
   *   name: "John Doe",
   *   age: null,
   * });
   *
   * if (result.success) {
   *   console.log("Form is valid:", result.data);
   * } else {
   *   result.errors.forEach(error => {
   *     console.error(`${error.propertyName}: ${error.message}`);
   *   });
   * }
   * ```
   *
   * #### Complex Multi-FieldMeta Validation
   * ```typescript
   * class ProductForm {
   *   @IsRequired()
   *   @MinLength(3)
   *   title: string;
   *
   *   @IsRequired()
   *   @IsNumber()
   *   @NumberGT(0)
   *   price: number;
   *
   *   @IsEmpty() // Product description can be empty
   *   @MaxLength(1000)
   *   description?: string;
   *
   *   @IsOptional() // Can be omitted entirely
   *   @IsUrl
   *   imageUrl?: string;
   * }
   *
   * const result = await Validator.validateTarget(ProductForm, {
   *   data : {
   *  title: "Awesome Product",
   *   price: 29.99,
   *   description: "",
   *   // imageUrl omitted (valid with @IsOptional())
   *   }
   * });
   * ```
   *
   * #### Custom Error Message Building
   * ```typescript
   * const result = await Validator.validateTarget(UserForm, data, {
   *   errorMessageBuilder: (translatedPropertyName, error, options) => {
   *     // Custom format: "FieldMeta Name (validation rule): error message"
   *     return `${translatedPropertyName} (${options.ruleName}): ${error}`;
   *   }
   * });
   * ```
   *
   * #### Validation with Context
   * ```typescript
   * interface AuthContext {
   *   userId: number;
   *   isAdmin: boolean;
   * }
   *
   * class AdminAction {
   *   @IsRequired()
   *   action: string;
   *
   *   @IsRequired()
   *   targetId: number;
   * }
   *
   * const result = await Validator.validateTarget<typeof AdminAction, AuthContext>(
   *   AdminAction,
   *   { action: "delete", targetId: 123 },
   *   { context: { userId: 1, isAdmin: true } }
   * );
   * ```
   *
   * #### Error Handling
   * ```typescript
   * const result = await Validator.validateTarget(UserForm, {data:userData});
   *
   * if (!result.success) {
   *   // Access failure details
   *   console.log(`${result.failureCount} fields failed validation`);
   *   console.log(result.message); // "Validation failed for 2 fields"
   *
   *   result.errors.forEach(error => {
   *     console.error({
   *       field: error.propertyName,
   *       message: error.message,
   *       rule: error.ruleName,
   *       value: error.value,
   *     });
   *   });
   * }
   * ```
   *
   * #### Type Guards
   * ```typescript
   * const result = await Validator.validateTarget(UserForm, {data});
   *
   * if (result.success) {
   *   // result.data is properly typed
   *   const validatedUser: Partial<UserForm> = result.data;
   * } else {
   *   // result.errors is available
   *   const errorCount = result.errors.length;
   * }
   * ```
   *
   * ### Signature
   * ```typescript
   * static async validateTarget<
   *   Target extends ClassConstructor = ClassConstructor,
   *   Context = unknown,
   * >(
   *   target: Target,
   *   options: Omit<ValidatorValidateTargetOptions<Target, Context>, "i18n"> & {
   *     i18n?: I18n;
   *   }
   * ): Promise<ValidatorValidateTargetResult<Context>>
   * ```
   *
   * ### Method Parameters
   * The method accepts two parameters:
   * 1. `target` - Class constructor decorated with validation rules
   * 2. `options` - Configuration object containing validation data and settings
   *
   * ### Options Structure
   * The `options` parameter extends `ValidatorValidateTargetOptions` and includes:
   * - `data`: Object containing property values to validate (can be partial)
   * - `context`: Optional context object passed to all validation rules
   * - `errorMessageBuilder`: Optional custom error message formatter function
   *   - Signature: `(translatedPropertyName: string, error: string, options?: any) => string`
   *   - Default: `(name, error) => \"[${name}] : ${error}\"`
   * - `i18n`: Optional I18n instance (merged with default i18n if not provided)
   * - Other properties from ValidatorValidateTargetOptions
   *
   * ### Usage Examples
   * ```typescript
   * // Simple validation with data object
   * const result = await Validator.validateTarget(UserForm, {
   *   data: { email: \"test@example.com\", name: \"John\" },
   *   context: { userId: 123 }
   * });
   *
   * // With custom error formatting
   * const result = await Validator.validateTarget(UserForm, {
   *   data: { email: \"test@example.com\", name: \"John\" },
   *   errorMessageBuilder: (name, error) => `FieldMeta ${name}: ${error}`
   * });
   * ```
   *
   * @template Target - Class constructor type (extends ClassConstructor)\n   * @template Context - Optional type for validation context passed to rules
   *
   * @param target - Class constructor decorated with validation decorators (e.g., UserForm)
   * @param options - Validation options object\n   *                Extended from ValidatorValidateTargetOptions with optional i18n property\n   *                Type: Omit<ValidatorValidateTargetOptions<Target, Context>, \"i18n\"> & { i18n?: I18n }
   * @param options.data - Object containing property values to validate (can be partial, required)
   * @param options.context - Optional context object passed to all validation rules
   * @param options.errorMessageBuilder - Optional custom error message formatter function
   * @param options.i18n - Optional i18n instance for localization
   *
   * @returns Promise<ValidatorValidateTargetResult<Context>>
   * - **Success**: object with success=true, data (validated object), validatedAt, duration, status=\"success\"
   * - **Failure**: object with success=false, errors (array), failureCount, message, failedAt, duration, status=\"error\"
   * - Never throws; all errors are returned in the result object
   *
   * @throws {Never} This method never throws. All errors are returned in the result object.
   *
   * @remarks
   * - Validation is performed in parallel for all decorated fields using Promise.all()
   * - Fields decorated with @IsOptional() can be omitted entirely from input data\n   * - Nullable/Empty rules prevent other rules from executing for that field
   * - Property names are translated using i18n if available (via i18n.translateTarget method)
   * - Errors include field-specific information: propertyName, translatedPropertyName, message, ruleName, value
   * - Custom errorMessageBuilder allows field-level error message customization
   * - Context is propagated through to all field validation rules
   * - Supports nested validation through @ValidateNested rule and validateNested factory
   * - Error messages use default format: \"[translatedPropertyName] : error\" unless custom builder provided
   * - Integrates with the multi-rule system (OneOf, AllOf, ArrayOf) for field validation
   *
   *
   * @see {@link validate} - For single-value validation without class schema
   * @see {@link validateNestedRule} - Internal rule handler that delegates to validateTarget
   * @see {@link validateNested} - Factory creating nested validation rule functions
   * @see {@link buildPropertyDecorator} - To create custom validation decorators
   * @see {@link registerRule} - To register custom validation rules\n   * @see {@link ValidatorValidateTargetResult} - Result type documentation
   * @see {@link ValidatorValidationError} - Error details type
   * @see {@link ValidatorValidateTargetOptions} - Full options interface
   *
   * @public
   * @async
   */
  static async validateTarget<
    Target extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    target: Target,
    options: Omit<
      ValidatorValidateTargetOptions<Target, Context>,
      'i18n' | 'ruleParams'
    > & {
      i18n?: I18n;
    }
  ): Promise<ValidatorValidateTargetResult<Context>> {
    const startTime = Date.now();
    const targetRules = Validator.getTargetRules<Target>(target);
    const { context, errorMessageBuilder, ...restOptions } = Object.assign(
      {},
      Validator.getValidateTargetOptions(target),
      options
    );
    const data = Object.assign({}, options.data);
    const i18n = this.getI18n(options);
    const messageSeparators = Validator.getErrorMessageSeparators(i18n);
    const buildErrorMessage =
      typeof errorMessageBuilder === 'function'
        ? errorMessageBuilder
        : (translatedPropertyName: string, error: string) =>
            `[${String(translatedPropertyName)}] : ${error}`;

    const validationErrors: ValidatorValidationError[] = [];
    const validationPromises: Promise<ValidatorValidateResult<Context>>[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let validatedFieldCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translatedPropertyNames = i18n.translateTarget(target as any, {
      data,
    });
    for (const propertyKey in targetRules) {
      const rules = targetRules[propertyKey];
      const { sanitizedRules } = this.parseAndValidateRules(rules);
      const value = data[propertyKey];
      // Skip validation for Optional fields that are not present in data
      if (this.shouldSkipValidation({ value, rules: sanitizedRules })) {
        continue;
      }
      const translatedPropertyName: string = defaultStr(
        translatedPropertyNames[propertyKey],
        propertyKey
      );
      validationPromises.push(
        Validator.validate<Context>({
          context,
          ...restOptions,
          i18n,
          value,
          data,
          translatedPropertyName,
          fieldName: propertyKey,
          propertyName: propertyKey,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rules: sanitizedRules as any,
          fieldLabel: translatedPropertyName,
        }).then((validationResult) => {
          if (validationResult.success) {
            validatedFieldCount++;
          } else {
            const errorMessage = stringify(validationResult.error?.message);
            const formattedMessage = buildErrorMessage(
              translatedPropertyName,
              errorMessage,
              {
                ...Object.assign({}, validationResult.error),
                separators: messageSeparators,
                data,
                propertyName: propertyKey,
                translatedPropertyName: translatedPropertyName,
                i18n,
              }
            );
            validationErrors.push({
              name: 'ValidatorValidationError',
              status: 'error' as const,
              fieldName: propertyKey,
              value: validationResult.value,
              propertyName: propertyKey,
              message: formattedMessage,
              ruleName: validationResult.error?.ruleName,
              ruleParams: validationResult.error?.ruleParams,
              rawRuleName: validationResult.error?.rawRuleName,
            });
          }
          return validationResult;
        })
      );
    }

    return new Promise<ValidatorValidateTargetResult<Context>>((resolve) => {
      return Promise.all(validationPromises).then(() => {
        const isValidationSuccessful = !validationErrors.length;
        if (isValidationSuccessful) {
          resolve({
            ...createSuccessResult<Context>(
              {
                data,
                value: undefined,
                context,
              },
              startTime
            ),
            status: 'success',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: data as any,
          });
        } else {
          const message = i18n.translate('validator.failedForNFields', {
            count: validationErrors.length,
          });
          resolve({
            success: false,
            message,
            errors: validationErrors,
            failureCount: validationErrors.length,
            status: 'error',
            failedAt: new Date(),
            duration: Date.now() - startTime,
            data,
          });
        }
      });
    });
  }

  /**
   * ## Extract Validation Rules from Class
   *
   * Retrieves all validation rules that have been applied to a class through property
   * decorators. This method introspects the class metadata to extract the complete
   * validation schema defined by decorators.
   *
   * ### Metadata Introspection
   * This method uses reflection to access metadata that was stored when validation
   * decorators were applied to class properties. It provides a programmatic way to
   * inspect the validation schema of any decorated class.
   *
   * ### Use Cases
   * - **Schema Inspection**: Understand what validation rules apply to a class
   * - **Dynamic Validation**: Build validation logic based on class structure
   * - **Documentation**: Generate validation documentation from code
   * - **Testing**: Verify that proper decorators are applied
   *
   * @example
   * ```typescript
   * class User {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   @MinLength(3)
   *   @MaxLength(50)
   *   name: string;
   *
   *   @IsOptional()
   *   @IsNumber()
   *   age?: number;
   * }
   *
   * // Extract validation rules
   * const rules = Validator.getTargetRules(User);
   * console.log(rules);
   * // Output:
   * // {
   * //   email: ['required', 'email'],
   * //   name: ['required', 'minLength', 'maxLength'],
   * //   age: ['number']  // IsOptional doesn't add a rule
   * // }
   *
   * // Check if a property has specific rules
   * const emailRules = rules.email;
   * const hasEmailValidation = emailRules.includes('email');
   *
   * // Programmatic rule inspection
   * function analyzeClass(targetClass: any) {
   *   const rules = Validator.getTargetRules(targetClass);
   *   const analysis = {
   *     totalProperties: Object.keys(rules).length,
   *     requiredProperties: [],
   *     optionalProperties: []
   *   };
   *
   *   for (const [property, propertyRules] of Object.entries(rules)) {
   *     if (propertyRules.includes('required')) {
   *       analysis.requiredProperties.push(property);
   *     } else {
   *       analysis.optionalProperties.push(property);
   *     }
   *   }
   *
   *   return analysis;
   * }
   * ```
   *
   * @template T - The class constructor type to extract rules from
   *
   * @param target - Class constructor with validation decorators
   *
   * @returns Record mapping property names to their validation rules
   *
   *
   * @see {@link validateTarget} - Uses this method to get validation rules
   * @see {@link buildPropertyDecorator} - How rules are attached to properties
   * @public
   */
  static getTargetRules<T extends ClassConstructor>(
    target: T
  ): Record<keyof InstanceType<T>, ValidatorRule[]> {
    return getDecoratedProperties(
      target,
      VALIDATOR_TARGET_RULES_METADATA_KEY
    ) as Record<keyof InstanceType<T>, ValidatorRule[]>;
  }

  /**
   * ## Get Target Validation Options
   *
   * Retrieves validation options that have been configured for a specific class
   * through the `@ValidationTargetOptions` decorator. These options control how
   * validation behaves when `validateTarget` is called on the class.
   *
   * ### Configuration Options
   * Options can include custom error message builders, validation contexts,
   * and other class-level validation behaviors that should be applied consistently
   * whenever the class is validated.
   *
   * @example
   * ```typescript
   * // Class with custom validation options
   * @ValidationTargetOptions({
   *   errorMessageBuilder: (translatedName, error) => {
   *     return `❌ ${translatedName}: ${error}`;
   *   }
   * })
   * class CustomUser {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   * }
   *
   * // Get the configured options
   * const options = Validator.getValidateTargetOptions(CustomUser);
   * console.log(typeof options.errorMessageBuilder); // 'function'
   *
   * // These options will be automatically used when validating
   * const result = await Validator.validateTarget(CustomUser, userData);
   * // Error messages will use the custom format
   * ```
   *
   * @template T - The class constructor type to get options for
   *
   * @param target - Class constructor that may have validation options
   *
   * @returns Validation options object, or empty object if none configured
   *
   *
   * @see {@link validateTarget} - Uses these options during validation
   * @see {@link ValidationTargetOptions} - Decorator to set these options
   * @public
   */
  public static getValidateTargetOptions<T extends ClassConstructor>(
    target: T
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ValidatorValidateTargetOptions<T, any> {
    return Object.assign(
      {},
      Reflect.getMetadata(VALIDATOR_TARGET_OPTIONS_METADATA_KEY, target) || {}
    );
  }

  /**
   * ## Build Rule Decorator Factory
   *
   * **Core Method**: Creates parameterized decorator factories for validation rules.
   *
   * This is the primary factory method for building reusable validation decorators
   * that can accept configuration parameters. It transforms simple validation functions
   * into TypeScript decorators with full type safety, parameter validation, and
   * metadata management.
   *
   * ### Architecture Overview
   *
   * The decorator factory pattern implemented here enables clean, type-safe validation
   * decorators while maintaining runtime flexibility. The method creates a three-level
   * function chain:
   *
   * 1. **Factory Function** (`buildRuleDecorator(ruleFunction)`)
   *    - Takes a validation rule function
   *    - Returns a parameter-accepting function
   *
   * 2. **Parameter Function** (`factory(ruleParameters)`)
   *    - Accepts rule parameters (conditionally optional)
   *    - Returns a property decorator
   *
   * 3. **Property Decorator** (`@Decorator(parameters)`)
   *    - Attaches validation metadata to class properties
   *    - Executed at class definition time
   *
   * ### Type System Deep Dive
   *
   * #### Parameter Handling
   * The method uses rest parameters (`...ruleParameters: TRuleParams`) to accept
   * variable numbers of arguments. This allows decorators to be called with zero
   * or more parameters:
   *
   * ```typescript
   * @MinLength(5)        // Single parameter
   * @Range(0, 100)       // Multiple parameters
   * @IsRequired()        // No parameters (empty rest args)
   * ```
   *
   * #### Rule Name Registration
   * The optional `ruleName` parameter enables automatic rule registration for rules
   * that can be called without parameters. This is restricted to rules where
   * `ValidatorTupleAllowsEmpty<TRuleParams>` is true, ensuring type safety.
   *
   * ### Implementation Flow
   *
   * #### Phase 1: Rule Registration (Optional)
   * ```typescript
   * if (isNonNullString(ruleName)) {
   *   Validator.registerRule(ruleName, ruleFunction);
   * }
   * ```
   * - Registers the rule function under the provided name
   * - Enables string-based rule references in validation configurations
   * - Only available for rules that support empty parameter calls
   *
   * #### Phase 2: Decorator Factory Creation
   * ```typescript
   * return function (...ruleParameters: TRuleParams) {
   *   const finalRuleParameters = ruleParameters;
   * ```
   * - Returns a function accepting rest parameters
   * - Captures the exact parameters passed to the decorator
   * - No default value assignment - parameters are used as-is
   * ```typescript
   * const enhancedValidatorFunction = function(validationOptions) {
   *   const enhancedOptions = Object.assign({}, validationOptions);
   *   enhancedOptions.ruleParams = Validator.normalizeRuleParams(finalRuleParameters);
   *   return ruleFunction(enhancedOptions);
   * };
   * ```
   * - Creates wrapper function that injects normalized parameters
   * - Preserves original validation options structure
   * - Maintains function identity for debugging
   *
   * #### Phase 3: Symbol Marker Preservation
   * ```typescript
   * if (hasRuleMarker(ruleFunction, VALIDATOR_NESTED_RULE_MARKER)) {
   *   (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_MARKER] = true;
   *   (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_PARAMS] = normalizedParams;
   * }
   * ```
   * - Preserves special markers for nested validation rules
   * - Stores parameters for inspection by advanced validation features
   * - Essential for `ValidateNested` and similar target-based rules
   *
   * #### Phase 4: Decorator Creation
   * ```typescript
   * return Validator.buildPropertyDecorator<TRuleParams, Context>(enhancedValidatorFunction);
   * ```
   * - Delegates to lower-level decorator creation
   * - Attaches validation metadata to class properties
   * - Enables rule accumulation and execution
   *
   * ### Rule Function Interface
   *
   * Rule functions receive a comprehensive validation context:
   *
   * ```typescript
   * interface ValidationOptions<TRuleParams, Context> {
   *   value: any;                          // The property value being validated
   *   ruleParams: TRuleParams;             // Normalized parameter array
   *   context?: Context;                   // Optional validation context
   *   fieldName: string;                   // Raw property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // Internationalization service
   *   // ... additional validation metadata
   * }
   * ```
   *
   * **Return Values:**
   * - `string | false | undefined`: Validation error message or falsy for success
   * - `Promise<string | false | undefined>`: For async validation rules
   * - `ValidationResult`: Structured validation result object
   *
   * ### Usage Patterns
   *
   * #### Basic Parameterized Rules
   * ```typescript
   * // Rule function with single parameter
   * const minLengthRule = ({ value, ruleParams }: ValidationOptions) => {
   *   const [minLength] = ruleParams;
   *   return value.length >= minLength || `Must be at least ${minLength} characters`;
   * };
   *
   * // Create decorator factory
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   *
   * // Usage with different parameters
   * class User {
   *   @MinLength(3)      // Requires 3+ characters
   *   username: string;
   *
   *   @MinLength(8)      // Requires 8+ characters
   *   password: string;
   * }
   * ```
   *
   * #### Multi-Parameter Rules
   * ```typescript
   * const rangeRule = ({ value, ruleParams }) => {
   *   const [min, max] = ruleParams;
   *   if (typeof value !== 'number') return 'Must be a number';
   *   return (value >= min && value <= max) || `Must be between ${min} and ${max}`;
   * };
   *
   * const InRange = Validator.buildRuleDecorator(rangeRule);
   *
   * class Product {
   *   @InRange(0, 100)     // Percentage: 0-100
   *   discount: number;
   *
   *   @InRange(-90, 90)    // Latitude: -90 to 90
   *   latitude: number;
   * }
   * ```
   *
   * #### Context-Aware Rules
   * ```typescript
   * interface SecurityContext {
   *   userRole: 'admin' | 'user' | 'guest';
   *   permissions: string[];
   *   organizationId: string;
   * }
   *
   * const requiresPermissionRule = ({ value, ruleParams, context }) => {
   *   const [requiredPermission] = ruleParams;
   *   const securityContext = context as SecurityContext;
   *
   *   if (!securityContext) return 'Security context required';
   *   return securityContext.permissions.includes(requiredPermission) ||
   *          `Requires '${requiredPermission}' permission`;
   * };
   *
   * const RequiresPermission = Validator.buildRuleDecorator<SecurityContext>(requiresPermissionRule);
   *
   * class SecureResource {
   *   @RequiresPermission('read')
   *   publicData: string;
   *
   *   @RequiresPermission('admin')
   *   adminData: string;
   * }
   * ```
   *
   * #### Optional Parameter Rules
   * ```typescript
   * // Rule that works with or without parameters
   * const patternRule = ({ value, ruleParams }) => {
   *   const [regex, flags] = ruleParams;
   *
   *   // Default email pattern if no parameters provided
   *   const defaultRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   *   const pattern = regex || defaultRegex;
   *   const regexFlags = flags || 'i';
   *
   *   const testRegex = new RegExp(pattern, regexFlags);
   *   return testRegex.test(value) || 'Invalid format';
   * };
   *
   * const MatchesPattern = Validator.buildRuleDecorator(patternRule);
   *
   * class Data {
   *   @MatchesPattern()                    // Uses default email pattern
   *   email: string;
   *
   *   @MatchesPattern(/^\d{3}-\d{2}-\d{4}$/)  // SSN pattern
   *   ssn: string;
   * }
   * ```
   *
   * #### Async Validation Rules
   * ```typescript
   * const uniqueEmailRule = async ({ value, context }) => {
   *   if (!value) return true; // Skip if empty
   *
   *   const db = context?.database;
   *   if (!db) return 'Database context required for uniqueness validation';
   *
   *   try {
   *     const existing = await db.query(
   *       `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
   *       [value]
   *     );
   *
   *     return !existing.rows.length || 'Email address already registered';
   *   } catch (error) {
   *     return 'Unable to validate email uniqueness';
   *   }
   * };
   *
   * const IsUniqueEmail = Validator.buildRuleDecorator(uniqueEmailRule);
   *
   * class Registration {
   *   @IsRequired()
   *   @IsEmail()
   *   @IsUniqueEmail()  // Empty parameters since no config needed
   *   email: string;
   * }
   * ```
   *
   * ### Advanced Features
   *
   * #### Custom Validation Results
   * ```typescript
   * const complexRule = ({ value, ruleParams, fieldName }) => {
   *   const [config] = ruleParams;
   *
   *   // Return structured validation result
   *   return {
   *     success: false,
   *     error: {
   *       message: `Custom validation failed for ${fieldName}`,
   *       code: 'CUSTOM_VALIDATION_ERROR',
   *       details: { config, value }
   *     }
   *   };
   * };
   * ```
   *
   * #### Rule Composition
   * ```typescript
   * const notEmptyRule = ({ value }) =>
   *   value != null && value !== '' || 'Field cannot be empty';
   *
   * const emailRule = ({ value }) =>
   *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format';
   *
   * // Combine rules in a single decorator
   * const IsRequiredEmail = Validator.buildRuleDecorator(({ value }) => {
   *   const notEmpty = notEmptyRule({ value });
   *   if (notEmpty !== true) return notEmpty;
   *
   *   return emailRule({ value });
   * });
   *
   * class Contact {
   *   @IsRequiredEmail()  // Combines required + email validation
   *   primaryEmail: string;
   * }
   * ```
   *
   * ### Performance Considerations
   *
   * #### Memory Efficiency
   * - Factory functions are created once per rule type, not per usage
   * - Parameter normalization happens at decoration time, not validation time
   * - Rule functions are reused across multiple property applications
   *
   * #### Runtime Performance
   * - Validation execution is deferred until `validateTarget()` is called
   * - Parameter binding happens during decoration, not validation
   * - No reflection overhead during actual validation
   *
   * #### Bundle Size Impact
   * - Rule functions are tree-shakeable when not used
   * - Decorator factories have minimal runtime footprint
   * - Type-only parameters don't affect bundle size
   *
   * ### Error Handling & Debugging
   *
   * #### Common Issues
   * ```typescript
   * // ❌ Wrong: Single value instead of array
   * @MinLength(5)  // TypeScript error: expected array
   *
   * // ✅ Correct: Array parameter
   * @MinLength(5)
   * ```
   *
   * ```typescript
   * // ❌ Wrong: Missing parameters for required rule
   * const RequiredRule = ({ value }) => !!value || 'Required';
   * const IsRequired = Validator.buildRuleDecorator(RequiredRule);
   * @IsRequired()  // Runtime error: undefined parameters
   *
   * ```
   *
   * #### Debugging Tips
   * - Use `console.log(ruleParams)` in rule functions to inspect parameters
   * - Check `hasRuleMarker()` for nested rule identification
   * - Validate parameter types at rule function entry
   * - Use meaningful error messages for easier debugging
   *
   * ### Integration with Validation System
   *
   * #### Rule Accumulation
   * Multiple decorators on the same property are accumulated:
   * ```typescript
   * class RobustField {
   *   @IsRequired()      // Rule 1: Required check
   *   @MinLength(3)      // Rule 2: Length check
   *   @IsAlphanumeric()  // Rule 3: Content check
   *   username: string;
   * }
   * ```
   *
   * #### Validation Execution Order
   * - Rules execute in decoration order (top to bottom)
   * - First failing rule stops validation (unless configured otherwise)
   * - All rules receive the same validation context
   *
   * #### Context Propagation
   * ```typescript
   * const result = await Validator.validateTarget(UserClass, {
   *   data: userData,
   *   context: { userId: 123, permissions: ['read'] },
   *   errorMessageBuilder: (field, error) => `${field}: ${error}`
   * });
   * ```
   *
   * ### Migration Guide
   *
   * #### From Manual Decorators
   * ```typescript
   * // Before: Manual decorator creation
   * function MinLength(minLength: number) {
   *   return function(target: any, propertyKey: string) {
   *     // Manual metadata attachment...
   *   };
   * }
   *
   * // After: Using buildRuleDecorator
   * const minLengthRule = ({ value, ruleParams }) => {
   *   const [min] = ruleParams;
   *   return value.length >= min || `Too short`;
   * };
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   * ```
   *
   * #### From Class-Based Validators
   * ```typescript
   * // Before: Class-based approach
   * class MinLengthValidator {
   *   constructor(private minLength: number) {}
   *   validate(value: any): string | null {
   *     return value.length >= this.minLength ? null : 'Too short';
   *   }
   * }
   *
   * // After: Function-based with buildRuleDecorator
   * const MinLength = Validator.buildRuleDecorator(
   *   ({ value, ruleParams }) => {
   *     const [min] = ruleParams;
   *     return value.length >= min || 'Too short';
   *   }
   * );
   * ```
   *
   * ### Best Practices
   *
   * #### Rule Function Design
   * - Keep rule functions pure and testable
   * - Use descriptive error messages
   * - Handle edge cases (null, undefined, empty strings)
   * - Validate parameter types at function entry
   * - Return consistent result types
   *
   * #### Parameter Design
   * - Use array parameters for consistency
   * - Provide sensible defaults for optional parameters
   * - Document parameter order and types
   * - Consider parameter validation in rule functions
   *
   * #### Performance Optimization
   * - Avoid expensive operations in frequently-used rules
   * - Use async rules only when necessary
   * - Cache expensive computations when possible
   * - Profile validation performance in production
   *
   * #### Type Safety
   * - Leverage TypeScript's type system fully
   * - Use strict null checks in rule functions
   * - Provide accurate type annotations
   * - Test with strict TypeScript settings
   *
   * ### Troubleshooting
   *
   * #### "Property 'ruleParams' does not exist"
   * - Ensure rule function accepts `ValidationOptions` parameter
   * - Check that parameters are destructured correctly
   *
   * #### "Cannot read property '0' of undefined"
   * - Rule expects parameters but none provided
   * - Use empty call `()` for rules that don't need parameters
   * - Check that decorator is called with correct syntax
   *
   * #### "Type 'string' is not assignable to type 'TRuleParams'"
   * - Parameters must be arrays, not single values
   * - Wrap single parameters: `[value]` instead of `value`
   *
   * #### Async rule not working
   * - Ensure `validateTarget()` is called with `await`
   * - Check that validation context includes required services
   * - Verify async rule returns Promise<string | false | undefined>
   *
   * ### Related Methods
   *
   * - {@link buildTargetRuleDecorator} - Specialized for nested class validation
   * - {@link buildPropertyDecorator} - Low-level decorator creation
   * - {@link buildMultiRuleDecorator} - For rules with multiple validation functions
   *
   * ### See Also
   *
   * - {@link ValidatorTupleAllowsEmpty} - Type for conditional parameter optionality
   * - {@link ValidatorRuleFunction} - Rule function interface
   * - {@link validateTarget} - Main validation execution method
   * - {@link ValidationOptions} - Complete validation context interface
   *
   * @template TRuleParams - Tuple type defining the exact parameter structure for the rule.
   *   Must extend `ValidatorRuleParams` (array of unknown). Examples:
   *   - `[min: number]` - Single numeric parameter
   *   - `[min: number, max: number]` - Two numeric parameters
   *   - `[pattern: RegExp, flags?: string]` - Regex with optional flags
   *   - `[]` - No parameters required
   *
   * @template Context - Type of the validation context object passed through the validation chain.
   *   Defaults to `unknown` if not specified. Common patterns:
   *   - `SecurityContext` - User permissions and roles
   *   - `DatabaseContext` - Database connections and transactions
   *   - `LocalizationContext` - I18n and locale information
   *   - `{ userId: string; permissions: string[] }` - Inline context type
   *
   * @param ruleFunction - The validation rule function to be wrapped in a decorator factory.
   * @param ruleName - Optional rule name for automatic registration with `Validator.registerRule()`.
   *   This parameter is typed as `ValidatorOptionalOrEmptyRuleNames`, which is a union of rule names
   *   where `ValidatorTupleAllowsEmpty<TRuleParams>` extends `true`. This includes rules like:
   *   - `"Required"` - No parameters needed
   *   - `"Email"` - No parameters needed
   *   - `"PhoneNumber"` - Optional country code parameter
   *   - `"Nullable"`, `"Optional"`, `"Empty"` - No parameters needed
   *
   *   When provided, the rule function will be automatically registered under this name,
   *   enabling programmatic rule discovery and string-based rule references in validation configurations.
   *   This is particularly useful for built-in validation rules that need to be accessible by name
   *   without requiring function references. Rules with required parameters cannot be registered
   *   this way since they must always be called with arguments (e.g., `MinLength[5]`, `MaxLength[10]`).
   *   This function receives normalized validation options and returns validation results.
   *   Function signature: `(options: ValidationOptions<TRuleParams, Context>) => ValidationResult`
   *
   * @param symbolMarker - (Internal use only) A unique symbol used to mark the rule function for special handling.
   *   This parameter is not intended for public use and should generally be omitted.
   *   It is used internally to preserve symbol markers through function wrapping,
   *   enabling reliable identification of the rule internally even in minified code.
   * @returns A decorator factory function that accepts rule parameters as rest parameters and returns a property decorator.
   *   The signature is: `(...ruleParameters: TRuleParams) => PropertyDecorator`
   *
   * @example
   * ```typescript
   * // Basic usage with required parameters
   * const minLengthRule = ({ value, ruleParams }) => {
   *   const [minLength] = ruleParams;
   *   return value.length >= minLength || `Minimum ${minLength} characters required`;
   * };
   *
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   *
   * class User {
   *   @MinLength(8)
   *   password: string;
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Advanced usage with context and custom types
   * interface DatabaseContext {
   *   db: DatabaseConnection;
   *   transaction: Transaction;
   * }
   *
   * const uniqueRule = async ({ value, ruleParams, context }) => {
   *   const [table, column] = ruleParams;
   *   const db = (context as DatabaseContext).db;
   *
   *   const exists = await db.query(
   *     `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
   *     [value]
   *   );
   *
   *   return !exists.rows.length || `${column} must be unique`;
   * };
   *
   * const IsUnique = Validator.buildRuleDecorator<DatabaseContext>(uniqueRule);
   *
   * class User {
   *   @IsUnique('users', 'email')
   *   email: string;
   * }
   * ```
   *
   * @since 1.0.0
   * @public
   * @category Decorator Factories
   * @see {@link buildTargetRuleDecorator}
   * @see {@link ValidatorRuleFunction}
   * @see {@link ValidatorTupleAllowsEmpty}
   */
  static buildRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ): (...ruleParameters: TRuleParams) => PropertyDecorator {
    if (ruleName) {
      this._prepareRuleDecorator(ruleFunction, ruleName, symbolMarker);
    }
    return (...ruleParameters: TRuleParams) => {
      return this._buildRuleDecorator<TRuleParams, Context>(
        ruleParameters,
        ruleFunction,
        ruleName,
        symbolMarker
      );
    };
  }
  private static _prepareRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ) {
    if (isNonNullString(ruleName)) {
      Validator.registerRule(ruleName, ruleFunction);
      markRuleName(ruleFunction, ruleName);
    }
    if (symbolMarker) {
      markRuleWithSymbol(ruleFunction, symbolMarker, { ruleName });
    }
    return ruleFunction;
  }
  private static _buildRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleParameters: TRuleParams,
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ): PropertyDecorator {
    this._prepareRuleDecorator<TRuleParams, Context>(
      ruleFunction,
      ruleName,
      symbolMarker
    );

    ruleName = defaultStr(
      ruleName,
      symbolMarker?.toString(),
      ruleFunction.name,
      ruleFunction.constructor?.name
    ) as ValidatorRuleName;
    markRuleName(ruleFunction, ruleName);
    return Validator.buildPropertyDecorator<TRuleParams, Context>({
      ruleName,
      ruleFunction,
      params: ruleParameters,
    } as ValidatorSanitizedRuleObject<TRuleParams, Context>);
  }

  /**
   * ## Build Target Rule Decorator Factory
   *
   * Creates a specialized decorator factory for validation rules that target nested class
   * objects. This method wraps buildRuleDecorator with type specialization for target-based
   * rules like @ValidateNested.
   *
   * ### Purpose
   * Target rule decorators validate properties by delegating to another class's validation
   * schema. The most common example is @ValidateNested, which validates nested objects
   * against a separate decorated class.
   *
   * ### How It Works
   * 1. Takes a rule function specialized for target parameters: [TargetClass]
   * 2. Wraps it using buildRuleDecorator to create a decorator factory
   * 3. Returns a decorator factory that accepts the target class constructor
   * 4. When the decorator is applied to a property, it triggers target-based validation
   * 5. The rule function receives the target class constructor in ruleParams[0]
   *
   * ### Type Parameters
   * - Target: The nested class constructor type (defaults to ClassConstructor)
   *   - Must be a valid TypeScript class constructor
   *   - Can have any validation decorators
   *   - Example: Address, Contact, Location
   *
   * - Context: Type of the validation context passed through validation layers
   *   - Optional, defaults to unknown
   *   - Available to the rule function for context-aware validation
   *   - Example: { userId: 123, permissions: [...] }
   *
   * ### Rule Function Interface
   * The rule function receives:
   * ```typescript
   * {
   *   value: any;                          // The property value being validated
   *   ruleParams: [TargetClass];           // Single-element array with target constructor
   *   context?: Context;                   // Validation context (if provided)
   *   fieldName: string;                   // Property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // i18n service for error messages
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Create a target-based validation rule
   * const validateNestedRule = ({ value, ruleParams, context }) => {
   *   const [TargetClass] = ruleParams;
   *   // Validate value against TargetClass schema
   *   return Validator.validateTarget(TargetClass, {
   *     data: value,
   *     context: context
   *   });
   * };
   *
   * // Create a target rule decorator
   * const ValidateNested = Validator.buildTargetRuleDecorator(validateNestedRule);
   *
   * // Use the decorator with a target class
   * class Address {
   *   @IsRequired()
   *   street: string;
   *
   *   @IsRequired()
   *   city: string;
   * }
   *
   * class User {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Address])
   *   address: Address;
   * }
   * ```
   *
   * ### Advanced Usage with Validation Options
   * ```typescript
   * class Coordinates {
   *   @IsRequired()
   *   @IsNumber()
   *   latitude: number;
   *
   *   @IsRequired()
   *   @IsNumber()
   *   longitude: number;
   * }
   *
   * class Location {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Coordinates])
   *   coordinates: Coordinates;
   * }
   *
   * class Event {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Location])
   *   location: Location;
   * }
   *
   * // Validate with context
   * const result = await Validator.validateTarget(Event, {
   *   data: eventData,
   *   context: { userId: 123, permissions: ['edit'] },
   *   errorMessageBuilder: (fieldName, error) => `${fieldName}: ${error}`
   * });
   * ```
   *
   * ### Comparison with buildRuleDecorator
   * While both create decorator factories, they differ in specialization:
   *
   * **buildRuleDecorator (General Purpose):**
   * - Accepts any array type as ruleParams
   * - Used for property-level validation
   * - Examples: @MinLength([5]), @IsEmail()([]), @Pattern([/regex/])
   * - Rule params can be any values
   *
   * **buildTargetRuleDecorator (Specialized):**
   * - Accepts specifically [TargetClass] as ruleParams
   * - Used for class-level nested validation
   * - Examples: @ValidateNested([Address]), custom target validators
   * - Rule params must contain a class constructor
   *
   * ### Implementation Details
   * This method is a thin wrapper around buildRuleDecorator that:
   * - Specializes the TRuleParams to [target: Target]
   * - Maintains type safety for target-based rules
   * - Delegates all decorator factory logic to buildRuleDecorator
   * - Reduces code duplication while providing specialized typing
   *
   * ### Performance Characteristics
   * - No additional overhead vs buildRuleDecorator
   * - Wrapper instantiation happens at decoration time, not at import
   * - Actual validation is performed lazily during validateTarget() calls
   * - Multiple properties with same target class share no cached state
   *
   * ### Error Handling
   * When the target rule function returns errors:
   * - Single errors are wrapped in the field name context
   * - Nested errors include full path information
   * - Multi-level nesting creates hierarchical error paths
   * - Error messages can be customized via errorMessageBuilder
   *
   * ### Integration with Validation System
   * - Works seamlessly with property decorators (buildPropertyDecorator)
   * - Compatible with multi-rule decorators (buildMultiRuleDecorator)
   * - Participates in parallel validation of all class properties
   * - Context is propagated through nested validation layers
   * - I18n support for error messages
   *
   * @template Target - Class constructor type for the target/nested class
   *   - Extends ClassConstructor (default generic class constructor)
   *   - Must be a class decorated with validation rules
   *   - Example types: typeof Address, typeof Contact, typeof Location
   *
   * @template Context - Type of context object passed through validation
   *   - Defaults to unknown if not specified
   *   - Used for context-aware validation decisions
   *   - Can include permissions, user info, environmental data, etc.
   *
   * @param ruleFunction - The target validation rule function to wrap
   *   - Must accept ruleParams in format [TargetClass]
   *   - Called by the decorator with target class as first param element
   *   - Should return validation result or error message
   *   - Can be synchronous or asynchronous
   *
   * @param symbolMarker - (Internal use only) Unique symbol for marking the rule function
   *
   * @returns Decorator factory function that:
   *   - Accepts the target class constructor
   *   - Returns a property decorator
   *   - Attaches target-based validation to class properties
   *   - Works with class validation via validateTarget()
   *
   *
   * @see {@link buildRuleDecorator} - General-purpose decorator factory
   * @see {@link buildPropertyDecorator} - Low-level decorator creation
   * @see {@link ValidateNested} - Example target rule decorator
   * @see {@link validateNestedRule} - Example target validation rule
   * @see {@link validateTarget} - Parent validation method using target rules
   * @public
   */
  static buildTargetRuleDecorator<
    Target extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<[target: Target], Context>,
    symbolMarker?: symbol
  ) {
    return this.buildRuleDecorator<[target: Target], Context>(
      ruleFunction,
      undefined,
      symbolMarker
    );
  }

  /**
   * ## Build Multi-Rule Decorator Factory
   *
   * Creates a specialized decorator factory for validation rules that operate on multiple
   * sub-rules simultaneously. This method wraps {@link buildRuleDecorator} with type
   * specialization for multi-rule validation functions like OneOf, AllOf, and ArrayOf.
   *
   * ### Purpose
   * Multi-rule decorators enable complex validation logic that combines multiple validation
   * rules with logical operators (AND/OR). This factory creates decorators that can apply
   * OneOf (at least one rule must pass), AllOf (all rules must pass), or ArrayOf (validate
   * arrays where each item must satisfy all sub-rules) validation patterns.
   *
   * ### How It Works
   * 1. Takes a multi-rule validation function that accepts an array of sub-rules as parameters
   * 2. Wraps it using {@link buildRuleDecorator} to create a decorator factory
   * 3. Returns a decorator factory that accepts an array of sub-rules as decorator parameters
   * 4. When the decorator is applied to a property, it triggers multi-rule validation
   * 5. The rule function receives the sub-rules array in `ruleParams[0]`
   *
   * ### Type Parameters
   * - **Context**: Type of the validation context passed through validation layers
   *   - Optional, defaults to `unknown`
   *   - Available to all sub-rules for context-aware validation
   *   - Example: `{ userId: 123, permissions: ['read', 'write'] }`
   *
   * - **RulesFunctions**: Array type of validation rules accepted as parameters
   *   - Constrained by {@link ValidatorDefaultMultiRule} for type safety
   *   - Must be an array of validation rule functions or rule specifications
   *   - Example: `[() => value > 0, 'Required', { MinLength: [3] }]`
   *
   * ### Rule Function Interface
   * The multi-rule function receives:
   * ```typescript
   * {
   *   value: any;                          // The property value being validated
   *   ruleParams: RulesFunctions;          // Array of sub-rules to evaluate
   *   context?: Context;                   // Validation context (if provided)
   *   fieldName: string;                   // Property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // i18n service for error messages
   * }
   * ```
   *
   * ### Multi-Rule Patterns
   *
   * #### OneOf Validation (OR Logic)
   * ```typescript
   * const validateOneOf = ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   // Return true if any sub-rule passes
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (result.success) return true;
   *   }
   *   return "None of the rules passed validation";
   * };
   *
   * const OneOf = Validator.buildMultiRuleDecorator(validateOneOf);
   *
   * class Contact {
   *   @OneOf(['Email', 'PhoneNumber'])  // Must be valid email OR phone
   *   contactInfo: string;
   * }
   * ```
   *
   * #### AllOf Validation (AND Logic)
   * ```typescript
   * const validateAllOf = ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   // Return true only if all sub-rules pass
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (!result.success) return result.error.message;
   *   }
   *   return true;
   * };
   *
   * const AllOf = Validator.buildMultiRuleDecorator(validateAllOf);
   *
   * class Password {
   *   @AllOf(['Required', { MinLength: [8] }, { MaxLength: [128] }])
   *   password: string;  // Must satisfy ALL conditions
   * }
   * ```
   *
   * #### ArrayOf Validation
   * ```typescript
   * const validateArrayOf = async ({ value, ruleParams }) => {
   *   if (!Array.isArray(value)) return "Must be an array";
   *   const subRules = ruleParams;
   *
   *   for (let i = 0; i < value.length; i++) {
   *     const item = value[i];
   *     for (const subRule of subRules) {
   *       const result = await Validator.validate({ value: item, rules: [subRule] });
   *       if (!result.success) return `Item ${i}: ${result.error.message}`;
   *     }
   *   }
   *   return true;
   * };
   *
   * const ArrayOf = Validator.buildMultiRuleDecorator(validateArrayOf);
   *
   * class UserList {
   *   @ArrayOf(['Email'])  // Each item must be a valid email
   *   emails: string[];
   * }
   * ```
   *
   * ### Advanced Usage with Context
   * ```typescript
   * interface ValidationContext {
   *   userRole: 'admin' | 'user';
   *   strictMode: boolean;
   * }
   *
   * const validateConditional = ({ value, ruleParams, context }) => {
   *   const subRules = ruleParams;
   *   const { userRole, strictMode } = context as ValidationContext;
   *
   *   // Apply different validation based on context
   *   if (userRole === 'admin' && strictMode) {
   *     return validateAllOf([{ value, ruleParams: subRules, context }]);
   *   }
   *   return validateOneOf([{ value, ruleParams: subRules, context }]);
   * };
   *
   * const Conditional = Validator.buildMultiRuleDecorator<ValidationContext>(validateConditional);
   *
   * class FlexibleField {
   *   @Conditional(['Required', { MinLength: [10] }])
   *   flexibleValue: string;  // Validation depends on user context
   * }
   * ```
   *
   * ### Comparison with buildRuleDecorator
   * While both create decorator factories, they differ in parameter handling:
   *
   * **buildRuleDecorator (Single Rule Focus):**
   * - Accepts flexible parameter arrays for single validation rules
   * - Used for property-level validation with fixed parameters
   * - Examples: `@MinLength([5])`, `@IsEmail([])`, `@Pattern([/regex/])`
   * - Rule parameters are typically fixed values
   *
   * **buildMultiRuleDecorator (Multiple Rules Focus):**
   * - Accepts arrays of validation rules as parameters
   * - Used for combining multiple validation rules with logic
   * - Examples: `@OneOf(['Email', 'Phone'])`, `@AllOf(['Required', 'MinLength'])`
   * - Rule parameters are themselves validation rules
   *
   * ### Implementation Details
   * This method is a thin wrapper around {@link buildRuleDecorator} that:
   * - Specializes the `TRuleParams` to `RulesFunctions` array type
   * - Maintains type safety for multi-rule validation patterns
   * - Delegates all decorator factory logic to `buildRuleDecorator`
   * - Reduces code duplication while providing specialized typing
   * - Enables complex validation logic through rule composition
   *
   * ### Performance Characteristics
   * - **No additional overhead** vs `buildRuleDecorator`
   * - **Wrapper instantiation** happens at decoration time, not import
   * - **Actual validation** is performed lazily during `validate()` calls
   * - **Rule evaluation** depends on the specific multi-rule logic (sequential/parallel)
   * - **Memory efficient** - no additional state stored beyond rule metadata
   *
   * ### Error Handling
   * When multi-rule validation fails:
   * - **OneOf failures**: Aggregates all sub-rule error messages with separators
   * - **AllOf failures**: Returns the first failing sub-rule's error message
   * - **ArrayOf failures**: Includes item indices in error messages
   * - **Invalid sub-rules**: Treated as validation failures with appropriate messages
   * - **Context errors**: Propagated through the validation chain
   *
   * ### Integration with Validation System
   * - **Works seamlessly** with property decorators and class validation
   * - **Compatible with** target rule decorators for nested validation
   * - **Participates in** parallel validation of all class properties
   * - **Context propagation** through nested validation layers
   * - **i18n support** for localized error messages in sub-rules
   * - **Symbol markers** used internally for rule type identification
   *
   * ### Type Parameters
   * - **Context**: Type of context object passed through validation
   *   - Defaults to `unknown` if not specified
   *   - Used for context-aware validation decisions
   *   - Can include user permissions, environmental data, etc.
   *
   * - **RulesFunctions**: Array type of validation rules
   *   - Constrained by `ValidatorDefaultMultiRule<Context>`
   *   - Must be an array of valid validation rule specifications
   *   - Enables type-safe multi-rule validation
   *
   * @param ruleFunction - The multi-rule validation function to wrap
   *   - Must accept `ruleParams` as an array of validation rules
   *   - Called by the decorator with sub-rules as first parameter
   *   - Should implement the desired multi-rule logic (OneOf/AllOf/ArrayOf)
   *   - Can be synchronous or asynchronous
   *   - Returns validation result or error message
   *
   * @param symbolMarker - (Internal use only) A unique symbol used to mark the rule function for special handling.
   *
   * @returns Decorator factory function that:
   *   - Accepts an array of validation rules as parameters
   *   - Returns a property decorator when called
   *   - Attaches multi-rule validation to class properties
   *   - Works with class validation via `validateTarget()`
   *   - Enables complex validation logic through rule composition
   *
   * @example
   * ```typescript
   * // Create a OneOf validation rule
   * const validateOneOf = async ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (result.success) return true;
   *   }
   *   return "Value must satisfy at least one of the specified rules";
   * };
   *
   * // Create the decorator factory
   * const OneOf = Validator.buildMultiRuleDecorator(validateOneOf);
   *
   * // Use the decorator
   * class Contact {
   *   @OneOf(['Email', 'PhoneNumber'])
   *   primaryContact: string;
   *
   *   @OneOf(['Required', { MinLength: [10] }])
   *   secondaryContact: string;
   * }
   *
   * // Validate with context
   * const result = await Validator.validateTarget(Contact, {
   *   data: { primaryContact: "user@example.com", secondaryContact: "" },
   *   context: { allowEmptySecondary: true }
   * });
   * ```
   *
   * @see {@link buildRuleDecorator} - General-purpose decorator factory
   * @see {@link buildTargetRuleDecorator} - For nested class validation
   * @see {@link buildPropertyDecorator} - Low-level decorator creation
   * @see {@link OneOf} - Example OneOf multi-rule decorator
   * @see {@link AllOf} - Example AllOf multi-rule decorator
   * @see {@link ArrayOf} - Example ArrayOf multi-rule decorator
   * @see {@link validateMultiRule} - Core multi-rule validation logic
   * @see {@link ValidatorDefaultMultiRule} - Type constraint for rule arrays
   * @see {@link ValidatorMultiRuleFunction} - Multi-rule function type
   * @public
   */
  static buildMultiRuleDecorator<
    Context = unknown,
    RulesFunctions extends
      ValidatorDefaultMultiRule<Context> = ValidatorDefaultMultiRule<Context>,
  >(
    ruleFunction: ValidatorMultiRuleFunction<Context, RulesFunctions>,
    symbolMarker?: symbol
  ) {
    return (ruleParameters: RulesFunctions) => {
      return this._buildRuleDecorator<RulesFunctions, Context>(
        ruleParameters,
        ruleFunction,
        undefined,
        symbolMarker
      );
    };
  }

  /**
   * ## Build Property Decorator Factory
   *
   * Creates a low-level property decorator that attaches validation rules directly to class properties
   * using TypeScript metadata reflection. This method provides the foundation for all validation
   * decorators in the system, enabling rule accumulation and metadata storage on class properties.
   *
   * ### Purpose
   * This is the most fundamental decorator factory in the validation system. It creates property
   * decorators that store validation rules as metadata on class properties, enabling the
   * {@link validateTarget} method to discover and execute validation rules during class-based
   * validation. Unlike higher-level factories, this method works directly with rule objects
   * and metadata storage.
   *
   * ### How It Works
   * 1. Takes a validation rule or array of validation rules as input
   * 2. Uses the imported `buildPropertyDecorator` helper to create a property decorator
   * 3. Stores rules under the `VALIDATOR_TARGET_RULES_METADATA_KEY` symbol
   * 4. When applied to a property, accumulates rules with existing rules on the same property
   * 5. Enables rule discovery during `validateTarget()` execution
   *
   * ### Rule Accumulation Logic
   * The decorator accumulates rules rather than replacing them:
   * ```typescript
   * // Multiple decorators on the same property accumulate rules
   * class Example {
   *   @IsRequired()              // Adds ["Required"] rule
   *   @MinLength([5])           // Adds [{ MinLength: [5] }] rule
   *   @MaxLength([100])         // Adds [{ MaxLength: [100] }] rule
   *   name: string;             // Final rules: ["Required", { MinLength: [5] }, { MaxLength: [100] }]
   * }
   * ```
   *
   * ### Type Parameters
   * - **TRuleParams**: Array type for rule parameters (default: `ValidatorRuleParams`)
   *   - Defines the parameter structure for validation rules
   *   - Must extend `ValidatorRuleParams` for type safety
   *   - Example: `[minLength: number]` for MinLength rule
   *
   * - **Context**: Type of the validation context (default: `unknown`)
   *   - Optional context passed to rule functions
   *   - Enables context-aware validation logic
   *   - Example: `{ userId: 123, permissions: ['read'] }`
   *
   * ### Rule Input Types
   * Accepts validation rules in two formats:
   * - **Single Rule**: `ValidatorRule<TRuleParams, Context>`
   * - **Rule Array**: `ValidatorRule<TRuleParams, Context>[]`
   *
   * ### Metadata Storage
   * Rules are stored using TypeScript's Reflect Metadata API:
   * ```typescript
   * // Metadata structure on class constructor
   * {
   *   [VALIDATOR_TARGET_RULES_METADATA_KEY]: {
   *     propertyName: [rule1, rule2, rule3, ...],
   *     anotherProperty: [ruleA, ruleB, ...],
   *     ...
   *   }
   * }
   * ```
   *
   * ### Usage Examples
   *
   * #### Basic Property Decoration
   * ```typescript
   * // Create a simple required decorator
   * const IsRequired = Validator.buildPropertyDecorator("Required");
   *
   * class User {
   *   @IsRequired
   *   name: string;  // Property now has ["Required"] rule attached
   * }
   * ```
   *
   * #### Parameterized Rule Decoration
   * ```typescript
   * // Create a min length decorator
   * const MinLength = Validator.buildPropertyDecorator({ MinLength: [5] });
   *
   * class Product {
   *   @MinLength
   *   name: string;  // Property has [{ MinLength: [5] }] rule attached
   * }
   * ```
   *
   * #### Multiple Rules on One Property
   * ```typescript
   * class Contact {
   *   @Validator.buildPropertyDecorator("Required")
   *   @Validator.buildPropertyDecorator({ MinLength: [3] })
   *   @Validator.buildPropertyDecorator({ MaxLength: [50] })
   *   name: string;  // Accumulates all three rules
   * }
   * ```
   *
   * #### Array Rule Input
   * ```typescript
   * // Attach multiple rules at once
   * const NameRules = Validator.buildPropertyDecorator([
   *   "Required",
   *   { MinLength: [2] },
   *   { MaxLength: [100] }
   * ]);
   *
   * class Person {
   *   @NameRules
   *   fullName: string;  // All rules attached in single decorator
   * }
   * ```
   *
   * ### Advanced Usage with Custom Rules
   * ```typescript
   * // Custom validation function
   * const customRule = ({ value }) => value.startsWith('prefix_') || 'Must start with prefix_';
   *
   * const Prefixed = Validator.buildPropertyDecorator(customRule);
   *
   * class Config {
   *   @Prefixed
   *   apiKey: string;  // Uses custom validation function
   * }
   * ```
   *
   * ### Context-Aware Rules
   * ```typescript
   * interface UserContext {
   *   isAdmin: boolean;
   *   department: string;
   * }
   *
   * const contextRule = ({ value, context }) => {
   *   const userCtx = context as UserContext;
   *   if (userCtx.isAdmin) return true;  // Admins bypass validation
   *   return value.length >= 5 || 'Non-admin users need longer values';
   * };
   *
   * const AdminBypass = Validator.buildPropertyDecorator<UserContext>(contextRule);
   *
   * class Document {
   *   @AdminBypass
   *   title: string;  // Validation depends on user context
   * }
   * ```
   *
   * ### Comparison with Higher-Level Factories
   *
   * **buildPropertyDecorator (Low-Level):**
   * - Works directly with rule objects and metadata
   * - Requires manual rule specification
   * - Maximum flexibility and control
   * - Used internally by other decorator factories
   * - Example: `buildPropertyDecorator("Required")`
   *
   * **buildRuleDecorator (Mid-Level):**
   * - Creates decorator factories with parameter handling
   * - Supports rest parameters and rule wrapping
   * - Used for single validation rules with parameters
   * - Example: `buildRuleDecorator(ruleFunc)` returns factory for `@MinLength([5])`
   *
   * **buildMultiRuleDecorator (High-Level):**
   * - Creates decorators for multi-rule validation
   * - Handles OneOf/AllOf/ArrayOf patterns
   * - Used for complex validation logic
   * - Example: `buildMultiRuleDecorator(ruleFunc)` returns factory for `@OneOf(['Email', 'Phone'])`
   *
   * ### Implementation Details
   * This method uses the imported `buildPropertyDecorator` helper:
   * ```typescript
   * return buildPropertyDecorator<ValidatorRule<TRuleParams, Context>[]>(
   *   VALIDATOR_TARGET_RULES_METADATA_KEY,  // Metadata key for storage
   *   (oldRules) => {                        // Accumulation function
   *     return [
   *       ...(Array.isArray(oldRules) ? oldRules : []),  // Preserve existing
   *       ...(Array.isArray(rule) ? rule : [rule]),      // Add new rules
   *     ];
   *   }
   * );
   * ```
   *
   * ### Performance Characteristics
   * - **Decoration time**: Minimal overhead (metadata storage only)
   * - **Runtime impact**: No performance cost during decoration
   * - **Validation time**: Rules discovered efficiently via metadata lookup
   * - **Memory usage**: Stores rule references (not rule execution)
   * - **Accumulation**: Efficient array concatenation for multiple decorators
   *
   * ### Error Handling
   * - **Invalid rules**: Stored as-is (validation errors occur during `validateTarget`)
   * - **Metadata failures**: Falls back gracefully if Reflect Metadata unavailable
   * - **Type mismatches**: TypeScript prevents invalid rule types at compile time
   * - **Runtime errors**: Handled during validation, not decoration
   *
   * ### Integration with Validation System
   * - **Metadata discovery**: Rules found by `getDecoratedProperties()` during validation
   * - **Parallel execution**: All property rules validated simultaneously in `validateTarget()`
   * - **Error aggregation**: Property-level errors collected with field names
   * - **Context propagation**: Validation context passed to all rule functions
   * - **i18n support**: Error messages localized through validation system
   *
   * ### Type Parameters
   * - **TRuleParams**: Parameter array type for validation rules
   *   - Defaults to `ValidatorRuleParams` for maximum compatibility
   *   - Constrains rule parameter structures for type safety
   *   - Example: `[number]` for single numeric parameter
   *
   * - **Context**: Validation context type
   *   - Defaults to `unknown` for flexibility
   *   - Passed to rule functions for context-aware validation
   *   - Example: `{ user: User, permissions: string[] }`
   *
   * @param rule - Validation rule(s) to attach to properties
   *   - Can be a single `ValidatorRule<TRuleParams, Context>`
   *   - Or an array of `ValidatorRule<TRuleParams, Context>[]`
   *   - Rules are accumulated when multiple decorators applied
   *   - Invalid rules stored but cause validation errors later
   *
   * @returns PropertyDecorator function that:
   *   - Attaches the specified rule(s) to class properties
   *   - Accumulates rules when multiple decorators applied
   *   - Stores rules as metadata for validation discovery
   *   - Works with `validateTarget()` for class validation
   *   - Enables type-safe property-level validation
   *
   * @example
   * ```typescript
   * // Create basic validation decorators
   * const IsRequired = Validator.buildPropertyDecorator("Required");
   * const IsEmail = Validator.buildPropertyDecorator("Email");
   * const MinLength5 = Validator.buildPropertyDecorator({ MinLength: [5] });
   *
   * // Use in class definitions
   * class User {
   *   @IsRequired
   *   @MinLength5
   *   name: string;
   *
   *   @IsEmail()
   *   email: string;
   *
   *   @Validator.buildPropertyDecorator([
   *     "Required",
   *     { MinLength: [8] },
   *     { MaxLength: [128] }
   *   ])
   *   password: string;
   * }
   *
   * // Validate the class
   * const result = await Validator.validateTarget(User, {
   *   data: {
   *     name: "John",
   *     email: "john@example.com",
   *     password: "secure123"
   *   }
   * });
   *
   * console.log(result.success); // true if all validations pass
   * ```
   *
   * @see {@link buildRuleDecorator} - Higher-level decorator factory with parameter handling
   * @see {@link buildMultiRuleDecorator} - For multi-rule validation patterns
   * @see {@link buildTargetRuleDecorator} - For nested class validation
   * @see {@link validateTarget} - Class validation method that uses these decorators
   * @see {@link getDecoratedProperties} - Metadata discovery for validation
   * @see {@link ValidatorRule} - Rule type attached by this decorator
   * @see {@link VALIDATOR_TARGET_RULES_METADATA_KEY} - Metadata key for rule storage
   * @public
   */
  static buildPropertyDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    rule:
      | BuildPropertyDecorator<TRuleParams, Context>
      | BuildPropertyDecorator<TRuleParams, Context>[]
  ): PropertyDecorator {
    return buildPropertyDecorator<
      BuildPropertyDecorator<TRuleParams, Context>[]
    >(VALIDATOR_TARGET_RULES_METADATA_KEY, (oldRules) => {
      return [
        ...(Array.isArray(oldRules) ? oldRules : []),
        ...(Array.isArray(rule) ? rule : [rule]),
      ];
    });
  }
}

/**
 * ## ValidationTargetOptions Class Decorator
 *
 * Class decorator that configures validation behavior for a target class.
 * This decorator allows you to set class-level validation options that will
 * be automatically applied whenever `validateTarget` is called on the class.
 *
 * ### Configuration Options
 * - **errorMessageBuilder**: Custom function to format validation error messages
 * - **context**: Default validation context for all validations
 * - **stopOnFirstError**: Whether to stop validation at first error (future feature)
 * - **locale**: Specific locale for error messages (future feature)
 *
 * ### Use Cases
 * - **Consistent Error Formatting**: Apply uniform error message styling across a class
 * - **Context Injection**: Provide default context for validation rules
 * - **Custom Validation Behavior**: Override default validation behavior per class
 *
 * @example
 * ```typescript
 * // Basic usage with custom error formatting
 * @ValidationTargetOptions({
 *   errorMessageBuilder: (fieldName, error) => {
 *     return `🚫 ${fieldName.toUpperCase()}: ${error}`;
 * // {
 * //   email: ['Required', 'Email'],
 * //   name: ['Required', 'MinLength', 'MaxLength'],
 * //   age: ['Number']  // IsOptional doesn't add a rule
 * // }
 *
 * // Check if a property has specific rules
 * const emailRules = rules.email;
 * const hasEmailValidation = emailRules.includes('Email');
 *   name: string;
 * }
 *
 * // When validation fails, errors will be formatted as:
 * // "🚫 EMAIL: Invalid email format"
 * // "🚫 NAME: Must be at least 3 characters"
 *
 * // Advanced usage with context and detailed formatting
 * @ValidationTargetOptions({
 *   errorMessageBuilder: (translatedName, error, builderOptions) => {
 *     const { propertyName, ruleName, separators } = builderOptions;
 *
 *     // Custom formatting based on rule type
 *     if (ruleName === 'required') {
 *       return `❗ ${translatedName} is mandatory`;
 *     }
 *
 *     if (ruleName === 'email') {
 *       return `📧 Please enter a valid email for ${translatedName}`;
 *     }
 *
 *     return `⚠️ ${translatedName}: ${error}`;
 *   }
 * })
 * class DetailedUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   name: string;
 * }
 * ```
 *
 * ### Context-Aware Validation
 * ```typescript
 * interface UserValidationContext {
 *   isAdmin: boolean;
 *   permissions: string[];
 *   organizationId: string;
 * }
 *
 * @ValidationTargetOptions({
 *   errorMessageBuilder: (fieldName, error, { context }) => {
 *     const userContext = context as UserValidationContext;
 *     if (userContext?.isAdmin) {
 *       return `[ADMIN] ${fieldName}: ${error}`;
 *     }
 *     return `${fieldName}: ${error}`;
 *   }
 * })
 * class AdminUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @CustomRule([
 *     ({ value, context }) => {
 *       const { isAdmin, permissions } = context as UserValidationContext;
 *       return isAdmin && permissions.includes('manage-users') ||
 *              'Admin privileges required';
 *     }
 *   ])
 *   adminAction: string;
 * }
 * ```
 *
 * ### Internationalization Support
 * ```typescript
 * @ValidationTargetOptions({
 *   errorMessageBuilder: (translatedName, error, { data }) => {
 *     // Use translated property names and localized error formatting
 *     const locale = data.preferredLocale || 'en';
 *
 *     switch (locale) {
 *       case 'fr':
 *         return `❌ ${translatedName} : ${error}`;
 *       case 'es':
 *         return `❌ ${translatedName}: ${error}`;
 *       default:
 *         return `❌ ${translatedName}: ${error}`;
 *     }
 *   }
 * })
 * class InternationalUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   preferredLocale?: string;
 * }
 * ```
 *
 * @param validationOptions - Configuration object for validation behavior
 * @param validationOptions.errorMessageBuilder - Custom error message formatting function
 *
 * @returns Class decorator function that applies the validation configuration
 *
 *
 * @see {@link validateTarget} - Method that uses these options
 * @see {@link getValidateTargetOptions} - Retrieves configured options
 * @decorator
 * @public
 */
export function ValidationTargetOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationOptions: ValidatorValidateTargetOptions<any, any>
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (targetClass: Function) {
    Reflect.defineMetadata(
      VALIDATOR_TARGET_OPTIONS_METADATA_KEY,
      validationOptions,
      targetClass
    );
  };
}

function createValidationError(
  message: string,
  params: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    fieldName?: string;
    propertyName?: string;
    translatedPropertyName?: string;
    ruleName?: ValidatorRuleName;
    rawRuleName?: ValidatorRuleName | string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ruleParams: any[];
  }
): ValidatorValidationError {
  return {
    name: 'ValidatorValidationError',
    message,
    status: 'error',
    value: params.value,
    fieldName: params.fieldName ?? '',
    propertyName: params.propertyName ?? '',
    translatedPropertyName: params.translatedPropertyName,
    ruleName: params.ruleName,
    rawRuleName: params.rawRuleName,
    ruleParams: params.ruleParams,
  };
}

function createSuccessResult<Context = unknown>(
  options: {
    context?: Context;
    value: unknown;
    data?: Dictionary;
  },
  startTime: number
): ValidatorValidateSuccess<Context> {
  return {
    ...options,
    success: true,
    validatedAt: new Date(),
    duration: Date.now() - startTime,
  };
}
/**
 * ## Helper: Create Failure Result
 * Reduces duplication in failure result creation across methods
 * @private
 */
function createFailureResult<Context = unknown>(
  error: ValidatorValidationError,
  options: {
    context?: Context;
    value: unknown;
  },
  startTime: number
): ValidatorValidateFailure<Context> {
  return {
    ...options,
    error,
    success: false,
    failedAt: new Date(),
    duration: Date.now() - startTime,
  };
}

type ValidatorDefaultArray = Array<unknown>;

/** Metadata keys for storing validation target information on classes */
const VALIDATOR_TARGET_RULES_METADATA_KEY = Symbol.for('validatorTargetRules');
const VALIDATOR_TARGET_OPTIONS_METADATA_KEY = Symbol.for(
  'validatorTargetOptions'
);

/**
 * Checks if a rule function has a specific marker.
 * @param ruleFunc - The rule function to check
 * @param marker - The marker symbol to check for
 * @returns true if the function has the specified marker
 */
function hasRuleMarker(ruleFunc: unknown, marker: symbol): boolean {
  if (typeof ruleFunc !== 'function') {
    return false;
  }
  const m = getRuleMarker(ruleFunc, marker);
  return Boolean(m?.validatorRuleFuncMarked);
}
function getRuleMarker(
  ruleFunc: unknown,
  marker: symbol
): ValidatorRuleMarkerMeta | null {
  if (typeof ruleFunc !== 'function') {
    return null;
  }
  return Object.assign(
    {},
    (ruleFunc as unknown as Record<symbol, unknown>)[marker]
  );
}
function markRuleName(ruleFunc: unknown, ruleName: ValidatorRuleName): void {
  if (typeof ruleFunc === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ruleFunc as any)[VALIDATOR_RULE_MARKERS.ruleName] = ruleName;
  }
}
function getMarkedRuleName(ruleFunc: unknown): ValidatorRuleName | undefined {
  if (typeof ruleFunc == 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markedRuleName = (ruleFunc as any)[VALIDATOR_RULE_MARKERS.ruleName];
    return isNonNullString(markedRuleName) ? markedRuleName : undefined;
  }
}
/**
 * Marks a rule function with a specific marker symbol.
 * Used during decorator creation to mark OneOf, AllOf, ArrayOf, ValidateNested rules.
 * @param ruleFunc - The rule function to mark
 * @param marker - The marker symbol to apply
 */

function markRuleWithSymbol(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleFunc: any,
  marker: symbol,
  meta?: ValidatorRuleMarkerMeta
): void {
  if (typeof ruleFunc === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ruleFunc as any)[marker] = {
      ...meta,
      validatorRuleFuncMarked: true,
      ruleName: meta?.ruleName ?? marker,
    };
  }
}

type ValidatorRuleMarkerMeta = Dictionary & {
  validatorRuleFuncMarked?: boolean;
  ruleName?: ValidatorRuleName;
};

type BuildPropertyDecorator<
  TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRule<TRuleParams, Context>
  | ValidatorSanitizedRuleObject<TRuleParams, Context>;
