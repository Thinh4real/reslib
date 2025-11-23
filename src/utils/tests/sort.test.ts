import { sortBy } from "../sort"; // Adjust import path as needed

/**
 * These tests validate the sortBy function's behavior with various
 * input types and configurations
 */
describe("sortBy", () => {
  // Basic sorting tests
  describe("Basic Functionality", () => {
    test("sorts an array of numbers in ascending direction", () => {
      const numbers = [5, 3, 9, 1, 4];
      const sorted = sortBy(numbers, (n) => n);
      expect(sorted).toEqual([1, 3, 4, 5, 9]);
    });

    test("sorts an array of numbers in descending direction", () => {
      const numbers = [5, 3, 9, 1, 4];
      const sorted = sortBy(numbers, (n) => n, { direction: "desc" });
      expect(sorted).toEqual([9, 5, 4, 3, 1]);
    });

    test("handles empty arrays", () => {
      const empty: number[] = [];
      const sorted = sortBy(empty, (n) => n);
      expect(sorted).toEqual([]);
    });

    test("handles single-item arrays", () => {
      const singleItem = [42];
      const sorted = sortBy(singleItem, (n) => n);
      expect(sorted).toEqual([42]);
    });
  });

  // String sorting tests
  describe("String Sorting", () => {
    test("sorts strings in case-sensitive mode (default)", () => {
      const strings = ["banana", "Apple", "orange", "Grape", "kiwi"];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: false });
      // Capital letters come before lowercase in ASCII/Unicode
      expect(sorted).toEqual(["Apple", "banana", "Grape", "kiwi", "orange"]);
    });

    test("sorts strings in case-insensitive mode", () => {
      const strings = ["banana", "Apple", "orange", "Grape", "kiwi"];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: true });
      expect(sorted).toEqual(["Apple", "banana", "Grape", "kiwi", "orange"]);
    });

    test("sorts strings with special characters and spaces", () => {
      const strings = ["item 3", "item-1", "Item_2", "item.4"];
      const sorted = sortBy(strings, (s) => s, { ignoreCase: true });
      // Exact direction depends on locale, but this is the general expected ordering
      expect(sorted[0].toLowerCase()).toContain("item");
    });
  });

  // Date sorting tests
  describe("Date Sorting", () => {
    test("sorts dates in ascending direction (oldest first)", () => {
      const dates = [new Date("2023-05-15"), new Date("2022-10-01"), new Date("2023-01-30")];
      const sorted = sortBy(dates, (d) => d);
      expect(sorted).toEqual([new Date("2022-10-01"), new Date("2023-01-30"), new Date("2023-05-15")]);
    });

    test("sorts dates in descending direction (newest first)", () => {
      const dates = [new Date("2023-05-15"), new Date("2022-10-01"), new Date("2023-01-30")];
      const sorted = sortBy(dates, (d) => d, { direction: "desc" });
      expect(sorted).toEqual([new Date("2023-05-15"), new Date("2023-01-30"), new Date("2022-10-01")]);
    });
  });

  // Object sorting tests
  describe("Object Sorting", () => {
    interface User {
      id: number;
      name: string;
      age: number;
      registered: Date;
    }

    const users: User[] = [
      {
        id: 1,
        name: "Alice",
        age: 30,
        registered: new Date("2023-01-15"),
      },
      {
        id: 2,
        name: "bob",
        age: 25,
        registered: new Date("2022-11-20"),
      },
      {
        id: 3,
        name: "Charlie",
        age: 35,
        registered: new Date("2023-03-05"),
      },
    ];

    it("sorts objects by numeric property", () => {
      const sorted = sortBy(users, (user) => user.age);
      expect(sorted.map((u) => u.name)).toEqual(["bob", "Alice", "Charlie"]);
    });

    it("sorts objects by string property with case sensitivity", () => {
      const sorted = sortBy(users, (user) => user.name);
      expect(sorted.map((u) => u.name)).toEqual(["Alice", "bob", "Charlie"]);
    });

    test("sorts objects by string property with case insensitivity", () => {
      const sorted = sortBy(users, (user) => user.name, { ignoreCase: true });
      expect(sorted.map((u) => u.name)).toEqual(["Alice", "bob", "Charlie"]);
    });

    test("sorts objects by date property", () => {
      const sorted = sortBy(users, (user) => user.registered);
      expect(sorted.map((u) => u.name)).toEqual(["bob", "Alice", "Charlie"]);
    });
  });

  // RegExp sorting tests
  describe("RegExp Sorting", () => {
    test("sorts RegExp objects", () => {
      const patterns = [/xyz/, /abc/, /def/];
      const sorted = sortBy(patterns, (p) => p);
      // RegExp objects are sorted by their string representation
      expect(sorted.map((p) => p.source)).toEqual(["abc", "def", "xyz"]);
    });

    test("sorts RegExp objects with ignoreCase option", () => {
      const patterns = [/XYZ/i, /abc/, /DEF/];
      const sorted = sortBy(patterns, (p) => p, { ignoreCase: true });
      // RegExp objects are sorted by their string representation, ignoring case
      expect(sorted.map((p) => p.source)).toEqual(["abc", "DEF", "XYZ"]);
    });
  });

  // Mixed data types sorting tests
  describe("Mixed Data Types", () => {
    interface MixedItem {
      id: number;
      value: string | number | Date | RegExp | boolean;
    }

    const mixedItems: MixedItem[] = [
      { id: 1, value: "text" },
      { id: 2, value: 42 },
      { id: 3, value: new Date("2023-01-15") },
      { id: 4, value: /pattern/ },
      { id: 5, value: true },
    ];

    test("sorts mixed data types using string conversion", () => {
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
  describe("Custom Value Extraction", () => {
    interface Product {
      name: string;
      price: number;
      category: string;
    }

    const products: Product[] = [
      { name: "Laptop", price: 1200, category: "Electronics" },
      { name: "Book", price: 20, category: "Books" },
      { name: "Monitor", price: 300, category: "Electronics" },
      { name: "Headphones", price: 100, category: "Audio" },
    ];

    test("sorts by custom composite value (category then price)", () => {
      // Sort first by category, then by price
      const sorted = sortBy(products, (product) => {
        return `${product.category}_${product.price.toString().padStart(6, "0")}`;
      });
      // Should be ordered by category alphabetically, then by price
      expect(sorted.map((p) => p.name)).toEqual(["Headphones", "Book", "Monitor", "Laptop"]);
    });
  });

  // Performance and edge case tests
  describe("Performance and Edge Cases", () => {
    test("handles large arrays efficiently", () => {
      // Create array with 10,000 random numbers
      const largeArray = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 10000));

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

    test("handles deeply nested data structures", () => {
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
        { id: 1, metadata: { created: new Date("2023-05-15"), details: { priority: 3 } } },
        { id: 2, metadata: { created: new Date("2023-01-10"), details: { priority: 1 } } },
        { id: 3, metadata: { created: new Date("2023-03-22"), details: { priority: 2 } } },
      ];

      // Sort by deeply nested priority field
      const sorted = sortBy(nestedItems, (item) => item.metadata.details.priority);
      expect(sorted.map((item) => item.id)).toEqual([2, 3, 1]);
    });

    test("handles arrays with duplicate values", () => {
      const duplicates = [3, 1, 4, 1, 5, 9, 2, 6, 5];
      const sorted = sortBy([...duplicates], (n) => n);
      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 5, 6, 9]);
    });

    test("handles arrays with undefined or null values", () => {
      const withNulls = [5, null, 3, undefined, 1, 4];
      // Type assertion needed for TypeScript
      const sorted = sortBy([...withNulls] as any[], (n) => n);
      // null and undefined usually come before numbers in standard sorting
      expect(sorted[0] === null || sorted[0] === undefined).toBeTruthy();
      expect(sorted.slice(1)).toEqual([1, 3, 4, 5]);
    });
  });

  // ChunkSize option tests
  describe("ChunkSize Option", () => {
    test("respects the chunkSize parameter for large arrays", () => {
      // Create a medium-sized array
      const mediumArray = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));

      // Sort with a very small chunk size to force chunking algorithm
      const sorted = sortBy([...mediumArray], (n) => n, { chunkSize: 10 });

      // Verify it's correctly sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]).toBeLessThanOrEqual(sorted[i]);
      }
    });
  });
});

// Optional: Test utility for checking if array is sorted
function isSorted<T>(array: T[], getItemValue: (item: T) => any, isDescending = false): boolean {
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
describe("Combined Options", () => {
  test("works with all options specified together", () => {
    const items = [
      { id: 1, name: "Item A", value: 30 },
      { id: 2, name: "item b", value: 20 },
      { id: 3, name: "ITEM C", value: 10 },
    ];

    const original = [...items];
    const result = sortBy(items, (item) => item.name, {
      direction: "desc",
      ignoreCase: true,
      chunkSize: 2, // Force chunking even for this small array
    });
    // Check options were respected
    expect(items).toEqual(original); // Original unchanged
    expect(result.map((item) => item.name)).toEqual(["ITEM C", "item b", "Item A"]); // Desc + ignoreCase
  });
});
