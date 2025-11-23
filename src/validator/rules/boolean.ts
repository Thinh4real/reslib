import { defaultStr } from "@/utils";
import { IValidatorResult, IValidatorValidateOptions } from "../types";
import { Validator } from "../validator";

function _Boolean({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    const validBooleans = [true, false, 1, 0, "1", "0"];
    // Handle string Boolean values case-insensitively
    let normalizedValue = value;
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      if (lowerValue === "true") normalizedValue = true;
      else if (lowerValue === "false") normalizedValue = false;
      else normalizedValue = value;
    }
    const isValidBoolean = validBooleans.includes(normalizedValue);
    if (isValidBoolean) {
      resolve(true);
    } else {
      const message = i18n.t("validator.Boolean", {
        field: defaultStr(translatedPropertyName, fieldName),
        value,
        ...rest,
      });
      reject(message);
    }
  });
}

/**
 * ### IsBoolean Rule
 *
 * Validates that the field under validation can be cast as a Boolean.
 * This rule accepts true, false, 1, 0, "1", and "0" as valid Boolean values.
 *
 * #### Valid boolean Values
 * - `true` and `false` (Boolean)
 * - `1` and `0` (number)
 * - `"1"` and `"0"` (string)
 * - `"true"` and `"false"` (case-insensitive string)
 *
 * @example
 * ```typescript
 * // With class validation
 * class UserPreferences {
 *   @IsBoolean
 *   emailNotifications: Boolean;
 *
 *   @IsBoolean
 *   darkMode: string; // Can be "true"/"false"
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsBoolean = Validator.buildPropertyDecorator(["Boolean"]);
Validator.registerRule("Boolean", _Boolean);

declare module "../types" {
  export interface IValidatorRulesMap<Context = unknown> {
    /**
     * ### Boolean Rule
     *
     * Validates that the field under validation can be cast as a Boolean.
     * This rule accepts true, false, 1, 0, "1", and "0" as valid Boolean values.
     *
     * #### Valid boolean Values
     * - `true` and `false` (Boolean)
     * - `1` and `0` (number)
     * - `"1"` and `"0"` (string)
     * - `"true"` and `"false"` (case-insensitive string)
     *
     * @example
     * ```typescript
     * // Valid boolean values
     * await Validator.validate({
     *   value: true,
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 0,
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'false',
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * // Invalid values
     * await Validator.validate({
     *   value: 'maybe',
     *   rules: ['Boolean']
     * }); // ✗ Invalid
     *
     * // With class validation
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    Boolean: IValidatorRuleParams<[], Context>;
  }
}
