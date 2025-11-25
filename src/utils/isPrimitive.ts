import { Primitive } from '../types';

/**
 * Type guard to check if a value is a primitive type.
 *
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a primitive, false otherwise
 *
 * @example
 * isPrimitive("hello")     // returns true
 * isPrimitive(42)          // returns true
 * isPrimitive(true)        // returns true
 * isPrimitive(null)        // returns true
 * isPrimitive({})          // returns false
 * isPrimitive([])          // returns false
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPrimitive(value: any): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
