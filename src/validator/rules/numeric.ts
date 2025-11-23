import { defaultStr } from "@utils/defaultStr";
import { isNumber } from "@utils/isNumber";
import { IValidatorResult, IValidatorValidateOptions } from "../types";
import { Validator } from "../validator";
import { toNumber } from "./utils";

/**
 * @function compareNumer
 *
 * Compares a numeric value against a specified value using a comparison function.
 * This function returns a promise that resolves if the comparison is valid and rejects with an error message if it is not.
 *
 * ### Parameters:
 * - **compare**: `(value: any, toCompare: any) => boolean` - A comparison function that defines the comparison logic.
 * - **message**: `string` - The error message to return if the validation fails.
 * - **options**: `IValidatorValidateOptions` - An object containing the value to validate and any rule parameters.
 *
 * ### Return Value:
 * - `IValidatorResult`: A promise that resolves to `true` if the comparison is valid, or rejects with an error message if it is not.
 *
 * ### Example Usage:
 * ```typescript
 * compareNumer((value, toCompare) => value < toCompare, "Value must be less than", { value: 5, ruleParams: [10] })
 *     .then(result => console.log(result)) // Output: true
 *     .catch(error => console.error(error)); // Output: "Value must be less than 10"
 * ```
 */
function compareNumer(compare: (value: any, toCompare: any) => boolean, translateKey: string, { value, ruleParams, i18n, ...rest }: IValidatorValidateOptions): IValidatorResult {
  ruleParams = Array.isArray(ruleParams) ? ruleParams : [];
  const rParams = ruleParams ? ruleParams : [];
  translateKey = defaultStr(translateKey);
  const message = i18n.t(translateKey, { ...rest, value, ruleParams });
  const nVal = toNumber(value);
  value = typeof value === "number" ? value : !isNaN(nVal) ? nVal : NaN;
  const toCompareN = toNumber(rParams[0]);
  const toCompare = typeof rParams[0] === "number" ? rParams[0] : isNumber(toCompareN) ? toCompareN : NaN;
  return new Promise((resolve, reject) => {
    if (isNaN(value) || rParams[0] === undefined) {
      return resolve(message);
    }
    if (isNaN(toCompare)) {
      return reject(message);
    }
    if (compare(value, toCompare)) {
      return resolve(true);
    }
    reject(message);
  });
}

function numberLessThanOrEquals(options: IValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value <= toCompare;
    },
    "validator.numberLessThanOrEquals",
    options
  );
}

Validator.registerRule("NumberLessThanOrEqual", numberLessThanOrEquals);
/**
 * @decorator IsNumberLessThanOrEqual
 *
 * Validator rule that checks if a number is less than or equal to a specified value.
 *
 * ### Example Usage:
 * ```typescript
 *  class MyClass {
 *      @IsNumberLessThanOrEqual([5])
 *      myNumber: number;
 *  }
 * ```
 */
export const IsNumberLessThanOrEqual = Validator.buildRuleDecorator<[param: number]>(numberLessThanOrEquals);

function numberLessThan(options: IValidatorValidateOptions) {
  return compareNumer(
    (value, toCompare) => {
      return value < toCompare;
    },
    "validator.numberLessThan",
    options
  );
}
Validator.registerRule("NumberLessThan", numberLessThan);

/**
 * @decorator IsNumberLessThan
 *
 * Validator rule that checks if a given number is less than a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `IValidatorResult`: Resolves to `true` if the value is less than the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberLessThan([10])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input is strictly less than a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberLessThan = Validator.buildRuleDecorator<[param: number]>(numberLessThan);

function numberGreaterThanOrEquals(options: IValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value >= toCompare;
    },
    "validator.numberGreaterThanOrEquals",
    options
  );
}
Validator.registerRule("NumberGreaterThanOrEqual", numberGreaterThanOrEquals);

/**
 * @decorator IsNumberGreaterThanOrEqual
 *
 * Validator rule that checks if a given number is greater than or equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `IValidatorResult`: Resolves to `true` if the value is greater than or equal to the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberGreaterThanOrEqual([5])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input meets or exceeds a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberGreaterThanOrEqual = Validator.buildRuleDecorator<[param: number]>(numberGreaterThanOrEquals);

function numberGreaterThan(options: IValidatorValidateOptions) {
  return compareNumer(
    (value, toCompare) => {
      return value > toCompare;
    },
    "validator.numberGreaterThan",
    options
  );
}
Validator.registerRule("NumberGreaterThan", numberGreaterThan);

/**
 * @decorator IsNumberGreaterThan
 *
 * Validator rule that checks if a given number is greater than a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `IValidatorResult`: Resolves to `true` if the value is greater than the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberGreaterThan([10])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input exceeds a specified limit.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberGreaterThan = Validator.buildRuleDecorator<[param: number]>(numberGreaterThan);

function numberEqualsTo(options: IValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value === toCompare;
    },
    "validator.numberEquals",
    options
  );
}
Validator.registerRule("NumberEqual", numberEqualsTo);

/**
 * @decorator  IsNumberEqual
 *
 * Validator rule that checks if a given number is equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Parameters:
 * - **options**: `IValidatorValidateOptions` - An object containing:
 *   - `value`: The number to validate.
 *   - `ruleParams`: An array where the first element is the value to compare against.
 *
 * ### Return Value:
 * - `IValidatorResult`: Resolves to `true` if the value is equal to the specified comparison value,
 *   otherwise rejects with an error message indicating the validation failure.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @ IsNumberEqual([10])
 *     myNumber: number;
 * }
 * ```
 *
 * ### Notes:
 * - This rule is useful for scenarios where you need to ensure that a numeric input matches a specified value exactly.
 * - The error message can be customized by modifying the second parameter of the `compareNumer` function.
 */
export const IsNumberEqual = Validator.buildRuleDecorator<[param: number]>(numberEqualsTo);

function numberIsDifferentFromTo(options: IValidatorValidateOptions<[number]>) {
  return compareNumer(
    (value, toCompare) => {
      return value !== toCompare;
    },
    "validator.numberIsDifferentFrom",
    options
  );
}
Validator.registerRule("NumberIsDifferentFrom", numberIsDifferentFromTo);

/**
 * @decorator IsNumberDifferentFrom
 *
 * Validator rule that checks if a given number is not equal to a specified value.
 * This rule utilizes the `compareNumer` function to perform the comparison and return the result.
 *
 * ### Example Usage:
 * ```typescript
 * class MyClass {
 *     @IsNumberDifferentFrom([10])
 *     myNumber: number;
 * }
 * ```
 */
export const IsNumberDifferentFrom = Validator.buildRuleDecorator<[param: number]>(numberIsDifferentFromTo);

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
 *   @IsNumber
 *   price: number;
 *
 *   @IsNumber
 *   quantity: number;
 *
 *   @IsRequired
 *   @IsNumber
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
 * @since 1.0.0
 * @see {@link IsRequired} - Often used together
 * @public
 */
export const IsNumber = Validator.buildPropertyDecorator(["Number"]);

Validator.registerRule("Number", function Number(options) {
  const { value, i18n } = options;
  return typeof value === "number" || i18n.t("validator.isNumber", options);
});

function NumberBetween({ value, ruleParams, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions<[number, number]>): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (!ruleParams || ruleParams.length < 2) {
      const message = i18n.t("validator.invalidRuleParams", {
        rule: "NumberBetween",
        field: translatedPropertyName || fieldName,
        ruleParams,
        ...rest,
      });
      return reject(message);
    }

    const numericValue = toNumber(value);
    if (isNaN(numericValue)) {
      const message = i18n.t("validator.numeric", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    const min = toNumber(ruleParams[0]);
    const max = toNumber(ruleParams[1]);
    if (isNaN(min) || isNaN(max)) {
      const message = i18n.t("validator.invalidRuleParams", {
        rule: "NumberBetween",
        field: translatedPropertyName || fieldName,
        ruleParams,
        ...rest,
      });
      return reject(message);
    }
    if (numericValue >= min && numericValue <= max) {
      resolve(true);
    } else {
      const message = i18n.t("validator.numberBetween", {
        field: translatedPropertyName || fieldName,
        value: numericValue,
        min,
        max,
        ...rest,
      });
      reject(message);
    }
  });
}
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
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsNumberBetween = Validator.buildRuleDecorator<[min: number, max: number]>(NumberBetween);
Validator.registerRule("NumberBetween", NumberBetween);

function DecimalPlaces({ value, ruleParams, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions<[minDecimalPlaces: number, maxDecimalPlaces?: number]>): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (!ruleParams || !ruleParams.length) {
      const message = i18n.t("validator.invalidRuleParams", {
        rule: "DecimalPlaces",
        field: translatedPropertyName || fieldName,
        ruleParams,
        ...rest,
      });
      return reject(message);
    }

    const numericValue = toNumber(value);
    if (isNaN(numericValue)) {
      const message = i18n.t("validator.number", {
        rule: "DecimalPlaces",
        field: translatedPropertyName || fieldName,
        value,
        ruleParams,
        ...rest,
      });
      return reject(message);
    }

    // Get decimal places from the number
    const valueStr = String(value);
    const decimalIndex = valueStr.indexOf(".");
    const actualDecimalPlaces = decimalIndex === -1 ? 0 : valueStr.length - decimalIndex - 1;

    let isValid = false;

    if (ruleParams.length === 1) {
      // Exact decimal places
      const requiredPlaces = toNumber(ruleParams[0]);
      isValid = actualDecimalPlaces === requiredPlaces;
    } else if (ruleParams.length === 2) {
      // Range of decimal places
      const minPlaces = toNumber(ruleParams[0]);
      const maxPlaces = toNumber(ruleParams[1]);
      isValid = !isNaN(minPlaces) && !isNaN(maxPlaces) && actualDecimalPlaces >= minPlaces && actualDecimalPlaces <= maxPlaces;
    }
    if (isValid) {
      resolve(true);
    } else {
      const message = i18n.t("validator.decimalPlaces", {
        field: translatedPropertyName || fieldName,
        value,
        places: ruleParams.join("-"),
        actualPlaces: actualDecimalPlaces,
        ...rest,
      });
      reject(message);
    }
  });
}

Validator.registerRule("DecimalPlaces", DecimalPlaces);

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
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const HasDecimalPlaces = Validator.buildRuleDecorator<[minDecimalPlaces: number, maxDecimalPlaces?: number]>(DecimalPlaces);

function _Integer({ value, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    const numericValue = toNumber(value);
    if (isNaN(numericValue) || !Number.isInteger(numericValue)) {
      const message = i18n.t("validator.integer", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    } else {
      resolve(true);
    }
  });
}

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
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsInteger = Validator.buildPropertyDecorator(["Integer"]);
Validator.registerRule("Integer", _Integer);

/**
 * ### EvenNumber Rule
 *
 * Validates that the field under validation is an integer and even (divisible by 2).
 * Non-numeric inputs or non-integer numbers fail with appropriate messages.
 *
 * @example
 * ```typescript
 * // Class validation with decorator
 * class Invoice {
 *   @IsEvenNumber
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
 * @param options - Validation options with value and i18n context
 * @returns Promise resolving to `true` when value is an even integer,
 *          rejecting with a localized error message otherwise
 *
 * @since 1.22.0
 * @public
 */
function EvenNumber({ value, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions): IValidatorResult {
  const numericValue = toNumber(value);
  if (isNaN(numericValue)) {
    const message = i18n.t("validator.number", {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (!Number.isInteger(numericValue)) {
    const message = i18n.t("validator.integer", {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (numericValue % 2 === 0) {
    return true;
  } else {
    return i18n.t("validator.evenNumber", {
      field: translatedPropertyName || fieldName,
      value: numericValue,
      ...rest,
    });
  }
}
Validator.registerRule("EvenNumber", EvenNumber);

/**
 * ### IsEvenNumber Decorator
 *
 * Property decorator that enforces the `EvenNumber` rule.
 * Use on numeric fields that must be even integers.
 *
 * @example
 * ```typescript
 * class Model {
 *   @IsEvenNumber
 *   evenId: number;
 * }
 * ```
 *
 * @public
 */
export const IsEvenNumber = Validator.buildPropertyDecorator(["EvenNumber"]);

/**
 * ### OddNumber Rule
 *
 * Validates that the field under validation is an integer and odd (not divisible by 2).
 * Non-numeric inputs or non-integer numbers fail with appropriate messages.
 *
 * @example
 * ```typescript
 * // Class validation with decorator
 * class Invoice {
 *   @IsOddNumber
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
 * @param options - Validation options with value and i18n context
 * @returns Promise resolving to `true` when value is an odd integer,
 *          rejecting with a localized error message otherwise
 *
 * @since 1.22.0
 * @public
 */
function OddNumber({ value, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions): IValidatorResult {
  const numericValue = toNumber(value);
  if (isNaN(numericValue)) {
    const message = i18n.t("validator.number", {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (!Number.isInteger(numericValue)) {
    const message = i18n.t("validator.integer", {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  if (numericValue % 2 !== 0) {
    return true;
  } else {
    return i18n.t("validator.oddNumber", {
      field: translatedPropertyName || fieldName,
      value: numericValue,
      ...rest,
    });
  }
}
Validator.registerRule("OddNumber", OddNumber);

/**
 * ### IsOddNumber Decorator
 *
 * Property decorator that enforces the `OddNumber` rule.
 * Use on numeric fields that must be odd integers.
 *
 * @example
 * ```typescript
 * class Model {
 *   @IsOddNumber
 *   oddId: number;
 * }
 * ```
 *
 * @public
 */
export const IsOddNumber = Validator.buildPropertyDecorator(["OddNumber"]);

function MultipleOf({ value, ruleParams, fieldName, translatedPropertyName, i18n, ...rest }: IValidatorValidateOptions<[number]>): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (!ruleParams || !ruleParams.length) {
      const message = i18n.t("validator.invalidRuleParams", {
        rule: "MultipleOf",
        field: translatedPropertyName || fieldName,
        ...rest,
        ruleParams,
      });
      return reject(message);
    }

    const numericValue = toNumber(value);
    if (isNaN(numericValue)) {
      const message = i18n.t("validator.number", {
        field: translatedPropertyName || fieldName,
        value,
        ruleParams,
        ...rest,
      });
      return reject(message);
    }

    const multiple = toNumber(ruleParams[0]);
    if (isNaN(multiple) || (multiple === 0 && String(ruleParams[0]).trim() !== "0")) {
      const message = i18n.t("validator.invalidRuleParams", {
        rule: "MultipleOf",
        ruleParams,
        field: translatedPropertyName || fieldName,
        ...rest,
      });
      return reject(message);
    }

    // Check if the value is a multiple of the specified number
    const remainder = numericValue % multiple;
    const isMultiple = Math.abs(remainder) < Number.EPSILON;
    if (isMultiple) {
      resolve(true);
    } else {
      const message = i18n.t("validator.multipleOf", {
        field: translatedPropertyName || fieldName,
        value: numericValue,
        multiple,
        ruleParams,
        ...rest,
      });
      reject(message);
    }
  });
}
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
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsMultipleOf = Validator.buildRuleDecorator<[multiple: number]>(MultipleOf);

declare module "../types" {
  export interface IValidatorRulesMap<Context = unknown> {
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
     *   rules: ['NumberBetween[18,65]']
     * }); // ✓ Valid
     *
     * // Price range validation
     * await Validator.validate({
     *   value: 99.99,
     *   rules: ['NumberBetween[10.00,999.99]']
     * }); // ✓ Valid
     *
     * // Percentage validation
     * await Validator.validate({
     *   value: 85,
     *   rules: ['NumberBetween[0,100']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 17,
     *   rules: ['NumberBetween[18,65]']
     * }); // ✗ Invalid (below minimum)
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing [min, max] values
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    NumberBetween: IValidatorRuleParams<[min: number, max: number], Context>;

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
     *   rules: ['DecimalPlaces[2]']
     * }); // ✓ Valid (exactly 2 decimal places)
     *
     * await Validator.validate({
     *   value: 123.456,
     *   rules: ['DecimalPlaces[3]']
     * }); // ✓ Valid (exactly 3 decimal places)
     *
     * // Range of decimal places
     * await Validator.validate({
     *   value: 99.9,
     *   rules: ['DecimalPlaces[1,3]']
     * }); // ✓ Valid (1-3 decimal places)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 99.999,
     *   rules: ['DecimalPlaces[2]']
     * }); // ✗ Invalid (3 places, expected 2)
     *
     * await Validator.validate({
     *   value: 99,
     *   rules: ['DecimalPlaces[2']
     * }); // ✗ Invalid (0 places, expected 2)
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array with decimal places specification
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    DecimalPlaces: IValidatorRuleParams<[minDecimalPlaces: number, maxDecimalPlaces?: number], Context>;

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
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    Integer: IValidatorRuleParams<[], Context>;

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
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     * @since 1.22.0
     * @public
     */
    EvenNumber: IValidatorRuleParams<[], Context>;

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
     *   rules: ['MultipleOf[5]']
     * }); // ✓ Valid (15 is multiple of 5)
     *
     * await Validator.validate({
     *   value: 0.25,
     *   rules: ['MultipleOf[0.05]']
     * }); // ✓ Valid (price increment validation)
     *
     * // Time interval validation
     * await Validator.validate({
     *   value: 30,
     *   rules: ['MultipleOf[15]']
     * }); // ✓ Valid (15-minute intervals)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 17,
     *   rules: ['MultipleOf[5]']
     * }); // ✗ Invalid (not a multiple of 5)
     *
     * // Class validation
     * class Pricing {
     *   @MultipleOf([0.01])
     *   price: number; // Must be in cent increments
     *
     *   @MultipleOf([5])
     *   discountPercent: number; // 5% increments
     *
     *   @MultipleOf([15])
     *   appointmentDuration: number; // 15-minute slots
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the multiple value
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    MultipleOf: IValidatorRuleParams<[number], Context>;

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
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     * @since 1.22.0
     * @public
     */
    OddNumber: IValidatorRuleParams<[], Context>;
  }
}
