import { debounce } from '../debounce';

describe('debounce', () => {
  let mockFn: jest.MockedFunction<(...args: any[]) => any>;

  beforeEach(() => {
    mockFn = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should delay function execution', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call function only once for multiple rapid calls', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call function with correct arguments', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 123);
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should call function with correct this context', () => {
      const debouncedFn = debounce(function (this: any) {
        mockFn(this);
      }, 100);

      const context = { test: 'value' };
      debouncedFn.call(context);
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith(context);
    });
  });

  describe('leading option', () => {
    it('should invoke function on leading edge when leading is true', () => {
      const debouncedFn = debounce(mockFn, 100, {
        leading: true,
        trailing: false,
      });

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Should not call again immediately
      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should invoke function on trailing edge when leading is true and trailing is true', () => {
      const debouncedFn = debounce(mockFn, 100, {
        leading: true,
        trailing: true,
      });

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not invoke on leading edge when leading is false', () => {
      const debouncedFn = debounce(mockFn, 100, { leading: false });

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('trailing option', () => {
    it('should invoke function on trailing edge by default', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not invoke on trailing edge when trailing is false', () => {
      const debouncedFn = debounce(mockFn, 100, { trailing: false });

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should invoke on trailing edge when trailing is explicitly true', () => {
      const debouncedFn = debounce(mockFn, 100, { trailing: true });

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('maxWait option', () => {
    it('should invoke function after maxWait even if wait time not reached', () => {
      const debouncedFn = debounce(mockFn, 100, { maxWait: 50 });

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxWait with leading option', () => {
      const debouncedFn = debounce(mockFn, 100, { leading: true, maxWait: 50 });

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Call again quickly
      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should reset maxWait timer on each call', () => {
      const debouncedFn = debounce(mockFn, 100, { maxWait: 80 });

      debouncedFn();
      jest.advanceTimersByTime(30);
      debouncedFn(); // Reset maxWait timer
      jest.advanceTimersByTime(30);
      debouncedFn(); // Reset again

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50); // 30 + 30 + 50 = 110 > 80
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel method', () => {
    it('should cancel pending invocation', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      debouncedFn.cancel();
      jest.advanceTimersByTime(100);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should reset internal state when cancelled', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn.cancel();

      // Call again after cancel
      debouncedFn();
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush method', () => {
    it('should immediately invoke pending function', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      const result = debouncedFn.flush();
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockFn.mock.results[0].value);
    });

    it('should return undefined if no pending call', () => {
      const debouncedFn = debounce(mockFn, 100);

      const result = debouncedFn.flush();
      expect(result).toBeUndefined();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should cancel timer after flush', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn.flush();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isPending method', () => {
    it('should return true when function is pending', () => {
      const debouncedFn = debounce(mockFn, 100);

      expect(debouncedFn.isPending()).toBe(false);

      debouncedFn();
      expect(debouncedFn.isPending()).toBe(true);

      jest.advanceTimersByTime(100);
      expect(debouncedFn.isPending()).toBe(false);
    });

    it('should return false after cancel', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(debouncedFn.isPending()).toBe(true);

      debouncedFn.cancel();
      expect(debouncedFn.isPending()).toBe(false);
    });

    it('should return false after flush', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(debouncedFn.isPending()).toBe(true);

      debouncedFn.flush();
      expect(debouncedFn.isPending()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle wait time of 0', () => {
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid calls with different arguments', () => {
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle functions that return values', () => {
      const originalFn = jest.fn(() => 'result');
      const debouncedFn = debounce(originalFn, 100);

      const result = debouncedFn();
      expect(result).toBeUndefined(); // Not called yet

      jest.advanceTimersByTime(100);
      expect(originalFn).toHaveBeenCalledTimes(1);
    });

    it('should handle functions that throw errors', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(errorFn, 100);

      debouncedFn();
      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow('Test error');
    });
  });

  describe('return type', () => {
    it('should return the correct type for DebouncedFunction', () => {
      const fn = (x: number) => x * 2;
      const debouncedFn = debounce(fn, 100);

      expect(typeof debouncedFn).toBe('function');
      expect(typeof debouncedFn.cancel).toBe('function');
      expect(typeof debouncedFn.flush).toBe('function');
      expect(typeof debouncedFn.isPending).toBe('function');
    });
  });
});
