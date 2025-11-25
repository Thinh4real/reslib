import { JsonHelper } from '@/utils/json';

describe('JsonHelper.isJSON', () => {
  test('returns true for object/array JSON strings', () => {
    expect(JsonHelper.isJSON('{"a":1}')).toBe(true);
    expect(JsonHelper.isJSON('[1,2,3]')).toBe(true);
    expect(JsonHelper.isJSON('  { "x": [1,2] }  ')).toBe(true);
  });

  test('returns false for primitive JSON values or invalid JSON', () => {
    expect(JsonHelper.isJSON('123')).toBe(false);
    expect(JsonHelper.isJSON('"a string"')).toBe(false);
    expect(JsonHelper.isJSON('true')).toBe(false);
    expect(JsonHelper.isJSON('null')).toBe(false);
    expect(JsonHelper.isJSON('')).toBe(false);
    expect(JsonHelper.isJSON(undefined)).toBe(false);
    expect(JsonHelper.isJSON('{ "a": 1, }')).toBe(false); // trailing comma invalid
  });
});

describe('JsonHelper.parse', () => {
  test('parses object/array JSON strings', () => {
    expect(JsonHelper.parse('{"foo": "bar"}')).toEqual({ foo: 'bar' });
    expect(JsonHelper.parse('[1,2]')).toEqual([1, 2]);
  });

  test('parses primitives', () => {
    expect(JsonHelper.parse('123')).toBe(123);
    // eslint-disable-next-line no-useless-escape
    expect(JsonHelper.parse('\"abc\"')).toBe('abc');
    expect(JsonHelper.parse('true')).toBe(true);
    expect(JsonHelper.parse('false')).toBe(false);
    expect(JsonHelper.parse('null')).toBeNull();
  });

  test('recursively parses nested JSON strings and respects primitives', () => {
    const nested = JSON.stringify({ a: JSON.stringify({ b: 2 }), c: '123' });
    const result = JsonHelper.parse(nested);
    // nested.a is parsed into object and nested.c parsed into primitive number
    expect(result).toEqual({ a: { b: 2 }, c: '123' });
  });

  test('parses object input by recursing into its properties', () => {
    const obj = { x: '{"y": [1,2,3]}' };
    const parsed = JsonHelper.parse(obj);
    expect(parsed.x).toEqual({ y: [1, 2, 3] });
  });

  test('does not throw on invalid json: returns original string or object', () => {
    const bad = '{"a":1,}';
    expect(JsonHelper.parse(bad)).toBe(bad);
    const badObj = { a: bad };
    expect(JsonHelper.parse(badObj)).toEqual({ a: bad });
  });

  test('respects reviver passed to JSON.parse for nested parse', () => {
    const s = JSON.stringify({ a: JSON.stringify({ b: 1 }) });
    const res = JsonHelper.parse(s, (key, value) => {
      if (typeof value === 'number') return value + 1;
      return value;
    });
    expect(res).toEqual({ a: { b: 2 } });
  });
});

describe('JsonHelper.isJSON additional cases', () => {
  test('returns false for non-object root tokens and comments', () => {
    expect(JsonHelper.isJSON('// comment\n{"a":1}')).toBe(false);
    expect(JsonHelper.isJSON('{a:1}')).toBe(false); // unquoted keys
    expect(JsonHelper.isJSON('{ "a": 1 /* comment */ }')).toBe(false);
  });
});

describe('JsonHelper.decycle', () => {
  test('removes functions and avoids infinite recursion for circular references', () => {
    const a: any = { name: 'a' };
    const b: any = { name: 'b', fn: () => 1 };
    a.other = b;
    b.self = a; // circular
    const decycled = JsonHelper.decycle(a);
    expect(decycled.name).toBe('a');
    expect(decycled.other.name).toBe('b');
    // functions are removed -> property is undefined
    expect(Object.prototype.hasOwnProperty.call(decycled.other, 'fn')).toBe(
      true
    );
    expect(decycled.other.fn).toBeUndefined();
    // circular replaced with null
    expect(decycled.other.self).toBeNull();
  });

  test('decycles arrays and preserves structure', () => {
    const arr: any[] = [1, () => {}, { a: 2 }];
    arr.push(arr);
    const dec = JsonHelper.decycle(arr);
    expect(Array.isArray(dec)).toBe(true);
    // first element remains
    expect(dec[0]).toBe(1);
    // function element becomes undefined and will become null when stringified
    expect(dec[1]).toBeUndefined();
    // circular becomes null
    expect(dec[3]).toBeNull();
  });
});

describe('JsonHelper.stringify', () => {
  test('returns string input unchanged (prevents double-quoting)', () => {
    expect(JsonHelper.stringify('%s %v')).toBe('%s %v');
    const jsonStr = JSON.stringify({ a: 1 });
    expect(JsonHelper.stringify(jsonStr)).toBe(jsonStr);
  });

  test('decyles circular references when decycle flag is true', () => {
    const a: any = { n: 1 };
    a.self = a;
    const s = JsonHelper.stringify(a, true);
    const parsed = JSON.parse(s);
    expect(parsed.n).toBe(1);
    expect(parsed.self).toBeNull();
  });

  test('throws when circular and decycle flag not set', () => {
    const a: any = { n: 1 };
    a.self = a;
    expect(() => JsonHelper.stringify(a)).toThrow(TypeError);
  });
});
