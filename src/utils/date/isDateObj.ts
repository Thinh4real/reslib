/**
 * Checks if the given object is a valid date object.
 *
 * @param {any} dateObj The object to check.
 * @returns {boolean} True if the object is a valid date object, false otherwise.
 *
 * Example:
 * ```ts
 * console.log(DateHelper.DateHelper.isDateObj(new Date())); // Output: true
 * console.log(DateHelper.DateHelper.isDateObj({})); // Output: false
 * console.log(DateHelper.DateHelper.isDateObj("2022-01-01")); // Output: false
 * ```
 */
export function isDateObj(dateObj: any): dateObj is Date {
  /**
   * If the object is null or not an object, return false.
   *
   * This is the first check to quickly eliminate invalid inputs.
   */
  if (!dateObj || typeof dateObj !== "object") return false;

  /**
   * If the object is an instance of the Date class, return true.
   *
   * This check is straightforward, as Date objects are the most common type of date objects.
   */
  if (dateObj instanceof Date) return true;

  /**
   * If the object does not have a getTime method, return false.
   *
   * The getTime method is a key method for date objects, so its absence is a strong indication that the object is not a date object.
   */
  if (typeof dateObj.getTime !== "function") return false;

  /**
   * Check if the object's toString method returns '[object Date]' and if its getTime method returns a valid number.
   *
   * This final check verifies that the object has the correct toString representation and that its getTime method returns a valid timestamp.
   */
  return !(Object.prototype.toString.call(dateObj) !== "[object Date]" || isNaN(dateObj.getTime()));
}
