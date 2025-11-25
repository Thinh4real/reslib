import 'reflect-metadata';
import { isNumber } from './isNumber';

export * from './date';
export * from './debounce';
export { debounce } from './debounce';
export * from './defaultArray';
export { defaultBool } from './defaultBool';
export { defaultStr } from './defaultStr';
export { defaultVal } from './defaultVal';
export * from './dom';
export * from './image';
export { isNonNullString } from './isNonNullString';
export * from './isNumber';
export { isPromise } from './isPromise';
export { isRegExp as isRegex } from './isRegex';
export * from './json';
export * from './numbers';
export * from './object';
export * from './sort';
export { stringify } from './stringify';
export { uniqid } from './uniqid';
export * from './uri';

export * from './global';
export * from './isEmail';
export { isPrimitive } from './isPrimitive';
export * from './string';
export * from './uri';

/**
 * Checks if a value is an integer.
 *
 * This function returns true if the value is a finite number and its floor value is equal to the value itself.
 *
 * @param x The value to check.
 * @returns True if the value is an integer, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInteger(x: any): x is number {
  return isNumber(x) && isFinite(x) && Math.floor(x) === x;
}

export * from './isNullable';

export { areEquals } from './areEquals';
export { isEmpty } from './isEmpty';

export * from './interpolate';
