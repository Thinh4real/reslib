/**
 * Creates a decorator that can be applied to class properties or methods.
 *
 * This function takes a key of type KeyType (defaulting to any) and returns a function that takes a value of type ValueType (defaulting to any).
 * The returned function is a decorator that can be applied to class properties or methods.
 *
 * @template KeyType - The type of the key used to store metadata.
 * @template ValueType - The type of the value associated with the key.
 * @param {KeyType} key - The key under which the metadata will be stored.
 * @returns {(value: ValueType) => (target: Object, propertyKey: string) => void} A function that takes a value and returns the decorator function.
 * @example
 * ```typescript
 * const myDecorator = createDecorator('myKey')('myValue');
 * class MyClass {
 *   @myDecorator
 *   myProperty: string;
 * }
 * ```
 */
export function createDecorator<ValueType = unknown, KeyType = unknown>(key: KeyType): (value: ValueType) => (target: Object, propertyKey: string | symbol) => void {
  return (value: ValueType) => {
    return (target: Object, propertyKey: string | symbol) => {
      Reflect.defineMetadata(key, value, target, propertyKey);
    };
  };
}
