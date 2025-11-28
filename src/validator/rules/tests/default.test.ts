import { Validator, ensureRulesRegistered } from '../../index';
import { IsEmpty, IsNullable, IsOptional, IsRequired } from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Default Validation Rules', () => {
  describe('IsRequired', () => {
    it('should pass for non-empty strings', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: ['Required'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for numbers', async () => {
      const values = [0, 1, -1, 1.5, NaN, Infinity];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Required'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should pass for boolean values', async () => {
      const result = await Validator.validate({
        value: false,
        rules: ['Required'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for objects', async () => {
      const result = await Validator.validate({
        value: {},
        rules: ['Required'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['Required'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for null', async () => {
      const result = await Validator.validate({
        value: null,
        rules: ['Required'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('required');
    });

    it('should fail for undefined', async () => {
      const result = await Validator.validate({
        value: undefined,
        rules: ['Required'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('required');
    });

    it('should fail for empty strings', async () => {
      const result = await Validator.validate({
        value: '',
        rules: ['Required'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('required');
    });

    // Decorator test
    it('should work with decorator for valid values', async () => {
      class TestClass {
        @IsRequired()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = 'John';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for null', async () => {
      class TestClass {
        @IsRequired()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = null as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('required');
    });

    it('should fail with decorator for undefined', async () => {
      class TestClass {
        @IsRequired()
        name: string = '';
      }

      const instance = new TestClass();
      // name is undefined

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('required');
    });
  });

  describe('IsEmpty', () => {
    it('should pass for empty strings', async () => {
      const result = await Validator.validate({
        value: '',
        rules: ['Empty'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for null', async () => {
      const result = await Validator.validate({
        value: null,
        rules: ['Empty'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for undefined', async () => {
      const result = await Validator.validate({
        value: undefined,
        rules: ['Empty'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-empty strings', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: ['Empty'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('empty');
    });

    it('should fail for numbers', async () => {
      const result = await Validator.validate({
        value: 0,
        rules: ['Empty'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('empty');
    });

    it('should fail for objects', async () => {
      const result = await Validator.validate({
        value: {},
        rules: ['Empty'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('empty');
    });

    it('should fail for arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['Empty'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('empty');
    });

    // Decorator test - Empty should skip other rules
    it('should skip subsequent rules when empty', async () => {
      class TestClass {
        @IsEmpty()
        @IsRequired() // This should be skipped
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = '';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true); // Should pass because Empty allows empty and skips Required
    });

    it('should not skip subsequent rules when not empty', async () => {
      class TestClass {
        @IsEmpty()
        @IsRequired()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = 'John';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false); // Should fail because Empty fails and Required is not skipped
      expect((result as any)?.errors?.[0].message).toContain('empty');
    });
  });

  describe('IsNullable', () => {
    it('should pass for null', async () => {
      const result = await Validator.validate({
        value: null,
        rules: ['Nullable'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for any other value', async () => {
      const values = ['', 'hello', 0, 1, {}, [], true, false, undefined];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Nullable'],
        });
        expect(result.success).toBe(true);
      }
    });

    // Decorator test - Nullable should skip other rules for null
    it('should skip subsequent rules when null', async () => {
      class TestClass {
        @IsNullable()
        @IsRequired() // This should be skipped for null
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = null as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true); // Should pass because Nullable allows null and skips Required
    });

    it('should not skip subsequent rules when not null', async () => {
      class TestClass {
        @IsNullable()
        @IsRequired()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = '';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false); // Should fail because Required fails for empty string
      expect((result as any)?.errors?.[0].message).toContain('required');
    });
  });

  describe('IsOptional', () => {
    it('should pass for undefined', async () => {
      const result = await Validator.validate({
        value: undefined,
        rules: ['Optional'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for any other value', async () => {
      const values = ['', 'hello', 0, 1, {}, [], true, false, null];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Optional'],
        });
        expect(result.success).toBe(true);
      }
    });

    // Decorator test - Optional should skip validation when undefined
    it('should skip validation when field is undefined', async () => {
      class TestClass {
        @IsOptional()
        @IsRequired() // This should be skipped when field is missing
        name?: string = '';
      }

      const instance = new TestClass();
      // name is undefined

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      console.log(result, ' is result skipping');
      expect(result.success).toBe(true); // Should pass because Optional allows undefined and skips validation
    });

    it('should not skip validation when field is present', async () => {
      class TestClass {
        @IsOptional()
        @IsRequired()
        name?: string = '';
      }

      const instance = new TestClass();
      instance.name = '';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false); // Should fail because Required fails for empty string
      expect((result as any)?.errors?.[0].message).toContain('required');
    });

    it('should allow field to be omitted from data object', async () => {
      class TestClass {
        @IsOptional()
        @IsRequired()
        name?: string = '';

        @IsRequired()
        email: string = '';
      }

      const instance = {
        email: 'test@example.com',
        // name is omitted
      };

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true); // Should pass because name is optional and omitted
    });
  });

  // Interaction tests
  describe('Rule Interactions', () => {
    it('should handle Empty + Required combination', async () => {
      // Empty allows empty values and skips Required
      const result1 = await Validator.validate({
        value: '',
        rules: ['Empty', 'Required'],
      });
      expect(result1.success).toBe(true);

      // Non-empty fails Empty but passes Required
      const result2 = await Validator.validate({
        value: 'hello',
        rules: ['Empty', 'Required'],
      });
      expect(result2.success).toBe(true);
    });

    it('should handle Nullable + Required combination', async () => {
      // Nullable allows null and skips Required
      const result1 = await Validator.validate({
        value: null,
        rules: ['Nullable', 'Required'],
      });
      expect(result1.success).toBe(true);

      // Non-null values are checked by Required
      const result2 = await Validator.validate({
        value: '',
        rules: ['Nullable', 'Required'],
      });
      expect(result2.success).toBe(false);
      expect(result2.error?.message).toContain('required');
    });

    it('should handle Optional + Required combination', async () => {
      // Optional allows undefined and skips Required
      const result1 = await Validator.validate({
        value: undefined,
        rules: ['Optional', 'Required'],
      });
      expect(result1.success).toBe(true);

      // Defined values are checked by Required
      const result2 = await Validator.validate({
        value: '',
        rules: ['Optional', 'Required'],
      });
      expect(result2.success).toBe(false);
      expect(result2.error?.message).toContain('required');
    });
  });
});
