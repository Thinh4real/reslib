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
import {
  IValidatorDefaultMultiRule,
  IValidatorMultiRuleFunction,
  IValidatorMultiRuleNames,
  IValidatorNestedRuleFunctionOptions,
  IValidatorRegisteredRules,
  IValidatorResult,
  IValidatorRule,
  IValidatorRuleFunction,
  IValidatorRuleName,
  IValidatorRuleObject,
  IValidatorRuleParams,
  IValidatorRules,
  IValidatorSanitizedRuleObject,
  IValidatorSanitizedRules,
  IValidatorValidateFailure,
  IValidatorValidateMultiRuleOptions,
  IValidatorValidateOptions,
  IValidatorValidateResult,
  IValidatorValidateSuccess,
  IValidatorValidateTargetOptions,
  IValidatorValidateTargetResult,
  IValidatorValidationError,
} from './types';

// ============================================================================
// METADATA & MARKER CONSTANTS - Centralized definitions to avoid duplication
// ============================================================================

/** Metadata keys for storing validation target information on classes */
const VALIDATOR_TARGET_RULES_METADATA_KEY = Symbol('validatorTargetRules');
const VALIDATOR_TARGET_OPTIONS_METADATA_KEY = Symbol('validatorTargetOptions');

/** Symbol markers for identifying rule decorators (survives minification) */
const VALIDATOR_NESTED_RULE_MARKER = Symbol.for('validatorNestedRuleMarker');
const VALIDATOR_NESTED_RULE_PARAMS = Symbol.for('validatorNestedRuleParams');
const VALIDATOR_ONEOF_RULE_MARKER = Symbol.for('validatorOneOfRuleMarker');
const VALIDATOR_ALLOF_RULE_MARKER = Symbol.for('validatorAllOfRuleMarker');
const VALIDATOR_ARRAYOF_RULE_MARKER = Symbol.for('validatorArrayOfRuleMarker');

/** Array of all multi-rule markers for easy iteration and checking */
const VALIDATOR_MULTI_RULE_MARKERS = [
  VALIDATOR_ONEOF_RULE_MARKER,
  VALIDATOR_ALLOF_RULE_MARKER,
  VALIDATOR_ARRAYOF_RULE_MARKER,
];

/**
 * Checks if a rule function has any of the multi-rule markers.
 * Used to reliably detect OneOf, AllOf, or ArrayOf rules even in minified code.
 * @param ruleFunc - The rule function to check
 * @returns true if the function has any multi-rule marker
 */
function hasMultiRuleMarker(ruleFunc: any): boolean {
  if (typeof ruleFunc !== 'function') return false;
  return VALIDATOR_MULTI_RULE_MARKERS.some(
    (marker) => ruleFunc[marker] === true
  );
}

/**
 * Checks if a rule function has a specific marker.
 * @param ruleFunc - The rule function to check
 * @param marker - The marker symbol to check for
 * @returns true if the function has the specified marker
 */
function hasRuleMarker(ruleFunc: any, marker: symbol): boolean {
  return typeof ruleFunc === 'function' && ruleFunc[marker] === true;
}

/**
 * Gets the type of multi-rule from marker inspection.
 * @param ruleFunc - The rule function to inspect
 * @returns "oneof" | "allof" | "arrayof" | undefined
 */
function getMultiRuleType(
  ruleFunc: any
): 'oneof' | 'allof' | 'arrayof' | undefined {
  if (hasRuleMarker(ruleFunc, VALIDATOR_ONEOF_RULE_MARKER)) return 'oneof';
  if (hasRuleMarker(ruleFunc, VALIDATOR_ALLOF_RULE_MARKER)) return 'allof';
  if (hasRuleMarker(ruleFunc, VALIDATOR_ARRAYOF_RULE_MARKER)) return 'arrayof';
  return undefined;
}

/**
 * Marks a rule function with a specific marker symbol.
 * Used during decorator creation to mark OneOf, AllOf, ArrayOf, ValidateNested rules.
 * @param ruleFunc - The rule function to mark
 * @param marker - The marker symbol to apply
 */
function markRuleWithSymbol(ruleFunc: any, marker: symbol): void {
  if (typeof ruleFunc === 'function') {
    (ruleFunc as any)[marker] = true;
  }
}

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
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
 *   @MinLength([3])
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
 * @since 1.0.0
 * @version 2.1.0
 * @see {@link https://docs.resk.dev/validation | Validation Documentation}
 * @public
 */
export class Validator {
  /**
   * ## Metadata Storage Key
   *
   * Private symbol used to store validation rules in metadata. This ensures
   * that the validation rules don't conflict with other metadata keys.
   *
   * @private
   * @readonly
   * @since 1.0.0
   */
  private static readonly RULES_METADATA_KEY = Symbol('validationRules');

  /**
   * ## Mark Rule With Symbol
   *
   * Marks a rule function with a specific marker symbol. Used internally to mark
   * decorators (OneOf, AllOf, ArrayOf, ValidateNested) for reliable identification
   * even in minified code. Symbols survive minification while function names do not.
   *
   * @param ruleFunc - The rule function to mark
   * @param marker - The marker symbol to apply
   * @internal
   */
  static markRuleWithSymbol(ruleFunc: any, marker: symbol): void {
    markRuleWithSymbol(ruleFunc, marker);
  }

  /**
   * ## Register Validation Rule
   *
   * Registers a new custom validation rule that can be used throughout the application.
   * This method provides type-safe registration of validation functions with proper
   * error handling and validation of input parameters.
   *
   * ### Type Parameters
   * - `ParamType` - Array type defining the parameters the rule function accepts
   * - `Context` - Type of the validation context object passed to the rule
   *
   * ### Rule Function Signature
   * ```typescript
   * type RuleFunction<ParamType, Context> = (options: {
   *   value: any;
   *   ruleParams: ParamType;
   *   context?: Context;
   *   fieldName?: string;
   *   translatedPropertyName?: string;
   * }) => boolean | string | Promise<boolean | string>;
   * ```
   *
   * ### Rule Return Values
   * - `true` - Validation passed
   * - `false` - Validation failed (uses default error message)
   * - `string` - Validation failed with custom error message
   * - `Promise<boolean|string>` - Async validation
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
   * @template ParamType - Array type for rule parameters
   * @template Context - Type for validation context
   *
   * @param ruleName - Unique identifier for the validation rule (must be non-empty string)
   * @param ruleHandler - Function that performs the validation logic
   *
   * @throws {Error} When ruleName is not a non-empty string
   * @throws {Error} When ruleHandler is not a function
   *
   * @since 1.0.0
   * @see {@link findRegisteredRule} - Find a registered rule
   * @see {@link getRules} - Get all registered rules
   * @public
   */
  static registerRule<
    ParamType extends Array<any> = Array<any>,
    Context = unknown,
  >(
    ruleName: IValidatorRuleName,
    ruleHandler: IValidatorRuleFunction<ParamType, Context>
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
   * This method returns a shallow copy to prevent external modification of
   * the internal rules registry while allowing inspection of available rules.
   *
   * ### Use Cases
   * - Debugging: Check what rules are available
   * - Rule Discovery: List all registered rules for documentation
   * - Testing: Verify rule registration in unit tests
   * - Introspection: Build dynamic validation UIs
   *
   * @example
   * ```typescript
   * // Get all registered rules
   * const allRules = Validator.getRules();
   * console.log('Available rules:', Object.keys(allRules));
   *
   * // Check if a specific rule exists
   * const hasEmailRule = 'Email' in Validator.getRules();
   *
   * // Get rule function directly (not recommended, use findRegisteredRule instead)
   * const emailRule = Validator.getRules()['Email'];
   * ```
   *
   * @returns An immutable copy of all registered validation rules
   *
   * @since 1.0.0
   * @see {@link registerRule} - Register a new rule
   * @see {@link findRegisteredRule} - Find a specific rule
   * @public
   */
  static getRules<Context = unknown>(): IValidatorRegisteredRules<Context> {
    const rules = Reflect.getMetadata(Validator.RULES_METADATA_KEY, Validator);
    return isObj(rules)
      ? { ...rules }
      : ({} as IValidatorRegisteredRules<Context>);
  }
  /**
   * ## Get Registered Rule
   *
   * Retrieves a specific validation rule function by its registered name. This method
   * provides direct access to the underlying validation functions that have been
   * registered with the Validator system.
   *
   * ### Rule Retrieval
   * This method looks up rules in the internal rules registry that was populated
   * through the `registerRule` method. It returns the actual validation function
   * that can be used for custom validation logic or inspection.
   *
   * ### Return Value
   * - Returns the validation rule function if found
   * - Returns `undefined` if no rule with the given name exists
   * - The returned function has the signature `IValidatorRuleFunction`
   *
   * @example
   * ```typescript
   * // Get a registered rule function
   * const emailRule = Validator.getRule('Email');
   * if (emailRule) {
   *   // Use the rule directly
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   *   console.log('Email validation result:', result);
   * }
   *
   * // Check if a rule exists before using it
   * const customRule = Validator.getRule('CustomRule');
   * if (customRule) {
   *   // Rule exists, safe to use
   * } else {
   *   console.log('CustomRule is not registered');
   * }
   *
   * // Get rule for programmatic validation
   * const minLengthRule = Validator.getRule('MinLength');
   * if (minLengthRule) {
   *   const isValid = await minLengthRule({
   *     value: 'hello',
     ruleParams: [3]  // Minimum length of 3
   *   });
   * }
   * ```
   *
   * @param ruleName - The name of the validation rule to retrieve
   *
   * @returns The validation rule function if found, undefined otherwise
   *
   * @since 1.0.0
   * @see {@link registerRule} - Register a new validation rule
   * @see {@link getRules} - Get all registered rules
   * @see {@link hasRule} - Check if a rule exists (type guard)
   * @public
   */
  static getRule<Context = unknown>(ruleName: IValidatorRuleName) {
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
   * - **Type Narrowing**: Narrows `ruleName` to `IValidatorRuleName` if it returns true
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
   *     // TypeScript now knows ruleName is IValidatorRuleName
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
   * @returns `true` if the rule exists and ruleName is a valid IValidatorRuleName, `false` otherwise
   *
   * @since 1.0.0
   * @see {@link getRule} - Get the actual rule function
   * @see {@link getRules} - Get all registered rules
   * @see {@link registerRule} - Register a new validation rule
   * @public
   */
  static hasRule(ruleName: any): ruleName is IValidatorRuleName {
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
   * These separators are internationalized and can be customized through the i18n system.
   * This method provides a centralized way to get consistent error message formatting.
   *
   * ### Separator Types
   * - `multiple` - Used when joining multiple error messages
   * - `single` - Used for single error message formatting
   *
   * ### Internationalization
   * The separators are loaded from the i18n translation system under the key
   * `validator.separators`. This allows different languages to use appropriate
   * punctuation and formatting conventions.
   *
   * @param customI18n - Optional custom I18n instance to use for translations
   * @example
   * ```typescript
   * // Get current separators
   * const separators = Validator.getErrorMessageSeparators();
   * console.log(separators); // { multiple: ", ", single: ", " }
   *
   * // Use separators for custom error formatting
   * const errors = ['Field is required', 'Must be an email', 'Too short'];
   * const errorMessage = errors.join(separators.multiple);
   * console.log(errorMessage); // "Field is required, Must be an email, Too short"
   *
   * // Custom error message builder
   * function buildErrorMessage(fieldName: string, errors: string[]) {
   *   const seps = Validator.getErrorMessageSeparators();
   *   return `${fieldName}: ${errors.join(seps.multiple)}`;
   * }
   * ```
   *
   * @returns Object containing separator strings for error message formatting
   * @returns returns.multiple - Separator for joining multiple error messages
   * @returns returns.single - Separator for single error message formatting
   *
   * @since 1.0.0
   * @see {@link validate} - Uses these separators for error formatting
   * @see {@link validateTarget} - Also uses these separators
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
   * ## Find Registered Rule
   *
   * Locates and returns a specific validation rule by its name. This method provides
   * type-safe access to registered validation rules with proper error handling for
   * invalid rule names. Returns undefined if the rule doesn't exist.
   *
   * ### Type Safety
   * This method is fully type-safe and will return the correctly typed rule function
   * based on the generic parameters provided. The rule function signature will match
   * the expected parameter and context types.
   *
   * @example
   * ```typescript
   * // Find a simple rule
   * const emailRule = Validator.findRegisteredRule('Email');
   * if (emailRule) {
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   * }
   *
   * // Find a rule with specific parameter types
   * const minLengthRule = Validator.findRegisteredRule<[number]>('MinLength');
   * if (minLengthRule) {
   *   const result = await minLengthRule({
   *     value: 'hello',
   *     ruleParams: [5]
   *   });
   * }
   *
   * // Find a rule with context
   * interface UserContext {
   *   userId: number;
   *   permissions: string[];
   * }
   *
   * const permissionRule = Validator.findRegisteredRule<string[], UserContext>('HasPermission');
   * if (permissionRule) {
   *   const result = await permissionRule({
   *     value: 'admin',
   *     ruleParams: ['admin', 'moderator'],
   *     context: { userId: 123, permissions: ['user', 'admin'] }
   *   });
   * }
   *
   * // Safe rule checking
   * const unknownRule = Validator.findRegisteredRule('NonExistentRule');
   * console.log(unknownRule); // undefined
   * ```
   *
   * @template ParamType - Array type specifying the rule parameter types
   * @template Context - Type of the validation context object
   *
   * @param ruleName - The name of the rule to find
   *
   * @returns The validation rule function if found, undefined otherwise
   *
   * @since 1.0.0
   * @see {@link registerRule} - Register a new rule
   * @see {@link getRules} - Get all rules
   * @public
   */
  static findRegisteredRule<
    ParamType extends Array<any> = Array<any>,
    Context = unknown,
  >(
    ruleName: IValidatorRuleName
  ): IValidatorRuleFunction<ParamType, Context> | undefined {
    if (!isNonNullString(ruleName)) return undefined;
    const rules = Validator.getRules();
    return rules[ruleName] as any | undefined;
  }

  /**
   * ## Parse and Validate Rules
   *
   * Converts various input rule formats into a standardized, executable format while
   * identifying and reporting any invalid rules. This method handles the complex task
   * of normalizing different rule input formats into a consistent internal representation.
   *
   * ### Supported Input Formats
   *
   * #### 1. Function Rules
   * ```typescript
   * const functionRule = ({ value }) => value > 0 || 'Must be positive';
   * ```
   *
   * #### 2. String Rules
   * ```typescript
   * 'Required'                    // Simple rule
   * 'MinLength[5]'               // Rule with single parameter
   * 'Between[10,20]'             // Rule with multiple parameters
   * ```
   *
   * #### 3. Object Rules
   * ```typescript
   * { Required: [] }              // Rule without parameters
   * { MinLength: [5] }           // Rule with parameters
   * { Between: [10, 20] }        // Rule with multiple parameters
   * ```
   *
   * ### Processing Logic
   * 1. **Function Detection**: Direct function rules are passed through unchanged
   * 2. **String Parsing**: Extracts rule names and parameters from bracketed syntax
   * 3. **Object Processing**: Converts object notation to standardized format
   * 4. **Validation**: Verifies that all referenced rules are registered
   * 5. **Error Tracking**: Collects invalid rules for reporting
   *
   * @example
   * ```typescript
   * // Mixed rule formats
   * const mixedRules = [
   *   'Required',
   *   'MinLength[3]',
   *   { MaxLength: [50] },
   *   ({ value }) => value.includes('@') || 'Must contain @',
   *   'InvalidRule'  // This will be reported as invalid
   * ];
   *
   * const { sanitizedRules, invalidRules } = Validator.parseAndValidateRules(mixedRules);
   *
   * console.log('Valid rules:', sanitizedRules.length);        // 4
   * console.log('Invalid rules:', invalidRules);               // ['InvalidRule']
   *
   * // Empty or undefined input
   * const { sanitizedRules: empty } = Validator.parseAndValidateRules();
   * console.log(empty.length); // 0
   *
   * // Complex rule with parameters
   * const complexRules = [
   *   'Between[1,100]',
   *   { CustomRule: ['param1', 'param2'] }
   * ];
   *
   * const result = Validator.parseAndValidateRules(complexRules);
   * // Each sanitized rule will have: ruleName, params, ruleFunction, rawRuleName
   * ```
   *
   * @param inputRules - Array of validation rules in various formats, or undefined
   *
   * @returns Object containing processed results
   * @returns returns.sanitizedRules - Array of standardized, executable rule objects
   * @returns returns.invalidRules - Array of rules that couldn't be processed (unregistered)
   *
   * @since 1.22.0
   * @see {@link parseStringRule} - Internal string rule parser
   * @see {@link parseObjectRule} - Internal object rule parser
   * @see {@link validate} - Uses this method for rule processing
   * @public
   */
  static parseAndValidateRules<Context = unknown>(
    inputRules?: IValidatorValidateOptions<Array<any>, Context>['rules']
  ): {
    sanitizedRules: IValidatorSanitizedRules<Context>;
    invalidRules: IValidatorRules<Context>[];
  } {
    const parsedRules: IValidatorSanitizedRules<Context> = [];
    const registeredRules = this.getRules<Context>();
    const invalidRules: IValidatorRules<Context>[] = [];

    const rulesToProcess = Array.isArray(inputRules) ? inputRules : [];

    for (const rule of rulesToProcess) {
      if (typeof rule === 'function') {
        parsedRules.push(rule as IValidatorRuleFunction<Array<any>, Context>);
      } else if (isNonNullString(rule)) {
        const parsedRule = this.parseStringRule(rule, registeredRules);
        if (parsedRule) {
          parsedRules.push(parsedRule);
        } else {
          invalidRules.push(rule as any);
        }
      } else if (isObj(rule) && typeof rule === 'object') {
        const parsedObject = this.parseObjectRule<Context>(
          rule,
          registeredRules
        );
        if (parsedObject.length) {
          parsedRules.push(...parsedObject);
        }
      }
    }

    return { sanitizedRules: parsedRules, invalidRules };
  }

  /**
   * ## Parse String-Based Validation Rules
   *
   * Internal helper method that parses string-format validation rules into standardized
   * rule objects. Handles both simple rule names and rules with parameters using
   * bracket notation syntax.
   *
   * ### Supported String Formats
   * - `"ruleName"` - Simple rule without parameters
   * - `"ruleName[param]"` - Rule with single parameter
   * - `"ruleName[param1,param2,param3]"` - Rule with multiple parameters
   *
   * ### Parameter Parsing
   * - Parameters are extracted from content within square brackets
   * - Multiple parameters are separated by commas
   * - Leading/trailing whitespace is automatically trimmed
   * - All parameters are treated as strings (conversion happens in rule functions)
   *
   * @example
   * ```typescript
   * // These calls demonstrate the parsing logic (internal method)
   * // Simple rule
   * parseStringRule("Required", registeredRules)
   * // Returns: { ruleName: "Required", params: [], ruleFunction: fn, rawRuleName: "Required" }
   *
   * // Rule with single parameter
   * parseStringRule("MinLength[5]", registeredRules)
   * // Returns: { ruleName: "MinLength", params: ["5"], ruleFunction: fn, rawRuleName: "MinLength[5]" }
   *
   * // Rule with multiple parameters
   * parseStringRule("Between[10, 20]", registeredRules)
   * // Returns: { ruleName: "Between", params: ["10", "20"], ruleFunction: fn, rawRuleName: "Between[10, 20]" }
   * ```
   *
   * @internal
   * @param ruleString - The string representation of the rule to parse
   * @param registeredRules - Map of all currently registered validation rules
   *
   * @returns Parsed rule object with standardized structure, or null if rule not found
   * @returns returns.ruleName - The extracted rule name
   * @returns returns.params - Array of string parameters
   * @returns returns.ruleFunction - The actual validation function
   * @returns returns.rawRuleName - The original unparsed rule string
   *
   * @since 1.22.0
   * @see {@link parseAndValidateRules} - Public method that uses this parser
   * @private
   */
  private static parseStringRule<Context = unknown>(
    ruleString: string,
    registeredRules: IValidatorRegisteredRules<Context>
  ): any {
    let ruleName = String(ruleString).trim();
    const ruleParameters: string[] = [];

    /* if (ruleName.indexOf("[") > -1) {
      const ruleParts = ruleName.rtrim("]").split("[");
      ruleName = ruleParts[0].trim();
      const parameterString = String(ruleParts[1]);
      const parameterSegments = parameterString.split(",");

      for (let index = 0; index < parameterSegments.length; index++) {
        ruleParameters.push(parameterSegments[index].replace("]", "").trim());
      }
    }
 */
    const ruleFunction = registeredRules[ruleName as IValidatorRuleName];
    if (typeof ruleFunction === 'function') {
      return {
        ruleName: ruleName as IValidatorRuleName,
        params: ruleParameters,
        ruleFunction: ruleFunction as IValidatorRuleFunction,
        rawRuleName: String(ruleString),
      };
    }

    return null;
  }
  private static parseObjectRule<Context = unknown>(
    rulesObject: IValidatorRuleObject<Context>,
    registeredRules: IValidatorRegisteredRules<Context>
  ): IValidatorSanitizedRuleObject<Array<any>, Context>[] {
    const result: IValidatorSanitizedRuleObject<Array<any>, Context>[] = [];
    if (!isObj(rulesObject) || typeof rulesObject !== 'object') {
      return result;
    }
    for (const propertyKey in rulesObject) {
      if (Object.hasOwnProperty.call(rulesObject, propertyKey)) {
        const ruleName: IValidatorRuleName = propertyKey as IValidatorRuleName;
        if (typeof registeredRules[ruleName] !== 'function') {
          continue;
        }
        const ruleFunction = registeredRules[ruleName];
        const ruleParameters = (rulesObject as any)[ruleName];
        if (Array.isArray(ruleParameters)) {
          result.push({
            ruleName,
            ruleFunction: ruleFunction as any,
            params: ruleParameters,
            rawRuleName: ruleName,
          });
        }
      }
    }
    return result;
  }

  /**
   * ## Validate a Single Value
   *
   * Performs validation on a single value using a set of specified validation rules.
   * This is the main validation method for validating individual values outside of
   * class-based validation contexts.
   *
   * ### Key Features
   * - **Synchronous Rule Support**: Handles both synchronous and asynchronous validation rules
   * - **Multiple Rules**: Supports validation with multiple rules applied sequentially
   * - **Error Handling**: Never throws errors; returns a result object with success/failure status
   * - **Type Safe**: Full TypeScript support with generic typing for context
   * - **Nullable Handling**: Supports Empty, Nullable, and Optional rules for conditional validation
   * - **Performance**: Tracks validation duration and timestamps
   *
   * ### Return Type: IValidatorValidateResult
   * The method returns a discriminated union that can be narrowed:
   * ```typescript
   * type IValidatorValidateResult<Context> =
   *   | IValidatorValidateSuccess<Context>  // success: true
   *   | IValidatorValidateFailure<Context>  // success: false
   * ```
   *
   * #### Success Result (success: true)
   * - `success`: true
   * - `value`: The original value that was validated
   * - `validatedAt`: ISO timestamp when validation completed
   * - `duration`: Milliseconds elapsed during validation
   * - `data`: Optional context data passed to rules
   * - `context`: Optional validation context of type Context
   *
   * #### Failure Result (success: false)
   * - `success`: false
   * - `value`: The original value that failed validation
   * - `error`: IValidatorValidationError containing:
   *   - `message`: Error message (translated if i18n available)
   *   - `ruleName`: Name of the rule that failed
   *   - `ruleParams`: Parameters passed to the rule
   *   - `fieldName`: Optionally provided field identifier
   * - `failedAt`: ISO timestamp when validation failed
   * - `duration`: Milliseconds elapsed before failure
   *
   * ### Nullable Rules
   * Special handling for conditional validation rules:
   * - **Empty**: Skips validation if value is empty string ""
   * - **Nullable**: Skips validation if value is null or undefined
   * - **Optional**: Skips validation if value is undefined only
   *
   * Priority order: Empty > Nullable > Optional
   *
   * ### Examples
   *
   * #### Basic Single Rule Validation
   * ```typescript
   * const result = await Validator.validate({
   *   value: "user@example.com",
   *   rules: ["Required", "Email"],
   * });
   *
   * if (result.success) {
   *   console.log("Email is valid:", result.value);
   * } else {
   *   console.error("Validation failed:", result.error.message);
   * }
   * ```
   *
   * #### Validation with Parameters
   * ```typescript
   * const result = await Validator.validate({
   *   value: "hello",
   *   rules: [
   *     "Required",
   *     "MinLength[5]",  // Validates length >= 5
   *     "MaxLength[20]", // Validates length <= 20
   *   ],
   * });
   * ```
   *
   * #### Custom Error Messages with i18n
   * ```typescript
   * const result = await Validator.validate({
   *   value: "",
   *   rules: ["Required"],
   *   fieldName: "email",  // For context in error messages
   * });
   *
   * if (!result.success) {
   *   // Error message can include field name if i18n is configured
   *   console.error(result.error.message);
   * }
   * ```
   *
   * #### Async Rule with Context
   * ```typescript
   * interface MyContext {
   *   userId: number;
   *   permissions: string[];
   * }
   *
   * const result = await Validator.validate<MyContext>({
   *   value: "admin_action",
   *   rules: ["Required", "UniqueAction"],
   *   context: {
   *     userId: 123,
   *     permissions: ["admin"],
   *   },
   * });
   * ```
   *
   * #### Nullable Rule Examples
   * ```typescript
   * // Null is valid with Nullable rule
   * const result1 = await Validator.validate({
   *   value: null,
   *   rules: ["Nullable", "Required"],
   * });
   * // result1.success === true (skips Required check)
   *
   * // Empty string is valid with Empty rule
   * const result2 = await Validator.validate({
   *   value: "",
   *   rules: ["Empty", "Email"],
   * });
   * // result2.success === true (skips Email check)
   *
   * // Undefined is valid with Optional rule
   * const result3 = await Validator.validate({
   *   value: undefined,
   *   rules: ["Optional", "MinLength[5]"],
   * });
   * // result3.success === true (skips MinLength check)
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
   * @template Context - Optional type for the validation context object
   *
   * @param options - Validation options (MakeOptional<
    IValidatorValidateOptions<Array<any>, Context>,
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
   * @returns Promise resolving to IValidatorValidateResult<Context>
   *          - Success: object with success=true, value, validatedAt, duration
   *          - Failure: object with success=false, error, failedAt, duration
   *
   * @throws {Never} This method never throws. All errors are returned in the result object.
   *
   * @since 1.0.0
   * @see {@link validateTarget} - For class-based validation using decorators
   * @see {@link registerRule} - To register custom validation rules
   * @see {@link IValidatorValidateResult} - Result type documentation
   * @see {@link IValidatorValidationError} - Error details type
   *
   * @public
   * @async
   */
  static async validate<Context = unknown>({
    rules,
    ...extra
  }: MakeOptional<
    IValidatorValidateOptions<Array<any>, Context>,
    'i18n'
  >): Promise<IValidatorValidateResult<Context>> {
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

    if (this.shouldSkipValidation({ value, rules: sanitizedRules })) {
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
      const next = async function (): Promise<any> {
        index++;
        if (index >= rulesLength) {
          return resolve(createSuccessResult(successOrErrorData, startTime));
        }
        const rule = sanitizedRules[index];
        let ruleName = undefined;
        let rawRuleName: IValidatorRuleName | string | undefined = undefined;
        let ruleParams: any[] = [];
        let ruleFunc: IValidatorRuleFunction<Array<any>, Context> | undefined =
          typeof rule === 'function' ? rule : undefined;
        if (typeof rule === 'object' && isObj(rule)) {
          ruleFunc = rule.ruleFunction;
          ruleParams = Array.isArray(rule.params) ? rule.params : [];
          ruleName = rule.ruleName;
          rawRuleName = rule.rawRuleName;
        } else if (typeof rule == 'function') {
          ruleName = rule.name as any;
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
          ...i18nRuleOptions,
          ruleName,
          rule: ruleName,
          rawRuleName,
          ruleParams,
          rules,
          value,
          i18n,
        };
        const handleResult = (result: any) => {
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
                ruleParams,
                ...translateOptions,
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
          } else if ((result as any) instanceof Error) {
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

        // Check for multi-rule decorators (OneOf, AllOf, ArrayOf) using symbol markers
        // These decorators are never registered as named rules, only available as decorator functions
        const markerType = getMultiRuleType(ruleFunc);

        if (markerType === 'arrayof') {
          const arrayOfResult = await Validator.validateArrayOfRule<Context>({
            ...validateOptions,
            startTime,
          } as any);
          return handleResult(arrayOfResult);
        } else if (markerType === 'oneof' || markerType === 'allof') {
          const oneOrAllResult = await Validator.validateMultiRule<Context>(
            markerType === 'oneof' ? 'OneOf' : 'AllOf',
            {
              ...validateOptions,
              startTime,
            }
          );
          return handleResult(oneOrAllResult);
        } else if (
          hasRuleMarker(ruleFunc, VALIDATOR_NESTED_RULE_MARKER) &&
          ruleParams[0]
        ) {
          const nestedResult = await Validator.validateNestedRule<
            ClassConstructor,
            Context
          >({
            ...validateOptions,
            data,
            startTime,
            ruleParams: ruleParams as any,
          });
          return handleResult(nestedResult);
        }

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
          const result = await ruleFunc(validateOptions as any);
          return handleResult(result);
        } catch (e) {
          return handleResult(
            typeof e === 'string'
              ? e
              : (e as any)?.message || e?.toString() || stringify(e)
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
   * @since 1.0.0
   * @see {@link validate} - Uses this method to conditionally skip validation
   * @see {@link validateTarget} - Also uses this method for class-based validation
   * @public
   */
  static shouldSkipValidation({
    value,
    rules,
  }: {
    rules: Array<IValidatorRuleName> | IValidatorSanitizedRules<any>;
    value: any;
  }) {
    // Check for nullable rules - if value meets nullable conditions, skip validation
    if (isEmpty(value) && Array.isArray(rules)) {
      const nullableConditions = {
        Empty: (value: any) => value === '',
        Nullable: (value: any) => value === null || value === undefined,
        Optional: (value: any) => value === undefined,
      };
      for (const rule of rules) {
        if (typeof rule == 'function') {
          continue;
        }
        let ruleName = typeof rule == 'string' ? rule : undefined;
        if (
          !isNonNullString(ruleName) &&
          typeof rule === 'object' &&
          rule &&
          isNonNullString((rule as any).ruleName)
        ) {
          ruleName = (rule as any).ruleName;
        }
        if (
          ruleName &&
          ruleName in nullableConditions &&
          nullableConditions[ruleName as keyof typeof nullableConditions](value)
        ) {
          return true;
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
   * @returns `IValidatorResult` (`Promise<boolean|string>`)
   * @example
   * const res = await Validator.validateOneOfRule({
   *   value: "user@example.com",
   *   ruleParams: ["Email", "PhoneNumber"],
   * });
   * // res === true when any sub-rule succeeds
   * @since 1.35.0
   * @see {@link validateMultiRule}
   */
  static validateOneOfRule<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): IValidatorResult {
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
   * @returns `IValidatorResult` (`Promise<boolean|string>`)
   * @example
   * const res = await Validator.validateAllOfRule({
   *   value: "hello",
   *   ruleParams: ["String", { MinLength: [5] }],
   * });
   * // res === true only if all sub-rules succeed
   * @since 1.35.0
   * @see {@link validateMultiRule}
   */
  static validateAllOfRule<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): IValidatorResult {
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
   * @returns `IValidatorResult` (`Promise<boolean|string>`) - `true` if all items pass; otherwise an aggregated error string
   * @example
   * const res = await Validator.validateArrayOfRule({
   *   value: ["user@example.com", "admin@example.com"],
   *   ruleParams: ["Email"],
   * });
   * // res === true when every item is a valid email
   * @since 1.36.0
   */
  static async validateArrayOfRule<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ): Promise<boolean | string> {
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
  static getI18nTranslateOptions({
    fieldName,
    propertyName,
    fieldLabel,
    translatedPropertyName,
    context,
    data,
    ...rest
  }: Partial<IValidatorValidateOptions<Array<any>, any>>) {
    fieldName = defaultStr(fieldName, propertyName);
    fieldLabel = defaultStr(fieldLabel, translatedPropertyName, fieldName);
    const r: Partial<IValidatorValidateOptions<Array<any>, any>> = {
      fieldLabel,
      translatedPropertyName: defaultStr(translatedPropertyName, fieldLabel),
      propertyName: defaultStr(propertyName, fieldName),
      fieldName,
    };
    if ('data' in rest && rest.data !== undefined) {
      (r as any).data = rest.data;
    }
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
   *   @IsRequired
   *   @MinLength([5])
   *   street: string;
   *
   *   @IsRequired
   *   @IsPostalCode
   *   postalCode: string;
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
   * @param options - Validation rule function options (IValidatorNestedRuleFunctionOptions<Target, Context>)
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
   * @returns Promise<boolean | string>
   * - Resolves to `true` if nested object validation succeeds
   * - Resolves to error message string if validation fails
   * - Never rejects; all errors are returned as resolution values
   * - Error messages include nested field paths: `"[fieldName]: error; [fieldName]: error"`
   *
   * @throws {Never} This method never throws errors; all failures are returned as strings
   *
   * @remarks
   * - This is an internal method primarily used by the `validateNested` factory
   * - Accepts IValidatorNestedRuleFunctionOptions which omits validateTarget's i18n parameter
   * - Delegates directly to validateTarget(target, options) maintaining all context
   * - Nested validation errors include property names for clear error tracing
   * - The method integrates seamlessly with the multi-rule validation system
   * - Supports recursive nesting of arbitrarily deep object structures
   * - Performance: Delegates to validateTarget which validates fields in parallel
   * - Error aggregation uses nested field paths for hierarchical clarity
   *
   * @since 1.36.0
   * @see {@link validateNested} - Factory function that creates rule functions using this method
   * @see {@link validateTarget} - The underlying class-based validation method (accepts options with data)
   * @see {@link ValidateNested} - Decorator that uses this method via the factory
   * @see {@link IValidatorNestedRuleFunctionOptions} - Options interface for this method
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
  }: IValidatorNestedRuleFunctionOptions<Target, Context>): Promise<
    boolean | string
  > {
    let { startTime, value, ...extra } = options;
    startTime = isNumber(startTime) ? startTime : Date.now();
    const i18n = this.getI18n(extra);
    const ruleParamsArray = Array.isArray(ruleParams) ? ruleParams : [];
    const target = ruleParamsArray[0] as Target | undefined;
    const translateProperties = {
      rule: 'ValidateNested',
      ...this.getI18nTranslateOptions(extra),
      value,
    };
    // Validate that a nested class was provided
    if (!target) {
      return i18n.t('validator.invalidRule', translateProperties);
    }

    // Validate value is an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      const receivedType = value === null ? 'null' : typeof value;
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
    });

    // If validation succeeded, return true
    if (nestedResult.success) {
      return true;
    }

    // Aggregate nested errors with field path information
    const nestedErrors = (nestedResult as any).errors || [];
    const errorMessages = nestedErrors
      .map(
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
   * @param options - Validation options extending {@link IValidatorValidateMultiRuleOptions}
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
   * @returns IValidatorResult
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
   * @since 1.35.0
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
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    ruleName: IValidatorMultiRuleNames,
    {
      value,
      ruleParams,
      startTime,
      ...extra
    }: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
  ) {
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
    const allErrors: IValidatorValidateFailure<Context>[] = [];
    let firstSuccess: IValidatorValidateSuccess<Context> | null = null;

    for (const subRule of subRules) {
      const res = await Validator.validate<Context>({
        value,
        ...extra,
        rules: [subRule],
        i18n,
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
   * @since 1.35.0
   * @see {@link validateOneOfRule} - The underlying validation method
   * @see {@link buildMultiRuleDecorator} - Creates decorators using this method
   * @see {@link registerRule} - Register the returned function as a named rule
   * @public
   */
  static oneOf<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    ruleParams: RulesFunctions
  ): IValidatorRuleFunction<RulesFunctions, Context> {
    return function OneOf(
      options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
    ) {
      return Validator.validateOneOfRule<Context, RulesFunctions>({
        ...options,
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
   * @returns `IValidatorRuleFunction` to use in `Validator.validate` or decorators
   * @example
   * const strongStringRule = Validator.allOf(["String", { MinLength: [5] }]);
   * const res = await strongStringRule({ value: "hello" });
   * // res === true
   * @since 1.35.0
   * @see {@link validateAllOfRule}
   * @see {@link buildMultiRuleDecorator}
   * @see {@link registerRule}
   * @public
   */
  static allOf<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    ruleParams: RulesFunctions
  ): IValidatorRuleFunction<RulesFunctions, Context> {
    return function AllOf(
      options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
    ) {
      return Validator.validateAllOfRule<Context, RulesFunctions>({
        ...options,
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
   * @returns `IValidatorRuleFunction` usable in `Validator.validate` or decorators
   * @example
   * const emails = Validator.arrayOf(["Email"]);
   * const res = await emails({ value: ["a@b.com", "c@d.com"] }); // true
   * @since 1.36.0
   */
  static arrayOf<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(
    ruleParams: RulesFunctions
  ): IValidatorRuleFunction<RulesFunctions, Context> {
    return function ArrayOf(
      options: IValidatorValidateMultiRuleOptions<Context, RulesFunctions>
    ) {
      return Validator.validateArrayOfRule<Context, RulesFunctions>({
        ...options,
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
   * - Returns an `IValidatorRuleFunction` for use in validators
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
   *   @IsRequired
   *   street: string;
   *
   *   @IsRequired
   *   postalCode: string;
   * }
   *
   * class UserForm {
   *   @IsRequired
   *   @IsEmail
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
   *   @IsRequired
   *   coordinates: string; // e.g., "40.7128,-74.0060"
   * }
   *
   * const addressOrLocation = Validator.oneOf([
   *   Validator.validateNested([Address]),
   *   Validator.validateNested([Location])
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
   *   @IsRequired
   *   role: string;
   *
   *   @IsRequired
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
   * @param ruleParams - Tuple containing the nested class constructor at position [0].
   *                     Must be a class decorated with validation rules.
   *
   * ### Returns
   * `IValidatorRuleFunction<[target: Target], Context>` - A rule function that:
   * - Accepts validation options with nested object data (IValidatorValidateOptions)
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
   * 4. Properly types the data as `IValidatorValidateTargetData<Target>`
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
   * @returns IValidatorRuleFunction - Rule function for nested object validation
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
   *   @IsRequired @IsEmail email: string;
   *   @IsRequired @IsPhoneNumber phone: string;
   * }
   *
   * class Person {
   *   @IsRequired @MinLength([2]) name: string;
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
   * @since 1.36.0
   * @see {@link validateNestedRule} - The underlying validation executor that delegates to validateTarget
   * @see {@link ValidateNested} - Decorator using this factory
   * @see {@link validateTarget} - Multi-field class validation (signature: validateTarget<T, Context>(target, options))
   * @see {@link IValidatorValidateOptions} - Validation options interface for rule functions
   * @see {@link IValidatorValidateTargetOptions} - Target validation options interface
   * @see {@link oneOf} - Similar factory for OneOf rule creation
   * @see {@link allOf} - Similar factory for AllOf rule creation
   * @see {@link arrayOf} - Similar factory for ArrayOf rule creation
   * @see {@link buildMultiRuleDecorator} - Decorator builder for complex rules
   * @public
   */
  static validateNested<
    Target extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    ruleParams: [target: Target]
  ): IValidatorRuleFunction<[target: Target], Context> {
    return function ValidateNested(
      options: IValidatorValidateOptions<[target: Target], Context>
    ) {
      return Validator.validateNestedRule({
        ...options,
        ruleParams,
      });
    };
  }

  static isSuccess<Context = unknown>(
    result: IValidatorValidateResult<Context>
  ): result is IValidatorValidateSuccess<Context> {
    return isObj(result) && result.success === true;
  }

  static isFailure<Context = unknown>(
    result: any
  ): result is IValidatorValidateFailure<Context> {
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
   * - **Decorator Support**: Uses @IsEmail, @IsRequired, @MinLength, etc. decorators
   * - **Multi-Field Validation**: Validates all decorated properties in parallel
   * - **Error Accumulation**: Collects all field validation errors into a single result
   * - **Field Mapping**: Maps validated data back to original structure with proper types
   * - **Internationalization**: Supports translated property names and error messages
   * - **Custom Error Formatting**: Allows custom error message builders per field
   * - **Async Rules**: Supports both sync and async validation rules for each field
   * - **Type Safe**: Full TypeScript support with generic typing for class instances
   *
   * ### Return Type: IValidatorValidateTargetResult
   * Returns a discriminated union that can be narrowed:
   * ```typescript
   * type IValidatorValidateTargetResult<T> =
   *   | IValidatorValidateTargetSuccess<T>  // success: true
   *   | IValidatorValidateTargetFailure<T>  // success: false
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
   * - `errors`: Array of IValidatorValidationError objects, one per failed field
   * - `failureCount`: Number of fields that failed validation
   * - `message`: Summary message (e.g., "Validation failed for 3 fields")
   * - `failedAt`: ISO timestamp when validation failed
   * - `duration`: Milliseconds elapsed before failure
   * - `status`: "error"
   *
   * ### Supported Decorators
   * - `@IsRequired` / `@IsNullable` / `@IsEmpty` / `@IsOptional` - Conditional rules
   * - `@IsEmail` / `@IsUrl` / `@IsPhoneNumber()` - Format validators
   * - `@MinLength[n]` / `@MaxLength[n]` - Length validators
   * - `@IsNumber` / `@IsNonNullString` - Type validators
   * - `@ Length[n]` - Exact length validator
   * - Custom decorators created with `Validator.buildPropertyDecorator()`
   *
   * ### Nullable Rule Behavior
   * - **@IsEmpty**: Skips remaining rules if value is empty string ""
   * - **@IsNullable**: Skips remaining rules if value is null or undefined
   * - **@IsOptional**: Skips remaining rules if value is undefined only
   * - **Skip if Absent**: @IsOptional fields can be omitted from data entirely
   *
   * ### Examples
   *
   * #### Basic Class Validation
   * ```typescript
   * class UserForm {
   *   @IsRequired
   *   @IsEmail
   *   email: string;
   *
   *   @IsRequired
   *   @MinLength([3])
   *   @MaxLength([50])
   *   name: string;
   *
   *   @IsNullable
   *   @IsNumber
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
   * #### Complex Multi-Field Validation
   * ```typescript
   * class ProductForm {
   *   @IsRequired
   *   @MinLength([3])
   *   title: string;
   *
   *   @IsRequired
   *   @IsNumber
   *   @NumberGreaterThan([0])
   *   price: number;
   *
   *   @IsEmpty // Product description can be empty
   *   @MaxLength([1000])
   *   description?: string;
   *
   *   @IsOptional // Can be omitted entirely
   *   @IsUrl
   *   imageUrl?: string;
   * }
   *
   * const result = await Validator.validateTarget(ProductForm, {
   *   data : {
   *  title: "Awesome Product",
   *   price: 29.99,
   *   description: "",
   *   // imageUrl omitted (valid with @IsOptional)
   *   }
   * });
   * ```
   *
   * #### Custom Error Message Building
   * ```typescript
   * const result = await Validator.validateTarget(UserForm, data, {
   *   errorMessageBuilder: (translatedPropertyName, error, options) => {
   *     // Custom format: "Field Name (validation rule): error message"
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
   *   @IsRequired
   *   action: string;
   *
   *   @IsRequired
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
   *   options: Omit<IValidatorValidateTargetOptions<Target, Context>, "i18n"> & {
   *     i18n?: I18n;
   *   }
   * ): Promise<IValidatorValidateTargetResult<Context>>
   * ```
   *
   * ### Method Parameters
   * The method accepts two parameters:
   * 1. `target` - Class constructor decorated with validation rules
   * 2. `options` - Configuration object containing validation data and settings
   *
   * ### Options Structure
   * The `options` parameter extends `IValidatorValidateTargetOptions` and includes:
   * - `data`: Object containing property values to validate (can be partial)
   * - `context`: Optional context object passed to all validation rules
   * - `errorMessageBuilder`: Optional custom error message formatter function
   *   - Signature: `(translatedPropertyName: string, error: string, options?: any) => string`
   *   - Default: `(name, error) => \"[${name}] : ${error}\"`
   * - `i18n`: Optional I18n instance (merged with default i18n if not provided)
   * - Other properties from IValidatorValidateTargetOptions
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
   *   errorMessageBuilder: (name, error) => `Field ${name}: ${error}`
   * });
   * ```
   *
   * @template Target - Class constructor type (extends ClassConstructor)\n   * @template Context - Optional type for validation context passed to rules
   *
   * @param target - Class constructor decorated with validation decorators (e.g., UserForm)
   * @param options - Validation options object\n   *                Extended from IValidatorValidateTargetOptions with optional i18n property\n   *                Type: Omit<IValidatorValidateTargetOptions<Target, Context>, \"i18n\"> & { i18n?: I18n }
   * @param options.data - Object containing property values to validate (can be partial, required)
   * @param options.context - Optional context object passed to all validation rules
   * @param options.errorMessageBuilder - Optional custom error message formatter function
   * @param options.i18n - Optional i18n instance for localization
   *
   * @returns Promise<IValidatorValidateTargetResult<Context>>
   * - **Success**: object with success=true, data (validated object), validatedAt, duration, status=\"success\"
   * - **Failure**: object with success=false, errors (array), failureCount, message, failedAt, duration, status=\"error\"
   * - Never throws; all errors are returned in the result object
   *
   * @throws {Never} This method never throws. All errors are returned in the result object.
   *
   * @remarks
   * - Validation is performed in parallel for all decorated fields using Promise.all()
   * - Fields decorated with @IsOptional can be omitted entirely from input data\n   * - Nullable/Empty rules prevent other rules from executing for that field
   * - Property names are translated using i18n if available (via i18n.translateTarget method)
   * - Errors include field-specific information: propertyName, translatedPropertyName, message, ruleName, value
   * - Custom errorMessageBuilder allows field-level error message customization
   * - Context is propagated through to all field validation rules
   * - Supports nested validation through @ValidateNested rule and validateNested factory
   * - Error messages use default format: \"[translatedPropertyName] : error\" unless custom builder provided
   * - Integrates with the multi-rule system (OneOf, AllOf, ArrayOf) for field validation
   *
   * @since 1.0.0
   * @see {@link validate} - For single-value validation without class schema
   * @see {@link validateNestedRule} - Internal rule handler that delegates to validateTarget
   * @see {@link validateNested} - Factory creating nested validation rule functions
   * @see {@link buildPropertyDecorator} - To create custom validation decorators
   * @see {@link registerRule} - To register custom validation rules\n   * @see {@link IValidatorValidateTargetResult} - Result type documentation
   * @see {@link IValidatorValidationError} - Error details type
   * @see {@link IValidatorValidateTargetOptions} - Full options interface
   *
   * @public
   * @async
   */
  static async validateTarget<
    Target extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    target: Target,
    options: Omit<IValidatorValidateTargetOptions<Target, Context>, 'i18n'> & {
      i18n?: I18n;
    }
  ): Promise<IValidatorValidateTargetResult<Context>> {
    const startTime = Date.now();
    const targetRules = Validator.getTargetRules<Target>(target);
    const { context, errorMessageBuilder, ...restOptions } = Object.assign(
      {},
      Validator.getValidateTargetOptions(target) as any,
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

    const validationErrors: IValidatorValidationError[] = [];
    const validationPromises: Promise<IValidatorValidateResult<Context>>[] = [];
    let validatedFieldCount = 0;

    const translatedPropertyNames = i18n.translateTarget(target, { data });
    for (const propertyKey in targetRules) {
      const rules = targetRules[propertyKey];
      const { sanitizedRules } = this.parseAndValidateRules(rules);
      const value = data[propertyKey];
      // Skip validation for Optional fields that are not present in data
      if (this.shouldSkipValidation({ value, rules: sanitizedRules })) {
        continue;
      }
      const translatedPropertyName: string = defaultStr(
        (translatedPropertyNames as any)[propertyKey],
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
          rules: targetRules[propertyKey],
          fieldLabel: defaultStr(translatedPropertyName, propertyKey),
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

    return new Promise<IValidatorValidateTargetResult<Context>>((resolve) => {
      return Promise.all(validationPromises).then(() => {
        const isValidationSuccessful = !validationErrors.length;
        if (isValidationSuccessful) {
          resolve(
            createSuccessResult<Context>(
              {
                data,
                value: undefined,
                context,
              },
              startTime
            ) as any
          );
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
   *   @IsRequired
   *   @IsEmail
   *   email: string;
   *
   *   @IsRequired
   *   @MinLength([3])
   *   @MaxLength([50])
   *   name: string;
   *
   *   @IsOptional
   *   @IsNumber
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
   * @since 1.0.0
   * @see {@link validateTarget} - Uses this method to get validation rules
   * @see {@link buildPropertyDecorator} - How rules are attached to properties
   * @public
   */
  static getTargetRules<T extends ClassConstructor = any>(
    target: T
  ): Record<keyof InstanceType<T>, IValidatorRule[]> {
    return getDecoratedProperties(
      target,
      VALIDATOR_TARGET_RULES_METADATA_KEY
    ) as Record<keyof InstanceType<T>, IValidatorRule[]>;
  }

  /**
   * ## Check If Property Has ValidateNested Rule
   *
   * Determines whether a specific property of a class has the `@ValidateNested` decorator
   * applied by inspecting the metadata attached to the property. This provides an alternative
   * to string-based rule name checking, allowing metadata-based detection of nested validation rules.
   *
   * ### Purpose
   * This method enables detection of `@ValidateNested` decorators using the reflection
   * metadata system rather than relying on normalized rule name string comparison.
   * This is more robust and type-safe for identifying nested validation requirements.
   *
   * ### How It Works
   * 1. Retrieves all validation rules attached to the specified property
   * 2. Checks if any rule is marked with the ValidateNested symbol marker
   * 3. Returns true if at least one ValidateNested rule is found
   *
   * @example
   * ```typescript
   * class Address {
   *   street: string = "";
   *   city: string = "";
   * }
   *
   * class User {
   *   name: string = "";
   *
   *   @ValidateNested([Address])
   *   address: Address = new Address();
   * }
   *
   * // Check if the address property has ValidateNested
   * const hasNested = Validator.hasValidateNestedRule(User, 'address');
   * console.log(hasNested); // true
   *
   * // Check if the name property has ValidateNested
   * const nameHasNested = Validator.hasValidateNestedRule(User, 'name');
   * console.log(nameHasNested); // false
   * ```
   *
   * ### Metadata-Based Detection
   * Unlike the string-based `normalizedRule === "validatenested"` check in the validation
   * pipeline, this method directly inspects decorator metadata stored on the class property.
   * It provides:
   * - Type safety: Works with actual decorator function references
   * - Clarity: Explicitly checks for the ValidateNested decorator
   * - Robustness: Works with minified code (uses symbol markers, not function names)
   * - Decoupling: No dependency on rule name strings or normalization
   *
   * @template T - Class constructor type extending ClassConstructor
   *
   * @param target - The class constructor to inspect
   * @param propertyKey - The property name to check for ValidateNested decorator
   *
   * @returns `true` if the property has a ValidateNested rule applied, `false` otherwise
   *
   * @since 1.36.0
   * @see {@link getTargetRules} - Get all rules for a target class
   * @see {@link validateNestedRule} - The underlying nested validation method
   * @see {@link ValidateNested} - The decorator that applies nested validation
   * @public
   */
  static hasValidateNestedRule<T extends ClassConstructor = any>(
    target: T,
    propertyKey: keyof InstanceType<T>
  ): boolean {
    const rules = this.getTargetRules(target);
    const propertyRules = rules[propertyKey];

    if (!Array.isArray(propertyRules)) {
      return false;
    }

    // Check if any rule is marked with the ValidateNested symbol marker
    return propertyRules.some((rule) => {
      if (typeof rule === 'function') {
        return hasRuleMarker(rule, VALIDATOR_NESTED_RULE_MARKER);
      }
      if (isObj(rule) && typeof (rule as any).ruleFunction === 'function') {
        return hasRuleMarker(
          (rule as any).ruleFunction,
          VALIDATOR_NESTED_RULE_MARKER
        );
      }
      return false;
    });
  }

  /**
   * ## Get ValidateNested Rule Parameters
   *
   * Retrieves the target class constructor parameter from a `@ValidateNested` decorator
   * attached to a specific property. This allows programmatic inspection of which nested
   * class is being validated without executing the validation.
   *
   * ### Purpose
   * Extract the nested class constructor that was passed to the `@ValidateNested` decorator,
   * useful for:
   * - Programmatic validation inspection
   * - Dynamic class discovery
   * - Reflection-based tools
   * - Testing and debugging
   *
   * @example
   * ```typescript
   * class Address {
   *   street: string = "";
   * }
   *
   * class User {
   *   @ValidateNested([Address])
   *   address: Address = new Address();
   * }
   *
   * // Get the target class for nested validation
   * const nestedClass = Validator.getValidateNestedTarget(User, 'address');
   * console.log(nestedClass === Address); // true
   * ```
   *
   * ### Return Value
   * Returns the class constructor if found, or undefined if:
   * - The property has no ValidateNested rule
   * - The metadata cannot be retrieved
   * - The rule parameters are invalid
   *
   * ### Implementation Details
   * This method:
   * 1. Identifies ValidateNested rules using symbol markers (works with minified code)
   * 2. Extracts the target class from stored rule parameters
   * 3. Returns the class constructor for reflection or dynamic validation
   * 4. Works with nested target rules created via buildTargetRuleDecorator
   *
   * @template T - Class constructor type
   *
   * @param target - The class constructor to inspect
   * @param propertyKey - The property with the ValidateNested decorator
   *
   * @returns The nested class constructor if found, undefined otherwise
   *
   * @since 1.36.0
   * @see {@link hasValidateNestedRule} - Check if property has ValidateNested rule
   * @see {@link getTargetRules} - Get all rules for a class
   * @public
   */
  static getValidateNestedTarget<T extends ClassConstructor = any>(
    target: T,
    propertyKey: keyof InstanceType<T>
  ): ClassConstructor | undefined {
    const rules = this.getTargetRules(target);
    const propertyRules = rules[propertyKey];

    if (!Array.isArray(propertyRules)) {
      return undefined;
    }

    // Find the ValidateNested rule by symbol marker
    for (const rule of propertyRules) {
      if (
        typeof rule === 'function' &&
        hasRuleMarker(rule, VALIDATOR_NESTED_RULE_MARKER)
      ) {
        // Try to get params from the stored params symbol
        const params = (rule as any)[VALIDATOR_NESTED_RULE_PARAMS];
        if (Array.isArray(params) && params.length > 0) {
          return params[0];
        }
      } else if (
        isObj(rule) &&
        typeof (rule as any).ruleFunction === 'function' &&
        hasRuleMarker((rule as any).ruleFunction, VALIDATOR_NESTED_RULE_MARKER)
      ) {
        // For object rules, try to get from params
        const ruleParams = (rule as any).params;
        if (Array.isArray(ruleParams) && ruleParams.length > 0) {
          return ruleParams[0];
        }
      }
    }

    return undefined;
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
   *   @IsRequired
   *   @IsEmail
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
   * @since 1.0.0
   * @see {@link validateTarget} - Uses these options during validation
   * @see {@link ValidationTargetOptions} - Decorator to set these options
   * @public
   */
  public static getValidateTargetOptions<T extends ClassConstructor>(
    target: T
  ): IValidatorValidateTargetOptions<T, any> {
    return Object.assign(
      {},
      Reflect.getMetadata(VALIDATOR_TARGET_OPTIONS_METADATA_KEY, target) || {}
    );
  }

  /**
   * ## Build Rule Decorator Factory
   *
   * Creates a decorator factory that can be used to apply validation rules to class
   * properties. This method provides a way to create reusable decorators from
   * validation rule functions with enhanced type safety and parameter handling.
   *
   * ### Decorator Factory Pattern
   * The returned function is a decorator factory that accepts parameters and returns
   * a property decorator. This allows for flexible rule configuration while maintaining
   * type safety and proper parameter validation.
   *
   * ### Parameter Handling
   * Parameters passed to the decorator factory are automatically forwarded to the
   * validation rule function during validation. This enables parameterized validation
   * rules that can be configured at decoration time.
   *
   * @example
   * ```typescript
   * // Create a custom validation rule
   * const validateAge = ({ value, ruleParams }) => {
   *   const [minAge, maxAge] = ruleParams;
   *   if (value < minAge) return `Must be at least ${minAge} years old`;
   *   if (value > maxAge) return `Must be no more than ${maxAge} years old`;
   *   return true;
   * };
   *
   * // Create a decorator factory
   * const AgeRange = Validator.buildRuleDecorator(validateAge);
   *
   * // Use the decorator
   * class Person {
   *   @IsRequired
   *   name: string;
   *
   *   @IsRequired
   *   @IsNumber
   *   @AgeRange([18, 120])  // Min 18, Max 120
   *   age: number;
   * }
   *
   * // Create specialized decorators
   * const IsAdult = AgeRange([18, 150]);
   * const IsChild = AgeRange([0, 17]);
   *
   * class User {
   *   @IsAdult
   *   userAge: number;
   * }
   *
   * class Student {
   *   @IsChild
   *   studentAge: number;
   * }
   * ```
   *
   * ### Advanced Usage with Context
   * ```typescript
   * // Context-aware validation rule
   * const validatePermission = ({ value, ruleParams, context }) => {
   *   const [requiredPermission] = ruleParams;
   *   const userPermissions = context?.permissions || [];
   *   return userPermissions.includes(requiredPermission) ||
   *          `Requires ${requiredPermission} permission`;
   * };
   *
   * const RequiresPermission = Validator.buildRuleDecorator(validatePermission);
   *
   * class AdminAction {
   *   @RequiresPermission(['admin'])
   *   action: string;
   *
   *   @RequiresPermission(['delete', 'modify'])
   *   destructiveAction: string;
   * }
   * ```
   *
   * ### Async Rule Decorators
   * ```typescript
   * // Async validation rule
   * const validateUniqueEmail = async ({ value, context }) => {
   *   const exists = await database.user.findByEmail(value);
   *   return !exists || 'Email is already registered';
   * };
   *
   * const IsUniqueEmail = Validator.buildRuleDecorator(validateUniqueEmail);
   *
   * class Registration {
   *   @IsRequired
   *   @IsEmail
   *   @IsUniqueEmail([])
   *   email: string;
   * }
   * ```
   *
   * @template RuleParamsType - Array type defining parameter structure for the rule
   * @template Context - Type of the validation context object
   *
   * @param ruleFunction - Validation function that will be wrapped in a decorator
   *
   * @returns Decorator factory function that accepts parameters and returns a property decorator
   *
   * @since 1.22.0
   * @see {@link buildPropertyDecorator} - Lower-level decorator creation
   * @see {@link registerRule} - Alternative way to create reusable rules
   * @public
   */
  static buildRuleDecorator<
    RuleParamsType extends IValidatorRuleParams = IValidatorRuleParams,
    Context = unknown,
  >(ruleFunction: IValidatorRuleFunction<RuleParamsType, Context>) {
    return function (ruleParameters: RuleParamsType) {
      const enhancedValidatorFunction: IValidatorRuleFunction<
        RuleParamsType,
        Context
      > = function (validationOptions) {
        const enhancedOptions = Object.assign({}, validationOptions);
        enhancedOptions.ruleParams = (
          Array.isArray(ruleParameters) ? ruleParameters : [ruleParameters]
        ) as RuleParamsType;
        return ruleFunction(enhancedOptions);
      };

      // Preserve symbol markers from the original function through wrapping
      // This allows decorators to be reliably identified even in minified code
      if (hasRuleMarker(ruleFunction, VALIDATOR_NESTED_RULE_MARKER)) {
        (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_MARKER] = true;

        // Store the rule parameters so they can be retrieved by inspection methods
        // This is particularly important for ValidateNested to access the target class
        const normalizedParams = (
          Array.isArray(ruleParameters) ? ruleParameters : [ruleParameters]
        ) as RuleParamsType;
        (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_PARAMS] =
          normalizedParams;
      }

      return Validator.buildPropertyDecorator<RuleParamsType, Context>(
        enhancedValidatorFunction
      );
    };
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
   * ```
   *
   * ### Advanced Usage with Validation Options
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
   *   name: string;
   *
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
   * - Examples: @MinLength([5]), @IsEmail([]), @Pattern([/regex/])
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
   * - Specializes the RuleParamsType to [target: Target]
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
   * @returns Decorator factory function that:
   *   - Accepts [TargetClass] array parameter
   *   - Returns a property decorator
   *   - Attaches target-based validation to class properties
   *   - Works with class validation via validateTarget()
   *
   * @since 1.22.0
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
  >(ruleFunction: IValidatorRuleFunction<[target: Target], Context>) {
    return this.buildRuleDecorator<[target: Target], Context>(ruleFunction);
  }
  /**
   * ## Build Optional-Parameter Rule Decorator
   *
   * Same as {@link buildRuleDecorator}, but the factory parameter is **optional**.
   * Call it with `undefined`, `[]`, or no argument at all and the underlying rule
   * will receive an empty parameter array, letting you write:
   *
   * ```ts
   * @IsRequired        // no params
   * @MinLength([5])    // with params
   * @PhoneNumber()          // optional-params version
   * @IsPhoneNumber(["US"]) // with params
   * ```
   *
   * @param ruleFunction  The validation rule to wrap
   * @returns A decorator factory that can be invoked **with or without** parameters
   *
   * @since 1.34.1
   * @see {@link buildRuleDecorator}
   * @public
   */
  static buildRuleDecoratorOptional<
    RuleParamsType extends IValidatorRuleParams = IValidatorRuleParams,
    Context = unknown,
  >(ruleFunction: IValidatorRuleFunction<RuleParamsType, Context>) {
    return function (ruleParameters?: RuleParamsType) {
      return Validator.buildRuleDecorator<RuleParamsType, Context>(
        ruleFunction
      )(ruleParameters as RuleParamsType);
    };
  }

  static buildMultiRuleDecorator<
    Context = unknown,
    RulesFunctions extends
      IValidatorDefaultMultiRule<Context> = IValidatorDefaultMultiRule<Context>,
  >(ruleFunction: IValidatorMultiRuleFunction<Context, RulesFunctions>) {
    return this.buildRuleDecorator<RulesFunctions, Context>(ruleFunction);
  }

  /**
   * ## Build Property Decorator
   *
   * Low-level method for creating property decorators that attach validation rules
   * to class properties. This method handles the metadata storage and provides
   * the foundation for all validation decorators in the system.
   *
   * ### Metadata Storage
   * This method uses TypeScript's metadata system to attach validation rules to
   * class properties. The rules are stored in a way that allows them to be
   * retrieved later during validation.
   *
   * ### Rule Accumulation
   * Multiple decorators can be applied to the same property, and this method
   * ensures that all rules are properly accumulated and stored together.
   *
   * @example
   * ```typescript
   * // Create a simple validation decorator
   * const IsPositive = Validator.buildPropertyDecorator(
   *   ({ value }) => value > 0 || 'Must be positive'
   * );
   *
   * // Create a decorator with multiple rules
   * const IsValidEmail = Validator.buildPropertyDecorator([
   *   'required',
   *   'email'
   * ]);
   *
   * // Use the decorators
   * class Product {
   *   @IsPositive
   *   price: number;
   *
   *   @IsValidEmail
   *   contactEmail: string;
   * }
   * ```
   *
   * @template RuleParamsType - Array type for rule parameters
   * @template Context - Type of the validation context object
   *
   * @param rule - Single rule or array of rules to attach to the property
   *
   * @returns Property decorator function that can be applied to class properties
   *
   * @since 1.0.0
   * @see {@link buildRuleDecorator} - Higher-level decorator creation
   * @internal
   */
  static buildPropertyDecorator<
    RuleParamsType extends IValidatorRuleParams = IValidatorRuleParams,
    Context = unknown,
  >(
    rule:
      | IValidatorRule<RuleParamsType, Context>
      | IValidatorRule<RuleParamsType, Context>[]
  ): PropertyDecorator {
    return buildPropertyDecorator<IValidatorRule<RuleParamsType, Context>[]>(
      VALIDATOR_TARGET_RULES_METADATA_KEY,
      (oldRules) => {
        return [
          ...(Array.isArray(oldRules) ? oldRules : []),
          ...(Array.isArray(rule) ? rule : [rule]),
        ];
      }
    );
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
 *   @IsRequired
 *   @IsEmail
 *   email: string;
 *
 *   @IsRequired
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
 *   @IsRequired
 *   @IsEmail
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
 *   @IsRequired
 *   @IsEmail
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
 * @since 1.22.0
 * @see {@link validateTarget} - Method that uses these options
 * @see {@link getValidateTargetOptions} - Retrieves configured options
 * @decorator
 * @public
 */
export function ValidationTargetOptions(
  validationOptions: IValidatorValidateTargetOptions<any, any>
): ClassDecorator {
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
    value?: any;
    fieldName?: string;
    propertyName?: string;
    translatedPropertyName?: string;
    ruleName?: IValidatorRuleName;
    rawRuleName?: IValidatorRuleName | string;
    ruleParams: any[];
  }
): IValidatorValidationError {
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
    value: any;
    data?: Record<string, any>;
  },
  startTime: number
): IValidatorValidateSuccess<Context> {
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
  error: IValidatorValidationError,
  options: {
    context?: Context;
    value: any;
  },
  startTime: number
): IValidatorValidateFailure<Context> {
  return {
    ...options,
    error,
    success: false,
    failedAt: new Date(),
    duration: Date.now() - startTime,
  };
}
