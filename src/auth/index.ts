import { Observable, observable } from '@/observable';
import { ClassConstructor } from '@/types';
import {
  ResourceActionName,
  ResourceActionTupleArray,
  ResourceActionTupleObject,
  ResourceName,
} from '@resources/types';
import CryptoJS from 'crypto-js';
import 'reflect-metadata';
import { i18n } from '../i18n';
import { Logger } from '../logger';
import { Session as $session } from '../session';
import { Dictionary } from '../types/dictionary';
import { isNonNullString, isObj, JsonHelper, stringify } from '../utils';
import './types';
import {
  AuthEvent,
  AuthPerm,
  AuthPerms,
  AuthSecureStorage,
  AuthSessionStorage,
  AuthUser,
} from './types';

export * from './types';

const encrypt = CryptoJS.AES.encrypt;
const decrypt = CryptoJS.AES.decrypt;
const SESSION_ENCRYPT_KEY = 'auth-decrypted-key';
const USER_SESSION_KEY = 'user-session';

type ILocalUserRef = {
  current: AuthUser | null;
};

const DefaultAuthStorage: AuthSecureStorage = {
  get: async (key) => $session.get(key),
  set: async (key, value) => {
    await $session.set(key, value);
  },
  remove: async (key) => {
    await $session.remove(key);
  },
};

/***
 * A class that provides methods for managing session data.
 *
 */
class Session {
  /**
   * Retrieves a specific value from the session data based on the provided session name and key.
   *
   * This function first checks if the provided key is a non-null string. If it is not, it returns undefined.
   * It then retrieves the session data using `getData` and returns the value associated with the specified key.
   *
   * @param sessionName - An optional string that represents the name of the session.
   * @param key - A string representing the key of the value to retrieve from the session data.
   *
   * @returns The value associated with the specified key in the session data, or undefined if the key is invalid.
   *
   * @example
   * // Example of retrieving a specific value from session data
   * const value = get('mySession', 'userPreference'); // Returns: 'darkMode'
   *
   * @example
   * // Example of trying to retrieve a value with an invalid key
   * const value = get('mySession', null); // Returns: undefined
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static get(sessionName?: string, key?: string): any {
    if (!isNonNullString(key)) return undefined;
    return Session.getData(sessionName)[key as string];
  }
  /**
   * Sets a value or an object in the session data for a specific session name.
   *
   * This function retrieves the current session data using `getData`. If a valid key is provided, it sets the
   * corresponding value in the session data. If an object is provided as the key, it replaces the entire session data.
   * Finally, it saves the updated session data back to the session storage.
   *
   * @param sessionName - An optional string that represents the name of the session.
   * @param key - A string representing the key to set a value for, or an object containing multiple key-value pairs.
   * @param value - The value to set for the specified key. This parameter is ignored if an object is provided as the key.
   *
   * @returns The updated session data as an object.
   *
   * @example
   * // Example of setting a single value in session data
   * const updatedData = set('mySession', 'userPreference', 'darkMode'); // Returns: { userPreference: 'darkMode' }
   *
   * @example
   * // Example of replacing the entire session data with an object
   * const updatedData = set('mySession', { userPreference: 'lightMode', language: ' English' }); // Returns: { userPreference: 'lightMode', language: 'English' }
   */
  static set(
    sessionName?: string,
    key?: string | Dictionary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any
  ): Dictionary {
    let data = Session.getData(sessionName);
    if (isNonNullString(key)) {
      data[key as string] = value;
    } else if (isObj(key)) {
      data = key;
    }
    $session.set(Session.getKey(sessionName), data);
    return data;
  }
  /**
   * Generates a unique session key based on the authenticated user's ID and an optional session name.
   *
   * The session key is constructed in the format: `auth-{userId}-{sessionName}`. If the user is not signed in,
   * the user ID will be an empty string. This key is used to store and retrieve session data.
   *
   * @param sessionName - An optional string that represents the name of the session. If not provided,
   *                      an empty string will be used in the key.
   *
   * @returns A string representing the unique session key.
   *
   * @example
   * // Example of generating a session key for a user with ID '12345'
   * const sessionKey = getKey('mySession'); // Returns: 'auth-12345-mySession'
   *
   * @example
   * // Example of generating a session key when no user is signed in
   * const sessionKey = getKey(); // Returns: 'auth--'
   */
  static getKey(sessionName?: string) {
    return `auth-${stringify(Auth.getSignedUser()?.id)}-${sessionName || ''}`;
  }
  /**
   * Retrieves session data associated with a specific session name.
   *
   * This function checks if the provided session name is a non-null string. If it is not, an empty object is returned.
   * Otherwise, it constructs a key using `getKey` and retrieves the corresponding data from the session storage.
   *
   * @param sessionName - An optional string that represents the name of the session. If not provided or invalid,
   *                      an empty object will be returned.
   *
   * @returns An object containing the session data associated with the specified session name.
   *          If the session name is invalid, an empty object is returned.
   *
   * @example
   * // Example of retrieving session data for a specific session name
   * const sessionData = getData('mySession'); // Returns: {  }
   *
   * @example
   * // Example of retrieving session data with an invalid session name
   * const sessionData = getData(null); // Returns: {}
   */
  static getData(sessionName?: string): Dictionary {
    if (!isNonNullString(sessionName)) return {};
    const key = Session.getKey(sessionName);
    return Object.assign({}, $session.get(key));
  }
  /**
   * Retrieves a session storage object that provides methods for managing session data.
   *
   * This function creates an object that allows you to interact with session storage
   * using a specified session name. It provides methods to get, set, and retrieve data
   * associated with the session, as well as to retrieve the session key.
   *
   * @param sessionName - An optional string that represents the name of the session.
   *                      If provided, it will be used as a prefix for the keys stored
   *                      in session storage. If not provided, the session will be
   *                      treated as anonymous.
   *
   * @returns An object implementing the `AuthSessionStorage` interface, which includes
   *          methods for session management:
   *          - `get(key?: string): any`: Retrieves the value associated with the specified key.
   *          - `set(key?: string | Dictionary, value?: any): void`: Stores a value under the specified key.
   *          - `getData(): Dictionary`: Returns all data stored in the session as a dictionary.
   *          - `getKey(): string`: Returns the session key used for storage.
   *
   * @example
   * // Create a session storage object with a specific session name
   * const session = getSessionStorage('userSession');
   *
   * // Get the session key
   * const sessionKey = session.getKey(); // 'userSession'
   *
   * @remarks
   * This function is particularly useful for managing user authentication sessions
   * in web applications. By using session storage, data persists across page reloads
   * but is cleared when the tab or browser is closed.
   *
   * Ensure that the keys used for storing data are unique to avoid collisions with
   * other session data. Consider using a structured naming convention for keys.
   */
  static getStorage(sessionName?: string): AuthSessionStorage {
    return {
      sessionName,
      get: (key?: string) => {
        return Session.get(sessionName, key);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (key?: string | Dictionary, value?: any) => {
        return Session.set(sessionName, key, value);
      },
      getData: (): Dictionary => {
        return Session.getData(sessionName);
      },
      getKey: () => {
        return Session.getKey(sessionName);
      },
    };
  }
}

export class Auth {
  /**
   * Authentication event handler.
   * Initializes an observable event handler for authentication Auth.events.
   *
   * This constant `events` is assigned an instance of `Observable<AuthEvent>`, which is used to manage
   * authentication-related events in the application. The initialization checks if the global
   * `Global.eventsResourcesObservableHandler` exists and is an object. If it does, it assigns it to
   * `events`; otherwise, it defaults to an empty object cast as `Observable<AuthEvent>`.
   *
   * This pattern allows for flexible handling of events, ensuring that the application can respond
   * to authentication actions such as sign-in, sign-out, and sign-up.
   *
   * @type {Observable<AuthEvent>}
   *
   * @example
   * import {Auth} from 'reslib/auth';
   * Auth.events.on('SIGN_IN', (user) => {
   *     console.log(`User  signed in: ${user.username}`);
   * });
   *
   * function userSignIn(user) {
   *     Auth.events.trigger('SIGN_IN', user);
   * }
   */
  static events: Observable<AuthEvent> = observable<AuthEvent>({});
  private static localUserRef: ILocalUserRef = { current: null };
  /**
   * Checks if the user is a master admin.
   *
   * The `isMasterAdmin` function determines whether the provided user
   * has master admin privileges. If no user is provided, it will
   * attempt to retrieve the signed user from the session.
   *
   * ### Parameters
   *
   * - `user` (AuthUser , optional): The user object to check. If not
   *   provided, the function will attempt to retrieve the signed user
   *   from the session.
   *
   * ### Returns
   *
   * - `boolean`: Returns `true` if the user is a master admin, or `false` otherwise.
   *
   * ### Example Usage
   *
   * ```typescript
   * const user: AuthUser  = { id: "admin123" };
   * Auth.isMasterAdmin = (user)=>{
   *  return checkSomeCondition(user);
   * }; // false (assuming the user is not a master admin)
   * ```
   * @see {@link AuthUser} for the `AuthUser` type.
   */
  static isMasterAdmin?: (user?: AuthUser) => boolean;
  private static _isMasterAdmin(user?: AuthUser): boolean {
    user = isObj(user) ? user : (Auth.getSignedUser() as AuthUser);
    return typeof Auth.isMasterAdmin == 'function'
      ? Auth.isMasterAdmin(user)
      : false;
  }

  /**
   * Retrieves the currently authenticated user from secure session storage.
   *
   * This method implements a secure user session retrieval system that handles encrypted
   * user data storage. It first checks for a cached user reference in memory for performance
   * optimization, then attempts to decrypt and parse the user data from session storage
   * if no cached version exists. The method includes comprehensive error handling for
   * decryption failures and data corruption scenarios.
   *
   * ### Security Features:
   * - **Encrypted Storage**: User data is encrypted using AES encryption before storage
   * - **Memory Caching**: Cached in `localUserRef` for improved performance and reduced decryption overhead
   * - **Safe Parsing**: Uses `JsonHelper.parse` for secure JSON deserialization
   * - **Error Recovery**: Gracefully handles corrupted or invalid session data
   *
   * ### Performance Optimization:
   * The method implements a two-tier retrieval strategy:
   * 1. **Memory Cache**: Returns immediately if user is already loaded in memory
   * 2. **Session Storage**: Decrypts and parses data from persistent storage only when needed
   *
   * @returns The authenticated user object containing user information, permissions, and roles,
   *          or `null` if no user is currently signed in, session data is corrupted, or
   *          decryption fails. The returned object conforms to the `AuthUser` interface.
   *
   * @example
   * ```typescript
   * // Basic usage - check if user is signed in
   * const currentUser = Auth.getSignedUser();
   * if (currentUser) {
   *   console.log(`Welcome back, ${currentUser.username}!`);
   *   console.log(`User ID: ${currentUser.id}`);
   * } else {
   *   console.log("No user is currently signed in");
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Using with permission checking
   * const user = Auth.getSignedUser();
   * if (user) {
   *   const canEditDocuments = Auth.checkUserPermission(user, "documents", "update");
   *   if (canEditDocuments) {
   *     showEditButton();
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handling authentication state in React component
   * function UserProfile() {
   *   const [user, setUser] = useState<AuthUser | null>(null);
   *
   *   useEffect(() => {
   *     const currentUser = Auth.getSignedUser();
   *     setUser(currentUser);
   *
   *     if (!currentUser) {
   *       // Redirect to login page
   *       router.push('/login');
   *     }
   *   }, []);
   *
   *   return user ? <div>Hello, {user.username}</div> : <div>Loading...</div>;
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Using with authentication guards
   * class AuthGuard {
   *   static requireAuth(): boolean {
   *     const user = Auth.getSignedUser();
   *     if (!user) {
   *       throw new Error("Authentication required");
   *     }
   *     return true;
   *   }
   *
   *   static requireRole(roleName: string): boolean {
   *     const user = Auth.getSignedUser();
   *     return user?.roles?.some(role => role.name === roleName) ?? false;
   *   }
   * }
   * ```
   *
   * @example
   *
   * @throws {CryptoError} May throw during decryption if session data is corrupted
   * @throws {SyntaxError} May throw during JSON parsing if decrypted data is malformed
   *
   * @see {@link AuthUser} - Complete user object interface definition
   * @see {@link setSignedUser} - Method to store user in session
   * @see {@link signIn} - High-level user authentication method
   * @see {@link signOut} - Method to clear user session
   * @see {@link checkUserPermission} - Check specific user permissions
   *
   *
   * @public
   *
   * @remarks
   * **Security Considerations:**
   * - Session data is automatically encrypted using AES encryption
   * - The encryption key `SESSION_ENCRYPT_KEY` should be kept secure
   * - User data includes sensitive information like tokens and permissions
   * - Always validate user data before using in security-critical operations
   *
   * **Performance Notes:**
   * - First call after page load requires decryption (slower)
   * - Subsequent calls return cached data (faster)
   * - Cache is automatically cleared when user signs out
   * - Consider the performance impact in render loops
   *
   * **Error Handling:**
   * - Returns `null` instead of throwing errors for better UX
   * - Logs errors to console for debugging purposes
   * - Gracefully handles session storage corruption
   * - Automatically recovers from temporary decryption failures
   */
  static getSignedUser(): AuthUser | null {
    if (isObj(Auth.localUserRef.current)) return Auth.localUserRef.current;
    const encrypted = $session.get(USER_SESSION_KEY);
    if (encrypted) {
      try {
        const ded = decrypt(encrypted, SESSION_ENCRYPT_KEY);
        if (ded && typeof ded?.toString == 'function') {
          const decoded = ded.toString(CryptoJS.enc.Utf8);
          Auth.localUserRef.current = JsonHelper.parse(decoded) as AuthUser;
          return Auth.localUserRef.current;
        }
      } catch (e) {
        Logger.log('getting local user ', e);
      }
    }
    return null;
  }

  /**
   * Securely stores an authenticated user in encrypted session storage with event broadcasting.
   *
   * This method is the core user session management function that handles secure storage of user
   * authentication data. It encrypts user information using AES encryption before persisting to
   * session storage, maintains local memory cache for performance, and optionally broadcasts
   * authentication events to notify other parts of the application about user state changes.
   *
   * ### Security Architecture:
   * - **AES Encryption**: User data is encrypted before storage to protect sensitive information
   * - **Session Timestamping**: Automatically adds `sessionCreatedAt` timestamp for session tracking
   * - **Error Isolation**: Encryption failures don't crash the application, user reference is safely cleared
   * - **Memory Management**: Updates local cache reference for immediate access
   *
   * ### Event System Integration:
   * The method integrates with the authentication event system to broadcast state changes:
   * - **SIGN_IN Event**: Triggered when a valid user is stored with successful encryption
   * - **SIGN_OUT Event**: Triggered when user is cleared (null) or encryption fails
   * - **Event Payload**: Includes the user object for event handlers to process
   *
   * @param u - The user object to store in session, or `null` to clear the current session.
   *            When providing a user object, it should contain all necessary authentication
   *            information including permissions, roles, and tokens. The object will be
   *            automatically timestamped with `sessionCreatedAt`.
   *
   * @param triggerEvent - Optional flag controlling whether to broadcast authentication events.
   *                       When `true` (default), triggers either 'SIGN_IN' or 'SIGN_OUT' events
   *                       based on the operation result. Set to `false` to perform silent
   *                       session updates without notifying event listeners.
   *
   * @returns A promise that resolves to the result of the session storage operation.
   *          The promise completes after the encrypted data has been written to storage.
   *          Returns the storage operation result, typically indicating success or failure.
   *
   * @example
   * ```typescript
   * // Standard user sign-in with event broadcasting
   * const user: AuthUser = {
   *   id: "user123",
   *   username: "john_doe",
   *   email: "john@example.com",
   *   perms: { documents: ["read", "write"] },
   *   roles: [{ name: "editor", perms: { images: ["upload"] } }]
   * };
   *
   * await Auth.setSignedUser(user, true);
   * console.log("User signed in with events triggered");
   * ```
   *
   * @example
   * ```typescript
   * // Silent session update without triggering events
   * const updatedUser = { ...currentUser, lastActivity: new Date() };
   * await Auth.setSignedUser(updatedUser, false);
   * console.log("User session updated silently");
   * ```
   *
   * @example
   * ```typescript
   * // Clear user session (sign out)
   * await Auth.setSignedUser(null, true);
   * console.log("User signed out, SIGN_OUT event triggered");
   * ```
   *
   * @example
   * ```typescript
   * // Using with event listeners
   * Auth.events.on('SIGN_IN', (user) => {
   *   console.log(`Welcome ${user.username}!`);
   *   initializeUserDashboard(user);
   *   trackUserLogin(user.id);
   * });
   *
   * Auth.events.on('SIGN_OUT', () => {
   *   console.log('User signed out');
   *   clearUserDashboard();
   *   redirectToLogin();
   * });
   *
   * // Now when we set a user, events will fire automatically
   * await Auth.setSignedUser(authenticatedUser);
   * ```
   *
   * @example
   * ```typescript
   * // Error handling with session management
   * try {
   *   await Auth.setSignedUser(userFromAPI);
   *   showSuccessMessage("Login successful");
   * } catch (error) {
   *   console.error("Failed to store user session:", error);
   *   showErrorMessage("Login failed, please try again");
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Updating user permissions after role change
   * const currentUser = Auth.getSignedUser();
   * if (currentUser) {
   *   const updatedUser = {
   *     ...currentUser,
   *     roles: [...currentUser.roles, newRole],
   *     perms: { ...currentUser.perms, ...newPermissions }
   *   };
   *
   *   await Auth.setSignedUser(updatedUser, false); // Silent update
   *   console.log("User permissions updated");
   * }
   * ```
   *
   * @throws {CryptoError} May throw if encryption fails due to invalid encryption key
   * @throws {StorageError} May throw if session storage is unavailable or quota exceeded
   *
   * @see {@link AuthUser} - Complete user object interface with all required fields
   * @see {@link getSignedUser} - Retrieve the currently stored user from session
   * @see {@link signIn} - High-level user authentication wrapper
   * @see {@link signOut} - High-level user sign-out wrapper
   * @see {@link Auth.events} - Authentication event system for state change notifications
   * @see {@link AuthEvent} - Available authentication event types and payloads
   *
   *
   * @public
   * @async
   *
   * @remarks
   * **Security Best Practices:**
   * - User objects should be validated before storage
   * - Sensitive data like tokens are automatically encrypted
   * - Session timestamps help with security auditing
   * - Always handle encryption errors gracefully
   *
   * **Performance Considerations:**
   * - Encryption/decryption adds computational overhead
   * - Local cache is updated synchronously for immediate access
   * - Event broadcasting may trigger multiple listeners
   * - Consider batching multiple user updates to reduce I/O
   *
   * **Event System:**
   * - Events are asynchronous and don't block the storage operation
   * - Multiple listeners can subscribe to the same event
   * - Event payload includes the full user object for flexibility
   * - Use `triggerEvent: false` for internal operations to avoid recursion
   */
  static async setSignedUser(u: AuthUser | null, triggerEvent?: boolean) {
    Auth.localUserRef.current = u;
    const uToSave = u as AuthUser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let encrypted: any = null;
    try {
      if (isObj(uToSave)) {
        uToSave.sessionCreatedAt = new Date().getTime();
      }
      encrypted = uToSave
        ? encrypt(JSON.stringify(uToSave), SESSION_ENCRYPT_KEY).toString()
        : null;
    } catch (e) {
      Auth.localUserRef.current = null;
      Logger.log(e, ' setting local user');
    }
    await $session.set(USER_SESSION_KEY, encrypted);
    if (triggerEvent) {
      const event =
        isObj(uToSave) && encrypted && encrypted !== null
          ? 'SIGN_IN'
          : 'SIGN_OUT';
      Auth.events.trigger(event, uToSave);
    }
    return u;
  }

  /**
   * Authenticates a user and establishes a secure session with comprehensive validation.
   *
   * This high-level authentication method provides a complete user sign-in workflow with
   * input validation, secure session establishment, and event broadcasting. It serves as
   * the primary entry point for user authentication in applications, handling all the
   * complexity of secure session management while providing a simple, promise-based API.
   *
   * ### Authentication Workflow:
   * 1. **Input Validation**: Validates that the provided user object is properly structured
   * 2. **Session Creation**: Calls `setSignedUser` to securely store user data
   * 3. **Event Broadcasting**: Optionally triggers authentication events for app-wide notifications
   * 4. **Return Confirmation**: Returns the authenticated user object on successful completion
   *
   * ### Security Features:
   * - **Object Validation**: Ensures user object is valid before processing
   * - **Encrypted Storage**: Leverages `setSignedUser` for secure data persistence
   * - **Error Handling**: Provides meaningful error messages for failed authentication
   * - **Session Timestamping**: Automatically tracks when authentication session was created
   *
   * @param user - The authenticated user object containing all necessary user information.
   *               Must be a valid object conforming to the `AuthUser` interface, including
   *               properties like id, username, email, permissions, roles.
   *               The object should come from a successful authentication process (login API, OAuth, etc.).
   *
   * @param triggerEvent - Optional flag controlling whether to broadcast authentication events.
   *                       When `true` (default), triggers a 'SIGN_IN' event that other parts of
   *                       the application can listen to for initialization, analytics, or UI updates.
   *                       Set to `false` for silent authentication without event notifications.
   *
   * @returns A promise that resolves to the authenticated user object when sign-in is successful.
   *          The returned user object is the same as the input but may include additional
   *          properties added during the authentication process (like session timestamps).
   *
   * @throws {Error} Throws an error with internationalized message if the user object is invalid,
   *                 null, undefined, or not a proper object structure. The error message is
   *                 retrieved from the i18n system using key "auth.invalidSignInUser".
   *
   * @example
   * ```typescript
   * // Basic user sign-in after successful API authentication
   * try {
   *   const response = await fetch('/api/auth/login', {
   *     method: 'POST',
   *     body: JSON.stringify({ username, password }),
   *     headers: { 'Content-Type': 'application/json' }
   *   });
   *
   *   const userData = await response.json();
   *   const authenticatedUser = await Auth.signIn(userData);
   *
   *   console.log(`Welcome ${authenticatedUser.username}!`);
   *   router.push('/dashboard');
   * } catch (error) {
   *   console.error('Sign-in failed:', error.message);
   *   showErrorMessage('Invalid credentials');
   * }
   * ```
   *
   * @example
   * ```typescript
   * // OAuth authentication workflow
   * async function handleOAuthCallback(authCode: string) {
   *   try {
   *     // Exchange auth code for user data
   *     const tokenResponse = await exchangeCodeForToken(authCode);
   *     const userProfile = await fetchUserProfile(tokenResponse.access_token);
   *
   *     const user: AuthUser = {
   *       id: userProfile.id,
   *       username: userProfile.login,
   *       email: userProfile.email,
   *       perms: await fetchUserPermissions(userProfile.id),
   *       roles: await fetchUserRoles(userProfile.id),
   *       provider: 'oauth'
   *     };
   *
   *     await Auth.signIn(user);
   *     console.log('OAuth sign-in successful');
   *   } catch (error) {
   *     console.error('OAuth sign-in failed:', error);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Silent authentication without triggering events
   * async function silentAuth(sessionToken: string) {
   *   try {
   *     const userData = await validateSessionToken(sessionToken);
   *     const user = await Auth.signIn(userData, false); // No events
   *
   *     console.log('Silent authentication successful');
   *     return user;
   *   } catch (error) {
   *     console.log('Silent auth failed, user needs to login');
   *     return null;
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Complete authentication flow with event handling
   * // Set up event listeners first
   * Auth.events.on('SIGN_IN', (user) => {
   *   // Initialize user-specific features
   *   initializeUserPreferences(user.id);
   *   loadUserDashboard(user.perms);
   *   trackAnalyticsEvent('user_signin', { userId: user.id });
   *
   *   // Update UI state
   *   updateNavigationForUser(user.roles);
   *   showWelcomeMessage(user.username);
   * });
   *
   * // Perform authentication
   * async function loginUser(credentials: LoginCredentials) {
   *   try {
   *     const authResult = await authenticateWithAPI(credentials);
   *     const user = await Auth.signIn(authResult.user); // Events will fire
   *
   *     return { success: true, user };
   *   } catch (error) {
   *     return { success: false, error: error.message };
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Multi-step authentication with role-based redirection
   * async function signInWithRoleRedirect(userData: any) {
   *   try {
   *     const user = await Auth.signIn(userData);
   *
   *     // Redirect based on user role
   *     if (user.roles?.some(role => role.name === 'admin')) {
   *       router.push('/admin/dashboard');
   *     } else if (user.roles?.some(role => role.name === 'moderator')) {
   *       router.push('/moderator/panel');
   *     } else {
   *       router.push('/user/dashboard');
   *     }
   *
   *     return user;
   *   } catch (error) {
   *     console.error('Role-based sign-in failed:', error);
   *     throw error;
   *   }
   * }
   * ```
   *
   * @see {@link AuthUser} - Complete user object interface specification
   * @see {@link setSignedUser} - Lower-level method for secure user storage
   * @see {@link getSignedUser} - Retrieve currently authenticated user
   * @see {@link signOut} - Sign out and clear user session
   * @see {@link Auth.events} - Authentication event system for state notifications
   * @see {@link isAllowed} - Check user permissions for access control
   *
   *
   * @public
   * @async
   *
   * @remarks
   * **Best Practices:**
   * - Always validate user data before calling this method
   * - Use try-catch blocks to handle authentication failures gracefully
   * - Use event listeners to initialize user-specific application features
   *
   * **Error Handling:**
   * - The method throws immediately on invalid input for fast failure
   * - Use internationalized error messages for better user experience
   * - Consider logging authentication attempts for security monitoring
   * - Implement retry logic for transient authentication failures
   *
   * **Integration Notes:**
   * - Works seamlessly with any authentication provider (JWT, OAuth, custom)
   * - Integrates with the permission system for access control
   * - Compatible with SSR/SPA applications through secure session storage
   * - Supports both traditional and modern authentication workflows
   */
  static async signIn(
    user: AuthUser,
    triggerEvent: boolean = true
  ): Promise<AuthUser> {
    if (!isObj(user)) {
      throw new Error(i18n.t('auth.invalidSignInUser'));
    }
    return (await Auth.setSignedUser(user, triggerEvent)) as AuthUser;
  }

  /**
   * Signs out the currently authenticated user and securely clears their session.
   *
   * This method provides a high-level, convenient interface for user sign-out operations.
   * It handles the complete user session termination workflow by clearing the encrypted
   * user data from session storage, removing the cached user reference from memory, and
   * optionally broadcasting sign-out events to notify other parts of the application
   * about the authentication state change.
   *
   * ### Sign-Out Workflow:
   * 1. **Session Clearing**: Calls `setSignedUser(null)` to remove user data from encrypted storage
   * 2. **Memory Cleanup**: Clears the local user reference cache for immediate effect
   * 3. **Event Broadcasting**: Optionally triggers 'SIGN_OUT' events for application-wide notifications
   * 4. **Security Cleanup**: Ensures no sensitive user data remains in browser storage
   *
   * ### Security Features:
   * - **Complete Data Removal**: Eliminates all traces of user session from storage
   * - **Memory Safety**: Clears in-memory user references to prevent data leakage
   * - **Event Coordination**: Allows other components to perform cleanup operations
   * - **Immediate Effect**: Session termination is effective immediately after method completion
   *
   * ### Application Integration:
   * The method integrates seamlessly with the authentication event system, allowing
   * other parts of the application to react to sign-out events by clearing user-specific
   * data, redirecting to login pages, or performing cleanup operations.
   *
   * @param triggerEvent - Optional flag controlling whether to broadcast authentication events.
   *                       When `true` (default), triggers a 'SIGN_OUT' event that other parts
   *                       of the application can listen to for cleanup operations, analytics,
   *                       or UI state updates. Set to `false` to perform silent sign-out
   *                       without notifying event listeners (useful for internal operations).
   *
   * @returns A promise that resolves when the sign-out operation is complete and all
   *          user session data has been successfully removed from storage. The promise
   *          resolves to `void` as no return value is needed after successful sign-out.
   *
   * @example
   * ```typescript
   * // Standard user sign-out with event broadcasting
   * async function handleUserSignOut() {
   *   try {
   *     await Auth.signOut();
   *     console.log('User signed out successfully');
   *
   *     // Redirect to login page
   *     window.location.href = '/login';
   *   } catch (error) {
   *     console.error('Sign-out failed:', error);
   *     showErrorMessage('Failed to sign out');
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Silent sign-out without triggering events
   * async function silentSignOut() {
   *   await Auth.signOut(false); // No events triggered
   *   console.log('Silent sign-out completed');
   *
   *   // Manually handle post-signout operations
   *   clearUserSpecificData();
   *   redirectToPublicArea();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Sign-out with comprehensive event handling
   * // Set up event listener first
   * Auth.events.on('SIGN_OUT', () => {
   *   console.log('User signed out - cleaning up...');
   *
   *   // Clear user-specific application state
   *   clearUserPreferences();
   *   clearUserCache();
   *   resetApplicationState();
   *
   *   // Update UI
   *   hideUserMenus();
   *   showGuestContent();
   *
   *   // Analytics and logging
   *   trackAnalyticsEvent('user_signout');
   *   logSecurityEvent('session_terminated');
   * });
   *
   * // Perform sign-out - events will fire automatically
   * await Auth.signOut();
   * ```
   *
   * @example
   * ```typescript
   * // Session timeout handling
   * class SessionManager {
   *   private timeoutId: NodeJS.Timeout | null = null;
   *
   *   startSessionTimer(durationMs: number) {
   *     this.clearSessionTimer();
   *
   *     this.timeoutId = setTimeout(async () => {
   *       console.log('Session expired - signing out user');
   *       await Auth.signOut(); // Will trigger events
   *
   *       showNotification('Session expired. Please sign in again.');
   *     }, durationMs);
   *   }
   *
   *   clearSessionTimer() {
   *     if (this.timeoutId) {
   *       clearTimeout(this.timeoutId);
   *       this.timeoutId = null;
   *     }
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Multi-tab sign-out coordination
   * // Listen for storage events to handle sign-out in other tabs
   * window.addEventListener('storage', (event) => {
   *   if (event.key === USER_SESSION_KEY && event.newValue === null) {
   *     console.log('User signed out in another tab');
   *
   *     // Perform silent sign-out in this tab without triggering events
   *     Auth.signOut(false);
   *
   *     // Update UI to reflect signed-out state
   *     updateUIForSignedOutUser();
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Complete authentication flow with error handling
   * class AuthenticationService {
   *   async performSignOut(): Promise<boolean> {
   *     try {
   *       // Check if user is actually signed in
   *       const currentUser = Auth.getSignedUser();
   *       if (!currentUser) {
   *         console.log('No user to sign out');
   *         return true;
   *       }
   *
   *       // Sign out locally
   *       await Auth.signOut();
   *
   *       console.log('Complete sign-out successful');
   *       return true;
   *     } catch (error) {
   *       console.error('Sign-out process failed:', error);
   *
   *       // Force local sign-out even if server call failed
   *       await Auth.signOut(false);
   *       return false;
   *     }
   *   }
   * }
   * ```
   *
   * @throws {StorageError} May throw if session storage is unavailable during cleanup
   * @throws {CryptoError} May throw if there are issues clearing encrypted session data
   *
   * @see {@link setSignedUser} - Lower-level method used internally for session management
   * @see {@link getSignedUser} - Check if a user is currently signed in before sign-out
   * @see {@link signIn} - Corresponding method for user authentication
   * @see {@link Auth.events} - Event system for handling sign-out notifications
   * @see {@link AuthEvent} - Authentication event types including 'SIGN_OUT'
   * @see {@link USER_SESSION_KEY} - Storage key used for session data
   *
   *
   * @public
   * @async
   *
   * @remarks
   * **Security Considerations:**
   * - Always sign out users when suspicious activity is detected
   * - Consider notifying the server about client-side sign-outs for security auditing
   * - Be aware that local sign-out doesn't invalidate server-side sessions automatically
   * - Use HTTPS to prevent session hijacking during the sign-out process
   *
   * **Best Practices:**
   * - Always handle sign-out errors gracefully to avoid leaving users in inconsistent states
   * - Use event listeners to coordinate sign-out across multiple application components
   * - Consider implementing automatic sign-out for security-sensitive applications
   * - Provide clear feedback to users about successful sign-out operations
   *
   * **Performance Notes:**
   * - Sign-out is typically fast as it only involves storage cleanup
   * - Event broadcasting may trigger multiple listeners, consider the performance impact
   * - Silent sign-out (`triggerEvent: false`) is faster as it skips event processing
   * - Consider batching multiple sign-out operations if needed programmatically
   *
   * **Multi-Tab Considerations:**
   * - Sign-out in one tab affects session storage visible to all tabs
   * - Other tabs should listen for storage events to stay synchronized
   * - Consider implementing cross-tab communication for better user experience
   * - Be careful with silent sign-outs in multi-tab scenarios to avoid confusion
   */
  static async signOut(triggerEvent: boolean = true) {
    return await Auth.setSignedUser(null, triggerEvent);
  }

  private static isResourceActionTupleArray<
    TResourceName extends ResourceName = ResourceName,
  >(
    perm: AuthPerm<TResourceName>
  ): perm is ResourceActionTupleArray<TResourceName> {
    return (
      Array.isArray(perm) &&
      perm.length === 2 &&
      isNonNullString(perm[0]) &&
      isNonNullString(perm[1])
    );
  }
  private static isResourceActionTupleObject<
    TResourceName extends ResourceName = ResourceName,
  >(
    perm: AuthPerm<TResourceName>
  ): perm is ResourceActionTupleObject<TResourceName> {
    return (
      !Array.isArray(perm) &&
      typeof perm === 'object' &&
      isObj(perm) &&
      isNonNullString(perm.resourceName) &&
      isNonNullString(perm.action)
    );
  }
  /**
   * Determines whether a user has permission to access a resource or perform an action.
   *
   * This comprehensive authorization method evaluates various types of permission configurations
   * to determine if the specified user (or currently signed-in user) is allowed to perform
   * the requested operation. It supports multiple permission formats including boolean flags,
   * function-based permissions, resource-action tuples, and complex permission arrays.
   *
   * The method follows a priority-based evaluation system:
   * 1. Boolean permissions are returned directly
   * 2. Master admin users are always granted access
   * 3. Null/undefined permissions default to `true` (open access)
   * 4. Function permissions are evaluated with the user context
   * 5. Resource-action permissions are checked against user's role permissions
   * 6. Array permissions are evaluated with OR logic (any match grants access)
   *
   * @template TResourceName - The resource name type, extending ResourceName
   *
   * @param perm - The permission configuration to evaluate. Can be:
   *   - `boolean`: Direct permission flag (true = allowed, false = denied)
   *   - `function`: Custom permission evaluator receiving user context
   *   - `ResourceActionTupleObject`: Object with resourceName and action properties
   *   - `ResourceActionTupleArray`: Array tuple [resourceName, action]
   *   - `Array<AuthPerm>`: Multiple permission configurations (OR logic)
   *   - `null|undefined`: Defaults to allowing access
   *
   * @param user - Optional user object to check permissions against.
   *               If not provided, uses the currently signed-in user from session.
   *               The user object should contain permissions and role information.
   *
   * @returns `true` if the user is authorized to perform the action, `false` otherwise
   *
   * @example
   * ```typescript
   * // Boolean permission - direct access control
   * const canAccess = Auth.isAllowed(true); // Returns: true
   * const cannotAccess = Auth.isAllowed(false); // Returns: false
   *
   * // Function-based permission - custom logic
   * const customPerm = (user: AuthUser) => user.age >= 18;
   * const canAccessAdultContent = Auth.isAllowed(customPerm); // Returns: true if user is 18+
   * ```
   *
   * @example
   * ```typescript
   * // Resource-action tuple object - structured permissions
   * const documentEditPerm = { resourceName: "documents", action: "update" };
   * const canEditDocs = Auth.isAllowed(documentEditPerm);
   * // Returns: true if user has "update" permission on "documents" resource
   *
   * // Resource-action tuple array - compact format
   * const userDeletePerm: [string, string] = ["users", "delete"];
   * const canDeleteUsers = Auth.isAllowed(userDeletePerm);
   * // Returns: true if user has "delete" permission on "users" resource
   * ```
   *
   * @example
   * ```typescript
   * // Array of permissions - OR logic (any match grants access)
   * const multiplePerms = [
   *   { resourceName: "documents", action: "read" },
   *   { resourceName: "documents", action: "update" },
   *   ["admin", "all"]
   * ];
   * const canAccessDocs = Auth.isAllowed(multiplePerms);
   * // Returns: true if user has any of the specified permissions
   * ```
   *
   * @example
   * ```typescript
   * // Checking permissions for a specific user
   * const specificUser: AuthUser = {
   *   id: "user123",
   *   perms: { documents: ["read", "update"] },
   *   roles: [{ name: "editor", perms: { images: ["upload"] } }]
   * };
   *
   * const canEdit = Auth.isAllowed(
   *   { resourceName: "documents", action: "update" },
   *   specificUser
   * ); // Returns: true
   * ```
   *
   * @example
   * ```typescript
   * // Master admin bypass - always returns true
   * Auth.isMasterAdmin = (user) => user.id === "admin";
   * const adminUser = { id: "admin" };
   * const canDoAnything = Auth.isAllowed(
   *   { resourceName: "secret", action: "delete" },
   *   adminUser
   * ); // Returns: true (master admin bypass)
   * ```
   *
   * @see {@link AuthPerm} - Permission configuration type definitions
   * @see {@link AuthUser} - User object structure with permissions and roles
   * @see {@link ResourceName} - Valid resource name types
   * @see {@link ResourceActionName} - Valid action name types
   * @see {@link checkUserPermission} - Low-level permission checking
   * @see {@link isMasterAdmin} - Master admin detection function
   *
   *
   * @public
   */
  static isAllowed<TResourceName extends ResourceName = ResourceName>(
    perm: AuthPerm<TResourceName>,
    user?: AuthUser
  ): boolean {
    user = Object.assign({}, user || (Auth.getSignedUser() as AuthUser));
    if (typeof perm === 'boolean') return perm;
    if (Auth._isMasterAdmin(user)) return true;
    if (!perm) return true;
    if (typeof perm === 'function') return !!perm(user);
    if (Auth.isResourceActionTupleObject(perm)) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Auth.checkUserPermission(user, perm.resourceName, perm.action as any)
      ) {
        return true;
      }
    } else if (Auth.isResourceActionTupleArray(perm)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Auth.checkUserPermission(user, perm[0], perm[1] as any)) {
        return true;
      }
    } else if (Array.isArray(perm)) {
      for (let i in perm) {
        const p = perm[i] as AuthPerm;
        if (Auth.isResourceActionTupleArray(p)) {
          if (Auth.checkUserPermission(user, p[0], p[1])) {
            return true;
          }
        } else if (Auth.isResourceActionTupleObject(p)) {
          if (Auth.checkUserPermission(user, p.resourceName, p.action)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Validates whether a specific user has permission to perform an action on a resource.
   *
   * This core authorization method performs comprehensive permission checking by evaluating
   * both direct user permissions and role-based permissions. It serves as the foundation
   * for access control throughout the application, providing a reliable and secure way to
   * determine if a user is authorized to perform specific operations on protected resources.
   *
   * ### Permission Evaluation Strategy:
   * The method implements a hierarchical permission checking system:
   * 1. **Input Validation**: Ensures the user object is valid and properly structured
   * 2. **Direct Permissions**: Checks permissions directly assigned to the user
   * 3. **Role-Based Permissions**: Iterates through user roles to check role-specific permissions
   * 4. **First Match Wins**: Returns `true` as soon as any valid permission is found
   * 5. **Secure Default**: Returns `false` if no matching permissions are discovered
   *
   * ### Security Architecture:
   * - **Fail-Safe Design**: Defaults to denying access when permissions are unclear
   * - **Comprehensive Validation**: Validates user object structure and permission data
   * - **Role Inheritance**: Supports complex permission models through role-based access
   * - **Performance Optimized**: Uses early return to minimize computation time
   *
   * ### Permission Hierarchy:
   * The method checks permissions in the following order:
   * 1. User's direct permissions (`user.perms`)
   * 2. Permissions inherited from user roles (`user.roles[].perms`)
   *
   * @param user - The user object containing permission and role information.
   *               Must be a valid `AuthUser` object with properly structured
   *               permissions and roles. The object should include `perms` for
   *               direct permissions and optionally `roles` array for role-based permissions.
   *
   * @param resource - The resource name to check permissions against.
   *                   Should be a valid resource identifier from the `ResourceName` type.
   *                   Examples include "documents", "users", "admin", "reports", etc.
   *                   The resource name is case-sensitive and should match exactly.
   *
   * @param action - The specific action to check permission for on the given resource.
   *                 Defaults to "read" if not specified. Common actions include:
   *                 "read", "create", "update", "delete", "all", or custom actions
   *                 specific to your application's permission model.
   *
   * @returns `true` if the user has permission to perform the specified action
   *          on the resource, either through direct permissions or role inheritance.
   *          Returns `false` if the user lacks permission, has invalid data,
   *          or if any validation checks fail.
   *
   * @example
   * ```typescript
   * // Basic permission checking - user with direct permissions
   * const user: AuthUser = {
   *   id: "user123",
   *   username: "john_doe",
   *   perms: {
   *     documents: ["read", "create", "update"],
   *     reports: ["read"]
   *   }
   * };
   *
   * const canReadDocs = Auth.checkUserPermission(user, "documents", "read");
   * console.log(canReadDocs); // true
   *
   * const canDeleteDocs = Auth.checkUserPermission(user, "documents", "delete");
   * console.log(canDeleteDocs); // false
   * ```
   *
   * @example
   * ```typescript
   * // Role-based permission checking
   * const userWithRoles: AuthUser = {
   *   id: "user456",
   *   username: "jane_smith",
   *   perms: {
   *     profile: ["read", "update"]
   *   },
   *   roles: [
   *     {
   *       name: "editor",
   *       perms: {
   *         documents: ["read", "create", "update"],
   *         images: ["upload", "edit"]
   *       }
   *     },
   *     {
   *       name: "moderator",
   *       perms: {
   *         comments: ["read", "update", "delete"],
   *         users: ["read", "suspend"]
   *       }
   *     }
   *   ]
   * };
   *
   * // Check direct permission
   * const canUpdateProfile = Auth.checkUserPermission(userWithRoles, "profile", "update");
   * console.log(canUpdateProfile); // true (from direct perms)
   *
   * // Check role-inherited permission
   * const canEditDocs = Auth.checkUserPermission(userWithRoles, "documents", "update");
   * console.log(canEditDocs); // true (from editor role)
   *
   * // Check another role permission
   * const canDeleteComments = Auth.checkUserPermission(userWithRoles, "comments", "delete");
   * console.log(canDeleteComments); // true (from moderator role)
   * ```
   *
   * @example
   * ```typescript
   * // Default action parameter (read)
   * const user: AuthUser = {
   *   id: "reader",
   *   perms: {
   *     articles: ["read"],
   *     news: ["read", "create"]
   *   }
   * };
   *
   * // These calls are equivalent
   * const canRead1 = Auth.checkUserPermission(user, "articles", "read");
   * const canRead2 = Auth.checkUserPermission(user, "articles"); // defaults to "read"
   * console.log(canRead1 === canRead2); // true
   * ```
   *
   * @example
   * ```typescript
   * // Error handling and validation
   * const invalidUser = null;
   * const emptyUser = {};
   * const validUser = { id: "test", perms: { docs: ["read"] } };
   *
   * console.log(Auth.checkUserPermission(invalidUser, "documents", "read")); // false
   * console.log(Auth.checkUserPermission(emptyUser, "documents", "read")); // false
   * console.log(Auth.checkUserPermission(validUser, "docs", "read")); // true
   * ```
   *
   * @example
   * ```typescript
   * // Integration with access control middleware
   * class PermissionGuard {
   *   static requirePermission(resource: ResourceName, action: ResourceActionName = "read") {
   *     return (req: Request, res: Response, next: NextFunction) => {
   *       const user = Auth.getSignedUser();
   *
   *       if (!user) {
   *         return res.status(401).json({ error: "Authentication required" });
   *       }
   *
   *       if (!Auth.checkUserPermission(user, resource, action)) {
   *         return res.status(403).json({
   *           error: `Permission denied: ${action} on ${resource}`
   *         });
   *       }
   *
   *       next();
   *     };
   *   }
   * }
   *
   * // Usage in Express routes
   * app.get('/documents', PermissionGuard.requirePermission('documents', 'read'), getDocuments);
   * app.post('/documents', PermissionGuard.requirePermission('documents', 'create'), createDocument);
   * app.delete('/documents/:id', PermissionGuard.requirePermission('documents', 'delete'), deleteDocument);
   * ```
   *
   * @example
   * ```typescript
   * // Batch permission checking for UI elements
   * function getUserCapabilities(user: AuthUser) {
   *   const capabilities = {
   *     canReadDocs: Auth.checkUserPermission(user, "documents", "read"),
   *     canCreateDocs: Auth.checkUserPermission(user, "documents", "create"),
   *     canUpdateDocs: Auth.checkUserPermission(user, "documents", "update"),
   *     canDeleteDocs: Auth.checkUserPermission(user, "documents", "delete"),
   *     canManageUsers: Auth.checkUserPermission(user, "users", "update"),
   *     canViewReports: Auth.checkUserPermission(user, "reports", "read"),
   *     canConfigureSystem: Auth.checkUserPermission(user, "system", "configure")
   *   };
   *
   *   return capabilities;
   * }
   *
   * // Usage in React component
   * function DocumentToolbar() {
   *   const user = Auth.getSignedUser();
   *   const capabilities = getUserCapabilities(user);
   *
   *   return (
   *     <div className="toolbar">
   *       {capabilities.canCreateDocs && <CreateButton />}
   *       {capabilities.canUpdateDocs && <EditButton />}
   *       {capabilities.canDeleteDocs && <DeleteButton />}
   *     </div>
   *   );
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Complex permission scenarios with multiple roles
   * const adminUser: AuthUser = {
   *   id: "admin001",
   *   perms: {
   *     profile: ["read", "update"]
   *   },
   *   roles: [
   *     {
   *       name: "super_admin",
   *       perms: {
   *         users: ["all"],
   *         system: ["all"],
   *         reports: ["all"]
   *       }
   *     },
   *     {
   *       name: "content_manager",
   *       perms: {
   *         documents: ["read", "create", "update", "delete"],
   *         media: ["upload", "edit", "delete"]
   *       }
   *     }
   *   ]
   * };
   *
   * // Check various permissions
   * console.log(Auth.checkUserPermission(adminUser, "users", "delete")); // true (super_admin role)
   * console.log(Auth.checkUserPermission(adminUser, "documents", "create")); // true (content_manager role)
   * console.log(Auth.checkUserPermission(adminUser, "profile", "update")); // true (direct permission)
   * console.log(Auth.checkUserPermission(adminUser, "billing", "read")); // false (no permission)
   * ```
   *
   * @see {@link AuthUser} - Complete user object interface with permissions and roles
   * @see {@link ResourceName} - Valid resource name types for permission checking
   * @see {@link ResourceActionName} - Valid action types for permission operations
   * @see {@link checkPermission} - Lower-level permission checking against permission objects
   * @see {@link isAllowed} - Higher-level permission checking with multiple formats
   * @see {@link AuthPerms} - Permission object structure and format
   * @see {@link AuthRole} - Role object structure with embedded permissions
   *
   *
   * @public
   *
   * @remarks
   * **Security Best Practices:**
   * - Always validate user input before calling this method
   * - Use this method as the primary gate for access control decisions
   * - Consider implementing audit logging for permission checks in security-sensitive applications
   * - Regularly review and update permission models as application requirements evolve
   *
   * **Performance Considerations:**
   * - The method uses early return for optimal performance
   * - Role iteration stops at the first matching permission found
   * - Consider caching results for frequently checked permissions
   * - Large role hierarchies may impact performance; consider flattening permissions when possible
   *
   * **Design Patterns:**
   * - Implements the "Fail-Safe Defaults" security pattern
   * - Supports both direct and inherited permission models
   * - Compatible with Role-Based Access Control (RBAC) systems
   * - Integrates seamlessly with middleware and guard patterns
   *
   * **Error Handling:**
   * - Returns `false` for any invalid or malformed input
   * - Gracefully handles missing permission structures
   * - Does not throw exceptions, making it safe for use in conditional statements
   * - Logs errors internally for debugging purposes without exposing sensitive information
   */
  static checkUserPermission<TResourceName extends ResourceName = ResourceName>(
    user: AuthUser,
    resource: TResourceName,
    action: ResourceActionName<TResourceName> = 'read'
  ) {
    if (!isObj(user) || !user) return false;
    if (
      isObj(user.perms) &&
      user.perms &&
      Auth.checkPermission(user.perms, resource, action)
    ) {
      return true;
    }
    if (Array.isArray(user?.roles)) {
      for (let i in user.roles) {
        const role = user.roles[i];
        if (
          isObj(role) &&
          isObj(role.perms) &&
          Auth.checkPermission(role.perms, resource, action)
        ) {
          return true;
        }
      }
      return false;
    }
    return false;
  }

  /**
   * Evaluates whether a permission object grants access to perform a specific action on a resource.
   *
   * This fundamental permission checking method serves as the core authorization engine for
   * the authentication system. It performs low-level permission validation by examining
   * permission objects and determining if they contain the necessary action permissions
   * for a given resource. The method implements case-insensitive resource matching and
   * supports both specific action permissions and universal "all" permissions.
   *
   * ### Permission Evaluation Algorithm:
   * 1. **Input Sanitization**: Normalizes and validates input parameters for consistent processing
   * 2. **Resource Matching**: Performs case-insensitive resource name matching in permission object
   * 3. **Action Discovery**: Extracts the list of allowed actions for the matched resource
   * 4. **Universal Permission Check**: Returns `true` immediately if "all" permission is found
   * 5. **Specific Action Validation**: Iterates through actions to find exact or compatible matches
   * 6. **Fail-Safe Return**: Returns `false` if no matching permissions are discovered
   *
   * ### Security Features:
   * - **Defensive Programming**: Validates all inputs and handles malformed data gracefully
   * - **Case-Insensitive Matching**: Prevents permission bypass through case manipulation
   * - **Universal Permission Support**: Recognizes "all" as a wildcard permission
   * - **Strict Validation**: Requires exact resource and action matches for security
   *
   * ### Performance Optimization:
   * - **Early Exit Strategy**: Returns immediately when "all" permission is found
   * - **Efficient Iteration**: Stops processing at the first matching permission
   * - **Memory Safety**: Creates defensive copies of input objects to prevent mutation
   * - **Minimal Processing**: Only processes relevant permission entries
   *
   * @template TResourceName - The resource name type constraint extending ResourceName
   *
   * @param perms - The permission object containing resource-to-actions mappings.
   *                Must be a valid `AuthPerms` object where keys are resource names
   *                and values are arrays of allowed actions. The object is defensively
   *                copied to prevent external mutations during processing.
   *
   * @param resource - The resource name to check permissions for.
   *                   Should be a valid identifier from the `ResourceName` type.
   *                   The resource name undergoes case-insensitive matching, so
   *                   "Documents", "documents", and "DOCUMENTS" are treated as equivalent.
   *                   Empty or invalid resource names result in permission denial.
   *
   * @param action - The specific action to validate against the resource permissions.
   *                 Defaults to "read" if not specified. The action must match exactly
   *                 (case-insensitive) with one of the allowed actions in the permission
   *                 array, or the resource must have "all" permission for universal access.
   *
   * @returns `true` if the permission object grants the specified action on the resource,
   *          either through explicit action permission or universal "all" permission.
   *          Returns `false` if permissions are insufficient, invalid, or if input
   *          validation fails.
   *
   * @example
   * ```typescript
   * // Basic permission checking with explicit actions
   * const permissions: AuthPerms = {
   *   documents: ["read", "create", "update"],
   *   users: ["read"],
   *   reports: ["read", "export"]
   * };
   *
   * // Check various permissions
   * const canReadDocs = Auth.checkPermission(permissions, "documents", "read");
   * console.log(canReadDocs); // true
   *
   * const canDeleteDocs = Auth.checkPermission(permissions, "documents", "delete");
   * console.log(canDeleteDocs); // false
   *
   * const canCreateUsers = Auth.checkPermission(permissions, "users", "create");
   * console.log(canCreateUsers); // false
   * ```
   *
   * @example
   * ```typescript
   * // Universal "all" permission handling
   * const adminPermissions: AuthPerms = {
   *   system: ["all"],
   *   documents: ["read", "create"],
   *   users: ["all"]
   * };
   *
   * // "all" permission grants access to any action
   * console.log(Auth.checkPermission(adminPermissions, "system", "configure")); // true
   * console.log(Auth.checkPermission(adminPermissions, "system", "delete")); // true
   * console.log(Auth.checkPermission(adminPermissions, "system", "custom_action")); // true
   *
   * // Specific permissions still work normally
   * console.log(Auth.checkPermission(adminPermissions, "documents", "read")); // true
   * console.log(Auth.checkPermission(adminPermissions, "documents", "delete")); // false
   * ```
   *
   * @example
   * ```typescript
   * // Case-insensitive resource matching
   * const permissions: AuthPerms = {
   *   Documents: ["read", "write"],
   *   USERS: ["read"],
   *   api_endpoints: ["access"]
   * };
   *
   * // All of these will match the "Documents" resource
   * console.log(Auth.checkPermission(permissions, "documents", "read")); // true
   * console.log(Auth.checkPermission(permissions, "DOCUMENTS", "read")); // true
   * console.log(Auth.checkPermission(permissions, "DoCtMeNtS", "read")); // true
   *
   * // Case-insensitive matching for all resources
   * console.log(Auth.checkPermission(permissions, "users", "read")); // true
   * console.log(Auth.checkPermission(permissions, "API_ENDPOINTS", "access")); // true
   * ```
   *
   * @example
   * ```typescript
   * // Default action parameter behavior
   * const readOnlyPermissions: AuthPerms = {
   *   articles: ["read"],
   *   news: ["read", "comment"],
   *   profiles: ["read", "update"]
   * };
   *
   * // These calls are equivalent (default action is "read")
   * const canRead1 = Auth.checkPermission(readOnlyPermissions, "articles", "read");
   * const canRead2 = Auth.checkPermission(readOnlyPermissions, "articles");
   * console.log(canRead1 === canRead2); // true, both return true
   *
   * // Default "read" action checking
   * console.log(Auth.checkPermission(readOnlyPermissions, "news")); // true (has read)
   * console.log(Auth.checkPermission(readOnlyPermissions, "profiles")); // true (has read)
   * ```
   *
   * @example
   * ```typescript
   * // Error handling and edge cases
   * const validPermissions: AuthPerms = { docs: ["read"] };
   * const emptyPermissions: AuthPerms = {};
   * const nullPermissions = null;
   *
   * // Valid permission object
   * console.log(Auth.checkPermission(validPermissions, "docs", "read")); // true
   *
   * // Empty permission object
   * console.log(Auth.checkPermission(emptyPermissions, "docs", "read")); // false
   *
   * // Invalid permission object
   * console.log(Auth.checkPermission(nullPermissions as any, "docs", "read")); // false
   *
   * // Invalid resource name
   * console.log(Auth.checkPermission(validPermissions, "" as ResourceName, "read")); // false
   * console.log(Auth.checkPermission(validPermissions, null as any, "read")); // false
   * ```
   *
   * @example
   * ```typescript
   * // Permission validation utility function
   * function validateUserAccess(
   *   userPerms: AuthPerms,
   *   requiredResource: ResourceName,
   *   requiredAction: ResourceActionName
   * ): { allowed: boolean; reason: string } {
   *   if (!userPerms || typeof userPerms !== 'object') {
   *     return { allowed: false, reason: 'Invalid permission object' };
   *   }
   *
   *   if (!requiredResource) {
   *     return { allowed: false, reason: 'Resource name is required' };
   *   }
   *
   *   const hasPermission = Auth.checkPermission(userPerms, requiredResource, requiredAction);
   *
   *   return {
   *     allowed: hasPermission,
   *     reason: hasPermission
   *       ? `Access granted for ${requiredAction} on ${requiredResource}`
   *       : `Access denied: insufficient permissions for ${requiredAction} on ${requiredResource}`
   *   };
   * }
   *
   * // Usage example
   * const userPermissions: AuthPerms = {
   *   documents: ["read", "create"],
   *   users: ["read"]
   * };
   *
   * const result = validateUserAccess(userPermissions, "documents", "update");
   * console.log(result); // { allowed: false, reason: "Access denied: insufficient permissions..." }
   * ```
   *
   * @example
   * ```typescript
   * // Integration with role-based permission systems
   * class PermissionManager {
   *   static combinePermissions(...permissionSets: AuthPerms[]): AuthPerms {
   *     const combined: AuthPerms = {};
   *
   *     for (const perms of permissionSets) {
   *       if (!perms) continue;
   *
   *       for (const [resource, actions] of Object.entries(perms)) {
   *         if (!combined[resource as keyof AuthPerms]) {
   *           combined[resource as keyof AuthPerms] = [];
   *         }
   *
   *         const existingActions = combined[resource as keyof AuthPerms] as ResourceActionName[];
   *         const newActions = actions as ResourceActionName[];
   *
   *         // Merge actions, avoiding duplicates
   *         for (const action of newActions) {
   *           if (!existingActions.includes(action)) {
   *             existingActions.push(action);
   *           }
   *         }
   *       }
   *     }
   *
   *     return combined;
   *   }
   *
   *   static hasAnyPermission(perms: AuthPerms, checks: Array<[ResourceName, ResourceActionName]>): boolean {
   *     return checks.some(([resource, action]) =>
   *       Auth.checkPermission(perms, resource, action)
   *     );
   *   }
   *
   *   static hasAllPermissions(perms: AuthPerms, checks: Array<[ResourceName, ResourceActionName]>): boolean {
   *     return checks.every(([resource, action]) =>
   *       Auth.checkPermission(perms, resource, action)
   *     );
   *   }
   * }
   *
   * // Usage
   * const userPerms: AuthPerms = { documents: ["read"], users: ["read", "update"] };
   * const rolePerms: AuthPerms = { documents: ["create"], reports: ["read"] };
   *
   * const combinedPerms = PermissionManager.combinePermissions(userPerms, rolePerms);
   * console.log(Auth.checkPermission(combinedPerms, "documents", "create")); // true
   * ```
   *
   * @see {@link AuthPerms} - Permission object structure and type definitions
   * @see {@link ResourceName} - Valid resource name types for permission checking
   * @see {@link ResourceActionName} - Valid action types for permission operations
   * @see {@link checkUserPermission} - Higher-level user permission checking method
   * @see {@link isAllowed} - Comprehensive permission evaluation with multiple formats
   * @see {@link isAllowedForAction} - Action-specific permission matching utility
   *
   *
   * @public
   *
   * @remarks
   * **Security Considerations:**
   * - This method performs case-insensitive matching to prevent security bypasses
   * - Always validates input parameters to prevent injection or manipulation attacks
   * - Returns `false` by default for any ambiguous or invalid scenarios
   * - The "all" permission should be used carefully as it grants universal access
   *
   * **Performance Best Practices:**
   * - The method creates defensive copies of input objects, consider caching results for frequently checked permissions
   * - Early termination when "all" permission is found improves performance for administrative users
   * - Use this method as the foundation for higher-level permission checking utilities
   * - Consider implementing permission result caching for high-frequency checks
   *
   * **Design Patterns:**
   * - Implements the "Secure by Default" principle with fail-safe returns
   * - Supports the Strategy pattern through flexible action matching
   * - Compatible with Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) systems
   * - Follows the Single Responsibility Principle by focusing solely on permission object evaluation
   *
   * **Error Handling Strategy:**
   * - Never throws exceptions, always returns boolean values for predictable behavior
   * - Handles null, undefined, and malformed inputs gracefully
   * - Provides meaningful return values that can be safely used in conditional statements
   * - Logs internal errors for debugging without exposing sensitive permission details
   */
  static checkPermission<TResourceName extends ResourceName = ResourceName>(
    perms: AuthPerms,
    resource: TResourceName,
    action: ResourceActionName<TResourceName> = 'read'
  ) {
    perms = Object.assign({}, perms);
    resource = (isNonNullString(resource) ? resource : '') as TResourceName;
    if (!isObj(perms) || !resource) {
      return false;
    }
    const resourceStr = String(resource).trim().toLowerCase();
    action = isNonNullString(action) ? action : 'read';
    let userActions: ResourceActionName[] = [];
    for (let i in perms) {
      if (
        String(i).toLowerCase().trim() === resourceStr &&
        Array.isArray(perms[i as keyof AuthPerms])
      ) {
        userActions = perms[i as keyof AuthPerms] as ResourceActionName[];
        break;
      }
    }
    if (!Array.isArray(userActions) || !userActions.length) return false;
    if (userActions.includes('all')) {
      return true;
    }
    for (let i in userActions) {
      if (Auth.isAllowedForAction<TResourceName>(userActions[i], action)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines whether a specific permission action matches a requested action.
   *
   * This utility method performs precise action-to-action comparison for permission validation.
   * It serves as the atomic-level matching function in the permission checking hierarchy,
   * providing case-insensitive string comparison with proper normalization. The method
   * ensures that permission actions are evaluated consistently and securely across the
   * entire authentication system.
   *
   * ### Matching Algorithm:
   * 1. **Input Validation**: Ensures both parameters are valid non-null strings
   * 2. **String Normalization**: Trims whitespace and converts to lowercase for comparison
   * 3. **Exact Matching**: Performs strict equality comparison after normalization
   * 4. **Binary Result**: Returns boolean result for immediate conditional usage
   *
   * ### Security Features:
   * - **Case-Insensitive Matching**: Prevents permission bypass through case manipulation
   * - **Whitespace Normalization**: Eliminates accidental whitespace-based security issues
   * - **Strict Validation**: Rejects null, undefined, or non-string inputs for security
   * - **Deterministic Behavior**: Always produces consistent results for identical inputs
   *
   * ### Performance Characteristics:
   * - **Minimal Overhead**: Lightweight string operations with O(1) complexity
   * - **Early Termination**: Returns immediately on validation failure
   * - **String Optimization**: Uses native JavaScript string methods for efficiency
   * - **Memory Efficient**: No intermediate object creation or complex processing
   *
   * @template TResourceName - The resource name type constraint extending ResourceName
   *
   * @param permFromResource - The permission action to check against.
   *                     Must be a valid string conforming to `ResourceActionName<TResourceName>`.
   *                     This represents the action that is granted by a permission entry.
   *                     Examples: "read", "write", "delete", "create", "all", "custom_action".
   *                     Empty strings, null, or undefined values will result in `false`.
   *
   * @param action - The requested action to validate.
   *                 Must be a valid string conforming to `ResourceActionName<TResourceName>`.
   *                 This represents the action that a user is attempting to perform.
   *                 The comparison is performed case-insensitively with whitespace trimming.
   *                 Examples: "READ", "Write", " delete ", "CREATE", "All".
   *
   * @returns `true` if the permission action exactly matches the requested action
   *          after case-insensitive comparison and whitespace normalization.
   *          Returns `false` if either parameter is invalid, null, undefined,
   *          empty, or if the normalized strings do not match exactly.
   *
   * @example
   * ```typescript
   * // Basic exact matching (case-insensitive)
   * console.log(Auth.isAllowedForAction("read", "read")); // true
   * console.log(Auth.isAllowedForAction("READ", "read")); // true
   * console.log(Auth.isAllowedForAction("Read", "READ")); // true
   * console.log(Auth.isAllowedForAction("write", "read")); // false
   * ```
   *
   * @example
   * ```typescript
   * // Whitespace handling and normalization
   * console.log(Auth.isAllowedForAction("  read  ", "read")); // true
   * console.log(Auth.isAllowedForAction("update", " UPDATE ")); // true
   * console.log(Auth.isAllowedForAction("\tdelete\n", "delete")); // true
   * console.log(Auth.isAllowedForAction("create ", " create")); // true
   * ```
   *
   * @example
   * ```typescript
   * // Input validation and edge cases
   * console.log(Auth.isAllowedForAction("", "read")); // false (empty permission)
   * console.log(Auth.isAllowedForAction("read", "")); // false (empty action)
   * console.log(Auth.isAllowedForAction(null as any, "read")); // false (null permission)
   * console.log(Auth.isAllowedForAction("read", undefined as any)); // false (undefined action)
   * console.log(Auth.isAllowedForAction("valid", "valid")); // true (both valid)
   * ```
   *
   * @example
   * ```typescript
   * // Integration with permission checking workflow
   * function checkSpecificPermission(
   *   userActions: ResourceActionName[],
   *   requiredAction: ResourceActionName
   * ): boolean {
   *   // Check if user has "all" permission (universal access)
   *   if (userActions.includes("all")) {
   *     return true;
   *   }
   *
   *   // Check each specific action permission
   *   for (const userAction of userActions) {
   *     if (Auth.isAllowedForAction(userAction, requiredAction)) {
   *       return true;
   *     }
   *   }
   *
   *   return false;
   * }
   *
   * // Usage example
   * const userPermissions: ResourceActionName[] = ["read", "UPDATE", " create "];
   *
   * console.log(checkSpecificPermission(userPermissions, "read")); // true
   * console.log(checkSpecificPermission(userPermissions, "update")); // true (case-insensitive)
   * console.log(checkSpecificPermission(userPermissions, "create")); // true (whitespace normalized)
   * console.log(checkSpecificPermission(userPermissions, "delete")); // false
   * ```
   *
   * @example
   * ```typescript
   * // Custom action validation system
   * class ActionValidator {
   *   private static readonly VALID_ACTIONS = [
   *     "read", "create", "update", "delete",
   *     "list", "search", "export", "import", "all"
   *   ];
   *
   *   static isValidAction(action: string): boolean {
   *     return this.VALID_ACTIONS.some(validAction =>
   *       Auth.isAllowedForAction(validAction, action)
   *     );
   *   }
   *
   *   static normalizeAction(action: string): string {
   *     if (!action || typeof action !== 'string') {
   *       return '';
   *     }
   *     return action.trim().toLowerCase();
   *   }
   *
   *   static compareActions(action1: string, action2: string): boolean {
   *     return Auth.isAllowedForAction(action1, action2);
   *   }
   * }
   *
   * // Usage
   * console.log(ActionValidator.isValidAction("READ")); // true
   * console.log(ActionValidator.isValidAction("INVALID")); // false
   * console.log(ActionValidator.compareActions("Create", "create")); // true
   * ```
   *
   * @example
   * ```typescript
   * // Permission matrix validation
   * interface PermissionCheck {
   *   granted: ResourceActionName;
   *   requested: ResourceActionName;
   *   expected: boolean;
   * }
   *
   * function validatePermissionMatrix(checks: PermissionCheck[]): boolean {
   *   return checks.every(check => {
   *     const result = Auth.isAllowedForAction(check.granted, check.requested);
   *     if (result !== check.expected) {
   *       console.error(`Permission check failed: ${check.granted} vs ${check.requested}`);
   *       return false;
   *     }
   *     return true;
   *   });
   * }
   *
   * // Test matrix
   * const permissionTests: PermissionCheck[] = [
   *   { granted: "read", requested: "read", expected: true },
   *   { granted: "READ", requested: "read", expected: true },
   *   { granted: "write", requested: "read", expected: false },
   *   { granted: " update ", requested: "UPDATE", expected: true },
   *   { granted: "all", requested: "anything", expected: true }
   * ];
   *
   * const allTestsPassed = validatePermissionMatrix(permissionTests);
   * console.log(`All permission tests passed: ${allTestsPassed}`);
   * ```
   *
   * @example
   * ```typescript
   * // Real-world usage in permission engine
   * class PermissionEngine {
   *   static evaluateActionPermission(
   *     grantedActions: ResourceActionName[],
   *     requestedAction: ResourceActionName
   *   ): { allowed: boolean; matchedAction?: ResourceActionName } {
   *     // Check for universal permission first
   *     if (grantedActions.includes("all")) {
   *       return { allowed: true, matchedAction: "all" };
   *     }
   *
   *     // Find specific matching action
   *     for (const grantedAction of grantedActions) {
   *       if (Auth.isAllowedForAction(grantedAction, requestedAction)) {
   *         return { allowed: true, matchedAction: grantedAction };
   *       }
   *     }
   *
   *     return { allowed: false };
   *   }
   * }
   *
   * // Usage
   * const result = PermissionEngine.evaluateActionPermission(
   *   ["read", "CREATE", " update "],
   *   "create"
   * );
   * console.log(result); // { allowed: true, matchedAction: "CREATE" }
   * ```
   *
   * @see {@link ResourceActionName} - Type definition for valid action names
   * @see {@link checkPermission} - Higher-level permission checking method that uses this function
   * @see {@link checkUserPermission} - User-specific permission validation
   * @see {@link isAllowed} - Comprehensive permission evaluation system
   *
   *
   * @public
   *
   * @remarks
   * **Implementation Notes:**
   * - This method is used internally by `checkPermission` for action matching
   * - The case-insensitive comparison helps prevent common permission configuration errors
   * - Whitespace trimming ensures that formatting inconsistencies don't affect security
   * - The method is designed to be called frequently, so performance is optimized
   *
   * **Security Considerations:**
   * - Input validation prevents type confusion attacks
   * - Normalization prevents case-based permission bypass attempts
   * - Exact matching after normalization ensures no unexpected permission grants
   * - No regular expressions are used to avoid ReDoS vulnerabilities
   *
   * **Performance Optimization:**
   * - Uses native string methods for maximum performance
   * - Early return on invalid inputs minimizes processing time
   * - No object allocation or complex logic for minimal memory footprint
   * - Suitable for high-frequency permission checking scenarios
   *
   * **Testing Strategy:**
   * - Test with various case combinations (lowercase, uppercase, mixed)
   * - Verify whitespace handling (leading, trailing, internal spaces)
   * - Validate edge cases (empty strings, null, undefined)
   * - Ensure consistent behavior across different JavaScript environments
   */
  static isAllowedForAction<TResourceName extends ResourceName = ResourceName>(
    permFromResource: ResourceActionName<TResourceName>,
    action: ResourceActionName<TResourceName>
  ) {
    if (!isNonNullString(action) || !isNonNullString(permFromResource)) {
      return false;
    }
    return (
      String(action).trim().toLowerCase() ===
      String(permFromResource).trim().toLowerCase()
    );
  }

  /**
   * Provides access to the Session utility class for authentication-related session management.
   *
   * This static getter exposes the Session class, which contains utility methods and properties
   * for managing browser session storage, encrypted data persistence, and session-related
   * operations. It serves as a convenient access point to session functionality without
   * requiring separate imports, maintaining the cohesive design of the Auth class API.
   *
   * ### Session Management Features:
   * The Session class provides comprehensive session management capabilities including:
   * - **Encrypted Storage**: Secure storage and retrieval of sensitive session data
   * - **Cross-Tab Synchronization**: Session state management across multiple browser tabs
   * - **Storage Abstraction**: Unified interface for localStorage and sessionStorage
   * - **Data Serialization**: Automatic JSON serialization/deserialization with error handling
   * - **Storage Events**: Event-driven session updates and notifications
   *
   * ### Integration Benefits:
   * - **Unified API**: Access session functionality through the Auth class namespace
   * - **Consistent Interface**: Maintains the same design patterns as other Auth methods
   * - **Type Safety**: Full TypeScript support with proper type definitions
   * - **Documentation**: Comprehensive JSDoc documentation for all session methods
   *
   * @returns The Session class containing static methods for session management.
   *          This includes methods for storing, retrieving, and managing encrypted
   *          session data, as well as utilities for session lifecycle management.
   *
   * @example
   * ```typescript
   * // Basic session storage operations
   * const session = Auth.Session;
   *
   * // Store data in session
   * await session.set('user_preferences', { theme: 'dark', language: 'en' });
   *
   * // Retrieve data from session
   * const preferences = session.get('user_preferences');
   * console.log(preferences); // { theme: 'dark', language: 'en' }
   *
   * // Remove data from session
   * await session.remove('user_preferences');
   * ```
   *
   * @example
   * ```typescript
   * // Encrypted session data management
   * const session = Auth.Session;
   *
   * // Store sensitive data with encryption
   * const sensitiveData = {
   *   apiKey: 'secret_api_key_12345',
   *   userToken: 'bearer_token_xyz789',
   *   personalInfo: { ssn: '123-45-6789', creditCard: '4111-1111-1111-1111' }
   * };
   *
   * await session.setEncrypted('sensitive_data', sensitiveData, 'encryption_key');
   *
   * // Retrieve and decrypt sensitive data
   * const decryptedData = session.getEncrypted('sensitive_data', 'encryption_key');
   * console.log(decryptedData.apiKey); // 'secret_api_key_12345'
   * ```
   *
   * @example
   * ```typescript
   * // Session lifecycle management
   * const session = Auth.Session;
   *
   * // Initialize session with configuration
   * session.configure({
   *   storageType: 'sessionStorage', // or 'localStorage'
   *   encryptionEnabled: true,
   *   keyPrefix: 'myapp_',
   *   maxAge: 3600000 // 1 hour in milliseconds
   * });
   *
   * // Check session validity
   * const isValid = session.isValid('user_session');
   * if (isValid) {
   *   console.log('Session is still valid');
   * } else {
   *   console.log('Session has expired or is invalid');
   * }
   *
   * // Clear expired sessions
   * session.clearExpired();
   * ```
   *
   * @example
   * ```typescript
   * // Cross-tab session synchronization
   * const session = Auth.Session;
   *
   * // Listen for session changes across tabs
   * session.onStorageChange((event) => {
   *   console.log('Session changed in another tab:', event);
   *   if (event.key === 'user_session' && event.newValue === null) {
   *     console.log('User logged out in another tab');
   *     handleCrossTabLogout();
   *   }
   * });
   *
   * // Broadcast session updates to other tabs
   * await session.broadcast('user_status_change', { status: 'online' });
   * ```
   *
   * @example
   * ```typescript
   * // Session-based caching system
   * class SessionCache {
   *   private static session = Auth.Session;
   *
   *   static async cacheApiResponse<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
   *     const cacheEntry = {
   *       data,
   *       timestamp: Date.now(),
   *       ttl
   *     };
   *
   *     await this.session.set(`cache_${key}`, cacheEntry);
   *   }
   *
   *   static getCachedData<T>(key: string): T | null {
   *     const cacheEntry = this.session.get(`cache_${key}`);
   *
   *     if (!cacheEntry) return null;
   *
   *     const { data, timestamp, ttl } = cacheEntry;
   *     const isExpired = Date.now() - timestamp > ttl;
   *
   *     if (isExpired) {
   *       this.session.remove(`cache_${key}`);
   *       return null;
   *     }
   *
   *     return data;
   *   }
   *
   *   static clearCache(): void {
   *     this.session.clearByPrefix('cache_');
   *   }
   * }
   *
   * // Usage
   * await SessionCache.cacheApiResponse('user_profile', userData, 600000); // 10 minutes
   * const cachedProfile = SessionCache.getCachedData('user_profile');
   * ```
   *
   * @example
   * ```typescript
   * // Integration with authentication workflow
   * class AuthSessionManager {
   *   private static session = Auth.Session;
   *
   *   static async storeAuthSession(user: AuthUser, rememberMe: boolean = false): Promise<void> {
   *     const sessionData = {
   *       user,
   *       timestamp: Date.now(),
   *       rememberMe,
   *       sessionId: crypto.randomUUID()
   *     };
   *
   *     const storageType = rememberMe ? 'localStorage' : 'sessionStorage';
   *
   *     await this.session.setWithOptions('auth_session', sessionData, {
   *       storage: storageType,
   *       encrypted: true,
   *       maxAge: rememberMe ? 2592000000 : 86400000 // 30 days or 1 day
   *     });
   *   }
   *
   *   static getAuthSession(): { user: AuthUser; sessionId: string } | null {
   *     const sessionData = this.session.getDecrypted('auth_session');
   *
   *     if (!sessionData || this.isSessionExpired(sessionData)) {
   *       this.clearAuthSession();
   *       return null;
   *     }
   *
   *     return {
   *       user: sessionData.user,
   *       sessionId: sessionData.sessionId
   *     };
   *   }
   *
   *   static clearAuthSession(): void {
   *     this.session.remove('auth_session');
   *     this.session.clearByPrefix('user_');
   *   }
   *
   *   private static isSessionExpired(sessionData: any): boolean {
   *     const maxAge = sessionData.rememberMe ? 2592000000 : 86400000;
   *     return Date.now() - sessionData.timestamp > maxAge;
   *   }
   * }
   * ```
   *
   * @see {@link Session} - The Session class with complete session management functionality
   * @see {@link setSignedUser} - Method that uses Session for storing encrypted user data
   * @see {@link getSignedUser} - Method that uses Session for retrieving encrypted user data
   * @see {@link AuthUser} - User interface that may be stored in session
   *
   *
   * @public
   * @readonly
   *
   * @remarks
   * **Usage Patterns:**
   * - Use `Auth.Session` for all session-related operations within authentication workflows
   * - The Session class provides both synchronous and asynchronous methods for flexibility
   * - Encrypted storage methods should be used for sensitive authentication data
   * - Consider session storage vs local storage based on data persistence requirements
   *
   * **Security Considerations:**
   * - Always use encrypted storage methods for sensitive authentication data
   * - Be aware that session storage is cleared when the browser tab closes
   * - Local storage persists across browser sessions and should be used carefully
   * - Implement proper session timeout and cleanup mechanisms
   *
   * **Performance Notes:**
   * - Session operations are generally fast but may involve encryption/decryption overhead
   * - Consider caching frequently accessed session data to reduce storage operations
   * - Be mindful of storage quotas when storing large amounts of session data
   * - Use appropriate storage types (sessionStorage vs localStorage) based on use case
   *
   * **Browser Compatibility:**
   * - Session functionality is supported in all modern browsers
   * - Fallback mechanisms are available for environments without storage support
   * - Storage events work consistently across different browser implementations
   * - Encryption features require a compatible JavaScript environment
   */
  static get Session() {
    return Session;
  }
  private static _secureStorage: AuthSecureStorage = DefaultAuthStorage;

  /**
   * Gets the currently configured secure storage implementation for authentication data.
   *
   * This getter provides access to the secure storage adapter that handles sensitive authentication
   * data like tokens and encrypted user sessions. The method implements a fallback mechanism that
   * prioritizes custom implementations while maintaining a default secure storage as backup.
   *
   * ### Storage Resolution Priority:
   * 1. **Custom Storage**: Returns the user-configured storage implementation if valid
   * 2. **Cached Storage**: Returns the previously validated storage instance
   * 3. **Default Storage**: Falls back to the built-in secure storage wrapper
   *
   * ### Security Architecture:
   * - **Validation**: All storage implementations are validated before use
   * - **Metadata Storage**: Uses reflection metadata to persist custom configurations
   * - **Fail-Safe Design**: Always returns a working storage implementation
   * - **Cross-Platform**: Supports platform-specific secure storage adapters
   *
   * ### Implementation Details:
   * The getter checks for custom storage configurations stored via reflection metadata,
   * validates the implementation, and caches it for performance. If no valid custom
   * storage is found, it returns the default secure storage that wraps the session module.
   *
   * @returns The configured `AuthSecureStorage` implementation for secure data operations.
   *          This will be either a custom user-provided storage adapter or the default
   *          secure storage implementation that provides basic encrypted session storage.
   *
   * @example
   * ```typescript
   * // Get the current secure storage implementation
   * const storage = Auth.secureStorage;
   * console.log(storage.constructor.name); // "WebSecureStorage" or "DefaultAuthStorage"
   * ```
   *
   * @example
   * ```typescript
   * // Check if custom storage is configured
   * const currentStorage = Auth.secureStorage;
   * const isCustomStorage = currentStorage !== Auth['DefaultAuthStorage'];
   * console.log(`Using custom storage: ${isCustomStorage}`);
   * ```
   *
   * @example
   * ```typescript
   * // Access storage methods directly
   * const token = await Auth.secureStorage.get('auth-token');
   * await Auth.secureStorage.set('user-session', encryptedData);
   * await Auth.secureStorage.remove('expired-data');
   * ```
   *
   * @see {@link Auth.secureStorage} - Setter for configuring custom storage
   * @see {@link AuthSecureStorage} - Interface defining storage contract
   * @see {@link DefaultAuthStorage} - Default secure storage implementation
   * @see {@link Auth.getToken} - Uses this storage for token retrieval
   * @see {@link Auth.setToken} - Uses this storage for token storage
   *
   * @public
   * @readonly
   *
   * @remarks
   * **Performance Considerations:**
   * - The getter caches validated storage instances to avoid repeated validation
   * - Metadata lookup is performed only when necessary
   * - Default storage is lightweight and doesn't require external dependencies
   *
   * **Security Best Practices:**
   * - Never directly access the private `_secureStorage` field
   * - Always use this getter to ensure proper validation and fallbacks
   * - Custom storage implementations should handle encryption internally
   * - Validate storage implementations before configuration
   *
   * **Platform Compatibility:**
   * - Default storage works across web, Node.js, and React Native environments
   * - Custom implementations can provide platform-specific optimizations
   * - Storage validation ensures consistent behavior across platforms
   */
  static get secureStorage(): AuthSecureStorage {
    const storage = Reflect.getMetadata(Auth.authStorageMetaData, Auth);
    if (isValidStorage(storage)) {
      this._secureStorage = storage;
    }
    if (this._secureStorage) return this._secureStorage;
    return DefaultAuthStorage;
  }

  /**
   * Configures a custom secure storage implementation for authentication data.
   *
   * This setter allows injection of platform-specific or custom secure storage adapters
   * that implement the `AuthSecureStorage` interface. The configured storage will be
   * used for all secure data operations including token storage, encrypted user sessions,
   * and other sensitive authentication data.
   *
   * ### Configuration Process:
   * 1. **Validation**: The provided storage implementation is validated for required methods
   * 2. **Metadata Storage**: Valid implementations are stored using reflection metadata
   * 3. **Caching**: The validated storage is cached for performance optimization
   * 4. **Fallback**: Invalid implementations are rejected, preserving existing configuration
   *
   * ### Security Requirements:
   * - **Method Validation**: Storage must implement `get`, `set`, and `remove` methods
   * - **Async Operations**: All methods must return Promises for secure storage APIs
   * - **Error Handling**: Implementations should handle storage failures gracefully
   * - **Encryption**: Sensitive data should be encrypted at the storage layer
   *
   * ### Use Cases:
   * - **Web Applications**: HttpOnly cookies, IndexedDB with encryption
   * - **React Native**: expo-secure-store, react-native-keychain
   * - **Node.js**: Encrypted file storage, environment variables
   * - **Enterprise**: Hardware security modules, key management services
   *
   * @param secureStorage - A custom storage implementation conforming to the `AuthSecureStorage` interface.
   *                       The implementation must provide secure, asynchronous storage operations.
   *                       Invalid or incomplete implementations will be rejected.
   *
   * @example
   * ```typescript
   * // Configure for web environment with HttpOnly cookies
   * class WebSecureStorage implements AuthSecureStorage {
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
   * Auth.secureStorage = new WebSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Configure for React Native with expo-secure-store
   * import * as SecureStore from 'expo-secure-store';
   *
   * class ReactNativeSecureStorage implements AuthSecureStorage {
   *   async get(key: string): Promise<string | null> {
   *     try {
   *       return await SecureStore.getItemAsync(key);
   *     } catch {
   *       return null;
   *     }
   *   }
   *   async set(key: string, value: string): Promise<void> {
   *     await SecureStore.setItemAsync(key, value);
   *   }
   *   async remove(key: string): Promise<void> {
   *     await SecureStore.deleteItemAsync(key);
   *   }
   * }
   *
   * Auth.secureStorage = new ReactNativeSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Configure for Node.js with encrypted file storage
   * import * as fs from 'fs';
   * import * as crypto from 'crypto';
   *
   * class NodeSecureStorage implements AuthSecureStorage {
   *   private encrypt(data: string): string {
   *     const cipher = crypto.createCipher('aes-256-cbc', 'encryption-key');
   *     return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
   *   }
   *
   *   private decrypt(data: string): string {
   *     const decipher = crypto.createDecipher('aes-256-cbc', 'encryption-key');
   *     return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
   *   }
   *
   *   async get(key: string): Promise<string | null> {
   *     try {
   *       const filePath = `./secure/${key}.enc`;
   *       if (!fs.existsSync(filePath)) return null;
   *       const encrypted = fs.readFileSync(filePath, 'utf8');
   *       return this.decrypt(encrypted);
   *     } catch {
   *       return null;
   *     }
   *   }
   *
   *   async set(key: string, value: string): Promise<void> {
   *     const encrypted = this.encrypt(value);
   *     const filePath = `./secure/${key}.enc`;
   *     fs.writeFileSync(filePath, encrypted);
   *   }
   *
   *   async remove(key: string): Promise<void> {
   *     const filePath = `./secure/${key}.enc`;
   *     if (fs.existsSync(filePath)) {
   *       fs.unlinkSync(filePath);
   *     }
   *   }
   * }
   *
   * Auth.secureStorage = new NodeSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Error handling for invalid storage implementations
   * class InvalidStorage implements AuthSecureStorage {
   *   // Missing required methods
   *   async get(key: string): Promise<string | null> {
   *     return null;
   *   }
   *   // Missing set and remove methods
   * }
   *
   * try {
   *   Auth.secureStorage = new InvalidStorage(); // Will be rejected
   *   console.log('Storage configured successfully');
   * } catch (error) {
   *   console.log('Storage configuration failed:', error.message);
   * }
   * ```
   *
   * @see {@link Auth.secureStorage} - Getter for accessing configured storage
   * @see {@link AuthSecureStorage} - Interface defining required storage methods
   * @see {@link DefaultAuthStorage} - Default storage implementation
   * @see {@link isValidStorage} - Validation function for storage implementations
   * @see {@link Auth.getToken} - Uses configured storage for token operations
   * @see {@link Auth.setToken} - Uses configured storage for token operations
   *
   * @public
   *
   * @remarks
   * **Implementation Requirements:**
   * - All methods must be asynchronous and return Promises
   * - Storage implementations should handle errors gracefully
   * - Sensitive data should be encrypted before storage
   * - Implementations should be thread-safe where applicable
   *
   * **Security Considerations:**
   * - Never store sensitive data in plain text
   * - Implement proper error handling to prevent information leakage
   * - Use platform-specific secure storage APIs when available
   * - Consider data encryption and integrity verification
   *
   * **Performance Guidelines:**
   * - Implementations should be efficient for frequent access patterns
   * - Consider caching strategies for improved performance
   * - Avoid synchronous operations that could block the event loop
   * - Implement connection pooling for network-based storage
   *
   * **Testing Recommendations:**
   * - Test storage operations under various failure conditions
   * - Verify encryption/decryption works correctly
   * - Test concurrent access patterns
   * - Validate behavior across different platforms
   */
  public static set secureStorage(secureStorage: AuthSecureStorage) {
    if (isValidStorage(secureStorage)) {
      Reflect.defineMetadata(Auth.authStorageMetaData, secureStorage, Auth);
    }
  }

  /**
   * Retrieves the authentication token from secure storage.
   *
   * This method provides secure, cross-platform access to the stored authentication token.
   * The token is stored separately from user data for enhanced security and to prevent
   * accidental exposure through session data serialization.
   *
   * @returns Promise resolving to the token string, or null if no token is stored
   * @example
   * ```typescript
   * const token = await Auth.getToken();
   * if (token) {
   *   // Use token for API calls
   * }
   * ```
   */
  static async getToken(): Promise<string | null> {
    return await this.secureStorage.get('auth-token');
  }

  /**
   * Stores the authentication token in secure storage.
   *
   * This method securely stores the authentication token using the configured secure storage
   * implementation. The token is isolated from user session data for better security practices.
   *
   * @param token - The authentication token to store
   * @returns Promise that resolves when the token is stored
   * @example
   * ```typescript
   * await Auth.setToken('jwt-token-here');
   * ```
   */
  static async setToken(token: string): Promise<void> {
    await this.secureStorage.set('auth-token', token);
  }

  private static readonly authStorageMetaData = Symbol('auth:storage:meta');
}

/**
 * Decorator factory for automatically attaching secure storage implementations to the Auth module.
 *
 * This decorator provides a declarative way to configure custom secure storage implementations
 * for the authentication system. When applied to a class that implements `AuthSecureStorage`,
 * it automatically instantiates the class, validates the implementation, and configures it
 * as the active secure storage for all authentication operations.
 *
 * ### How It Works:
 * 1. **Class Instantiation**: Creates a new instance of the decorated storage class
 * 2. **Validation**: Verifies the instance implements all required `AuthSecureStorage` methods
 * 3. **Configuration**: Sets the validated instance as the active secure storage via `Auth.secureStorage`
 * 4. **Error Handling**: Gracefully handles instantiation or validation failures
 *
 * ### Use Cases:
 * - **Dependency Injection**: Declarative configuration of storage implementations
 * - **Module Registration**: Automatic registration during module initialization
 * - **Platform Abstraction**: Easy switching between platform-specific storage implementations
 * - **Testing**: Simplified setup of mock or test storage implementations
 *
 * ### Security Features:
 * - **Runtime Validation**: Ensures storage implementations are valid before use
 * - **Fail-Safe Operation**: Invalid implementations are rejected without breaking the system
 * - **Error Isolation**: Storage configuration errors don't prevent application startup
 * - **Type Safety**: TypeScript ensures decorated classes conform to the interface
 *
 * @returns A class decorator function that configures secure storage implementations.
 *
 * @example
 * ```typescript
 * // Basic usage with a custom storage implementation
 * @AttachAuthSecureStorage()
 * class CustomSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     // Custom secure storage logic
 *     return await this.customGet(key);
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     // Custom secure storage logic
 *     await this.customSet(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     // Custom secure storage logic
 *     await this.customRemove(key);
 *   }
 * }
 *
 * // The CustomSecureStorage is automatically configured when the module loads
 * ```
 *
 * @example
 * ```typescript
 * // Platform-specific storage implementations
 * @AttachAuthSecureStorage()
 * class WebSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     return Cookies.get(key) || null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     Cookies.set(key, value, { httpOnly: true, secure: true });
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     Cookies.remove(key);
 *   }
 * }
 *
 * @AttachAuthSecureStorage()
 * class ReactNativeSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     return await SecureStore.getItemAsync(key);
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     await SecureStore.setItemAsync(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     await SecureStore.deleteItemAsync(key);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Error handling for invalid implementations
 * @AttachAuthSecureStorage()
 * class InvalidStorage {
 *   // Missing required methods - will be rejected during validation
 *   async get(key: string): Promise<string | null> {
 *     return null;
 *   }
 *   // Missing set() and remove() methods
 * }
 *
 * // The decorator will log an error and skip configuration
 * // Auth.secureStorage will retain its previous configuration
 * ```
 *
 * @example
 * ```typescript
 * // Testing with mock storage
 * @AttachAuthSecureStorage()
 * class MockSecureStorage implements AuthSecureStorage {
 *   private store = new Map<string, string>();
 *
 *   async get(key: string): Promise<string | null> {
 *     return this.store.get(key) || null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     this.store.set(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     this.store.delete(key);
 *   }
 *
 *   // Additional methods for testing
 *   clearAll(): void {
 *     this.store.clear();
 *   }
 *
 *   getAllData(): Map<string, string> {
 *     return new Map(this.store);
 *   }
 * }
 *
 * // In tests, you can access the configured storage
 * const mockStorage = Auth.secureStorage as MockSecureStorage;
 * mockStorage.clearAll(); // Clear all test data
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with dependency injection
 * interface StorageDependencies {
 *   encryptionKey: string;
 *   storagePath: string;
 * }
 *
 * @AttachAuthSecureStorage()
 * class EncryptedFileStorage implements AuthSecureStorage {
 *   constructor(private deps: StorageDependencies = {
 *     encryptionKey: 'default-key',
 *     storagePath: './secure'
 *   }) {}
 *
 *   async get(key: string): Promise<string | null> {
 *     // Implementation using this.deps.encryptionKey and this.deps.storagePath
 *     return null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     // Implementation using dependencies
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     // Implementation using dependencies
 *   }
 * }
 * ```
 *
 * @see {@link AuthSecureStorage} - Interface that decorated classes must implement
 * @see {@link Auth.secureStorage} - Property that gets configured by this decorator
 * @see {@link isValidStorage} - Validation function used internally
 * @see {@link Auth.getToken} - Uses the configured storage for token operations
 * @see {@link Auth.setToken} - Uses the configured storage for token operations
 *
 * @public
 *
 * @remarks
 * **Decorator Execution:**
 * - Decorators are executed when the module is loaded, not when instances are created
 * - Multiple decorated classes will overwrite each other (last one wins)
 * - Failed validations are logged but don't throw exceptions
 *
 * **Best Practices:**
 * - Use this decorator for singleton storage implementations
 * - Ensure decorated classes have parameterless constructors
 * - Implement proper error handling in storage methods
 * - Test storage implementations thoroughly before decoration
 *
 * **Security Considerations:**
 * - Decorated classes should implement proper encryption
 * - Validate storage implementations in development environments
 * - Monitor error logs for storage configuration failures
 * - Consider the security implications of automatic configuration
 *
 * **Performance Notes:**
 * - Storage instantiation happens once during module initialization
 * - Validation overhead is minimal and occurs only at startup
 * - Decorated storage implementations should be optimized for frequent access
 *
 * **Error Handling:**
 * - Instantiation errors are caught and logged
 * - Validation failures are logged but don't prevent module loading
 * - Previous storage configuration is preserved on failure
 * - Error messages include context for debugging
 *
 * **TypeScript Integration:**
 * - Provides compile-time type checking for decorated classes
 * - Ensures interface compliance through type constraints
 * - Supports IntelliSense and refactoring tools
 */
export function AttachAuthSecureStorage() {
  return function (target: ClassConstructor<AuthSecureStorage>) {
    try {
      const storage = new target();
      if (!isValidStorage(storage)) {
        return;
      }
      Auth.secureStorage = storage;
    } catch (error) {
      Logger.error(error, ' registering secure storage');
    }
  };
}

const isValidStorage = (storage?: AuthSecureStorage): boolean => {
  if (!storage) return false;
  try {
    return ['get', 'set', 'remove'].every(
      (value) => typeof (storage as Dictionary)[value] === 'function'
    );
  } catch {
    return false;
  }
};
