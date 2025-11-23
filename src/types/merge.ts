/**
 * @module TypeMergeUtilities
 * @description Utility types for merging TypeScript interfaces with uniqueness constraints
 */

/**
 * Identifies common keys that exist in both T and U types.
 * 
 * @template T The first type
 * @template U The second type
 * @returns A union type containing all keys that exist in both T and U
 * 
 * @example
 * ```typescript
 * interface Person { name: string; age: number; email: string; }
 * interface Contact { phone: string; email: string; address: string; }
 * 
 * // Results in type: 'email'
 * type DuplicateKeys = ICommonKeys<Person, Contact>;
 * ```
 */
export type ICommonKeys<T, U> = keyof T & keyof U;

/**
 * Extracts all keys from type U that don't exist in type T.
 * 
 * @template T The type whose keys should be excluded
 * @template U The type from which to extract unique keys
 * @returns A union type containing keys from U that don't exist in T
 * 
 * @example
 * ```typescript
 * interface Person { name: string; age: number; }
 * interface Employee { name: string; jobTitle: string; salary: number; }
 * 
 * // Results in type: 'jobTitle' | 'salary'
 * type UniqueEmployeeKeys = IExcludeCommonKeys<Person, Employee>;
 * ```
 */
export type IExcludeCommonKeys<T, U> = Exclude<keyof U, keyof T>;

/**
 * Creates a new type from U by removing all properties that already exist in T.
 * 
 * @template T The type whose keys should be excluded
 * @template U The type to filter
 * @returns A type containing only properties from U that don't exist in T
 * 
 * @example
 * ```typescript
 * interface Person { name: string; age: number; email: string; }
 * interface Contact { phone: string; email: string; address: string; }
 * 
 * // Results in type: { phone: string; address: string; }
 * type UniqueContactProps = IOmitCommonKeys<Person, Contact>;
 * ```
 */
export type IOmitCommonKeys<T, U> = {
    [K in IExcludeCommonKeys<T, U>]: U[K]
};

/**
 * Detects if there are any duplicate properties between types T and U.
 * Returns 'never' if no duplicates exist, otherwise returns a union of the duplicate keys.
 * 
 * @template T The first type
 * @template U The second type
 * @returns 'never' if no duplicates, otherwise a union of duplicate keys
 * 
 * @example
 * ```typescript
 * interface User { id: number; username: string; }
 * interface Profile { avatar: string; bio: string; }
 * 
 * // Results in: never (no duplicates)
 * type UserProfileConflicts = IHasDuplicates<User, Profile>;
 * 
 * interface Auth { username: string; password: string; }
 * 
 * // Results in: 'username' (duplicate property)
 * type UserAuthConflicts = IHasDuplicates<User, Auth>;
 * ```
 */
export type IHasDuplicates<T, U> = ICommonKeys<T, U> extends never ? never : ICommonKeys<T, U>;

/**
 * A stricter merge utility that triggers a TypeScript error if any duplicate properties exist.
 * This is useful during development to ensure you're not accidentally overriding properties.
 * 
 * @template T The first type
 * @template U The second type
 * @returns A merged type if no duplicates exist, otherwise results in a type error
 * 
 * @example
 * ```typescript
 * interface User { id: number; name: string; }
 * interface Settings { theme: string; language: string; }
 * 
 * // Works fine because there are no duplicates
 * type UserSettings = IStrictMerge<User, Settings>;
 * 
 * interface Profile { name: string; bio: string; }
 * 
 * // Error: Type 'name' is present in both types and cannot be merged
 * type UserProfile = IStrictMerge<User, Profile>;
 * ```
 */
export type IStrictMerge<T, U> = IHasDuplicates<T, U> extends never
    ? T & U
    : never;

/**
 * Utility type that merges two types, allowing the second type to override properties
 * from the first type. The resulting type preserves the required/optional status of fields.
 * 
 * @template T The primary type (only non-duplicate properties are included)
 * @template U The secondary type (properties from this type take precedence)
 * @returns A merged type containing all properties from U and properties from T that don't exist in U
 * 
 * @example
 * ```typescript
 * // Base interface with required and optional fields
 * interface User {
 *   id: number;
 *   name: string;
 *   email?: string;
 * }
 * 
 * // Override with different types
 * interface AdminOverrides {
 *   role: string;  // New required field
 *   id?: string;   // Override id to be optional and string
 *   avatar?: string; // New optional field
 * }
 * 
 * // Resulting type has correct optionality
 * type Admin = MergeWithoutDuplicates<User, AdminOverrides>;
 * // Equivalent to:
 * // {
 * //   name: string;      // Required (from User)
 * //   email?: string;    // Optional (from User)
 * //   role: string;      // Required (from AdminOverrides)
 * //   id?: string;       // Optional (from AdminOverrides)
 * //   avatar?: string;   // Optional (from AdminOverrides)
 * // }
 * ```
 */
export type IMergeWithoutDuplicates<T, U> =
    // Required properties from T that don't exist in U
    Pick<T, Exclude<IRequiredKeys<T>, keyof U>> &
    // Optional properties from T that don't exist in U
    Partial<Pick<T, Exclude<IOptionalKeys<T>, keyof U>>> &
    // Required properties from U
    Pick<U, IRequiredKeys<U>> &
    // Optional properties from U
    Partial<Pick<U, IOptionalKeys<U>>>;
/**
 * Gets all required keys of a type.
 */
export type IRequiredKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T];

/**
 * Gets all optional keys of a type.
 */
export type IOptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T];

/**
 * Utility type to check if a property K in type T is optional.
 * Returns true if the property is optional, false otherwise.
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name?: string;
 * }
 * 
 * type IsNameOptional = IIsOptional<User, 'name'>; // true
 * type IsIdOptional = IIsOptional<User, 'id'>;     // false
 * ```
 */
export type IIsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

///mermgin example
interface User {
    id: number;
    name: string;
    email?: string;
}

// Override with different types
interface AdminOverrides {
    role: string;  // New required field
    id: string;   // Override id to be optional and string
    avatar?: string; // New optional field
}

// Resulting type has correct optionality
type Admin = IMergeWithoutDuplicates<User, AdminOverrides>;

const t: Admin = {
    name: "boris",
    role: "admin",
    id: "ttt",
}