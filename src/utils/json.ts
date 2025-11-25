/***
 * A helper class to handle json
 *
 */
export class JsonHelper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static decycle(obj: any, stack: Array<any> = []): any {
    /**
     * If the object is a function, return undefined.
     */
    if (typeof obj === 'function') {
      return undefined;
    }

    /**
     * If the object is not an object, return it as is.
     */
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    /**
     * If the object is already in the stack, return null to avoid infinite recursion.
     */
    if (stack.includes(obj)) {
      return null;
    }

    /**
     * Create a new stack by concatenating the current stack with the current object.
     */
    let s = stack.concat([obj]);

    /**
     * If the object is an array, decycle each element recursively.
     */
    if (Array.isArray(obj)) {
      return obj.map((x) => JsonHelper.decycle(x, s));
    }

    /**
     * If the object is an object, decycle each property recursively.
     */
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, JsonHelper.decycle(v, s)])
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static stringify(jsonObj: any, decylcleVal: boolean = false): string {
    if (typeof jsonObj === 'string') {
      return jsonObj;
    }
    return JSON.stringify(
      decylcleVal !== false ? JsonHelper.decycle(jsonObj) : jsonObj
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isJSON(json_string: any): boolean {
    // We only consider strings as valid JSON input for this helper
    if (typeof json_string !== 'string') {
      return false;
    }

    const text = json_string.trim();
    if (text.length === 0) {
      return false;
    }

    // For the helper we only want to parse object/array JSON strings, not
    // primitive JSON values like numbers, booleans or quoted strings.
    // Quick check for starting token helps avoid parsing primitives.
    const first = text[0];
    if (first !== '{' && first !== '[') {
      return false;
    }

    try {
      const parsed = JSON.parse(text);
      // Only accept objects or arrays as the parse root
      return parsed !== null && typeof parsed === 'object';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse<T = any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonStr: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviver?: (this: any, key: string, value: any) => any
  ): T {
    // If the input is a string, try to parse any valid JSON value (objects, arrays, or primitives)
    if (typeof jsonStr === 'string') {
      try {
        const parsed = JSON.parse(jsonStr, reviver);
        jsonStr = parsed;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Not a JSON string: return original input
        return jsonStr;
      }
    }
    // If the value is an object, recursively parse each property
    if (jsonStr && typeof jsonStr === 'object') {
      for (const i in jsonStr) {
        const json = jsonStr[i];
        if (JsonHelper.isJSON(json)) {
          jsonStr[i] = JsonHelper.parse(json, reviver);
        }
      }
    }
    return jsonStr;
  }
}
