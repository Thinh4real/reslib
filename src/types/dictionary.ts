/**
 * A type alias for a dictionary-like object where keys are strings and values can be of any type.
 * This provides a flexible way to represent objects with dynamic string keys.
 *
 * @example
 * ```typescript
 * const user: Dictionary = { name: 'John', age: 25 };
 * const config: Dictionary = { theme: 'dark', enabled: true };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
export interface Dictionary extends Record<string | symbol | number, any> {}

/**
 * A utility type that capitalizes the first character of a string type.
 * If the string is empty, it returns the same string.
 *
 * Note: This is equivalent to TypeScript's built-in `Capitalize<S>` utility type.
 * Consider using `Capitalize<S>` directly for better TypeScript ecosystem compatibility.
 *
 * @typeParam S - The string type to capitalize. Must extend `string`.
 *
 * @example
 * ```typescript
 * type Greeting = UppercaseFirst<'hello'>; // Results in 'Hello'
 * type Empty = UppercaseFirst<''>; // Results in ''
 * type AlreadyCapitalized = UppercaseFirst<'World'>; // Results in 'World'
 * ```
 */
export type UppercaseFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;
