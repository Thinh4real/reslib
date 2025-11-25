import { isImageSrc } from '@utils/image';

describe('isImageSrc', () => {
  it('should return true for valid image URLs', () => {
    expect(isImageSrc('https://example.com/image.jpg')).toBe(true);
    expect(isImageSrc('http://sub.example.com/path/image.png')).toBe(true);
    expect(isImageSrc('blob:http://example.com/image.jpg')).toBe(true);
  });

  it('should return false for invalid valid data URLs', () => {
    expect(isImageSrc('data:image/jpeg;base64,abc123')).toBe(false);
    expect(isImageSrc('data:image/png;base64,xyz789')).toBe(false);
  });

  it('should return false for invalid sources', () => {
    expect(isImageSrc('invalid-url')).toBe(false);
    expect(isImageSrc('')).toBe(false);
    expect(isImageSrc(null)).toBe(false);
    expect(isImageSrc(undefined)).toBe(false);
  });
});
