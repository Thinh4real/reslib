/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ValidatorRuleParams } from '../types';
import { ValidatorRuleParamTypes, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';

/**
 * ### Array Rule
 *
 * Validates that the field under validation is an array.
 *
 * @example
 * ```typescript
 * // Class validation
 * class DataCollection {
 *   @IsRequired()
 *   @IsArray
 *   items: any[];
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsArray = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Array']
>(function IsArray({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): boolean | string {
  if (Array.isArray(value)) {
    return true;
  } else {
    const message = i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      fieldName,
      translatedPropertyName,
      value,
      ...rest,
    });
    return message;
  }
}, 'Array');

/**
 * ### ArrayMinLength Rule
 *
 * Validates that the array has at least the specified minimum length.
 *
 * #### Parameters
 * - Minimum length (number)
 *
 * @example
 * ```typescript
 * // Class validation
 * class ShoppingCart {
 *   @ArrayMinLength(1)
 *   items: Product[];
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing minimum length
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayMinLength = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayMinLength']
>(function ArrayMinLength({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<number[]>): boolean | string {
  if (!Array.isArray(value)) {
    const message = i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const minLength = Number(ruleParams?.[0]);
  if (isNaN(minLength) || minLength < 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'ArrayMinLength',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (value.length >= minLength) {
    return true;
  } else {
    const message = i18n.t('validator.arrayMinLength', {
      field: translatedPropertyName || fieldName,
      value,
      minLength,
      actualLength: value.length,
      ...rest,
    });
    return message;
  }
});

/**
 * ### ArrayMaxLength Rule
 *
 * Validates that the array has at most the specified maximum length.
 *
 * #### Parameters
 * - Maximum length (number)
 *
 * @example
 * ```typescript
 * // Class validation
 * class LimitedList {
 *   @ArrayMaxLength(10)
 *   tags: string[];
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing maximum length
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayMaxLength = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayMaxLength']
>(function ArrayMaxLength({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<number[]>): boolean | string {
  if (!Array.isArray(value)) {
    const message = i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const maxLength = Number(ruleParams?.[0]);
  if (isNaN(maxLength) || maxLength < 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'ArrayMaxLength',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (value.length <= maxLength) {
    return true;
  } else {
    const message = i18n.t('validator.arrayMaxLength', {
      field: translatedPropertyName || fieldName,
      value,
      maxLength,
      actualLength: value.length,
      ...rest,
    });
    return message;
  }
});

/**
 * ### ArrayLength Rule
 *
 * Validates that the array has exactly the specified length.
 *
 * #### Parameters
 * - Exact length (number)
 *
 * @example
 * ```typescript
 * // Class validation
 * class FixedSizeArray {
 *   @ArrayLength(3)
 *   coordinates: number[];
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing exact length
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayLength = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayLength']
>(function ArrayLength({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<number[]>): boolean | string {
  if (!Array.isArray(value)) {
    const message = i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const exactLength = Number(ruleParams?.[0]);
  if (isNaN(exactLength) || exactLength < 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'ArrayLength',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (value.length === exactLength) {
    return true;
  } else {
    const message = i18n.t('validator.arrayLength', {
      field: translatedPropertyName || fieldName,
      value,
      length: exactLength,
      actualLength: value.length,
      ...rest,
    });
    return message;
  }
});

/**
 * ### ArrayContains Rule
 *
 * Validates that the array contains all of the specified values.
 *
 * #### Parameters
 * - Values that must be present in the array
 *
 * @example
 * ```typescript
 * // Class validation
 * class Permissions {
 *   @ArrayContains(['read'])
 *   userPermissions: string[];
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array of values that must be contained
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayContains = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayContains']
>(function ArrayContains({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ValidatorValidateOptions<any[]>): boolean | string {
  if (!Array.isArray(value)) {
    const message = i18n.t('validator.arrayContains', {
      field: translatedPropertyName || fieldName,
      value,
      requiredValues: ruleParams?.join(', ') || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || ruleParams.length === 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'ArrayContains',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const containsAll = ruleParams.every((requiredValue) =>
    value.some((item) => {
      // Deep equality check for objects/arrays, simple equality for primitives
      if (typeof requiredValue === 'object' && requiredValue !== null) {
        return JSON.stringify(item) === JSON.stringify(requiredValue);
      }
      return item === requiredValue;
    })
  );

  if (containsAll) {
    return true;
  } else {
    const message = i18n.t('validator.arrayContains', {
      field: translatedPropertyName || fieldName,
      value,
      requiredValues: ruleParams.map((v) => JSON.stringify(v)).join(', '),
      ...rest,
    });
    return message;
  }
});

/**
 * ### ArrayUnique Rule
 *
 * Validates that all elements in the array are unique.
 *
 * @example
 * ```typescript
 * // Class validation
 * class UniqueTags {
 *   @ArrayUnique
 *   tags: string[];
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayUnique = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayUnique']
>(function ArrayUnique({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): boolean | string {
  if (!Array.isArray(value)) {
    const message = i18n.t('validator.arrayUnique', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  try {
    const uniqueValues = new Set(
      value.map((item) => {
        // Convert objects/arrays to JSON strings for comparison
        if (typeof item === 'object' && item !== null) {
          return JSON.stringify(item);
        }
        return item;
      })
    );

    if (uniqueValues.size === value.length) {
      return true;
    } else {
      const message = i18n.t('validator.arrayUnique', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return message;
    }
  } catch (error) {
    // JSON.stringify might fail for circular references
    const message = i18n.t('validator.arrayUnique', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'ArrayUnique');

/**
 * ### ArrayAllStrings Rule
 *
 * Validates that all elements in the array are strings.
 * The check is strict — only primitive `string` values pass; other types fail.
 *
 * @example
 * ```typescript
 * // Programmatic API
 * await Validator.validate({ value: ["a", "b"], rules: ["ArrayAllStrings"] }); // ✓ Valid
 * await Validator.validate({ value: ["a", 1], rules: ["ArrayAllStrings"] }); // ✗ Invalid
 * await Validator.validate({ value: "not an array", rules: ["ArrayAllStrings"] }); // ✗ Invalid (not an array)
 *
 * // Class validation
 * class Tags {
 *   @ArrayAllStrings
 *   tags: string[];
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayAllStrings = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayAllStrings']
>(function ArrayAllStrings({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): boolean | string {
  if (!Array.isArray(value)) {
    return i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
  }

  const allStrings = value.every((item) => typeof item === 'string');
  if (allStrings) {
    return true;
  }

  const message = i18n.t('validator.arrayAllStrings', {
    field: translatedPropertyName || fieldName,
    value,
    ...rest,
  });
  return message;
}, 'ArrayAllStrings');

/**
 * ### ArrayAllNumbers Rule
 *
 * Validates that all elements in the array are numbers.
 * The check is strict — only primitive `number` values pass; `NaN` fails.
 *
 * @example
 * ```typescript
 * // Programmatic API
 * await Validator.validate({ value: [1, 2, 3], rules: ["ArrayAllNumbers"] }); // ✓ Valid
 * await Validator.validate({ value: [1, "2"], rules: ["ArrayAllNumbers"] }); // ✗ Invalid
 * await Validator.validate({ value: [1, NaN], rules: ["ArrayAllNumbers"] }); // ✗ Invalid (NaN)
 * await Validator.validate({ value: "not an array", rules: ["ArrayAllNumbers"] }); // ✗ Invalid (not an array)
 *
 * // Class validation
 * class Scores {
 *   @ArrayAllNumbers
 *   values: number[];
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const ArrayAllNumbers = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['ArrayAllNumbers']
>(function _ArrayAllNumbers({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): boolean | string {
  if (!Array.isArray(value)) {
    return i18n.t('validator.array', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
  }

  const allNumbers = value.every(
    (item) => typeof item === 'number' && !Number.isNaN(item)
  );
  if (allNumbers) {
    return true;
  }

  const message = i18n.t('validator.arrayAllNumbers', {
    field: translatedPropertyName || fieldName,
    value,
    ...rest,
  });
  return message;
}, 'ArrayAllNumbers');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Array Rule
     *
     * Validates that the field under validation is an array.
     *
     * @example
     * ```typescript
     * // Valid arrays
     * await Validator.validate({
     *   value: [1, 2, 3],
     *   rules: ['Array']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: [],
     *   rules: ['Array']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['Array']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['Array']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class DataCollection {
     *   @Required
     *   @Array
     *   items: any[];
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    Array: ValidatorRuleParams<[]>;

    /**
     * ### ArrayMinLength Rule
     *
     * Validates that the array has at least the specified minimum length.
     *
     * #### Parameters
     * - Minimum length (number)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: [1, 2, 3],
     *   rules: ['ArrayMinLength[2]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: ['a', 'b'],
     *   rules: ['ArrayMinLength[1]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: [1],
     *   rules: ['ArrayMinLength[2]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['ArrayMinLength[1]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class ShoppingCart {
     *   @ArrayMinLength(1)
     *   items: Product[];
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing minimum length
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayMinLength: ValidatorRuleParams<[minLength: number]>;

    /**
     * ### ArrayMaxLength Rule
     *
     * Validates that the array has at most the specified maximum length.
     *
     * #### Parameters
     * - Maximum length (number)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: [1, 2],
     *   rules: ['ArrayMaxLength[3]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: [],
     *   rules: ['ArrayMaxLength[10]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: [1, 2, 3, 4],
     *   rules: ['ArrayMaxLength[3]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['ArrayMaxLength[5]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class LimitedList {
     *   @ArrayMaxLength(10)
     *   tags: string[];
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing maximum length
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayMaxLength: ValidatorRuleParams<[maxLength: number]>;

    /**
     * ### ArrayLength Rule
     *
     * Validates that the array has exactly the specified length.
     *
     * #### Parameters
     * - Exact length (number)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: [1, 2, 3],
     *   rules: ['ArrayLength[3]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: ['x', 'y'],
     *   rules: ['ArrayLength[2]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: [1, 2],
     *   rules: ['ArrayLength[3]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: [1, 2, 3, 4],
     *   rules: ['ArrayLength[3]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['ArrayLength[2]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class FixedSizeArray {
     *   @ArrayLength(3)
     *   coordinates: number[];
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing exact length
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayLength: ValidatorRuleParams<[length: number]>;

    /**
     * ### ArrayContains Rule
     *
     * Validates that the array contains all of the specified values.
     *
     * #### Parameters
     * - Values that must be present in the array
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: ['read', 'write', 'delete'],
     *   rules: ['ArrayContains[read,write]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: [1, 2, 3, 4],
     *   rules: ['ArrayContains[2,3]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: ['read', 'write'],
     *   rules: ['ArrayContains[read,delete]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['ArrayContains[1]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Permissions {
     *   @ArrayContains(['read'])
     *   userPermissions: string[];
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array of values that must be contained
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ArrayContains: ValidatorRuleParams<any[]>;

    /**
     * ### ArrayUnique Rule
     *
     * Validates that all elements in the array are unique.
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: [1, 2, 3],
     *   rules: ['ArrayUnique']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: ['a', 'b', 'c'],
     *   rules: ['ArrayUnique']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: [1, 2, 2, 3],
     *   rules: ['ArrayUnique']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: ['a', 'b', 'a'],
     *   rules: ['ArrayUnique']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: "not an array",
     *   rules: ['ArrayUnique']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class UniqueTags {
     *   @ArrayUnique
     *   tags: string[];
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayUnique: ValidatorRuleParams<[]>;

    /**
     * ### ArrayAllStrings Rule
     *
     * Validates that all elements in the array are strings.
     *
     * @example
     * ```typescript
     * await Validator.validate({ value: ["a", "b"], rules: ["ArrayAllStrings"] }); // ✓ Valid
     * await Validator.validate({ value: ["a", 1], rules: ["ArrayAllStrings"] }); // ✗ Invalid
     * await Validator.validate({ value: "not an array", rules: ["ArrayAllStrings"] }); // ✗ Invalid
     *
     * class Tags {
     *   @ArrayAllStrings
     *   tags: string[];
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayAllStrings: ValidatorRuleParams<[]>;

    /**
     * ### ArrayAllNumbers Rule
     *
     * Validates that all elements in the array are numbers. `NaN` fails.
     *
     * @example
     * ```typescript
     * await Validator.validate({ value: [1, 2, 3], rules: ["ArrayAllNumbers"] }); // ✓ Valid
     * await Validator.validate({ value: [1, "2"], rules: ["ArrayAllNumbers"] }); // ✗ Invalid
     * await Validator.validate({ value: [1, NaN], rules: ["ArrayAllNumbers"] }); // ✗ Invalid
     * await Validator.validate({ value: "not an array", rules: ["ArrayAllNumbers"] }); // ✗ Invalid
     *
     * class Scores {
     *   @ArrayAllNumbers
     *   values: number[];
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    ArrayAllNumbers: ValidatorRuleParams<[]>;
  }
}
