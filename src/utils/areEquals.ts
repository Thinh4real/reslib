let hasElementType = typeof Element !== 'undefined';
let hasMap = typeof Map === 'function';
let hasSet = typeof Set === 'function';
let hasArrayBuffer = typeof ArrayBuffer === 'function' && !!ArrayBuffer.isView;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function equals(a: any, b: any) {
  if (a === b) return true;
  if (
    hasArrayBuffer &&
    (ArrayBuffer.isView(a) || a instanceof ArrayBuffer) &&
    (ArrayBuffer.isView(b) || b instanceof ArrayBuffer)
  ) {
    let length = a.byteLength;
    if (length != b.byteLength) return false;
    // Create typed array views of the ArrayBuffer objects
    const view1 = new Int32Array(a as ArrayBuffer);
    const view2 = new Int32Array(b as ArrayBuffer);
    for (let i = length; i-- !== 0; ) {
      if (view1[i] !== view2[i]) return false;
    }
    return true;
  }
  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;
    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (!equals(a[i], b[i])) return false;
      return true;
    }
    let it;
    if (hasMap && a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      it = a.entries();
      while (!(i = it.next()).done) if (!b.has(i.value[0])) return false;
      it = a.entries();
      while (!(i = it.next()).done)
        if (!equals(i.value[1], b.get(i.value[0]))) return false;
      return true;
    }

    if (hasSet && a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      it = a.entries();
      while (!(i = it.next()).done) if (!b.has(i.value[0])) return false;
      return true;
    }

    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (
      a.valueOf !== Object.prototype.valueOf &&
      typeof a.valueOf === 'function' &&
      typeof b.valueOf === 'function'
    )
      return a.valueOf() === b.valueOf();
    if (
      a.toString !== Object.prototype.toString &&
      typeof a.toString === 'function' &&
      typeof b.toString === 'function'
    )
      return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    if (hasElementType && a instanceof Element) return false;

    for (i = length; i-- !== 0; ) {
      if (
        (keys[i] === '_owner' || keys[i] === '__v' || keys[i] === '__o') &&
        a.$$typeof
      ) {
        continue;
      }
      if (!equals(a[keys[i]], b[keys[i]])) return false;
    }
    return true;
  }
  return a !== a && b !== b;
}

/**
 * Checks if two values are equal.
 *
 * This function performs a deep comparison of the two values, checking if they are equal.
 * It handles various types, including arrays, maps, sets, and objects.
 *
 * @param {any} a The first value to compare.
 * @param {any} b The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 *
 * @example
 * areEquals(1, 1); // true
 * areEquals(1, 2); // false
 * areEquals({ a: 1 }, { a: 1 }); // true
 * areEquals({ a: 1 }, { a: 2 }); // false
 * areEquals([1, 2], [1, 2]); // true
 * areEquals([1, 2], [1, 3]); // false
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function areEquals(a: any, b: any) {
  try {
    return equals(a, b);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
  } catch (e) {}
  return false;
}
