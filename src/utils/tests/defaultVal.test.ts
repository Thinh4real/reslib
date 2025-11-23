import { defaultVal } from '../index';

describe('defaultVal', () => {
    it('should return first non-null and non-undefined value', () => {
        expect(defaultVal(undefined, 'test', null)).toBe('test');
        expect(defaultVal(undefined, 123, 'test')).toBe(123);
    });

    it('should handle all undefined values', () => {
        expect(defaultVal(undefined, undefined, undefined)).toBe(undefined);
    });

    it('should return null if only null values are found', () => {
        expect(defaultVal(null, null, null)).toBe(null);
    });

    it('should handle mixed null and undefined values', () => {
        expect(defaultVal(undefined, null, undefined)).toBe(null);
        expect(defaultVal(null, undefined, null)).toBe(null);
    });

    it('should handle falsy values correctly', () => {
        expect(defaultVal(false, null, undefined)).toBe(false);
        expect(defaultVal(0, null, undefined)).toBe(0);
        expect(defaultVal('', null, undefined)).toBe('');
    });

    it('should handle objects and arrays', () => {
        const obj = { test: true };
        const arr = [1, 2, 3];
        expect(defaultVal(undefined, obj, null)).toBe(obj);
        expect(defaultVal(null, undefined, arr)).toBe(arr);
    });

    it('should handle no arguments', () => {
        expect(defaultVal()).toBe(undefined);
    });

    it('should handle complex nested values', () => {
        const complexObj = { nested: { value: true } };
        expect(defaultVal(undefined, null, complexObj)).toBe(complexObj);
    });
});
