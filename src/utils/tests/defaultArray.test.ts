import { defaultArray } from '../defaultArray';

describe('defaultArray', () => {
  describe('single argument', () => {
    it('should return the array if argument is an array', () => {
      expect(defaultArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(defaultArray([])).toEqual([]);
      expect(defaultArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('should return empty array if argument is not an array', () => {
      expect(defaultArray(42)).toEqual([]);
      expect(defaultArray('string')).toEqual([]);
      expect(defaultArray(null)).toEqual([]);
      expect(defaultArray(undefined)).toEqual([]);
      expect(defaultArray({})).toEqual([]);
      expect(defaultArray(true)).toEqual([]);
      expect(defaultArray(false)).toEqual([]);
    });

    it('should handle edge cases', () => {
      expect(defaultArray(NaN)).toEqual([]);
      expect(defaultArray(Infinity)).toEqual([]);
      expect(defaultArray(-Infinity)).toEqual([]);
    });
  });

  describe('multiple arguments', () => {
    it('should return the first non-empty array', () => {
      expect(defaultArray([], [1, 2, 3])).toEqual([1, 2, 3]);
      expect(defaultArray([1, 2], [4, 5, 6])).toEqual([1, 2]);
      expect(defaultArray([], [], [7, 8, 9])).toEqual([7, 8, 9]);
    });

    it('should return the first array if all arrays are empty', () => {
      expect(defaultArray([], [])).toEqual([]);
      expect(defaultArray([], [], [])).toEqual([]);
    });

    it('should skip non-array arguments and find first non-empty array', () => {
      expect(defaultArray(42, [], [1, 2, 3])).toEqual([1, 2, 3]);
      expect(defaultArray('string', null, [], [4, 5])).toEqual([4, 5]);
      expect(defaultArray({}, undefined, [], [])).toEqual([]);
    });

    it('should return empty array if no arrays are provided', () => {
      expect(defaultArray(1, 2, 3)).toEqual([]);
      expect(defaultArray('a', 'b', 'c')).toEqual([]);
      expect(defaultArray(null, undefined)).toEqual([]);
    });

    it('should handle mixed types', () => {
      expect(defaultArray(42, [1, 2], 'string')).toEqual([1, 2]);
      expect(defaultArray([], 42, [3, 4])).toEqual([3, 4]);
      expect(defaultArray(null, [], undefined, [5, 6])).toEqual([5, 6]);
    });
  });

  describe('type safety', () => {
    it('should maintain type information', () => {
      const result: number[] = defaultArray([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);

      const result2: string[] = defaultArray(['a', 'b']);
      expect(result2).toEqual(['a', 'b']);
    });

    it('should handle generic types', () => {
      const result = defaultArray<number>([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);

      const result2 = defaultArray<string>(['a', 'b']);
      expect(result2).toEqual(['a', 'b']);
    });
  });

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      expect(defaultArray()).toEqual([]);
    });

    it('should handle sparse arrays', () => {
      // eslint-disable-next-line no-sparse-arrays
      expect(defaultArray([1, , 3])).toEqual([1, undefined, 3]);
    });

    it('should handle arrays with different types', () => {
      expect(defaultArray([1, 'a', true])).toEqual([1, 'a', true]);
    });

    it('should handle nested arrays', () => {
      expect(
        defaultArray([
          [1, 2],
          [3, 4],
        ])
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
      expect(defaultArray([], [[1, 2]])).toEqual([[1, 2]]);
    });
  });
});
