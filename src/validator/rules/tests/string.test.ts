import { Validator, ensureRulesRegistered } from '../../index';
import {
  EndsWithOneOf,
  IsNonNullString,
  IsString,
  Length,
  MaxLength,
  MinLength,
  StartsWithOneOf,
} from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('String Validation Rules', () => {
  describe('IsString', () => {
    it('should pass for valid strings', async () => {
      const validStrings = [
        '',
        'hello',
        '123',
        'hello world',
        'special chars: !@#$%^&*()',
        'unicode: 你好世界',
        'multiline\nstring',
      ];

      for (const str of validStrings) {
        const result = await Validator.validate({
          value: str,
          rules: ['String'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for non-string values', async () => {
      const invalidValues = [
        123,
        0,
        -1,
        1.5,
        null,
        undefined,
        {},
        [],
        true,
        false,
        NaN,
        Infinity,
      ];

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['String'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('string');
      }
    });

    // Decorator test
    it('should work with decorator for valid strings', async () => {
      class TestClass {
        @IsString()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = 'John Doe';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-string values', async () => {
      class TestClass {
        @IsString()
        name: any;
      }

      const instance = new TestClass();
      instance.name = 123;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('string');
    });
  });

  describe('IsNonNullString', () => {
    it('should pass for non-empty strings', async () => {
      const validStrings = [
        'a',
        'hello',
        '123',
        'hello world',
        ' ',
        '\t',
        '\n',
      ];

      for (const str of validStrings) {
        const result = await Validator.validate({
          value: str,
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for empty strings', async () => {
      const result = await Validator.validate({
        value: '',
        rules: ['NonNullString'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('non null string');
    });

    it('should fail for non-string values', async () => {
      const invalidValues = [null, undefined, 123, {}, []];
      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('non null string');
      }
    });

    // Decorator test
    it('should work with decorator for non-empty strings', async () => {
      class TestClass {
        @IsNonNullString()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = 'John';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for empty strings', async () => {
      class TestClass {
        @IsNonNullString()
        name: string = '';
      }

      const instance = new TestClass();
      instance.name = '';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('non null string');
    });
  });

  describe('MinLength', () => {
    it('should pass when string length meets minimum', async () => {
      const testCases = [
        { value: 'hello', min: 3 },
        { value: 'hi', min: 2 },
        { value: 'a', min: 1 },
        { value: '', min: 0 },
      ];

      for (const { value, min } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MinLength: [min] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when string length is below minimum', async () => {
      const testCases = [
        { value: 'hi', min: 3 },
        { value: 'a', min: 2 },
        { value: '', min: 1 },
      ];

      for (const { value, min } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MinLength: [min] }],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('at least');
      }
    });

    it('should fail for non-string values', async () => {
      const result = await Validator.validate({
        value: 123,
        rules: [{ MinLength: [3] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('at least');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @MinLength(3)
        username: string = '';
      }

      const instance = new TestClass();
      instance.username = 'john';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when too short', async () => {
      class TestClass {
        @MinLength(5)
        username: string = '';
      }

      const instance = new TestClass();
      instance.username = 'hi';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('at least');
    });
  });

  describe('MaxLength', () => {
    it('should pass when string length is within maximum', async () => {
      const testCases = [
        { value: 'hi', max: 3 },
        { value: 'hello', max: 5 },
        { value: '', max: 0 },
        { value: 'a', max: 1 },
      ];

      for (const { value, max } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MaxLength: [max] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when string length exceeds maximum', async () => {
      const testCases = [
        { value: 'hello', max: 3 },
        { value: 'world', max: 4 },
      ];

      for (const { value, max } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MaxLength: [max] }],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('at most');
      }
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @MaxLength(10)
        title: string = '';
      }

      const instance = new TestClass();
      instance.title = 'Short';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when too long', async () => {
      class TestClass {
        @MaxLength(5)
        title: string = '';
      }

      const instance = new TestClass();
      instance.title = 'This is too long';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('at most');
    });
  });

  describe('Length', () => {
    it('should pass when string length matches exactly', async () => {
      const testCases = [
        { value: 'hi', length: 2 },
        { value: 'a', length: 1 },
        { value: '', length: 0 },
        { value: 'hello', length: 5 },
      ];

      for (const { value, length } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ Length: [length] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when string length does not match', async () => {
      const testCases = [
        { value: 'hi', length: 3 },
        { value: 'hello', length: 4 },
        { value: 'a', length: 0 },
      ];

      for (const { value, length } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ Length: [length] }],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('exactly');
      }
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @Length(8)
        code: string = '';
      }

      const instance = new TestClass();
      instance.code = 'ABCDEFGH';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should pass with decorator whit right length', async () => {
      class TestClass {
        @Length(5)
        code: string = '';
      }

      const instance = new TestClass();
      instance.code = 'SHORT';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('StartsWithOneOf', () => {
    it('should pass when string starts with one of the prefixes', async () => {
      const testCases = [
        { value: 'hello world', prefixes: ['hello', 'hi'] },
        { value: 'hi there', prefixes: ['hello', 'hi'] },
        { value: 'test', prefixes: ['test', 'other'] },
      ];

      for (const { value, prefixes } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ StartsWithOneOf: prefixes }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when string does not start with any prefix', async () => {
      const testCases = [
        { value: 'hello world', prefixes: ['hi', 'hey'] },
        { value: 'test', prefixes: ['other', 'another'] },
      ];

      for (const { value, prefixes } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ StartsWithOneOf: prefixes }],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'start with one of the following values'
        );
      }
    });

    it('should fail for empty prefixes array', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: [{ StartsWithOneOf: [] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('Invalid parameters');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @StartsWithOneOf('http://', 'https://')
        url: string = '';
      }

      const instance = new TestClass();
      instance.url = 'https://example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when not starting with prefix', async () => {
      class TestClass {
        @StartsWithOneOf('http://', 'https://')
        url: string = '';
      }

      const instance = new TestClass();
      instance.url = 'ftp://example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'start with one of the following values'
      );
    });
  });

  describe('EndsWithOneOf', () => {
    it('should pass when string ends with one of the suffixes', async () => {
      const testCases = [
        { value: 'hello.txt', suffixes: ['.txt', '.pdf'] },
        { value: 'document.pdf', suffixes: ['.txt', '.pdf'] },
        { value: 'image.jpg', suffixes: ['.jpg', '.png'] },
      ];

      for (const { value, suffixes } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ EndsWithOneOf: suffixes }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when string does not end with any suffix', async () => {
      const testCases = [
        { value: 'hello.txt', suffixes: ['.pdf', '.doc'] },
        { value: 'document', suffixes: ['.txt', '.pdf'] },
      ];

      for (const { value, suffixes } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ EndsWithOneOf: suffixes }],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'end with one of the following values'
        );
      }
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @EndsWithOneOf('.com', '.org', '.net')
        domain: string = '';
      }

      const instance = new TestClass();
      instance.domain = 'example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when not ending with suffix', async () => {
      class TestClass {
        @EndsWithOneOf('.com', '.org')
        domain: string = '';
      }

      const instance = new TestClass();
      instance.domain = 'example.io';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'end with one of the following values'
      );
    });
  });

  // Complex scenarios
  describe('Complex String Scenarios', () => {
    it('should validate username with multiple rules', async () => {
      class User {
        @IsString()
        @IsNonNullString()
        @MinLength(3)
        @MaxLength(20)
        username: string = '';
      }

      const instance = new User();
      instance.username = 'johndoe';

      const result = await Validator.validateTarget(User, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should validate email domain', async () => {
      class Email {
        @IsString()
        @EndsWithOneOf('@gmail.com', '@yahoo.com', '@outlook.com')
        address: string = '';
      }

      const instance = new Email();
      instance.address = 'user@gmail.com';

      const result = await Validator.validateTarget(Email, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should validate phone number format', async () => {
      class Phone {
        @IsString()
        @StartsWithOneOf('+1', '+44', '+33')
        @Length(12)
        number: string = '';
      }

      const instance = new Phone();
      instance.number = '+12345678901';

      const result = await Validator.validateTarget(Phone, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should validate password strength', async () => {
      class Password {
        @IsString()
        @IsNonNullString()
        @MinLength(8)
        @MaxLength(128)
        value: string = '';
      }

      const instance = new Password();
      instance.value = 'MySecurePassword123';

      const result = await Validator.validateTarget(Password, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should validate file extension', async () => {
      class FileUpload {
        @IsString()
        @EndsWithOneOf('.jpg', '.jpeg', '.png', '.gif')
        filename: string = '';
      }

      const instance = new FileUpload();
      instance.filename = 'photo.jpg';

      const result = await Validator.validateTarget(FileUpload, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });
});
