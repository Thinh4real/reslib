/**
 * @type IDateFormat
 * @description
 * A comprehensive type representing all valid Moment.js format strings.
 * This type serves as a unified reference for various date/time formatting options,
 * accommodating various combinations of date, time, and day of the week components.
 * ### Supported Tokens:
 *  monts :
 *   M : Month number, without leading zeros (1-12).
 * - **`'MM'`**: 2-digit month (e.g., `10` for October).
 * - **`'MMM'`**: Abbreviated month name (e.g., `Oct` for October).
 * - **`'MMMM'`**: Full month name (e.g., `October`).
 * - **`'D'`**: Day of the month (e.g., `1` for the first day of the month... 2 ... 30 31).
 * - **``Do'`**: Ordinal day of the month (e.g., `1st` for the first day of the month,1st 2nd ... 30th 31st).
 * - **`'DD'`**: 2-digit day of the month (e.g., `01` for the first day of the month).
 * - **`'DDD'`**: 3-digit day of the year (e.g., `001` for the first day of the year).
 * - **`'DDDD'`**: 4-digit day of the year (e.g., `0001` for the first day of the year).
 * - **``d'`**: Day of the week (e.g., `1` for Monday : 0 1 ... 5 6).
 * - **``do'`**: Ordinal day of the week (e.g., `1st` for Monday).
 * - **``dd'`**: Abbreviated day of the week (e.g., `Mon` for Monday).
 * - **``ddd'`**: Full day of the week (e.g., `Monday`).
 * - **``dddd'`**: Full day of the week (e.g., `Monday`).
 * - **`'YY'`**: 2-digit year (e.g., `19` for the year 2019).
 * - **`'YYYY'`**: 4-digit year (e.g., `2019`).
 * - **`'YYYYY'`**: 5-digit year (e.g., `1999`).
 * - **`'a'`**: Lowercase am/pm marker (e.g., `am` or `pm`).
 * - **`'A'`**: Uppercase AM/PM marker (e.g., `AM` or `PM`).
 * - **`'H'`**: 24-hour hour (e.g., `0` to `23`).
 * - **`'HH'`**: 2-digit 24-hour hour (e.g., `00` to `23`).
 * - **`'h'`**: 12-hour hour (e.g., `1` to `12`).
 * - **`'hh'`**: 2-digit 12-hour hour (e.g., `01` to `12`).
 * - **`'m'`**: Minutes (e.g., `0` to `59`).
 * - **`'mm'`**: 2-digit minutes (e.g., `00` to `59`).
 * - **`'s'`**: Seconds (e.g., `0` to `59`).
 * - **`'ss'`**: 2-digit seconds (e.g., `00` to `59`).
 * - **`'S'`**: Milliseconds (e.g., `0` to `999`).
 * - **`'SS'`**: 3-digit milliseconds (e.g., `00` to `999`).
 * - **`'SSS'`**: 4-digit milliseconds (e.g., `000` to `9999`).
 * - Q : Quarter of the year (1-4) : 1 2 3 4.
 * - Qo : Quarter of the year (1-4) : 1st 2nd 3rd 4th.
 *
 * @see https://momentjs.com/docs/#/displaying/format for more information about the supported tokens.
 */
export type IDateFormat = string;
