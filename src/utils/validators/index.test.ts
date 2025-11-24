import { isValidImageSrc } from '@utils/image';
import '../string';
import { isValidEmail } from './index';

describe('Validator Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test.name@example.com')).toBe(true);
      expect(isValidEmail('test+name@example.co.uk')).toBe(true);
      expect(isValidEmail('test_name@sub.example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test@.')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });
  });

  describe('isValidImageSrc', () => {
    it('should return true for valid image URLs', () => {
      expect(isValidImageSrc('https://example.com/image.jpg')).toBe(true);
      expect(isValidImageSrc('http://sub.example.com/path/image.png')).toBe(
        true
      );
      expect(isValidImageSrc('blob:http://example.com/image.jpg')).toBe(true);
    });

    it('should return false for invalid valid data URLs', () => {
      expect(isValidImageSrc('data:image/jpeg;base64,abc123')).toBe(false);
      expect(isValidImageSrc('data:image/png;base64,xyz789')).toBe(false);
    });

    it('should return false for invalid sources', () => {
      expect(isValidImageSrc('invalid-url')).toBe(false);
      expect(isValidImageSrc('')).toBe(false);
      expect(isValidImageSrc(null)).toBe(false);
      expect(isValidImageSrc(undefined)).toBe(false);
    });
  });
});
