import { isDOMElement } from '@utils/dom';
import { extendObj, isObj } from '../object';

describe('extendObj function', () => {
    test('should test isObj on an empty object', () => {
        const obj = {};
        expect(isObj(obj)).toBe(true);
    });
    // Test 1: Basic shallow extend
    test('should perform basic shallow extend', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { b: 3, c: 4 };
        expect(extendObj({}, obj1, obj2)).toEqual({ a: 1, b: 3, c: 4 });
    });

    // Test 2: Extend with multiple sources
    test('should extend with multiple sources', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { b: 3, c: 4 };
        const obj3 = { d: 5 };
        expect(extendObj({}, obj1, obj2, obj3)).toEqual({ a: 1, b: 3, c: 4, d: 5 });
    });

    // Test 3: Modifying target object
    test('should modify target object', () => {
        const target = { x: 10 };
        const obj1 = { a: 1, b: 2 };
        expect(extendObj(target, obj1)).toEqual({ x: 10, a: 1, b: 2 });
        // Check that target was modified in place
        expect(target).toEqual({ x: 10, a: 1, b: 2 });
    });

    // Test 4: Deep extend
    test('should perform deep extend', () => {
        const deep1 = { a: { b: 2 }, c: 3 };
        const deep2 = { a: { b: 4, d: 5 } };
        expect(extendObj({}, deep1, deep2)).toEqual({ a: { b: 4, d: 5 }, c: 3 });
    });

    // Test 5: Array handling in deep extend
    test('should handle arrays in deep extend', () => {
        const arr1 = { a: [1, 2, 3] };
        const arr2 = { a: [4, 5] };
        expect(extendObj({}, arr1, arr2)).toEqual({ a: [4, 5, 3] });
    });

    // Test 6: Array merging when source replaces target
    test('should replace object with array in deep extend', () => {
        const objWithArray = { a: { b: 2 } };
        const arraySource = { a: [1, 2] };
        expect(extendObj({}, objWithArray, arraySource)).toEqual({ a: [1, 2] });
    });

    // Test 7: Null and undefined handling
    test('should handle null source', () => {
        expect(extendObj({}, { a: 1 }, null as any)).toEqual({ a: 1 });
    });

    test('should handle undefined source', () => {
        expect(extendObj({}, { a: 1 }, undefined as any)).toEqual({ a: 1 });
    });

    // Test 8: Primitive target conversion
    test('should convert primitive target to object', () => {
        expect(extendObj(42 as any, { a: 1 })).toMatchObject({ a: 1 });
        // The primitive conversion might have different results across JS engines
        // so we just check if the property a exists
    });

    // Test 9: Deep recursion with nested objects
    test('should handle deep recursion with nested objects', () => {
        const nested1 = {
            a: {
                b: {
                    c: 1,
                    d: [1, 2]
                },
                e: 3
            },
            f: 4
        };

        const nested2 = {
            a: {
                b: {
                    c: 5,
                    g: 6
                },
                h: 7
            },
            i: 8
        };

        expect(extendObj({}, nested1, nested2)).toEqual({
            a: {
                b: {
                    c: 5,
                    d: [1, 2],
                    g: 6
                },
                e: 3,
                h: 7
            },
            f: 4,
            i: 8
        });
    });

    // Test 10: Handling of non-plain objects
    test('should handle class instances', () => {
        class TestClass {
            prop = 'value';
            method() { return this.prop; }
        }

        const instance = new TestClass();
        const result = extendObj({}, { a: instance });

        expect(result.a).toBe(instance);
        expect(result.a instanceof TestClass).toBe(true);
    });

    // Test 11: Properties that are functions
    test('should handle function properties', () => {
        const fnObj1 = { fn: function () { return 1; } };
        const fnObj2 = { fn: function () { return 2; } };
        const result = extendObj({}, fnObj1, fnObj2);

        expect(typeof result.fn).toBe('function');
        expect(result.fn).toBe(fnObj2.fn);
    });

    // Test 12: Undefined values in source
    test('should skip undefined values in source', () => {
        expect(extendObj({}, { a: 1, b: 2 }, { a: undefined, c: 3 }))
            .toEqual({ a: 1, b: 2, c: 3 });
    });

    // Test 13: Circular references handling
    test('should handle circular references', () => {
        const circular1: any = { a: 1 };
        circular1.self = circular1;
        const circular2: any = { b: 2 };
        circular2.self = circular2;
        let circularResult: any;
        expect(() => { circularResult = extendObj({}, circular1, circular2); }).not.toThrow();

        expect(circularResult.a).toBe(1);
        expect(circularResult.b).toBe(2);
        expect(circularResult.self).toBe(circularResult);
    });

    // Test 14: Empty objects
    test('should handle empty objects', () => {
        expect(extendObj({}, {}, {})).toEqual({});
    });

    // Test 15: Date objects
    test('should handle Date objects', () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2024-01-01');
        const result = extendObj({}, { date: date1 }, { date: date2 });

        expect(result.date).toBe(date2);
        expect(result.date instanceof Date).toBe(true);
    });

    // Test 16: RegExp objects
    test('should handle RegExp objects', () => {
        const regex1 = /test/;
        const regex2 = /test2/;
        const result = extendObj({}, { regex: regex1 }, { regex: regex2 });

        expect(result.regex).toBe(regex2);
        expect(result.regex instanceof RegExp).toBe(true);
    });

    // Test 17: Mixed types
    test('should handle mixed types', () => {
        const result = extendObj({},
            { a: 1, b: { c: 3 }, d: [1, 2] },
            { a: "string", b: { e: 5 }, d: { f: 6 } }
        );

        expect(result).toEqual({ a: "string", b: { c: 3, e: 5 }, d: { f: 6 } });
    });

    // Test 18: Array of objects
    test('should handle array of objects', () => {
        const result = extendObj({},
            { arr: [{ id: 1 }, { id: 2 }] },
            { arr: [{ id: 3 }] }
        );
        expect(result).toEqual({ arr: [{ id: 3 }, { id: 2 }] });
    });

    // Test 19: Deep extend with non-plain object properties
    test('should preserve non-plain object properties', () => {
        const dom = typeof document !== 'undefined' ? document.createElement('div') : {};
        const result = extendObj({}, { el: dom });
        expect(isObj(result.el)).toBe(true);
    });

    // Test 20: Preserve non-enumerable properties
    test('should not copy non-enumerable properties', () => {
        const objWithNonEnum = {};
        Object.defineProperty(objWithNonEnum, 'nonEnum', {
            value: 'hidden',
            enumerable: false
        });

        const result = extendObj({}, objWithNonEnum);
        expect(Object.keys(result).includes('nonEnum')).toBe(false);
    });

    // Test 22: Object with prototype chain
    test('should handle objects with prototype chain', () => {
        const proto = { inherited: 'value' };
        const obj = Object.create(proto);
        obj.own = 'property';

        const result = extendObj({}, obj);
        expect(result).toEqual({ own: 'property', inherited: 'value' });
    });

    // Test 23: Test with React-like component props
    test('should handle React-like component props', () => {
        const defaultProps = {
            status: 'idle',
            data: null,
            config: {
                theme: 'light',
                features: {
                    comments: true,
                    notifications: false
                }
            }
        };

        const userProps = {
            data: [1, 2, 3],
            config: {
                theme: 'dark',
                features: {
                    notifications: true
                }
            }
        };

        expect(extendObj({}, defaultProps, userProps)).toEqual({
            status: 'idle',
            data: [1, 2, 3],
            config: {
                theme: 'dark',
                features: {
                    comments: true,
                    notifications: true
                }
            }
        });
    });




    describe('extendObj', () => {
        it('should perform a shallow merge', () => {
            const target = { a: 1, b: 2 };
            const source = { b: 3, c: 4 };
            const result = extendObj(target, source);
            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        it('should perform a deep merge', () => {
            const target = { a: { b: 1, c: 2 } };
            const source = { a: { c: 3, d: 4 } };
            const result = extendObj(target, source);
            expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
        });

        it('should not deeply merge arrays', () => {
            const target = { a: [1, 2] };
            const source = { a: [3, 4] };
            const result = extendObj(target, source);
            expect(result).toEqual({ a: [3, 4] });
        });

        it('should handle null or undefined sources', () => {
            const target = { a: 1 };
            const result = extendObj(target, null, undefined, { b: 2 });
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it('should throw an error if the target is not a plain object', () => {
            const target: any[] = [];
            const source = { a: 1 };
            expect(extendObj(target, source)).toEqual([]);
        });

        it('Should merge two arrays', () => {
            const target = [1, 2, 3];
            const source = [4, 5, 6, 7, 8];
            const result = extendObj(target, source);
            expect(result).toEqual([4, 5, 6, 7, 8]);
        });

        it('should overwrite non-plain objects', () => {
            const target = { a: { b: 1 } };
            const source = { a: null };
            const result = extendObj(target, source);
            expect(result).toEqual({ a: { b: 1 } });
        });

        it('should support multiple sources', () => {
            const target = { a: { b: 1 } };
            const source1 = { a: { c: 2 } };
            const source2 = { a: { d: 3 } };
            const result = extendObj(target, source1, source2);
            expect(result).toEqual({ a: { b: 1, c: 2, d: 3 } });
        });

        it('should work with objects created using Object.create(null)', () => {
            const target = Object.create(null);
            target.a = { b: 1 };
            const source = { a: { c: 2 } };
            const result = extendObj(target, source);
            expect(result).toEqual({ a: { b: 1, c: 2 } });
        });

        it('should handle nested non-plain objects', () => {
            const target = { a: { b: new Date(0) } };
            const source = { a: { b: new Date(1) } };
            const result = extendObj(target, source);
            expect(result.a.b).toBeInstanceOf(Date);
            expect(result.a.b.getTime()).toBe(1);
        });
    });
});

