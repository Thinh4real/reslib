
/**
 * Checks if a value is nullable (null, undefined, NaN, or empty string).
 * 
 * @param value - The value to check
 * @returns True if the value is considered nullable, false otherwise
 */
export function isNullable<T>(value: T): value is T {
    // Check for null or undefined
    if (value === null || value === undefined) {
        return true;
    }

    // Check for NaN (Not a Number)
    if (typeof value === 'number' && isNaN(value)) {
        return true;
    }

    // Check for empty string
    if (typeof value === 'string' && value.trim() === '') {
        return true;
    }
    return false;
}