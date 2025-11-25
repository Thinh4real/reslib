import { isClass } from "../isClass";
describe("isClass", () => {
  it("should return true if the object is a class", () => {
    class Test {}
    expect(isClass(Test)).toBe(true);
  });
  it("should return false if the object is not a class", () => {
    expect(isClass({})).toBe(false);
    expect(isClass(function () {})).toBe(false);
  });
  it("should return false if the object is null or undefined", () => {
    expect(isClass(null)).toBe(false);
    expect(isClass(undefined)).toBe(false);
  });
  it("should return false if the object is a function", () => {
    expect(isClass(function () {})).toBe(false);
  });
  describe("Sould test inheritance", () => {
    class A {}
    class B extends A {}
    it("B is a class", () => {
      expect(isClass(B)).toBe(true);
      expect(isClass(new B())).toBe(true);
    });
  });
});
