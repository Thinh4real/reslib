/**
 * Interface representing various comparison operators for filtering operations.
 *
 * This interface allows you to specify conditions for querying data based on
 * different comparison criteria. Each property corresponds to a specific
 * comparison operation that can be applied to filter results.
 *
 * @example
 * // Example of using IMongoComparisonOperators
 * const filter: IMongoComparisonOperators = {
 *     $eq: "example",          // Matches documents where the field equals "example"
 *     $ne: 42,                 // Matches documents where the field is not equal to 42
 *     $gt: 100,                // Matches documents where the field is greater than 100
 *     $gte: 50,                // Matches documents where the field is greater than or equal to 50
 *     $lt: 10,                 // Matches documents where the field is less than 10
 *     $lte: 5,                 // Matches documents where the field is less than or equal to 5
 *     $in: ["apple", "banana"], // Matches documents where the field is in the specified array
 *     $nin: [1, 2, 3],         // Matches documents where the field is not in the specified array
 *     $exists: true,           // Matches documents where the field exists
 *     $type: "string",         // Matches documents where the field is of type string
 *     $regex: "^test.*",
 *     $options: "i"       // Case insensitive match
 *     $size: 3,                // Matches documents where the field is an array of size 3
 *     $mod: [2, 0],            // Matches documents where the field modulo 2 equals 0
 *     $all: [1, 2],            // Matches documents where the array contains all specified values
 *     $elemMatch: {            // Matches documents where at least one element in the array matches the criteria
 *         field: { $gt: 10 }
 *     }
 * };
 */
export interface IMongoComparisonOperators<T = any>
  extends IMongoArrayOperators<T> {
  $eq?: T; // equals
  $ne?: T; // not equals
  $gt?: T; // greater than
  $gte?: T; // greater than or equal
  $lt?: T; // less than
  $lte?: T; // less than or equal
  $exists?: boolean; // field exists
  $type?: string; // type check
  $regex?: string | RegExp; // regular expression
  $options?: string; // regex options
  $size?: number; // array size
  /***
   * modulo operator.
   * example :
   * { age: { $mod: [5, 0] } } - finds documents where age mod 5 equals 0
   */
  $mod?: [divisor: number, remainder: number]; // modulo
}

/**
 * Interface representing logical operators for filtering operations.
 *
 * This interface allows you to combine multiple filter conditions using logical
 * operators. It provides a way to create complex queries by specifying how
 * different conditions relate to each other.
 *
 * @example
 * // Example of using IMongoLogicalOperators
 * const filter: IMongoLogicalOperators = {
 *     $and: [
 *         { age: { $gte: 18 } }, // Must be 18 or older
 *         { status: "active" }   // Must be active
 *     ],
 *     $or: [
 *         { role: "admin" },     // Either role is admin
 *         { role: "editor" }     // Or role is editor
 *     ],
 *     $nor: [
 *         { deleted: true }      // Must not be deleted
 *     ],
 *     $not: {                  // Must not match this condition
 *         status: "inactive"   // Must not be inactive
 *     }
 * };
 */
export interface IMongoLogicalOperators<T = unknown> {
  $and?: IMongoQuery<T>[]; // An array of filter selectors that must all match
  $or?: IMongoQuery<T>[]; // An array of filter selectors where at least one must match
  $nor?: IMongoQuery<T>[]; // An array of filter selectors where none must match
  $not?: IMongoQuery<T>; // A filter selector or comparison operator that must not match
}

/**
 * Represents the names of logical operators defined in the `IMongoLogicalOperators` interface.
 *
 * The `IMongoLogicalOperatorName` type is a union of the keys from the `IMongoLogicalOperators` interface.
 * It provides a concise and type-safe way to refer to logical operator names used in MongoDB queries.
 *
 * @example
 * ```typescript
 * const logicalOperator: IMongoLogicalOperatorName = "$and"; // Valid, as $and is a logical operator
 * const invalidOperator: IMongoLogicalOperatorName = "$invalid"; // Error: "$invalid" is not a valid logical operator
 * ```
 *
 * @remarks
 * - This type is particularly useful when you need to validate or restrict the usage of logical operator names in MongoDB queries.
 * - It ensures type safety and reduces the risk of typos in operator names.
 *
 * @see {@link IMongoLogicalOperators} for the structure of logical operators.
 */
export type IMongoLogicalOperatorName = keyof IMongoLogicalOperators;

/**
 * @interface IMongoOperators
 * Combines logical and comparison operators for MongoDB queries.
 *
 * This interface represents a union of logical and comparison operators, allowing you to construct
 * complex MongoDB queries with both logical conditions and value-based comparisons.
 *
 * @template T - The type of the data being queried (default is `unknown`).
 *
 * @example
 * // Example usage of IMongoOperators
 * interface User {
 *   name: string;
 *   age: number;
 *   tags: string[];
 * }
 *
 * const query: IMongoOperators<User> = {
 *   $and: [
 *     { age: { $gte: 18 } }, // Logical AND: age must be greater than or equal to 18
 *     { tags: { $in: ["active", "premium"] } } // Logical AND: tags must include "active" or "premium"
 *   ],
 *   $or: [
 *     { name: { $regex: "^John", $options: "i" } }, // Logical OR: name starts with "John" (case-insensitive)
 *     { age: { $lt: 30 } } // Logical OR: age is less than 30
 *   ]
 * };
 *
 * // This query will match documents where:
 * // - The age is greater than or equal to 18 AND the tags include "active" or "premium".
 * // - OR the name starts with "John" (case-insensitive) OR the age is less than 30.
 *
 * @see {@link IMongoLogicalOperators} for logical operators.
 * @see {@link IMongoComparisonOperators} for comparison operators.
 */
export interface IMongoOperators
  extends IMongoLogicalOperators,
    IMongoComparisonOperators {}

/**
 * @typedef IMongoOperatorName
 * Represents the names of all available operators (logical and comparison) defined in the `IMongoOperators` interface.
 *
 * This type is a union of the keys from the `IMongoOperators` interface, allowing for a concise way to refer to nknown operator name
 * that can be used in MongoDB queries. It ensures type safety and reduces the risk of typos in operator names.
 *
 * @example
 * // Example usage of IMongoOperatorName
 * const operator1: IMongoOperatorName = "$and"; // Valid, as $and is a logical operator
 * const operator2: IMongoOperatorName = "$eq";  // Valid, as $eq is a comparison operator
 *
 * // The following would cause a TypeScript error, as "$invalid" is not a defined operator
 * // const invalidOperator: IMongoOperatorName = "$invalid"; // Error: Type '"$invalid"' is not assignable to type 'IMongoOperatorName'
 *
 * @remarks
 * This type is particularly useful when you need to validate or restrict the usage of operator names in MongoDB queries.
 * It provides a type-safe way to reference operator names, ensuring that only valid operators are used.
 *
 * @see {@link IMongoOperators} for the full list of logical and comparison operators.
 */
export type IMongoOperatorName = keyof IMongoOperators;
/**
 * A type that represents the depth limit for recursion in MongoDB queries.
 *
 * This type is used to limit the depth of nested objects in a query, preventing infinite recursion.
 *
 * @typedef {number[]} IMongoQueryDepth
 * @example
 * // Example usage of IMongoQueryDepth
 * const depthLimit: IMongoQueryDepth = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 */
type IMongoQueryDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * A type that generates dot notation paths with a depth limit.
 *
 * This type is used to create a list of possible dot notation paths in a MongoDB query, taking into account the depth limit.
 *
 * @typedef {object} IMongoCreateDotPaths
 * @template T - The type of the object being queried.
 * @template D - The depth limit for the query (default is 9).
 * @template Prefix - The prefix for the dot notation path (default is an empty string).
 * @property {string} [key] - A key in the object being queried.
 * @returns {string | never} - The dot notation path for the key, or never if the key is not a string or the depth limit is reached.
 * @example
 * // Example usage of IMongoCreateDotPaths
 * const paths: IMongoCreateDotPaths<{ a: { b: { c: string } } }> = {
 *   'a': 'a',
 *   'a.b': 'a.b',
 *   'a.b.c': 'a.b.c',
 * };
 */
type IMongoCreateDotPaths<
  T,
  D extends number = 9,
  Prefix extends string = "",
> = D extends 0
  ? never
  : T extends object
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends object
            ?
                | `${Prefix}${K}`
                | IMongoCreateDotPaths<
                    T[K],
                    IMongoQueryDepth[D],
                    `${Prefix}${K}.`
                  >
            : `${Prefix}${K}`
          : never;
      }[keyof T]
    : never;

/**
 * A type that resolves the type of a value at a given path in an object.
 *
 * This type is used to navigate through nested objects and retrieve the type of a value at a specific path.
 *
 * @typedef {object} IMongoTypeAtPath
 * @template T - The type of the object being queried.
 * @template Path - The path to the value in the object (e.g. "a.b.c").
 * @template D - The depth limit for the query (default is 9).
 * @returns {T[Path] | never} - The type of the value at the given path, or never if the path is invalid or the depth limit is reached.
 * @example
 * // Example usage of IMongoTypeAtPath
 * const typeAtPath: IMongoTypeAtPath<{ a: { b: { c: string } } }, 'a.b.c'> = string;
 *
 * // This would resolve to the type of the value at the path 'a.b.c' in the object.
 *
 * @example
 * // Example usage of IMongoTypeAtPath with an invalid path
 * const invalidTypeAtPath: IMongoTypeAtPath<{ a: { b: { c: string } } }, 'a.b.d'> = never;
 *
 * // This would resolve to never, because the path 'a.b.d' is invalid.
 */
type IMongoTypeAtPath<
  T,
  Path extends string,
  D extends number = 9,
> = D extends 0
  ? never
  : Path extends keyof T
    ? T[Path]
    : Path extends `${infer Key}.${infer Rest}`
      ? Key extends keyof T
        ? IMongoTypeAtPath<T[Key], Rest, IMongoQueryDepth[D]>
        : never
      : never;

/**
 * @interface IMongoQuery
 * A type that represents a MongoDB query.
 * 
 * This type is used to define a query that can be used to filter data in a MongoDB collection.
 * 
 * @typedef {object} IMongoQuery
 * @template T - The type of the data being queried (default is nknown).
 * @template D - The depth limit for the query (default is 9).
 * @property {string} [key] - A key in the data being queried.
 * @property {T[key]} [value] - The value of the key in the data being queried.
 * @property {IMongoComparisonOperators<T[key]>} [comparisonOperator] - A comparison operator to apply to the value.
 * @property {IMongoQuery<T[key], IMongoQueryDepth[D]>} [nestedQuery] - A nested query to apply to the value.
 * @property {IMongoLogicalOperators<T>} [logicalOperator] - A logical operator to apply to the query.
 * @returns {object} - The query object.
 * @example
 * // Example usage of IMongoQuery
 * ```typescript
 * interface TestDocument {
    name: string;
    age: number;
    address: {
      street: string;
      city: {
        name: string;
        country: {
          code: string;
          name: string;
        };
      };
    };
    tags: string[];
    scores: Array<{
      subject: string;
      value: number;
    }>;
  }

  // These should all work now
  const query1: IMongoQuery<TestDocument> = {
    'address.city.country.name': { $eq: 'France' },
    age: { $gt: 18 },
    tags: { $all: ['active', 'premium'] },
    scores: {
      $elemMatch: {
        subject: { $eq: 'math' },
        value: { $gte: 90 }
      }
    }
  };
  const query2: IMongoQuery<TestDocument> = {
    $or: [
      { 'address.city.country.code': 'FR' },
      { 
        $and: [
          { age: { $gte: 18 } },
          { tags: { $in: ['vip'] } }
        ]
      }
    ]
  };
 * 
 * // This would create a query that filters data where the name is 'John', the age is greater than 18, and the occupation is either 'Developer' or 'Engineer'.
 * ```	
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/query/} for more information on MongoDB query operators.
 * @see {@link IMongoArrayOperators} for more information on MongoDB array operators.
 * @see {@link IMongoComparisonOperators} for more information on MongoDB comparison operators.
 * @see {@link IMongoLogicalOperators} for more information on MongoDB logical operators.
 */
export type IMongoQuery<T = unknown, D extends number = 9> = D extends 0
  ? never
  : {
      [P in IMongoCreateDotPaths<T, D> | keyof T]?: P extends keyof T
        ?
            | T[P]
            | IMongoComparisonOperators<T[P]>
            | (T[P] extends object
                ? IMongoQuery<T[P], IMongoQueryDepth[D]>
                : never)
        : P extends string
          ?
              | IMongoTypeAtPath<T, P, D>
              | IMongoComparisonOperators<IMongoTypeAtPath<T, P, D>>
          : never;
    } & IMongoLogicalOperators<T>;

/**
 * Interface representing array operators for filtering operations.
 *
 * This interface allows you to specify conditions for querying data that involves
 * arrays. It provides options to match documents based on the contents of arrays
 * and their elements.
 *
 * @example
 * // Example of using IMongoArrayOperators
 * const filter: IMongoArrayOperators = {
 *     $all: [1, 2, 3], // Matches documents where the array contains all specified values
 *     $elemMatch: {    // Matches documents where at least one element in the array matches the criteria
 *         field: { $gt: 10 } // At least one element must be greater than 10
 *     }
 * };
 */
export interface IMongoArrayOperators<T = unknown> {
  $in?: T extends Array<any> ? T : T[]; // in array
  $nin?: T extends Array<any> ? T : T[]; // not in array
  $all?: T extends Array<any> ? T : T[];
  $elemMatch?: T extends Array<any> ? IMongoQuery<T[number]> : never;
}

/**
 * A type that represents the names of all available comparison operators
 * defined in the `IMongoComparisonOperators` interface.
 *
 * This type is a union of the keys from the `IMongoComparisonOperators` interface,
 * allowing for a concise way to refer to any comparison operator name that can
 * be used in MongoDB queries. It ensures type safety and reduces the risk
 * of typos in operator names.
 *
 * @type IMongoComparisonOperatorName
 * @example
 * // Example usage of IMongoComparisonOperatorName
 * const comparisonOperator1: IMongoComparisonOperatorName = "$eq"; // Valid, as $eq is a comparison operator
 * const comparisonOperator2: IMongoComparisonOperatorName = "$gt"; // Valid, as $gt is a comparison operator
 *
 * // The following would cause a TypeScript error, as "$invalid" is not a defined comparison operator
 * // const invalidComparisonOperator: IMongoComparisonOperatorName = "$invalid"; // Error: Type '"$invalid"' is not assignable to type 'IMongoComparisonOperatorName'
 *
 * @see {@link IMongoComparisonOperators} for a list of comparison operators.
 */
export type IMongoComparisonOperatorName = keyof IMongoComparisonOperators;

/**
 * Represents the ordering specification for resource queries.
 *
 * This type defines how to specify sorting criteria for database queries, supporting both ascending and descending orders
 * on any leaf property (non-object, non-array values) within the resource type `T`. It allows single-field sorting,
 * multi-field sorting with arrays, and handles nested object properties using dot notation.
 *
 * @template T - The resource type to generate ordering paths for. Must be an object type.
 *
 * @remarks
 * - Ascending order is specified by the field path as a string (e.g., `"name"`, `"address.city"`).
 * - Descending order is specified by prefixing the field path with a minus sign (e.g., `"-name"`, `"-address.city"`).
 * - Multiple sorting criteria can be provided as an array, where each element follows the same rules.
 * - Field paths are limited to a depth of 4 levels to prevent excessive recursion and maintain performance.
 * - Only leaf properties (primitives, dates, etc.) can be used for sorting; object and array properties are excluded.
 *
 * @example
 * Basic usage with a simple user interface:
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   age: number;
 *   email: string;
 * }
 *
 * // Single ascending field
 * const orderBy1: IResourceQueryOrderBy<User> = "name";
 *
 * // Single descending field
 * const orderBy2: IResourceQueryOrderBy<User> = "-age";
 *
 * // Multiple fields (name ascending, then age descending)
 * const orderBy3: IResourceQueryOrderBy<User> = ["name", "-age"];
 * ```
 *
 * @example
 * Usage with nested object properties:
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   profile: {
 *     age: number;
 *     address: {
 *       city: string;
 *       country: {
 *         name: string;
 *         code: string;
 *       };
 *     };
 *   };
 *   tags: string[];
 * }
 *
 * // Sorting by nested properties
 * const orderBy1: IResourceQueryOrderBy<User> = "profile.age";                    // Ascending by age
 * const orderBy2: IResourceQueryOrderBy<User> = "-profile.address.city";          // Descending by city
 * const orderBy3: IResourceQueryOrderBy<User> = "profile.address.country.name";   // Ascending by country name
 *
 * // Multiple nested fields
 * const orderBy4: IResourceQueryOrderBy<User> = [
 *   "profile.address.country.name",  // Country name ascending
 *   "-profile.age",                  // Age descending
 *   "name"                           // Name ascending (as tiebreaker)
 * ];
 * ```
 *
 * @example
 * Usage with complex nested structures including arrays (note: arrays themselves cannot be sorted, only their leaf elements if accessed):
 * ```typescript
 * interface Product {
 *   id: string;
 *   name: string;
 *   metadata: {
 *     createdAt: Date;
 *     updatedAt: Date;
 *     stats: {
 *       views: number;
 *       likes: number;
 *       ratings: {
 *         average: number;
 *         count: number;
 *       };
 *     };
 *   };
 *   categories: string[];  // Arrays cannot be used directly for sorting
 * }
 *
 * // Valid sorting options
 * const orderBy1: IResourceQueryOrderBy<Product> = "-metadata.createdAt";              // Newest first
 * const orderBy2: IResourceQueryOrderBy<Product> = "metadata.stats.likes";              // Most liked first
 * const orderBy3: IResourceQueryOrderBy<Product> = "metadata.stats.ratings.average";    // Highest rated first
 *
 * // Complex multi-field sorting
 * const orderBy4: IResourceQueryOrderBy<Product> = [
 *   "-metadata.stats.ratings.average",  // Highest rated first
 *   "-metadata.stats.likes",            // Then most liked
 *   "metadata.createdAt"                // Then newest (as tiebreaker)
 * ];
 * ```
 *
 * @example
 * Invalid usage examples (these will cause TypeScript errors):
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   tags: string[];
 *   profile: {
 *     address: {
 *       coordinates: [number, number];  // Array type
 *     };
 *   };
 * }
 *
 * // ❌ Invalid: Cannot sort by array properties
 * // const invalid1: IResourceQueryOrderBy<User> = "tags";
 *
 * // ❌ Invalid: Cannot sort by array elements
 * // const invalid2: IResourceQueryOrderBy<User> = "profile.address.coordinates";
 *
 * // ❌ Invalid: Cannot sort by object properties
 * // const invalid3: IResourceQueryOrderBy<User> = "profile";
 * ```
 */
export type IResourceQueryOrderBy<T> =
  | NestedPaths<T, 8> // ascending
  | `-${NestedPaths<T, 8>}` // descending
  | Array<NestedPaths<T, 8> | `-${NestedPaths<T, 8>}`>;

/* ------------------------------------------------------------------ */
type Join<K, P, S extends string = "."> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : S}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];
/**
 * Generates all nested paths that terminate in leaf values (non-object, non-array properties).
 *
 * This utility type recursively traverses an object type `T` up to a maximum depth `D` and produces
 * a union of all possible nested paths that point to leaf properties. Leaf properties are
 * considered to be any non-object values (primitives, dates, etc.). The separator between path
 * segments can be customized.
 *
 * @template T - The object type to generate paths for
 * @template D - The maximum recursion depth (default: 3)
 * @template S - The separator string to use between path segments (default: ".")
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   profile: {
 *     age: number;
 *     address: {
 *       city: string;
 *       country: string;
 *     };
 *   };
 * }
 *
 * type UserPaths = NestedPaths<User>;
 * // Results in: "id" | "name" | "profile.age" | "profile.address.city" | "profile.address.country"
 * ```
 *
 * @example
 * With custom depth:
 * ```typescript
 * type DeepPaths = NestedPaths<VeryDeepObject, 5>; // Allow up to 5 levels deep
 * ```
 *
 * @example
 * With custom separator:
 * ```typescript
 * type BracketPaths = NestedPaths<User, 3, "[]">;
 * // Results in: "id" | "name" | "profile[]age" | "profile[]address[]city" | "profile[]address[]country"
 * ```
 */
export type NestedPaths<T, D extends number = 3, S extends string = "."> = [
  D,
] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? Join<K, NestedPaths<T[K], Prev[D], S>, S>
          : never;
      }[keyof T]
    : "";
