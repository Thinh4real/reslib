import { getGlobal, Global } from '../global';

describe('getGlobal', () => {
  it('should return an object', () => {
    const result = getGlobal();
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  it('should return the global object in Node.js environment', () => {
    const result = getGlobal();
    // In Node.js, it should return the global object
    expect(result).toBeDefined();
    expect((result as any).process).toBeDefined();
    expect(result as any).toBeDefined();
    expect(result as any).toBe(result);
  });

  it('should handle different environments by checking typeof', () => {
    // The function checks typeof window, self, global, globalThis in order
    // In Node.js test environment, global is defined, so it returns global
    expect(getGlobal()).toBe(globalThis);
  });
});

describe('Global', () => {
  it('should be the result of calling getGlobal', () => {
    expect(Global).toBe(getGlobal());
  });

  it('should be a constant value', () => {
    const global1 = Global;
    const global2 = Global;
    expect(global1).toBe(global2);
  });

  it('should be an object', () => {
    expect(typeof Global).toBe('object');
    expect(Global).not.toBeNull();
  });

  it('should have expected global properties in Node.js environment', () => {
    expect(Global).toBeDefined();
    expect(typeof Global).toBe('object');
    // Common Node.js global properties
    expect((Global as any).process).toBeDefined();
    expect((Global as any).console).toBeDefined();
    expect((Global as any).Buffer).toBeDefined();
    expect((Global as any).global).toBe(Global);
  });
});
