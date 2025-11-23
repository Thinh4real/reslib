/**
 * Represents a single digit character from 0 to 9.
 * 
 * @internal
 * @since 1.0.0
 */
type IPercentageDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/**
 * Represents a percentage value as a string literal type ranging from 0% to 100%.
 * 
 * This type ensures compile-time validation of percentage values by restricting
 * the allowed string formats to valid percentage representations.
 * 
 * @remarks
 * The type accepts three formats:
 * - Single digit percentages: "0%" through "9%"
 * - Double digit percentages: "10%" through "99%" 
 * - Special case: "100%" (the maximum allowed value)
 * 
 * @example
 * Valid usage:
 * ```typescript
 * const lowPercentage: IPercentage = "5%";
 * const mediumPercentage: IPercentage = "50%";
 * const highPercentage: IPercentage = "95%";
 * const maximumPercentage: IPercentage = "100%";
 * ```
 * 
 * @example
 * Invalid usage (will cause TypeScript errors):
 * ```typescript
 * const invalid1: IPercentage = "150%"; // Error: exceeds 100%
 * const invalid2: IPercentage = "-5%";  // Error: negative percentage
 * const invalid3: IPercentage = "50";   // Error: missing % symbol
 * const invalid4: IPercentage = "05%";  // Error: leading zero not allowed
 * ```
 * 
 * @public
 * @since 1.0.0
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html | TypeScript Template Literal Types}
 */
export type IPercentage =
    | `${IPercentageDigit}%`           // 0-9%
    | `${IPercentageDigit}${IPercentageDigit}%`   // 10-99%
    | '100%';