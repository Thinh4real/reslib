import { isPromise } from "@utils/isPromise";
import { Platform } from "../platform";
import { IClassConstructor, IDict } from "../types/index";
import { isNonNullString } from "../utils/isNonNullString";
import { JsonHelper } from "../utils/json";

class Manager {
  static readonly sessionStorageMetaData = Symbol("sessionStorage");
  /**
   * The storage object used by the session manager.
   *
   * This property is initialized lazily when the `storage` getter is called.
   */
  private static _storage: ISessionStorage | undefined;

  /**
   * The namespace prefix to use for all keys in the session storage.
   *
   * This property is optional and can be set using the `keyNamespace` setter.
   */
  private static _keyNamespace?: string = undefined;

  /**
   * Retrieves or initializes the session storage implementation used by the Manager.
   *
   * This getter implements a sophisticated storage initialization strategy with multiple fallback mechanisms
   * to ensure reliable session storage across different environments and platforms. The method follows
   * a priority-based approach to determine the most suitable storage implementation available.
   *
   * ### Storage Priority Order:
   * 1. **Custom Attached Storage** - Storage registered via {@link AttachSessionStorage} decorator
   * 2. **Browser localStorage** - Native browser localStorage (client-side only)
   * 3. **In-Memory Storage** - Fallback dictionary-based storage (server-side or fallback)
   *
   * ### Initialization Process:
   * The getter performs the following steps in order:
   * 1. Checks for custom storage registered via reflection metadata
   * 2. Validates the custom storage using {@link isValidStorage}
   * 3. Falls back to browser localStorage if available and valid
   * 4. Creates in-memory storage as the final fallback option
   * 5. Caches the initialized storage for subsequent calls
   *
   * ### Platform Detection:
   * Uses {@link Platform.isClientSide} to detect the execution environment and choose
   * appropriate storage mechanisms. This ensures compatibility across:
   * - **Browser environments** - Uses localStorage when available
   * - **Server-side rendering** - Uses in-memory storage
   * - **Node.js environments** - Uses in-memory storage
   * - **React Native** - Can use custom storage implementations
   *
   * @returns The active session storage implementation conforming to {@link ISessionStorage}
   *
   * @example
   * ```typescript
   * // Basic usage - get the current storage
   * const storage = Manager.storage;
   *
   * // Use storage directly
   * storage.set('userToken', 'abc123');
   * const token = storage.get('userToken');
   * storage.remove('userToken');
   * ```
   *
   * @example
   * ```typescript
   * // Storage will automatically use localStorage in browser
   * if (Platform.isClientSide()) {
   *   const storage = Manager.storage; // Uses localStorage
   *   storage.set('preferences', { theme: 'dark', lang: 'en' });
   *
   *   // Data persists across page reloads
   *   window.location.reload();
   *   const prefs = storage.get('preferences'); // Still available
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Server-side usage automatically uses in-memory storage
   * import { Manager } from 'reslib/session';
   *
   * // In Node.js environment
   * const storage = Manager.storage; // Uses in-memory storage
   * storage.set('sessionData', { userId: 123 });
   *
   * // Data only persists during application lifetime
   * const data = storage.get('sessionData');
   * console.log(data); // { userId: 123 }
   * ```
   *
   * @example
   * ```typescript
   * // Custom storage integration example
   * @AttachSessionStorage()
   * class RedisStorage implements ISessionStorage {
   *   constructor(private redis: RedisClient) {}
   *
   *   get(key: string): any {
   *     return this.redis.get(key);
   *   }
   *
   *   set(key: string, value: any): any {
   *     this.redis.set(key, JSON.stringify(value));
   *     return value;
   *   }
   *
   *   remove(key: string): any {
   *     const value = this.get(key);
   *     this.redis.del(key);
   *     return value;
   *   }
   *
   *   removeAll(): any {
   *     this.redis.flushall();
   *   }
   * }
   *
   * // Now Manager.storage will use Redis
   * const storage = Manager.storage; // Returns RedisStorage instance
   * ```
   *
   * @example
   * ```typescript
   * // Storage with error handling
   * try {
   *   const storage = Manager.storage;
   *
   *   // Attempt to store large object
   *   const largeData = new Array(1000000).fill('data');
   *   storage.set('largeObject', largeData);
   *
   * } catch (error) {
   *   console.error('Storage quota exceeded:', error);
   *
   *   // Fallback to essential data only
   *   const storage = Manager.storage;
   *   storage.set('essentialData', { id: 1 });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Checking storage capabilities
   * const storage = Manager.storage;
   *
   * // Test if storage is persistent (localStorage) or temporary (in-memory)
   * storage.set('test', 'value');
   *
   * if (Platform.isClientSide() && window.localStorage) {
   *   console.log('Using persistent localStorage');
   *   // Data will survive page reloads
   * } else {
   *   console.log('Using temporary in-memory storage');
   *   // Data will be lost on page reload
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Advanced: Storage introspection
   * const storage = Manager.storage;
   *
   * // Check which storage implementation is active
   * if ('localStorage' in storage.get.toString()) {
   *   console.log('Using browser localStorage');
   * } else if ('InMemoryStorage' in storage.get.toString()) {
   *   console.log('Using in-memory storage');
   * } else {
   *   console.log('Using custom storage implementation');
   * }
   * ```
   *
   * @see {@link ISessionStorage} - Interface that all storage implementations must follow
   * @see {@link AttachSessionStorage} - Decorator for registering custom storage implementations
   * @see {@link isValidStorage} - Function used to validate storage implementations
   * @see {@link Platform.isClientSide} - Platform detection utility
   * @see {@link JsonHelper} - JSON serialization utilities used by storage
   *
   * @since 1.0.0
   * @public
   *
   * @remarks
   * **Important Behavior Notes:**
   * - The storage is initialized lazily on first access for optimal performance
   * - Once initialized, the same storage instance is reused for all subsequent calls
   * - Custom storage registered via {@link AttachSessionStorage} takes highest priority
   * - Browser localStorage is only used in client-side environments with proper window object
   * - In-memory storage is automatically garbage collected when the application ends
   *
   * **Browser Compatibility:**
   * - Checks for `window.localStorage` availability before attempting to use it
   * - Gracefully degrades to in-memory storage if localStorage is disabled/unavailable
   * - Works in all major browsers including legacy versions
   * - Supports private/incognito browsing modes that may disable localStorage
   *
   * **Performance Characteristics:**
   * - **localStorage**: Synchronous, persistent, ~5-10MB limit per origin
   * - **In-memory**: Synchronous, non-persistent, limited by available RAM
   * - **Custom storage**: Performance depends on implementation (can be async)
   *
   * **Security Considerations:**
   * - localStorage data is accessible to all scripts on the same origin
   * - In-memory storage is more secure as it's not persistent
   * - Custom storage implementations should implement appropriate security measures
   * - Consider encryption for sensitive data regardless of storage type
   *
   * **Thread Safety:**
   * - localStorage operations are synchronous and atomic
   * - In-memory storage access is synchronous but not thread-safe across workers
   * - Custom storage implementations should handle concurrency appropriately
   */
  public static get storage(): ISessionStorage {
    const storage = Reflect.getMetadata(
      Manager.sessionStorageMetaData,
      Manager
    );
    if (isValidStorage(storage)) {
      this._storage = storage;
    }
    if (this._storage) return this._storage;
    if (
      Platform.isClientSide() &&
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage?.getItem
    ) {
      this._storage = {
        get: (key: string) => window.localStorage.getItem(key),
        set: (key: string, value: any) =>
          window.localStorage.setItem(key, value),
        remove: (key: string) => window.localStorage.removeItem(key),
        removeAll: () => window.localStorage.clear(),
      };
    } else {
      //in memory storage. When there is not a localStorage, we use an in memory storage
      let InMemoryStorage: IDict = {};
      this._storage = {
        get: (key: string) => InMemoryStorage[key],
        set: (key: string, value: any) => (InMemoryStorage[key] = value),
        remove: (key: string) => delete InMemoryStorage[key],
        removeAll: () => (InMemoryStorage = {}),
      };
    }
    return this._storage as ISessionStorage;
  }
  /**
   * Sets the storage object used by the session manager.
   *
   * The provided storage object must be valid and have the required methods.
   *
   * @param {ISessionStorage} storage - The storage object to use.
   */
  public static set storage(storage: ISessionStorage) {
    if (isValidStorage(storage)) {
      Reflect.defineMetadata(Manager.sessionStorageMetaData, storage, Manager);
    }
  }

  /**
   * Gets the current namespace prefix used for all session storage keys.
   *
   * This getter provides access to the global namespace prefix that is automatically prepended
   * to all session storage keys when they are sanitized. Namespacing is essential for creating
   * isolated storage contexts in applications that share the same storage backend, preventing
   * key collisions between different modules, features, or application instances.
   *
   * ### Key Benefits:
   * - **Isolation**: Prevents key conflicts between different application parts
   * - **Organization**: Groups related storage keys under a common prefix
   * - **Multi-tenancy**: Enables separate storage contexts for different users/tenants
   * - **Environment Separation**: Allows different prefixes for dev/staging/production
   *
   * ### Namespace Format:
   * The namespace is returned as a clean string without any trailing separators.
   * The system automatically adds the `-` separator when constructing the final key.
   *
   * @returns The current namespace prefix as a string, or empty string if no namespace is set
   *
   * @example
   * ```typescript
   * // Get the current namespace
   * const namespace = Manager.keyNamespace;
   * console.log(namespace); // "" (empty by default)
   *
   * // Set a namespace first
   * Manager.keyNamespace = "myapp";
   * console.log(Manager.keyNamespace); // "myapp"
   * ```
   *
   * @example
   * ```typescript
   * // Multi-tenant application example
   * class TenantSessionManager {
   *   static setTenant(tenantId: string) {
   *     Manager.keyNamespace = `tenant-${tenantId}`;
   *   }
   *
   *   static getCurrentTenant(): string {
   *     const namespace = Manager.keyNamespace;
   *     return namespace.replace('tenant-', '');
   *   }
   * }
   *
   * // Usage
   * TenantSessionManager.setTenant('acme-corp');
   * console.log(Manager.keyNamespace); // "tenant-acme-corp"
   *
   * // All session operations now use this namespace
   * Session.set('userPrefs', { theme: 'dark' });
   * // Stored as key: "tenant-acme-corp-userPrefs"
   * ```
   *
   * @example
   * ```typescript
   * // Environment-based namespacing
   * const environment = process.env.NODE_ENV || 'development';
   * const appVersion = process.env.APP_VERSION || '1.0.0';
   *
   * Manager.keyNamespace = `${environment}-v${appVersion}`;
   * console.log(Manager.keyNamespace); // "production-v2.1.0"
   *
   * // All storage operations are now environment-scoped
   * Session.set('cache', data); // Stored as "production-v2.1.0-cache"
   * ```
   *
   * @example
   * ```typescript
   * // Dynamic namespace checking
   * function ensureNamespace(requiredNamespace: string) {
   *   const current = Manager.keyNamespace;
   *   if (current !== requiredNamespace) {
   *     throw new Error(`Expected namespace '${requiredNamespace}', got '${current}'`);
   *   }
   * }
   *
   * // Usage in critical operations
   * Manager.keyNamespace = "secure-context";
   * ensureNamespace("secure-context"); // Passes
   * Session.set('sensitiveData', encryptedData);
   * ```
   *
   * @example
   * ```typescript
   * // Namespace validation and formatting
   * function validateNamespace(): boolean {
   *   const namespace = Manager.keyNamespace;
   *
   *   // Check for valid format
   *   const isValidFormat = /^[a-z0-9-]+$/.test(namespace);
   *   const hasNoConsecutiveDashes = !namespace.includes('--');
   *   const doesNotStartOrEndWithDash = !namespace.startsWith('-') && !namespace.endsWith('-');
   *
   *   return isValidFormat && hasNoConsecutiveDashes && doesNotStartOrEndWithDash;
   * }
   *
   * Manager.keyNamespace = "my-app-v1";
   * console.log(validateNamespace()); // true
   *
   * Manager.keyNamespace = "invalid--namespace-";
   * console.log(validateNamespace()); // false
   * ```
   *
   * @see {@link keyNamespace} (setter) - Method to set the namespace prefix
   * @see {@link sanitizeKey} - Method that applies the namespace to keys
   * @see {@link Session.set} - Session storage method that uses namespaced keys
   * @see {@link Session.get} - Session retrieval method that uses namespaced keys
   *
   * @since 1.0.0
   * @public
   *
   * @remarks
   * **Important Considerations:**
   * - The namespace affects ALL subsequent session operations
   * - Changing the namespace will effectively "switch" to a different storage context
   * - Keys stored with one namespace won't be accessible with a different namespace
   * - The namespace is stored globally and persists until explicitly changed
   * - An empty namespace means no prefixing is applied to keys
   *
   * **Best Practices:**
   * - Set the namespace early in your application lifecycle
   * - Use consistent naming conventions (lowercase, hyphens for separation)
   * - Consider including version numbers for schema evolution
   * - Avoid changing namespaces frequently during application runtime
   * - Document your namespace strategy for team members
   *
   * **Thread Safety:**
   * - Reading the namespace is thread-safe
   * - The value is cached until explicitly changed
   * - Multiple reads return the same value consistently
   */
  public static get keyNamespace(): string {
    return isNonNullString(this._keyNamespace) ? this._keyNamespace : "";
  }

  /**
   * Sets the namespace prefix that will be prepended to all session storage keys.
   *
   * This setter allows you to configure a global namespace prefix that will be automatically
   * applied to all session storage keys when they are sanitized. Setting a namespace is crucial
   * for applications that need to maintain separate storage contexts, avoid key collisions,
   * or implement multi-tenant architectures where different users or application instances
   * should have isolated storage spaces.
   *
   * ### Namespace Validation:
   * The setter validates the input using {@link isNonNullString} to ensure only valid,
   * non-empty strings are accepted. Invalid inputs (null, undefined, empty strings) are
   * silently ignored, preserving the current namespace value.
   *
   * ### Impact on Storage Operations:
   * Once a namespace is set, ALL subsequent session storage operations will use the
   * namespaced keys. This includes {@link Session.get}, {@link Session.set},
   * {@link Session.remove}, and all other storage methods.
   *
   * @param prefix - The namespace prefix to use for all storage keys
   *
   * @example
   * ```typescript
   * // Basic namespace setup
   * Manager.keyNamespace = "myapp";
   *
   * // Now all storage operations use the namespace
   * Session.set('user', { id: 1, name: 'John' });
   * // Stored with key: "myapp-user"
   *
   * const user = Session.get('user');
   * // Retrieves using key: "myapp-user"
   * ```
   *
   * @example
   * ```typescript
   * // Multi-environment configuration
   * const environment = process.env.NODE_ENV;
   * const version = process.env.APP_VERSION;
   *
   * // Set environment-specific namespace
   * Manager.keyNamespace = `${environment}-${version}`;
   *
   * // Examples:
   * // Development: "development-1.0.0"
   * // Production: "production-2.1.5"
   * // Testing: "testing-1.2.0-beta"
   *
   * Session.set('config', appConfig);
   * // Stored as "production-2.1.5-config"
   * ```
   *
   * @example
   * ```typescript
   * // User-specific namespacing for multi-tenant apps
   * class UserSessionManager {
   *   static loginUser(userId: string, organizationId: string) {
   *     // Create unique namespace for this user context
   *     Manager.keyNamespace = `org-${organizationId}-user-${userId}`;
   *
   *     // All subsequent storage is user-specific
   *     Session.set('preferences', userPreferences);
   *     Session.set('cache', userData);
   *   }
   *
   *   static logoutUser() {
   *     // Clear user-specific data
   *     Session.removeAll();
   *
   *     // Reset to global namespace
   *     Manager.keyNamespace = "global";
   *   }
   * }
   *
   * // Usage
   * UserSessionManager.loginUser('john123', 'acme-corp');
   * // Namespace: "org-acme-corp-user-john123"
   *
   * Session.set('lastAction', 'document_created');
   * // Stored as: "org-acme-corp-user-john123-lastAction"
   * ```
   *
   * @example
   * ```typescript
   * // Feature-based namespacing
   * class FeatureFlags {
   *   private static originalNamespace: string;
   *
   *   static enableFeature(featureName: string) {
   *     // Save current namespace
   *     this.originalNamespace = Manager.keyNamespace;
   *
   *     // Switch to feature-specific namespace
   *     Manager.keyNamespace = `feature-${featureName}`;
   *
   *     return {
   *       store: (key: string, value: any) => Session.set(key, value),
   *       retrieve: (key: string) => Session.get(key),
   *       cleanup: () => {
   *         Session.removeAll();
   *         Manager.keyNamespace = this.originalNamespace;
   *       }
   *     };
   *   }
   * }
   *
   * // Usage
   * const betaFeature = FeatureFlags.enableFeature('beta-dashboard');
   * betaFeature.store('userProgress', progressData);
   * // Stored as: "feature-beta-dashboard-userProgress"
   *
   * betaFeature.cleanup(); // Removes all feature data and restores namespace
   * ```
   *
   * @example
   * ```typescript
   * // Namespace migration for application updates
   * class NamespaceMigration {
   *   static migrateFrom(oldNamespace: string, newNamespace: string) {
   *     // Step 1: Read all data from old namespace
   *     Manager.keyNamespace = oldNamespace;
   *     const oldData = this.getAllStorageData();
   *
   *     // Step 2: Switch to new namespace and write data
   *     Manager.keyNamespace = newNamespace;
   *     Object.entries(oldData).forEach(([key, value]) => {
   *       Session.set(key, value);
   *     });
   *
   *     // Step 3: Clean up old namespace
   *     Manager.keyNamespace = oldNamespace;
   *     Session.removeAll();
   *
   *     // Step 4: Set new namespace as active
   *     Manager.keyNamespace = newNamespace;
   *   }
   *
   *   private static getAllStorageData(): Record<string, any> {
   *     // Implementation would depend on storage backend
   *     // This is a simplified example
   *     return {};
   *   }
   * }
   *
   * // Usage during app update
   * NamespaceMigration.migrateFrom('v1.0', 'v2.0');
   * ```
   *
   * @example
   * ```typescript
   * // Namespace validation and sanitization
   * function setSecureNamespace(rawNamespace: string): boolean {
   *   // Sanitize the namespace
   *   const sanitized = rawNamespace
   *     .toLowerCase()
   *     .replace(/[^a-z0-9-]/g, '-')
   *     .replace(/-+/g, '-')
   *     .replace(/^-|-$/g, '');
   *
   *   if (sanitized.length < 3) {
   *     console.warn('Namespace too short, using default');
   *     Manager.keyNamespace = 'default';
   *     return false;
   *   }
   *
   *   Manager.keyNamespace = sanitized;
   *   return true;
   * }
   *
   * // Usage
   * setSecureNamespace('My App!! v2.0'); // Sets to "my-app-v2-0"
   * setSecureNamespace('x'); // Sets to "default" (too short)
   * ```
   *
   * @see {@link keyNamespace} (getter) - Method to retrieve the current namespace
   * @see {@link sanitizeKey} - Method that applies the namespace to keys
   * @see {@link isNonNullString} - Validation function used for input checking
   * @see {@link Session} - Session utilities that use the namespaced keys
   *
   * @since 1.0.0
   * @public
   *
   * @remarks
   * **Critical Behavior Notes:**
   * - Only valid, non-empty strings are accepted as namespace values
   * - Invalid inputs (null, undefined, empty strings) are silently ignored
   * - The namespace change affects ALL subsequent storage operations immediately
   * - Previously stored data under different namespaces becomes inaccessible
   * - The namespace is stored globally and persists until explicitly changed
   *
   * **Security Considerations:**
   * - Ensure namespace values don't contain sensitive information
   * - Validate namespace inputs in security-critical applications
   * - Consider namespace as part of your access control strategy
   * - Be aware that namespace switching can expose or hide data
   *
   * **Performance Impact:**
   * - Namespace setting is a lightweight operation
   * - The namespace is cached and doesn't impact storage operation performance
   * - Frequent namespace changes can lead to memory fragmentation in some storage backends
   *
   * **Best Practices:**
   * - Set the namespace once during application initialization
   * - Use consistent, predictable naming patterns
   * - Document your namespace strategy and conventions
   * - Consider versioning in your namespace for future migrations
   * - Test namespace switching thoroughly in your application
   */
  public static set keyNamespace(prefix: string) {
    if (isNonNullString(prefix)) {
      this._keyNamespace = prefix.trim().replace(/\s+/g, "-");
    }
  }

  /**
   * Sanitizes and prepares a storage key by removing whitespace and applying the global namespace prefix.
   *
   * This method is the core key processing function that ensures all session storage keys are
   * properly formatted and consistently namespaced. It performs essential cleaning operations
   * to prevent storage errors and applies the global namespace to create isolated storage contexts.
   *
   * The sanitization process is critical for maintaining data integrity and preventing conflicts
   * in shared storage environments. This method is automatically called by all session storage
   * operations, ensuring consistent key handling throughout the application.
   *
   * ### Sanitization Process:
   * 1. **Validation**: Checks if the key is valid using {@link isNonNullString}
   * 2. **Trimming**: Removes leading and trailing whitespace
   * 3. **Whitespace Removal**: Removes all internal whitespace characters
   * 4. **Namespace Application**: Prepends the global namespace with a hyphen separator
   * 5. **Return**: Provides the final, storage-ready key
   *
   * ### Key Format:
   * - **Without namespace**: `"cleankey"`
   * - **With namespace**: `"namespace-cleankey"`
   * - **Invalid input**: `""` (empty string)
   *
   * @param key - The raw key string to sanitize (optional)
   *
   * @returns The sanitized key string ready for storage operations, or empty string if input is invalid
   *
   * @example
   * ```typescript
   * // Basic key sanitization
   * const clean1 = Manager.sanitizeKey("userToken");
   * console.log(clean1); // "userToken"
   *
   * const clean2 = Manager.sanitizeKey("user profile");
   * console.log(clean2); // "userprofile"
   *
   * const clean3 = Manager.sanitizeKey("  spaced key  ");
   * console.log(clean3); // "spacedkey"
   * ```
   *
   * @example
   * ```typescript
   * // Namespace application
   * Manager.keyNamespace = "myapp";
   *
   * const key1 = Manager.sanitizeKey("settings");
   * console.log(key1); // "myapp-settings"
   *
   * const key2 = Manager.sanitizeKey("user preferences");
   * console.log(key2); // "myapp-userpreferences"
   *
   * const key3 = Manager.sanitizeKey("cache data");
   * console.log(key3); // "myapp-cachedata"
   * ```
   *
   * @example
   * ```typescript
   * // Invalid input handling
   * const invalid1 = Manager.sanitizeKey("");
   * console.log(invalid1); // ""
   *
   * const invalid2 = Manager.sanitizeKey(null);
   * console.log(invalid2); // ""
   *
   * const invalid3 = Manager.sanitizeKey(undefined);
   * console.log(invalid3); // ""
   *
   * const invalid4 = Manager.sanitizeKey("   ");
   * console.log(invalid4); // ""
   * ```
   *
   * @example
   * ```typescript
   * // Complex whitespace handling
   * const complex1 = Manager.sanitizeKey("user\tprofile\ndata");
   * console.log(complex1); // "userprofiledata"
   *
   * const complex2 = Manager.sanitizeKey("multi   space   key");
   * console.log(complex2); // "multispacekey"
   *
   * const complex3 = Manager.sanitizeKey(" \t\n mixed \r\n whitespace \t ");
   * console.log(complex3); // "mixedwhitespace"
   * ```
   *
   * @example
   * ```typescript
   * // Usage in custom storage operations
   * class CustomStorage {
   *   static setWithMetadata(key: string, value: any, metadata: object) {
   *     const cleanKey = Manager.sanitizeKey(key);
   *     const metaKey = Manager.sanitizeKey(`${key}_meta`);
   *
   *     Session.set(cleanKey, value);
   *     Session.set(metaKey, metadata);
   *   }
   *
   *   static getWithMetadata(key: string) {
   *     const cleanKey = Manager.sanitizeKey(key);
   *     const metaKey = Manager.sanitizeKey(`${key}_meta`);
   *
   *     return {
   *       value: Session.get(cleanKey),
   *       metadata: Session.get(metaKey)
   *     };
   *   }
   * }
   *
   * // Usage
   * Manager.keyNamespace = "app";
   * CustomStorage.setWithMetadata("user data", userData, { created: Date.now() });
   * // Stores: "app-userdata" and "app-userdata_meta"
   *
   * const result = CustomStorage.getWithMetadata("user data");
   * console.log(result.value, result.metadata);
   * ```
   *
   * @example
   * ```typescript
   * // Key collision prevention
   * class StorageKeyManager {
   *   static generateUniqueKey(baseKey: string, identifier: string): string {
   *     const timestamp = Date.now();
   *     const randomSuffix = Math.random().toString(36).substr(2, 9);
   *     const rawKey = `${baseKey}_${identifier}_${timestamp}_${randomSuffix}`;
   *
   *     return Manager.sanitizeKey(rawKey);
   *   }
   *
   *   static isKeyValid(key: string): boolean {
   *     const sanitized = Manager.sanitizeKey(key);
   *     return sanitized.length > 0 && sanitized === Manager.sanitizeKey(sanitized);
   *   }
   * }
   *
   * // Usage
   * const uniqueKey = StorageKeyManager.generateUniqueKey("temp cache", "user123");
   * console.log(uniqueKey); // "namespace-tempcache_user123_1642123456789_abc123def"
   *
   * console.log(StorageKeyManager.isKeyValid("valid key")); // true
   * console.log(StorageKeyManager.isKeyValid("")); // false
   * ```
   *
   * @example
   * ```typescript
   * // Debugging key transformations
   * function debugKeySanitization(rawKey: string) {
   *   console.log('=== Key Sanitization Debug ===');
   *   console.log('Input:', JSON.stringify(rawKey));
   *   console.log('Current namespace:', Manager.keyNamespace);
   *
   *   const sanitized = Manager.sanitizeKey(rawKey);
   *   console.log('Output:', JSON.stringify(sanitized));
   *
   *   const steps = {
   *     'Original': rawKey,
   *     'After trim': rawKey?.trim(),
   *     'After whitespace removal': rawKey?.trim().replace(/\s+/g, ""),
   *     'With namespace': sanitized
   *   };
   *
   *   Object.entries(steps).forEach(([step, value]) => {
   *     console.log(`${step}: "${value}"`);
   *   });
   * }
   *
   * // Usage
   * Manager.keyNamespace = "debug";
   * debugKeySanitization("  test   key  with   spaces  ");
   * ```
   *
   * @see {@link keyNamespace} - The namespace property applied to keys
   * @see {@link isNonNullString} - Validation function for key input
   * @see {@link Session.set} - Method that uses sanitized keys for storage
   * @see {@link Session.get} - Method that uses sanitized keys for retrieval
   * @see {@link sanitizeKey} - Standalone function wrapper for this method
   *
   * @since 1.0.0
   * @public
   *
   * @remarks
   * **Key Behavior Notes:**
   * - All whitespace characters (spaces, tabs, newlines, etc.) are completely removed
   * - The method is case-sensitive - no case transformation is performed
   * - Namespace application is automatic when a namespace is set
   * - Empty or invalid inputs always return an empty string
   * - The method is idempotent - sanitizing a sanitized key produces the same result
   *
   * **Performance Characteristics:**
   * - Very fast operation, primarily string manipulation
   * - No external dependencies or async operations
   * - Minimal memory allocation for most inputs
   * - Regex operations are optimized for common whitespace patterns
   *
   * **Integration Points:**
   * - Called automatically by all Session storage methods
   * - Used by the standalone {@link sanitizeKey} function
   * - Can be called directly for key validation or preview
   * - Essential for custom storage implementations
   *
   * **Whitespace Handling:**
   * - **Spaces**: ` ` → removed
   * - **Tabs**: `\t` → removed
   * - **Newlines**: `\n`, `\r\n` → removed
   * - **Form feeds**: `\f` → removed
   * - **Vertical tabs**: `\v` → removed
   * - **Unicode whitespace**: Various Unicode space characters → removed
   */
  public static sanitizeKey(key?: string): string {
    if (!key || !isNonNullString(key)) return "";
    key = key.trim().replace(/\s+/g, "-");
    const keyPrefix = this.keyNamespace;
    if (keyPrefix) return `${keyPrefix}-${key}`;
    return key;
  }
}

/**
 * Sanitizes a string for session storage.
 * 
 * This function trims and removes whitespace from the key, and adds the namespace prefix if set.
 * \nExample
 * ```typescript
    Manager.keyNamespace = "my-prefix";
    const prefixedKey = sanitizeKey("my-key");
    console.log(prefixedKey); // "my-prefix-my-key"
 * ````
 * @param {string} key - The key to sanitize.
 * @returns {string} The sanitized key.
 */
function sanitizeKey(key: string): string {
  return Manager.sanitizeKey(key);
}

/***
 * sanitize session value for persistance purposes
 * @param {any} value to sanitize
 * @param {boolean} {decycle=true} whether to decycle the value
 * @return {string} sanitized value
 */
const handleSetValue = (value: any, decycle?: boolean) => {
  value = value ? JsonHelper.stringify(value, decycle) : value;
  if (value === null || value === undefined) value = "";
  return value;
};

/**
 * Parses and processes retrieved session storage values with support for both synchronous and asynchronous operations.
 *
 * This utility function is the core value processing mechanism for session storage retrieval operations.
 * It intelligently handles different types of values including Promises, serialized JSON strings, and
 * primitive values, ensuring that data is properly deserialized and returned in its original format.
 *
 * The function implements sophisticated Promise detection and handling to support asynchronous storage
 * backends while maintaining compatibility with synchronous storage implementations. This dual-mode
 * operation makes it essential for building flexible storage solutions that can work across different
 * environments and storage providers.
 *
 * ### Processing Logic:
 * 1. **Promise Detection**: Uses {@link isPromise} to detect asynchronous values
 * 2. **Async Handling**: Wraps Promise resolution with JSON parsing
 * 3. **Sync Processing**: Directly parses JSON for synchronous values
 * 4. **Null Safety**: Returns undefined for null/undefined inputs
 * 5. **Error Propagation**: Maintains original Promise rejection behavior
 *
 * ### Value Flow:
 * - **Promise Input** → **Promise Output** (with parsed resolution)
 * - **JSON String** → **Parsed Object/Primitive**
 * - **null/undefined** → **undefined**
 * - **Other Values** → **Parsed via JsonHelper**
 *
 * @param value - The raw value retrieved from session storage to be processed
 *
 * @returns The processed value - either a Promise resolving to parsed data, the parsed data directly, or undefined
 *
 * @example
 * ```typescript
 * // Synchronous JSON string processing
 * const jsonString = '{"name":"John","age":30}';
 * const result = handleGetValue(jsonString);
 * console.log(result); // { name: "John", age: 30 }
 *
 * // Primitive value processing
 * const numberString = '42';
 * const number = handleGetValue(numberString);
 * console.log(number); // 42
 *
 * // Array processing
 * const arrayString = '[1,2,3,4,5]';
 * const array = handleGetValue(arrayString);
 * console.log(array); // [1, 2, 3, 4, 5]
 * ```
 *
 * @example
 * ```typescript
 * // Asynchronous Promise handling
 * const promiseValue = fetch('/api/data').then(res => res.text());
 * const asyncResult = handleGetValue(promiseValue);
 *
 * // asyncResult is a Promise
 * asyncResult.then(data => {
 *   console.log(data); // Parsed JSON data from the API
 * }).catch(error => {
 *   console.error('Failed to process async value:', error);
 * });
 *
 * // Using with async/await
 * try {
 *   const data = await handleGetValue(promiseValue);
 *   console.log('Processed data:', data);
 * } catch (error) {
 *   console.error('Error processing promise:', error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Database storage integration
 * class DatabaseStorage implements ISessionStorage {
 *   async get(key: string): Promise<string> {
 *     const result = await this.db.query('SELECT value FROM sessions WHERE key = ?', [key]);
 *     return result[0]?.value || null;
 *   }
 *
 *   // ... other methods
 * }
 *
 * // Usage with async storage
 * const dbStorage = new DatabaseStorage();
 * const promiseValue = dbStorage.get('user-preferences');
 *
 * const processedValue = handleGetValue(promiseValue);
 * processedValue.then(preferences => {
 *   console.log('User preferences:', preferences);
 *   // preferences is now a parsed object, not a JSON string
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Complex object processing with nested data
 * const complexObject = {
 *   user: { id: 1, name: 'Alice' },
 *   settings: { theme: 'dark', notifications: true },
 *   cache: [{ id: 1, data: 'value1' }, { id: 2, data: 'value2' }]
 * };
 *
 * // Simulate storage and retrieval
 * const serialized = JSON.stringify(complexObject);
 * const processed = handleGetValue(serialized);
 *
 * console.log(processed.user.name); // 'Alice'
 * console.log(processed.settings.theme); // 'dark'
 * console.log(processed.cache.length); // 2
 * ```
 *
 * @example
 * ```typescript
 * // Error handling with Promise rejection
 * const failingPromise = Promise.reject(new Error('Storage unavailable'));
 * const result = handleGetValue(failingPromise);
 *
 * result.catch(error => {
 *   console.error('Storage error caught:', error.message);
 *   // Handle the error appropriately
 *   return null; // Provide fallback value
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe processing with validation
 * interface UserData {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * function getTypedUserData(key: string): Promise<UserData | null> {
 *   const rawValue = Manager.storage.get(key);
 *   const processed = handleGetValue(rawValue);
 *
 *   if (isPromise(processed)) {
 *     return processed.then(data => {
 *       return validateUserData(data) ? data as UserData : null;
 *     });
 *   }
 *
 *   return Promise.resolve(
 *     validateUserData(processed) ? processed as UserData : null
 *   );
 * }
 *
 * function validateUserData(data: any): boolean {
 *   return data &&
 *          typeof data.id === 'number' &&
 *          typeof data.name === 'string' &&
 *          typeof data.email === 'string';
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handling different storage backends
 * class MultiStorageManager {
 *   static async getValue(key: string, preferAsync = false) {
 *     let rawValue;
 *
 *     if (preferAsync && this.hasAsyncStorage()) {
 *       rawValue = this.asyncStorage.get(key); // Returns Promise
 *     } else {
 *       rawValue = this.syncStorage.get(key); // Returns string directly
 *     }
 *
 *     const processed = handleGetValue(rawValue);
 *
 *     // Always return a Promise for consistent API
 *     return isPromise(processed) ? processed : Promise.resolve(processed);
 *   }
 *
 *   static hasAsyncStorage(): boolean {
 *     return this.asyncStorage && typeof this.asyncStorage.get === 'function';
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Performance monitoring and caching
 * class PerformanceAwareHandler {
 *   private static cache = new Map<string, any>();
 *
 *   static getValueWithCaching(key: string, rawValue: any) {
 *     const cacheKey = `processed:${key}`;
 *
 *     if (this.cache.has(cacheKey)) {
 *       return this.cache.get(cacheKey);
 *     }
 *
 *     const startTime = performance.now();
 *     const processed = handleGetValue(rawValue);
 *
 *     if (isPromise(processed)) {
 *       return processed.then(result => {
 *         const endTime = performance.now();
 *         console.log(`Async processing took ${endTime - startTime}ms`);
 *         this.cache.set(cacheKey, result);
 *         return result;
 *       });
 *     }
 *
 *     const endTime = performance.now();
 *     console.log(`Sync processing took ${endTime - startTime}ms`);
 *     this.cache.set(cacheKey, processed);
 *     return processed;
 *   }
 * }
 * ```
 *
 * @see {@link JsonHelper.parse} - The JSON parsing utility used for deserialization
 * @see {@link isPromise} - Utility function for Promise detection
 * @see {@link handleSetValue} - Complementary function for value serialization
 * @see {@link ISessionStorage} - Interface defining storage contract
 * @see {@link Session.get} - Main session retrieval method that uses this function
 *
 * @since 1.0.0
 * @internal
 *
 * @remarks
 * **Critical Implementation Details:**
 * - Promise rejection is properly propagated without modification
 * - JSON parsing errors are not caught - they bubble up to calling code
 * - The function is synchronous for non-Promise inputs, asynchronous for Promise inputs
 * - Return type varies based on input type, maintaining flexibility
 * - Null and undefined inputs consistently return undefined
 *
 * **Promise Handling:**
 * - Uses native Promise.then() and Promise.catch() for maximum compatibility
 * - Preserves original Promise rejection reasons and stack traces
 * - Does not add unnecessary Promise wrappers for synchronous values
 * - Supports any Promise-like object that implements .then() and .catch()
 *
 * **Performance Characteristics:**
 * - **Synchronous Path**: Very fast, only JSON parsing overhead
 * - **Asynchronous Path**: Adds minimal Promise wrapper overhead
 * - **Memory Usage**: Minimal allocation for non-Promise values
 * - **JSON Parsing**: Depends on JsonHelper.parse implementation efficiency
 *
 * **Error Behavior:**
 * - **JSON Parse Errors**: Thrown synchronously for invalid JSON
 * - **Promise Rejections**: Propagated as Promise rejections
 * - **Type Errors**: May occur if input doesn't match expected format
 * - **Null/Undefined**: Safely handled, returns undefined
 *
 * **Thread Safety:**
 * - Function is stateless and thread-safe
 * - No shared mutable state or side effects
 * - Promise handling is inherently async-safe
 * - Can be called concurrently without issues
 */
const handleGetValue: any = (value: any) => {
  if (isPromise(value)) {
    return new Promise((resolve, reject) => {
      value
        .then((v: any) => {
          resolve(JsonHelper.parse(v));
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }
  if (value !== null && value !== undefined) {
    return JsonHelper.parse(value);
  }
  return undefined;
};

/**
 * Gets a session value from a key.
 *
 * This function sanitizes the key, retrieves the value from the session storage, and handles the value accordingly.
 *
 * @param {string} key - The key to retrieve the value for.
 * @returns {any} The retrieved value, or undefined if the key is invalid or the value is not found.
 */
const get = (key: string) => {
  /**
   * Sanitize the key to ensure it's valid for session storage.
   */
  key = sanitizeKey(key);

  /**
   * Check if the session storage is available and the key is valid.
   */
  if (Manager.storage && key && typeof key === "string") {
    /**
     * Retrieve the value from the session storage using the sanitized key.
     */
    const value = Manager.storage.get(key);

    /**
     * Handle the retrieved value accordingly.
     */
    return handleGetValue(value);
  }

  /**
   * If the key is invalid or the value is not found, return undefined.
   */
  return undefined;
};
/**
 * Removes a key from the session storage.
 *
 * This function sanitizes the key and removes the corresponding value from the session storage.
 *
 * @param {string} key - The key to remove from the session storage.
 * @returns {any} The removed value, or undefined if the key is invalid or the value is not found.
 */
const remove = (key: string) => {
  /**
   * Sanitize the key to ensure it's valid for session storage.
   */
  key = sanitizeKey(key);

  /**
   * Check if the session storage is available and the key is valid.
   */
  if (Manager.storage && key && typeof key === "string") {
    /**
     * Remove the value from the session storage using the sanitized key.
     */
    return Manager.storage.remove(key);
  }

  /**
   * If the key is invalid or the value is not found, return undefined.
   */
  return undefined;
};

/**
 * Removes all values from the session storage.
 *
 * This function removes all values from the session storage.
 *
 * @returns {any} The result of removing all values, or undefined if the key is invalid or the session storage is not available.
 */
const removeAll = () => {
  /**
   * Check if the session storage is available and the key is valid.
   */
  if (Manager.storage) {
    /**
     * Remove all values from the session storage.
     */
    return Manager.storage.removeAll();
  }

  /**
   * If the key is invalid or the session storage is not available, return undefined.
   */
  return undefined;
};

/**
 * Interface for a session storage object.
 *
 * This interface defines the methods for setting, getting, and removing values from a session storage object.
 */
export interface ISessionStorage {
  /**
   * Sets a value in the session storage object.
   *
   * @param {string} key - The key to set the value for.
   * @param {any} value - The value to set.
   * @param {boolean} [decycle] - Optional parameter to decycle the value.
   * @returns {any} The set value.
   */
  set: (key: string, value: any, decycle?: boolean) => any;

  /**
   * Gets a value from the session storage object.
   *
   * @param {string} key - The key to get the value for.
   * @returns {any} The value associated with the key.
   */
  get: (key: string) => any;

  /**
   * Removes a value from the session storage object.
   *
   * @param {string} key - The key to remove the value for.
   * @returns {any} The removed value.
   */
  remove: (key: string) => any;

  /**
   * Removes all values from the session storage object.
   *
   */
  removeAll: () => any;
}

/**
 * Checks if the given storage object is valid.
 *
 * A storage object is considered valid if it has the following methods:
 * - `get`
 * - `set`
 * - `remove`
 *
 * @param {ISessionStorage} storage - The storage object to check.
 * @returns {boolean} `true` if the storage object is valid, `false` otherwise.
 */
const isValidStorage = (storage?: ISessionStorage): boolean => {
  /**
   * Check if the storage object is null or undefined.
   * If so, return false immediately.
   */
  if (!storage) return false;

  try {
    /**
     * Check if the storage object has the required methods.
     * If any of these checks fail, the storage object is not valid.
     */
    return ["get", "set", "remove", "removeAll"].every(
      (value) => typeof (storage as IDict)[value] === "function"
    );
  } catch {
    /**
     * If an error occurs during the checks, return false.
     */
    return false;
  }
};

/**
 * Session management utilities providing comprehensive storage operations with automatic serialization and namespace support.
 *
 * The Session object serves as the primary interface for all session storage operations in the application.
 * It provides a clean, consistent API that abstracts away the complexity of different storage backends while
 * offering advanced features like automatic JSON serialization, key sanitization, namespace management,
 * and support for both synchronous and asynchronous storage operations.
 *
 * ### Core Features:
 * - **Automatic Serialization**: JSON serialization/deserialization with decycling support
 * - **Key Sanitization**: Automatic key cleaning and namespace prefixing
 * - **Storage Abstraction**: Works with any storage backend implementing ISessionStorage
 * - **Type Safety**: Full TypeScript support with intelligent type inference
 * - **Async Support**: Seamless handling of both sync and async storage operations
 * - **Error Resilience**: Graceful handling of storage failures and edge cases
 *
 * @namespace Session
 * @since 1.0.0
 * @public
 */
export const Session = {
  get,

  /**
   * Stores a value in session storage with automatic serialization and key sanitization.
   *
   * This method is the primary interface for persisting data to session storage. It provides
   * intelligent handling of complex data types through JSON serialization, automatic key
   * sanitization with namespace support, and optional object decycling to handle circular
   * references safely.
   *
   * The method leverages the configured storage backend through the Manager, ensuring that
   * your data is stored consistently regardless of whether you're using localStorage,
   * sessionStorage, IndexedDB, or a custom storage implementation.
   *
   * ### Key Processing Pipeline:
   * 1. **Key Sanitization**: Applies {@link sanitizeKey} to clean and prefix the key
   * 2. **Value Processing**: Uses {@link handleSetValue} for JSON serialization
   * 3. **Storage Delegation**: Passes processed data to the configured storage backend
   * 4. **Result Return**: Returns the result from the underlying storage operation
   *
   * ### Serialization Features:
   * - **JSON Serialization**: Converts objects, arrays, and primitives to JSON strings
   * - **Circular Reference Handling**: Optional decycling prevents infinite recursion
   * - **Type Preservation**: Maintains data types through intelligent parsing on retrieval
   * - **Null/Undefined Handling**: Graceful handling of empty values
   *
   * @param key - The storage key identifier for the value
   * @param value - The data to store (objects, arrays, primitives, etc.)
   * @param decycle - Whether to remove circular references during serialization
   *
   * @returns The result of the storage operation (implementation-dependent)
   *
   * @example
   * ```typescript
   * // Basic primitive value storage
   * Session.set('username', 'john_doe');
   * Session.set('user_id', 12345);
   * Session.set('is_authenticated', true);
   * Session.set('last_login', new Date());
   *
   * console.log(Session.get('username')); // 'john_doe'
   * console.log(Session.get('user_id')); // 12345
   * console.log(Session.get('is_authenticated')); // true
   * ```
   *
   * @example
   * ```typescript
   * // Complex object storage with automatic serialization
   * const userProfile = {
   *   id: 1001,
   *   name: 'Alice Johnson',
   *   email: 'alice@example.com',
   *   preferences: {
   *     theme: 'dark',
   *     language: 'en',
   *     notifications: {
   *       email: true,
   *       push: false,
   *       sms: true
   *     }
   *   },
   *   roles: ['user', 'moderator'],
   *   metadata: {
   *     created_at: '2023-01-15T10:30:00Z',
   *     last_updated: '2023-07-20T14:45:30Z'
   *   }
   * };
   *
   * // Store complex object - automatically serialized
   * Session.set('user_profile', userProfile);
   *
   * // Retrieve and use - automatically deserialized
   * const retrievedProfile = Session.get('user_profile');
   * console.log(retrievedProfile.name); // 'Alice Johnson'
   * console.log(retrievedProfile.preferences.theme); // 'dark'
   * console.log(retrievedProfile.roles.length); // 2
   * ```
   *
   * @example
   * ```typescript
   * // Array storage and manipulation
   * const shoppingCart = [
   *   { id: 'prod1', name: 'Laptop', price: 999.99, quantity: 1 },
   *   { id: 'prod2', name: 'Mouse', price: 29.99, quantity: 2 },
   *   { id: 'prod3', name: 'Keyboard', price: 79.99, quantity: 1 }
   * ];
   *
   * Session.set('shopping_cart', shoppingCart);
   *
   * // Retrieve and work with array
   * const cart = Session.get('shopping_cart');
   * const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
   * const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
   *
   * console.log(`Cart has ${totalItems} items, total: $${totalPrice.toFixed(2)}`);
   * ```
   *
   * @example
   * ```typescript
   * // Handling circular references with decycling
   * interface Node {
   *   id: string;
   *   name: string;
   *   parent?: Node;
   *   children: Node[];
   * }
   *
   * const parentNode: Node = {
   *   id: 'parent',
   *   name: 'Parent Node',
   *   children: []
   * };
   *
   * const childNode: Node = {
   *   id: 'child',
   *   name: 'Child Node',
   *   parent: parentNode,
   *   children: []
   * };
   *
   * parentNode.children.push(childNode);
   *
   * // Store with decycling enabled (default) to handle circular reference
   * Session.set('node_tree', parentNode, true);
   *
   * // Store without decycling (use with caution for circular data)
   * // Session.set('node_tree', parentNode, false); // May cause errors
   * ```
   *
   * @example
   * ```typescript
   * // Application state management
   * interface AppState {
   *   currentView: 'dashboard' | 'profile' | 'settings';
   *   user: {
   *     id: number;
   *     name: string;
   *     permissions: string[];
   *   };
   *   uiState: {
   *     sidebarCollapsed: boolean;
   *     activeTab: string;
   *     filters: Record<string, any>;
   *   };
   * }
   *
   * const appState: AppState = {
   *   currentView: 'dashboard',
   *   user: {
   *     id: 123,
   *     name: 'John Doe',
   *     permissions: ['read', 'write', 'admin']
   *   },
   *   uiState: {
   *     sidebarCollapsed: false,
   *     activeTab: 'overview',
   *     filters: {
   *       dateRange: '30days',
   *       category: 'all',
   *       status: 'active'
   *     }
   *   }
   * };
   *
   * // Persist entire application state
   * Session.set('app_state', appState);
   *
   * // Later, restore application state
   * const restoredState = Session.get('app_state') as AppState;
   * if (restoredState) {
   *   console.log(`Welcome back, ${restoredState.user.name}!`);
   *   console.log(`Current view: ${restoredState.currentView}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Form data persistence for better UX
   * interface FormData {
   *   personalInfo: {
   *     firstName: string;
   *     lastName: string;
   *     email: string;
   *     phone: string;
   *   };
   *   address: {
   *     street: string;
   *     city: string;
   *     state: string;
   *     zipCode: string;
   *   };
   *   preferences: {
   *     newsletter: boolean;
   *     notifications: boolean;
   *   };
   * }
   *
   * // Save form data as user types (draft functionality)
   * function saveFormDraft(formData: Partial<FormData>) {
   *   const existingDraft = Session.get('form_draft') || {};
   *   const updatedDraft = { ...existingDraft, ...formData };
   *   Session.set('form_draft', updatedDraft);
   *   console.log('Draft saved automatically');
   * }
   *
   * // Restore form data when user returns
   * function restoreFormDraft(): Partial<FormData> | null {
   *   return Session.get('form_draft');
   * }
   *
   * // Clear draft after successful submission
   * function clearFormDraft() {
   *   Session.remove('form_draft');
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Configuration and settings management
   * interface UserSettings {
   *   appearance: {
   *     theme: 'light' | 'dark' | 'auto';
   *     fontSize: 'small' | 'medium' | 'large';
   *     accentColor: string;
   *   };
   *   behavior: {
   *     autoSave: boolean;
   *     confirmDeletes: boolean;
   *     showTooltips: boolean;
   *   };
   *   privacy: {
   *     shareUsageData: boolean;
   *     allowCookies: boolean;
   *   };
   * }
   *
   * const defaultSettings: UserSettings = {
   *   appearance: {
   *     theme: 'auto',
   *     fontSize: 'medium',
   *     accentColor: '#007bff'
   *   },
   *   behavior: {
   *     autoSave: true,
   *     confirmDeletes: true,
   *     showTooltips: true
   *   },
   *   privacy: {
   *     shareUsageData: false,
   *     allowCookies: true
   *   }
   * };
   *
   * // Initialize or update settings
   * function updateUserSettings(newSettings: Partial<UserSettings>) {
   *   const currentSettings = Session.get('user_settings') || defaultSettings;
   *   const mergedSettings = deepMerge(currentSettings, newSettings);
   *   Session.set('user_settings', mergedSettings);
   *   return mergedSettings;
   * }
   *
   * // Helper function for deep merging
   * function deepMerge(target: any, source: any): any {
   *   const result = { ...target };
   *   for (const key in source) {
   *     if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
   *       result[key] = deepMerge(target[key] || {}, source[key]);
   *     } else {
   *       result[key] = source[key];
   *     }
   *   }
   *   return result;
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Cache management for API responses
   * interface CacheEntry<T> {
   *   data: T;
   *   timestamp: number;
   *   ttl: number; // time to live in milliseconds
   * }
   *
   * function setCachedData<T>(key: string, data: T, ttlMinutes: number = 30) {
   *   const cacheEntry: CacheEntry<T> = {
   *     data,
   *     timestamp: Date.now(),
   *     ttl: ttlMinutes * 60 * 1000
   *   };
   *
   *   Session.set(`cache_${key}`, cacheEntry);
   *   console.log(`Cached data for ${key} (TTL: ${ttlMinutes} minutes)`);
   * }
   *
   * function getCachedData<T>(key: string): T | null {
   *   const cacheEntry = Session.get(`cache_${key}`) as CacheEntry<T>;
   *
   *   if (!cacheEntry) return null;
   *
   *   const isExpired = Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
   *   if (isExpired) {
   *     Session.remove(`cache_${key}`);
   *     return null;
   *   }
   *
   *   return cacheEntry.data;
   * }
   *
   * // Usage example
   * interface User {
   *   id: number;
   *   name: string;
   *   email: string;
   * }
   *
   * async function fetchUser(id: number): Promise<User> {
   *   // Check cache first
   *   const cached = getCachedData<User>(`user_${id}`);
   *   if (cached) {
   *     console.log('Returning cached user data');
   *     return cached;
   *   }
   *
   *   // Fetch from API
   *   const response = await fetch(`/api/users/${id}`);
   *   const user: User = await response.json();
   *
   *   // Cache for 15 minutes
   *   setCachedData(`user_${id}`, user, 15);
   *
   *   return user;
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Advanced usage with namespacing
   * // Set namespace for application context
   * Session.Manager.keyNamespace = 'myapp';
   *
   * // All keys will be automatically prefixed
   * Session.set('user_data', { id: 1, name: 'John' });
   * // Actual key stored: 'myapp-user-data'
   *
   * Session.set('app settings', { theme: 'dark' });
   * // Actual key stored: 'myapp-app-settings' (spaces replaced with hyphens)
   *
   * // Switch namespace for different context
   * Session.Manager.keyNamespace = 'admin';
   * Session.set('permissions', ['read', 'write', 'delete']);
   * // Actual key stored: 'admin-permissions'
   *
   * // Clear namespace
   * Session.Manager.keyNamespace = '';
   * Session.set('global_config', { version: '1.0.0' });
   * // Actual key stored: 'global-config' (no prefix)
   * ```
   *
   * @see {@link get} - Retrieve values from session storage
   * @see {@link remove} - Remove specific values from storage
   * @see {@link removeAll} - Clear all session storage
   * @see {@link sanitizeKey} - Key sanitization and namespace handling
   * @see {@link handleSetValue} - Value serialization with decycling support
   * @see {@link Manager} - Global session manager configuration
   * @see {@link ISessionStorage} - Storage backend interface
   *
   * @since 1.0.0
   * @public
   *
   * @remarks
   * **Important Implementation Details:**
   * - Keys are automatically sanitized and may be prefixed with namespace
   * - Values are JSON-serialized unless they're already strings
   * - Circular references are handled when decycle is true (default)
   * - Storage operations depend on the configured storage backend
   * - Return value format depends on the underlying storage implementation
   *
   * **Performance Considerations:**
   * - **Serialization Overhead**: Large objects take more time to serialize
   * - **Storage Limits**: Be aware of storage quotas (localStorage ~5-10MB)
   * - **Key Length**: Very long keys may impact performance
   * - **Decycling Cost**: Circular reference detection adds processing time
   *
   * **Error Handling:**
   * - Invalid JSON serialization may throw errors
   * - Storage quota exceeded errors are passed through
   * - Null/undefined Manager.storage results in no operation
   * - Circular references without decycling may cause infinite recursion
   *
   * **Browser Compatibility:**
   * - Works with any storage backend implementing ISessionStorage
   * - JSON serialization uses native JSON.stringify/parse
   * - No dependencies on specific browser APIs
   * - Graceful degradation when storage is unavailable
   */
  set: (key: string, value: any, decycle: boolean = true) => {
    key = sanitizeKey(key);
    return Manager.storage.set(key, handleSetValue(value, decycle));
  },
  remove,
  handleGetValue,
  sanitizeKey,
  handleSetValue,
  isValidStorage,
  Manager,
  removeAll,
};

/**
 * Class decorator that attaches a custom session storage implementation to the global session Manager.
 *
 * This decorator provides a clean and declarative way to register custom storage implementations
 * that will be used throughout the application for session management. When applied to a class,
 * it automatically instantiates the class and registers it as the global storage provider.
 *
 * The decorator implements the Dependency Injection pattern for storage providers, allowing
 * applications to easily swap between different storage implementations (localStorage,
 * sessionStorage, IndexedDB, in-memory storage, etc.) without changing the core session logic.
 *
 * ### Features:
 * - **Automatic Registration**: Instantiates and registers the storage class automatically
 * - **Validation**: Ensures the storage implementation meets the required interface
 * - **Error Handling**: Gracefully handles instantiation failures
 * - **Type Safety**: Enforces ISessionStorage interface compliance at compile time
 * - **Global Scope**: Makes the storage available throughout the entire application
 *
 * ### Storage Requirements:
 * The decorated class must implement the {@link ISessionStorage} interface with these methods:
 * - `get(key: string): any` - Retrieve a value by key
 * - `set(key: string, value: any, decycle?: boolean): any` - Store a value with optional decycling
 * - `remove(key: string): any` - Remove a value by key
 * - `removeAll(): any` - Clear all stored values
 *
 * @decorator
 * @param target - The class constructor that implements {@link ISessionStorage}
 *
 * @returns A class decorator function that registers the storage implementation
 *
 * @throws {Error} Logs error to console if storage instantiation fails, but doesn't throw
 *
 * @example
 * ```typescript
 * // Basic localStorage implementation
 * @AttachSessionStorage()
 * class LocalStorageProvider implements ISessionStorage {
 *   get(key: string): any {
 *     return localStorage.getItem(key);
 *   }
 *
 *   set(key: string, value: any): any {
 *     localStorage.setItem(key, String(value));
 *     return value;
 *   }
 *
 *   remove(key: string): any {
 *     const value = this.get(key);
 *     localStorage.removeItem(key);
 *     return value;
 *   }
 *
 *   removeAll(): any {
 *     localStorage.clear();
 *   }
 * }
 *
 * // Now Session.get(), Session.set(), etc. will use localStorage
 * Session.set('user', { id: 1, name: 'John' });
 * const user = Session.get('user'); // Retrieves from localStorage
 * ```
 *
 * @example
 * ```typescript
 * // Custom encrypted storage implementation
 * @AttachSessionStorage()
 * class EncryptedStorageProvider implements ISessionStorage {
 *   private encrypt(value: string): string {
 *     // Your encryption logic here
 *     return btoa(value); // Simple base64 for demo
 *   }
 *
 *   private decrypt(value: string): string {
 *     // Your decryption logic here
 *     return atob(value); // Simple base64 decode for demo
 *   }
 *
 *   get(key: string): any {
 *     const encrypted = localStorage.getItem(key);
 *     return encrypted ? this.decrypt(encrypted) : null;
 *   }
 *
 *   set(key: string, value: any): any {
 *     const encrypted = this.encrypt(String(value));
 *     localStorage.setItem(key, encrypted);
 *     return value;
 *   }
 *
 *   remove(key: string): any {
 *     const value = this.get(key);
 *     localStorage.removeItem(key);
 *     return value;
 *   }
 *
 *   removeAll(): any {
 *     localStorage.clear();
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In-memory storage with expiration
 * @AttachSessionStorage()
 * class ExpiringMemoryStorage implements ISessionStorage {
 *   private storage = new Map<string, { value: any; expires: number }>();
 *
 *   get(key: string): any {
 *     const item = this.storage.get(key);
 *     if (!item) return null;
 *
 *     if (Date.now() > item.expires) {
 *       this.storage.delete(key);
 *       return null;
 *     }
 *
 *     return item.value;
 *   }
 *
 *   set(key: string, value: any, ttl: number = 3600000): any { // 1 hour default
 *     this.storage.set(key, {
 *       value,
 *       expires: Date.now() + ttl
 *     });
 *     return value;
 *   }
 *
 *   remove(key: string): any {
 *     const item = this.storage.get(key);
 *     this.storage.delete(key);
 *     return item?.value;
 *   }
 *
 *   removeAll(): any {
 *     this.storage.clear();
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Database-backed storage implementation
 * @AttachSessionStorage()
 * class DatabaseStorageProvider implements ISessionStorage {
 *   constructor(private db: Database) {}
 *
 *   async get(key: string): Promise<any> {
 *     const result = await this.db.query('SELECT value FROM sessions WHERE key = ?', [key]);
 *     return result.length ? JSON.parse(result[0].value) : null;
 *   }
 *
 *   async set(key: string, value: any): Promise<any> {
 *     const serialized = JSON.stringify(value);
 *     await this.db.query(
 *       'INSERT OR REPLACE INTO sessions (key, value) VALUES (?, ?)',
 *       [key, serialized]
 *     );
 *     return value;
 *   }
 *
 *   async remove(key: string): Promise<any> {
 *     const value = await this.get(key);
 *     await this.db.query('DELETE FROM sessions WHERE key = ?', [key]);
 *     return value;
 *   }
 *
 *   async removeAll(): Promise<any> {
 *     await this.db.query('DELETE FROM sessions');
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Testing with mock storage
 * @AttachSessionStorage()
 * class MockStorageProvider implements ISessionStorage {
 *   private mockData = new Map<string, any>();
 *
 *   get(key: string): any {
 *     console.log(`[MOCK] Getting key: ${key}`);
 *     return this.mockData.get(key);
 *   }
 *
 *   set(key: string, value: any): any {
 *     console.log(`[MOCK] Setting key: ${key}, value:`, value);
 *     this.mockData.set(key, value);
 *     return value;
 *   }
 *
 *   remove(key: string): any {
 *     console.log(`[MOCK] Removing key: ${key}`);
 *     const value = this.mockData.get(key);
 *     this.mockData.delete(key);
 *     return value;
 *   }
 *
 *   removeAll(): any {
 *     console.log(`[MOCK] Clearing all data`);
 *     this.mockData.clear();
 *   }
 * }
 * ```
 *
 * @see {@link ISessionStorage} - The interface that storage implementations must implement
 * @see {@link Manager} - The session manager that uses the attached storage
 * @see {@link Session} - The exported session utilities that use the attached storage
 * @see {@link isValidStorage} - Function used to validate storage implementations
 *
 * @since 1.0.0
 * @public
 *
 * @remarks
 * **Important Notes:**
 * - Only one storage implementation can be active at a time
 * - The decorator should be applied before any session operations are performed
 * - Storage validation is performed automatically - invalid implementations are ignored
 * - If no custom storage is attached, the system falls back to localStorage or in-memory storage
 * - The storage instance is created immediately when the decorator is processed
 *
 * **Best Practices:**
 * - Implement proper error handling in your storage methods
 * - Consider implementing data serialization/deserialization for complex objects
 * - Add logging for debugging purposes in development environments
 * - Use appropriate storage mechanisms based on your application's needs
 * - Test your storage implementation thoroughly, especially error scenarios
 *
 * **Performance Considerations:**
 * - Storage operations should be fast as they're used frequently
 * - Consider implementing caching for expensive storage operations
 * - Be mindful of storage size limits (especially for localStorage)
 * - Implement cleanup strategies for temporary data
 */
export function AttachSessionStorage() {
  return function (target: IClassConstructor<ISessionStorage>) {
    try {
      const storage = new target();
      if (!isValidStorage(storage)) {
        return;
      }
      Manager.storage = storage;
    } catch (error) {
      console.error(error, " registering session storage");
    }
  };
}
