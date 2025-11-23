import "../index";
import { isObj, cloneObject, objectSize, defaultObj, extendObj, flattenObject, isIterableStructure } from "../object";

describe("isObj", () => {
  it("should return false for a string", () => {
    expect(isObj("hello")).toBe(false);
  });

  it("should return true for a plain object", () => {
    expect(isObj({ a: true })).toBe(true);
  });

  it("should return false for a function", () => {
    expect(isObj(() => true)).toBe(false);
  });

  it("should return false for an array", () => {
    expect(isObj([1, 2, 3])).toBe(false);
  });

  it("should return false for a Date object", () => {
    expect(isObj(new Date())).toBe(false);
  });

  it("should return true for a plain object created using Object.create", () => {
    const obj = Object.create(null);
    expect(isObj(obj)).toBe(true);
  });
});

describe("cloneObject", () => {
  it("should clone a simple object", () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = cloneObject(original);
    expect(cloned).toEqual(original);
    cloned.b.c = 3;
    expect(original.b.c).toBe(2);
  });

  it("should clone an array", () => {
    const originalArray = [1, 2, { a: 3 }];
    const clonedArray = cloneObject(originalArray);
    expect(clonedArray).toEqual(originalArray);
    (clonedArray[2] as any).a = 4;
    expect((originalArray[2] as any)?.a).toBe(3);
  });

  it("should clone a nested structure", () => {
    const complexObject = { a: 1, b: [2, { c: 3 }] };
    const clonedComplex = cloneObject(complexObject);
    expect(clonedComplex).toEqual(complexObject);
  });
});

describe("isObj", () => {
  it("should return false for a string", () => {
    expect(isObj("hello")).toBe(false);
  });

  it("should return true for a plain object", () => {
    expect(isObj({ a: true })).toBe(true);
  });

  it("should return false for an array", () => {
    expect(isObj([1, 2, 3])).toBe(false);
  });

  it("should return false for a function", () => {
    expect(isObj(() => true)).toBe(false);
  });

  it("should return false for a Date object", () => {
    expect(isObj(new Date())).toBe(false);
  });

  it("should return true for a plain object created using Object.create", () => {
    const obj = Object.create(null);
    expect(isObj(obj)).toBe(true);
  });
});

describe("objectSize", () => {
  it("should return the size of an object", () => {
    const exampleObject = { a: 1, b: 2, c: 3 };
    expect(objectSize(exampleObject)).toBe(3);
  });

  it("should return the size of an array", () => {
    const exampleArray = [1, 2, 3, 4];
    expect(objectSize(exampleArray)).toBe(4);
  });

  it("should return 1 when breakOnFirstElementFound is true", () => {
    const exampleObject = { a: 1, b: 2, c: 3 };
    expect(objectSize(exampleObject, true)).toBe(1);
  });

  it("should return 0 for a null input", () => {
    expect(objectSize(null)).toBe(0);
  });

  it("should return 0 for a non-object input", () => {
    expect(objectSize(42)).toBe(0);
  });
});

describe("defaultObj", () => {
  it("should return the first valid object", () => {
    const result = defaultObj({ a: 1 });
    expect(result).toEqual({ a: 1 });
  });

  it("should return an empty object for an invalid argument", () => {
    const result = defaultObj("not an object");
    expect(result).toEqual({});
  });

  it("should return the first non-empty object among multiple arguments", () => {
    const result = defaultObj({}, { b: 2 }, { c: 3 });
    expect(result).toEqual({ b: 2 });
  });

  it("should return the last valid object among multiple arguments", () => {
    const result = defaultObj({}, {}, { d: 4 });
    expect(result).toEqual({ d: 4 });
  });

  it("should return an empty object if no valid objects are found", () => {
    const result = defaultObj(null, undefined, "string");
    expect(result).toEqual({});
  });
});

describe("extendObj", () => {
  it("should extend an object with properties from source objects", () => {
    const target = { a: 1, b: 2 };
    const source1 = { b: 3, c: 4 };
    const source2 = { d: 5 };
    const extended = extendObj(target, source1, source2);
    expect(extended).toEqual({ a: 1, b: 3, c: 4, d: 5 });
  });
});

describe("flattenObject", () => {
  it("should flatten a nested object", () => {
    const nestedObject = { a: { b: "value", c: 42 } };
    const flattened = flattenObject(nestedObject);
    expect(flattened).toEqual({ "a.b": "value", "a.c": 42 });
  });

  it("should handle arrays", () => {
    const arrayObject = { items: ["a", "b", { nested: "value" }] };
    const flattened = flattenObject(arrayObject);
    expect(flattened).toEqual({ "items[0]": "a", "items[1]": "b", "items[2].nested": "value" });
  });

  it("should handle maps", () => {
    const mapObject = new Map();
    mapObject.set("key1", "value1");
    mapObject.set("key2", { nested: "value2" });
    const flattened = flattenObject(mapObject);
    expect(flattened).toEqual({ key1: "value1", "key2.nested": "value2" });
  });

  it("should handle complex nested structures", () => {
    const date = new Date();
    const complexObject = {
      array: [1, { a: 2 }],
      set: new Set(["x", { b: "y" }]),
      map: new Map([["k", { c: "v" }]]),
      obj: {
        deep: {
          nested: "value",
          fn: () => {},
          date,
        },
      },
    };
    const flattened = flattenObject(complexObject);
    expect(flattened).toEqual({
      "array[0]": 1,
      "array[1].a": 2,
      "set[0]": "x",
      "set[1].b": "y",
      "map[k].c": "v",
      "obj.deep.nested": "value",
      "obj.deep.date": date,
    });
  });
});

describe("isIterableStructure", () => {
  it("should return true for an array", () => {
    expect(isIterableStructure([1, 2, 3])).toBe(true);
  });

  it("should return true for a set", () => {
    expect(isIterableStructure(new Set([1, 2, 3]))).toBe(true);
  });

  it("should return true for a map", () => {
    expect(isIterableStructure(new Map())).toBe(true);
  });

  it("should return false for a plain object", () => {
    expect(isIterableStructure({})).toBe(false);
  });
});
