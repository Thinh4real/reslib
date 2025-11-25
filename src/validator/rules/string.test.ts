import { ensureRulesRegistered } from '.';
import { i18n } from '../../i18n';
import { Validator } from '../validator';
import {
  EndsWithOneOf,
  IsNonNullString,
  IsString,
  Length,
  MaxLength,
  MinLength,
  StartsWithOneOf,
} from './string';
ensureRulesRegistered();
describe('String Validation Rules', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('IsString Rule', () => {
    it('should work with Required rule', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: ['String', 'Required'],
      });
      expect(result.success).toBe(true);
    });
    describe('Validation Behavior', () => {
      it('should validate string values', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: ['String'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate empty strings', async () => {
        const result = await Validator.validate({
          value: '',
          rules: ['String'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate numeric strings', async () => {
        const result = await Validator.validate({
          value: '12345',
          rules: ['String'],
        });
        expect(result.success).toBe(true);
      });

      it('should reject numbers', async () => {
        const result = await Validator.validate({
          value: 123,
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject booleans', async () => {
        const result = await Validator.validate({
          value: true,
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject null', async () => {
        const result = await Validator.validate({
          value: null,
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject undefined', async () => {
        const result = await Validator.validate({
          value: undefined,
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject objects', async () => {
        const result = await Validator.validate({
          value: { key: 'value' },
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject arrays', async () => {
        const result = await Validator.validate({
          value: ['hello', 'world'],
          rules: ['String'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      it('should validate class with IsString decorator', async () => {
        class TestClass {
          @IsString()
          text: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            text: 'hello',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject non-string with IsString decorator', async () => {
        class TestClass {
          @IsString()
          text: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            text: 123,
          },
        });

        expect(result.success).toBe(false);
        expect((result as any).errors.length).toBeGreaterThan(0);
      });

      it('should validate empty string with decorator', async () => {
        class TestClass {
          @IsString()
          text: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            text: '',
          },
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Combined with other rules', () => {
      it('should work with MinLength rule', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: ['String', { MinLength: [3] }],
        });
        expect(result.success).toBe(true);
      });

      it('should fail MinLength when combined', async () => {
        const result = await Validator.validate({
          value: 'hi',
          rules: ['String', { MinLength: [3] }],
        });
        expect(result.success).toBe(false);
      });

      it('should work with MaxLength rule', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: ['String', { MaxLength: [10] }],
        });
        expect(result.success).toBe(true);
      });

      it('should fail MaxLength when combined', async () => {
        const result = await Validator.validate({
          value: 'hello world this is long',
          rules: ['String', { MaxLength: [5] }],
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('IsNonNullString Rule', () => {
    describe('Validation Behavior', () => {
      it('should validate non-empty strings', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty strings', async () => {
        const result = await Validator.validate({
          value: '',
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject null', async () => {
        const result = await Validator.validate({
          value: null,
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject undefined', async () => {
        const result = await Validator.validate({
          value: undefined,
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject numbers', async () => {
        const result = await Validator.validate({
          value: 123,
          rules: ['NonNullString'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      it('should validate non-empty string with decorator', async () => {
        class TestClass {
          @IsNonNullString()
          title: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            title: 'My Title',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject empty string', async () => {
        class TestClass {
          @IsNonNullString()
          title: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            title: '',
          },
        });

        expect(result.success).toBe(false);
      });

      it('should reject null', async () => {
        class TestClass {
          @IsNonNullString()
          title: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            title: null,
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('MinLength Rule', () => {
    describe('Validation Behavior', () => {
      it('should validate strings meeting minimum length', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: [{ MinLength: [3] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate strings exactly at minimum length', async () => {
        const result = await Validator.validate({
          value: 'hi',
          rules: [{ MinLength: [2] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject strings below minimum length', async () => {
        const result = await Validator.validate({
          value: 'hi',
          rules: [{ MinLength: [5] }],
        });
        expect(result.success).toBe(false);
      });

      it('should validate empty strings', async () => {
        const result = await Validator.validate({
          value: '',
          rules: [{ MinLength: [3] }],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Decorator', () => {
      it('should validate with MinLength decorator', async () => {
        class TestClass {
          @MinLength(3)
          username: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            username: 'john_doe',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject with MinLength decorator', async () => {
        class TestClass {
          @MinLength(5)
          username: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            username: 'bob',
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('MaxLength Rule', () => {
    describe('Validation Behavior', () => {
      it('should validate strings within maximum length', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: [{ MaxLength: [10] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate strings exactly at maximum length', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: [{ MaxLength: [5] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject strings exceeding maximum length', async () => {
        const result = await Validator.validate({
          value: 'hello world',
          rules: [{ MaxLength: [5] }],
        });
        expect(result.success).toBe(false);
      });

      it('should validate empty strings', async () => {
        const result = await Validator.validate({
          value: '',
          rules: [{ MaxLength: [5] }],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Decorator', () => {
      it('should validate with MaxLength decorator', async () => {
        class TestClass {
          @MaxLength(10)
          bio: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            bio: 'My bio',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject with MaxLength decorator', async () => {
        class TestClass {
          @MaxLength(5)
          bio: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            bio: 'This is a very long bio',
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Length Rule', () => {
    describe('Validation Behavior - Range Mode', () => {
      it('should validate strings within length range', async () => {
        const result = await Validator.validate({
          value: 'hello',
          rules: [{ Length: [3, 10] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate at minimum boundary', async () => {
        const result = await Validator.validate({
          value: 'abc',
          rules: [{ Length: [3, 10] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate at maximum boundary', async () => {
        const result = await Validator.validate({
          value: '1234567890',
          rules: [{ Length: [3, 10] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject below minimum', async () => {
        const result = await Validator.validate({
          value: 'ab',
          rules: [{ Length: [3, 10] }],
        });
        expect(result.success).toBe(false);
      });

      it('should reject above maximum', async () => {
        const result = await Validator.validate({
          value: '12345678901',
          rules: [{ Length: [3, 10] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Validation Behavior - Exact Length Mode', () => {
      it('should validate exact length', async () => {
        const result = await Validator.validate({
          value: 'abcd',
          rules: [{ Length: [4] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject if not exact length', async () => {
        const result = await Validator.validate({
          value: 'abc',
          rules: [{ Length: [4] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      it('should validate with Length range decorator', async () => {
        class TestClass {
          @Length(2, 10)
          code: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            code: 'abc123',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject below range', async () => {
        class TestClass {
          @Length(5, 10)
          code: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            code: 'ab',
          },
        });

        expect(result.success).toBe(false);
      });

      it('should reject above range', async () => {
        class TestClass {
          @Length(2, 5)
          code: string = '';
        }

        const result = await Validator.validateTarget(TestClass, {
          data: {
            code: 'abcdefghij',
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('StartsWithOneOf Rule', () => {
    describe('Validation Behavior', () => {
      it('should validate string starting with one of values', async () => {
        const result = await Validator.validate({
          value: 'https://example.com',
          rules: [{ StartsWithOneOf: ['https://', 'http://'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with first matching prefix', async () => {
        const result = await Validator.validate({
          value: 'production-api',
          rules: [
            { StartsWithOneOf: ['production', 'staging', 'development'] },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with any matching prefix', async () => {
        const result = await Validator.validate({
          value: 'staging-db',
          rules: [
            { StartsWithOneOf: ['production', 'staging', 'development'] },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should reject if not starting with any value', async () => {
        const result = await Validator.validate({
          value: 'ftp://server.com',
          rules: [{ StartsWithOneOf: ['https://', 'http://'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should be case sensitive', async () => {
        const result = await Validator.validate({
          value: 'HTTP://example.com',
          rules: [{ StartsWithOneOf: ['http://', 'https://'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-string values', async () => {
        const result = await Validator.validate({
          value: 123,
          rules: [{ StartsWithOneOf: ['http', 'https'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should work with single character prefixes', async () => {
        const result = await Validator.validate({
          value: 'test_value',
          rules: [{ StartsWithOneOf: ['t', 's', 'p'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should work with long prefixes', async () => {
        const result = await Validator.validate({
          value: 'user-profile-settings',
          rules: [{ StartsWithOneOf: ['user-profile', 'admin-profile'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate empty string against prefixes', async () => {
        const result = await Validator.validate({
          value: '',
          rules: [{ StartsWithOneOf: ['https://', 'http://'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should reject when params are empty', async () => {
        const result = await Validator.validate({
          value: 'test',
          rules: [{ StartsWithOneOf: [] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      it('should validate with StartsWithOneOf decorator', async () => {
        class ApiConfig {
          @StartsWithOneOf('http://', 'https://')
          apiUrl: string = '';
        }

        const result = await Validator.validateTarget(ApiConfig, {
          data: {
            apiUrl: 'https://api.example.com',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject invalid prefix with decorator', async () => {
        class ApiConfig {
          @StartsWithOneOf('http://', 'https://')
          apiUrl: string = '';
        }

        const result = await Validator.validateTarget(ApiConfig, {
          data: {
            apiUrl: 'ftp://files.example.com',
          },
        });

        expect(result.success).toBe(false);
      });

      it('should work with multiple prefixes in decorator', async () => {
        class Environment {
          @StartsWithOneOf('prod', 'staging', 'dev')
          environmentName: string = '';
        }

        const result = await Validator.validateTarget(Environment, {
          data: {
            environmentName: 'staging-server-01',
          },
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('EndsWithOneOf Rule', () => {
    describe('Validation Behavior', () => {
      it('should validate string ending with one of values', async () => {
        const result = await Validator.validate({
          value: 'profile.jpg',
          rules: [{ EndsWithOneOf: ['jpg', 'png', 'gif'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with multiple matching endings', async () => {
        const result = await Validator.validate({
          value: 'document.pdf',
          rules: [{ EndsWithOneOf: ['pdf', 'doc', 'docx'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject if not ending with any value', async () => {
        const result = await Validator.validate({
          value: 'image.txt',
          rules: [{ EndsWithOneOf: ['jpg', 'png', 'gif'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should be case sensitive', async () => {
        const result = await Validator.validate({
          value: 'file.JPG',
          rules: [{ EndsWithOneOf: ['jpg'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-string values', async () => {
        const result = await Validator.validate({
          value: 123,
          rules: [{ EndsWithOneOf: ['jpg', 'png'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should work with single character suffixes', async () => {
        const result = await Validator.validate({
          value: 'word',
          rules: [{ EndsWithOneOf: ['d', 't', 'n'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should work with long suffixes', async () => {
        const result = await Validator.validate({
          value: 'user-profile-settings',
          rules: [{ EndsWithOneOf: ['-settings', '-profile', '-data'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should validate empty string against suffixes', async () => {
        const result = await Validator.validate({
          value: '',
          rules: [{ EndsWithOneOf: ['.jpg', '.png'] }],
        });
        expect(result.success).toBe(false);
      });

      it('should reject when params are empty', async () => {
        const result = await Validator.validate({
          value: 'file.txt',
          rules: [{ EndsWithOneOf: [] }],
        });
        expect(result.success).toBe(false);
      });

      it('should work with file extensions', async () => {
        const result = await Validator.validate({
          value: 'document.docx',
          rules: [{ EndsWithOneOf: ['.pdf', '.doc', '.docx'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should work with domain extensions', async () => {
        const result = await Validator.validate({
          value: 'company.org',
          rules: [{ EndsWithOneOf: ['.com', '.org', '.net'] }],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Decorator', () => {
      it('should validate with EndsWithOneOf decorator', async () => {
        class FileUpload {
          @EndsWithOneOf('jpg', 'png', 'gif')
          imageFile: string = '';
        }

        const result = await Validator.validateTarget(FileUpload, {
          data: {
            imageFile: 'photo.jpg',
          },
        });

        expect(result.success).toBe(true);
      });

      it('should reject invalid extension', async () => {
        class FileUpload {
          @EndsWithOneOf('jpg', 'png', 'gif')
          imageFile: string = '';
        }

        const result = await Validator.validateTarget(FileUpload, {
          data: {
            imageFile: 'document.pdf',
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should combine String with MinLength and MaxLength', async () => {
      class Profile {
        @IsString()
        @MinLength(2)
        @MaxLength(50)
        username: string = '';
      }

      const result = await Validator.validateTarget(Profile, {
        data: {
          username: 'john_doe',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should fail when combining multiple constraints', async () => {
      class Profile {
        @IsString()
        @MinLength(10)
        @MaxLength(20)
        username: string = '';
      }

      const result = await Validator.validateTarget(Profile, {
        data: {
          username: 'bob',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should validate complex string scenarios', async () => {
      class Document {
        @IsString()
        @MinLength(5)
        title: string = '';

        @IsString()
        @MaxLength(1000)
        content: string = '';

        @IsString()
        @EndsWithOneOf('.pdf', '.doc', '.docx')
        filename: string = '';
      }

      const result = await Validator.validateTarget(Document, {
        data: {
          title: 'My Document',
          content: 'Document content...',
          filename: 'document.pdf',
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
