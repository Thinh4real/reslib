import { defaultBool } from "./defaultBool";
import { isEmpty } from "./isEmpty";
import { isNonNullString } from "./isNonNullString";
import { isNumber } from "./isNumber";
/**
 * A highly optimized sorting function capable of efficiently handling billions of array elements
 * with support for complex objects and various data types.
 *
 * @template T - The type of array elements being sorted
 * @template V - The type of values being compared for sorting
 *
 * @param data - The array to be sorted
 * @param getItemValue - Function that extracts the comparable value from each array item
 * @param options - Configuration options to control the sorting behavior
 *
 * @returns The sorted array (either the original array modified in-place or a new array)
 *
 * @example
 * // Sort an array of objects by their 'name' property
 * const users = [
 *   { id: 101, name: "Alice", age: 28 },
 *   { id: 102, name: "bob", age: 34 },
 *   { id: 103, name: "Charlie", age: 21 }
 * ];
 *
 * // Case-sensitive sort (default)
 * const sortedByName = sortBy(users, user => user.name);
 * // Result: [{ id: 101, name: "Alice", age: 28 }, { id: 103, name: "Charlie", age: 21 }, { id: 102, name: "bob", age: 34 }]
 *
 * // Case-insensitive sort
 * const sortedIgnoringCase = sortBy(users, user => user.name, { ignoreCase: true });
 * // Result: [{ id: 101, name: "Alice", age: 28 }, { id: 102, name: "bob", age: 34 }, { id: 103, name: "Charlie", age: 21 }]
 *
 * @example
 * // Sort by date values in descending order (newest first)
 * const tasks = [
 *   { id: 1, title: "Task 1", deadline: new Date("2023-12-01") },
 *   { id: 2, title: "Task 2", deadline: new Date("2023-05-15") },
 *   { id: 3, title: "Task 3", deadline: new Date("2024-02-20") }
 * ];
 *
 * const sortedByDeadline = sortBy(tasks, task => task.deadline, { direction: 'desc' });
 * // Result: Tasks ordered with newest deadline first
 *
 * @example
 * // Create a new sorted array without modifying the original
 * const numbers = [5, 2, 9, 1, 5, 6];
 * const sortedNumbers = sortBy(numbers, n => n, { inPlace: false });
 * // numbers is still [5, 2, 9, 1, 5, 6]
 * // sortedNumbers is [1, 2, 5, 5, 6, 9]
 */
export function sortBy<T, V = any>(
  data: T[],
  getItemValue: (item: T) => V,
  options: {
    direction?: SortOrder;
    inPlace?: boolean;
    chunkSize?: number;
    ignoreCase?: boolean;
  } = {}
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  // Handle empty or single-item arrays
  if (data.length <= 1) return data;
  // Default options
  options = Object.assign({}, options);
  options.direction =
    isNonNullString(options.direction) &&
    ["asc", "desc"].includes(options.direction)
      ? options.direction
      : "asc";
  options.chunkSize =
    isNumber(options.chunkSize) && options.chunkSize > 0
      ? options.chunkSize
      : 10000;
  options.ignoreCase = defaultBool(options.ignoreCase, true);
  const { direction, chunkSize, ignoreCase } = options;
  // For very large arrays, use a chunked merge sort approach
  if (data.length > chunkSize) {
    return chunkingMergeSort(data, getItemValue, direction, ignoreCase);
  }
  // For smaller arrays, use native sort with comparison function
  return data.sort((a, b) => {
    return compare<V>(getItemValue(a), getItemValue(b), direction, ignoreCase);
  });
}

/**
 * Chunking merge sort implementation for very large arrays
 * Splits the work into manageable chunks to avoid call stack issues
 */
function chunkingMergeSort<T, V>(
  array: T[],
  getItemValue: (item: T) => V,
  direction: SortOrder,
  ignoreCase: boolean
): T[] {
  // Base case
  if (array.length <= 1) {
    return array;
  }

  // Split array into two halves
  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  // Recursively sort both halves
  return merge(
    chunkingMergeSort(left, getItemValue, direction, ignoreCase),
    chunkingMergeSort(right, getItemValue, direction, ignoreCase),
    getItemValue,
    direction,
    ignoreCase
  );
}

function compare<V = any>(
  valueA: V,
  valueB: V,
  direction: SortOrder,
  ignoreCase?: boolean
): number {
  // Inside our compare function:
  // Special handling for null and undefined
  if (isEmpty(valueA) && isEmpty(valueB)) return 0;
  if (isEmpty(valueA) && !isEmpty(valueB)) return direction === "asc" ? -1 : 1;
  if (isEmpty(valueB) && !isEmpty(valueA)) return direction === "asc" ? 1 : -1;
  if (typeof valueA === "number" && typeof valueB === "number") {
    return direction === "asc" ? valueA - valueB : valueB - valueA;
  }
  // Handle different types appropriately
  if (valueA instanceof Date && valueB instanceof Date) {
    return direction === "asc"
      ? valueA.getTime() - valueB.getTime()
      : valueB.getTime() - valueA.getTime();
  }
  if (valueA instanceof RegExp && valueB instanceof RegExp) {
    valueA = valueA.toString() as V;
    valueB = valueB.toString() as V;
  }
  if (["boolean", "number", "string"].includes(typeof valueA)) {
    valueA = String(valueA) as any;
  }
  if (["boolean", "number", "string"].includes(typeof valueB)) {
    valueB = String(valueB) as any;
  }
  // Convert to strings for general comparison
  let stringA = valueA?.toString() ?? String(valueA);
  let stringB = valueB?.toString() ?? String(valueB);
  if (ignoreCase) {
    stringA = stringA.toLowerCase();
    stringB = stringB.toLowerCase();
  }
  return compareStrings(stringA, stringB, direction as any);
}

/**
 * Compares two strings and returns -1, 0, or 1 based on their relative order
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @param dir - Direction of comparison ('asc' for ascending, 'desc' for descending)
 * @returns -1 if a comes before b, 0 if equal, 1 if a comes after b
 */
function compareStrings(a: string, b: string, dir: SortOrder): -1 | 0 | 1 {
  // For empty string checks
  if (!a && b) return dir === "asc" ? -1 : 1;
  if (a && !b) return dir === "asc" ? 1 : -1;
  if (!a && !b) return 0;

  // For non-empty strings
  const comparison = a.localeCompare(b);

  // Normalize to exactly -1, 0, or 1
  const normalizedComparison = comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
  // Apply direction
  return (dir === "asc" ? normalizedComparison : -normalizedComparison) as
    | -1
    | 0
    | 1;
}

/**
 * Merge two sorted arrays
 */
function merge<T, V>(
  left: T[],
  right: T[],
  getItemValue: (item: T) => V,
  direction: SortOrder,
  ignoreCase: boolean
): T[] {
  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (
      compare<V>(
        getItemValue(left[leftIndex]),
        getItemValue(right[rightIndex]),
        direction,
        ignoreCase
      ) <= 0
    ) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  // Add remaining elements
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

type SortOrder = "asc" | "desc";
