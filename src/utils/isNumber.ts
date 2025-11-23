/***
    Check if the value is a number
    @param {any} value - The value to check.
    @returns {boolean} - Returns true if the value is a number, false otherwise.
*/
export function isNumber(value: any) : value is number{
    return typeof value === 'number' && !isNaN(value);
}