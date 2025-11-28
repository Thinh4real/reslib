import { defaultStr } from '@utils/defaultStr';
import { isNumber } from '@utils/isNumber';
import { ValidatorResult, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';
import { toNumber } from './utils';

import type {
  ValidatorRuleName,
  ValidatorRuleParamTypes,
  ValidatorRuleParams,
} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

function compareNumer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compare: (value: any, toCompare: any) => boolean,
  translateKey: string,
  { value, ruleParams, i18n, ...rest }: ValidatorValidateOptions,
  ruleName: ValidatorRuleName
): ValidatorResult {
  ruleParams = Array.isArray(ruleParams) ? ruleParams : [];
  const rParams = ruleParams ? ruleParams : [];
  translateKey = defaultStr(translateKey);
  const message = i18n.t(translateKey, { ...rest, value, ruleParams });
  const nVal = toNumber(value);
  value = typeof value === 'number' ? value : !isNaN(nVal) ? nVal : NaN;
  const toCompare = toNumber(rParams[0]);
  if (!isNumber(toCompare)) {
    return i18n.t('validator.invalidRuleParams', {
      value,
      ...rest,
      rule: ruleName,
      ruleParams,
    });
  }
  if (isNaN(value) || rParams[0] === undefined) {
    return message;
  }
  if (isNaN(toCompare)) {
    return message;
  }
  if (compare(value, toCompare)) {
    return true;
  }
  return message;
}

/**
 * ### IsNumberLTE Decorator
 *
 * Validates that a numeric field has a value less than or equal to a specified maximum.
 * This decorator ensures that input values do not exceed a defined upper limit.
 *
 * ### Purpose
 * Useful for enforcing maximum values in numeric inputs such as:
 * - Age limits (must be ≤ 120 years)
 * - Quantity limits (must be ≤ maximum stock)
 * - Score ranges (must be ≤ 100 points)
 * - Price ceilings (must be ≤ maximum allowed price)
 *
 * ### Parameters
 * Takes a single numeric parameter representing the maximum allowed value (inclusive).
 *
 * ### Validation Logic
 * 1. **Type Conversion**: Converts input values to numbers using `toNumber()`
 * 2. **NaN Handling**: Rejects if either value or comparison parameter is NaN
 * 3. **Comparison**: Checks if `value ≤ comparisonValue`
 * 4. **Result**: Passes if value is ≤ limit, fails otherwise
 *
 * ### Return Behavior
 * - **Success**: Resolves with `true` if `value ≤ maxValue`
 * - **Failure**: Rejects with localized error message if `value > maxValue`
 * - **Invalid Input**: Rejects if values cannot be converted to numbers
 * - **Missing Parameter**: Resolves with error if no comparison value provided
 *
 * ### Examples
 *
 * #### Basic Usage - Age Validation
 * ```typescript
 * class Person {
 *   @IsNumberLTE(120)
 *   age: number; // Must be ≤ 120 years
 * }
 *
 * // Valid: 25, 120, 0
 * // Invalid: 121, 150
 * ```
 *
 * #### Quantity Limits
 * ```typescript
 * class Order {
 *   @IsNumberLTE(1000)
 *   quantity: number; // Maximum 1000 units per order
 *
 *   @IsNumberLTE(100)
 *   discountPercent: number; // Max 100% discount
 * }
 * ```
 *
 * #### Score Validation
 * ```typescript
 * class Exam {
 *   @IsNumberLTE(100)
 *   score: number; // Test scores out of 100
 *
 *   @IsNumberLTE(50)
 *   bonusPoints: number; // Max 50 bonus points
 * }
 * ```
 *
 * #### Price Ceilings
 * ```typescript
 * class Product {
 *   @IsNumberLTE(999.99)
 *   price: number; // Maximum retail price
 *
 *   @IsNumberLTE(100)
 *   markupPercent: number; // Max 100% markup
 * }
 * ```
 *
 * ### Error Messages
 * Uses i18n translation key: `validator.numberLTE`
 * Default format: "The {field} must be less than or equal to {comparisonValue}"
 *
 * ### Type Safety
 * - Strongly typed with TypeScript generics
 * - Parameter validation at compile time
 * - Runtime type checking and conversion
 *
 * ### Performance Notes
 * - Efficient numeric conversion and comparison
 * - Early termination on invalid inputs
 * - Minimal memory allocation
 *
 * ### Related Decorators
 * - {@link IsNumberGTE}: Opposite validation (minimum values)
 * - {@link IsNumberLT}: Strict less than validation
 * - {@link IsNumberGT}: Strict greater than validation
 * - {@link IsNumberBetween}: Range validation
 *
 * ### Implementation Details
 * Uses the `compareNumer` helper function for consistent numeric validation
 * across all comparison decorators. Handles edge cases like NaN values and
 * type conversion automatically.
 *
 * @decorator
 * @public
 */
export const IsNumberLTE = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberLTE']
>(function NumberLTE(options: ValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value <= toCompare;
    },
    'validator.numberLTE',
    options,
    'NumberLTE'
  );
}, 'NumberLTE');

/**
 * @decorator IsNumberLT
 *
 * Validator rule that checks if a given number is less than a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `ValidatorResult`: Resolves to `true` if the value is less than the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberLT(10)
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input is strictly less than a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberLT = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberLT']
>(function NumberLT(options) {
  return compareNumer(
    (value, toCompare) => {
      return value < toCompare;
    },
    'validator.numberLT',
    options,
    'NumberLT'
  );
}, 'NumberLT');

/**
 * @decorator IsNumberGTE
 *
 * Validator rule that checks if a given number is greater than or equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `ValidatorResult`: Resolves to `true` if the value is greater than or equal to the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberGTE(5)
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input meets or exceeds a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberGTE = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberGTE']
>(function NumberGTE(options: ValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value >= toCompare;
    },
    'validator.numberGTE',
    options,
    'NumberGTE'
  );
}, 'NumberGTE');

/**
 * @decorator IsNumberGT
 *
 * Validator rule that checks if a given number is greater than a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `ValidatorResult`: Resolves to `true` if the value is greater than the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberGT([10])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input exceeds a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberGT = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberGT']
>(function NumberGT(
  options: ValidatorValidateOptions<ValidatorRuleParamTypes['NumberGT']>
) {
  return compareNumer(
    (value, toCompare) => {
      return value > toCompare;
    },
    'validator.numberGT',
    options,
    'NumberGT'
  );
}, 'NumberGT');

/**
 * @decorator  IsNumberEQ
 *
 * Validator rule that checks if a given number is equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `ValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `ValidatorResult`: Resolves to `true` if the value is equal to the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @ IsNumberEQ([10])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input matches a specified value exactly.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberEQ = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberEQ']
>(function NumberEQ(options: ValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value === toCompare;
    },
    'validator.numberEquals',
    options,
    'NumberEQ'
  );
}, 'NumberEQ');

/**
 * @decorator IsNumberNE
 *
 * Validator rule that checks if a given number is not equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberNE([10])
 *     myNumber: number;
 * }
 * ```
 */
export const IsNumberNE = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberNE']
>(function NumberNE(options: ValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value !== toCompare;
    },
    'validator.numberIsDifferentFrom',
    options,
    'NumberNE'
  );
}, 'NumberNE');

/**
 * ## Pre-Built Validation Decorators
 *
 * Collection of commonly used validation decorators that provide immediate
 * validation capabilities for standard data types and formats. These decorators
 * are built on top of registered validation rules and provide a convenient
 * way to apply common validations.
 */

/**
 * ### IsNumber Decorator
 *
 * Validates that a property value is a valid number. This decorator checks
 * for numeric values and rejects non-numeric inputs.
 *
 * @example
 * ```typescript
 * class Product {
 *   @IsNumber()
 *   price: number;
 *
 *   @IsNumber()
 *   quantity: number;
 *
 *   @IsRequired()
 *   @IsNumber()
 *   weight: number;
 * }
 *
 * // Valid data
 * const product = { price: 19.99, quantity: 5, weight: 2.5 };
 *
 * // Invalid data
 * const invalid = { price: "not-a-number", quantity: 5, weight: 2.5 };
 * // Will fail validation with error: "Price must be a number"
 * ```
 *
 * @decorator
 *
 * @see {@link IsRequired} - Often used together
 * @public
 */
export const IsNumber = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Number']
>(function Number(options) {
  const { value, i18n } = options;
  return isNumber(value) || i18n.t('validator.isNumber', options);
}, 'Number');

/**
 * ### IsNumberBetween Rule (Numeric)
 *
 * Validates that the field under validation has a numeric value between the
 * given minimum and maximum values (inclusive).
 *
 * #### Parameters
 * - `min` - Minimum value (inclusive)
 * - `max` - Maximum value (inclusive)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Product {
 *   @IsNumberBetween([1, 999])
 *   quantity: number;
 *
 *   @IsNumberBetween([0.01, 9999.99])
 *   price: number;
 *
 *   @IsNumberBetween([0, 100])
 *   discountPercentage: number;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing [min, max] values
 * @returns true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsNumberBetween = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['NumberBetween']
>(function NumberBetween({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<[number, number]>): ValidatorResult {
  if (!ruleParams || ruleParams.length < 2) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'NumberBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  if (!isNumber(value)) {
    const message = i18n.t('validator.numeric', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const min = toNumber(ruleParams[0]);
  const max = toNumber(ruleParams[1]);
  if (isNaN(min) || isNaN(max) || min > max) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'NumberBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  if (value >= min && value <= max) {
    return true;
  } else {
    const message = i18n.t('validator.numberBetween', {
      field: translatedPropertyName || fieldName,
      value,
      min,
      max,
      ...rest,
    });
    return message;
  }
}, 'NumberBetween');

/**
 * ### HasDecimalPlaces Rule
 *
 * Validates that the field under validation is numeric and contains the
 * specified number of decimal places.
 *
 * #### Parameters
 * - `places` - Exact number of decimal places required
 * - `min,max` (optional) - Range of decimal places allowed
 *
 * @example
 * ```typescript
 * // Class validation
 * class Financial {
 *   @HasDecimalPlaces([2])
 *   price: number; // Must have exactly 2 decimal places
 *
 *   @HasDecimalPlaces([0, 4])
 *   exchangeRate: number; // 0-4 decimal places allowed
 *
 *   @HasDecimalPlaces([3])
 *   weight: number; // Exactly 3 decimal places for precision
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array with decimal places specification
 * @returns true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const HasDecimalPlaces = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DecimalPlaces']
>(function DecimalPlaces({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (!Array.isArray(ruleParams) || !ruleParams.length) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DecimalPlaces',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (!isNumber(value)) {
    const message = i18n.t('validator.number', {
      rule: 'DecimalPlaces',
      field: translatedPropertyName || fieldName,
      value,
      ruleParams,
      ...rest,
    });
    return message;
  }

  // Get decimal places from the number
  const valueStr = String(value);
  const decimalIndex = valueStr.indexOf('.');
  const actualDecimalPlaces =
    decimalIndex === -1 ? 0 : valueStr.length - decimalIndex - 1;

  let isValid = false;

  if (ruleParams.length === 1) {
    // Exact decimal places
    const requiredPlaces = toNumber(ruleParams[0]);
    isValid = actualDecimalPlaces === requiredPlaces;
  } else if (ruleParams.length === 2) {
    // Range of decimal places
    const minPlaces = toNumber(ruleParams[0]);
    const maxPlaces = toNumber(ruleParams[1]);
    isValid =
      !isNaN(minPlaces) &&
      !isNaN(maxPlaces) &&
      actualDecimalPlaces >= minPlaces &&
      actualDecimalPlaces <= maxPlaces;
  }
  if (isValid) {
    return true;
  } else {
    const message = i18n.t('validator.decimalPlaces', {
      field: translatedPropertyName || fieldName,
      value,
      places: ruleParams.join('-'),
      actualPlaces: actualDecimalPlaces,
      ...rest,
    });
    return message;
  }
}, 'DecimalPlaces');

/**
 * ### IsInteger Rule
 *
 * Validates that the field under validation is an Integer. This rule does not
 * verify that the input is of the "Integer" variable type, only that the input
 * is a string or numeric value that contains an Integer.
 *
 * @example
 * ```typescript
 * class Inventory {
 *   @Integer
 *   quantity: number;
 *
 *   @Integer
 *   @Min([0])
 *   stockLevel: number;
 *
 *   @Integer
 *   @NumberBetween([-1000, 1000])
 *   adjustment: number;
 * }
 * ```
 *
 * @returns true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsInteger = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Integer']
>(function Integer({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (!isNumber(value) || !Number.isInteger(value)) {
    const message = i18n.t('validator.integer', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  } else {
    return true;
  }
}, 'Integer');

/**
 * ### IsEvenNumber Decorator
 *
 * Validates that the field under validation is an integer and even (divisible by 2).
 * Non-numeric inputs or non-integer numbers fail with appropriate messages.
 *
 * @example
 * ```typescript
 * class Model {
 *   @IsEvenNumber()
 *   evenId: number;
 * }
 * ```
 * * @example
 * ```typescript
 * // Class validation with decorator
 * class Invoice {
 *   @IsEvenNumber()
 *   batchNumber: number; // Must be an even integer (e.g., 2, 4, 6)
 * }
 *
 * // Direct rule usage
 * await Validator.validate({
 *   value: 42,
 *   rules: ['EvenNumber']
 * }); // ✓ Valid
 *
 * await Validator.validate({
 *   value: 7,
 *   rules: ['EvenNumber']
 * }); // ✗ Invalid (odd)
 * ```
 *
 * @public
 */
export const IsEvenNumber = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['EvenNumber']
>(function EvenNumber({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (!isNumber(value)) {
    const message = i18n.t('validator.number', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (!Number.isInteger(value)) {
    const message = i18n.t('validator.integer', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (value % 2 === 0) {
    return true;
  } else {
    return i18n.t('validator.evenNumber', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
  }
}, 'EvenNumber');

/**
 * ### IsOddNumber Decorator
 *
 * Validates that the field under validation is an integer and odd (not divisible by 2).
 * Non-numeric inputs or non-integer numbers fail with appropriate messages.
 *
 * @example
 * ```typescript
 * class Model {
 *   @IsOddNumber()
 *   oddId: number;
 * }
 * ```
 * * @example
 * ```typescript
 * // Class validation with decorator
 * class Invoice {
 *   @IsOddNumber()
 *   ticketNumber: number; // Must be an odd integer (e.g., 1, 3, 5)
 * }
 *
 * // Direct rule usage
 * await Validator.validate({
 *   value: 9,
 *   rules: ['OddNumber']
 * }); // ✓ Valid
 *
 * await Validator.validate({
 *   value: 10,
 *   rules: ['OddNumber']
 * }); // ✗ Invalid (even)
 * ```
 *
 * @public
 */
export const IsOddNumber = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['OddNumber']
>(function OddNumber({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (!isNumber(value)) {
    const message = i18n.t('validator.number', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (!Number.isInteger(value)) {
    const message = i18n.t('validator.integer', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (value % 2 !== 0) {
    return true;
  } else {
    return i18n.t('validator.oddNumber', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
  }
}, 'OddNumber');

/**
 * ### Multiple Of Rule
 *
 * Validates that the field under validation is a multiple of the specified value.
 * This is useful for ensuring values conform to specific increments.
 *
 * #### Parameters
 * - `multiple` - The value that the field must be a multiple of
 *
 * @example
 * ```typescript
 * // Multiple validation
 * class Pricing {
 *   @IsMultipleOf(0.01)
 *   price: number; // Must be in cent increments
 *
 *   @IsMultipleOf(5)
 *   discountPercent: number; // 5% increments
 *
 *   @IsMultipleOf(15)
 *   appointmentDuration: number; // 15-minute slots
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the multiple value
 * @returns true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsMultipleOf = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MultipleOf']
>(function MultipleOf({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<[number]>): ValidatorResult {
  if (!ruleParams || !ruleParams.length) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'MultipleOf',
      field: translatedPropertyName || fieldName,
      ...rest,
      ruleParams,
    });
    return message;
  }

  if (!isNumber(value)) {
    const message = i18n.t('validator.number', {
      field: translatedPropertyName || fieldName,
      value,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const multiple = toNumber(ruleParams[0]);
  if (isNaN(multiple) || multiple === 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'MultipleOf',
      ruleParams,
      field: translatedPropertyName || fieldName,
      ...rest,
    });
    return message;
  }

  // Check if the value is a multiple of the specified number
  const remainder = value % multiple;
  const isMultiple = Math.abs(remainder) < Number.EPSILON;
  if (isMultiple) {
    return true;
  } else {
    const message = i18n.t('validator.multipleOf', {
      field: translatedPropertyName || fieldName,
      value,
      multipleOf: multiple,
      ruleParams,
      ...rest,
    });
    return message;
  }
}, 'MultipleOf');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Number Rule
     *
     * Validates that the field under validation is a valid number. This rule checks
     * for numeric values and rejects non-numeric inputs. It accepts both integers
     * and floating-point numbers.
     *
     * @example
     * ```typescript
     * // Valid numeric values
     * await Validator.validate({
     *   value: 42,
     *   rules: ['Number']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 3.14,
     *   rules: ['Number']
     * }); // ✓ Valid (decimal)
     *
     * await Validator.validate({
     *   value: -123,
     *   rules: ['Number']
     * }); // ✓ Valid (negative)
     *
     * await Validator.validate({
     *   value: '456',
     *   rules: ['Number']
     * }); // ✓ Valid (numeric string)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'abc',
     *   rules: ['Number']
     * }); // ✗ Invalid (non-numeric string)
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['Number']
     * }); // ✗ Invalid (null)
     *
     * await Validator.validate({
     *   value: {},
     *   rules: ['Number']
     * }); // ✗ Invalid (object)
     *
     * // Class validation
     * class Product {
     *   @IsNumber()
     *   price: number;
     *
     *   @IsNumber()
     *   quantity: number;
     * }
     * ```
     *
     * @returns true if valid number, rejecting with error message if invalid
     *
     * @public
     */
    Number: ValidatorRuleParams<[]>;

    /**
     * ### NumberLTE Rule
     *
     * Validates that the field under validation has a numeric value less than or equal to
     * a specified maximum value. This rule ensures that input values do not exceed
     * a defined upper limit.
     *
     * #### Parameters
     * - `max` - Maximum allowed value (inclusive)
     *
     * @example
     * ```typescript
     * // Age limit validation
     * await Validator.validate({
     *   value: 25,
     *   rules: [{NumberLTE: [120]}]
     * }); // ✓ Valid (age ≤ 120)
     *
     * await Validator.validate({
     *   value: 120,
     *   rules: [{NumberLTE: [120]}]
     * }); // ✓ Valid (exactly 120)
     *
     * // Quantity limit validation
     * await Validator.validate({
     *   value: 500,
     *   rules: [{NumberLTE: [1000]}]
     * }); // ✓ Valid (quantity ≤ 1000)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 150,
     *   rules: [{NumberLTE: [120]}]
     * }); // ✗ Invalid (age > 120)
     *
     * // Class validation
     * class Person {
     *   @IsNumberLTE(120)
     *   age: number; // Must be ≤ 120 years
     * }
     *
     * class Order {
     *   @IsNumberLTE(1000)
     *   quantity: number; // Maximum 1000 units
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the maximum value
     * @returns true if value ≤ max, rejecting with error message if value > max
     *
     *
     * @public
     */
    NumberLTE: ValidatorRuleParams<[number]>;

    /**
     * ### NumberLT Rule
     *
     * Validates that the field under validation has a numeric value strictly less than
     * a specified maximum value. This rule ensures that input values stay below
     * a defined upper limit (exclusive).
     *
     * #### Parameters
     * - `max` - Maximum allowed value (exclusive)
     *
     * @example
     * ```typescript
     * // Age limit validation (must be under 18 for minors)
     * await Validator.validate({
     *   value: 17,
     *   rules: [{NumberLT: [18]}]
     * }); // ✓ Valid (age < 18)
     *
     * await Validator.validate({
     *   value: 17.9,
     *   rules: [{NumberLT: [18]}]
     * }); // ✓ Valid (still < 18)
     *
     * // Discount limit validation
     * await Validator.validate({
     *   value: 49.99,
     *   rules: [{NumberLT: [50]}]
     * }); // ✓ Valid (discount < 50%)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 18,
     *   rules: [{NumberLT: [18]}]
     * }); // ✗ Invalid (18 is not < 18)
     *
     * await Validator.validate({
     *   value: 25,
     *   rules: [{NumberLT: [18]}]
     * }); // ✗ Invalid (25 > 18)
     *
     * // Class validation
     * class Minor {
     *   @IsNumberLT(18)
     *   age: number; // Must be < 18 years
     * }
     *
     * class Discount {
     *   @IsNumberLT(50)
     *   percentage: number; // Must be < 50%
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the exclusive maximum value
     * @returns true if value < max, rejecting with error message if value ≥ max
     *
     *
     * @public
     */
    NumberLT: ValidatorRuleParams<[number]>;

    /**
     * ### NumberGTE Rule
     *
     * Validates that the field under validation has a numeric value greater than or equal to
     * a specified minimum value. This rule ensures that input values meet or exceed
     * a defined lower limit (inclusive).
     *
     * #### Parameters
     * - `min` - Minimum allowed value (inclusive)
     *
     * @example
     * ```typescript
     * // Age requirement validation (must be 18 or older)
     * await Validator.validate({
     *   value: 18,
     *   rules: [{NumberGTE: [18]}]
     * }); // ✓ Valid (age ≥ 18)
     *
     * await Validator.validate({
     *   value: 25,
     *   rules: [{NumberGTE: [18]}]
     * }); // ✓ Valid (age > 18)
     *
     * // Minimum balance validation
     * await Validator.validate({
     *   value: 100.00,
     *   rules: [{NumberGTE: [50.00]}]
     * }); // ✓ Valid (balance ≥ $50)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 17,
     *   rules: [{NumberGTE: [18]}]
     * }); // ✗ Invalid (17 < 18)
     *
     * await Validator.validate({
     *   value: 17.9,
     *   rules: [{NumberGTE: [18]}]
     * }); // ✗ Invalid (17.9 < 18)
     *
     * // Class validation
     * class Adult {
     *   @IsNumberGTE(18)
     *   age: number; // Must be ≥ 18 years
     * }
     *
     * class Account {
     *   @IsNumberGTE(0)
     *   balance: number; // Must be ≥ $0
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the inclusive minimum value
     * @returns true if value ≥ min, rejecting with error message if value < min
     *
     *
     * @public
     */
    NumberGTE: ValidatorRuleParams<[number]>;

    /**
     * ### NumberGT Rule
     *
     * Validates that the field under validation has a numeric value strictly greater than
     * a specified minimum value. This rule ensures that input values exceed
     * a defined lower limit (exclusive).
     *
     * #### Parameters
     * - `min` - Minimum allowed value (exclusive)
     *
     * @example
     * ```typescript
     * // Age requirement validation (must be over 18)
     * await Validator.validate({
     *   value: 19,
     *   rules: [{NumberGT: [18]}]
     * }); // ✓ Valid (age > 18)
     *
     * await Validator.validate({
     *   value: 18.1,
     *   rules: [{NumberGT: [18]}]
     * }); // ✓ Valid (age > 18)
     *
     * // Minimum purchase validation
     * await Validator.validate({
     *   value: 100.01,
     *   rules: [{NumberGT: [100]}]
     * }); // ✓ Valid (amount > $100)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 18,
     *   rules: [{NumberGT: [18]}]
     * }); // ✗ Invalid (18 is not > 18)
     *
     * await Validator.validate({
     *   value: 15,
     *   rules: [{NumberGT: [18]}]
     * }); // ✗ Invalid (15 < 18)
     *
     * // Class validation
     * class Senior {
     *   @IsNumberGT(65)
     *   age: number; // Must be > 65 years
     * }
     *
     * class Premium {
     *   @IsNumberGT(1000)
     *   purchaseAmount: number; // Must be > $1000
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the exclusive minimum value
     * @returns true if value > min, rejecting with error message if value ≤ min
     *
     *
     * @public
     */
    NumberGT: ValidatorRuleParams<[number]>;

    /**
     * ### NumberEQ Rule
     *
     * Validates that the field under validation has a numeric value exactly equal to
     * a specified target value. This rule ensures that input values match
     * a precise numeric requirement.
     *
     * #### Parameters
     * - `target` - Exact value that the field must equal
     *
     * @example
     * ```typescript
     * // PIN code validation (must be exactly 1234)
     * await Validator.validate({
     *   value: 1234,
     *   rules: [{NumberEQ: [1234]}]
     * }); // ✓ Valid (exact match)
     *
     * // Magic number validation
     * await Validator.validate({
     *   value: 42,
     *   rules: [{NumberEQ: [42]}]
     * }); // ✓ Valid (exact match)
     *
     * // Version number validation
     * await Validator.validate({
     *   value: 1.0,
     *   rules: [{NumberEQ: [1.0]}]
     * }); // ✓ Valid (exact match)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 1235,
     *   rules: [{NumberEQ: [1234]}]
     * }); // ✗ Invalid (not equal)
     *
     * await Validator.validate({
     *   value: 41.9,
     *   rules: [{NumberEQ: [42]}]
     * }); // ✗ Invalid (not equal)
     *
     * // Class validation
     * class AccessCode {
     *   @IsNumberEQ(1234)
     *   pinCode: number; // Must be exactly 1234
     * }
     *
     * class Version {
     *   @IsNumberEQ(1.0)
     *   versionNumber: number; // Must be exactly 1.0
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the exact target value
     * @returns true if value === target, rejecting with error message if value !== target
     *
     *
     * @public
     */
    NumberEQ: ValidatorRuleParams<[number]>;

    /**
     * ### NumberNE Rule
     *
     * Validates that the field under validation has a numeric value different from
     * a specified forbidden value. This rule ensures that input values do not match
     * a particular number that should be avoided.
     *
     * #### Parameters
     * - `forbidden` - Value that the field must not equal
     *
     * @example
     * ```typescript
     * // Reserved number validation (cannot be 0)
     * await Validator.validate({
     *   value: 5,
     *   rules: [{NumberNE: [0]}]
     * }); // ✓ Valid (not 0)
     *
     * await Validator.validate({
     *   value: -1,
     *   rules: [{NumberNE: [0]}]
     * }); // ✓ Valid (not 0)
     *
     * // Forbidden ID validation
     * await Validator.validate({
     *   value: 123,
     *   rules: [{NumberNE: [999]}]
     * }); // ✓ Valid (not 999)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 0,
     *   rules: [{NumberNE: [0]}]
     * }); // ✗ Invalid (equals forbidden value)
     *
     * await Validator.validate({
     *   value: 999,
     *   rules: [{NumberNE: [999]}]
     * }); // ✗ Invalid (equals forbidden value)
     *
     * // Class validation
     * class User {
     *   @IsNumberNE(0)
     *   userId: number; // Cannot be 0 (reserved)
     * }
     *
     * class Product {
     *   @IsNumberNE(999)
     *   sku: number; // Cannot be 999 (test value)
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the forbidden value
     * @returns true if value !== forbidden, rejecting with error message if value === forbidden
     *
     *
     * @public
     */
    NumberNE: ValidatorRuleParams<[number]>;

    /**
     * ### NumberBetween Rule (Numeric)
     *
     * Validates that the field under validation has a numeric value between the
     * given minimum and maximum values (inclusive).
     *
     * #### Parameters
     * - `min` - Minimum value (inclusive)
     * - `max` - Maximum value (inclusive)
     *
     * @example
     * ```typescript
     * // Age validation
     * await Validator.validate({
     *   value: 25,
     *   rules: [{NumberBetween:[18,65]}]
     * }); // ✓ Valid
     *
     * // Price range validation
     * await Validator.validate({
     *   value: 99.99,
     *   rules: [{NumberBetween:[10.00,999.99]}]
     * }); // ✓ Valid
     *
     * // Percentage validation
     * await Validator.validate({
     *   value: 85,
     *   rules: [{NumberBetween:[0,100]}]
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 17,
     *   rules: [{NumberBetween:[18,65]}]
     * }); // ✗ Invalid (below minimum)
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing [min, max] values
     * @returns true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    NumberBetween: ValidatorRuleParams<[min: number, max: number]>;

    /**
     * ### DecimalPlaces Rule
     *
     * Validates that the field under validation is numeric and contains the
     * specified number of decimal places.
     *
     * #### Parameters
     * - `places` - Exact number of decimal places required
     * - `min,max` (optional) - Range of decimal places allowed
     *
     * @example
     * ```typescript
     * // Exact decimal places
     * await Validator.validate({
     *   value: 99.99,
     *   rules: [{DecimalPlaces: [2]}]
     * }); // ✓ Valid (exactly 2 decimal places)
     *
     * await Validator.validate({
     *   value: 123.456,
     *   rules: [{DecimalPlaces: [3]}]
     * }); // ✓ Valid (exactly 3 decimal places)
     *
     * // Range of decimal places
     * await Validator.validate({
     *   value: 99.9,
     *   rules: [{DecimalPlaces: [1, 3]}]
     * }); // ✓ Valid (1-3 decimal places)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 99.999,
     *   rules: [{DecimalPlaces: [2]}]
     * }); // ✗ Invalid (3 places, expected 2)
     *
     * await Validator.validate({
     *   value: 99,
     *   rules: [{DecimalPlaces: [2]}]
     * }); // ✗ Invalid (0 places, expected 2)
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array with decimal places specification
     * @returns true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    DecimalPlaces: ValidatorRuleParams<
      [minDecimalPlaces: number, maxDecimalPlaces?: number]
    >;

    /**
     * ### Integer Rule
     *
     * Validates that the field under validation is an Integer. This rule does not
     * verify that the input is of the "Integer" variable type, only that the input
     * is a string or numeric value that contains an Integer.
     *
     * @example
     * ```typescript
     * // Valid integers
     * await Validator.validate({
     *   value: 42,
     *   rules: ['Integer']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '123',
     *   rules: ['Integer']
     * }); // ✓ Valid (numeric string)
     *
     * await Validator.validate({
     *   value: -456,
     *   rules: ['Integer']
     * }); // ✓ Valid (negative Integer)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 12.34,
     *   rules: ['Integer']
     * }); // ✗ Invalid (has decimal places)
     *
     * await Validator.validate({
     *   value: 'abc',
     *   rules: ['Integer']
     * }); // ✗ Invalid (not numeric)
     * ```
     *
     * @returns true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    Integer: ValidatorRuleParams<[]>;

    /**
     * ### Even Number Rule
     *
     * Validates that the field under validation is an integer and even (divisible by 2).
     * Non-numeric inputs or non-integer numbers will be rejected with precise messages.
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({ value: 2, rules: ['EvenNumber'] }); // ✓
     * await Validator.validate({ value: '8', rules: ['EvenNumber'] }); // ✓ numeric string
     * await Validator.validate({ value: 0, rules: ['EvenNumber'] }); // ✓ zero is even
     *
     * // Invalid examples
     * await Validator.validate({ value: 3, rules: ['EvenNumber'] }); // ✗ odd
     * await Validator.validate({ value: 2.5, rules: ['EvenNumber'] }); // ✗ not integer
     * await Validator.validate({ value: 'abc', rules: ['EvenNumber'] }); // ✗ not numeric
     * ```
     *
     * @returns true if valid, rejecting with error message if invalid
     *
     * @public
     */
    EvenNumber: ValidatorRuleParams<[]>;

    /**
     * ### Multiple Of Rule
     *
     * Validates that the field under validation is a multiple of the specified value.
     * This is useful for ensuring values conform to specific increments.
     *
     * #### Parameters
     * - `multiple` - The value that the field must be a multiple of
     *
     * @example
     * ```typescript
     * // Multiple validation
     * await Validator.validate({
     *   value: 15,
     *   rules: [{MultipleOf: [5]}]
     * }); // ✓ Valid (15 is multiple of 5)
     *
     * await Validator.validate({
     *   value: 0.25,
     *   rules: [{MultipleOf: [0.05]}]
     * }); // ✓ Valid (price increment validation)
     *
     * // Time interval validation
     * await Validator.validate({
     *   value: 30,
     *   rules: [{MultipleOf: [15]}]
     * }); // ✓ Valid (15-minute intervals)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 17,
     *   rules: [{MultipleOf: [5]}]
     * }); // ✗ Invalid (not a multiple of 5)
     *
     * // Class validation
     * class Pricing {
     *   @IsMultipleOf([0.01])
     *   price: number; // Must be in cent increments
     *
     *   @IsMultipleOf([5])
     *   discountPercent: number; // 5% increments
     *
     *   @IsMultipleOf([15])
     *   appointmentDuration: number; // 15-minute slots
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the multiple value
     * @returns true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    MultipleOf: ValidatorRuleParams<[number]>;

    /**
     * ### Odd Number Rule
     *
     * Validates that the field under validation is an integer and odd (not divisible by 2).
     * Non-numeric inputs or non-integer numbers will be rejected with precise messages.
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({ value: 1, rules: ['OddNumber'] }); // ✓
     * await Validator.validate({ value: '7', rules: ['OddNumber'] }); // ✓ numeric string
     * await Validator.validate({ value: -5, rules: ['OddNumber'] }); // ✓ negative odd
     *
     * // Invalid examples
     * await Validator.validate({ value: 4, rules: ['OddNumber'] }); // ✗ even
     * await Validator.validate({ value: 3.14, rules: ['OddNumber'] }); // ✗ not integer
     * await Validator.validate({ value: 'abc', rules: ['OddNumber'] }); // ✗ not numeric
     * ```
     *
     * @returns true if valid, rejecting with error message if invalid
     *
     * @public
     */
    OddNumber: ValidatorRuleParams<[]>;
  }
}
