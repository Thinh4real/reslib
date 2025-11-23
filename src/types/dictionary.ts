/**
 * @interface IDictPrefixWithKey
 * Combines a string prefix with the keys of a dictionary type to create a new type.
 *
 * This utility type allows you to prepend a given string (the `Prefix`) to the keys of a given dictionary (`Dict`),
 * generating a new type where each key is the combination of the prefix and the original key.
 *
 * @template Prefix The string prefix that will be prepended to each key in the dictionary.
 * @template Dict The dictionary type whose keys will be combined with the prefix.
 *
 * @example
 * ```typescript
 * type MyDict = {
 *   name: string;
 *   age: number;
 *   city: string;
 * };
 *
 * // Combine the prefix 'user_' with the keys of MyDict
 * type PrefixedKeys = PrefixWithKey<'user_', MyDict>;
 *
 * // Result:
 * // type PrefixedKeys = 'user_name' | 'user_age' | 'user_city'
 * ```
 *
 * @param Prefix A string type representing the prefix to be added.
 * @param Dict A dictionary type (Record) whose keys will be used.
 * @returns A new type where the prefix is combined with each key of the dictionary.
 */
export type IDictPrefixWithKey<Prefix extends string, Dict extends Record<string, any>> = `${Prefix}${keyof Dict & string}`;

/**
 * @interface IDictKeysAsString
 * Converts all keys of a dictionary to a union of string literals.
 *
 * This type transforms the keys of a dictionary into a string literal type
 * and ensures that IntelliSense provides suggestions for those keys.
 *
 * @template T The dictionary (object type) whose keys are to be converted.
 */
export type IDictKeysAsString<T> = keyof T extends string ? keyof T : never;

/**
 * @interface
   Represents a generic dictionary type.
 *
 * @typedef {Object} IDict
 *
 * @template K - The type of the dictionary keys (defaults to `keyof any`).
 * @template T - The type of the dictionary values (defaults to `any`).
 *
 * @description
 * A generic dictionary type that can be used to represent a collection of key-value pairs.
 * The key type `K` defaults to `keyof any`, which means it can be any type that can be used as a key in an object.
 * The value type `T` defaults to `any`, which means it can be any type.
 *
 * @example
 * // Create a dictionary with string keys and number values
 * const dict: IDict<string, number> = {
 *   'one': 1,
 *   'two': 2,
 *   'three': 3
 * }
 *
 * @example
 * // Create a dictionary with number keys and string values
 * const dict: IDict<number, string> = {
 *   1: 'one',
 *   2: 'two',
 *   3: 'three'
 * }
 */
export type IDict<K extends keyof any = any, T = any> = Record<K, T>;

export type IUcFirst<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
