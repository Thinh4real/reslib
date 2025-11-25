import { Dictionary } from '@/types';
import 'reflect-metadata';
import { defaultStr } from '../utils/defaultStr';
import { isNonNullString } from '../utils/isNonNullString';
import { currencies } from './currencies';
import { session } from './session';
import { Currency, CurrencySymbol } from './types';
import { isCurrency } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObj = (x: any) => x && typeof x == 'object';

/**
 * 
 * Extends the default options with the provided Currency object to initialize default values.
   it sets up default values for currency formatting, merging them with any user-provided options. This ensures that all necessary settings are available for the formatting process.
 * 
 * @param options The Currency object to merge with the default options.
 * @returns The merged Currency object with default values.
 */
function prepareOptions(options?: Currency): Currency {
  /**
   * Create a new Currency object with default values.
   */
  const object: Currency = Object.assign({}, session.getCurrency());

  /**
   * If options are provided, merge them with the default object.
   */
  if (options && isObj(options)) {
    /**
     * Iterate over the options object and assign its properties to the default object.
     */
    for (let i in options) {
      if (
        Object.prototype.hasOwnProperty.call(options, i) &&
        options[i as keyof Currency] !== undefined
      ) {
        (object as Dictionary)[i] = options[i as keyof Currency];
      }
    }
  }

  /**
   * If the format property is a non-empty string, parse it to extract decimal digits and format.
   */
  if (isNonNullString(object.format)) {
    const p = parseFormat(object.format);
    if (p.format) {
      object.format = p.format;
    }
    if (typeof p.decimalDigits === 'number') {
      object.decimalDigits = p.decimalDigits;
    }
  }

  /**
   * Return the merged Currency object with default values.
   */
  return object;
}

/**
 *
 * Checks and normalizes the value of decimalDigits to ensure it's a positive integer.
 *
 * @param val The value to check and normalize.
 * @param base The base value to return if the input value is invalid.
 * @returns The normalized value of decimalDigits.
 */
function checkPrecision(val?: number, base?: number): number {
  val = typeof val == 'number' ? val : 0;
  base = typeof base == 'number' ? base : 0;
  /**
   * Ensure the value is a positive integer by taking the absolute value and rounding it.
   */
  val = Math.round(Math.abs(val as number));

  /**
   * If the value is NaN, return the base value. Otherwise, return the normalized value.
   */
  return isNaN(val) ? base : val;
}

/**
 *
 * Parses a format string or object and returns a format object for use in rendering.
 *
 * @param {string | { pos: string, neg?: string, zero?: string } | (() => string | { pos: string, neg?: string, zero?: string })} format
 *   Either a string with the default (positive) format, or an object containing `pos` (required), `neg` and `zero` values (or a function returning either a string or object)
 * @returns {{ pos: string, neg: string, zero: string }} A format object containing positive, negative, and zero formats.
 */
function checkCurrencyFormat(
  format:
    | string
    | { pos: string; neg?: string; zero?: string }
    | (() => string | { pos: string; neg?: string; zero?: string })
): { pos: string; neg: string; zero: string } {
  /**
   * Get the current currency settings.
   */
  const setting = session.getCurrency();

  /**
   * Get the default format from the currency settings.
   */
  const defaultFormat = (setting?.format as string).toLowerCase();

  /**
   * If the format is a string, convert it to lowercase.
   */
  if (typeof format === 'string') {
    format = format.toLowerCase();
  }

  /**
   * If the format is not a string or does not contain "%v", use the default format.
   */
  if (typeof format !== 'string' || !format.match('%v')) {
    format = defaultFormat;
  }

  /**
   * Create and return the positive, negative, and zero formats.
   */
  return {
    /**
     * The positive format is the original format.
     */
    pos: format,

    /**
     * The negative format is the original format with "-" removed and "-%v" inserted.
     */
    neg: format.replace('-', '').replace('%v', '-%v'),

    /**
     * The zero format is the same as the positive format.
     */
    zero: format,
  };
}

/**
 * 
 * Takes a string or array of strings, removes all formatting/cruft, and returns the raw float value.
	The unformat function takes a formatted currency string and converts it back to a raw number. This is useful when you need to perform calculations on currency values that may have been stored or input as formatted strings.
 *
 * Alias: `accounting.parse(string)`
 *
 * Decimal must be included in the regular expression to match floats (default options to
 * accounting.settings.number.decimalSeparator), so if the number uses a non-standard decimalSeparator 
 * separator, provide it as the second argument.
 *
 * Also matches bracketed negatives (eg. "$ (1.99)" => -1.99)
 *
 * Doesn't throw any errors (`NaN`s become 0) but this may change in future
 *
 * @param {string | string[]} value The string or array of strings to unformat.
 * @param {string} [decimalSeparator] The decimal separator to use (defaults to accounting.settings.number.decimalSeparator).
 * @returns {number} The unformatted float value.
 */
const unformat = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  decimalSeparator?: string
): number => {
  /**
   * Get the current currency settings.
   */
  const settings = session.getCurrency();

  /**
   * Fails silently (need decent errors): if value is null or undefined, set it to 0.
   */
  value = value || 0;

  /**
   * Return the value as-is if it's already a number.
   */
  if (typeof value === 'number') {
    return value;
  }

  /**
   * Default decimalSeparator point comes from settings, but could be set to eg. "," in opts.
   */
  decimalSeparator = decimalSeparator || settings.decimalSeparator;

  /**
   * Build regex to strip out everything except digits, decimalSeparator point, and minus sign.
   */
  const regex = new RegExp('[^0-9-' + decimalSeparator + ']', 'g');

  /**
   * Unformat the value by replacing bracketed values with negatives, stripping out cruft, and making sure decimalSeparator point is standard.
   */
  const unformatted = parseFloat(
    ('' + value)
      .replace(/\((?=\d+)(.*)\)/, '-$1') // replace bracketed values with negatives
      .replace(regex, '') // strip out any cruft
      .replace(decimalSeparator as string, '.') // make sure decimalSeparator point is standard
  );

  /**
   * This will fail silently which may cause trouble, let's wait and see: return 0 if unformatted is NaN.
   */
  return !isNaN(unformatted) ? unformatted : 0;
};

/**
 * 
 * Implementation of toFixed() that treats floats more like decimals.
	The toFixed function addresses issues with floating-point precision in JavaScript, ensuring that decimal places are rounded correctly for currency display.
 *
 * Fixes binary rounding issues (eg. (0.615).toFixed(2) === "0.61") that present
 * problems for accounting- and finance-related software.
 *
 * @param {number} value The number to format.
 * @param {number} [decimalDigits] The number of decimal digits to round to (defaults to accounting.settings.decimalDigits).
 * @returns {string} The formatted number as a string.
 */
const toFixed: (value: number, decimalDigits?: number) => string = (
  value: number,
  decimalDigits?: number
): string => {
  /**
   * Get the current currency settings.
   */
  const settings = session.getCurrency();

  /**
   * Check and set the decimal digits to use (defaults to accounting.settings.decimalDigits).
   */
  decimalDigits = checkPrecision(decimalDigits, settings.decimalDigits);

  // Convert to string first to handle very large numbers
  const valueStr = String(value);

  // Remove any non-numeric characters (except decimal point) - unformat substitute
  const cleanValue = valueStr.replace(/[^\d.-]/g, '');

  // Handle BigInt or very large numbers
  if (cleanValue.length > 15 && !cleanValue.includes('.')) {
    // For integers, just add decimal places
    return cleanValue + '.' + '0'.repeat(decimalDigits);
  } else {
    try {
      // For numbers that can be handled by standard JS number operations
      const num = Number(cleanValue);
      if (isNaN(num)) {
        return 'NaN';
      }

      // Use standard exponential trick for standard-sized numbers
      const exponentialForm = Number(num + 'e' + decimalDigits);
      const rounded = Math.round(exponentialForm);
      const finalResult = Number(rounded + 'e-' + decimalDigits).toFixed(
        decimalDigits
      );
      return finalResult;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Fallback for cases where conversion fails
      return 'NaN';
    }
  }
};

/**
 *
 * Format a number, with comma-separated thousands and custom decimalDigits/decimalSeparator places.
 * The formatNumber function takes a number and formats it with the appropriate thousand separators and decimal places, based on the provided options.
 *
 * Alias: `accounting.format()`
 *
 * Localise by overriding the decimalDigits and thousandSeparator / decimalSeparator separators
 * 2nd parameter `decimalDigits` can be an object matching `settings.number`
 *
 * @param {number} number The number to format.
 * @param {Currency | number} [optionsOrDecimalDigits] The options object or decimal digits to use.
 * @param {string} [thousandSeparator] The thousand separator to use.
 * @param {string} [decimalSeparator] The decimal separator to use.
 * @returns {string} The formatted number as a string.
 */
const formatNumber: (
  number: number,
  optionsOrDecimalDigits?: Currency | number,
  thousandSeparator?: string,
  decimalSeparator?: string
) => string = (
  number: number,
  optionsOrDecimalDigits?: Currency | number,
  thousandSeparator?: string,
  decimalSeparator?: string
): string => {
  /**
   * Clean up the number by removing any formatting.
   */
  number = unformat(number);
  /**
   * Prepare the options object from the second parameter (if an object) or all parameters, extending default options.
   */
  const toPrepare: Currency = (
    isCurrency(optionsOrDecimalDigits)
      ? optionsOrDecimalDigits
      : session.getCurrency()
  ) as Currency;
  if (typeof optionsOrDecimalDigits === 'number') {
    toPrepare.decimalDigits = optionsOrDecimalDigits;
  }
  if (typeof toPrepare.decimalDigits !== 'number') {
    toPrepare.decimalDigits = String(number).split('.')[1]?.length;
  }
  if (thousandSeparator !== undefined) {
    toPrepare.thousandSeparator = thousandSeparator;
  }
  if (decimalSeparator !== undefined) {
    toPrepare.decimalSeparator = decimalSeparator;
  }

  /**
   * Build the options object.
   */
  const opts = prepareOptions(toPrepare);

  /**
   * Clean up the decimal digits.
   */
  const usePrecision = checkPrecision(opts.decimalDigits);

  /**
   * Perform some calculations.
   */
  const negative = number < 0 ? '-' : '';
  const base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + '';
  const mod = base.length > 3 ? base.length % 3 : 0;

  /**
   * Format the decimal part of the number.
   */
  let decimalStr = '';
  if (usePrecision) {
    const fNum = String(
      parseFloat(toFixed(Math.abs(number), usePrecision)) || 0
    );
    if (fNum.includes('.')) {
      decimalStr = defaultStr(fNum.split('.')[1]).trim();
    }
  }

  /**
   * Format the number.
   */
  return (
    negative +
    (mod ? base.substring(0, mod) + opts.thousandSeparator : '') +
    base
      .substring(mod)
      .replace(/(\d{3})(?=\d)/g, '$1' + opts.thousandSeparator) +
    (usePrecision && decimalStr ? opts.decimalSeparator + decimalStr : '')
  );
};

/**
 *
 * Format a number into currency.
 * The formatMoney and formatMoneyAsObject functions are the main workhorses of the module. They take a number and format it as a currency string, applying the appropriate symbol, decimal places, and formatting style. The formatMoneyAsObject version provides more detailed information about the formatting process.
 *
 * The symbol can be an object, in which case the other properties can be null.
 * Usage: accounting.formatMoney(number, symbol, decimalDigits, thousandsSep, decimalSep, format)
 * prepareOptions: (0, "$", 2, ",", ".", "%s%v")
 *
 * Localise by overriding the symbol, decimalDigits, thousandSeparator / decimalSeparator separators and format
 * Second param can be an object matching `settings.currency` which is the easiest way.
 *
 * To do: tidy up the parameters
 *
 * @param {number} [number] The number to format.
 * @param {Currency | CurrencySymbol} [symbol] The symbol or options object.
 * @param {number} [decimalDigits] The decimal digits to use.
 * @param {string} [thousandSeparator] The thousand separator to use.
 * @param {string} [decimalSeparator] The decimal separator to use.
 * @param {string} [format] The format to use.
 * @returns {Currency & {
 *   formattedValue: string,
 *   formattedNumber: string,
 *   usedFormat: string,
 *   result: string,
 * }}
 */
const formatMoneyAsObject = (
  number?: number,
  symbol?: Currency | CurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
): Currency & {
  formattedValue: string;
  formattedNumber: string;
  usedFormat: string;
  result: string;
} => {
  /**
   * Clean up the number by removing any formatting.
   */
  number = unformat(number);

  /**
   * Prepare the options object from the second parameter (if an object) or all parameters, extending default options.
   */
  const toPrepare: Currency = isCurrency(symbol)
    ? (symbol as Currency)
    : session.getCurrency();
  if (symbol !== undefined && typeof symbol === 'string') {
    toPrepare.symbol = symbol;
  }
  if (decimalDigits !== undefined) {
    toPrepare.decimalDigits = decimalDigits;
  }
  if (thousandSeparator !== undefined) {
    toPrepare.thousandSeparator = thousandSeparator;
  }
  if (decimalSeparator !== undefined) {
    toPrepare.decimalSeparator = decimalSeparator;
  }
  if (isNonNullString(format)) {
    toPrepare.format = format;
  }

  /**
   * Build the options object.
   */
  const opts = prepareOptions(toPrepare);

  /**
   * Check the format (returns an object with pos, neg, and zero).
   */
  const formats = checkCurrencyFormat(opts.format as string);

  /**
   * Choose which format to use for this value.
   */
  const usedFormat = defaultStr(
    number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero
  );

  /**
   * Format the value.
   */
  const symbolStr = defaultStr(opts.symbol);
  const formattedValue = usedFormat.replace(
    symbolStr ? '%s' : symbolStr,
    symbolStr
  );
  const formattedNumber = formatNumber(
    Math.abs(number),
    checkPrecision(opts.decimalDigits),
    opts.thousandSeparator,
    opts.decimalSeparator
  );
  const result = formattedValue.replace('%v', formattedNumber);

  /**
   * Return the formatted value as an object.
   */
  return {
    ...opts,
    formattedValue,
    formattedNumber,
    symbol: opts.symbol,
    usedFormat,
    result,
  };
};

/**
 *
 * Format a number into currency.
 *
 * The symbol can be an object, in which case the other properties can be null.
 * Usage: accounting.formatMoney(number, symbol, decimalDigits, thousandsSep, decimalSep, format)
 * prepareOptions: (0, "$", 2, ",", ".", "%s%v")
 *
 * Localise by overriding the symbol, decimalDigits, thousandSeparator / decimalSeparator separators and format
 * Second param can be an object matching `settings.currency` which is the easiest way.
 *
 * To do: tidy up the parameters
 *
 * @param {number} [number] The number to format.
 * @param {Currency | CurrencySymbol} [symbol] The symbol or options object.
 * @param {number} [decimalDigits] The decimal digits to use.
 * @param {string} [thousandSeparator] The thousand separator to use.
 * @param {string} [decimalSeparator] The decimal separator to use.
 * @param {string} [format] The format to use.
 * @returns {string} The formatted number as a string.
 */
const formatMoney: (
  number?: number,
  symbol?: Currency | CurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
) => string = (
  number?: number,
  symbol?: Currency | CurrencySymbol,
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
): string => {
  /**
   * Format the number into currency using the formatMoneyAsObject function.
   */
  return formatMoneyAsObject(
    number,
    symbol,
    decimalDigits,
    thousandSeparator,
    decimalSeparator,
    format
  ).result;
};

/**
 *
 * Parse the currency format and return an object containing the parsed format and decimal digits.
 * The parseFormat function helps interpret custom format strings, allowing users to specify how they want their currency displayed (e.g., where the symbol should appear, how many decimal places to show).
 *
 * @param {string} [format] The currency format, a string combining the characters %s, %v, and .#{0,n}, where:
 *   - %s represents the currency symbol,
 *   - %v represents the value to be formatted,
 *   - .#{0,n} represents the number of decimal digits to use, with n being the number of decimal digits.
 * For example, the format %v %s .### formats the number 12555.6893300244 as $12555.689, with 3 decimal digits.
 * If no decimal digits are desired, simply omit the # characters after the dot (e.g., %s %v .).
 *
 * @returns {Currency} An object containing the parsed format and decimal digits.
 */
const parseFormat: (format?: string) => Currency = (
  format?: string
): Currency => {
  /**
   * Trim the format string.
   */
  format = defaultStr(format).trim();

  /**
   * Initialize the return object.
   */
  const ret: Currency = {} as Currency;

  /**
   * Check if the format string is not empty.
   */
  if (format) {
    /**
     * Regular expression to match the decimal digits specification.
     */
    // eslint-disable-next-line no-useless-escape
    const reg = /(\.)(\#{0,9}\s*$)/;

    /**
     * Match the decimal digits specification in the format string.
     */
    const m = format.match(reg);

    /**
     * If a match is found, extract the decimal digits.
     */
    if (Array.isArray(m) && m.length === 3) {
      /**
       * Extract the decimal digits from the match.
       */
      ret.decimalDigits = defaultStr(m[2]).trim().length;
    }

    /**
     * Remove the decimal digits specification from the format string.
     */
    format = format.replace(reg, '');
  }

  /**
   * Set the parsed format.
   */
  ret.format = format;

  /**
   * Return the parsed format and decimal digits.
   */
  return ret as Currency;
};

/**
 *
 * @description
 * Description of the format for displaying numeric values.
 *
 * The format is a string consisting of the letters %v and %s, where:
 *   - %v represents the value of the amount,
 *   - %s represents the currency.
 * For example, %s%v => $10 and %v %s => 10 $.
 *
 * To define the decimal places, use the pattern [.][#{0,n}], for example:
 *   - .### for display with 3 decimal places,
 *   - . for no decimal places in the display.
 * For example, the format %v %s .## returns: 12.35 $ for the value 12.357777 converted to dollars.
 */
/* const formatDescription: string = `Display format for numerical values: a character string consisting of the letters %v and %s, where %v represents the value of the amount and %s represents the currency: example %s%v => $10 and %v %s => $10.
	To define decimals, use the [.][#{0,n}] pattern, e.g. .### for display with 3 decimals and . to exclude decimals from the display. 
	for example, the format %v %s .## returns: 12.35 $ for the value 12.357777 converted into dollard.  
`; */

export const CurrencyUtils = {
  parse: unformat,
  session,
  formatMoney,
  currencies,
  isCurrency,
  formatNumber,
  formatMoneyAsObject,
  unformat,
  toFixed,
  //formatDescription,
  prepareOptions,
  parseFormat,
};

export * from './types';
