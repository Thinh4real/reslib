import { I18n } from "@/i18n";
import { IDateFormat } from "@/types";
import { defaultStr } from "@utils/defaultStr";
import { isEmpty } from "@utils/isEmpty";
import { isNonNullString } from "@utils/isNonNullString";
import { isNumber } from "@utils/isNumber";
import moment from "moment";
import { isDateObj } from "./isDateObj";
/**
 * Result object returned by the date parser
 */
export interface IDateHelperResult {
  /** The parsed Date object if successful */
  date: Date | null;
  /** The format that successfully parsed the date string, if any */
  matchedFormat: string | null;
  /** Whether the parsing was successful */
  isValid: boolean;
  /** Any error message if parsing failed */
  error?: string;
}

export class DateHelper {
  /**
   * Comprehensive collection of date formats supported by Moment.js
   */
  static DATE_FORMATS: Array<string> = [
    /** ISO 8601 formats */
    "YYYY-MM-DD",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ss[Z]",
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "YYYY-MM-DDTHH:mm:ss.SSSZ ",
    "YYYY-MM-DDTHH:mm:ss.SSS",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD HH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "YYYY-MM-DD HH:mm:ssZ",
    "YYYY-MM-DD HH:mmZ",

    /** US formats */
    "MM/DD/YYYY",
    "MM-DD-YYYY",
    "MM.DD.YYYY",
    "MM/DD/YY",
    "MMMM DD, YYYY",
    "MMM DD, YYYY",
    /** European formats */
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "DD.MM.YYYY",
    "DD/MM/YY",
    "DD MMMM YYYY",
    "DD MMM YYYY",
    /** Time formats */
    "HH:mm:ss.SSSZ",
    "HH:mm:ssZ",
    "HH:mmZ",
    "YYYYMMDD", //20250225
    "YYYYMMDDTHHMM", //20250225T1230
    "YYYYMMDDTHHMMSS", //20250225T123045
    "HH:mm:ss",
    "HH:mm",
    "hh:mm A",
    "h:mm A",
    "HH:mm:ss.SSS",
    /** Relative formats */
    "YYYY-DDD",
    "YYYY-Www",
    "YYYY-Www-D",

    // Common Date Formats
    "YYYY/MM/DD", // "2024/02/20"
    "YYYY.MM.DD", // "2024.02.20"
    "MMM D, YYYY", // "Feb 20, 2024"
    "MMMM D, YYYY", // "February 20, 2024"
    "D MMM YYYY", // "20 Feb 2024"
    "D MMMM YYYY", // "20 February 2024"
    "MMM D YYYY", // "Feb 20 2024"

    // RFC 2822 Formats
    "ddd, DD MMM YYYY HH:mm:ss ZZ", // "Tue, 20 Feb 2024 15:30:00 +0000"
    "ddd, DD MMM YYYY HH:mm:ss", // "Tue, 20 Feb 2024 15:30:00"
    "dddd, MMMM D, YYYY", // "Tuesday, February 20, 2024"
    "dddd, D MMMM YYYY", // "Tuesday, 20 February 2024"

    // Time Formats
    "hh:mm:ss A", // "03:30:45 PM"
    "H:mm:ss", // "15:30:45"

    // Week-based Date Formats
    "YYYY-[W]WW", // "2024-W08"
    "YYYY-[W]WW-E", // "2024-W08-2"

    // Custom Date Formats
    "YYYY-MM-DDTHH:mm:ss.SSS", // "2024-02-20T15:30:00.000"
    "DD-MM-YYYY HH:mm:ss", // "20-02-2024 15:30:00"
    "YYYY/MM/DD HH:mm:ss", // "2024/02/20 15:30:00"
    "YYYY.MM.DD HH:mm:ss", // "2024.02.20 15:30:00"
    "DD/MM/YYYY HH:mm:ss", // "20/02/2024 15:30:00"

    // Natural language and loose formats
    "MMM D YYYY, h:mm a", // "Feb 20 2024, 3:30 pm"
    "MMMM D YYYY, h:mm a", // "February 20 2024, 3:30 pm"
    "h:mm A MMM D, YYYY", // "3:30 PM Feb 20, 2024"
    "MMMM D, YYYY", // "February 20, 2024"

    // Short Year Formats
    "YY-MM-DD", // "24-02-20"
    "DD-MM-YY", // "20-02-24"
    "MM/DD/YY", // "02/20/24"

    // Additional variations
    "MMM DD, YY", // "Feb 20, 24"
    "D MMM YY", // "20 Feb 24"
    "D MMMM YY", // "20 February 24"
    "YYYY MMM D", // "2024 Feb 20"
    "YYYY-MM-DD HH:mm", // "2024-02-20 15:30"
    "YYYY-MM-DD HH:mm:ss.SSS", // "2024-02-20 15:30:00.000"
  ];
  /**
   * Parses a date string using an exhaustive list of commonly used date formats.
   * The function attempts to parse the input string using multiple format patterns
   * and returns the first successful match along with additional parsing information.
   *
   * @param dateString - The date string to parse
   * @param preferredFormats - Optional array of preferred formats to try first
   * @returns A {@link IDateHelperResult} object containing the parsing results
   *
   * @example
   * ```typescript
   * // Parse an ISO date string
   * const result = parseDateString('2024-02-20');
   * if (result.isValid) {
   *   console.log(result.date); // 2024-02-20T00:00:00.000Z
   *   console.log(result.matchedFormat); // 'YYYY-MM-DD'
   * }
   *
   * // Parse with preferred formats
   * const customResult = parseDateString('02/20/2024', ['MM/DD/YYYY']);
   * ```
   *
   * @throws Will not throw errors, but returns error information in the result object
   *
   * @remarks
   * The function tries formats in the following order:
   * 1. Preferred formats (if provided)
   * 2. ISO 8601 formats
   * 3. US formats
   * 4. European formats
   * 5. Time formats
   * 6. Relative formats
   */
  static parseString(
    dateString: string,
    preferredFormats?: string[] | string
  ): IDateHelperResult {
    if (isNonNullString(dateString) && isNonNullString(preferredFormats)) {
      try {
        const date = moment(dateString, preferredFormats, true);
        if (date.isValid()) {
          return {
            date: date.toDate(),
            matchedFormat: preferredFormats,
            isValid: true,
          };
        }
      } catch (error) {}
    }
    try {
      // First try preferred formats if provided
      if (Array.isArray(preferredFormats) && preferredFormats?.length) {
        for (const format of preferredFormats) {
          const r = parseDString(dateString, format);
          if (r) {
            return r;
          }
        }
      }

      // Try all format categories
      for (const format of DateHelper.DATE_FORMATS) {
        const r = parseDString(dateString, format);
        if (r) {
          return r;
        }
      }
      return {
        date: null,
        matchedFormat: null,
        isValid: false,
        error: "Unable to parse date string with any known format",
      };
    } catch (error) {
      return {
        date: null,
        matchedFormat: null,
        isValid: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while parsing date",
      };
    }
  }

  /**
   * Converts a JavaScript Date object or string to ISO 8601 format in UTC (with 'Z' suffix).
   *
   * @param localDate - JavaScript Date object in local time
   * @returns ISO 8601 formatted string in UTC (with 'Z' suffix)
   */
  static toIsoString(localDate?: Date): string {
    const date = !localDate ? new Date() : DateHelper.parseDate(localDate);
    if (!date) return "";
    return date.toISOString();
  }

  /**
   * Converts an ISO string (in UTC) to a JavaScript Date object
   *
   * @param isoString - ISO 8601 formatted date string (e.g. "2025-02-25T12:00:00Z")
   * @returns JavaScript Date object representing the specified time
   */
  static isoStringToDate(isoString: string): Date {
    return new Date(isoString);
  }

  /**
   * Parses a date using the Moment.js library.
   *
   * @param {Date|string|number} date The date to parse.
   * @param {string} [format] The format of the date, using Moment.js format. See https://momentjs.com/docs/#/parsing/string-format/
   * @returns {Date|null} The parsed date, or null if the input is not a valid date.
   */
  static parseDate(date: any, format?: IDateFormat): Date | null {
    /**
     * If the date is already a Date object, return it as is.
     */
    if (DateHelper.isDateObj(date)) return date as Date;
    if (!isNonNullString(format)) {
      const fromKnowing = DateHelper.parseString(date);
      if (fromKnowing?.isValid) {
        return fromKnowing.date;
      }
      return null;
    }
    /**
     * If the date is empty or null, return null.
     */
    if (isEmpty(date)) return null;

    try {
      /**
       * Attempt to parse the date using the Moment.js library.
       */
      const parsedDate = moment(date, format, true);
      /* Check if the parsed date is valid.
       */
      if (parsedDate?.isValid()) {
        /**
         * If the date is valid, return it as a Date object.
         */
        return parsedDate.toDate();
      }
    } catch (error) {
      console.error(
        error,
        " parsing date with moment : ",
        date,
        " format is : ",
        format
      );
    }
    return null;
  }

  /**
   * Converts a date to SQL datetime format.
   *
   * @param {Date} datetime The date to convert.
   * @returns {string} The date in SQL datetime format, or an empty string if the date is not valid.
   *
   * Example:
   * ```ts
   * const date = new Date();
   * console.log(DateHelper.toSQLDateTimeFormat(date)); // Output: YYYY-MM-DD HH:MM:SS
   * console.log(DateHelper.oSQLDateTimeFormat(null)); // Output: ""
   * ```
   */
  static toSQLDateTimeFormat(datetime: Date): string {
    /**
     * If the date is not a valid date object, return an empty string.
     *
     * This check ensures that the function returns a consistent result for invalid inputs.
     */
    if (!DateHelper.isDateObj(datetime)) {
      return "";
    }

    /**
     * Extract the year, month, day, hours, minutes, and seconds from the date object.
     *
     * These values are used to construct the SQL datetime string.
     */
    const year = datetime.getFullYear();
    const month = String(datetime.getMonth() + 1).padStart(2, "0");
    const day = String(datetime.getDate()).padStart(2, "0");
    const hours = String(datetime.getHours()).padStart(2, "0");
    const minutes = String(datetime.getMinutes()).padStart(2, "0");
    const seconds = String(datetime.getSeconds()).padStart(2, "0");

    /**
     * Format the date as a SQL datetime string.
     *
     * The format is YYYY-MM-DD HH:MM:SS, which is a standard format for SQL datetime values.
     */
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  private static getI18n(i18n?: I18n) {
    return I18n.isI18nInstance(i18n) ? i18n : I18n.getInstance();
  }
  /**
   * Get the default datetime format, according to the Moment.js library.
   * it firstly tries to retrieve the default date time format from the translations (key: dates.defaultDateTimeFormat), and if it fails, it returns the default value.
   *
   * @description The format used to represent dates and times by default, as defined by the Moment.js library.
   * @see https://momentjs.com/docs/#/parsing/string-format/
   */
  static getDefaultDateTimeFormat(i18n?: I18n): IDateFormat {
    return defaultStr(
      this.getI18n(i18n).getNestedTranslation("dates.defaultDateTimeFormat"),
      "YYYY-MM-DD HH:mm"
    ) as unknown as IDateFormat;
  }
  /**
   * Get the default date format.
   * It firstly tries to retrieve the default date time format from the translations (key: dates.defaultDateFormat), and if it fails, it returns the default value.
   *
   * @description The format used to represent dates by default.
   */
  static getDefaultDateFormat(i18n?: I18n): IDateFormat {
    return defaultStr(
      this.getI18n(i18n).getNestedTranslation("dates.defaultDateFormat"),
      "YYYY-MM-DD"
    ) as unknown as IDateFormat;
  }
  /**
   * Converts a date to SQL date format.
   *
   * @param {Date} datetime The date to convert.
   * @returns {string} The date in SQL date format, or an empty string if the date is not valid.
   *
   * Example:
   * ```ts
   * const date = new Date();
   * console.log(dateToSQLFormat(date)); // Output: YYYY-MM-DD
   * console.log(dateToSQLFormat(null)); // Output: ""
   * ```
   */
  static toSQLDateFormat(datetime: Date): string {
    /**
     * If the date is not a valid date object, return an empty string.
     *
     * This check ensures that the function returns a consistent result for invalid inputs.
     */
    if (!DateHelper.isDateObj(datetime)) return "";

    /**
     * Extract the year, month, and day from the date object.
     *
     * These values are used to construct the SQL date string.
     */
    const year = datetime.getFullYear();
    const month = String(datetime.getMonth() + 1).padStart(2, "0");
    const day = String(datetime.getDate()).padStart(2, "0");

    /**
     * Format the date as a SQL date string.
     *
     * The format is YYYY-MM-DD, which is a standard format for SQL date values.
     */
    return `${year}-${month}-${day}`;
  }
  /**
   * Converts a date to SQL time format.
   *
   * @param {Date} datetime The date to convert.
   * @returns {string} The date in SQL time format, or an empty string if the date is not valid.
   *
   * Example:
   * ```ts
   * const date = new Date();
   * console.log(toSQLTimeFormat(date)); // Output: HH:MM:SS
   * console.log(toSQLTimeFormat(null)); // Output: ""
   * ```
   */
  static toSQLTimeFormat(datetime: Date): string {
    /**
     * If the date is not a valid date object, return an empty string.
     *
     * This check ensures that the function returns a consistent result for invalid inputs.
     */
    if (!DateHelper.isDateObj(datetime)) return "";

    /**
     * Extract the hours, minutes, and seconds from the date object.
     *
     * These values are used to construct the SQL time string.
     */
    const hours = String(datetime.getHours()).padStart(2, "0");
    const minutes = String(datetime.getMinutes()).padStart(2, "0");
    const seconds = String(datetime.getSeconds()).padStart(2, "0");

    /**
     * Format the date as a SQL time string.
     *
     * The format is HH:MM:SS, which is a standard format for SQL time values.
     */
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get the default time format, according to the Moment.js library.
   * It firstly tries to retrieve the default date time format from the translations (key: dates.defaultTimeFormat), and if it fails, it returns the default value.
   *
   * @description The format used to represent times by default, as defined by the Moment.js library.
   * @see https://momentjs.com/docs/#/parsing/string-format/
   */
  static getDefaultTimeFormat(i18n?: I18n): IDateFormat {
    return defaultStr(
      this.getI18n(i18n).getNestedTranslation("dates.defaultTimeFormat"),
      "HH:mm"
    ) as unknown as IDateFormat;
  }

  /**
   * Checks if the provided variable is a valid date, either in SQL format or as a Date object.
   *
   * @param {string|Date} sDate The date to test.
   * @param {string} [format] The format of the date, using Moment.js format. See https://momentjs.com/docs/#/parsing/string-format/
   * @returns {boolean} True if the date is valid, false otherwise.
   */
  static isValidDate(sDate: any, format?: IDateFormat): boolean {
    if (sDate === null || sDate === undefined) return false;
    /**
     * If the input is a boolean, it's not a valid date.
     */
    if (typeof sDate === "boolean") return false;

    /**
     * If the input is already a Date object, it's a valid date.
     */
    if (DateHelper.isDateObj(sDate)) return true;

    /**
     * If the input is a non-empty string, try to parse it as a date.
     */
    if (isNonNullString(sDate)) {
      /**
       * If the date can be parsed successfully, it's a valid date.
       */
      return !!DateHelper.parseDate(sDate, format);
    }

    /**
     * If the input is a number that can be converted to a string, it's not a valid date.
     */
    if (
      (sDate as any)?.toString &&
      (sDate as any)?.toString() == parseInt(sDate).toString()
    )
      return false;

    /**
     * Try to create a new Date object from the input.
     */
    const tryDate = new Date(sDate);

    /**
     * If the resulting Date object is valid, the input is a valid date.
     */
    return DateHelper.isDateObj(tryDate);
  }

  /**
   * The SQL date format, according to the Moment.js library.
   * @description The format used to represent dates in SQL, as defined by the Moment.js library.
   * @see https://momentjs.com/docs/#/parsing/string-format/
   */
  static SQL_DATE_FORMAT: IDateFormat = "YYYY-MM-DD";

  /**
   * The SQL datetime format, according to the Moment.js library.
   *
   * @description The format used to represent dates and times in SQL, as defined by the Moment.js library.
   * @see https://momentjs.com/docs/#/parsing/
   */
  static SQL_DATE_TIME_FORMAT: IDateFormat = "YYYY-MM-DD HH:mm:ss";

  /**
   * The SQL time format, according to the Moment.js library.
   *
   * @description The format used to represent times in SQL, as defined by the Moment.js library.
   * @see https://momentjs.com/docs/#/parsing/string-format/
   */
  static SQL_TIME_FORMAT: IDateFormat = "HH:mm:ss";

  /**
   * Adds days to a date.
   *
   * @param {number} days The number of days to add to the date.
   * @param {Date|string} [date] The date to add days to. If not provided, the current date is used.
   * @param {string} [setFunction] The type of date to add (e.g. 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds').
   * @returns {Date|string} The date with the added days, either as a Date object or a string in the specified format.
   *
   * Example:
   * ```ts
   * console.log(DateHelper.addToDate(1)); // Output: Date object with 1 day added to the current date
   * ```
   */
  private static addToDate(
    days: number,
    date?: Date,
    setFunction?: string
  ): Date {
    if (!isNumber(days)) days = 0;
    if (isEmpty(date)) {
      date = new Date();
    }
    if (DateHelper.isValidDate(date) && isNonNullString(date)) {
      date = new Date(date);
    }
    if (!DateHelper.isValidDate(date)) {
      date = isNonNullString(date) ? new Date(date) : new Date();
    }
    if (
      isNonNullString(setFunction) &&
      typeof (date as any)["set" + setFunction] === "function" &&
      typeof (date as any)["get" + setFunction] === "function"
    ) {
      const set = "set" + setFunction;
      const get = "get" + setFunction;
      date = new Date((date as any)[set]((date as any)[get]() + days));
    }
    return date as Date;
  }

  /**
   * Adds the specified number of days to the date object.
   *
   * @param {number} days The number of days to add to the date.
   * @param {Date|string} [date] The date object to add days to. If not provided, the current date is used.
   * @returns {Date} The updated date.
   */
  static addDays(days: number, date?: any): Date {
    return DateHelper.addToDate(days, date, "Date");
  }

  /**
   * Adds the specified number of milliseconds to the date object.
   *
   * @param {number} milliseconds The number of milliseconds to add to the date.
   * @param {Date} [dateObj] The date object to add milliseconds to. If not provided, the current date is used.
   * @returns {Date} The updated date object with the added milliseconds.
   */
  static addMilliseconds(milliseconds: number, dateObj?: Date): Date {
    /**
     * If the number of milliseconds is not a number, default to 0.
     */
    if (!isNumber(milliseconds)) milliseconds = 0;

    /**
     * If no date object is provided, use the current date.
     */
    if (!DateHelper.isDateObj(dateObj)) {
      dateObj = new Date();
    }

    /**
     * Ensure a valid date object is used.
     */
    dateObj = dateObj || new Date();

    /**
     * Add the milliseconds to the date object.
     */
    return new Date(dateObj.getTime() + milliseconds);
  }

  /**
   * Adds the specified number of seconds to the date object.
   *
   * @param {number} seconds The number of seconds to add to the date.
   * @param {Date} [dateObj] The date object to add seconds to. If not provided, the current date is used.
   * @returns {Date} The updated date object with the added seconds.
   */
  static addSeconds(seconds: number, dateObj?: any): Date {
    if (!isNumber(seconds)) {
      seconds = 0;
    }
    return DateHelper.addMilliseconds(seconds * 1000, dateObj);
  }

  /**
   * Adds the specified number of minutes to the date object.
   *
   * @param {number} minutes The number of minutes to add to the date.
   * @param {Date} [dateObj] The date object to add minutes to. If not provided, the current date is used.
   * @returns {Date|string} The updated date object with the added minutes, or a string in the specified format.
   */
  static addMinutes(minutes: number, dateObj?: any): Date {
    if (!isNumber(minutes)) {
      minutes = 0;
    }
    return DateHelper.addMilliseconds(minutes * 60000, dateObj);
  }

  /**
   * Adds the specified number of hours to the date object.
   *
   * @param {number} hours The number of hours to add to the date.
   * @param {Date} [dateObj] The date object to add hours to. If not provided, the current date is used.
   * @returns {Date} The updated date object with the added hours.
   */
  static addHours(hours: number, dateObj?: any): Date {
    if (!isNumber(hours)) {
      hours = 0;
    }
    return DateHelper.addMilliseconds(hours * 3600000, dateObj);
  }

  /**
   * Adds the specified number of months to the date object.
   *
   * @param {number} months The number of months to add to the date.
   * @param {Date|string} [date] The date object to add months to. If not provided, the current date is used.
   * @returns {Date|string} The updated date, either as a Date object or a string in the specified format.
   */
  static addMonths(months: number, date?: Date, format?: IDateFormat): Date {
    return DateHelper.addToDate(months, date, "Month");
  }

  /**
   * Adds the specified number of weeks to the date object.
   *
   * @param {number} weeks The number of weeks to add to the date.
   * @param {Date|string} [date] The date object to add weeks to. If not provided, the current date is used.
   * @returns {Date|string} The updated date, either as a Date object or a string in the specified format.
   */
  static addWeeks(weeks: number, date?: Date): Date {
    weeks = (!isNumber(weeks) ? 0 : weeks) * 7;
    return DateHelper.addToDate(weeks, date, "Date");
  }

  /**
   * Adds the specified number of years to the date object.
   *
   * @param {number} years The number of years to add to the date.
   * @param {Date|string} [date] The date object to add years to. If not provided, the current date is used.
   * @returns {Date} The updated date.
   */
  static addYears(years: number, date?: Date): Date {
    if (!isNumber(years)) years = 0;

    const newDate = new Date(DateHelper.addToDate(0, date));
    const year = newDate.getFullYear();
    if (year + years < 0) years = 0;
    else years += year;
    newDate.setFullYear(years);
    return new Date(newDate);
  }

  /**
   * Returns the first and last days of the current month.
   *
   * @param {Date} [date] The date object to use as the basis for the calculation. If not provided, the current date is used.
   * @returns {{ first: Date, last: Date }} An object containing the first and last days of the month.
   *
   * Example:
   * ```ts
   * console.log(getCurrentMonthDaysRange()); // Output: { first: Date, last: Date }
   * console.log(getCurrentMonthDaysRange(new Date("2022-01-15"))); // Output: { first: Date, last: Date }
   * ```
   */
  static getCurrentMonthDaysRange = (
    date?: any
  ): { first: Date; last: Date } => {
    /**
     * If no date is provided, use the current date.
     *
     * This check ensures that the function returns a consistent result for missing inputs.
     */
    const currentDate = DateHelper.isValidDate(date)
      ? new Date(date)
      : new Date().resetHours2Minutes2Seconds();

    /**
     * Calculate the first day of the month.
     *
     * The first day of the month is always the 1st day of the month, so we can simply set the day to 1.
     */
    const first = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    /**
     * Calculate the last day of the month.
     *
     * The last day of the month is the same as the current date, since we're calculating the limits of the current month.
     */
    const last = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    return { first, last };
  };

  /**
   * Returns the first and last days of the previous week.
   *
   * @param {Date} [date] The date object to use as the basis for the calculation. If not provided, the current date is used.
   * @returns {{ first: Date, last: Date }} An object containing the first and last days of the previous week.
   *
   * Example:
   * ```ts
   * console.log(getPreviousWeekDaysRange()); // Output: { first: Date, last: Date }
   * console.log(getPreviousWeekDaysRange(new Date("2022-01-15"))); // Output: { first: Date, last: Date }
   * ```
   */
  static getPreviousWeekDaysRange = (
    date?: any
  ): { first: Date; last: Date } => {
    /**
     * If no date is provided, use the current date.
     *
     * This check ensures that the function returns a consistent result for missing inputs.
     */
    const cDate = DateHelper.isValidDate(date)
      ? new Date(date)
      : new Date().resetHours2Minutes2Seconds();

    /**
     * Calculate the date one week ago.
     *
     * We subtract 7 days from the current date to get the date one week ago.
     */
    const beforeOneWeek = new Date(cDate.getTime() - 60 * 60 * 24 * 7 * 1000);

    /**
     * Create a copy of the date one week ago.
     *
     * We need a copy of the date to avoid modifying the original date.
     */
    const beforeOneWeek2 = new Date(beforeOneWeek);

    /**
     * Get the day of the week (0 = Sunday, 1 = Monday, etc.).
     *
     * We use this value to calculate the first day of the week.
     */
    const day = beforeOneWeek.getDay();

    /**
     * Calculate the difference between the current day and Monday.
     *
     * If the current day is Sunday, we subtract 6 to get the previous Monday. Otherwise, we subtract the current day to get the previous Monday.
     */
    const diffToMonday = beforeOneWeek.getDate() - day + (day === 0 ? -6 : 1);

    /**
     * Calculate the first day of the previous week.
     *
     * We set the date to the previous Monday.
     */
    const first = new Date(beforeOneWeek.setDate(diffToMonday));

    /**
     * Calculate the last day of the previous week.
     *
     * We set the date to the previous Sunday (i.e., the day after the previous Monday).
     */
    const last = new Date(beforeOneWeek2.setDate(diffToMonday + 6));

    return { first, last };
  };

  /**
   * Returns the first and last days of the current week.
   *
   * @param {Date} [date] The date object to use as the basis for the calculation. If not provided, the current date is used.
   * @returns {{ first: Date, last: Date }} An object containing the first and last days of the current week.
   *
   * Example:
   * ```ts
   * console.log(getCurrentWeekDaysRange()); // Output: { first: Date, last: Date }
   * console.log(getCurrentWeekDaysRange(new Date("2022-01-15"))); // Output: { first: Date, last: Date }
   * ```
   */
  static getCurrentWeekDaysRange = (date?: any) => {
    /**
     * If no date is provided, use the current date.
     *
     * This check ensures that the function returns a consistent result for missing inputs.
     */
    const currentDate = DateHelper.isValidDate(date)
      ? new Date(date)
      : new Date().resetHours2Minutes2Seconds();

    /**
     * Get the day of the week (0 = Sunday, 1 = Monday, etc.).
     *
     * We use this value to calculate the first day of the week.
     */
    const day = currentDate.getDay();

    /**
     * Calculate the difference between the current day and Monday.
     *
     * If the current day is Sunday, we subtract 6 to get the previous Monday. Otherwise, we subtract the current day to get the previous Monday.
     */
    const diff = currentDate.getDate() - day + (day == 0 ? -6 : 1);

    /**
     * Create a copy of the current date.
     *
     * We need a copy of the date to avoid modifying the original date.
     */
    const last = new Date(currentDate);

    /**
     * Calculate the first day of the current week.
     *
     * We set the date to the current Monday.
     */
    const first = new Date(currentDate.setDate(diff));

    /**
     * Calculate the last day of the current week.
     *
     * We set the date to the current Sunday (i.e., the day after the current Monday).
     */
    last.setDate(last.getDate() + 6);

    return { first, last };
  };

  /**
   * Formats a date to the specified moment format.
   *
   * @param {Date} [date] The date to format. If not provided, the current date is used.
   * @param {string} [format] The moment format to use. If not provided, the default format is used.
   * @returns {string} The formatted date string. If the input date is invalid, an empty string is returned.
   *
   * Example:
   * ```ts
   * console.log(formatDate()); // Output: Formatted current date
   * console.log(formatDate(new Date("2022-01-15"))); // Output: Formatted date
   * console.log(formatDate("2022-01-15", "YYYY-MM-DD")); // Output: Formatted date in YYYY-MM-DD format
   * ```
   */
  static formatDate(date?: Date, format?: IDateFormat): string {
    try {
      const parsedDate = moment(date);
      if (parsedDate.isValid()) {
        return parsedDate.format(
          defaultStr(
            format,
            DateHelper.getDefaultDateTimeFormat()
          ) as unknown as IDateFormat
        );
      }
    } catch (error) {}
    return defaultStr(DateHelper.isValidDate(date) ? date?.toString() : "");
  }
  static isDateObj = isDateObj;

  /**
   * Returns an object containing detailed information about a given date in UTC time.
   *
   * @param {Date} [date] - The date to get details from. If not provided, the current date will be used.
   * @returns {Object} An object containing the year, day, month, month string, hours, date, minutes, seconds, month name, day name, and day name short in UTC time.
   *
   * @example
   * const utcDateDetails = DateHelper.getUTCDateTimeDetails(new Date('2022-01-01'));
   * console.log(utcDateDetails);
   * // Output: { year: 2022, day: 6, month: 0, monthString: '01', hours: 0, date: 1, minutes: 0, seconds: 0, monthName: 'January', dayName: 'Saturday', dayNameShort: 'Sat' }
   */
  static getUTCDateTimeDetails(date?: Date): {
    /**
     * The year of the date in UTC time.
     */
    year: number;
    /**
     * The day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) in UTC time.
     */
    day: number;
    /**
     * The month of the date (0 = January, 1 = February, ..., 11 = December) in UTC time.
     */
    month: number;
    /**
     * The month of the date in the format 'MM' in UTC time.
     */
    monthString: string;
    /**
     * The hours of the date in UTC time.
     */
    hours: number;
    /**
     * The day of the month (1-31) in UTC time.
     */
    date: number;
    /**
     * The minutes of the date in UTC time.
     */
    minutes: number;
    /**
     * The seconds of the date in UTC time.
     */
    seconds: number;
    /**
     * The full name of the month in UTC time.
     */
    monthName: string;
    /**
     * The full name of the day in UTC time.
     */
    dayName: string;
    /**
     * The short name of the day in UTC time.
     */
    dayNameShort: string;
  } {
    const m = date ? moment.utc(date) : moment.utc();
    return {
      year: m.year(),
      day: m.day(),
      month: m.month(),
      monthString: m.format("MM"),
      hours: m.hours(),
      date: m.date(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      monthName: m.format("MMMM"),
      dayName: m.format("dddd"),
      dayNameShort: m.format("ddd"),
    };
  }
}

const parseDString = (dateString: string, format: string) => {
  const parsed = moment(dateString, format, true);
  try {
    if (
      (parsed.isValid() && parsed.format(format) === dateString) ||
      moment.utc(parsed, true).format(format) === dateString
    ) {
      return {
        date: parsed.toDate(),
        matchedFormat: format,
        isValid: true,
      };
    }
  } catch (e) {}
  return null;
};
