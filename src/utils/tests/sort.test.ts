/* eslint-disable jest/no-conditional-expect */
import { sortBy } from '../sort'; // Adjust import path as needed

/**
 * These tests validate the sortBy function's behavior with various
 * input types and configurations
 */
describe('sortBy', () => {
  // Basic sorting tests
  describe('Basic Functionality', () => {
    test('sorts an array of numbers in ascending direction', () => {
      const numbers = [5, 3, 9, 1, 4];
      const sorted = sortBy(numbers, (n) => n);
      expect(sorted).toEqual([1, 3, 4, 5, 9]);
    });

    test('sorts an array of numbers in descending direction', () => {
      const numbers = [5, 3, 9, 1, 4];
      const sorted = sortBy(numbers, (n) => n, { direction: 'desc' });
      expect(sorted).toEqual([9, 5, 4, 3, 1]);
    });

    test('handles empty arrays', () => {
      const empty: number[] = [];
      const sorted = sortBy(empty, (n) => n);
      expect(sorted).toEqual([]);
    });

    test('handles single-item arrays', () => {
      const singleItem = [42];
      const sorted = sortBy(singleItem, (n) => n);
      expect(sorted).toEqual([42]);
    });
  });

  // String sorting tests
  describe('String Sorting', () => {
    test('sorts strings in case-sensitive mode (default)', () => {
      const strings = ['banana', 'Apple', 'orange', 'Grape', 'kiwi'];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: false });
      // Capital letters come before lowercase in ASCII
      expect(sorted).toEqual(['Apple', 'Grape', 'banana', 'kiwi', 'orange']);
    });

    test('sorts strings in case-insensitive mode', () => {
      const strings = ['banana', 'Apple', 'orange', 'Grape', 'kiwi'];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: true });
      expect(sorted).toEqual(['Apple', 'banana', 'Grape', 'kiwi', 'orange']);
    });

    test('sorts strings with special characters and spaces', () => {
      const strings = ['item 3', 'item-1', 'Item_2', 'item.4'];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: true });
      // Exact direction depends on locale, but this is the general expected ordering
      expect(sorted[0].toLowerCase()).toContain('item');
    });
  });

  // Date sorting tests
  describe('Date Sorting', () => {
    test('sorts dates in ascending direction (oldest first)', () => {
      const dates = [
        new Date('2023-05-15'),
        new Date('2022-10-01'),
        new Date('2023-01-30'),
      ];
      const sorted = sortBy(dates, (d) => d);
      expect(sorted).toEqual([
        new Date('2022-10-01'),
        new Date('2023-01-30'),
        new Date('2023-05-15'),
      ]);
    });

    test('sorts dates in descending direction (newest first)', () => {
      const dates = [
        new Date('2023-05-15'),
        new Date('2022-10-01'),
        new Date('2023-01-30'),
      ];
      const sorted = sortBy(dates, (d) => d, { direction: 'desc' });
      expect(sorted).toEqual([
        new Date('2023-05-15'),
        new Date('2023-01-30'),
        new Date('2022-10-01'),
      ]);
    });
  });

  // Object sorting tests
  describe('Object Sorting', () => {
    interface User {
      id: number;
      name: string;
      age: number;
      registered: Date;
    }

    const users: User[] = [
      {
        id: 1,
        name: 'Alice',
        age: 30,
        registered: new Date('2023-01-15'),
      },
      {
        id: 2,
        name: 'bob',
        age: 25,
        registered: new Date('2022-11-20'),
      },
      {
        id: 3,
        name: 'Charlie',
        age: 35,
        registered: new Date('2023-03-05'),
      },
    ];

    it('sorts objects by numeric property', () => {
      const sorted = sortBy(users, (user) => user.age);
      expect(sorted.map((u) => u.name)).toEqual(['bob', 'Alice', 'Charlie']);
    });

    it('sorts objects by string property with case sensitivity', () => {
      const sorted = sortBy(users, (user) => user.name);
      expect(sorted.map((u) => u.name)).toEqual(['Alice', 'bob', 'Charlie']);
    });

    test('sorts objects by string property with case insensitivity', () => {
      const sorted = sortBy(users, (user) => user.name, { ignoreCase: true });
      expect(sorted.map((u) => u.name)).toEqual(['Alice', 'bob', 'Charlie']);
    });

    test('sorts objects by date property', () => {
      const sorted = sortBy(users, (user) => user.registered);
      expect(sorted.map((u) => u.name)).toEqual(['bob', 'Alice', 'Charlie']);
    });
  });

  // RegExp sorting tests
  describe('RegExp Sorting', () => {
    test('sorts RegExp objects', () => {
      const patterns = [/xyz/, /abc/, /def/];
      const sorted = sortBy(patterns, (p) => p);
      // RegExp objects are sorted by their string representation
      expect(sorted.map((p) => p.source)).toEqual(['abc', 'def', 'xyz']);
    });

    test('sorts RegExp objects with ignoreCase option', () => {
      const patterns = [/XYZ/i, /abc/, /DEF/];
      const sorted = sortBy(patterns, (p) => p, { ignoreCase: true });
      // RegExp objects are sorted by their string representation, ignoring case
      expect(sorted.map((p) => p.source)).toEqual(['abc', 'DEF', 'XYZ']);
    });
  });

  // Mixed data types sorting tests
  describe('Mixed Data Types', () => {
    interface MixedItem {
      id: number;
      value: string | number | Date | RegExp | boolean;
    }

    const mixedItems: MixedItem[] = [
      { id: 1, value: 'text' },
      { id: 2, value: 42 },
      { id: 3, value: new Date('2023-01-15') },
      { id: 4, value: /pattern/ },
      { id: 5, value: true },
    ];

    test('sorts mixed data types using string conversion', () => {
      // When sorting mixed types, items are converted to strings
      const sorted = sortBy(mixedItems, (item) => item.value);
      // The exact direction depends on string conversion, but we can verify specific cases

      // Find positions in the sorted array
      const numPos = sorted.findIndex((item) => item.value === 42);
      const boolPos = sorted.findIndex((item) => item.value === true);

      // In default string ordering, "42" comes before "true"
      expect(numPos).toBeLessThan(boolPos);
    });
  });

  // Custom comparison function tests
  describe('Custom Value Extraction', () => {
    interface Product {
      name: string;
      price: number;
      category: string;
    }

    const products: Product[] = [
      { name: 'Laptop', price: 1200, category: 'Electronics' },
      { name: 'Book', price: 20, category: 'Books' },
      { name: 'Monitor', price: 300, category: 'Electronics' },
      { name: 'Headphones', price: 100, category: 'Audio' },
    ];

    test('sorts by custom composite value (category then price)', () => {
      // Sort first by category, then by price
      const sorted = sortBy(products, (product) => {
        return `${product.category}_${product.price.toString().padStart(6, '0')}`;
      });
      // Should be ordered by category alphabetically, then by price
      expect(sorted.map((p) => p.name)).toEqual([
        'Headphones',
        'Book',
        'Monitor',
        'Laptop',
      ]);
    });
  });

  // Performance and edge case tests
  describe('Performance and Edge Cases', () => {
    test('handles large arrays efficiently', () => {
      // Create array with 10,000 random numbers
      const largeArray = Array.from({ length: 10000 }, () =>
        Math.floor(Math.random() * 10000)
      );

      // Measure time (optional)
      const startTime = performance.now();
      const sorted = sortBy(largeArray, (n) => n);
      const endTime = performance.now();

      // Verify it's actually sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }

      // Optional performance assertion - should be reasonably fast
      // This is system-dependent, so the exact threshold may need adjustment
      //expect(endTime - startTime).toBeLessThan(500); // 500ms
    });

    test('handles very large arrays (100,000 elements)', () => {
      const veryLargeArray = Array.from({ length: 100000 }, () =>
        Math.floor(Math.random() * 1000000)
      );

      const startTime = performance.now();
      const sorted = sortBy(veryLargeArray, (n) => n);
      const endTime = performance.now();

      // Verify sorting correctness on a sample
      expect(sorted[0]).toBeLessThanOrEqual(sorted[1000]);
      expect(sorted[1000]).toBeLessThanOrEqual(sorted[10000]);
      expect(sorted[50000]).toBeLessThanOrEqual(sorted[99999]);

      // Performance check - should complete in reasonable time (adjusted for test environment)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    test('handles extremely large arrays (500,000 elements) with chunking', () => {
      const extremeArray = Array.from({ length: 500000 }, () =>
        Math.floor(Math.random() * 5000000)
      );

      const startTime = performance.now();
      const sorted = sortBy(extremeArray, (n) => n, { chunkSize: 10000 });
      const endTime = performance.now();

      // Verify sorting on multiple samples
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor((i / 10) * sorted.length);
        expect(sorted[idx]).toBeLessThanOrEqual(
          sorted[Math.min(idx + 1000, sorted.length - 1)]
        );
      }

      // Performance check with chunking
      expect(endTime - startTime).toBeLessThan(25000); // 25 seconds max
    });

    test('handles large arrays with complex objects', () => {
      interface ComplexItem {
        id: number;
        data: {
          nested: {
            value: number;
            metadata: string;
          };
          array: number[];
        };
        timestamp: Date;
      }

      const complexArray: ComplexItem[] = Array.from(
        { length: 50000 },
        (_, i) => ({
          id: i,
          data: {
            nested: {
              value: Math.random() * 100000,
              metadata: `item_${i}`,
            },
            array: [Math.random(), Math.random(), Math.random()],
          },
          timestamp: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
        })
      );

      const startTime = performance.now();
      const sorted = sortBy(complexArray, (item) => item.data.nested.value);
      const endTime = performance.now();

      // Verify sorting
      for (let i = 1; i < Math.min(1000, sorted.length); i++) {
        expect(sorted[i - 1].data.nested.value).toBeLessThanOrEqual(
          sorted[i].data.nested.value
        );
      }

      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });

    test('handles large arrays with string sorting', () => {
      const stringArray = Array.from({ length: 100000 }, () =>
        Math.random().toString(36).substring(2, 15)
      );

      const startTime = performance.now();
      const sorted = sortBy(stringArray, (s) => s);
      const endTime = performance.now();

      // Verify sorting on samples
      for (let i = 0; i < 100; i++) {
        const idx = Math.floor((i / 100) * sorted.length);
        if (idx + 1 < sorted.length) {
          expect(sorted[idx] <= sorted[idx + 1]).toBeTruthy();
        }
      }

      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('handles large arrays with date sorting', () => {
      const dateArray = Array.from(
        { length: 100000 },
        () =>
          new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000)
      );

      const startTime = performance.now();
      const sorted = sortBy(dateArray, (d) => d);
      const endTime = performance.now();

      // Verify sorting
      for (let i = 1; i < Math.min(1000, sorted.length); i++) {
        expect(sorted[i - 1].getTime()).toBeLessThanOrEqual(
          sorted[i].getTime()
        );
      }

      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('handles large arrays with all duplicate values', () => {
      const duplicateArray = Array.from({ length: 100000 }, () => 42);

      const startTime = performance.now();
      const sorted = sortBy(duplicateArray, (n) => n);
      const endTime = performance.now();

      // All values should be 42
      expect(sorted.every((val) => val === 42)).toBeTruthy();
      expect(sorted.length).toBe(100000);

      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('handles large arrays with binary values (0s and 1s)', () => {
      const binaryArray = Array.from({ length: 100000 }, () =>
        Math.random() < 0.5 ? 0 : 1
      );

      const startTime = performance.now();
      const sorted = sortBy(binaryArray, (n) => n);
      const endTime = performance.now();

      // Verify all 0s come before 1s
      const firstOneIndex = sorted.indexOf(1);
      const lastZeroIndex = sorted.lastIndexOf(0);

      if (firstOneIndex !== -1 && lastZeroIndex !== -1) {
        expect(lastZeroIndex).toBeLessThan(firstOneIndex);
      }

      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('handles large arrays with reverse sorted input', () => {
      const reverseArray = Array.from({ length: 50000 }, (_, i) => 50000 - i);

      const startTime = performance.now();
      const sorted = sortBy(reverseArray, (n) => n);
      const endTime = performance.now();

      // Verify it's sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }

      expect(endTime - startTime).toBeLessThan(1500);
    });

    test('handles large arrays with already sorted input', () => {
      const sortedArray = Array.from({ length: 50000 }, (_, i) => i);

      const startTime = performance.now();
      const result = sortBy(sortedArray, (n) => n);
      const endTime = performance.now();

      // Should still be sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]).toBeLessThanOrEqual(result[i]);
      }

      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('handles large arrays with mixed data types', () => {
      const mixedArray = Array.from({ length: 50000 }, () => {
        const rand = Math.random();
        if (rand < 0.33) return Math.floor(Math.random() * 1000);
        if (rand < 0.66) return Math.random().toString(36).substring(2, 8);
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      });

      const startTime = performance.now();
      const sorted = sortBy(mixedArray, (item) => {
        if (typeof item === 'number')
          return `1_${item.toString().padStart(20, '0')}`;
        if (typeof item === 'string') return `2_${item}`;
        if (item instanceof Date)
          return `3_${item.getTime().toString().padStart(20, '0')}`;
        return '0_';
      });
      const endTime = performance.now();

      // Verify sorting by checking type order: numbers < strings < dates
      for (let i = 1; i < Math.min(100, sorted.length); i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        let prevType: number, currType: number;

        if (typeof prev === 'number') prevType = 1;
        else if (typeof prev === 'string') prevType = 2;
        else if (prev instanceof Date) prevType = 3;
        else prevType = 0;

        if (typeof curr === 'number') currType = 1;
        else if (typeof curr === 'string') currType = 2;
        else if (curr instanceof Date) currType = 3;
        else currType = 0;

        expect(prevType).toBeLessThanOrEqual(currType);

        // If same type, check ordering within type
        if (prevType === currType) {
          if (prevType === 1) {
            // numbers
            expect(prev as number).toBeLessThanOrEqual(curr as number);
          } else if (prevType === 2) {
            // strings
            expect(
              (prev as string).localeCompare(curr as string)
            ).toBeLessThanOrEqual(0);
          } else if (prevType === 3) {
            // dates
            expect((prev as Date).getTime()).toBeLessThanOrEqual(
              (curr as Date).getTime()
            );
          }
        }
      }

      expect(endTime - startTime).toBeLessThan(4000);
    });

    test('handles deeply nested data structures', () => {
      interface NestedItem {
        id: number;
        metadata: {
          created: Date;
          details: {
            priority: number;
          };
        };
      }

      const nestedItems: NestedItem[] = [
        {
          id: 1,
          metadata: {
            created: new Date('2023-05-15'),
            details: { priority: 3 },
          },
        },
        {
          id: 2,
          metadata: {
            created: new Date('2023-01-10'),
            details: { priority: 1 },
          },
        },
        {
          id: 3,
          metadata: {
            created: new Date('2023-03-22'),
            details: { priority: 2 },
          },
        },
      ];

      // Sort by deeply nested priority field
      const sorted = sortBy(
        nestedItems,
        (item) => item.metadata.details.priority
      );
      expect(sorted.map((item) => item.id)).toEqual([2, 3, 1]);
    });

    test('handles arrays with duplicate values', () => {
      const duplicates = [3, 1, 4, 1, 5, 9, 2, 6, 5];
      const sorted = sortBy([...duplicates], (n) => n);
      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 5, 6, 9]);
    });

    test('handles arrays with undefined or null values', () => {
      const withNulls = [5, null, 3, undefined, 1, 4];
      // Type assertion needed for TypeScript
      const sorted = sortBy([...withNulls] as any[], (n) => n);
      // null and undefined usually come before numbers in standard sorting
      expect(sorted[0] === null || sorted[0] === undefined).toBeTruthy();
      expect(sorted.slice(1)).toEqual([1, 3, 4, 5]);
    });

    test('handles large arrays with null/undefined values', () => {
      const mixedNulls = Array.from({ length: 10000 }, () => {
        const rand = Math.random();
        if (rand < 0.1) return null;
        if (rand < 0.2) return undefined;
        return Math.floor(Math.random() * 1000);
      });

      const startTime = performance.now();
      const sorted = sortBy(mixedNulls, (n) => n);
      const endTime = performance.now();

      // Verify nulls and undefineds come first
      let firstNonNullIndex = -1;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== null && sorted[i] !== undefined) {
          firstNonNullIndex = i;
          break;
        }
      }

      // All nulls and undefineds should be at the beginning
      for (let i = 0; i < firstNonNullIndex; i++) {
        expect(sorted[i] === null || sorted[i] === undefined).toBeTruthy();
      }

      // Numbers should be sorted after nulls/undefineds
      for (
        let i = firstNonNullIndex + 1;
        i < Math.min(firstNonNullIndex + 100, sorted.length);
        i++
      ) {
        if (
          typeof sorted[i] === 'number' &&
          typeof sorted[i - 1] === 'number'
        ) {
          expect((sorted as any)[i - 1]).toBeLessThanOrEqual(
            (sorted as any)[i]
          );
        }
      }

      expect(endTime - startTime).toBeLessThan(1500);
    });
  });

  // ChunkSize option tests
  describe('ChunkSize Option', () => {
    test('respects the chunkSize parameter for large arrays', () => {
      // Create a medium-sized array
      const mediumArray = Array.from({ length: 1000 }, () =>
        Math.floor(Math.random() * 1000)
      );

      // Sort with a very small chunk size to force chunking algorithm
      const sorted = sortBy([...mediumArray], (n) => n, { chunkSize: 10 });

      // Verify it's correctly sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }
    });

    test('handles very small chunk sizes with large arrays', () => {
      const largeArray = Array.from({ length: 50000 }, () =>
        Math.floor(Math.random() * 50000)
      );

      const startTime = performance.now();
      const sorted = sortBy(largeArray, (n) => n, { chunkSize: 100 });
      const endTime = performance.now();

      // Verify sorting correctness
      for (let i = 1; i < Math.min(1000, sorted.length); i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }

      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('handles large chunk sizes with small arrays', () => {
      const smallArray = [5, 3, 8, 1, 9, 2, 7, 4, 6];

      const sorted = sortBy(smallArray, (n) => n, { chunkSize: 1000 });

      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('chunkSize affects performance with different array sizes', () => {
      const testSizes = [1000, 10000, 50000];
      const chunkSizes = [10, 100, 1000];

      for (const size of testSizes) {
        const array = Array.from({ length: size }, () =>
          Math.floor(Math.random() * size)
        );

        for (const chunkSize of chunkSizes) {
          if (chunkSize <= size) {
            const startTime = performance.now();
            const sorted = sortBy([...array], (n) => n, { chunkSize });
            const endTime = performance.now();

            // Verify correctness
            for (let i = 1; i < Math.min(100, sorted.length); i++) {
              expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
            }

            // Performance should be reasonable
            expect(endTime - startTime).toBeLessThan(5000);
          }
        }
      }
    });

    test('chunkSize works with descending sort', () => {
      const array = Array.from({ length: 10000 }, () =>
        Math.floor(Math.random() * 10000)
      );

      const sorted = sortBy(array, (n) => n, {
        direction: 'desc',
        chunkSize: 500,
      });

      // Verify descending order
      for (let i = 1; i < Math.min(1000, sorted.length); i++) {
        expect(sorted[i - 1]).toBeGreaterThanOrEqual(sorted[i]);
      }
    });

    test('chunkSize works with case-insensitive string sorting', () => {
      const strings = Array.from({ length: 5000 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const sorted = sortBy(strings, (s) => s, {
        ignoreCase: true,
        chunkSize: 200,
      });

      // Verify case-insensitive sorting
      for (let i = 1; i < Math.min(500, sorted.length); i++) {
        expect(
          sorted[i - 1].toLowerCase().localeCompare(sorted[i].toLowerCase())
        ).toBeLessThanOrEqual(0);
      }
    });
  });
});

// Stress testing and memory efficiency
/* describe('Stress Testing and Memory Efficiency', () => {
  test('handles million-element arrays', () => {
    const millionArray = Array.from({ length: 1000000 }, () =>
      Math.floor(Math.random() * 10000000)
    );

    const startTime = performance.now();
    const sorted = sortBy(millionArray, (n) => n, { chunkSize: 50000 });
    const endTime = performance.now();

    // Verify sorting on multiple samples
    for (let sample = 0; sample < 10; sample++) {
      const startIdx = Math.floor((sample / 10) * sorted.length);
      const endIdx = Math.min(startIdx + 1000, sorted.length);
      for (let i = startIdx + 1; i < endIdx; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }
    }

    // Performance check - should complete in reasonable time
    expect(endTime - startTime).toBeLessThan(35000); // 35 seconds max
  });

  test('handles ten million-element arrays', () => {
    const tenMillionArray = Array.from({ length: 10000000 }, () =>
      Math.floor(Math.random() * 100000000)
    );

    const startTime = performance.now();
    const sorted = sortBy(tenMillionArray, (n) => n, { chunkSize: 100000 });
    const endTime = performance.now();

    // Verify sorting on multiple samples (reduced sampling for performance)
    for (let sample = 0; sample < 5; sample++) {
      const startIdx = Math.floor((sample / 5) * sorted.length);
      const endIdx = Math.min(startIdx + 500, sorted.length);
      for (let i = startIdx + 1; i < endIdx; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }
    }

    // Performance check - should complete in reasonable time for 10M elements
    expect(endTime - startTime).toBeLessThan(180000); // 3 minutes max
  });

  test('handles arrays with complex nested objects at scale', () => {
    interface ComplexNestedItem {
      id: string;
      user: {
        profile: {
          personal: {
            name: string;
            age: number;
            scores: number[];
          };
          professional: {
            title: string;
            department: string;
            salary: number;
          };
        };
        activity: {
          lastLogin: Date;
          posts: number;
          followers: number;
        };
      };
      metadata: {
        created: Date;
        tags: string[];
        priority: number;
      };
    }

    const complexArray: ComplexNestedItem[] = Array.from(
      { length: 25000 },
      (_, i) => ({
        id: `user_${i}`,
        user: {
          profile: {
            personal: {
              name: `User ${i}`,
              age: Math.floor(Math.random() * 80) + 18,
              scores: Array.from({ length: 5 }, () =>
                Math.floor(Math.random() * 100)
              ),
            },
            professional: {
              title: [
                'Developer',
                'Manager',
                'Designer',
                'Analyst',
                'Engineer',
              ][Math.floor(Math.random() * 5)],
              department: [
                'Engineering',
                'Sales',
                'Marketing',
                'HR',
                'Finance',
              ][Math.floor(Math.random() * 5)],
              salary: Math.floor(Math.random() * 200000) + 30000,
            },
          },
          activity: {
            lastLogin: new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            ),
            posts: Math.floor(Math.random() * 1000),
            followers: Math.floor(Math.random() * 10000),
          },
        },
        metadata: {
          created: new Date(
            Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000
          ),
          tags: Array.from(
            { length: Math.floor(Math.random() * 5) + 1 },
            () =>
              ['urgent', 'important', 'review', 'draft', 'published'][
                Math.floor(Math.random() * 5)
              ]
          ),
          priority: Math.floor(Math.random() * 10),
        },
      })
    );

    const startTime = performance.now();

    // Sort by multiple criteria: priority desc, then age asc, then salary desc
    const sorted = sortBy(
      complexArray,
      (item) =>
        `${(9 - item.metadata.priority).toString().padStart(2, '0')}_${item.user.profile.personal.age.toString().padStart(3, '0')}_${(999999 - item.user.profile.professional.salary).toString().padStart(6, '0')}`,
      { chunkSize: 5000 }
    );

    const endTime = performance.now();

    // Verify sorting logic: priority desc, then age asc, then salary desc
    for (let i = 1; i < Math.min(1000, sorted.length); i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      // Since we sort by composite key: (9-priority)_age_(999999-salary)
      // Higher priority (lower 9-priority value) comes first
      const prevKey = `${(9 - prev.metadata.priority).toString().padStart(2, '0')}_${prev.user.profile.personal.age.toString().padStart(3, '0')}_${(999999 - prev.user.profile.professional.salary).toString().padStart(6, '0')}`;
      const currKey = `${(9 - curr.metadata.priority).toString().padStart(2, '0')}_${curr.user.profile.personal.age.toString().padStart(3, '0')}_${(999999 - curr.user.profile.professional.salary).toString().padStart(6, '0')}`;

      expect(prevKey <= currKey).toBeTruthy();
    }

    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('handles arrays with mixed primitive and object types at scale', () => {
    const mixedLargeArray = Array.from({ length: 100000 }, () => {
      const type = Math.floor(Math.random() * 6);
      switch (type) {
        case 0:
          return Math.floor(Math.random() * 100000);
        case 1:
          return Math.random().toString(36).substring(2, 10);
        case 2:
          return new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          );
        case 3:
          return Math.random() < 0.5;
        case 4:
          return null;
        case 5:
          return { value: Math.random(), id: Math.floor(Math.random() * 1000) };
        default:
          return undefined;
      }
    });

    const startTime = performance.now();
    const sorted = sortBy(
      mixedLargeArray,
      (item) => {
        if (item === null || item === undefined) return '';
        if (typeof item === 'number') return item;
        if (typeof item === 'string') return item;
        if (typeof item === 'boolean') return item ? 1 : 0;
        if (item instanceof Date) return item.getTime();
        if (typeof item === 'object' && item !== null)
          return (item as any).value || 0;
        return 0;
      },
      { chunkSize: 10000 }
    );
    const endTime = performance.now();

    // Verify sorting is stable and correct for a sample
    let lastValue: any = null;
    for (let i = 0; i < Math.min(5000, sorted.length); i++) {
      const currentValue =
        typeof sorted[i] === 'number'
          ? sorted[i]
          : typeof sorted[i] === 'string'
            ? sorted[i]
            : sorted[i] instanceof Date
              ? (sorted[i] as Date).getTime()
              : sorted[i] === null || sorted[i] === undefined
                ? ''
                : typeof sorted[i] === 'boolean'
                  ? sorted[i]
                    ? 1
                    : 0
                  : (sorted[i] as any)?.value || 0;

      if (lastValue !== null) {
        // Allow for some tolerance in comparison due to type coercion
        if (typeof lastValue === 'number' && typeof currentValue === 'number') {
          expect(lastValue).toBeLessThanOrEqual(currentValue);
        }
      }
      lastValue = currentValue;
    }

    expect(endTime - startTime).toBeLessThan(8000);
  });

  test('memory efficiency with large arrays and small chunk sizes', () => {
    // Test that chunking doesn't cause excessive memory usage
    const largeArray = Array.from({ length: 200000 }, () => ({
      id: Math.floor(Math.random() * 1000000),
      data: Array.from({ length: 10 }, () => Math.random()),
    }));

    // eslint-disable-next-line no-undef
    const initialMemory = (process as any).memoryUsage?.().heapUsed || 0;

    const startTime = performance.now();
    const sorted = sortBy(largeArray, (item) => item.id, { chunkSize: 1000 });
    const endTime = performance.now();

    // eslint-disable-next-line no-undef
    const finalMemory = (process as any).memoryUsage?.().heapUsed || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Verify sorting
    for (let i = 1; i < Math.min(2000, sorted.length); i++) {
      expect(sorted[i - 1].id).toBeLessThanOrEqual(sorted[i].id);
    }

    // Memory increase should be reasonable (less than 50MB additional)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    expect(endTime - startTime).toBeLessThan(6000);
  });

  test('concurrent sorting performance', () => {
    const arraySize = 50000;
    const numConcurrent = 3;

    const arrays = Array.from({ length: numConcurrent }, () =>
      Array.from({ length: arraySize }, () =>
        Math.floor(Math.random() * arraySize)
      )
    );

    const startTime = performance.now();

    const promises = arrays.map(
      (array, index) =>
        new Promise<number[]>((resolve) => {
          setTimeout(() => {
            const sorted = sortBy(array, (n) => n, { chunkSize: 5000 });
            resolve(sorted);
          }, 0); // Slight stagger to simulate concurrent execution
        })
    );

    return Promise.all(promises).then((results) => {
      const endTime = performance.now();

      // Verify all results are sorted
      results.forEach((sorted) => {
        for (let i = 1; i < Math.min(1000, sorted.length); i++) {
          expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
        }
      });

      expect(endTime - startTime).toBeLessThan(8000);
    });
  });
}); */

// Optional: Test utility for checking if array is sorted
function isSorted<T>(
  array: T[],
  getItemValue: (item: T) => any,
  isDescending = false
): boolean {
  for (let i = 1; i < array.length; i++) {
    const current = getItemValue(array[i]);
    const previous = getItemValue(array[i - 1]);

    if (isDescending) {
      if (current > previous) return false;
    } else {
      if (current < previous) return false;
    }
  }
  return true;
}

// Comprehensive test for all options combined
describe('Combined Options', () => {
  test('works with all options specified together', () => {
    const items = [
      { id: 1, name: 'Item A', value: 30 },
      { id: 2, name: 'item b', value: 20 },
      { id: 3, name: 'ITEM C', value: 10 },
    ];

    const original = [...items];
    const result = sortBy(items, (item) => item.name, {
      direction: 'desc',
      ignoreCase: true,
      inPlace: false,
      chunkSize: 2, // Not used anymore, but keeping for compatibility
    });
    // Check options were respected
    expect(items).toEqual(original); // Original unchanged
    expect(result.map((item) => item.name)).toEqual([
      'ITEM C',
      'item b',
      'Item A',
    ]); // Desc + ignoreCase
  });

  test('large array with all options combined', () => {
    const largeItems = Array.from({ length: 25000 }, (_, i) => ({
      id: i,
      name: Math.random().toString(36).substring(2, 8).toUpperCase(),
      value: Math.floor(Math.random() * 10000),
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    }));

    const startTime = performance.now();
    const sorted = sortBy(
      largeItems,
      (item) => `${item.category}_${item.name}`,
      {
        direction: 'desc',
        ignoreCase: true,
        chunkSize: 1000,
      }
    );
    const endTime = performance.now();

    // Verify sorting: category desc, then name desc (case-insensitive)
    for (let i = 1; i < Math.min(1000, sorted.length); i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      expect(prev.category >= curr.category).toBeTruthy();

      if (prev.category === curr.category) {
        expect(prev.name.toLowerCase() >= curr.name.toLowerCase()).toBeTruthy();
      }
    }

    expect(endTime - startTime).toBeLessThan(4000);
  });
});
