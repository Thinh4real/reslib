/**
 * Checks if the provided value is a valid number, excluding NaN (Not-a-Number).
 *
 * This function performs a type check to ensure the value is of type `number` and
 * additionally verifies that it is not NaN, which is a special numeric value
 * representing an invalid number (e.g., the result of 0/0 or invalid mathematical operations).
 *
 * It serves as a type guard, narrowing the type of the input value to `number` if the check passes.
 * This is useful in TypeScript for ensuring type safety when dealing with potentially
 * untrusted or dynamically typed inputs, such as user inputs, API responses, or parsed data.
 *
 * @param value - The value to check. Can be of any type, but the function will only return true
 *                for actual numbers that are not NaN.
 * @returns `true` if the value is a number and not NaN; otherwise, `false`.
 *          When `true`, TypeScript will narrow the type of `value` to `number`.
 *
 * @example
 * ```typescript
 * console.log(isNumber(42));        // true
 * console.log(isNumber(3.14));      // true
 * console.log(isNumber(NaN));       // false
 * console.log(isNumber('42'));      // false
 * console.log(isNumber(null));      // false
 * console.log(isNumber(undefined)); // false
 * ```
 *
 * @note This function does not consider numeric strings (e.g., "42") as numbers.
 *       For parsing strings to numbers, consider using `parseFloat` or `parseInt`
 *       in combination with this check.
 * @note Infinity and -Infinity are considered valid numbers by this function,
 *       as they are numeric values in JavaScript.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}
