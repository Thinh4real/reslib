import { defaultBool } from '../index';

describe('defaultBool', () => {
    it('should return the first boolean value in the arguments', () => {
        expect(defaultBool('string', true, false)).toBe(true);
        expect(defaultBool(null, false, true)).toBe(false);
    });

    it('should return false when no boolean values are provided', () => {
        expect(defaultBool('string', 123, null, undefined)).toBe(false);
        expect(defaultBool()).toBe(false);
    });

    it('should handle mixed type arguments', () => {
        expect(defaultBool({}, [], 42, true, 'string')).toBe(true);
        expect(defaultBool(new Date(), Symbol(), false, true)).toBe(false);
    });

    it('should handle objects with boolean properties', () => {
        const obj = { value: true };
        expect(defaultBool(obj, obj.value)).toBe(true);
    });

    it('should handle boolean expressions', () => {
        expect(defaultBool(1 > 2, 2 > 1)).toBe(false);
        expect(defaultBool('a' === 'a', Object.is(1, 2))).toBe(true);
    });

    it('should handle boolean objects', () => {
        expect(defaultBool(new Boolean(true), true)).toBe(true);
        expect(defaultBool(new Boolean(false), Object(false))).toBe(false);
    });
});
