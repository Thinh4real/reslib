import { Currency } from "../currency";
import {
  ICurrency,
  ICurrencyAbreviate2FormatKey,
  ICurrencyFormatterKey,
  ICurrencyFormatters,
  ICurrencySymbol,
} from "../currency/types";
import { defaultStr } from "./defaultStr";
import { isNumber } from "./isNumber";

const { currencies } = Currency;

/**
 * Extends the Number interface with additional methods for formatting and abbreviating numbers.
 */
declare global {
  interface Number extends ICurrencyFormatters {
    /**
     * Counts the number of decimal places in the number.
     * @returns {number} The number of decimal places.
     */
    countDecimals: () => number;

    /**
     * Formats the number as a currency string.
     * @param {ICurrency | ICurrencySymbol} [symbol] The currency symbol to use (optional).
     * @param {number} [decimalDigits] The number of decimal places to display (optional).
     * @param {string} [thousandSeparator] The separator to use for thousands (optional).
     * @param {string} [decimalSeparator] The separator to use for decimals (optional).
     * @param {string} [format] The format to use for the currency string (optional).
     * @returns {string} The formatted currency string.
     * @example
     * ```ts
     * (12).formatMoney(); // Output: "12 FCFA"
     * (12000).formatMoney(); // Output: "12 000 FCFA"
     * ```
     */
    formatMoney: (
      symbol?: ICurrency | ICurrencySymbol,
      decimalDigits?: number,
      thousandSeparator?: string,
      decimalSeparator?: string,
      format?: string
    ) => string;

    /**
     * Formats the number using the specified formatter.
     * @param {string} [formatter] The formatter to use (optional).
     * @param {boolean} [abreviate] Whether to abbreviate the number (optional).
     * @returns {string} The formatted string.
     * @example
     * ```ts
     * (12).format("moneyCAD"); // Output: "CA$12"
     * ```
     */
    format: (formatter?: string, abreviate?: boolean) => string;

    /**
     * Formats the number as a formatted number string with thousands separators.
     * @param {ICurrency | number} [optionsOrDecimalDigits] The options or decimal digits to use (optional).
     * @param {string} [thousandSeparator] The separator to use for thousands (optional).
     * @param {string} [decimalSeparator] The separator to use for decimals (optional).
     * @returns {string} The formatted number string.
     */
    formatNumber: (
      optionsOrDecimalDigits?: ICurrency | number,
      thousandSeparator?: string,
      decimalSeparator?: string
    ) => string;

    /**
     * Abbreviates the number and formats it as a currency string.
     * @param {ICurrency | ICurrencySymbol} [symbol] The currency symbol to use (optional).
     * @param {number} [decimalDigits] The number of decimal places to display (optional).
     * @param {string} [thousandSeparator] The separator to use for thousands (optional).
     * @param {string} [decimalSeparator] The separator to use for decimals (optional).
     * @param {string} [format] The format to use for the currency string (optional).
     * @returns {string} The formatted and abbreviated currency string.
     */
    abreviate2FormatMoney: (
      symbol?: ICurrency | ICurrencySymbol,
      decimalDigits?: number,
      thousandSeparator?: string,
      decimalSeparator?: string,
      format?: string
    ) => string;

    /***
     * Abbreviates a number and formats it as a number string.
     * @param {number} [decimalDigits] The number of decimal places to display (optional).
     * @param {string} [thousandSeparator] The separator to use for thousands (optional).
     * @param {string} [decimalSeparator] The separator to use for decimals (optional).
     * @returns {string} The formatted and abbreviated number string.
     */
    abreviate2FormatNumber: (
      decimalDigits?: number,
      thousandSeparator?: string,
      decimalSeparator?: string
    ) => string;
  }
}

/**
 * Counts the number of decimal places in a number.
 *
 * @returns {number} The number of decimal places in the number.
 */
Number.prototype.countDecimals = function (): number {
  /**
   * Use a regular expression to match the decimal part of the number.
   */
  const match = String(this.toString()).match(/\.(\d+)/);

  /**
   * If there is no decimal part, return 0.
   */
  if (!match) {
    return 0;
  }

  /**
   * The number of decimal places is the length of the matched decimal part.
   */
  return match[1].length;
};

/**
 * Formats a number as a string with the specified options.
 *
 * @param {ICurrency | number} optionsOrDecimalDigits The options or decimal digits to use for formatting.
 * @param {string} thousandSeparator The thousand separator to use.
 * @param {string} decimalSeparator The decimal separator to use.
 * @returns {string} The formatted number as a string.
 */
Number.prototype.formatNumber = function (
  optionsOrDecimalDigits?: ICurrency | number,
  thousandSeparator?: string,
  decimalSeparator?: string
): string {
  /**
   * Call the formatNumber function with the current number value and the specified options.
   */
  return Currency.formatNumber(
    this.valueOf(),
    optionsOrDecimalDigits,
    thousandSeparator,
    decimalSeparator
  );
};

/**
 * Formats a number as a monetary value with the specified options.
 *
 * @param {ICurrency | ICurrencySymbol} [symbol] The symbol to use for the currency.
 * @param {number} decimalDigits The number of decimal digits to use.
 * @param {string} thousandSeparator The thousand separator to use.
 * @param {string} decimalSeparator The decimal separator to use.
 * @param {string} format The format to use for the currency.
 * @returns {string} The formatted number as a monetary value.
 */
Number.prototype.formatMoney = function (
  symbol?: ICurrency | ICurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
): string {
  /**
   * Call the formatMoney function with the current number value and the specified options.
   */
  return Currency.formatMoney(
    this.valueOf(),
    symbol,
    decimalDigits,
    thousandSeparator,
    decimalSeparator,
    format
  );
};

/**
 * Represents the result of abbreviating a number.
 */
export type IAbreviateNumberResult = {
  /**
   * The abbreviated result.
   */
  result: string;

  /**
   * The original value that was abbreviated.
   */
  value: number;

  /**
   * The format used for abbreviation.
   */
  format: string;

  /**
   * The suffix used for abbreviation (e.g. "K", "M", etc.).
   */
  suffix: string;

  /**
   * The formatted value.
   */
  formattedValue: string;

  /**
   * The minimum number of decimal digits required for a given number when abbreviating it,
   * ensuring that the abbreviated value does not lose significant information compared to the original number.
   */
  minAbreviationDecimalDigits: number;
};

/**
 * Abbreviates a number to a shorter form (e.g. 1000 -> 1K).
 * @see : https://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn
 * @param {number} num The number to abbreviate.
 *
 *  @param {IAbreviateNumberOptions} [options] Formatting options when returnObject is true.
 *  @param {number} num The number to abbreviate.
 *  @param {number} [options.decimalDigits] Number of decimal digits to display. If not provided, will use the minimum number required for precision.
 *  @param {string} [options.thousandsSeparator] Character to use as thousands separator. Example: "," for 1,234 or " " for 1 234.
 *  @param {string} [options.decimalSeparator] Character to use as decimal separator. Example: "." for 1.5 or "," for 1,5.
 * @returns {IAbreviateNumberResult} The abbreviated number or an object with additional information.
 */
export const _abreviateNumber = (
  num: number,
  decimalDigits?: number,
  thousandsSeparator?: string,
  decimalSeparator?: string
): IAbreviateNumberResult => {
  if (num === null || typeof num !== "number" || isNaN(num)) {
    return {
      result: "",
      format: "",
      suffix: "",
      formattedValue: "",
      minAbreviationDecimalDigits: 0,
      value: NaN,
    };
  }

  /**
   * Handle Infinity case
   */
  if (!isFinite(num)) {
    const infinityString = num > 0 ? "∞" : "-∞";
    return {
      result: infinityString,
      value: num,
      format: "",
      suffix: "",
      formattedValue: infinityString,
      minAbreviationDecimalDigits: 0,
    } as IAbreviateNumberResult;
  }

  const isUnder1000 = Math.abs(num) < 1000;
  // Abbreviation thresholds and corresponding suffixes
  const thresholds = [
    //{ value: 1e15, suffix: 'Q' },// Quadrillion (10^15)
    { value: 1e12, suffix: "T" }, // Trillion (10^12)
    { value: 1e9, suffix: "B" }, // Billion (10^9)
    { value: 1e6, suffix: "M" }, // Million (10^6)
    { value: 1e3, suffix: "K" }, // Thousand (10^3)
    { value: 1, suffix: "" },
  ];

  /**
   * Get the number of decimal places in the number.
   */
  const decimals = num.countDecimals
    ? num.countDecimals()
    : Math.floor(num) === num
      ? 0
      : num.toString().split(".")[1]?.length || 0;

  // Determine which threshold to use for abbreviation
  let threshold =
    thresholds.find((t) => Math.abs(num) >= t.value) ||
    thresholds[thresholds.length - 1];
  let abbreviatedValue = isUnder1000
    ? num
    : num / (threshold.value === 1 ? 1 : threshold.value);
  let suffix = threshold.suffix;
  const minAbreviationDecimalDigits = determineSignificantDecimals(
    abbreviatedValue,
    5
  );
  /**

  /**
   * Determine the number of decimal places to show.
   */
  let fixed = Math.min(decimals, 5);
  fixed = !fixed || fixed < 0 ? 0 : fixed;

  /**
   * If the number is 0, return it as is.
   */
  if (num === 0) {
    const nString = "0";
    return {
      result: nString,
      value: 0,
      format: "",
      suffix: "",
      formattedValue: nString,
      minAbreviationDecimalDigits: 0,
    };
  }
  // Determine the number of decimal places to use
  const decimalPlaces =
    isNumber(decimalDigits) && decimalDigits > 0
      ? decimalDigits
      : threshold.value === 1
        ? Math.min(decimals, 5)
        : Math.max(minAbreviationDecimalDigits, 0);

  // Format the abbreviated value with appropriate decimal places
  let formattedValue = abbreviatedValue.toFixed(decimalPlaces);
  thousandsSeparator = defaultStr(thousandsSeparator);
  decimalSeparator = defaultStr(decimalSeparator, ".");

  // Split into integer and decimal parts
  const parts = formattedValue.toString().split(".");

  // Format the integer part with thousands separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // If we need decimal places but the rounding removed them, add them back
  if (decimalPlaces > 0 && parts.length === 1) {
    parts.push("0".repeat(decimalPlaces));
  }
  // If we need decimal places and have some but not enough, pad with zeros
  else if (
    decimalPlaces > 0 &&
    parts.length > 1 &&
    parts[1].length < decimalPlaces
  ) {
    parts[1] = parts[1].padEnd(decimalPlaces, "0");
  }
  formattedValue = parts.join(decimalSeparator);
  const result = formattedValue + suffix;
  return {
    result,
    value: num,
    //format: threshold.value === 1 ? '' : '0,0.[00000]',
    format: suffix,
    suffix,
    formattedValue,
    minAbreviationDecimalDigits,
  };
};

/**
 * Determines the optimal number of decimal places to display
 * to preserve significant information
 */
function determineSignificantDecimals(
  value: number,
  maxDecimals: number
): number {
  const absValue = Math.abs(value);

  // If it's an integer, no decimal places needed
  if (Number.isInteger(absValue)) {
    return 0;
  }

  // Extract the decimal part as a string
  const decimalStr = absValue.toString().split(".")[1] || "";

  // Find the position of the first non-zero digit
  let firstNonZero = 0;
  while (firstNonZero < decimalStr.length && decimalStr[firstNonZero] === "0") {
    firstNonZero++;
  }

  // If the number is between 0 and 1 with leading zeros, we need to keep those
  // zeros plus at least one significant digit
  if (absValue < 1 && firstNonZero > 0) {
    return Math.min(firstNonZero + maxDecimals, decimalStr.length);
  }

  // For other decimal numbers, use the provided maxDecimals
  // but don't exceed the actual decimal length
  return Math.min(maxDecimals, decimalStr.length);
}

/**
 * Abbreviates a number to a shorter form with optional formatting.
 *
 * This function converts a large number into a shorter representation
 * with suffixes such as 'K' for thousands, 'M' for millions, etc.
 * It also allows optional customization of the number of decimal digits
 * and the separators used for thousands and decimals.
 *
 * @param {number} num The number to abbreviate.
 * @param {number} [decimalDigits] Optional number of decimal digits to display.
 *   If not provided, the function will use the minimum number required for precision.
 * @param {string} [thousandsSeparator] Optional character to use as thousands separator.
 *   Example: ',' for 1,234 or ' ' for 1 234.
 * @param {string} [decimalSeparator] Optional character to use as decimal separator.
 *   Example: '.' for 1.5 or ',' for 1,5.
 * @returns {string} The abbreviated number as a string.
 */
export const abreviateNumber = (
  num: number,
  decimalDigits?: number,
  thousandsSeparator?: string,
  decimalSeparator?: string
): string => {
  return _abreviateNumber(
    num,
    decimalDigits,
    thousandsSeparator,
    decimalSeparator
  ).result;
};

/**
 * Abbreviates a number to a shorter form (e.g. 1000 -> 1K).
 *
 * @returns {string} The abbreviated number.
 */
Number.prototype.abreviate2FormatNumber = function (
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string
): string {
  /**
   * Call the abreviateNumber function with the current number value and return a string.
   */
  return abreviateNumber(
    this.valueOf(),
    decimalDigits,
    thousandSeparator,
    decimalSeparator
  ) as string;
};

/**
 * Abbreviates a number and formats it as a monetary value.
 *
 * @param {number} number The number to abbreviate and format.
 * @param {ICurrency | ICurrencySymbol} [symbol] The currency symbol or name.
 * @param {number} [decimalDigits] The number of decimal digits to use.
 * @param {string} [thousandSeparator] The thousand separator to use.
 * @param {string} [decimalSeparator] The decimal separator to use.
 * @param {string} [format] The format string to use.
 * @returns {string} The abbreviated and formatted monetary value.
 */
export const abreviate2FormatMoney = (
  number: number,
  symbol?: ICurrency | ICurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
): string => {
  if (!isNumber(number)) return "";
  const { formattedValue: fVal, ...rest } = Currency.formatMoneyAsObject(
    number,
    symbol,
    decimalDigits,
    thousandSeparator,
    decimalSeparator,
    format
  );
  return fVal.replace(
    "%v",
    abreviateNumber(
      number,
      rest.decimalDigits,
      rest.thousandSeparator,
      rest.decimalSeparator
    )
  );
};

/**
 * Abbreviates a number and formats it as a monetary value.
 * @description Abbreviates a number and formats it as a monetary value, using a currency symbol or name, decimal digits, and separators.
 * @param {number} number The number to abbreviate and format.
 * @param {ICurrency | ICurrencySymbol} [symbol] The currency symbol or name.
 * @param {number} [decimalDigits] The number of decimal digits to use.
 * @param {string} [thousandSeparator] The thousand separator to use.
 * @param {string} [decimalSeparator] The decimal separator to use.
 * @param {string} [format] The format string to use.
 * @returns {string} The abbreviated and formatted monetary value.
 */
Number.prototype.abreviate2FormatMoney = function (
  symbol?: ICurrency | ICurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
): string {
  return abreviate2FormatMoney(
    this.valueOf(),
    symbol,
    decimalDigits,
    thousandSeparator,
    decimalSeparator,
    format
  );
};

/**
 * Returns the first non-zero number from a list of arguments, or 0 if no such number exists.
 *
 * This function iterates over the arguments and returns the first one that is a non-zero number.
 * If no such number is found, it returns 0.
 *
 * @param args A list of arguments to check.
 * @returns The first non-zero number, or 0 if no such number exists.
 */
export function defaultNumber(...args: any[]): number {
  for (const arg of args) {
    if (isNumber(arg) && arg !== 0) return arg;
  }
  return 0;
}

// Step 3: Dynamically add formatter methods to Number.prototype
Object.keys(currencies).forEach((currencyKey) => {
  const key: keyof typeof currencies = currencyKey as keyof typeof currencies;
  const currency: ICurrency = currencies[key];
  const functionName: ICurrencyFormatterKey = `format${key}`;
  const abreviate2FormatKey: ICurrencyAbreviate2FormatKey = `abreviate2Format${key}`;
  Number.prototype[functionName] = function (
    decimalDigits?: number,
    thousandSeparator?: string,
    decimalSeparator?: string,
    format?: string
  ): string {
    /**
     * Call the formatMoney function with the current number value and the specified options.
     */
    return Currency.formatMoney(
      this.valueOf(),
      currency,
      decimalDigits,
      thousandSeparator,
      decimalSeparator,
      format
    );
  };
  Number.prototype[abreviate2FormatKey] = function (
    decimalDigits?: number,
    thousandSeparator?: string,
    decimalSeparator?: string,
    format?: string
  ): string {
    /**
     * Call the formatMoney function with the current number value and the specified options.
     */
    return abreviate2FormatMoney(
      this.valueOf(),
      currency,
      decimalDigits,
      thousandSeparator,
      decimalSeparator,
      format
    );
  };
});
