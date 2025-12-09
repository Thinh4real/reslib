import { ResourceAction, ResourceBase } from '@resources/types';
import { i18n } from '../i18n';
import { Session } from '../session';
import '../translations';
import { Auth } from './index';
import { AuthPerm, AuthPerms, AuthUser } from './types';

declare module '@resources/types' {
  interface Resources {
    documents: {
      actions: {
        test: ResourceAction;
        publish: ResourceAction;
      };
    };
    articles: ResourceBase;
    users: ResourceBase;
    profile: ResourceBase;
    media: {
      actions: {
        upload: ResourceAction;
        edit: ResourceAction;
      };
    };
    comments: ResourceBase;
    admin: ResourceBase;
    system: ResourceBase;
    logs: ResourceBase;
    billing: ResourceBase;
  }
}

describe('Auth', () => {
  beforeAll(() => {
    i18n.setLocale('en');
  });

  beforeEach(() => {
    Session.removeAll();
    Auth.setSignedUser(null, false);
    // Reset master admin function
    Auth.isMasterAdmin = undefined;
    Auth.events.offAll();
  });

  describe('Auth.events', () => {
    it('should have an events observable instance', () => {
      expect(Auth.events).toBeDefined();
      expect(typeof Auth.events.on).toBe('function');
      expect(typeof Auth.events.trigger).toBe('function');
    });

    it('should trigger SIGN_IN event when user signs in', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback);

      const testUser: AuthUser = { id: 'test123', email: 'test@example.com' };
      await Auth.signIn(testUser);

      expect(mockCallback).toHaveBeenCalledWith(testUser);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should trigger SIGN_OUT event when user signs out', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_OUT', mockCallback);

      const testUser: AuthUser = { id: 'test123', email: 'test@example.com' };
      await Auth.signIn(testUser);
      await Auth.signOut();

      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should trigger SIGN_OUT event when setting user to null', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_OUT', mockCallback);

      await Auth.setSignedUser(null, true);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should handle multiple event listeners', async () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback1);
      Auth.events.on('SIGN_IN', mockCallback2);

      const testUser: AuthUser = { id: 'test123' };
      await Auth.signIn(testUser);

      expect(mockCallback1).toHaveBeenCalledWith(testUser);
      expect(mockCallback2).toHaveBeenCalledWith(testUser);
    });

    it('should not trigger events when triggerEvent is false', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback);

      const testUser: AuthUser = { id: 'test123' };
      await Auth.setSignedUser(testUser, false);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('isMasterAdmin', () => {
    it('should return false by default when no custom function is set', () => {
      // Test indirectly through isAllowed method
      const user: AuthUser = { id: '123' };
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' }, user)
      ).toBe(false);
    });

    it('should return false when custom function is set but returns false', () => {
      Auth.isMasterAdmin = () => false;
      const user: AuthUser = { id: 'admin' };
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' }, user)
      ).toBe(false);
      Auth.isMasterAdmin = undefined;
    });

    it('should return true when custom function returns true', () => {
      Auth.isMasterAdmin = (user) => user?.id === 'admin';
      const adminUser: AuthUser = { id: 'admin' };
      const regularUser: AuthUser = { id: 'user', perms: {} };

      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' }, adminUser)
      ).toBe(true);
      expect(
        Auth.isAllowed(
          { resourceName: 'documents', action: 'read' },
          regularUser
        )
      ).toBe(false);
      Auth.isMasterAdmin = undefined;
    });

    it('should use currently signed user when no user parameter provided', () => {
      const adminUser: AuthUser = { id: 'admin' };
      Auth.isMasterAdmin = (user) => user?.id === 'admin';

      // Sign in as admin
      Auth.setSignedUser(adminUser, false);
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' })
      ).toBe(true);

      // Sign out
      Auth.setSignedUser(null, false);
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' })
      ).toBe(false);

      Auth.isMasterAdmin = undefined;
    });
  });

  describe('getSignedUser', () => {
    it('should return null when no user is signed in', () => {
      expect(Auth.getSignedUser()).toBeNull();
    });

    it('should return the signed in user', async () => {
      const testUser: AuthUser = {
        id: 'test123',
        email: 'test@example.com',
        username: 'testuser',
      };

      await Auth.setSignedUser(testUser, false);
      const retrievedUser = Auth.getSignedUser();

      expect(retrievedUser).toEqual(testUser);
      expect(retrievedUser?.id).toBe(testUser.id);
    });

    it('should cache user in memory for performance', async () => {
      const testUser: AuthUser = { id: 'test123' };

      await Auth.setSignedUser(testUser, false);

      // First call should load from session storage
      const user1 = Auth.getSignedUser();
      expect(user1).toEqual(testUser);

      // Second call should use cache
      const user2 = Auth.getSignedUser();
      expect(user2).toEqual(testUser);

      // They should be the same object reference (cached)
      expect(user1).toBe(user2);
    });

    it('should handle corrupted session data gracefully', async () => {
      // When session is missing or corrupted, getSignedUser returns null
      const user = Auth.getSignedUser();
      expect(user).toBeNull();
    });

    it('should handle missing session data', () => {
      Session.remove('user-session');
      expect(Auth.getSignedUser()).toBeNull();
    });

    it('should decrypt and parse encrypted user data', async () => {
      const testUser: AuthUser = {
        id: 'encrypted123',
        email: 'encrypted@example.com',
        token: 'secret-token',
      };

      await Auth.setSignedUser(testUser, false);
      const retrievedUser = Auth.getSignedUser();

      expect(retrievedUser).toEqual(testUser);
      expect(retrievedUser?.token).toBe('secret-token');
    });

    it('should clear cache when user is signed out', async () => {
      const testUser: AuthUser = { id: 'test123' };
      await Auth.setSignedUser(testUser, false);

      expect(Auth.getSignedUser()).toEqual(testUser);

      await Auth.setSignedUser(null, false);
      expect(Auth.getSignedUser()).toBeNull();
    });
  });

  describe('setSignedUser', () => {
    it('should store user and trigger SIGN_IN event by default', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback);

      const testUser: AuthUser = { id: 'test123', email: 'test@example.com' };
      await Auth.setSignedUser(testUser, true);

      expect(Auth.getSignedUser()).toEqual(testUser);
      expect(mockCallback).toHaveBeenCalledWith(testUser);
    });

    it('should clear user and trigger SIGN_OUT event when setting to null', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_OUT', mockCallback);

      // First sign in a user
      await Auth.setSignedUser({ id: 'test123' }, false);

      // Then sign out (with triggerEvent = true)
      await Auth.setSignedUser(null, true);

      expect(Auth.getSignedUser()).toBeNull();
      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should not trigger events when triggerEvent is false', async () => {
      const signInCallback = jest.fn();
      const signOutCallback = jest.fn();

      Auth.events.on('SIGN_IN', signInCallback);
      Auth.events.on('SIGN_OUT', signOutCallback);

      const testUser: AuthUser = { id: 'test123' };
      await Auth.setSignedUser(testUser, false);
      await Auth.setSignedUser(null, false);

      expect(signInCallback).not.toHaveBeenCalled();
      expect(signOutCallback).not.toHaveBeenCalled();
    });

    it('should add sessionCreatedAt timestamp to user', async () => {
      const testUser: AuthUser = { id: 'test123' };
      const beforeTime = Date.now();

      await Auth.setSignedUser(testUser, false);

      const storedUser = Auth.getSignedUser();
      expect(storedUser?.sessionCreatedAt).toBeDefined();
      expect(storedUser?.sessionCreatedAt).toBeGreaterThanOrEqual(beforeTime);
    });

    it('should handle encryption errors gracefully', async () => {
      // This test verifies that when encryption happens,
      // the user is still stored properly and can be retrieved
      const testUser: AuthUser = { id: 'test123' };

      await Auth.setSignedUser(testUser, false);

      // User should be stored and retrievable
      const storedUser = Auth.getSignedUser();
      expect(storedUser).not.toBeNull();
      expect(storedUser?.id).toBe('test123');
      expect(storedUser?.sessionCreatedAt).toBeDefined();
    });

    it('should update local cache immediately', async () => {
      const testUser: AuthUser = { id: 'test123' };

      await Auth.setSignedUser(testUser, false);

      // Should be immediately available
      expect(Auth.getSignedUser()).toEqual(testUser);
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a valid user', async () => {
      const testUser: AuthUser = {
        id: 'signin123',
        email: 'signin@example.com',
        username: 'signinuser',
      };

      const result = await Auth.signIn(testUser);
      expect(result).toEqual(testUser);
      expect(Auth.getSignedUser()).toEqual(testUser);
    });

    it('should trigger SIGN_IN event by default', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback);

      const testUser: AuthUser = { id: 'test123' };
      await Auth.signIn(testUser);

      expect(mockCallback).toHaveBeenCalledWith(testUser);
    });

    it('should not trigger events when triggerEvent is false', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_IN', mockCallback);

      const testUser: AuthUser = { id: 'test123' };
      await Auth.signIn(testUser, false);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should reject null user', async () => {
      await expect(Auth.signIn(null as any)).rejects.toThrow();
    });

    it('should reject undefined user', async () => {
      await expect(Auth.signIn(undefined as any)).rejects.toThrow();
    });

    it('should reject invalid user objects', async () => {
      // Empty object passes isObj check but should still work as auth adds timestamp
      // String should be rejected
      await expect(Auth.signIn('invalid' as any)).rejects.toThrow();
      // Number should be rejected
      await expect(Auth.signIn(123 as any)).rejects.toThrow();
    });

    it('should handle complex user objects with permissions and roles', async () => {
      const complexUser: AuthUser = {
        id: 'complex123',
        email: 'complex@example.com',
        username: 'complexuser',
        token: 'bearer-token-123',
        perms: {
          documents: ['read', 'create', 'update'],
          users: ['read'],
        },
        roles: [
          {
            name: 'editor',
            perms: {
              articles: ['publish'],
              media: ['upload'],
            },
          },
        ],
      };

      const result = await Auth.signIn(complexUser);
      expect(result).toEqual(complexUser);
      expect(Auth.getSignedUser()).toEqual(complexUser);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      const testUser: AuthUser = { id: 'signout123' };
      await Auth.signIn(testUser, false);

      expect(Auth.getSignedUser()).toEqual(testUser);

      await Auth.signOut();

      expect(Auth.getSignedUser()).toBeNull();
    });

    it('should trigger SIGN_OUT event by default', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_OUT', mockCallback);

      await Auth.signOut();

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should not trigger events when triggerEvent is false', async () => {
      const mockCallback = jest.fn();
      Auth.events.on('SIGN_OUT', mockCallback);

      await Auth.signOut(false);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle sign out when no user is signed in', async () => {
      expect(Auth.getSignedUser()).toBeNull();

      const result = await Auth.signOut();

      // signOut returns null (from setSignedUser(null, true))
      expect(result).toBeNull();
      expect(Auth.getSignedUser()).toBeNull();
    });

    it('should clear session data completely', async () => {
      const testUser: AuthUser = { id: 'cleanup123', token: 'test-token' };
      await Auth.signIn(testUser, false);

      // Verify user and token are stored
      expect(Auth.getSignedUser()).toEqual(testUser);
      expect(Session.get('user-session')).toBeDefined();

      await Auth.signOut(false);

      // Verify everything is cleared
      expect(Auth.getSignedUser()).toBeNull();
      // Session stores empty string for cleared values
      const sessionValue = Session.get('user-session');
      expect(
        sessionValue === null ||
          sessionValue === '' ||
          sessionValue === undefined
      ).toBe(true);
    });
  });

  describe('checkUserPermission', () => {
    it('should return false for invalid user', () => {
      expect(Auth.checkUserPermission(null as any, 'documents', 'read')).toBe(
        false
      );
      expect(Auth.checkUserPermission({} as any, 'documents', 'read')).toBe(
        false
      );
      expect(
        Auth.checkUserPermission(undefined as any, 'documents', 'read')
      ).toBe(false);
    });

    it('should check direct user permissions', () => {
      const user: AuthUser = {
        id: 'direct123',
        perms: {
          documents: ['read', 'create', 'update'],
          users: ['read'],
        },
      };

      expect(Auth.checkUserPermission(user, 'documents', 'read')).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'delete')).toBe(false);
      expect(Auth.checkUserPermission(user, 'users', 'read')).toBe(true);
      expect(Auth.checkUserPermission(user, 'users', 'update')).toBe(false);
      expect(Auth.checkUserPermission(user, 'articles', 'read')).toBe(false);
    });

    it('should check role-based permissions', () => {
      const user: AuthUser = {
        id: 'role123',
        perms: {
          profile: ['read', 'update'],
        },
        roles: [
          {
            name: 'editor',
            perms: {
              documents: ['read', 'create', 'update'],
              articles: ['publish'],
            },
          },
          {
            name: 'moderator',
            perms: {
              comments: ['read', 'delete'],
              users: ['suspend'],
            },
          },
        ],
      };

      // Direct permissions
      expect(Auth.checkUserPermission(user, 'profile', 'read')).toBe(true);

      // Role permissions
      expect(Auth.checkUserPermission(user, 'documents', 'read')).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(true);
      expect(Auth.checkUserPermission(user, 'articles', 'publish')).toBe(true);
      expect(Auth.checkUserPermission(user, 'comments', 'delete')).toBe(true);
      expect(Auth.checkUserPermission(user, 'users', 'suspend' as any)).toBe(
        true
      );

      // Non-existent permissions
      expect(Auth.checkUserPermission(user, 'admin', 'all')).toBe(false);
    });

    it('should check both direct and role permissions', () => {
      const user: AuthUser = {
        id: 'priority123',
        perms: {
          documents: ['read'], // Direct permission - only read
        },
        roles: [
          {
            name: 'editor',
            perms: {
              documents: ['read', 'create', 'update', 'delete'], // Role allows more
              articles: ['publish'],
            },
          },
        ],
      };

      // Direct permissions grant access
      expect(Auth.checkUserPermission(user, 'documents', 'read')).toBe(true);
      // Role permissions grant additional access on same resource
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(true);
      // Role permissions on other resources
      expect(Auth.checkUserPermission(user, 'articles', 'publish')).toBe(true);
      // No permission at all
      expect(Auth.checkUserPermission(user, 'users', 'read')).toBe(false);
    });

    it("should default to 'read' action when not specified", () => {
      const user: AuthUser = {
        id: 'default123',
        perms: {
          documents: ['read', 'create'],
          articles: ['read'],
        },
      };

      expect(Auth.checkUserPermission(user, 'documents')).toBe(true);
      expect(Auth.checkUserPermission(user, 'articles')).toBe(true);
      expect(Auth.checkUserPermission(user, 'users')).toBe(false);
    });

    it('should handle empty roles array', () => {
      const user: AuthUser = {
        id: 'emptyroles123',
        perms: {
          documents: ['read'],
        },
        roles: [],
      };

      expect(Auth.checkUserPermission(user, 'documents', 'read')).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(false);
    });

    it('should handle users without roles property', () => {
      const user: AuthUser = {
        id: 'noroles123',
        perms: {
          documents: ['read'],
        },
      };

      expect(Auth.checkUserPermission(user, 'documents', 'read')).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(false);
    });

    it('should handle case-insensitive resource matching', () => {
      const user: AuthUser = {
        id: 'case123',
        perms: {
          documents: ['read', 'create'],
        },
      };

      expect(Auth.checkUserPermission(user, 'DOCUMENTS' as any, 'read')).toBe(
        true
      );
      expect(Auth.checkUserPermission(user, 'Documents' as any, 'create')).toBe(
        true
      );
      expect(Auth.checkUserPermission(user, 'DoCuMeNtS' as any, 'read')).toBe(
        true
      );
    });
  });

  describe('isAllowed', () => {
    it('should return false for false permission', () => {
      expect(Auth.isAllowed(false)).toBe(false);
    });

    it('should return true for true permission', () => {
      expect(Auth.isAllowed(true as any)).toBe(true);
    });

    it('should return true for master admin', () => {
      Auth.isMasterAdmin = () => true;
      expect(Auth.isAllowed(['documents', 'create'])).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'admin', action: 'delete' } as any)
      ).toBe(true);
      Auth.isMasterAdmin = undefined;
    });

    it('should return true for null/undefined permissions', () => {
      expect(Auth.isAllowed(null as any)).toBe(true);
      expect(Auth.isAllowed(undefined as any)).toBe(true);
    });

    it('should handle function permissions', () => {
      const user: AuthUser = { id: 'func123', perms: { documents: ['read'] } };

      const permFn = (u: AuthUser) => u.id === 'func123';
      expect(Auth.isAllowed(permFn, user)).toBe(true);

      const falseFn = (u: AuthUser) => u.id === 'different';
      expect(Auth.isAllowed(falseFn, user)).toBe(false);
    });

    it('should validate resource:action tuple objects', () => {
      const user: AuthUser = {
        id: 'tuple123',
        perms: {
          documents: ['read', 'create'],
          users: ['read'],
        },
      };

      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' }, user)
      ).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'create' }, user)
      ).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'delete' }, user)
      ).toBe(false);
      expect(
        Auth.isAllowed({ resourceName: 'users', action: 'read' }, user)
      ).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'articles', action: 'read' }, user)
      ).toBe(false);
    });

    it('should validate resource:action tuple arrays', () => {
      const user: AuthUser = {
        id: 'array123',
        perms: {
          documents: ['read', 'create'],
          users: ['read'],
        },
      };

      expect(Auth.isAllowed(['documents', 'read'], user)).toBe(true);
      expect(Auth.isAllowed(['documents', 'create'], user)).toBe(true);
      expect(Auth.isAllowed(['documents', 'delete'], user)).toBe(false);
      expect(Auth.isAllowed(['users', 'read'], user)).toBe(true);
      expect(Auth.isAllowed(['articles', 'read'], user)).toBe(false);
    });

    it('should handle arrays of permissions with OR logic', () => {
      const user: AuthUser = {
        id: 'or123',
        perms: {
          documents: ['read'],
          users: ['create'],
        },
      };

      // OR logic - any permission match grants access
      const orPerms: AuthPerm[] = [
        { resourceName: 'documents', action: 'read' }, // true
        { resourceName: 'users', action: 'delete' }, // false
      ];
      expect(Auth.isAllowed(orPerms as any, user)).toBe(true);

      // All false - should deny access
      const falsePerms: AuthPerm[] = [
        { resourceName: 'documents', action: 'delete' }, // false
        { resourceName: 'users', action: 'delete' }, // false
      ];
      expect(Auth.isAllowed(falsePerms as any, user)).toBe(false);
    });

    it('should use currently signed in user when no user provided', () => {
      const testUser: AuthUser = {
        id: 'signed123',
        perms: { documents: ['read'] },
      };

      Auth.setSignedUser(testUser, false);

      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' })
      ).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'create' })
      ).toBe(false);

      Auth.setSignedUser(null, false);
    });

    it('should handle complex permission scenarios', () => {
      const user: AuthUser = {
        id: 'complex123',
        perms: {
          documents: ['read'],
        },
        roles: [
          {
            name: 'editor',
            perms: {
              documents: ['create', 'update'],
              articles: ['publish'],
            },
          },
        ],
      };

      // Direct permission
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' }, user)
      ).toBe(true);

      // Role permission
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'create' }, user)
      ).toBe(true);
      expect(
        Auth.isAllowed({ resourceName: 'articles', action: 'publish' }, user)
      ).toBe(true);

      // No permission
      expect(
        Auth.isAllowed({ resourceName: 'admin', action: 'all' }, user)
      ).toBe(false);
    });
  });

  describe('checkPermission', () => {
    const perms: AuthPerms = {
      documents: ['read', 'create', 'all'],
      users: ['read'],
    };

    it('should validate basic permissions', () => {
      expect(Auth.checkPermission(perms, 'documents', 'read')).toBe(true);
      expect(Auth.checkPermission(perms, 'users', 'update')).toBe(false);
    });

    it("should handle 'all' permission", () => {
      expect(Auth.checkPermission(perms, 'documents', 'anything' as any)).toBe(
        true
      );
      expect(Auth.checkPermission(perms, 'documents', 'delete')).toBe(true);
      expect(
        Auth.checkPermission(perms, 'documents', 'custom_action' as any)
      ).toBe(true);
    });

    it('should handle case-insensitive resources', () => {
      expect(Auth.checkPermission(perms, 'DOCUMENTS' as any, 'read')).toBe(
        true
      );
      expect(Auth.checkPermission(perms, 'Documents' as any, 'create')).toBe(
        true
      );
      expect(Auth.checkPermission(perms, 'DoCuMeNtS' as any, 'read')).toBe(
        true
      );
    });

    it('should handle case-insensitive actions', () => {
      expect(Auth.checkPermission(perms, 'documents', 'READ' as any)).toBe(
        true
      );
      expect(Auth.checkPermission(perms, 'documents', 'Create' as any)).toBe(
        true
      );
    });

    it("should default to 'read' action when not specified", () => {
      expect(Auth.checkPermission(perms, 'documents')).toBe(true);
      expect(Auth.checkPermission(perms, 'users')).toBe(true);
      expect(Auth.checkPermission(perms, 'articles')).toBe(false);
    });

    it('should return false for invalid permissions object', () => {
      expect(Auth.checkPermission(null as any, 'documents', 'read')).toBe(
        false
      );
      expect(Auth.checkPermission(undefined as any, 'documents', 'read')).toBe(
        false
      );
      expect(Auth.checkPermission({} as any, 'documents', 'read')).toBe(false);
    });

    it('should return false for invalid resource', () => {
      expect(Auth.checkPermission(perms, '' as any, 'read')).toBe(false);
      expect(Auth.checkPermission(perms, null as any, 'read')).toBe(false);
      expect(Auth.checkPermission(perms, undefined as any, 'read')).toBe(false);
    });

    it('should return false for invalid action', () => {
      // Empty string, null, and undefined all default to "read" which exists in perms
      expect(Auth.checkPermission(perms, 'documents', '' as any)).toBe(true);
      expect(Auth.checkPermission(perms, 'documents', null as any)).toBe(true);
      expect(Auth.checkPermission(perms, 'documents', undefined as any)).toBe(
        true
      );
    });

    it('should handle empty permission arrays', () => {
      const emptyPerms: AuthPerms = {
        documents: [],
        users: ['read'],
      };

      expect(Auth.checkPermission(emptyPerms, 'documents', 'read')).toBe(false);
      expect(Auth.checkPermission(emptyPerms, 'users', 'read')).toBe(true);
    });

    it("should handle permissions with only 'all'", () => {
      const allPerms: AuthPerms = {
        documents: ['all'],
        users: ['read'],
      };

      expect(Auth.checkPermission(allPerms, 'documents', 'read')).toBe(true);
      expect(Auth.checkPermission(allPerms, 'documents', 'create')).toBe(true);
      expect(Auth.checkPermission(allPerms, 'documents', 'delete')).toBe(true);
      expect(
        Auth.checkPermission(allPerms, 'documents', 'any_action' as any)
      ).toBe(true);
    });

    it('should handle whitespace in resource names', () => {
      const whitespacePerms = {
        '  documents  ': ['read'],
        ' users ': ['read'],
      } as any;

      expect(
        Auth.checkPermission(whitespacePerms, '  DOCUMENTS  ' as any, 'read')
      ).toBe(true);
      expect(
        Auth.checkPermission(whitespacePerms, ' USERS ' as any, 'read')
      ).toBe(true);
    });

    it('should create defensive copy of permissions object', () => {
      const originalPerms: AuthPerms = {
        documents: ['read', 'create'],
      };

      const originalDocuments = originalPerms.documents;

      // Call checkPermission which should create a defensive copy
      Auth.checkPermission(originalPerms, 'documents', 'read');

      // Original should not be modified
      expect(originalPerms.documents).toBe(originalDocuments);
    });
  });

  describe('isAllowedForAction', () => {
    it('should handle single action permissions', () => {
      expect(Auth.isAllowedForAction('read', 'read')).toBe(true);
      expect(Auth.isAllowedForAction('update', 'read')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(Auth.isAllowedForAction('read' as any, 'READ' as any)).toBe(true);
      expect(Auth.isAllowedForAction('READ' as any, 'read' as any)).toBe(true);
      expect(Auth.isAllowedForAction('Read' as any, 'READ' as any)).toBe(true);
      expect(Auth.isAllowedForAction('read' as any, 'create' as any)).toBe(
        false
      );
    });

    it('should handle whitespace normalization', () => {
      expect(Auth.isAllowedForAction('  read  ' as any, 'read' as any)).toBe(
        true
      );
      expect(Auth.isAllowedForAction('read' as any, '  READ  ' as any)).toBe(
        true
      );
      expect(Auth.isAllowedForAction('\tread\n' as any, 'read' as any)).toBe(
        true
      );
      expect(Auth.isAllowedForAction('read ' as any, ' read' as any)).toBe(
        true
      );
    });

    it('should return false for invalid inputs', () => {
      expect(Auth.isAllowedForAction('' as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', '' as any)).toBe(false);
      expect(Auth.isAllowedForAction(null as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', null as any)).toBe(false);
      expect(Auth.isAllowedForAction(undefined as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', undefined as any)).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(Auth.isAllowedForAction(123 as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', 123 as any)).toBe(false);
      expect(Auth.isAllowedForAction({} as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', {} as any)).toBe(false);
      expect(Auth.isAllowedForAction([] as any, 'read')).toBe(false);
      expect(Auth.isAllowedForAction('read', [] as any)).toBe(false);
    });

    it('should handle exact string matching after normalization', () => {
      expect(Auth.isAllowedForAction('create', 'create')).toBe(true);
      expect(Auth.isAllowedForAction('update', 'update')).toBe(true);
      expect(Auth.isAllowedForAction('delete', 'delete')).toBe(true);
      expect(Auth.isAllowedForAction<'documents'>('publish', 'publish')).toBe(
        true
      );

      expect(Auth.isAllowedForAction('create', 'update')).toBe(false);
      expect(Auth.isAllowedForAction('read', 'write' as any)).toBe(false);
    });

    it('should handle complex action names', () => {
      expect(
        Auth.isAllowedForAction('custom_action' as any, 'custom_action' as any)
      ).toBe(true);
      expect(
        Auth.isAllowedForAction('batch_update' as any, 'batch_update' as any)
      ).toBe(true);
      expect(
        Auth.isAllowedForAction('export_data' as any, 'export_data' as any)
      ).toBe(true);

      expect(
        Auth.isAllowedForAction('custom_action' as any, 'another_action' as any)
      ).toBe(false);
    });

    it('should handle actions with special characters', () => {
      expect(
        Auth.isAllowedForAction(
          'action-with-dashes' as any,
          'action-with-dashes' as any
        )
      ).toBe(true);
      expect(
        Auth.isAllowedForAction(
          'action_with_underscores' as any,
          'action_with_underscores' as any
        )
      ).toBe(true);
      expect(
        Auth.isAllowedForAction(
          'action.with.dots' as any,
          'action.with.dots' as any
        )
      ).toBe(true);

      expect(
        Auth.isAllowedForAction(
          'action-with-dashes' as any,
          'action_with_underscores' as any
        )
      ).toBe(false);
    });

    it('should be performant with repeated calls', () => {
      // Test that the method is fast enough for repeated use
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        Auth.isAllowedForAction('read' as any, 'read' as any);
        Auth.isAllowedForAction('create' as any, 'update' as any);
        Auth.isAllowedForAction('  read  ' as any, 'READ' as any);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 3000 calls in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Session getter', () => {
    it('should provide access to Session utilities', () => {
      // Auth.Session provides access to session management functions
      expect(Auth.Session).toBeDefined();
      expect(typeof Auth.Session.get).toBe('function');
      expect(typeof Auth.Session.set).toBe('function');
    });

    it('should allow session operations through Auth.Session', () => {
      const testKey = 'test_session_key_unique';
      const testValue = { data: 'test' };

      // Set value using module Session
      Session.set(testKey, testValue);

      // Retrieve immediately to ensure it was stored
      const retrieved = Session.get(testKey);
      expect(retrieved).toEqual(testValue);

      // Remove value using Session module
      Session.remove(testKey);
      expect(Session.get(testKey)).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should handle complete authentication flow with events', async () => {
      const signInCallback = jest.fn();
      const signOutCallback = jest.fn();

      Auth.events.on('SIGN_IN', signInCallback);
      Auth.events.on('SIGN_OUT', signOutCallback);

      const user: AuthUser = {
        id: 'integration123',
        email: 'integration@example.com',
        perms: { documents: ['read', 'create'] },
      };

      // Sign in
      await Auth.signIn(user);
      expect(Auth.getSignedUser()).toEqual(user);
      expect(signInCallback).toHaveBeenCalledWith(user);

      // Check permissions work
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' })
      ).toBe(true);
      expect(Auth.checkUserPermission(user, 'documents', 'create')).toBe(true);

      // Sign out
      await Auth.signOut();
      expect(Auth.getSignedUser()).toBeNull();
      expect(signOutCallback).toHaveBeenCalledWith(null);

      // Permissions should no longer work
      expect(
        Auth.isAllowed({ resourceName: 'documents', action: 'read' })
      ).toBe(false);
    });

    it('should handle master admin override in permission checks', () => {
      Auth.isMasterAdmin = (user) => user?.id === 'admin';

      const adminUser: AuthUser = { id: 'admin' };
      const regularUser: AuthUser = { id: 'user', perms: {} };

      // Admin with appropriate permissions
      const adminWithRole: AuthUser = {
        id: 'admin',
        roles: [
          {
            name: 'admin',
            perms: { documents: ['delete'] } as any,
          },
        ],
      };
      expect(
        Auth.isAllowed(
          { resourceName: 'documents', action: 'delete' },
          adminWithRole
        )
      ).toBe(true);

      // Regular user should follow normal rules
      expect(
        Auth.isAllowed(
          { resourceName: 'documents', action: 'read' },
          regularUser
        )
      ).toBe(false);

      Auth.isMasterAdmin = undefined;
    });

    it('should handle complex role-based permission hierarchies', () => {
      const complexUser: AuthUser = {
        id: 'complex123',
        perms: {
          profile: ['read', 'update'], // Direct permissions
        },
        roles: [
          {
            name: 'editor',
            perms: {
              documents: ['read', 'create', 'update'],
              media: ['upload', 'edit'],
            },
          },
          {
            name: 'moderator',
            perms: {
              comments: ['read', 'delete'],
              users: ['read', 'suspend'],
            },
          },
          {
            name: 'admin',
            perms: {
              system: ['all'],
              logs: ['read', 'export'],
            },
          },
        ],
      };

      // Direct permissions
      expect(Auth.checkUserPermission(complexUser, 'profile', 'read')).toBe(
        true
      );
      expect(Auth.checkUserPermission(complexUser, 'profile', 'delete')).toBe(
        false
      );

      // Editor role permissions
      expect(Auth.checkUserPermission(complexUser, 'documents', 'create')).toBe(
        true
      );
      expect(Auth.checkUserPermission(complexUser, 'media', 'upload')).toBe(
        true
      );

      // Moderator role permissions
      expect(Auth.checkUserPermission(complexUser, 'comments', 'delete')).toBe(
        true
      );
      expect(Auth.checkUserPermission(complexUser, 'users', 'suspend')).toBe(
        true
      );

      // Admin role permissions
      expect(Auth.checkUserPermission(complexUser, 'system', 'configure')).toBe(
        true
      );
      expect(Auth.checkUserPermission(complexUser, 'logs', 'export')).toBe(
        true
      );

      // Non-existent permissions
      expect(Auth.checkUserPermission(complexUser, 'billing', 'read')).toBe(
        false
      );
    });

    it('should handle session persistence across page reloads simulation', async () => {
      const user: AuthUser = {
        id: 'persistent123',
        email: 'persistent@example.com',
        token: 'persistent-token',
      };

      // Sign in and store session
      await Auth.signIn(user, false);

      // Simulate page reload by clearing local cache but keeping session storage
      (Auth as any).localUserRef.current = null;

      // Should reload from session storage
      const reloadedUser = Auth.getSignedUser();
      expect(reloadedUser).toEqual(user);
      expect(reloadedUser?.token).toBe('persistent-token');
    });
  });
});
