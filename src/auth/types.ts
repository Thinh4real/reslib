import {
  ResourceActionName,
  ResourceActionTuple,
  ResourceName,
} from '@resources/types';
import { Dictionary } from '../types/dictionary';
/**
 * @interface AuthUser
 * Represents an authenticated user in the application.
 *
 * The `AuthUser` interface defines the structure for an authenticated
 * user object, which includes core user identification, optional session
 * tracking, permissions mapping, and role assignments.
 * This interface extends `Dictionary` to allow for additional custom properties.
 *
 * ### Properties
 *
 * - `id` (string | number): A unique identifier for the user. This
 *   can be either a string or a number, depending on the implementation.
 *
 * - `sessionCreatedAt` (number, optional): An optional property
 *   that stores the timestamp (in milliseconds) of when the
 *   authentication session was created. This can be useful for
 *   tracking session duration or expiration.
 *
 * - `perms` (AuthPerms, optional): An optional property that maps
 *   resource names to an array of actions that the user is permitted
 *   to perform on those resources. This allows for fine-grained control
 *   over user permissions within the application.
 *
 * - `roles` (AuthRole[], optional): An optional array of roles assigned
 *   to the user, defining their authorization level and capabilities.
 *
 * ### Example Usage
 *
 * Here is an example of how the `AuthUser` interface can be used:
 *
 * ```typescript
 * const user: AuthUser = {
 *     id: "user123",
 *     sessionCreatedAt: Date.now(),
 *     perms: {
 *         documents: ["read", "create", "update"],
 *         users: ["read", "delete"]
 *     },
 *     roles: [
 *         { name: "admin", perms: { documents: ["read", "create", "update"] } }
 *     ]
 * };
 *
 * // Function to check if a user has permission to perform an action
 * function hasPermission(user: AuthUser, resource: ResourceName, action: ResourceActionName): boolean {
 *     return user.perms?.[resource]?.includes(action) ?? false;
 * }
 *
 * // Example of checking permissions
 * const canReadDocuments = hasPermission(user, "documents", "read"); // true
 * const canDeleteUsers = hasPermission(user, "users", "delete"); // true
 * ```
 *
 * In this example, the `AuthUser` interface is used to define a user
 * object with an ID, session creation timestamp,
 * permissions map, and roles. The `hasPermission` function checks if
 * the user has the specified permission for a given resource.
 *
 * @see {@link ResourceName} for the `ResourceName` type.
 * @see {@link ResourceActionName} for the `ResourceActionName` type.
 * @see {@link AuthPerms} for the `AuthPerms` type.
 * @see {@link AuthRole} for the `AuthRole` interface.
 */

export interface AuthUser extends Dictionary {
  id: string | number | object;
  sessionCreatedAt?: number;
  perms?: AuthPerms;

  roles?: AuthRole[];
}

/**
 * @interface AuthRole
 * Represents an authorization role with associated permissions.
 *
 * The `AuthRole` interface defines the structure of an authorization role,
 * which consists of a unique name identifier and a comprehensive set of
 * permissions that define what actions the role can perform on various resources.
 * This interface extends `Record<string, any>` to allow for additional custom properties.
 *
 * ### Properties
 *
 * - `name` (string): The unique identifier of the authorization role.
 *   This serves as the primary key for role identification and should be
 *   descriptive and unique within the application (e.g., 'admin', 'moderator', 'user').
 *
 * - `perms` (AuthPerms): The permissions associated with this role.
 *   This property defines what actions the role can perform on different resources,
 *   enabling fine-grained access control based on role assignments.
 *
 * ### Example Usage
 *
 * ```typescript
 * const adminRole: AuthRole = {
 *   name: 'admin',
 *   perms: {
 *     documents: ["read", "create", "update", "delete"],
 *     users: ["read", "create", "update", "delete"],
 *     posts: ["read", "create", "update", "delete"],
 *   }
 * };
 *
 * const moderatorRole: AuthRole = {
 *   name: 'moderator',
 *   perms: {
 *     documents: ["read", "update"],
 *     posts: ["read", "create", "update"],
 *   }
 * };
 *
 * // Function to check if a role has permission for an action
 * function roleHasPermission(role: AuthRole, resource: ResourceName, action: ResourceActionName): boolean {
 *     return role.perms?.[resource]?.includes(action) ?? false;
 * }
 *
 * // Example usage
 * const canAdminDeleteUsers = roleHasPermission(adminRole, "users", "delete"); // true
 * const canModeratorDeleteUsers = roleHasPermission(moderatorRole, "users", "delete"); // false
 * ```
 *
 * @see {@link AuthPerms} for the permissions structure.
 * @see {@link AuthUser} for how roles are assigned to users.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthRole extends Record<string, any> {
  /**
   * The name of the authorization role.
   *
   * @description This property represents the unique identifier of the role.
   * @example 'admin', 'moderator', 'user'
   */
  name: string;

  /**
   * The set of permissions associated with the role.
   *
   * @description This property represents the permissions that are granted to the role.
   * @see {@link AuthPerms} for the `AuthPerms` type.
   * @example
   * ```typescript
   * const perms: AuthPerms = {
   *   // permissions for the role
   *   "documents": ["read", "create", "update"],
   *   "users": ["read", "delete"],
   *   "posts": ["read", "create"],
   * };
   * ```
   */
  perms: AuthPerms;
}
/**
 * @interface AuthSessionStorage
 * Interface for managing authentication session storage.
 *
 * The `AuthSessionStorage` interface defines methods for storing and
 * retrieving session data associated with authenticated users. This
 * interface provides a structured way to manage session data, ensuring
 * that it can be easily accessed and manipulated.
 *
 * ### Methods
 *
 * - `get(key?: string): any`: Retrieves the value of the session
 *   associated with the specified key. If no key is provided, it
 *   returns the entire session value.
 *
 *   @param {string} key - The key of the value to retrieve.
 *   @returns {any} The value associated with the specified key, or
 *   undefined if the key does not exist.
 *
 * - `set(key?: string | Dictionary, value?: any): any`: Persists a value
 *   in the session storage. This can either be a single key-value
 *   pair or an object containing multiple session data.
 *
 *   @param {string | Dictionary} key - The key of the value to persist, or
 *   an object containing session data.
 *   @param {any} value - The value to persist. This can be of any type.
 *
 * - `getData(): Dictionary`: Retrieves all session data associated with
 *   the session name defined in the `sessionName` property.
 *
 *   @returns {Dictionary} An object containing all session data.
 *
 * - `getKey(): string`: Returns the key associated with the session
 *   name defined in the `sessionName` property.
 *
 *   @returns {string} The session key.
 *
 * ### Properties
 *
 * - `sessionName` (string, optional): The name of the session used by
 *   the session manager. This can be used to identify the session
 *   context in which the storage operates.
 */
export interface AuthSessionStorage {
  /**
   * Retrieves the value of the session associated with the specified key.
   *
   * @param {string} key - The key of the value to retrieve.
   * @returns {any} The value associated with the specified key, or undefined if the key does not exist.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (key?: string) => any;

  /**
   * Persists a value in the session storage.
   *
   * @param {string | Dictionary} key - The key of the value to persist, or an object containing session data.
   * @param {any} value - The value to persist. This can be of any type.
   * @returns {any} The result of the persistence operation.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (key?: string | Dictionary, value?: any) => any;

  /**
   * Retrieves all session data associated with the session name.
   *
   * @returns {Dictionary} An object containing all session data.
   */
  getData: () => Dictionary;

  /**
   * Returns the key associated with the session name.
   *
   * @returns {string} The session key.
   */
  getKey: () => string;

  /**
   * The name of the session used by the session manager.
   */
  sessionName?: string;
}

/**
 * @type AuthPerm
 * Defines a flexible permission type for evaluating user access to resources.
 *
 * The `AuthPerm` type supports multiple formats for defining permissions,
 * allowing both simple boolean checks and complex resource-action based permissions.
 * This flexibility enables various authorization patterns from simple role-based
 * access control to dynamic, context-aware permission evaluation.
 *
 * @template TResourceName - The specific resource name type. Defaults to `ResourceName`.
 *
 * ### Permission Formats
 *
 * - **Function**: `(user: AuthUser) => boolean` - Dynamic permission check based on user context
 * - **Boolean**: `false` - Explicit denial of access
 * - **Resource Action Tuple**: `[TResourceName, ResourceActionName<TResourceName>]` - Specific resource-action permission
 * - **Resource Action Tuples Array**: `Array<[TResourceName, ResourceActionName<TResourceName>]>` - Multiple resource-action permissions
 *
 * ### Example Usage
 *
 * ```typescript
 * // Dynamic permission using a function
 * const adminOnly: AuthPerm = (user: AuthUser) => {
 *     return user.roles?.some(role => role.name === 'admin') ?? false;
 * };
 *
 * // Explicit denial
 * const noAccess: AuthPerm = false;
 *
 * // Single resource-action permission
 * const readUsers: AuthPerm = ["users", "read"];
 *
 * // Multiple resource-action permissions
 * const manageUsers: AuthPerm = [
 *     ["users", "read"],
 *     ["users", "create"],
 *     ["users", "update"]
 * ];
 *
 * // Function to check permissions
 * function hasPermission(user: AuthUser, perm: AuthPerm): boolean {
 *     if (typeof perm === 'function') {
 *         return perm(user);
 *     }
 *     if (perm === false) {
 *         return false;
 *     }
 *     // Handle tuple/array formats (implementation would check against user perms)
 *     return true; // Simplified for example
 * }
 * ```
 *
 * @see {@link AuthUser} for the user context passed to function permissions.
 * @see {@link ResourceActionTuple} for the tuple format specification.
 * @typedef {((user: AuthUser) => boolean) | false | ResourceActionTuple<TResourceName> | ResourceActionTuple<TResourceName>[]} AuthPerm
 */
export type AuthPerm<TResourceName extends ResourceName = ResourceName> =
  | ((user: AuthUser) => boolean)
  | false
  | ResourceActionTuple<TResourceName>
  | ResourceActionTuple<TResourceName>[];

/**
 * Represents a mapping of authentication permissions for resources.
 * The `AuthPerms` type defines a structure that maps resource names
 * to an array of actions that can be performed on those resources.
 * This type is useful for managing user permissions in an application,
 * allowing for fine-grained control over what actions users can take
 * on various resources.
 *
 *
 * ### Structure
 *
 * The `AuthPerms` type is defined as a `Record` where:
 * - The keys are of type `ResourceName`, representing the names of
 *   the resources (e.g., "documents", "users").
 * - The values are arrays of `ResourceActionName`, representing the
 *   actions that can be performed on the corresponding resource (e.g.,
 *   ["read", "create", "update"]).
 *
 * ### Example Usage
 *
 * Here is an example of how the `AuthPerms` type can be used:
 *
 * ```typescript
 * // Example of defining user permissions using AuthPerms
 * const userPermissions: AuthPerms = {
 *     documents: ["read", "create", "update"],
 *     users: ["read", "delete"],
 *     posts: ["read", "create"]
 * };
 * ```
 *
 * In this example, the `AuthPerms` type is used to define a permissions
 * object for a user, mapping resources to the actions they are allowed
 * to perform.
 * @typedef {Partial<{ [TResourceName in ResourceName]: Partial<ResourceActionName<TResourceName>[]> }>} AuthPerms
 */
export type AuthPerms = Partial<{
  [TResourceName in ResourceName]: Partial<ResourceActionName<TResourceName>[]>;
}>;

/**
 * @interface AuthEventMap
 * Defines the mapping of authentication event names to their string descriptions.
 *
 * This interface serves as a global registry for authentication-related events
 * and supports TypeScript module augmentation, allowing libraries and applications
 * to extend the available authentication events. It provides type-safe event
 * handling and ensures consistency across the authentication system.
 *
 * ### Built-in Events
 *
 * - `SIGN_IN`: Triggered when a user successfully authenticates
 * - `SIGN_OUT`: Triggered when a user logs out
 * - `SIGN_UP`: Triggered when a new user registers
 *
 * ### Module Augmentation
 *
 * This interface can be extended in external modules to add custom authentication events:
 *
 * ```typescript
 * // In a separate module or application
 * declare module "reslib/auth" {
 *     interface AuthEventMap {
 *         PASSWORD_RESET: string;
 *         PROFILE_UPDATE: string;
 *         ACCOUNT_LOCKED: string;
 *     }
 * }
 *
 * // Now AuthEvent includes the new events
 * const event: AuthEvent = 'PASSWORD_RESET'; // TypeScript validates this
 * ```
 *
 * ### Example Usage
 *
 * ```typescript
 * // Basic usage with built-in events
 * const authEvents: AuthEventMap = {
 *     SIGN_IN: 'User has signed in successfully.',
 *     SIGN_OUT: 'User has signed out.',
 *     SIGN_UP: 'New user account created.'
 * };
 *
 * // Event handling with type safety
 * function handleAuthEvent(event: AuthEvent, data?: any) {
 *     const message = authEvents[event];
 *     console.log(`Auth event: ${message}`, data);
 *
 *     switch (event) {
 *         case 'SIGN_IN':
 *             // Handle sign in logic
 *             break;
 *         case 'SIGN_OUT':
 *             // Handle sign out logic
 *             break;
 *         case 'SIGN_UP':
 *             // Handle sign up logic
 *             break;
 *     }
 * }
 *
 * // Usage
 * handleAuthEvent('SIGN_IN', { userId: 123 });
 * ```
 *
 * @see {@link AuthEvent} for the derived event type.
 */
export interface AuthEventMap {
  /**
   * Event triggered when a user signs in.
   *
   * This event is emitted when a user successfully logs into the system.
   * It can be used to trigger actions such as updating the user interface
   * or logging the sign-in activity.
   *
   * @example
   * // Example of handling the SIGN_IN event
   * eventEmitter.on('SIGN_IN', () => {
   *     console.log('User  signed in, updating UI...');
   * });
   */
  SIGN_IN: string;

  /**
   * Event triggered when a user signs out.
   *
   * This event is emitted when a user successfully logs out of the system.
   * It can be used to trigger actions such as clearing user data or
   * redirecting to the login page.
   *
   * @example
   * // Example of handling the SIGN_OUT event
   * eventEmitter.on('SIGN_OUT', () => {
   *     console.log('User  signed out, redirecting to login...');
   * });
   */
  SIGN_OUT: string;

  /**
   * Event triggered when a user signs up.
   *
   * This event is emitted when a new user successfully registers for an account.
   * It can be used to trigger actions such as sending a welcome email or
   * redirecting the user to a confirmation page.
   *
   * @example
   * // Example of handling the SIGN_UP event
   * eventEmitter.on('SIGN_UP', () => {
   *     console.log('New user signed up, sending welcome email...');
   * });
   */
  SIGN_UP: string;
}

/**
 * Type representing the keys of the AuthEventMap interface.
 *
 * This type is a union of string literals corresponding to the event names
 * defined in the AuthEventMap interface. It allows for type-safe handling
 * of authentication events throughout the application.
 *
 * @example
 * // Example of using AuthEvent
 * function handleAuthEvent(event: AuthEvent) {
 *     switch (event) {
 *         case 'SIGN_IN':
 *             console.log('Handling sign-in event...');
 *             break;
 *         case 'SIGN_OUT':
 *             console.log('Handling sign-out event...');
 *             break;
 *         case 'SIGN_UP':
 *             console.log('Handling sign-up event...');
 *             break;
 *     }
 * }
 */
export type AuthEvent = keyof AuthEventMap;

/**
 * @interface AuthStorage
 * Interface for secure, cross-platform storage of authentication data.
 *
 * The `AuthStorage` interface abstracts storage operations to enable secure,
 * platform-specific implementations for storing sensitive data like user sessions
 * and tokens. This allows the library to work across web, React Native, Node.js,
 * and other environments by injecting appropriate storage adapters.
 *
 * ### Security Features:
 * - **Async Operations**: All methods are asynchronous to support secure storage APIs
 * - **Encryption Ready**: Implementations should handle encryption internally
 * - **Platform Agnostic**: No assumptions about underlying storage mechanism
 * - **Error Handling**: Methods should handle storage failures gracefully
 *
 * ### Methods
 *
 * - `get(key: string): Promise<string | null>`: Retrieves the value associated with the key
 * - `set(key: string, value: string): Promise<void>`: Stores a value under the specified key
 * - `remove(key: string): Promise<void>`: Removes the value associated with the key
 *
 * ### Example Usage
 *
 * ```typescript
 * // Web implementation using HttpOnly cookies
 * class WebSecureStorage implements AuthStorage {
 *   async get(key: string): Promise<string | null> {
 *     return Cookies.get(key) || null;
 *   }
 *   async set(key: string, value: string): Promise<void> {
 *     Cookies.set(key, value, { httpOnly: true, secure: true });
 *   }
 *   async remove(key: string): Promise<void> {
 *     Cookies.remove(key);
 *   }
 * }
 *
 * // React Native implementation using expo-secure-store
 * class ReactNativeSecureStorage implements AuthStorage {
 *   async get(key: string): Promise<string | null> {
 *     return await SecureStore.getItemAsync(key);
 *   }
 *   async set(key: string, value: string): Promise<void> {
 *     await SecureStore.setItemAsync(key, value);
 *   }
 *   async remove(key: string): Promise<void> {
 *     await SecureStore.deleteItemAsync(key);
 *   }
 * }
 *
 * // Configure Auth to use platform-specific storage
 * Auth.configure({ storage: new ReactNativeSecureStorage() });
 * ```
 *
 * @see {@link Auth.configure} - Method to inject storage implementation
 * @see {@link Auth.getToken} - Uses this interface for token storage
 * @see {@link Auth.setToken} - Uses this interface for token storage
 */
export interface AuthStorage {
  /**
   * Retrieves the value associated with the specified key.
   *
   * @param key - The unique key for the stored value
   * @returns Promise resolving to the stored string value, or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Stores a value under the specified key.
   *
   * @param key - The unique key for storing the value
   * @param value - The string value to store
   * @returns Promise that resolves when storage is complete
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Removes the value associated with the specified key.
   *
   * @param key - The unique key for the value to remove
   * @returns Promise that resolves when removal is complete
   */
  remove(key: string): Promise<void>;
}
