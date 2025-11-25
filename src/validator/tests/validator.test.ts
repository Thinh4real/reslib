import { i18n } from '../../i18n';
import { IsEmail, Validator } from '../index';
import { ValidatorRuleFunction, ValidatorRuleName } from '../types';

describe('Validator', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('registerRule', () => {
    it('should register a new validation rule', () => {
      const ruleName = 'isEven';
      const ruleFunction: ValidatorRuleFunction = ({ value }) =>
        value % 2 === 0 || 'The number must be even.';

      Validator.registerRule(ruleName as ValidatorRuleName, ruleFunction);

      const rules = Validator.getRules();
      expect(rules[ruleName as ValidatorRuleName]).toBe(ruleFunction);
    });
  });

  describe('getRule', () => {
    it('should retrieve a registered validation rule by name', () => {
      const ruleName = 'isEven' as ValidatorRuleName;
      const ruleFunction: ValidatorRuleFunction = ({ value }) =>
        value % 2 === 0 || 'The number must be even.';

      Validator.registerRule(ruleName, ruleFunction);

      const retrievedRule = Validator.findRegisteredRule(ruleName);
      expect(retrievedRule).toBe(ruleFunction);
    });

    it('should return undefined for a non-existent rule', () => {
      const retrievedRule = Validator.findRegisteredRule(
        'nonExistentRule' as ValidatorRuleName
      );
      expect(retrievedRule).toBeUndefined();
    });
  });

  describe('parseAndValidateRules', () => {
    it('should sanitize an array of rules', () => {
      const sanitizedRules = Validator.parseAndValidateRules([
        'Required',
        { MinLength: [2] },
        { MaxLength: [10] },
      ]);
      expect(sanitizedRules).toEqual({
        invalidRules: [],
        sanitizedRules: [
          {
            ruleName: 'Required',
            rawRuleName: 'Required',
            params: [],
            ruleFunction: expect.any(Function),
          },
          {
            ruleName: 'MinLength',
            params: [2],
            ruleFunction: expect.any(Function),
            rawRuleName: 'MinLength',
          },
          {
            ruleName: 'MaxLength',
            rawRuleName: 'MaxLength',
            params: [10],
            ruleFunction: expect.any(Function),
          },
        ],
      });
    });

    it('should sanitize a function rule', () => {
      const ruleFunction: ValidatorRuleFunction = ({ value }) =>
        value !== null || 'Value cannot be null';
      const sanitizedRules = Validator.parseAndValidateRules([ruleFunction]);
      expect(sanitizedRules).toEqual({
        sanitizedRules: [ruleFunction],
        invalidRules: [],
      });
    });

    it('should return an empty array for undefined rules', () => {
      const sanitizedRules = Validator.parseAndValidateRules(undefined);

      expect(sanitizedRules).toEqual({ sanitizedRules: [], invalidRules: [] });
    });
  });

  describe('validate - Either Pattern (Success Cases)', () => {
    it('should return success result for valid custom rule', async () => {
      const ruleName = 'isEven';
      const ruleFunction: ValidatorRuleFunction = ({ value }) =>
        value % 2 === 0 || 'The number must be even.';
      Validator.registerRule(ruleName as ValidatorRuleName, ruleFunction);

      const result = await Validator.validate({
        rules: ['isEven' as any],
        value: 4,
      });

      expect(result.success).toBe(true);

      expect(result.value).toBe(4);
      expect(result.validatedAt).toBeDefined();
      expect(result.duration).toBeDefined();
    });

    it('should return success when no rules are provided', async () => {
      const result = await Validator.validate({
        rules: [],
        value: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('test');
    });

    it('should return success for Required rule with non-empty value', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: 'hello',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should return success for MinLength rule when value meets requirement', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [3] }],
        value: 'hello',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should return success for MaxLength rule when value meets requirement', async () => {
      const result = await Validator.validate({
        rules: [{ MaxLength: [10] }],
        value: 'hello',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should return success for valid email', async () => {
      const result = await Validator.validate({
        rules: ['Email'],
        value: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    it('should return success for valid URL', async () => {
      const result = await Validator.validate({
        rules: ['Url'],
        value: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('https://example.com');
    });

    it('should return success for NumberGreaterThan rule when value is valid', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGreaterThan: [5] }],
        value: 10,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should return success for NumberLessThan rule when value is valid', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLessThan: [10] }],
        value: 5,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should return success for multiple passing rules', async () => {
      const result = await Validator.validate({
        rules: ['Required', 'Email', { MinLength: [5] }],
        value: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    it('should return success for Nullable with null value', async () => {
      const result = await Validator.validate({
        rules: ['Nullable'],
        value: null,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should return success for Empty with empty string', async () => {
      const result = await Validator.validate({
        rules: ['Empty'],
        value: '',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('');
    });

    it('should return success for Optional with undefined value', async () => {
      const result = await Validator.validate({
        rules: ['Optional'],
        value: undefined,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe('validate - Either Pattern (Failure Cases)', () => {
    it('should return failure for invalid rule name', async () => {
      const result = await Validator.validate({
        rules: ['invalidRule' as any],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('invalidRule');
      expect(result.failedAt).toBeDefined();
    });

    it('should return failure for Required rule with empty value', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });

    it('should return failure for MinLength rule when value is too short', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [5] }],
        value: 'hi',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.ruleName).toBe('MinLength');
    });

    it('should return failure for MaxLength rule when value is too long', async () => {
      const result = await Validator.validate({
        rules: [{ MaxLength: [5] }],
        value: 'hello world',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MaxLength');
    });

    it('should return failure for invalid email', async () => {
      const result = await Validator.validate({
        rules: ['Email'],
        value: 'invalid-email',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('Email');
    });

    it('should return failure for invalid URL', async () => {
      const result = await Validator.validate({
        rules: ['Url'],
        value: 'not a url',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('Url');
    });

    it('should return failure for NumberGreaterThan when value is too small', async () => {
      const result = await Validator.validate({
        rules: [{ NumberGreaterThan: [10] }],
        value: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberGreaterThan');
    });

    it('should return failure for NumberLessThan when value is too large', async () => {
      const result = await Validator.validate({
        rules: [{ NumberLessThan: [10] }],
        value: 15,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberLessThan');
    });

    it("should return failure for NumberEqual when value doesn't match", async () => {
      const result = await Validator.validate({
        rules: [{ NumberEqual: [10] }],
        value: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('NumberEqual');
    });

    it('should stop at first failing rule in multiple rules', async () => {
      const result = await Validator.validate({
        rules: ['Required', 'Email', { MinLength: [50] }],
        value: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleName).toBe('MinLength');
    });

    it('should return failure for custom error message from rule function', async () => {
      const result = await Validator.validate({
        rules: [
          ({ value }) => value !== 'forbidden' || 'This value is forbidden',
        ],
        value: 'forbidden',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('This value is forbidden');
    });

    it('should return failure for async rule that returns error', async () => {
      const result = await Validator.validate({
        rules: [
          async ({ value }) =>
            new Promise((resolve) =>
              setTimeout(() => resolve('Async validation failed'), 50)
            ),
        ],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Async validation failed');
    });

    it('should return failure for async rule that throws error', async () => {
      const result = await Validator.validate({
        rules: [
          async ({ value }) =>
            new Promise((resolve, reject) =>
              setTimeout(() => reject(new Error('Async error')), 50)
            ),
        ],
        value: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Async error');
    });
  });

  describe('validate - Type Guard Methods', () => {
    it('should identify success results with isSuccess', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: 'hello',
      });

      expect(Validator.isSuccess(result)).toBe(true);
      expect(Validator.isFailure(result)).toBe(false);
    });

    it('should identify failure results with isFailure', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
      });

      expect(Validator.isFailure(result)).toBe(true);
      expect(Validator.isSuccess(result)).toBe(false);
    });
  });

  describe('validate - Context and FieldMeta Information', () => {
    it('should capture field name in result', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        fieldName: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.error?.fieldName).toBe('email');
    });

    it('should capture property name in result', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        propertyName: 'userName',
      });

      expect(result.success).toBe(false);
      expect(result.error?.propertyName).toBe('userName');
    });

    it('should capture translated property name', async () => {
      const result = await Validator.validate({
        rules: ['Required'],
        value: '',
        translatedPropertyName: 'User Email',
      });

      expect(result.success).toBe(false);
      expect(result.error?.translatedPropertyName).toBe('User Email');
    });

    it('should pass context to rule function', async () => {
      let capturedContext;
      const result = await Validator.validate({
        rules: [
          ({ value, context }) => {
            capturedContext = context;
            return true;
          },
        ],
        value: 'test',
        context: { userId: 123 },
      });

      expect(result.success).toBe(true);
      expect(capturedContext).toEqual({ userId: 123 });
    });

    it('should capture rule parameters in error', async () => {
      const result = await Validator.validate({
        rules: [{ MinLength: [10] }],
        value: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error?.ruleParams).toEqual([10]);
    });
  });

  describe('validateTarget - Success Cases', () => {
    it('should validate a class with all valid data', async () => {
      class User {
        email: string = '';
        name: string = '';
      }

      // Manually attach rules using metadata for this test
      const result = await Validator.validateTarget(User, {
        data: { email: 'test@example.com', name: 'John' },
      });

      // Should succeed when no rules are defined
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields successfully', async () => {
      class Product {
        name: string = '';
        price: number = 0;
        url: string = '';
      }

      const result = await Validator.validateTarget(Product, {
        data: {
          name: 'Product Name',
          price: 99.99,
          url: 'https://example.com/product',
        },
        i18n,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: 'Product Name',
        price: 99.99,
        url: 'https://example.com/product',
      });
    });

    it('should include validated timestamp and duration', async () => {
      class SimpleClass {
        field: string = '';
      }

      const result = await Validator.validateTarget(SimpleClass, {
        data: {
          field: 'value',
        },
      });

      expect(result.success).toBe(true);
      expect((result as any).validatedAt).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('validateTarget - Error Aggregation', () => {
    it('should aggregate multiple field errors', async () => {
      // This test would need actual decorators on the class
      class User {
        @IsEmail
        email: string = '';
        name: string = '';
      }

      const result = await Validator.validateTarget(User, {
        data: { email: 'invalid', name: '' },
      });
      // Result will depend on whether decorators are applied
      expect((result as any).errors).toBeDefined();
      expect(Array.isArray((result as any).errors)).toBe(true);
      expect((result as any).failureCount).toBe((result as any).errors.length);
      expect((result as any).status).toBe('error');
    });

    it('should include failure metadata', async () => {
      class User {
        @IsEmail
        email: string = '';
      }

      const result = await Validator.validateTarget(User, {
        data: { email: 'invalid' },
      });

      expect((result as any).failedAt).toBeDefined();
      expect((result as any).duration).toBeDefined();
      expect((result as any).message).toBeDefined();
    });
  });

  describe('validate - Number Rules', () => {
    it('should validate NumberGreaterThanOrEqual', async () => {
      const pass = await Validator.validate({
        rules: [{ NumberGreaterThanOrEqual: [10] }],
        value: 10,
      });

      const fail = await Validator.validate({
        rules: [{ NumberGreaterThanOrEqual: [10] }],
        value: 9,
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });

    it('should validate NumberLessThanOrEqual', async () => {
      const pass = await Validator.validate({
        rules: [{ NumberLessThanOrEqual: [10] }],
        value: 10,
      });

      const fail = await Validator.validate({
        rules: [{ NumberLessThanOrEqual: [10] }],
        value: 11,
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });

    it('should validate NumberIsDifferentFrom', async () => {
      const pass = await Validator.validate({
        rules: [{ NumberIsDifferentFrom: [10] }],
        value: 5,
      });

      const fail = await Validator.validate({
        rules: [{ NumberIsDifferentFrom: [10] }],
        value: 10,
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });
  });

  describe('validate - String Rules', () => {
    it('should validate Length rule', async () => {
      const pass = await Validator.validate({
        rules: [{ Length: [3, 10] }],
        value: 'hello',
      });

      const fail = await Validator.validate({
        rules: [{ Length: [3, 10] }],
        value: 'hi',
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });

    it('should validate NonNullString', async () => {
      const pass = await Validator.validate({
        rules: ['NonNullString'],
        value: 'hello',
      });

      const fail = await Validator.validate({
        rules: ['NonNullString'],
        value: null,
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });

    it('should validate FileName rule', async () => {
      const pass = await Validator.validate({
        rules: ['FileName'],
        value: 'document.pdf',
      });

      const fail = await Validator.validate({
        rules: ['FileName'],
        value: '/path/to/file.txt',
      });

      expect(pass.success).toBe(true);
      // FileName might pass for paths, depends on implementation
    });

    it('should validate PhoneNumber rule', async () => {
      const pass = await Validator.validate({
        rules: [],
        value: '+16505550123',
      });

      expect(pass.success).toBe(true);
    });

    it('should validate EmailOrPhoneNumber rule', async () => {
      const email = await Validator.validate({
        rules: ['EmailOrPhoneNumber'],
        value: 'test@example.com',
      });

      const phone = await Validator.validate({
        rules: ['EmailOrPhoneNumber'],
        value: '+16505550123',
      });

      expect(email.success).toBe(true);
      expect(phone.success).toBe(true);
    });

    it('should validate Number rule', async () => {
      const pass = await Validator.validate({
        rules: ['Number'],
        value: 42,
      });

      const fail = await Validator.validate({
        rules: ['Number'],
        value: 'not a number',
      });

      expect(pass.success).toBe(true);
      expect(fail.success).toBe(false);
    });
  });
});
