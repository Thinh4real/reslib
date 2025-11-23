import { IDateFormat } from "../../types";
import { DateHelper } from "./dateHelper";

export { DateHelper };
/**
 * Global interface extension for the Date object.
 *
 * This extension adds several utility methods to the Date object for formatting and manipulating dates.
 */
declare global {
  interface Date {
    /**
     * Returns the date in SQL date format (YYYY-MM-DD).
     *
     * @returns The date in SQL date format.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.toSQLDateFormat()); // Output: YYYY-MM-DD
     * ```
     */
    toSQLDateFormat: () => string;

    /**
     * Returns the date in SQL datetime format (YYYY-MM-DD HH:MM:SS).
     *
     * @returns The date in SQL datetime format.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.toSQLDateTimeFormat()); // Output: YYYY-MM-DD HH:MM:SS
     * ```
     */
    toSQLDateTimeFormat: () => string;

    /**
     * Returns the date in SQL time format (HH:MM:SS).
     *
     * @returns The date in SQL time format.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.toSQLTimeFormat()); // Output: HH:MM:SS
     * ```
     */
    toSQLTimeFormat: () => string;

    /**
     * Resets the hours of the date to 0.
     *
     * @returns The date with hours reset to 0.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.resetHours()); // Output: Date with hours reset to 0
     * ```
     */
    resetHours: () => Date;

    /**
     * Resets the minutes of the date to 0.
     *
     * @returns The date with minutes reset to 0.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.resetMinutes()); // Output: Date with minutes reset to 0
     * ```
     */
    resetMinutes: () => Date;

    /**
     * Resets the seconds of the date to 0.
     *
     * @returns The date with seconds reset to 0.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.resetSeconds()); // Output: Date with seconds reset to 0
     * ```
     */
    resetSeconds: () => Date;

    /***
     * Resets the milliseconds of the date to 0.
     *
     * @returns The date with milliseconds reset to 0.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.resetMilliseconds()); // Output: Date with milliseconds reset to 0
     * ```
     */
    resetMilliseconds: () => Date;

    /**
     * Resets the hours, minutes, and seconds of the date to 0.
     *
     * @returns The date with hours, minutes, and seconds reset to 0.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.resetHours2Minutes2Seconds()); // Output: Date with hours, minutes, and seconds reset to 0
     * ```
     */
    resetHours2Minutes2Seconds: () => Date;

    /**
     * Adds a specified number of years to the date.
     *
     * @param years The number of years to add.
     * @returns The date with the specified number of years added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addYears(1)); // Output: Date with 1 year added
     * ```
     */
    addYears: (years: number) => Date;

    /**
     * Adds a specified number of months to the date.
     *
     * @param months The number of months to add.
     * @returns The date with the specified number of months added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addMonths(1)); // Output: Date with 1 month added
     * ```
     */
    addMonths: (months: number) => Date;

    /**
     * Adds a specified number of minutes to the date.
     *
     * @param minutes The number of minutes to add.
     * @returns The date with the specified number of minutes added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addMinutes(1)); // Output: Date with 1 minute added
     * ```
     */
    addMinutes: (minutes: number) => Date;

    /**
         * Adds a specified number of seconds to the date.
         * 
         * @param seconds The number of seconds to add.
         * @returns The date with the specified number of seconds added.
         * 
        Example:
         * ```ts
         * const date = new Date();
         * console.log(date.addSeconds(1)); // Output: Date with 1 second added
         * ```
         */
    addSeconds: (seconds: number) => Date;

    /**
     * Adds a specified number of days to the date.
     *
     * @param days The number of days to add.
     * @returns The date with the specified number of days added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addDays(1)); // Output: Date with 1 day added
     * ```
     */
    addDays: (days: number) => Date;

    /**
     * Adds a specified number of weeks to the date.
     *
     * @param weeks The number of weeks to add.
     * @returns The date with the specified number of weeks added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addWeeks(1)); // Output: Date with 1 week added
     * ```
     */
    addWeeks: (weeks: number) => Date;

    /**
     * Adds a specified number of hours to the date.
     *
     * @param hours The number of hours to add.
     * @returns The date with the specified number of hours added.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.addHours(1)); // Output: Date with 1 hour added
     * ```
     */
    addHours: (hours: number) => Date;

    /**
     * Formats the date according to a specified format string.
     *
     * @param format The format string to use.
     * @returns The formatted date string.
     *
     * Example:
     * ```ts
     * const date = new Date();
     * console.log(date.toFormat("YYYY-MM-DD HH:mm:ss")); // Output: Formatted date string
     * ```
     */
    toFormat: (format?: IDateFormat) => string;
  }
}

/**
 * Returns the date in SQL datetime format (YYYY-MM-DD HH:MM:SS).
 *
 * @returns The date in SQL datetime format.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.toSQLDateTimeFormat()); // Output: YYYY-MM-DD HH:MM:SS
 * ```
 */
Date.prototype.toSQLDateTimeFormat = function (): string {
  /**
   * Use the dateToSQLDateTimeFormat function to convert the current date to a SQL datetime string.
   */
  return DateHelper.toSQLDateTimeFormat(this);
};

/**
 * Returns the date in SQL date format (YYYY-MM-DD).
 *
 * @returns The date in SQL date format.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.toSQLDateFormat()); // Output: YYYY-MM-DD
 * ```
 */
Date.prototype.toSQLDateFormat = function (): string {
  /**
   * Use the dateToSQLFormat function to convert the current date to a SQL date string.
   */
  return DateHelper.toSQLDateFormat(this);
};

/**
 * Returns the date in SQL time format (HH:MM:SS).
 *
 * @returns The date in SQL time format.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.toSQLTimeFormat()); // Output: HH:MM:SS
 * ```
 */
Date.prototype.toSQLTimeFormat = function (): string {
  /**
   * Use the toSQLTimeFormat function to convert the current date to a SQL time string.
   */
  return DateHelper.toSQLTimeFormat(this);
};

/**
 * Resets the hours of the date to 0.
 *
 * @returns The date with hours reset to 0.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.resetHours()); // Output: Date with hours reset to 0
 * ```
 */
Date.prototype.resetHours = function () {
  this.setHours(0);
  return this;
};

/**
 * Resets the minutes of the date to 0.
 *
 * @returns The date with minutes reset to 0.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.resetMinutes()); // Output: Date with minutes reset to 0
 * ```
 */
Date.prototype.resetMinutes = function () {
  this.setMinutes(0);
  return this;
};

/**
 * Resets the seconds of the date to 0.
 *
 * @returns The date with seconds reset to 0.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.resetSeconds()); // Output: Date with seconds reset to 0
 * ```
 */
Date.prototype.resetSeconds = function () {
  this.setSeconds(0);
  return this;
};
Date.prototype.resetMilliseconds = function () {
  this.setMilliseconds(0);
  return this;
};
/**
 * Resets the hours, minutes, and seconds of the date to 0.
 *
 * @returns The date with hours, minutes, and seconds reset to 0.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.resetHours2Minutes2Seconds()); // Output: Date with hours, minutes, and seconds reset to 0
 * ```
 */
Date.prototype.resetHours2Minutes2Seconds = function () {
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
  this.setMilliseconds(0);
  return this;
};

/**
 * Formats the date according to a specified format string.
 *
 * @param format The format string to use.
 * @returns The formatted date string.
 *
 * Example:
 * ```ts
 * const date = new Date();
 * console.log(date.toFormat("YYYY-MM-DD HH:mm:ss")); // Output: Formatted date string
 * ```
 */
Date.prototype.toFormat = function (format?: IDateFormat) {
  return DateHelper.formatDate(this, format);
};

Date.prototype.addYears = function (years: number) {
  return DateHelper.addYears(years, this);
};

Date.prototype.addMonths = function (months: number) {
  return DateHelper.addMonths(months, this);
};

Date.prototype.addMinutes = function (minutes: number) {
  return DateHelper.addMinutes(minutes, this);
};

Date.prototype.addSeconds = function (seconds: number) {
  return DateHelper.addSeconds(seconds, this);
};

Date.prototype.addDays = function (days: number) {
  return DateHelper.addDays(days, this);
};

Date.prototype.addWeeks = function (weeks: number) {
  return DateHelper.addWeeks(weeks, this);
};

Date.prototype.addHours = function (hours: number) {
  return DateHelper.addHours(hours, this);
};
