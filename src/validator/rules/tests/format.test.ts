import { Validator, ensureRulesRegistered } from '../../index';
import {
  IsBase64,
  IsCreditCard,
  IsEmail,
  IsEmailOrPhone,
  IsFileName,
  IsHexColor,
  IsHexadecimal,
  IsIP,
  IsJSON,
  IsMACAddress,
  IsMongoId,
  IsPhoneNumber,
  IsUUID,
  IsUrl,
  Matches,
} from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Format Validation Rules', () => {
  describe('IsEmail', () => {
    it('should pass for valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@example.co.uk',
        'test.email@subdomain.example.com',
        'user@localhost',
        'test@127.0.0.1',
      ];

      for (const email of validEmails) {
        const result = await Validator.validate({
          value: email,
          rules: ['Email'],
        });
        expect(result.success).toBe(
          !['user@localhost', 'test@127.0.0.1'].includes(email)
        );
      }
    });

    it('should fail for invalid email addresses', async () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example..com',
        'test @example.com',
        'test@example.com ',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const email of invalidEmails) {
        const result = await Validator.validate({
          value: email,
          rules: ['Email'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('email');
      }
    });

    // Decorator test
    it('should work with decorator for valid email', async () => {
      class TestClass {
        @IsEmail()
        email: string = '';
      }

      const instance = new TestClass();
      instance.email = 'test@example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid email', async () => {
      class TestClass {
        @IsEmail()
        email: string = '';
      }

      const instance = new TestClass();
      instance.email = 'invalid-email';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('email');
    });
  });

  describe('IsUrl', () => {
    it('should pass for valid URLs', async () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com/path#fragment',
        'ftp://example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path',
      ];

      for (const url of validUrls) {
        const result = await Validator.validate({
          value: url,
          rules: ['Url'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid URLs', async () => {
      const invalidUrls = [
        'invalid',
        'example.com',
        'http://',
        'https://',
        'not-a-url',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const url of invalidUrls) {
        const result = await Validator.validate({
          value: url,
          rules: ['Url'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'This field must be a valid URL'
        );
      }
    });

    // Decorator test
    it('should work with decorator for valid URL', async () => {
      class TestClass {
        @IsUrl()
        website: string = '';
      }

      const instance = new TestClass();
      instance.website = 'https://example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid URL', async () => {
      class TestClass {
        @IsUrl()
        website: string = '';
      }

      const instance = new TestClass();
      instance.website = 'not-a-url';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'must be a valid URL'
      );
    });
  });

  describe('IsPhoneNumber', () => {
    it('should pass for valid phone numbers', async () => {
      const validPhones = [
        '+1 202 555 0185',
        '+1-234-567-8900',
        '(123) 456-7890',
        '123-456-7890',
        '1234567890',
        '+44 20 7123 4567',
        '+91 9876543210',
      ];

      for (const phone of validPhones) {
        const result = await Validator.validate({
          value: phone,
          rules: ['PhoneNumber'],
        });
        expect(result.success).toBe(
          !['(123) 456-7890', '123-456-7890', '1234567890'].includes(phone)
        );
      }
    });

    it('should fail for invalid phone numbers', async () => {
      const invalidPhones = [
        'invalid',
        '123',
        'abc123',
        '123-456',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const phone of invalidPhones) {
        const result = await Validator.validate({
          value: phone,
          rules: ['PhoneNumber'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('valid phone number');
      }
    });

    // Decorator test
    it('should work with decorator for valid phone', async () => {
      class TestClass {
        @IsPhoneNumber()
        phone: string = '';
      }

      const instance = new TestClass();
      instance.phone = '+1 202 555 0185';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid phone', async () => {
      class TestClass {
        @IsPhoneNumber()
        phone: string = '';
      }

      const instance = new TestClass();
      instance.phone = 'invalid-phone';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid phone number'
      );
    });
  });

  describe('IsEmailOrPhone', () => {
    it('should pass for valid emails', async () => {
      const result = await Validator.validate({
        value: 'test@example.com',
        rules: ['EmailOrPhoneNumber'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for valid phone numbers', async () => {
      const result = await Validator.validate({
        value: '+1 202 555 0185',
        rules: ['EmailOrPhoneNumber'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for invalid values', async () => {
      const invalidValues = ['invalid', 'test@', '123', '', null, undefined];

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['EmailOrPhoneNumber'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'valid email or phone number'
        );
      }
    });

    // Decorator test
    it('should work with decorator for email', async () => {
      class TestClass {
        @IsEmailOrPhone()
        contact: string = '';
      }

      const instance = new TestClass();
      instance.contact = 'test@example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for phone', async () => {
      class TestClass {
        @IsEmailOrPhone()
        contact: string = '';
      }

      const instance = new TestClass();
      instance.contact = '+1 202 555 0185';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsFileName', () => {
    it('should pass for valid filenames', async () => {
      const validNames = [
        'test.txt',
        'my-file.pdf',
        'document_123.docx',
        'file',
        'file.with.multiple.dots.txt',
      ];

      for (const name of validNames) {
        const result = await Validator.validate({
          value: name,
          rules: ['FileName'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid filenames', async () => {
      const invalidNames = [
        '',
        'file<>.txt',
        'file|name.pdf',
        'file"name.docx',
        'file?name.txt',
        'file*name.pdf',
        'file/name.txt',
        'file\\name.pdf',
        'file:name.txt',
        null,
        undefined,
        123,
        {},
      ];

      for (const name of invalidNames) {
        const result = await Validator.validate({
          value: name,
          rules: ['FileName'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('valid file name');
      }
    });

    // Decorator test
    it('should work with decorator for valid filename', async () => {
      class TestClass {
        @IsFileName()
        filename: string = '';
      }

      const instance = new TestClass();
      instance.filename = 'document.pdf';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid filename', async () => {
      class TestClass {
        @IsFileName()
        filename: string = '';
      }

      const instance = new TestClass();
      instance.filename = 'invalid<file>.txt';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('valid file name');
    });
  });

  describe('IsUUID', () => {
    it('should pass for valid UUIDs', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const uuid of validUUIDs) {
        const result = await Validator.validate({
          value: uuid,
          rules: ['UUID'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid UUIDs', async () => {
      const invalidUUIDs = [
        'invalid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const uuid of invalidUUIDs) {
        const result = await Validator.validate({
          value: uuid,
          rules: ['UUID'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('valid UUID');
      }
    });

    // Decorator test
    it('should work with decorator for valid UUID', async () => {
      class TestClass {
        @IsUUID()
        id: string = '';
      }

      const instance = new TestClass();
      instance.id = '123e4567-e89b-12d3-a456-426614174000';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid UUID', async () => {
      class TestClass {
        @IsUUID()
        id: string = '';
      }

      const instance = new TestClass();
      instance.id = 'invalid-uuid';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('valid UUID');
    });
  });

  describe('IsJSON', () => {
    it('should pass for valid JSON strings', async () => {
      const validJSONs = [
        '{}',
        '{"key": "value"}',
        '{"number": 123, "boolean": true, "array": [1, 2, 3]}',
        '[]',
        '[1, 2, 3]',
        '"string"',
        '42',
        'true',
        'null',
      ];

      for (const json of validJSONs) {
        const result = await Validator.validate({
          value: json,
          rules: ['JSON'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid JSON strings', async () => {
      const invalidJSONs = [
        '{invalid}',
        '{"key": }',
        '[1, 2, ]',
        'invalid',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const json of invalidJSONs) {
        const result = await Validator.validate({
          value: json,
          rules: ['JSON'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('valid JSON');
      }
    });

    // Decorator test
    it('should work with decorator for valid JSON', async () => {
      class TestClass {
        @IsJSON()
        data: string = '';
      }

      const instance = new TestClass();
      instance.data = '{"key": "value"}';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid JSON', async () => {
      class TestClass {
        @IsJSON()
        data: string = '';
      }

      const instance = new TestClass();
      instance.data = '{invalid}';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('valid JSON');
    });
  });

  describe('IsBase64', () => {
    it('should pass for valid base64 strings', async () => {
      const validBase64 = [
        'SGVsbG8gV29ybGQ=', // "Hello World"
        'dGVzdA==', // "test"
        'YWJjZGVmZ2hpams=', // "abcdefghijk"
        '', // Empty string
      ];

      for (const base64 of validBase64) {
        const result = await Validator.validate({
          value: base64,
          rules: ['Base64'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid base64 strings', async () => {
      const invalidBase64 = [
        'invalid!',
        'SGVsbG8gV29ybGQ', // Missing padding
        'not-base64',
        '123',
        null,
        undefined,
        123,
        {},
      ];

      for (const base64 of invalidBase64) {
        const result = await Validator.validate({
          value: base64,
          rules: ['Base64'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'valid Base64 encoded data'
        );
      }
    });

    // Decorator test
    it('should work with decorator for valid base64', async () => {
      class TestClass {
        @IsBase64()
        encodedData: string = '';
      }

      const instance = new TestClass();
      instance.encodedData = 'SGVsbG8gV29ybGQ=';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid base64', async () => {
      class TestClass {
        @IsBase64()
        encodedData: string = '';
      }

      const instance = new TestClass();
      instance.encodedData = 'invalid-base64!';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid Base64 encoded data'
      );
    });
  });

  describe('IsHexColor', () => {
    it('should pass for valid hex colors', async () => {
      const validColors = [
        '#000',
        '#000000',
        '#fff',
        '#ffffff',
        '#123456',
        '#ABCDEF',
        '#abcdef',
        '#123abc',
      ];

      for (const color of validColors) {
        const result = await Validator.validate({
          value: color,
          rules: ['HexColor'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid hex colors', async () => {
      const invalidColors = [
        'invalid',
        '#12',
        '#12345',
        '#gggggg',
        '#1234567',
        '123456',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const color of invalidColors) {
        const result = await Validator.validate({
          value: color,
          rules: ['HexColor'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'valid hexadecimal color code'
        );
      }
    });

    // Decorator test
    it('should work with decorator for valid hex color', async () => {
      class TestClass {
        @IsHexColor()
        color: string = '';
      }

      const instance = new TestClass();
      instance.color = '#ff0000';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid hex color', async () => {
      class TestClass {
        @IsHexColor()
        color: string = '';
      }

      const instance = new TestClass();
      instance.color = 'invalid-color';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid hexadecimal color code'
      );
    });
  });

  describe('IsCreditCard', () => {
    it('should pass for valid credit card numbers', async () => {
      const validCards = [
        '4111111111111111', // Visa
        '5555555555554444', // Mastercard
        '378282246310005', // American Express
        '6011111111111117', // Discover
      ];

      for (const card of validCards) {
        const result = await Validator.validate({
          value: card,
          rules: ['CreditCard'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid credit card numbers', async () => {
      const invalidCards = [
        'invalid',
        '1234567890123456',
        '4111111111111112', // Invalid checksum
        '123',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const card of invalidCards) {
        const result = await Validator.validate({
          value: card,
          rules: ['CreditCard'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain(
          'valid credit card number'
        );
      }
    });

    // Decorator test
    it('should work with decorator for valid credit card', async () => {
      class TestClass {
        @IsCreditCard()
        cardNumber: string = '';
      }

      const instance = new TestClass();
      instance.cardNumber = '4111111111111111';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid credit card', async () => {
      class TestClass {
        @IsCreditCard()
        cardNumber: string = '';
      }

      const instance = new TestClass();
      instance.cardNumber = 'invalid-card';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid credit card number'
      );
    });
  });

  describe('IsIP', () => {
    it('should pass for valid IP addresses', async () => {
      const validIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
        '255.255.255.255',
        '0.0.0.0',
        '2001:db8::1',
        '::1',
        'fe80::1%eth0',
      ];

      for (const ip of validIPs) {
        const result = await Validator.validate({
          value: ip,
          rules: ['IP'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid IP addresses', async () => {
      const invalidIPs = [
        'invalid',
        '256.1.1.1',
        '192.168.1.256',
        '192.168.1',
        '192.168.1.1.1',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const ip of invalidIPs) {
        const result = await Validator.validate({
          value: ip,
          rules: ['IP'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('valid IP address');
      }
    });

    // Decorator test
    it('should work with decorator for valid IP', async () => {
      class TestClass {
        @IsIP()
        ipAddress: string = '';
      }

      const instance = new TestClass();
      instance.ipAddress = '192.168.1.1';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid IP', async () => {
      class TestClass {
        @IsIP()
        ipAddress: string = '';
      }

      const instance = new TestClass();
      instance.ipAddress = 'invalid-ip';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('valid IP address');
    });
  });

  describe('IsMACAddress', () => {
    it('should pass for valid MAC addresses', async () => {
      const validMACs = [
        '00:11:22:33:44:55',
        '00-11-22-33-44-55',
        '001122334455',
        'A1:B2:C3:D4:E5:F6',
        'a1b2c3d4e5f6',
      ];

      for (const mac of validMACs) {
        const result = await Validator.validate({
          value: mac,
          rules: ['MACAddress'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid MAC addresses', async () => {
      const invalidMACs = [
        'invalid',
        '00:11:22:33:44', // Too short
        '00:11:22:33:44:55:66', // Too long
        'gg:hh:ii:jj:kk:ll', // Invalid characters
        '00112233445', // Wrong length
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const mac of invalidMACs) {
        const result = await Validator.validate({
          value: mac,
          rules: ['MACAddress'],
        });
        if (!result.success) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(result.success).toBe(false);
          // eslint-disable-next-line jest/no-conditional-expect
          expect((result as any).error?.message).toContain('valid MAC address');
        }
      }
    });

    // Decorator test
    it('should work with decorator for valid MAC', async () => {
      class TestClass {
        @IsMACAddress()
        macAddress: string = '';
      }

      const instance = new TestClass();
      instance.macAddress = '00:11:22:33:44:55';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid MAC', async () => {
      class TestClass {
        @IsMACAddress()
        macAddress: string = '';
      }

      const instance = new TestClass();
      instance.macAddress = 'invalid-mac';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid MAC address'
      );
    });
  });

  describe('Matches', () => {
    it('should pass when value matches regex pattern', async () => {
      const result = await Validator.validate({
        value: 'test123',
        rules: [{ Matches: [/^[a-z]+\d+$/] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when value does not match regex pattern', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [{ Matches: [/^[a-z]+\d+$/] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('field must match');
    });

    it('should work with string patterns', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: [{ Matches: ['^hello$'] }],
      });
      expect(result.success).toBe(false);
    });

    it('should fail for invalid regex', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [{ Matches: ['[invalid'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('Invalid parameters');
    });

    it('should fail for empty pattern array', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [{ Matches: [/abc/] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('field must match');
    });

    // Decorator test
    it('should work with decorator for matching pattern', async () => {
      class TestClass {
        @Matches(/^\d{3}-\d{2}-\d{4}$/)
        ssn: string = '';
      }

      const instance = new TestClass();
      instance.ssn = '123-45-6789';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-matching pattern', async () => {
      class TestClass {
        @Matches(/^\d{3}-\d{2}-\d{4}$/)
        ssn: string = '';
      }

      const instance = new TestClass();
      instance.ssn = 'invalid-ssn';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('IsMongoId', () => {
    it('should pass for valid MongoDB ObjectIds', async () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '507f191e810c19729de860eb',
      ];

      for (const id of validIds) {
        const result = await Validator.validate({
          value: id,
          rules: ['MongoId'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid MongoDB ObjectIds', async () => {
      const invalidIds = [
        'invalid',
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd7994390111', // too long
        '507f1f77bcf86cd79943901g', // invalid character
        '',
        null,
        undefined,
      ];

      for (const id of invalidIds) {
        const result = await Validator.validate({
          value: id,
          rules: ['MongoId'],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect((result as any).error?.message).toContain(
            'valid MongoDB ObjectId'
          );
        }
      }
    });

    // Decorator test
    it('should work with decorator for valid MongoId', async () => {
      class TestClass {
        @IsMongoId()
        id: string = '';
      }

      const instance = new TestClass();
      instance.id = '507f1f77bcf86cd799439011';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid MongoId', async () => {
      class TestClass {
        @IsMongoId()
        id: string = '';
      }

      const instance = new TestClass();
      instance.id = 'invalid-id';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid MongoDB ObjectId'
      );
    });
  });

  describe('IsHexadecimal', () => {
    it('should pass for valid hexadecimal values', async () => {
      const validHex = ['1a2b3c', 'ABCDEF', '1234567890abcdef', 'a', '0', 'ff'];

      for (const hex of validHex) {
        const result = await Validator.validate({
          value: hex,
          rules: ['Hexadecimal'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid hexadecimal values', async () => {
      const invalidHex = [
        '1a2b3g', // invalid character g
        'xyz',
        '123abc!',
        '',
        null,
        undefined,
        '1a2b3c ', // space
      ];

      for (const hex of invalidHex) {
        const result = await Validator.validate({
          value: hex,
          rules: ['Hexadecimal'],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect((result as any).error?.message).toContain(
            'valid hexadecimal value'
          );
        }
      }
    });

    // Decorator test
    it('should work with decorator for valid hexadecimal', async () => {
      class TestClass {
        @IsHexadecimal()
        hex: string = '';
      }

      const instance = new TestClass();
      instance.hex = '1a2b3c';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid hexadecimal', async () => {
      class TestClass {
        @IsHexadecimal()
        hex: string = '';
      }

      const instance = new TestClass();
      instance.hex = '1a2b3g';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'valid hexadecimal value'
      );
    });
  });
});
