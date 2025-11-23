import { isEmpty } from '../index';

describe('isEmpty', () => {
    it('should return false for an empty object', () => {
        expect(isEmpty({})).toBe(false);
    });

    it('should return true for a string with only whitespace', () => {
        expect(isEmpty('   ')).toBe(false);
    });

    it('should return true for a string with newlines and tabs', () => {
        expect(isEmpty('\n\t')).toBe(false);
    });

    it('should return false for zero', () => {
        expect(isEmpty(0)).toBe(false);
    });

    it('should return false for false boolean', () => {
        expect(isEmpty(false)).toBe(false);
    });

    it('should return false for a Date object', () => {
        expect(isEmpty(new Date())).toBe(false);
    });

    it('should return false for a non-empty Map', () => {
        const map = new Map();
        map.set('key', 'value');
        expect(isEmpty(map)).toBe(false);
    });

    it('should return false for a non-empty Set', () => {
        const set = new Set([1, 2, 3]);
        expect(isEmpty(set)).toBe(false);
    });

    it('should return true for an empty TypedArray', () => {
        expect(isEmpty(new Int32Array())).toBe(false);
    });

    it('should return false for a non-empty TypedArray', () => {
        expect(isEmpty(new Int32Array([1, 2, 3]))).toBe(false);
    });

    it('should return false for a function', () => {
        expect(isEmpty(() => { })).toBe(false);
    });

    it('should return false for a symbol', () => {
        expect(isEmpty(Symbol('test'))).toBe(false);
    });
});
