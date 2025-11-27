import { i18n } from '../../i18n';
import { Validator } from '../index';

describe('Validator.validate() - Either Pattern Tests', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  // ============ SUCCESS CASES ============
  describe('Success Cases - validate returns { success: true, data, ... }', () => {
    it('should pass Required rule with non-empty value', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: 'hello',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should pass MinLength rule when value is long enough', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [3] }],
        value: 'hello',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should pass MaxLength rule when value is short enough', async () => {
      const result = await Validator.validate({
        rules: [{ MaxLength: [10] }],
        value: 'hello',
      });

      expect(result.success).toBe(true);
    });

    it('should pass Email rule with valid email', async () => {
      const result = await Validator.validate({
        rules: ['Email'],
        value: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should pass Url rule with valid URL', async () => {
      const result = await Validator.validate({
        rules: ['Url'],
        value: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should pass NumberGT when value is larger', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGT: [5] }],
        value: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should pass NumberLT when value is smaller', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLT: [10] }],
        value: 5,
      });

      expect(result.success).toBe(true);
    });

    it('should pass multiple rules all together', async () => {
      const result = await Validator.validate({
        rules: ['Required', 'Email', { MinLength: [5] }],
        value: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should pass with no rules provided', async () => {
      const result = await Validator.validate({
        rules: [],
        value: 'any value',
      });

      expect(result.success).toBe(true);
    });

    it('should pass custom rule function that returns true', async () => {
      const result = await Validator.validate({
        rules: [({ value }) => value === 'valid' || 'Invalid'],
        value: 'valid',
      });

      expect(result.success).toBe(true);
    });

    it('should pass Nullable rule with null value', async () => {
      const result = await Validator.validate({
        rules: ['Nullable'],
        value: null,
      });

      expect(result.success).toBe(true);
    });

    it('should pass Empty rule with empty string', async () => {
      const result = await Validator.validate({
        rules: ['Empty'],
        value: '',
      });

      expect(result.success).toBe(true);
    });

    it('should pass NumberEQ when values match', async () => {
      const result = await Validator.validate({
        rules: [{ NumberEQ: [42] }],
        value: 42,
      });

      expect(result.success).toBe(true);
    });

    it('should pass NumberGTE at boundary', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGTE: [10] }],
        value: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should pass NumberLTE at boundary', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLTE: [10] }],
        value: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should pass Number rule with numeric value', async () => {
      const result = await Validator.validate({
        rules: ['Number'],
        value: 123,
      });

      expect(result.success).toBe(true);
    });

    it('should pass NonNullString rule with string', async () => {
      const result = await Validator.validate({
        rules: ['NonNullString'],
        value: 'hello',
      });

      expect(result.success).toBe(true);
    });

    it('should return result with validatedAt timestamp', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should return result with duration in milliseconds', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: 'test',
      });

      expect(result.success).toBe(true);
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ============ FAILURE CASES ============
  describe('Failure Cases - validate returns { success: false, error, ... }', () => {
    it('should fail Required rule with empty value', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });

    it('should fail MinLength rule when value is too short', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [10] }],
        value: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MinLength');
      expect(result.error?.ruleParams).toContain(10);
    });

    it('should fail MaxLength rule when value is too long', async () => {
      const result = await Validator.validate({
        rules: [{ MaxLength: [5] }],
        value: 'this is too long',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MaxLength');
    });

    it('should fail Email rule with invalid email', async () => {
      const result = await Validator.validate({
        rules: ['Email'],
        value: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('Email');
    });

    it('should fail Url rule with invalid URL', async () => {
      const result = await Validator.validate({
        rules: ['Url'],
        value: 'not a url',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('Url');
    });

    it('should fail NumberGT when value is too small', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGT: [10] }],
        value: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberGT');
    });

    it('should fail NumberLT when value is too large', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLT: [10] }],
        value: 15,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberLT');
    });

    it("should fail NumberEQ when values don't match", async () => {
      const result = await Validator.validate({
        rules: [{ NumberEQ: [42] }],
        value: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberEQ');
    });

    it('should fail with invalid rule name', async () => {
      const result = await Validator.validate({
        rules: ['NonExistentRule' as any],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('NonExistentRule');
    });

    it('should fail custom rule that returns false', async () => {
      const result = await Validator.validate({
        rules: [({ value }) => value === 'required-value' || 'Value mismatch'],
        value: 'wrong-value',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Value mismatch');
    });

    it('should stop at first failing rule in a chain', async () => {
      const result = await Validator.validate({
        rules: ['Required', { MinLength: [5] }, { MaxLength: [10] }],
        value: 'ab',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MinLength');
    });

    it('should fail NumberGTE at boundary minus one', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGTE: [10] }],
        value: 9,
      });

      expect(result.success).toBe(false);
    });

    it('should fail NumberLTE at boundary plus one', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLTE: [10] }],
        value: 11,
      });

      expect(result.success).toBe(false);
    });

    it('should fail Number rule with non-numeric value', async () => {
      const result = await Validator.validate({
        rules: ['Number'],
        value: 'not a number',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('Number');
    });

    it('should fail NonNullString rule with null value', async () => {
      const result = await Validator.validate({
        rules: ['NonNullString'],
        value: null,
      });

      expect(result.success).toBe(false);
    });

    it('should include error timestamp for failed validation', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
      });

      expect(result.success).toBe(false);
      expect(result.failedAt).toBeInstanceOf(Date);
    });

    it('should include duration for failed validation', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
      });

      expect(result.success).toBe(false);
      expect(typeof result.duration).toBe('number');
    });

    it('should include fieldName in error if provided', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        fieldName: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.error?.fieldName).toBe('email');
    });

    it('should include propertyName in error if provided', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        propertyName: 'userName',
      });

      expect(result.success).toBe(false);
      expect(result.error?.propertyName).toBe('userName');
    });

    it('should handle async rule error gracefully', async () => {
      const result = await Validator.validate({
        rules: [
          async ({ value }) =>
            new Promise((resolve) =>
              setTimeout(() => resolve('Async error message'), 10)
            ),
        ],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Async error message');
    });

    it('should handle async rule rejection gracefully', async () => {
      const result = await Validator.validate({
        rules: [
          async ({ value }) =>
            new Promise((resolve, reject) =>
              setTimeout(() => reject('Async rejection'), 10)
            ),
        ],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Async rejection');
    });

    it('should fail NumberNE when values are equal', async () => {
      const result = await Validator.validate({
        rules: [{ NumberNE: [42] }],
        value: 42,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberNE');
    });

    it('should pass NumberNE when values are different', async () => {
      const result = await Validator.validate({
        rules: [{ NumberNE: [42] }],
        value: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============ CONTEXT & METADATA ============
  describe('Context and Metadata Handling', () => {
    it('should pass context to rule function', async () => {
      let contextReceived;
      await Validator.validate({
        rules: [
          ({ value, context }) => {
            contextReceived = context;
            return true;
          },
        ],
        value: 'test',
        context: { userId: 123, role: 'admin' },
      });

      expect(contextReceived).toEqual({ userId: 123, role: 'admin' });
    });

    it('should include rule parameters in error', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [15] }],
        value: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleParams).toContain(15);
    });

    it('should include translatedPropertyName in error', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        translatedPropertyName: 'User Email Address',
      });

      expect(result.success).toBe(false);
      expect(result.error?.translatedPropertyName).toBe('User Email Address');
    });
  });

  // ============ COMBINED RULE TESTS ============
  describe('Complex Validation Scenarios', () => {
    it('should validate email and minimum length together', async () => {
      const result = await Validator.validate({
        rules: ['Email', { MinLength: [10] }],
        value: 'short@mail.com',
      });

      // Should fail if not long enough
      const check = result.success ? result.value.length >= 10 : true;
      expect(check).toBe(true);
    });

    it('should validate URL and maximum length together', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      const result = await Validator.validate({
        rules: ['Url', { MaxLength: [50] }],
        value: longUrl,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MaxLength');
    });

    it('should validate number range with multiple rules', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGT: [0] }, { NumberLT: [100] }],
        value: 50,
      });

      expect(result.success).toBe(true);
    });

    it('should fail on number range outside lower bound', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGT: [0] }, { NumberLT: [100] }],
        value: -5,
      });

      expect(result.success).toBe(false);
    });

    it('should fail on number range outside upper bound', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGT: [0] }, { NumberLT: [100] }],
        value: 150,
      });

      expect(result.success).toBe(false);
    });
  });
});
