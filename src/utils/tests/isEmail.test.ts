import { isEmail } from '../isEmail';

describe('isEmail', () => {
  describe('Valid email addresses', () => {
    test('should accept simple valid emails', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('test@test.co')).toBe(true);
      expect(isEmail('a@b.cd')).toBe(true);
    });

    test('should accept emails with dots in local part', () => {
      expect(isEmail('first.last@example.com')).toBe(true);
      expect(isEmail('user.name.long@example.com')).toBe(true);
    });

    test('should accept emails with plus signs', () => {
      expect(isEmail('user+tag@example.com')).toBe(true);
      expect(isEmail('test+123@domain.co.uk')).toBe(true);
    });

    test('should accept emails with special characters in local part', () => {
      expect(isEmail('user_name@example.com')).toBe(true);
      expect(isEmail('user-name@example.com')).toBe(true);
      expect(isEmail('!#$%&*+-/=?^_`{|}~@example.com')).toBe(true);
    });

    test('should accept emails with numbers', () => {
      expect(isEmail('user123@example.com')).toBe(true);
      expect(isEmail('123@example.com')).toBe(true);
      expect(isEmail('user@123.com')).toBe(true);
    });

    test('should accept emails with subdomains', () => {
      expect(isEmail('user@mail.example.com')).toBe(true);
      expect(isEmail('user@sub.mail.example.com')).toBe(true);
    });

    test('should accept emails with long TLDs', () => {
      expect(isEmail('user@example.museum')).toBe(true);
      expect(isEmail('user@example.international')).toBe(true);
    });

    test('should accept quoted strings in local part', () => {
      expect(isEmail('"user"@example.com')).toBe(true);
      expect(isEmail('"user.name"@example.com')).toBe(true);
      expect(isEmail('"user..name"@example.com')).toBe(true);
      expect(isEmail('"user@name"@example.com')).toBe(true);
    });

    test('should accept IP addresses as domain', () => {
      expect(isEmail('user@[192.168.1.1]')).toBe(true);
      expect(isEmail('user@[127.0.0.1]')).toBe(true);
      expect(isEmail('user@[255.255.255.255]')).toBe(true);
    });

    test('should accept IPv6 addresses', () => {
      expect(isEmail('user@[2001:0db8:85a3:0000:0000:8a2e:0370:7334]')).toBe(
        true
      );
      expect(isEmail('user@[2001:db8::1]')).toBe(true);
      expect(isEmail('user@[::1]')).toBe(true);
    });

    test('should accept emails with hyphens in domain', () => {
      expect(isEmail('user@my-domain.com')).toBe(true);
      expect(isEmail('user@test-mail-server.example.com')).toBe(true);
    });

    test('should handle whitespace trimming', () => {
      expect(isEmail('  user@example.com  ')).toBe(true);
      expect(isEmail('\tuser@example.com\n')).toBe(true);
    });
  });

  describe('Invalid email addresses', () => {
    test('should reject empty or null values', () => {
      expect(isEmail('')).toBe(false);
      expect(isEmail(null as any)).toBe(false);
      expect(isEmail(undefined as any)).toBe(false);
      expect(isEmail('   ')).toBe(false);
    });

    test('should reject non-string values', () => {
      expect(isEmail(123 as any)).toBe(false);
      expect(isEmail({} as any)).toBe(false);
      expect(isEmail([] as any)).toBe(false);
    });

    test('should reject emails without @', () => {
      expect(isEmail('userexample.com')).toBe(false);
      expect(isEmail('user.example.com')).toBe(false);
    });

    test('should reject emails with multiple @', () => {
      expect(isEmail('user@@example.com')).toBe(false);
      expect(isEmail('user@name@example.com')).toBe(false);
    });

    test('should reject emails starting with @', () => {
      expect(isEmail('@example.com')).toBe(false);
    });

    test('should reject emails ending with @', () => {
      expect(isEmail('user@')).toBe(false);
    });

    test('should reject emails with dots at start/end of local part', () => {
      expect(isEmail('.user@example.com')).toBe(false);
      expect(isEmail('user.@example.com')).toBe(false);
    });

    test('should reject emails with consecutive dots in local part', () => {
      expect(isEmail('user..name@example.com')).toBe(false);
      expect(isEmail('user...name@example.com')).toBe(false);
    });

    test('should reject emails without domain extension', () => {
      expect(isEmail('user@domain')).toBe(false);
      expect(isEmail('user@localhost')).toBe(false);
    });

    test('should reject emails with invalid characters in local part', () => {
      expect(isEmail('user name@example.com')).toBe(false);
      expect(isEmail('user<>@example.com')).toBe(false);
      expect(isEmail('user,@example.com')).toBe(false);
      expect(isEmail('user;@example.com')).toBe(false);
    });

    test('should reject emails with invalid domain', () => {
      expect(isEmail('user@.com')).toBe(false);
      expect(isEmail('user@domain.')).toBe(false);
      expect(isEmail('user@domain..com')).toBe(false);
    });

    test('should reject domains starting/ending with hyphen', () => {
      expect(isEmail('user@-domain.com')).toBe(false);
      expect(isEmail('user@domain-.com')).toBe(false);
    });

    test('should reject TLDs that are too short', () => {
      expect(isEmail('user@example.c')).toBe(false);
    });

    test('should reject TLDs with numbers', () => {
      expect(isEmail('user@example.c0m')).toBe(false);
      expect(isEmail('user@example.123')).toBe(false);
    });

    test('should reject emails exceeding length limits', () => {
      const longLocal = 'a'.repeat(65);
      expect(isEmail(`${longLocal}@example.com`)).toBe(false);

      const longDomain = 'a'.repeat(250) + '.com';
      expect(isEmail(`user@${longDomain}`)).toBe(false);

      const tooLong = 'a'.repeat(200) + '@' + 'b'.repeat(200) + '.com';
      expect(isEmail(tooLong)).toBe(false);
    });

    test('should reject invalid IP addresses', () => {
      expect(isEmail('user@[256.1.1.1]')).toBe(false);
      expect(isEmail('user@[192.168.1]')).toBe(false);
      expect(isEmail('user@[192.168.1.1.1]')).toBe(false);
      expect(isEmail('user@[not.an.ip]')).toBe(false);
    });

    test('should reject invalid IPv6 addresses', () => {
      expect(isEmail('user@[:::1]')).toBe(false);
      expect(isEmail('user@[gggg::1]')).toBe(false);
      expect(isEmail('user@[12345::1]')).toBe(false);
    });

    test('should reject domain labels exceeding 63 characters', () => {
      const longLabel = 'a'.repeat(64);
      expect(isEmail(`user@${longLabel}.com`)).toBe(false);
    });

    test('should reject malformed quoted strings', () => {
      expect(isEmail('"user@example.com')).toBe(false);
      expect(isEmail('user"@example.com')).toBe(false);
      expect(isEmail('"user"name"@example.com')).toBe(false);
    });

    test('should reject emails with spaces in domain', () => {
      expect(isEmail('user@exam ple.com')).toBe(false);
      expect(isEmail('user@example .com')).toBe(false);
    });

    test('should reject emails with special chars in domain', () => {
      expect(isEmail('user@exam!ple.com')).toBe(false);
      expect(isEmail('user@example$.com')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle minimum valid email', () => {
      expect(isEmail('a@b.cd')).toBe(true);
    });

    test('should handle maximum local part length (64 chars)', () => {
      const localPart = 'a'.repeat(64);
      expect(isEmail(`${localPart}@example.com`)).toBe(true);
    });

    test('should handle maximum domain length (255 chars)', () => {
      const domain = 'a'.repeat(240) + '.com';
      expect(isEmail(`user@${domain}`)).toBe(true);
    });

    test('should handle case sensitivity appropriately', () => {
      expect(isEmail('User@Example.COM')).toBe(true);
      expect(isEmail('USER@EXAMPLE.COM')).toBe(true);
    });

    test('should handle all valid special chars in local part', () => {
      expect(isEmail("!#$%&'*+-/=?^_`{|}~@example.com")).toBe(true);
    });

    test('should reject @ in unquoted local part', () => {
      expect(isEmail('user@name@example.com')).toBe(false);
    });

    test('should accept @ in quoted local part', () => {
      expect(isEmail('"user@name"@example.com')).toBe(true);
    });
  });
  describe('isEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isEmail('test.name@example.com')).toBe(true);
      expect(isEmail('test+name@example.co.uk')).toBe(true);
      expect(isEmail('test_name@sub.example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isEmail('test@.com')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('test@example')).toBe(false);
      expect(isEmail('test@.')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isEmail(null as any)).toBe(false);
      expect(isEmail(undefined as any)).toBe(false);
      expect(isEmail(123 as any)).toBe(false);
      expect(isEmail({} as any)).toBe(false);
    });
  });
});
