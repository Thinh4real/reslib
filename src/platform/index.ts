import 'reflect-metadata';
import { IDict } from '../types';

/**
  @group Platform 
 * Checks if the current environment is a web environment.
 * This function checks for the presence of the `window` object and its `document` property,
 * as well as the `document` object itself, to determine if the environment is a web environment.
 * @returns {boolean} True if the environment is a web environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isWeb()) {
 *   console.log("We're in a web environment!");
 * } else {
 *   console.log("We're not in a web environment.");
 * }
 * ```
 */
function isWeb(): boolean {
  /**
   * Check if the window object is defined and has a document property.
   * This is a characteristic of web environments.
   */
  const hasWindowDocument =
    typeof window !== 'undefined' && window?.document !== undefined;

  /**
   * Check if the document object is defined.
   * This is another characteristic of web environments.
   */
  const hasDocument = typeof document !== 'undefined';

  /**
   * Check if the navigator object is defined.
   * This is a web-specific object that provides information about the browser and its capabilities.
   */
  const hasNavigator = typeof navigator !== 'undefined';

  /**
   * Return true if all the above conditions are met, indicating a web environment.
   */
  return hasWindowDocument && hasDocument && hasNavigator;
}
/**
  @group Platform
 * Checks if the current environment is a Node.js environment.
 *
 * This function checks for the presence of the `process` object and its `versions` property,
 * as well as the `global` object and its `toString()` method signature, to determine if the environment is a Node.js environment.
 *
 * @returns {boolean} True if the environment is a Node.js environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isNode()) {
 *   console.log("We're in a Node.js environment!");
 * } else {
 *   console.log("We're not in a Node.js environment.");
 * }
 * ```
 */
const isNode: () => boolean = (): boolean => {
  /**
   * Try to detect Node.js environment using the process object.
   */
  try {
    /**
     * Check if the process object is defined and has a versions property with a node property.
     * This is a characteristic of Node.js environments.
     */
    if (
      typeof process !== 'undefined' &&
      process?.versions &&
      process?.versions?.node
    ) {
      return true;
    }

    /**
     * Check if the global object is defined and has a specific toString() method signature.
     * This is another characteristic of Node.js environments.
     */
    if (
      typeof global === 'object' &&
      '[object global]' === global?.toString.call(global)
    ) {
      return true;
    }
  } catch {
    // Ignore any errors that might occur during the detection process.
  }

  /**
   * If none of the above conditions are met, return false, indicating a non-Node.js environment.
   */
  return false;
};

/**
 *@group Platform 
  Checks if the current environment is an Electron environment.
 *
 * This function checks for the presence of Electron-specific properties and characteristics
 * in the `window`, `process`, and `navigator` objects to determine if the environment is an Electron environment.
 *
 * @returns {boolean} True if the environment is an Electron environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isElectron()) {
 *   console.log("We're in an Electron environment!");
 * } else {
 *   console.log("We're not in an Electron environment.");
 * }
 * ```
 */
const isElectron: () => boolean = (): boolean => {
  /**
   * Check if we're in a renderer process in Electron.
   */
  if (typeof window !== 'undefined' && window) {
    /**
     * Check if the window.process object is defined and has a type property set to 'renderer'.
     * This is a characteristic of Electron renderer processes.
     */
    if (
      typeof window?.process === 'object' &&
      (window?.process as IDict)?.type === 'renderer'
    ) {
      return true;
    }
  }

  /**
   * Check if we're in the main process of Electron.
   */
  if (
    typeof process !== 'undefined' &&
    typeof process?.versions === 'object' &&
    !!process.versions?.electron
  ) {
    /**
     * Check if the process.versions object has an electron property.
     * This is a characteristic of Electron main processes.
     */
    return true;
  }

  /**
   * Check if the user agent string indicates we're in an Electron environment.
   */
  if (
    typeof navigator === 'object' &&
    navigator &&
    typeof navigator.userAgent === 'string'
  ) {
    /**
     * Check if the user agent string contains the word 'electron' (case-insensitive).
     * This is another characteristic of Electron environments.
     */
    if (String(navigator?.userAgent).toLowerCase().indexOf('electron') >= 0) {
      return true;
    }
  }

  /**
   * If none of the above conditions are met, return false, indicating a non-Electron environment.
   */
  return false;
};

/**
  @group Platform
 * Checks if the current device is a touch device.
 *
 * This function assesses the presence of touch event support in the browser to determine if the device is a touch device.
 * It does this by attempting to create a `TouchEvent` and checking for specific properties in the `window` object.
 *
 * @returns {boolean} True if the device is a touch device, false otherwise.
 *
 * @example
 * ```typescript
 * if (isTouchDevice()) {
 *   console.log("This device supports touch!");
 * } else {
 *   console.log("This device does not support touch.");
 * }
 * ```
 */
const isTouchDevice: () => boolean = (): boolean => {
  /**
   * Check if the document object is defined.
   */
  if (typeof document !== 'undefined' && document) {
    /**
     * Try to create a TouchEvent to see if the browser supports touch events.
     */
    try {
      /**
       * If the browser supports TouchEvent, it's likely a touch device.
       */
      document.createEvent('TouchEvent');
      return true;
    } catch (e) {
      try {
        /**
         * If creating a TouchEvent fails, check for other indicators of a touch device.
         */
        /**
         * Check if the window object has an 'ontouchstart' property.
         * This is a common indicator of a touch device.
         */
        return (
          'ontouchstart' in window ||
          /**
           * Check if the window object has an 'onmsgesturechange' property.
           * This is another indicator of a touch device, although it can have some false positives.
           */
          'onmsgesturechange' in window
        );
      } catch {}
    }
  }
  /**
   * If none of the above conditions are met, return false, indicating a non-touch device.
   */
  return false;
};

/**
   @group Platform
 * Checks if the current environment is a server-side environment.
 *
 * This function assesses the presence of server-side environment characteristics,
 * such as the absence of the `window` object and the presence of the `process` object.
 *
 * @returns {boolean} True if the environment is a server-side environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isServerSide()) {
 *   console.log("We're on the server!");
 * } else {
 *   console.log("We're on the client.");
 * }
 * ```
 */
const isServerSide: () => boolean = (): boolean => {
  return typeof window === 'undefined' && typeof process !== 'undefined';
};

/**
 * Checks if the current environment is a client-side environment.
 *
 * This function assesses the presence of client-side environment characteristics,
 * such as the presence of the `window` object.
 *
 * @returns {boolean} True if the environment is a client-side environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isClientSide()) {
 *   console.log("We're on the client!");
 * } else {
 *   console.log("We're not on the client.");
 * }
 * ```
 */
const isClientSide: () => boolean = (): boolean => {
  /**
   * Check if the window object is defined and is an object.
   * This is a characteristic of client-side environments.
   */
  return typeof window !== 'undefined' && typeof window === 'object';
};

/**
  @group Platform
 * Checks if the current environment is a mobile browser.
 *
 * This function assesses the presence of mobile browser characteristics,
 * such as being in a web environment and having a user agent string that matches a mobile browser pattern.
 *
 * @returns {boolean} True if the environment is a mobile browser, false otherwise.
 *
 * @example
 * ```typescript
 * if (isMobileBrowser()) {
 *   console.log("We're on a mobile browser!");
 * } else {
 *   console.log("We're not on a mobile browser.");
 * }
 * ```
 */
const isMobileBrowser: () => boolean = (): boolean => {
  /**
   * Check if we're in a web environment.
   */
  if (!isWeb()) {
    return false;
  }

  /**
   * Check if the navigator object is defined and has a userAgent property.
   */
  if (
    typeof navigator !== 'object' ||
    !navigator ||
    typeof (navigator as { userAgent: string }).userAgent !== 'string'
  ) {
    return false;
  }

  /**
   * Check if the user agent string matches a mobile browser pattern.
   */
  const userAgent = (
    navigator as { userAgent: string }
  ).userAgent.toLowerCase();
  return /android|webos|iphone|blackberry|iemobile|opera mini/i.test(userAgent);
};

/**
  @group Platform
 * Checks if the current environment is an Android mobile browser.
 *
 * This function assesses the presence of Android mobile browser characteristics,
 * such as being in a web environment and having a user agent string that matches an Android pattern.
 *
 * @returns {boolean} True if the environment is an Android mobile browser, false otherwise.
 *
 * @example
 * ```typescript
 * if (isAndroidMobileBrowser()) {
 *   console.log("We're on an Android mobile browser!");
 * } else {
 *   console.log("We're not on an Android mobile browser.");
 * }
 * ```
 */
const isAndroidMobileBrowser: () => boolean = (): boolean => {
  /**
   * Check if we're in a web environment.
   */
  if (!isWeb()) {
    return false;
  }

  /**
   * Check if the navigator object is defined and has a userAgent property.
   */
  if (
    typeof navigator !== 'object' ||
    !navigator ||
    typeof (navigator as { userAgent: string }).userAgent !== 'string'
  ) {
    return false;
  }

  /**
   * Check if the user agent string matches an Android pattern.
   */
  const userAgent = (
    navigator as { userAgent: string }
  ).userAgent.toLowerCase();
  return /android/i.test(userAgent);
};

/**
  @group Platform
 * Checks if the current environment is a React Native WebView.
 *
 * This function assesses the presence of React Native WebView characteristics,
 * such as being in a client-side environment and having a ReactNativeWebView object with a postMessage method.
 *
 * @returns {boolean} True if the environment is a React Native WebView, false otherwise.
 *
 * @example
 * ```typescript
 * if (isReactNativeWebview()) {
 *   console.log("We're in a React Native WebView!");
 * } else {
 *   console.log("We're not in a React Native WebView.");
 * }
 * ```
 */
const isReactNativeWebview: () => boolean = (): boolean => {
  /**
   * Check if we're in a client-side environment.
   */
  if (!isClientSide()) {
    return false;
  }

  /**
   * Check if the window object has a ReactNativeWebView property.
   */
  if (!(window as IDict)?.ReactNativeWebView) {
    return false;
  }

  /**
   * Check if the ReactNativeWebView object has a postMessage method.
   */
  return (
    typeof (window as IDict)?.ReactNativeWebView?.postMessage === 'function'
  );
};

/**
  @group Platform
 * Checks if the current environment is a Darwin (macOS) environment.
 *
 * This function assesses the presence of Darwin environment characteristics,
 * such as being in a Node.js environment with a 'darwin' platform or having a platform string that starts with 'Mac'.
 *
 * @returns {boolean} True if the environment is a Darwin environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isDarwin()) {
 *   console.log("We're in a Darwin environment!");
 * } else {
 *   console.log("We're not in a Darwin environment.");
 * }
 * ```
 */
const isDarwin: () => boolean = (): boolean =>
  isNode() && process.platform === 'darwin';
/**
   @group Platform
 * Checks if the current environment is a Windows (win32) environment.
 *
 * This function assesses the presence of Windows environment characteristics,
 * such as being in a Node.js environment with a 'win32' platform or having a platform string that starts with 'Win'.
 *
 * @returns {boolean} True if the environment is a Windows environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isWin32()) {
 *   console.log("We're in a Windows environment!");
 * } else {
 *   console.log("We're not in a Windows environment.");
 * }
 * ```
 */
const isWin32: () => boolean = (): boolean =>
  isNode() && process.platform === 'win32';

/**
  @group Platform
 * Checks if the current environment is a Linux environment.
 *
 * This function assesses the presence of Linux environment characteristics,
 * such as being in a Node.js environment with a 'linux' platform.
 *
 * @returns {boolean} True if the environment is a Linux environment, false otherwise.
 *
 * @example
 * ```typescript
 * if (isLinux()) {
 *   console.log("We're in a Linux environment!");
 * } else {
 *   console.log("We're not in a Linux environment.");
 * }
 * ```
 */
const isLinux: () => boolean = (): boolean => {
  /**
   * Check if we're in a Node.js environment and the platform is 'linux'.
   */
  return isNode() && process.platform === 'linux';
};

export const Platform = {
  isWeb,
  isLinux,
  isDarwin,
  isWin32,
  isNode,
  isElectron,
  isTouchDevice,
  isServerSide,
  isClientSide,
  isMobileBrowser,
  isAndroidMobileBrowser,
  isReactNativeWebview,
};
