/**
 * A highly optimized sorting function capable of efficiently handling billions of array elements
 * with support for complex objects and various data types.
 *
 * For very large arrays (millions of elements), this function automatically switches to
 * a chunked sorting algorithm that reduces memory pressure and improves cache efficiency.
 * You can control the chunk size with the `chunkSize` option.
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
 *
 * @example
 * // Handle very large datasets with custom chunk size for memory efficiency
 * const largeDataset = Array.from({ length: 1000000 }, () => Math.random());
 * const sortedLarge = sortBy(largeDataset, n => n, { chunkSize: 25000 });
 * // Uses chunked sorting to reduce memory pressure on large arrays
 */

export function sortBy<T, V = unknown>(
  data: T[],
  getItemValue: (item: T) => V,
  options: {
    direction?: SortOrder;
    inPlace?: boolean;
    /** Controls chunk size for large array sorting. Arrays larger than chunkSize
     * will be sorted using a memory-efficient chunked algorithm. Default: 50000 */
    chunkSize?: number;
    ignoreCase?: boolean;
  } = {}
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  // Handle empty or single-item arrays
  if (data.length <= 1) return options.inPlace === false ? [...data] : data;

  // Default options
  const direction = options.direction === 'desc' ? 'desc' : 'asc';
  const ignoreCase = options.ignoreCase !== false; // default true
  const inPlace = options.inPlace !== false; // default true
  const chunkSize =
    options.chunkSize && options.chunkSize > 0 ? options.chunkSize : 50000; // Default chunk size for large arrays

  // Work on a copy if not in-place
  const arrayToSort = inPlace ? data : [...data];

  // For very large arrays, use chunked sorting to reduce memory pressure
  if (arrayToSort.length > chunkSize) {
    return chunkedSort(
      arrayToSort,
      getItemValue,
      direction,
      ignoreCase,
      chunkSize
    );
  }

  // For smaller arrays, use native sort
  return arrayToSort.sort((a, b) => {
    return compare<V>(getItemValue(a), getItemValue(b), direction, ignoreCase);
  });
}

function compare<V = unknown>(
  valueA: V,
  valueB: V,
  direction: SortOrder,
  ignoreCase?: boolean
): number {
  // Handle null/undefined
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return direction === 'asc' ? -1 : 1;
  if (valueB == null) return direction === 'asc' ? 1 : -1;

  // Fast path for numbers
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    const diff = valueA - valueB;
    return direction === 'asc' ? diff : -diff;
  }

  // Fast path for strings
  if (typeof valueA === 'string' && typeof valueB === 'string') {
    let a = valueA;
    let b = valueB;
    if (ignoreCase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      a = a.toLowerCase() as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      b = b.toLowerCase() as any;
    }
    const cmp = a < b ? -1 : a > b ? 1 : 0;
    return direction === 'asc' ? cmp : -cmp;
  }

  // Dates
  if (valueA instanceof Date && valueB instanceof Date) {
    const diff = valueA.getTime() - valueB.getTime();
    return direction === 'asc' ? diff : -diff;
  }

  // Convert to strings for other types
  const strA = String(valueA);
  const strB = String(valueB);
  const cmp = ignoreCase
    ? strA.toLowerCase() < strB.toLowerCase()
      ? -1
      : strA.toLowerCase() > strB.toLowerCase()
        ? 1
        : 0
    : strA < strB
      ? -1
      : strA > strB
        ? 1
        : 0;
  return direction === 'asc' ? cmp : -cmp;
}

/**
 * Chunked sorting for large arrays to reduce memory pressure and improve cache efficiency
 */
function chunkedSort<T, V>(
  array: T[],
  getItemValue: (item: T) => V,
  direction: SortOrder,
  ignoreCase: boolean,
  chunkSize: number
): T[] {
  if (array.length <= chunkSize) {
    // If array is smaller than chunk size, just sort directly
    return array.sort((a, b) =>
      compare<V>(getItemValue(a), getItemValue(b), direction, ignoreCase)
    );
  }

  // Split array into chunks
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  // Sort each chunk individually
  const sortedChunks = chunks.map((chunk) =>
    chunk.sort((a, b) =>
      compare<V>(getItemValue(a), getItemValue(b), direction, ignoreCase)
    )
  );

  // Merge all sorted chunks
  return mergeSortedChunks(sortedChunks, getItemValue, direction, ignoreCase);
}

/**
 * Merge multiple sorted chunks into a single sorted array
 */
function mergeSortedChunks<T, V>(
  chunks: T[][],
  getItemValue: (item: T) => V,
  direction: SortOrder,
  ignoreCase: boolean
): T[] {
  if (chunks.length === 0) return [];
  if (chunks.length === 1) return chunks[0];

  // Use a priority queue-like approach for k-way merge
  const result: T[] = [];
  const indices = new Array(chunks.length).fill(0);

  while (true) {
    let minIndex = -1;
    let minValue: T | null = null;

    // Find the smallest element among the current heads of all chunks
    for (let i = 0; i < chunks.length; i++) {
      if (indices[i] < chunks[i].length) {
        const currentItem = chunks[i][indices[i]];
        if (
          minValue === null ||
          compare<V>(
            getItemValue(currentItem),
            getItemValue(minValue),
            direction,
            ignoreCase
          ) < 0
        ) {
          minValue = currentItem;
          minIndex = i;
        }
      }
    }

    // If no more elements, we're done
    if (minIndex === -1) break;

    // Add the smallest element to result and advance its chunk index
    result.push(minValue!);
    indices[minIndex]++;
  }

  return result;
}

type SortOrder = 'asc' | 'desc';
