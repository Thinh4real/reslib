export * from "./date";
export * from "./dictionary";
export * from "./i18n";
export * from "./percentage";
/**
 * @typedef IPrimitive
 * @description
 * The `IPrimitive` type represents a union of the basic primitive data types in TypeScript.
 * It can be one of the following types:
 * - `string`: Represents textual data.
 * - `number`: Represents numeric values, both integers and floating-point numbers.
 * - `boolean`: Represents a logical entity that can have two values: `true` or `false`.
 *
 * This type is useful when you want to define a variable or a function parameter that can accept
 * any of these primitive types, providing flexibility in your code.
 *
 * @example
 * // Example of using IPrimitive in a function
 * function logValue(value: IPrimitive): void {
 *     console.log(`The value is: ${value}`);
 * }
 *
 * logValue("Hello, World!"); // Logs: The value is: Hello, World!
 * logValue(42);               // Logs: The value is: 42
 * logValue(true);             // Logs: The value is: true
 *
 * @example
 * // Example of using IPrimitive in a variable
 * let myValue: IPrimitive;
 * myValue = "A string"; // Valid
 * myValue = 100;        // Valid
 * myValue = false;      // Valid
 *
 * // myValue = [];      // Error: Type 'never[]' is not assignable to type 'IPrimitive'.
 *
 */
export type IPrimitive = string | number | boolean;

export * from "./merge";

/**
 * A type that represents a constructor function that can be instantiated with any number of arguments.
 * This is a generic type that represents a controller class.
 * @template T - The type of the controller class.
 * @template D -  A tuple representing the types of the constructor parameters.
 * @example
 * ```typescript
 * // Example of using IClassConstructor
 * class MyController {
 *   constructor(private readonly service: MyService) { }
 * }
 * 
 * const controllerClass: IClassConstructor<MyController> = MyController;
 * ```
 * type ExampleControllerType = IClassController<ExampleController, [ExampleService]>;
 * const ExampleControllerClass: ExampleControllerType = ExampleController;
  // Simulate dependency injection
  const exampleService = new ExampleService();
  const exampleController = new ExampleControllerClass(exampleService);
 */
export interface IClassConstructor<T = any, D extends any[] = any[]>
  extends Function {
  new (...args: D): T;
}

/**
 * A renderer function type that renders a given value of type `InputType` into a value of type `OutputType`.
 * 
 * This type is used to define renderers for different value types (e.g., number, string)
 * within various components (e.g., `datagridCell`, `formField`). The renderer function
 * receives a value and returns an HTML string or a ReactNode or other content representing that value.
 * 
 * @template InputType - The type of the value to be rendered.
   @template OutputType - The type of the rendered value.
 * @param {InputType} value - The value to render.
 * @returns {OutputType} - The content representation of the rendered value.
 * 
 * ## Example:
 * 
 * ```typescript
 * const numberRenderer: ITypeRegistryRenderer<number,string> = (value: number) => {
 *   return `<div class="cell number">${value}</div>`;
 * };
 * console.log(numberRenderer(123)); // Output: <div class="cell number">123</div>
 * ```
 */
export type ITypeRegistryRenderer<InputType = any, OutputType = any> = (
  value: InputType
) => OutputType;

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
 * type UserWithOptionalFields = IMakeOptional<User, 'age' | 'isActive'>;
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
 * type UserWithOptionalEmail = IMakeOptional<User, 'email'>;
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
 * type SomeOptional = IMakeOptional<User, 'age' | 'email'>;
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
 * @since 1.0.0
 * @see {@link Partial} - Makes all properties optional
 * @see {@link Required} - Makes all properties required
 * @see {@link Pick} - Selects specific properties
 * @see {@link Omit} - Removes specific properties
 */
export type IMakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
