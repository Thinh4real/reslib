/**
 * Options for customizing the debounce function behavior
 */
export interface IDebounceOptions {
  /**
   * If true, the debounced function will be invoked on the leading edge of the timeout
   * instead of the trailing edge
   */
  leading?: boolean;
  /**
   * If true, the debounced function will be invoked on the trailing edge of the timeout
   */
  trailing?: boolean;
  /**
   * Maximum time the debounced function is allowed to be delayed before it's invoked
   */
  maxWait?: number;
}

/**
 * A debounced function that can be invoked, cancelled, and flushed
 */
export interface IDebouncedFunction<T extends (...args: any[]) => any> {
  /**
   * Invokes the debounced function
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;
  /**
   * Cancels any pending invocation of the debounced function
   */
  cancel: () => void;
  /**
   * Immediately invokes any pending debounced function call
   */
  flush: () => ReturnType<T> | undefined;
  /**
   * Returns true if there's a pending debounced function call
   */
  isPending: () => boolean;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * The debounced function comes with methods to cancel delayed func invocations and to flush them immediately.
 * Provide options to indicate whether func should be invoked on the leading and/or trailing edge of the wait timeout.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param options The options object with leading, trailing, and maxWait properties
 * @returns A debounced version of the function with cancel, flush, and isPending methods
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait = 0, options: IDebounceOptions = {}): IDebouncedFunction<T> {
  options = Object.assign({}, options);
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let maxWait: number | undefined;
  let result: ReturnType<T> | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  // Default options
  const leading = !!options.leading;
  const trailing = options.trailing !== false; // Default to true

  // Check if maxWait is provided
  if (options.maxWait !== undefined) {
    maxWait = options.maxWait;
  }

  // Get the current timestamp using the most appropriate method
  const getTime = () => Date.now();

  // Determine if we should invoke the function
  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);

    // Always invoke if this is the first call or trailing option is enabled and enough time has passed
    if (lastCallTime === undefined || timeSinceLastCall >= wait) {
      return true;
    }

    // If maxWait is set, check if enough time has passed
    if (maxWait !== undefined) {
      const timeSinceLastInvoke = time - lastInvokeTime;
      return timeSinceLastInvoke >= maxWait;
    }

    return false;
  }

  // Invoke the function with the stored args and context
  function invokeFunc(time: number): ReturnType<T> | undefined {
    const args = lastArgs;
    const thisArg = lastThis;

    // Reset last args to prepare for next call
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args as Parameters<T>);
    return result;
  }

  // Start a timer for the trailing edge call
  function startTimer(pendingFunc: () => void, wait: number): ReturnType<typeof setTimeout> {
    return setTimeout(pendingFunc, wait);
  }

  // Cancel any pending timer
  function cancelTimer() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  }

  // The main debounced function logic
  function timerExpired() {
    const time = getTime();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    // Schedule next timer - calculate remaining wait time
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    let timeWaiting = wait - timeSinceLastCall;

    // If maxWait is set, calculate the remaining max wait time
    if (maxWait !== undefined) {
      const remainingMaxWait = maxWait - timeSinceLastInvoke;
      timeWaiting = Math.min(timeWaiting, remainingMaxWait);
    }

    timerId = startTimer(timerExpired, timeWaiting);
  }

  // Handle leading edge invocation
  function leadingEdge(time: number): ReturnType<T> | undefined {
    // Set last invoke time
    lastInvokeTime = time;

    // Start timer for trailing edge
    timerId = startTimer(timerExpired, wait);

    // Invoke the function if leading is enabled
    return leading ? invokeFunc(time) : result;
  }

  // Handle trailing edge invocation
  function trailingEdge(time: number): ReturnType<T> | undefined {
    timerId = undefined;

    // Only invoke if we have lastArgs, which means func has been called at least once
    // and trailing option is enabled
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    // Reset lastArgs and lastThis to avoid memory leaks
    lastArgs = undefined;
    lastThis = undefined;

    return result;
  }

  // The main debounced function
  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = getTime();
    const isInvoking = shouldInvoke(time);

    // Store the args and this context for later use
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      // If there's no timer, this is the leading edge
      if (timerId === undefined) {
        return leadingEdge(time);
      }

      // Handle maxWait case
      if (maxWait !== undefined) {
        // Start timer for the trailing edge
        cancelTimer();
        timerId = startTimer(timerExpired, wait);

        // Invoke the function immediately
        return invokeFunc(time);
      }
    }

    // Start a timer for the trailing edge if not already running
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }

    return result;
  }

  // Add cancel method to clear the timer and reset state
  debounced.cancel = function cancel(): void {
    if (timerId !== undefined) {
      cancelTimer();
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
  };

  // Add flush method to immediately invoke the function if it's pending
  debounced.flush = function flush(): ReturnType<T> | undefined {
    if (timerId !== undefined) {
      return trailingEdge(getTime());
    }
    return result;
  };

  // Add isPending method to check if the function is waiting to be invoked
  debounced.isPending = function isPending(): boolean {
    return timerId !== undefined;
  };

  return debounced;
}
