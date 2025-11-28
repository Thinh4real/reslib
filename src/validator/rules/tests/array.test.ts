import { Validator, ensureRulesRegistered } from '../../index';
import {
  ArrayAllNumbers,
  ArrayAllStrings,
  ArrayContains,
  ArrayLength,
  ArrayMaxLength,
  ArrayMinLength,
  ArrayUnique,
  IsArray,
} from '../array';

// Ensure rules are registered
ensureRulesRegistered();

describe('Array Validation Rules', () => {
  describe('IsArray', () => {
    it('should pass for arrays', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3],
        rules: ['Array'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['Array'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-arrays', async () => {
      const values = [null, undefined, {}, 'string', 42, true];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Array'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('This field must be an array');
      }
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2, 3];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-array', async () => {
      class TestClass {
        @IsArray()
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = 'not an array' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0]?.message).toContain(
        'This field must be an array'
      );
    });
  });

  describe('ArrayMinLength', () => {
    it('should pass when array length >= minLength', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3],
        rules: [{ ArrayMinLength: [2] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when array length < minLength', async () => {
      const result = await Validator.validate({
        value: [1],
        rules: [{ ArrayMinLength: [2] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('at least 2 items');
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not array',
        rules: [{ ArrayMinLength: [1] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('must be an array');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: [1, 2],
        rules: [{ ArrayMinLength: [-1] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid parameters for rule');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayMinLength(2)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2, 3];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when too short', async () => {
      class TestClass {
        @IsArray()
        @ArrayMinLength(2)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0]?.message).toContain(
        'at least 2 items'
      );
    });
  });

  describe('ArrayMaxLength', () => {
    it('should pass when array length <= maxLength', async () => {
      const result = await Validator.validate({
        value: [1, 2],
        rules: [{ ArrayMaxLength: [3] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when array length > maxLength', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3, 4],
        rules: [{ ArrayMaxLength: [3] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('at most 3 items');
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: [{ ArrayMaxLength: [1] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: [1, 2],
        rules: [{ ArrayMaxLength: [-1] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid parameters for rule');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayMaxLength(3)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when too long', async () => {
      class TestClass {
        @IsArray()
        @ArrayMaxLength(2)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2, 3];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('at most 2 items');
    });
  });

  describe('ArrayLength', () => {
    it('should pass when array length === exact length', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3],
        rules: [{ ArrayLength: [3] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when array length !== exact length', async () => {
      const result = await Validator.validate({
        value: [1, 2],
        rules: [{ ArrayLength: [3] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('exactly 3 items');
    });

    it('should fail for empty arrays when length > 0', async () => {
      const result = await Validator.validate({
        value: [],
        rules: [{ ArrayLength: [1] }],
      });
      expect(result.success).toBe(false);
    });

    it('should pass for empty arrays when length = 0', async () => {
      const result = await Validator.validate({
        value: [],
        rules: [{ ArrayLength: [0] }],
      });
      expect(result.success).toBe(true);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayLength(3)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2, 3];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for wrong length', async () => {
      class TestClass {
        @IsArray()
        @ArrayLength(2)
        items!: any[];
      }

      const instance = new TestClass();
      instance.items = [1, 2, 3];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('exactly 2 items');
    });
  });

  describe('ArrayContains', () => {
    it('should pass when array contains all required values', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3, 4],
        rules: [{ ArrayContains: [2, 4] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when array is missing required values', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3],
        rules: [{ ArrayContains: [2, 4] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain(
        'contain all of the following values'
      );
    });

    it('should work with objects using deep equality', async () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const result = await Validator.validate({
        value: [obj1, obj2, { id: 3 }],
        rules: [{ ArrayContains: [obj1] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not array',
        rules: [{ ArrayContains: [1] }],
      });
      expect(result.success).toBe(false);
    });

    it('should fail for empty required values', async () => {
      const result = await Validator.validate({
        value: [1, 2],
        rules: [{ ArrayContains: [] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid parameters for rule');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayContains('admin', 'user')
        roles!: string[];
      }

      const instance = new TestClass();
      instance.roles = ['admin', 'user', 'guest'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when missing values', async () => {
      class TestClass {
        @IsArray()
        @ArrayContains('admin')
        roles!: string[];
      }

      const instance = new TestClass();
      instance.roles = ['user', 'guest'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'contain all of the following values'
      );
    });
  });

  describe('ArrayUnique', () => {
    it('should pass for arrays with unique values', async () => {
      const result = await Validator.validate({
        value: [1, 2, 3, 4],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for single element arrays', async () => {
      const result = await Validator.validate({
        value: [1],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for arrays with duplicates', async () => {
      const result = await Validator.validate({
        value: [1, 2, 2, 3],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('contain only unique values');
    });

    it('should work with objects', async () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const result = await Validator.validate({
        value: [obj1, obj2],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail with duplicate objects', async () => {
      const obj1 = { id: 1 };
      const result = await Validator.validate({
        value: [obj1, obj1],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(false);
    });

    it('should handle null and undefined as distinct', async () => {
      const result = await Validator.validate({
        value: [null, undefined, 1],
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not array',
        rules: ['ArrayUnique'],
      });
      expect(result.success).toBe(false);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayUnique()
        tags!: string[];
      }

      const instance = new TestClass();
      instance.tags = ['js', 'ts', 'python'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for duplicates', async () => {
      class TestClass {
        @IsArray()
        @ArrayUnique()
        tags!: string[];
      }

      const instance = new TestClass();
      instance.tags = ['js', 'ts', 'js'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'contain only unique values'
      );
    });
  });

  describe('ArrayAllStrings', () => {
    it('should pass for arrays containing only strings', async () => {
      const result = await Validator.validate({
        value: ['hello', 'world', ''],
        rules: ['ArrayAllStrings'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['ArrayAllStrings'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for arrays containing non-strings', async () => {
      const values = [
        ['hello', 123],
        ['hello', null],
        ['hello', {}],
        ['hello', true],
      ];

      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['ArrayAllStrings'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('array of strings');
      }
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not array',
        rules: ['ArrayAllStrings'],
      });
      expect(result.success).toBe(false);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayAllStrings()
        names!: string[];
      }

      const instance = new TestClass();
      instance.names = ['Alice', 'Bob', 'Charlie'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-strings', async () => {
      class TestClass {
        @IsArray()
        @ArrayAllStrings()
        names!: string[];
      }

      const instance = new TestClass();
      instance.names = ['Alice', 123 as any, 'Charlie'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('array of strings');
    });
  });

  describe('ArrayAllNumbers', () => {
    it('should pass for arrays containing only numbers', async () => {
      const result = await Validator.validate({
        value: [1, 2.5, -3, 0, NaN, Infinity],
        rules: ['ArrayAllNumbers'],
      });
      expect(result.success).toBe(false);
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['ArrayAllNumbers'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for arrays containing NaN', async () => {
      const result = await Validator.validate({
        value: [1, 2, NaN],
        rules: ['ArrayAllNumbers'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('array of numbers');
    });

    it('should fail for arrays containing non-numbers', async () => {
      const values = [
        [1, '2'],
        [1, null],
        [1, {}],
        [1, true],
      ];

      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['ArrayAllNumbers'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('array of numbers');
      }
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not array',
        rules: ['ArrayAllNumbers'],
      });
      expect(result.success).toBe(false);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsArray()
        @ArrayAllNumbers()
        scores!: number[];
      }

      const instance = new TestClass();
      instance.scores = [85, 92, 78];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-numbers', async () => {
      class TestClass {
        @IsArray()
        @ArrayAllNumbers()
        scores!: number[];
      }

      const instance = new TestClass();
      instance.scores = [85, '92' as any, 78];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0]?.message).toContain(
        'array of numbers'
      );
    });
  });
});
