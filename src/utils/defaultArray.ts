/**
 * Returns a default array based on the provided arguments.
 * If there is only one argument, it returns the argument if it's an array, or an empty array if it's not.
 * If there are multiple arguments, it returns the first non-empty array found, or the first array if all are empty.
 * If no arrays are found, it returns an empty array.
 *
 * @template T The type of elements in the array.
 * @param args Variable number of arguments to check for arrays.
 * @returns The default array based on the provided arguments.
 *
 * @example
 * defaultArray([1, 2, 3]); // returns [1, 2, 3]
 * defaultArray(1, 2, 3); // returns []
 * defaultArray([1, 2, 3], [4, 5, 6]); // returns [1, 2, 3]
 * defaultArray([], [4, 5, 6]); // returns [4, 5, 6]
 * defaultArray([], []); // returns []
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-explicit-any
export function defaultArray<T extends any = any>(...args: any[]): T[] {
  if (args.length === 1) return Array.isArray(args[0]) ? args[0] : [];

  let prevArray = null;

  for (var i in args) {
    const x = args[i];
    if (Array.isArray(x)) {
      if (x.length) return x;
      if (!prevArray) {
        prevArray = x;
      }
    }
  }
  return prevArray || [];
}
