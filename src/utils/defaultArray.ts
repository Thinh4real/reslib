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
export function defaultArray<T extends any = any>(...args: any[]): T[] {
    /**
     * If there is only one argument, return it if it's an array, or an empty array if it's not.
     */
    if (args.length === 1) return Array.isArray(args[0]) ? args[0] : [];

    let prevArray = null;

    /**
     * Iterate over the arguments to find the first non-empty array or the first array if all are empty.
     */
    for (var i in args) {
        const x = args[i];
        if (Array.isArray(x)) {
            /**
             * If the array is not empty, return it immediately.
             */
            if (x.length) return x;
            /**
             * If the array is empty and no previous array has been found, store it as the previous array.
             */
            if (!prevArray) {
                prevArray = x;
            }
        }
    }
    /**
     * Return the previous array if found, or an empty array if no arrays were found.
     */
    return prevArray || [];
};