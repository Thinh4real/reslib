/* eslint-disable @typescript-eslint/no-unused-vars */
import { areEquals } from '@utils/areEquals';
import type { ValidatorRuleParams } from '../types';
import { ValidatorRuleParamTypes } from '../types';
import { Validator } from '../validator';

type t = ValidatorRuleParams;

/**
 * ## IsArray Decorator
 *
 * Property decorator that validates a property value is an array.
 * This is a fundamental array validation decorator that ensures the value
 * is actually an array before applying other array-specific validations.
 *
 * ### Usage
 * ```typescript
 * class ProductList {
 *   @IsArray()
 *   products: Product[];
 * }
 * ```
 *
 * ### Validation Behavior
 * - **Passes**: When value is an array (including empty arrays)
 * - **Fails**: When value is not an array (null, undefined, object, string, number, etc.)
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must be an array"`
 * - I18n key: `"validator.array"`
 *
 * ### Related Decorators
 * - Often used as prerequisite for: `@ArrayMinLength`, `@ArrayMaxLength`, `@ArrayLength`, `@ArrayContains`, `@ArrayUnique`, `@ArrayAllStrings`, `@ArrayAllNumbers`
 *
 * @returns A property decorator function
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
}) {
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
 * ## ArrayMinLength Decorator
 *
 * Property decorator that validates an array has at least the specified minimum number of elements.
 * Ensures arrays meet minimum size requirements for business logic.
 *
 * ### Usage
 * ```typescript
 * class ShoppingCart {
 *   @IsArray()
 *   @ArrayMinLength(1)
 *   items: CartItem[];
 * }
 * ```
 *
 * ### Parameters
 * - `minLength: number` - The minimum number of elements required
 *
 * ### Validation Behavior
 * - **Passes**: When array length >= minimum length
 * - **Fails**: When array length < minimum length
 * - **Edge cases**: Empty arrays fail if minLength > 0
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must contain at least {minLength} items"`
 * - I18n key: `"validator.arrayMinLength"`
 *
 * ### Performance
 * - **O(1) operation**: Only checks array length property
 * - Fast validation suitable for large arrays
 *
 * @param minLength - Minimum number of elements required
 * @returns A property decorator function
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
}) {
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
}, 'ArrayMinLength');

/**
 * ## ArrayMaxLength Decorator
 *
 * Property decorator that validates an array does not exceed the specified maximum number of elements.
 * Prevents arrays from growing beyond acceptable limits to avoid memory issues or performance problems.
 *
 * ### Usage
 * ```typescript
 * class FileUploads {
 *   @IsArray()
 *   @ArrayMaxLength(5)
 *   files: UploadedFile[];
 * }
 * ```
 *
 * ### Parameters
 * - `maxLength: number` - The maximum number of elements allowed
 *
 * ### Validation Behavior
 * - **Passes**: When array length <= maximum length
 * - **Fails**: When array length > maximum length
 * - **Edge cases**: Empty arrays always pass
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must not contain more than {maxLength} items"`
 * - I18n key: `"validator.arrayMaxLength"`
 *
 * ### Performance
 * - **O(1) operation**: Only checks array length property
 * - Fast validation suitable for large arrays
 *
 * @param maxLength - Maximum number of elements allowed
 * @returns A property decorator function
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
}) {
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
}, 'ArrayMaxLength');

/**
 * ## ArrayLength Decorator
 *
 * Property decorator that validates an array has exactly the specified number of elements.
 * Ensures arrays have a precise, required size for structured data requirements.
 *
 * ### Usage
 * ```typescript
 * class RGBColor {
 *   @IsArray()
 *   @ArrayLength(3)
 *   @ArrayAllNumbers()
 *   values: number[]; // [1, 2, 3]
 * }
 * ```
 *
 * ### Parameters
 * - `length: number` - The exact number of elements required
 *
 * ### Validation Behavior
 * - **Passes**: When array length === exact length
 * - **Fails**: When array length !== exact length
 * - **Edge cases**: Empty arrays fail unless length is 0
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must contain exactly {length} items"`
 * - I18n key: `"validator.arrayLength"`
 *
 * ### Performance
 * - **O(1) operation**: Only checks array length property
 * - Fast validation suitable for large arrays
 *
 * @param length - Exact number of elements required
 * @returns A property decorator function
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
}) {
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
}, 'ArrayLength');

/**
 * ## ArrayContains Decorator
 *
 * Property decorator that validates an array contains all of the specified required values.
 * Ensures that certain elements are present in the array for business logic requirements.
 *
 * ### Usage
 * ```typescript
 * class UserPermissions {
 *   @IsArray()
 *   @ArrayContains(["read", "write"])
 *   permissions: string[];
 * }
 * ```
 *
 * ### Parameters
 * - `...requiredValues: any[]` - Values that must all be present in the array
 *
 * ### Validation Behavior
 * - **Passes**: When array contains ALL specified values
 * - **Fails**: When array is missing ANY specified value
 * - **Comparison**: Uses deep equality checking for objects
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must contain all required values: {missingValues}"`
 * - I18n key: `"validator.arrayContains"`
 *
 * ### Performance
 * - **O(n*m) operation**: n = array length, m = required values length
 * - May be slow for complex objects due to deep equality checking
 *
 * @param requiredValues - Values that must be present in the array
 * @returns A property decorator function
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
}) {
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
        return areEquals(item, requiredValue);
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
}, 'ArrayContains');

/**
 * ## ArrayUnique Decorator
 *
 * Property decorator that validates all elements in an array are unique (no duplicates).
 * Ensures arrays contain distinct values only, commonly used for IDs and identifiers.
 *
 * ### Usage
 * ```typescript
 * class UserIds {
 *   @IsArray()
 *   @ArrayUnique()
 *   @ArrayAllStrings()
 *   userIds: string[];
 * }
 * ```
 *
 * ### Parameters
 * - No parameters required
 *
 * ### Validation Behavior
 * - **Passes**: When all array elements are unique
 * - **Fails**: When any element appears more than once
 * - **Empty/Single element arrays**: Always pass
 *
 * ### Uniqueness Checking
 * - **Primitive types**: Compared by value
 * - **Objects**: Compared by JSON string representation
 * - **Null/undefined**: Treated as distinct values
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must contain only unique values"`
 * - I18n key: `"validator.arrayUnique"`
 *
 * ### Performance
 * - **O(n²) worst case**: Due to comparison operations
 * - **Early exit**: Stops on first duplicate found
 * - Uses Set for primitive type optimization
 *
 * @returns A property decorator function
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
}) {
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
 * ## ArrayAllStrings Decorator
 *
 * Property decorator that validates all elements in an array are strings.
 * Ensures type homogeneity for string arrays used in text data collections.
 *
 * ### Usage
 * ```typescript
 * class TagList {
 *   @IsArray()
 *   @ArrayAllStrings()
 *   @ArrayUnique()
 *   tags: string[];
 * }
 * ```
 *
 * ### Parameters
 * - No parameters required
 *
 * ### Validation Behavior
 * - **Passes**: When all elements are strings (including empty strings)
 * - **Fails**: When any element is not a string
 * - **Empty arrays**: Always pass
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: All items must be strings"`
 * - I18n key: `"validator.arrayAllStrings"`
 *
 * ### Performance
 * - **O(n) operation**: Iterates through all array elements
 * - **Early exit**: Stops on first non-string element
 * - Uses fast `typeof` operator
 *
 * @returns A property decorator function
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
}) {
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
 * ## ArrayAllNumbers Decorator
 *
 * Property decorator that validates all elements in an array are numbers.
 * Ensures type homogeneity for numeric arrays used in data collections.
 *
 * ### Usage
 * ```typescript
 * class SensorReadings {
 *   @IsArray()
 *   @ArrayAllNumbers()
 *   @ArrayMinLength(1)
 *   values: number[];
 * }
 * ```
 *
 * ### Parameters
 * - No parameters required
 *
 * ### Validation Behavior
 * - **Passes**: When all elements are numbers (excluding NaN)
 * - **Fails**: When any element is not a number or is NaN
 * - **Empty arrays**: Always pass
 *
 * ### Number Type Considerations
 * - **Valid**: `42`, `3.14`, `-0`, `Infinity`, `-Infinity`
 * - **Invalid**: `NaN`, strings `"42"`, booleans, objects, null, undefined
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: All items must be numbers"`
 * - I18n key: `"validator.arrayAllNumbers"`
 *
 * ### Performance
 * - **O(n) operation**: Iterates through all array elements
 * - **Early exit**: Stops on first invalid element
 * - Uses fast `typeof` and `Number.isNaN` checks
 *
 * @returns A property decorator function
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
}) {
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
     * ## Array Validation Rule
     *
     * Validates that a property value is an array. This is a fundamental array validation rule
     * that ensures the value is actually an array before applying other array-specific validations.
     *
     * ### Purpose
     * Ensures the property value is an array type before applying array-specific validation rules.
     * This rule is typically used as a prerequisite for other array validation rules.
     *
     * ### Parameter Structure
     * - **No parameters required**: `ValidatorRuleParams<[]>`
     * - Rule takes no arguments: `"Array"`
     *
     * ### Usage Examples
     *
     * #### Basic Usage
     * ```typescript
     * class ProductList {
     *   @IsArray()
     *   products: Product[];
     * }
     * ```
     *
     * #### Combined with Other Array Rules
     * ```typescript
     * class UserRoles {
     *   @IsArray()
     *   @ArrayMinLength(1)
     *   @ArrayAllStrings()
     *   roles: string[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When value is an array (including empty arrays)
     * - **Fails**: When value is not an array (null, undefined, object, string, number, etc.)
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must be an array"`
     * - I18n key: `"validator.array"`
     *
     * ### Common Use Cases
     * - Validating API responses that should return arrays
     * - Ensuring form inputs that collect multiple values are arrays
     * - Type guarding before applying array-specific operations
     *
     * ### Relationship to Other Rules
     * - **Prerequisite for**: `ArrayMinLength`, `ArrayMaxLength`, `ArrayLength`, `ArrayContains`, `ArrayUnique`, `ArrayAllStrings`, `ArrayAllNumbers`
     * - **Often combined with**: Array length and content validation rules
     *
     * @public
     */
    Array: ValidatorRuleParams<[]>;

    /**
     * ## Array Minimum Length Validation Rule
     *
     * Validates that an array has at least the specified minimum number of elements.
     * This rule ensures arrays meet minimum size requirements.
     *
     * ### Purpose
     * Enforces minimum array length constraints, commonly used for ensuring collections
     * have sufficient elements for business logic requirements.
     *
     * ### Parameter Structure
     * - **Single parameter**: `ValidatorRuleParams<[minLength: number]>`
     * - **Parameter type**: `number` (minimum length required)
     * - **Rule syntax**: `"ArrayMinLength[5]"` (minimum 5 elements)
     *
     * ### Usage Examples
     *
     * #### Basic Minimum Length
     * ```typescript
     * class ShoppingCart {
     *   @IsArray()
     *   @ArrayMinLength(1)
     *   items: CartItem[];
     * }
     * ```
     *
     * #### Combined with Maximum Length
     * ```typescript
     * class TeamMembers {
     *   @IsArray()
     *   @ArrayMinLength(2)
     *   @ArrayMaxLength(10)
     *   members: User[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When array length >= minimum length
     * - **Fails**: When array length < minimum length
     * - **Edge cases**: Empty arrays fail if minLength > 0
     *
     * ### Parameter Validation
     * - **Type checking**: Parameter must be a valid number
     * - **Range validation**: Parameter must be >= 0
     * - **Invalid parameters**: Throws error during rule parsing
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must contain at least {minLength} items"`
     * - I18n key: `"validator.arrayMinLength"`
     *
     * ### Common Use Cases
     * - Shopping carts requiring at least one item
     * - Teams requiring minimum member counts
     * - Collections needing baseline data
     *
     * ### Performance Notes
     * - **O(1) operation**: Only checks array length property
     * - **No iteration**: Does not traverse array elements
     * - **Fast validation**: Suitable for large arrays
     *
     * @public
     */
    ArrayMinLength: ValidatorRuleParams<[minLength: number]>;

    /**
     * ## Array Maximum Length Validation Rule
     *
     * Validates that an array does not exceed the specified maximum number of elements.
     * This rule prevents arrays from growing beyond acceptable limits.
     *
     * ### Purpose
     * Enforces maximum array length constraints to prevent excessive data,
     * memory issues, or performance problems with large collections.
     *
     * ### Parameter Structure
     * - **Single parameter**: `ValidatorRuleParams<[maxLength: number]>`
     * - **Parameter type**: `number` (maximum length allowed)
     * - **Rule syntax**: `"ArrayMaxLength[100]"` (maximum 100 elements)
     *
     * ### Usage Examples
     *
     * #### Basic Maximum Length
     * ```typescript
     * class FileUploads {
     *   @IsArray()
     *   @ArrayMaxLength(5)
     *   files: UploadedFile[];
     * }
     * ```
     *
     * #### Combined with Minimum Length
     * ```typescript
     * class CommitteeMembers {
     *   @IsArray()
     *   @ArrayMinLength(3)
     *   @ArrayMaxLength(7)
     *   members: Person[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When array length <= maximum length
     * - **Fails**: When array length > maximum length
     * - **Edge cases**: Empty arrays always pass
     *
     * ### Parameter Validation
     * - **Type checking**: Parameter must be a valid number
     * - **Range validation**: Parameter must be >= 0
     * - **Invalid parameters**: Throws error during rule parsing
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must not contain more than {maxLength} items"`
     * - I18n key: `"validator.arrayMaxLength"`
     *
     * ### Common Use Cases
     * - Limiting file upload counts
     * - Restricting participant numbers in events
     * - Preventing memory issues with large datasets
     * - Enforcing business rules on collection sizes
     *
     * ### Performance Notes
     * - **O(1) operation**: Only checks array length property
     * - **No iteration**: Does not traverse array elements
     * - **Fast validation**: Suitable for large arrays
     *
     * @public
     */
    ArrayMaxLength: ValidatorRuleParams<[maxLength: number]>;

    /**
     * ## Array Exact Length Validation Rule
     *
     * Validates that an array has exactly the specified number of elements.
     * This rule ensures arrays have a precise, required size.
     *
     * ### Purpose
     * Enforces exact array length requirements where the number of elements
     * must match a specific count exactly, not more or less.
     *
     * ### Parameter Structure
     * - **Single parameter**: `ValidatorRuleParams<[length: number]>`
     * - **Parameter type**: `number` (exact length required)
     * - **Rule syntax**: `"ArrayLength[3]"` (exactly 3 elements required)
     *
     * ### Usage Examples
     *
     * #### Fixed-Size Collections
     * ```typescript
     * class RGBColor {
     *   @IsArray()
     *   @ArrayLength(3)
     *   @ArrayAllNumbers()
     *   values: number[]; // [r, g, b]
     * }
     * ```
     *
     * #### Structured Data Requirements
     * ```typescript
     * class Coordinate {
     *   @IsArray()
     *   @ArrayLength(2)
     *   @ArrayAllNumbers()
     *   point: number[]; // [x, y]
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When array length === exact length
     * - **Fails**: When array length !== exact length
     * - **Edge cases**: Empty arrays fail unless length is 0
     *
     * ### Parameter Validation
     * - **Type checking**: Parameter must be a valid number
     * - **Range validation**: Parameter must be >= 0
     * - **Invalid parameters**: Throws error during rule parsing
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must contain exactly {length} items"`
     * - I18n key: `"validator.arrayLength"`
     *
     * ### Common Use Cases
     * - Color values requiring specific channel counts
     * - Geographic coordinates with fixed dimensions
     * - Structured data with known field counts
     * - Protocol buffers or fixed-schema data structures
     *
     * ### Performance Notes
     * - **O(1) operation**: Only checks array length property
     * - **No iteration**: Does not traverse array elements
     * - **Fast validation**: Suitable for large arrays
     *
     * ### Comparison with Range Rules
     * | Rule | Use Case | Example |
     * |------|----------|---------|
     * | `ArrayLength` | Exact count required | RGB values: exactly 3 numbers |
     * | `ArrayMinLength` + `ArrayMaxLength` | Size range allowed | Team: 2-10 members |
     *
     * @public
     */
    ArrayLength: ValidatorRuleParams<[length: number]>;

    /**
     * ## Array Contains Validation Rule
     *
     * Validates that an array contains all of the specified required values.
     * This rule ensures that certain elements are present in the array.
     *
     * ### Purpose
     * Ensures that an array includes specific required elements, commonly used
     * for validating that collections contain mandatory items or meet inclusion criteria.
     *
     * ### Parameter Structure
     * - **Array parameter**: `ValidatorRuleParams<any[]>`
     * - **Parameter type**: `any[]` (array of values that must be present)
     * - **Rule syntax**: `"ArrayContains[value1, value2, ...]"`
     *
     * ### Usage Examples
     *
     * #### Required Permissions
     * ```typescript
     * class UserPermissions {
     *   @IsArray()
     *   @ArrayContains(["read", "write"])
     *   permissions: string[];
     * }
     * ```
     *
     * #### Mandatory Categories
     * ```typescript
     * class ProductTags {
     *   @IsArray()
     *   @ArrayContains(["electronics", "featured"])
     *   tags: string[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When array contains ALL specified values
     * - **Fails**: When array is missing ANY specified value
     * - **Comparison**: Uses deep equality checking for objects
     *
     * ### Parameter Validation
     * - **Type checking**: Parameter must be an array
     * - **Empty arrays**: Valid but meaningless (no requirements)
     * - **Invalid parameters**: Throws error during rule parsing
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must contain all required values: {missingValues}"`
     * - I18n key: `"validator.arrayContains"`
     *
     * ### Common Use Cases
     * - User permissions requiring specific access levels
     * - Product categories needing mandatory tags
     * - Configuration requiring essential settings
     * - Business rules mandating certain options
     *
     * ### Performance Notes
     * - **O(n*m) operation**: n = array length, m = required values length
     * - **Nested loops**: Uses `some()` and `every()` for checking
     * - **Deep equality**: May be slow for complex objects
     *
     * ### Important Considerations
     * - **Deep equality**: Objects are compared by structure, not reference
     * - **Primitive types**: Strings, numbers, booleans compared by value
     * - **Null/undefined**: Treated as distinct values
     * - **Order irrelevant**: Array order doesn't affect validation
     *
     * @public
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ArrayContains: ValidatorRuleParams<any[]>;

    /**
     * ## Array Uniqueness Validation Rule
     *
     * Validates that all elements in an array are unique (no duplicates).
     * This rule ensures arrays contain distinct values only.
     *
     * ### Purpose
     * Prevents duplicate values in arrays where uniqueness is required,
     * commonly used for IDs, usernames, email lists, or any collection
     * where duplicates would cause issues.
     *
     * ### Parameter Structure
     * - **No parameters required**: `ValidatorRuleParams<[]>`
     * - Rule takes no arguments: `"ArrayUnique"`
     *
     * ### Usage Examples
     *
     * #### Unique Identifiers
     * ```typescript
     * class UserIds {
     *   @IsArray()
     *   @ArrayUnique()
     *   @ArrayAllStrings()
     *   userIds: string[];
     * }
     * ```
     *
     * #### Unique Email List
     * ```typescript
     * class InvitationList {
     *   @IsArray()
     *   @ArrayUnique()
     *   @ArrayAllStrings()
     *   emails: string[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When all array elements are unique
     * - **Fails**: When any element appears more than once
     * - **Empty arrays**: Always pass (no duplicates possible)
     * - **Single element**: Always pass (no duplicates possible)
     *
     * ### Uniqueness Checking
     * - **Primitive types**: Compared by value (string, number, boolean)
     * - **Objects**: Compared by reference (not deep equality)
     * - **Null/undefined**: Treated as distinct values
     * - **Mixed types**: Different types are considered unique
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: Must contain only unique values"`
     * - I18n key: `"validator.arrayUnique"`
     *
     * ### Common Use Cases
     * - User ID collections
     * - Email address lists
     * - Tag collections
     * - Primary key arrays
     * - Selection lists without duplicates
     *
     * ### Performance Notes
     * - **O(n²) worst case**: Nested loops for comparison
     * - **Early exit**: Stops on first duplicate found
     * - **Memory efficient**: Uses Set for primitive type optimization
     * - **Object comparison**: Reference-based (fast but shallow)
     *
     * ### Important Considerations
     * - **Object uniqueness**: Based on reference, not content
     * - **Deep equality**: Not performed for performance reasons
     * - **Custom comparison**: Not supported (use custom rule if needed)
     * - **Case sensitivity**: String comparison is case-sensitive
     *
     * ### Alternatives for Complex Uniqueness
     * For content-based uniqueness of objects, consider custom validation rules:
     * ```typescript
     * const uniqueByProperty = ({ value }) => {
     *   const ids = value.map(item => item.id);
     *   return ids.length === new Set(ids).size || "Duplicate IDs found";
     * };
     * ```
     *
     * @public
     */
    ArrayUnique: ValidatorRuleParams<[]>;

    /**
     * ## Array All Strings Validation Rule
     *
     * Validates that all elements in an array are strings.
     * This rule ensures type homogeneity for string arrays.
     *
     * ### Purpose
     * Enforces that array elements are exclusively strings, commonly used
     * for validating collections of text data, identifiers, or labels.
     *
     * ### Parameter Structure
     * - **No parameters required**: `ValidatorRuleParams<[]>`
     * - Rule takes no arguments: `"ArrayAllStrings"`
     *
     * ### Usage Examples
     *
     * #### String Collections
     * ```typescript
     * class TagList {
     *   @IsArray()
     *   @ArrayAllStrings()
     *   @ArrayUnique()
     *   tags: string[];
     * }
     * ```
     *
     * #### User Input Arrays
     * ```typescript
     * class SearchKeywords {
     *   @IsArray()
     *   @ArrayAllStrings()
     *   @ArrayMinLength(1)
     *   keywords: string[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When all elements are strings (including empty strings)
     * - **Fails**: When any element is not a string
     * - **Empty arrays**: Always pass (no non-string elements)
     * - **Type checking**: Uses `typeof item === 'string'`
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: All items must be strings"`
     * - I18n key: `"validator.arrayAllStrings"`
     *
     * ### Common Use Cases
     * - Tag collections
     * - Keyword lists
     * - User input arrays
     * - Identifier collections
     * - Text-based data arrays
     *
     * ### Performance Notes
     * - **O(n) operation**: Iterates through all array elements
     * - **Early exit**: Stops on first non-string element
     * - **Type checking**: Uses fast `typeof` operator
     *
     * ### Related Rules
     * - **ArrayAllNumbers**: For numeric arrays
     * - **ArrayUnique**: For unique string arrays
     * - **ArrayMinLength/ArrayMaxLength**: For size constraints
     *
     * @public
     */
    ArrayAllStrings: ValidatorRuleParams<[]>;

    /**
     * ## Array All Numbers Validation Rule
     *
     * Validates that all elements in an array are numbers.
     * This rule ensures type homogeneity for numeric arrays.
     *
     * ### Purpose
     * Enforces that array elements are exclusively numbers, commonly used
     * for validating collections of numeric data, measurements, or calculations.
     *
     * ### Parameter Structure
     * - **No parameters required**: `ValidatorRuleParams<[]>`
     * - Rule takes no arguments: `"ArrayAllNumbers"`
     *
     * ### Usage Examples
     *
     * #### Numeric Data Collections
     * ```typescript
     * class SensorReadings {
     *   @IsArray()
     *   @ArrayAllNumbers()
     *   @ArrayMinLength(1)
     *   values: number[];
     * }
     * ```
     *
     * #### Coordinate Arrays
     * ```typescript
     * class PolygonPoints {
     *   @IsArray()
     *   @ArrayAllNumbers()
     *   @ArrayLength(6) // [x1,y1,x2,y2,x3,y3]
     *   coordinates: number[];
     * }
     * ```
     *
     * ### Validation Behavior
     * - **Passes**: When all elements are numbers (including NaN, Infinity)
     * - **Fails**: When any element is not a number
     * - **Empty arrays**: Always pass (no non-number elements)
     * - **Type checking**: Uses `typeof item === 'number'`
     *
     * ### Number Type Considerations
     * - **Valid numbers**: `42`, `3.14`, `-0`, `NaN`, `Infinity`, `-Infinity`
     * - **Invalid values**: Strings `"42"`, booleans, objects, null, undefined
     * - **Numeric strings**: Not accepted (must be actual numbers)
     *
     * ### Error Messages
     * - Default: `"[PropertyName]: All items must be numbers"`
     * - I18n key: `"validator.arrayAllNumbers"`
     *
     * ### Common Use Cases
     * - Sensor data collections
     * - Measurement arrays
     * - Coordinate systems
     * - Statistical data
     * - Mathematical calculations
     *
     * ### Performance Notes
     * - **O(n) operation**: Iterates through all array elements
     * - **Early exit**: Stops on first non-number element
     * - **Type checking**: Uses fast `typeof` operator
     *
     * ### Related Rules
     * - **ArrayAllStrings**: For string arrays
     * - **ArrayUnique**: For unique number arrays
     * - **ArrayMinLength/ArrayMaxLength**: For size constraints
     * - **NumberGT/NumberLT**: For individual number validation
     *
     * ### Important Considerations
     * - **NaN handling**: `NaN` values are considered valid numbers
     * - **Infinity handling**: `Infinity` and `-Infinity` are valid numbers
     * - **Type coercion**: No automatic conversion from strings to numbers
     * - **Precision**: No validation of number precision or range
     *
     * @public
     */
    ArrayAllNumbers: ValidatorRuleParams<[]>;
  }
}
