import { IPrimitive } from "@/types";
import { IValidatorResult, IValidatorValidateOptions } from "../types";
import { Validator } from "../validator";

function _IsEnum<T extends IPrimitive = IPrimitive>({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions<Array<T>>): IValidatorResult {
  if (!ruleParams || !ruleParams.length) {
    const message = i18n.t("validator.invalidRuleParams", {
      rule: "Enum",
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  const exists = allInRules(value, ruleParams);
  if (!exists) {
    return i18n.t("validator.invalidEnumValue", {
      field: translatedPropertyName || fieldName,
      value,
      expectedValues: ruleParams.map((r) => String(r)).join("|"),
      ...rest,
    });
  }
  return true;
}
export const IsEnum = Validator.buildRuleDecorator<Array<IPrimitive>>(_IsEnum);
Validator.registerRule("Enum", _IsEnum);
declare module "../types" {
  export interface IValidatorRulesMap<Context = unknown> {
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
     * @since 1.25.13
     * @public
     */
    Enum: IValidatorRuleParams<Array<IPrimitive>, Context>;
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
