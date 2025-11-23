import { areEquals } from "../index";
describe('equals', () => {
    it('should return true for identical objects', () => {
        const obj1 = { a: 1, b: 'test' };
        const obj2 = { a: 1, b: 'test' };
        expect(areEquals(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
        const obj1 = { a: 1, b: 'test' };
        const obj2 = { a: 2, b: 'test' };
        expect(areEquals(obj1, obj2)).toBe(false);
    });

    it('should return true for identical arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 3];
        expect(areEquals(arr1, arr2)).toBe(true);
    });

    it('should return false for different arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 4];
        expect(areEquals(arr1, arr2)).toBe(false);
    });

    it('should return true for identical Maps', () => {
        const map1 = new Map([[1, 'a'], [2, 'b']]);
        const map2 = new Map([[1, 'a'], [2, 'b']]);
        expect(areEquals(map1, map2)).toBe(true);
    });

    it('should return false for different Maps', () => {
        const map1 = new Map([[1, 'a'], [2, 'b']]);
        const map2 = new Map([[1, 'a'], [2, 'c']]);
        expect(areEquals(map1, map2)).toBe(false);
    });

    it('should return true for identical Sets', () => {
        const set1 = new Set([1, 2, 3]);
        const set2 = new Set([1, 2, 3]);
        expect(areEquals(set1, set2)).toBe(true);
    });

    it('should return false for different Sets', () => {
        const set1 = new Set([1, 2, 3]);
        const set2 = new Set([1, 2, 4]);
        expect(areEquals(set1, set2)).toBe(false);
    });

    it('should return true for identical ArrayBuffers', () => {
        const buffer1 = new ArrayBuffer(8);
        const view1 = new Int32Array(buffer1);
        view1[0] = 42;
        const buffer2 = new ArrayBuffer(8);
        const view2 = new Int32Array(buffer2);
        view2[0] = 42;
        expect(areEquals(buffer1, buffer2)).toBe(true);
    });

    it('should return false for different ArrayBuffers', () => {
        const buffer1 = new ArrayBuffer(8);
        const view1 = new Int32Array(buffer1);
        view1[0] = 42;
        const buffer2 = new ArrayBuffer(8);
        const view2 = new Int32Array(buffer2);
        view2[0] = 43;
        expect(areEquals(buffer1, buffer2)).toBe(false);
    });

    it('should return true for identical RegExp objects', () => {
        const regExp1 = /test/g;
        const regExp2 = /test/g;
        expect(areEquals(regExp1, regExp2)).toBe(true);
    });

    it('should return false for different RegExp objects', () => {
        const regExp1 = /test/g;
        const regExp2 = /test/i;
        expect(areEquals(regExp1, regExp2)).toBe(false);
    });

    it('should return true for identical primitive values', () => {
        expect(areEquals(42, 42)).toBe(true);
        expect(areEquals('test', 'test')).toBe(true);
        expect(areEquals(true, true)).toBe(true);
    });

    it('should return false for different primitive values', () => {
        expect(areEquals(42, 43)).toBe(false);
        expect(areEquals('test', 'Test')).toBe(false);
        expect(areEquals(true, false)).toBe(false);
    });

    it('should return true for NaN compared to NaN', () => {
        expect(areEquals(NaN, NaN)).toBe(true);
    });
});
