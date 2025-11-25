export * from './date';
export * from './dictionary';
export * from './i18n';
/**
 * @typedef Primitive
 * @description
 * The `Primitive` type represents a union of the basic primitive data types in TypeScript.
 * It can be one of the following types:
 * - `string`: Represents textual data.
 * - `number`: Represents numeric values, both integers and floating-point numbers.
 * - `boolean`: Represents a logical entity that can have two values: `true` or `false`.
 *
 * This type is useful when you want to define a variable or a function parameter that can accept
 * any of these primitive types, providing flexibility in your code.
 *
 * @example
 * // Example of using Primitive in a function
 * function logValue(value: Primitive): void {
 *     console.log(`The value is: ${value}`);
 * }
 *
 * logValue("Hello, World!"); // Logs: The value is: Hello, World!
 * logValue(42);               // Logs: The value is: 42
 * logValue(true);             // Logs: The value is: true
 *
 * @example
 * // Example of using Primitive in a variable
 * let myValue: Primitive;
 * myValue = "A string"; // Valid
 * myValue = 100;        // Valid
 * myValue = false;      // Valid
 *
 * // myValue = [];      // Error: Type 'never[]' is not assignable to type 'Primitive'.
 *
 */
export type Primitive = string | number | boolean;

/**
 * A type that represents a constructor function that can be instantiated with any number of arguments.
 * This is a generic type that represents a controller class.
 * @template T - The type of the controller class.
 * @template D -  A tuple representing the types of the constructor parameters.
 * @example
 * ```typescript
 * // Example of using ClassConstructor
 * class MyController {
 *   constructor(private readonly service: MyService) { }
 * }
 * 
 * const controllerClass: ClassConstructor<MyController> = MyController;
 * ```
 * type ExampleControllerType = IClassController<ExampleController, [ExampleService]>;
 * const ExampleControllerClass: ExampleControllerType = ExampleController;
  // Simulate dependency injection
  const exampleService = new ExampleService();
  const exampleController = new ExampleControllerClass(exampleService);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ClassConstructor<T = unknown, D extends any[] = any[]>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  extends Function {
  new (...args: D): T;
}

/**
 * ## Make Optional Utility Type
 *
 * A mapped type that makes specific properties of a type optional while keeping others required.
 * This is useful when you want fine-grained control over which properties should be optional
 * in a derived type, rather than making all properties optional (like `Partial<T>`).
 *
 * ### How it Works
 * This type uses TypeScript's mapped types to:
 * 1. Remove specified properties from the original type (`Omit<T, K>`)
 * 2. Make those properties optional (`Partial<Pick<T, K>>`)
 * 3. Combine them back together with an intersection type
 *
 * ### Template Parameters
 * @template T - The original type to modify
 * @template K - A union of keys from T that should be made optional (must extend `keyof T`)
 *
 * ### Examples
 *
 * #### Basic Usage
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   age: number;
 *   isActive: boolean;
 * }
 *
 * // Make only 'age' and 'isActive' optional
 * type UserWithOptionalFields = MakeOptional<User, 'age' | 'isActive'>;
 *
 * // Result: {
 * //   id: number;
 * //   name: string;
 * //   email: string;
 * //   age?: number;      // Now optional
 * //   isActive?: boolean; // Now optional
 * // }
 * ```
 *
 * #### Single Property
 * ```typescript
 * type UserWithOptionalEmail = MakeOptional<User, 'email'>;
 *
 * // Result: {
 * //   id: number;
 * //   name: string;
 * //   email?: string;    // Only email is optional
 * //   age: number;
 * //   isActive: boolean;
 * // }
 * ```
 *
 * #### Comparison with Other Utility Types
 * ```typescript
 * // All properties optional
 * type AllOptional = Partial<User>;
 *
 * // All properties required (opposite)
 * type AllRequired = Required<User>;
 *
 * // Specific properties optional (this type)
 * type SomeOptional = MakeOptional<User, 'age' | 'email'>;
 * ```
 *
 * ### Use Cases
 * - API responses where some fields might be missing
 * - Form data where certain fields are optional based on conditions
 * - Configuration objects with optional overrides
 * - Database models with nullable columns
 *
 * ### Type Safety
 * The type ensures compile-time safety by:
 * - Constraining `K` to only valid keys of `T`
 * - Preserving the original property types (just making them optional)
 * - Maintaining type relationships and inference
 *
 * @public
 *
 * @see {@link Partial} - Makes all properties optional
 * @see {@link Required} - Makes all properties required
 * @see {@link Pick} - Selects specific properties
 * @see {@link Omit} - Removes specific properties
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
