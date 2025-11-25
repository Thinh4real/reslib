import { Primitive } from '@/types';
import { ValidatorResult, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams } from '../types';

function _IsEnum<T extends Primitive = Primitive>({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<Array<T>>): ValidatorResult {
  if (!ruleParams || !ruleParams.length) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'Enum',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  const exists = allInRules(value, ruleParams);
  if (!exists) {
    return i18n.t('validator.invalidEnumValue', {
      field: translatedPropertyName || fieldName,
      value,
      expectedValues: ruleParams.map((r) => String(r)).join('|'),
      ...rest,
    });
  }
  return true;
}
export const IsEnum = Validator.buildRuleDecorator<Array<Primitive>>(_IsEnum);
Validator.registerRule('Enum', _IsEnum);
declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Enum Rule
     *
     * Validates that the field match one of the following value, passed throght rulesParams
     *
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing enum values
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @public
     */
    Enum: ValidatorRuleParams<Array<Primitive>>;
  }
}

/**
 * Validates that all values exist in rule parameters using O(1) lookups.
 * Performs both strict and type-coerced comparisons (null/undefined excluded).
 *
 * @param value - Single value or array of values to check
 * @param ruleParams - Allowed parameter values
 * @returns true if ALL values are found in ruleParams, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allInRules = (value: any, ruleParams: any[]): boolean => {
  // Normalize input to array for uniform processing
  const values = Array.isArray(value) ? value : [value];

  // Set for strict equality checks
  const strictSet = new Set(ruleParams);

  // Set for string-based comparison (filters out null/undefined first)
  const stringSet = new Set(ruleParams.filter((v) => v != null).map(String));

  // Verify every value exists in either set
  return values.every((v) => strictSet.has(v) || stringSet.has(String(v)));
};
