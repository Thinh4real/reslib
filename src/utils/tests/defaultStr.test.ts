import { defaultStr } from '../index';

describe('defaultStr', () => {
    it('should return the first non-null string value', () => {
        expect(defaultStr(123, 'hello', 'world')).toBe('hello');
        expect(defaultStr(null, undefined, 'test')).toBe('test');
    });

    it('should return empty string when no valid strings are provided', () => {
        expect(defaultStr(123, null, undefined)).toBe('');
        expect(defaultStr()).toBe('');
    });

    it('should handle empty strings correctly', () => {
        expect(defaultStr('', 'test')).toBe("test");
        expect(defaultStr(null, '', 'test')).toBe('test');
    });

    it('should handle objects and arrays', () => {
        expect(defaultStr({}, [], 'valid')).toBe('valid');
        expect(defaultStr({ toString: () => 'test' }, 'actual')).toBe('actual');
    });

    it('should handle boolean and number values', () => {
        expect(defaultStr(true, false, 'string')).toBe('string');
        expect(defaultStr(0, 1, 'number')).toBe('number');
    });

    it('should handle special characters and unicode strings', () => {
        expect(defaultStr('🌟', '测试', 'test')).toBe('🌟');
        expect(defaultStr('\n\t', 'whitespace')).toBe('\n\t');
    });

    it('should handle String objects', () => {
        expect(defaultStr(new String('test'), 'normal')).toBe('normal');
        expect(defaultStr(String('direct'), 'other')).toBe('direct');
    });
});
