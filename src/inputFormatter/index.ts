import { CountriesManager, ICountryCode } from '@countries/index';
import { Logger } from '@logger';
import { DateHelper } from '@utils/date/dateHelper';
import { defaultStr } from '@utils/defaultStr';
import { isEmpty } from '@utils/isEmpty';
import { isNonNullString } from '@utils/isNonNullString';
import { isNullable } from '@utils/isNullable';
import { isNumber } from '@utils/isNumber';
import { isPrimitive } from '@utils/isPrimitive';
import { isRegExp } from '@utils/isRegex';
import { stringify } from '@utils/stringify';
import libPhoneNumber, {
  PhoneNumber,
  PhoneNumberFormat,
} from 'google-libphonenumber';
import moment from 'moment';
import 'reflect-metadata';
import '../utils/numbers';
import {
  IInputFormatterMask,
  IInputFormatterMaskArray,
  IInputFormatterMaskOptions,
  IInputFormatterMaskResult,
  IInputFormatterMaskWithValidation,
  IInputFormatterOptions,
  IInputFormatterResult,
} from './types';

const phoneUtil = libPhoneNumber.PhoneNumberUtil.getInstance();
const asYouTypeFormatter = libPhoneNumber.AsYouTypeFormatter;

const DIGIT_REGEX = /\d/;
const LETTER_REGEX = /[a-zA-Z]/;

export * from './types';

export class InputFormatter {
  /**
   * @description
   * Formats a value according to the provided options defined in the IInputFormatterOptions interface.
   *
   * This function takes an input value and formats it based on the specified type, format function,
   * and other parameters. It returns an object containing the formatted value and other relevant
   * information, such as whether the value can be a decimal.
   *
   * @param {IInputFormatterOptions} options - The options for formatting, adhering to the IInputFormatterOptions interface.
   * @param {boolean} returnObject - Optional. If true, the function will return an object instead of a formatted string.
   *
   * @returns {IInputFormatterResult} - An object containing:
   *   - formattedValue: The formatted output based on the provided options.
   *   - isDecimalType: A boolean indicating if the value can be treated as a decimal.
   *   - value: The original input value.
   *   - format: The formatting function or type used.
   *   - parsedValue: The parsed numeric value.
   *   - decimalValue: The decimal representation of the value, defaulting to 0 if not applicable.
   *
   * Example:
   * ```typescript
   * const options = {
   *   value: "123.45",
   *   type: "decimal",
   *   format: (opts) => `${opts.value} formatted`,
   * };
   * const result = formatValue(options);
   * console.log(result);
   * // Output: {
   * //   formattedValue: "123.45 formatted",
   * //   isDecimalType: true,
   * //   value: "123.45",
   * //   format: [Function],
   * //   parsedValue: 123.45,
   * //   decimalValue: 123.45
   * // }
   * ```
   */
  static formatValue({
    value,
    type,
    format,
    dateFormat,
    phoneCountryCode,
    abreviateNumber,
    ...rest
  }: IInputFormatterOptions): IInputFormatterResult {
    const canValueBeDecimal =
      type &&
      ['decimal', 'numeric', 'number'].includes(String(type).toLowerCase());
    let parsedValue = value;
    const result: Partial<IInputFormatterResult> = {};
    // Normalize the value: if it's undefined, null, or empty, set it to an empty string.
    value = isNullable(value) ? '' : value;
    if (!value) {
      // If the value is empty and can be decimal, set parsedValue to 0; otherwise, set it to an empty string.
      parsedValue = canValueBeDecimal ? 0 : String(value);
    }

    // If the value can be a decimal, parse it accordingly.
    if (canValueBeDecimal) {
      parsedValue = InputFormatter.parseDecimal(value);
    }

    // Convert non-string values to strings.
    let formattedValue: any = isPrimitive(value)
      ? String(value)
      : DateHelper.isDateObj(value)
        ? value
        : stringify(value, { escapeString: false });

    // If a format function is provided, use it to format the value.
    if (typeof format === 'function') {
      formattedValue = format({
        ...rest,
        dateFormat,
        phoneCountryCode,
        type,
        value,
      });
    } else {
      const typeText = String(type).toLowerCase();
      let hasFoundDate = false;
      // Format dates if the value is a valid date object.
      if (dateFormat || ['time', 'date', 'datetime'].includes(typeText)) {
        dateFormat = defaultStr(
          dateFormat,
          typeText === 'time'
            ? DateHelper.getDefaultTimeFormat()
            : typeText === 'date'
              ? DateHelper.getDefaultDateFormat()
              : DateHelper.getDefaultDateTimeFormat()
        );
        const parsedDate = DateHelper.parseDate(value);
        if (parsedDate) {
          hasFoundDate = true;
          formattedValue = DateHelper.formatDate(parsedDate, dateFormat);
          result.dateValue = parsedDate;
        }
        result.dateFormat = dateFormat;
      } else if ('tel' === typeText) {
        const phoneNumber = InputFormatter.formatPhoneNumber(
          value,
          phoneCountryCode
        );
        formattedValue = defaultStr(phoneNumber, formattedValue);
        result.phoneCountryCode = defaultStr(phoneCountryCode) as ICountryCode;
        const parsed = InputFormatter.parsePhoneNumber(
          phoneNumber as string,
          phoneCountryCode
        );
        if (parsed) {
          result.dialCode = parsed.getCountryCode() + '';
          result.phoneCountryCode = defaultStr(
            phoneUtil.getRegionCodeForNumber(parsed),
            phoneCountryCode
          ) as ICountryCode;
        } else if (phoneCountryCode) {
          result.dialCode = InputFormatter.getCountryDialCode(phoneCountryCode);
        }
        result.phoneNumber = InputFormatter.prefixPhoneNumberWithDialCode(
          formattedValue,
          result.dialCode as string
        ).replace(/\s/g, '');
      }
      if (hasFoundDate) {
      }
      // Format numbers based on the specified format.
      else if (isNumber(parsedValue)) {
        const abreviateFnStr = `abreviate2${defaultStr(format, 'FormatNumber').trim().upperFirst()}`;
        if (
          abreviateNumber &&
          typeof (Number.prototype as any)[abreviateFnStr] === 'function'
        ) {
          formattedValue = (parsedValue as any)[abreviateFnStr]();
        } else if (
          isNonNullString(format) &&
          typeof Number.prototype[format as keyof Number] === 'function'
        ) {
          formattedValue = (parsedValue as number)[format as keyof Number]();
        } else {
          formattedValue = (parsedValue as number).formatNumber();
        }
      }
    }
    // Return an object containing the formatted value and additional details.
    return {
      formattedValue,
      isDecimalType: canValueBeDecimal,
      value,
      format,
      parsedValue,
      decimalValue: typeof parsedValue == 'number' ? parsedValue : 0,
      ...result,
    };
  }
  /**
   * Gets the dial code for a given country code.
   *
   * @param {ICountryCode} code The country code.
   * @returns {string} The dial code for the given country code, or an empty string if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountriesManager.getCountryDialCode('US')); // '+1'
   * ```
   */
  static getCountryDialCode(countryCode: ICountryCode): string {
    const r = defaultStr(CountriesManager.getCountry(countryCode)?.dialCode);
    if (r) return r;
    try {
      // Get the country calling code (dial code)
      const countryCallingCode = phoneUtil.getCountryCodeForRegion(countryCode);

      // If the calling code is 0, it means the region code is invalid or not found
      if (countryCallingCode !== 0) {
        return countryCallingCode.toString();
      }
    } catch (error) {}
    return '';
  }
  /**
   * @description
   * Formats a value based on the provided options and returns the formatted string.
   *
   * This function serves as a simpler interface for formatting values. It internally calls
   * the `formatValue` function to obtain the formatted value and then returns it
   * as a string. This is useful for scenarios where only the formatted string is needed.
   *
   * @param options - The options for formatting, adhering to the IInputFormatterOptions interface.
   * @ param returnObject - Optional. If true, the function will return an object instead of a formatted string.
   *
   * @returns {string} - The formatted value as a string.
   *
   * Example:
   * ```typescript
   * const options = {
   *   value: "123.45",
   *   type: "decimal",
   *   format: (opts) => `${opts.value} formatted`,
   * };
   * const formattedString = formatValue(options);
   * console.log(formattedString);
   * // Output: "123.45 formatted"
   * ```
   */
  static formatValueAsString(options: IInputFormatterOptions): string {
    const { formattedValue, parsedValue } = InputFormatter.formatValue(options);
    // Return the formatted value as a string.
    return formattedValue;
  }
  /***
   * Check if a given mask is valid or not
   * @param {IInputFormatterMask}, the input mask to check
   * @return {boolean} Wheather the mask is valid or not
   */
  static isValidMask(mask?: IInputFormatterMask) {
    return Array.isArray(mask) || typeof mask === 'function';
  }
  /**
   * Parses a given value and converts it into a decimal number.
   *
   * This function takes a value as input and performs the following checks:
   * - If the value is already a number, it returns the value directly.
   * - If the value is undefined, null, or not a string, it returns 0.
   * - If the value is a string, it trims whitespace, replaces commas with periods,
   *   and removes any spaces before converting it to a float.
   *
   * ### Parameters:
   * - `value`:
   *   - **Type**: `any`
   *   - The value to be parsed. This can be a number, string, or any other type.
   *     The function will attempt to convert it to a decimal number.
   *
   * ### Returns:
   * - **Type**: `number`
   *   - The decimal representation of the input value. If the input is invalid
   *     (e.g., undefined, null, or not a valid string), it returns 0.
   *
   * ### Example Usage:
   * ```typescript
   * const decimal1 = parseDecimal("1,234.56"); // Returns: 1234.56
   * const decimal2 = parseDecimal(789);         // Returns: 789
   * const decimal3 = parseDecimal(null);         // Returns: 0
   * const decimal4 = parseDecimal("invalid");    // Returns: 0
   * ```
   */
  static parseDecimal = (value: any): number => {
    if (typeof value === 'number') return value;
    if (
      value == undefined ||
      value == null ||
      !value ||
      typeof value !== 'string'
    ) {
      return 0;
    }
    const v = parseFloat(InputFormatter.normalizeNumber(value));
    return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  };
  /***
    Normalize a value to a string. 
    This method takes a value and a facultative decimal separator. It removes leading and trailing
    whitespace, commas. It also replaces the comma with the decimal separator.
    If the value is a number, it will be converted to a string.
    @param {any} value - The value to normalize
    @param {string} decimalSeparator - The decimal separator to use
  */
  static normalizeNumber(value: any, decimalSeparator: string = '.') {
    if (typeof value == 'number') {
      return value.toString();
    }
    if (!value || value == undefined || value == null) return '0';
    return String(value)
      .trim()
      .replace(/\s/g, '')
      .replace(/[,٫·]/g, decimalSeparator);
  }
  /***
   * Check if the value ends with a decimal separator
   * @param {any} value - The value to Check
   * @returns {boolean} Whether the value ends with a decimal separator
   */
  static endsWithDecimalSeparator = (value: any): boolean => {
    const val = String(value).trim().replace(/\s/g, '');
    return val.endsWith('.') || val.endsWith(',') || val.endsWith('٫');
  };
  /**
   * Formats a value with a mask.
   *
   * This method takes an options object with a value, mask, and other settings, and returns an object with the masked, unmasked, and obfuscated values, as well as the original mask array.
   *
   * @param options The options object with the value, mask, and other settings.
   * @returns An object with the masked, unmasked, and obfuscated values, as well as the original mask array.
   *
   * @example
   * ```typescript
   * const options: IInputFormatterMaskOptions = {
   *   value: '12345',
   *   mask: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
   *   obfuscationCharacter: '*',
   * };
   * const result = formatWithMask(options);
   * console.log(result);
   * // Output:
   * ```
   *
   *
   * @license This code is adapted from [Original Repository Name] (https://github.com/CaioQuirinoMedeiros/react-native-mask-input).
   *
   * Copyright (c) [2025] [CaioQuirinoMedeiros]
   * Licensed under the MIT License (https://github.com/CaioQuirinoMedeiros/react-native-mask-input/blob/main/LICENSE)
   *
   */
  static formatWithMask(
    options: IInputFormatterMaskOptions
  ): IInputFormatterMaskResult {
    options = Object.assign({}, options);
    const {
      value: customValue,
      maskAutoComplete,
      placeholderCharacter: customPlaceholderCharacter,
      mask,
      validate,
      obfuscationCharacter /* maskAutoComplete = false*/,
    } = options;
    const stValue = isEmpty(customValue)
      ? ''
      : customValue === undefined
        ? ''
        : ['number', 'boolean', 'string'].includes(typeof customValue)
          ? customValue.toString()
          : customValue === null
            ? ''
            : customValue?.toString() || String(customValue);
    const value = defaultStr(stValue);
    const mArray =
      typeof mask === 'function' ? mask({ ...options, value }) : mask;
    const maskArray = Array.isArray(mArray) ? mArray : [];
    const placeholderCharacter = defaultStr(
      customPlaceholderCharacter,
      '_'
    ).charAt(0);
    let placeholder = '';
    maskArray.map((mask) => {
      placeholder += String(
        isNonNullString(mask)
          ? mask
          : Array.isArray(mask) && isNonNullString(mask[1])
            ? mask[1]
            : placeholderCharacter
      ).charAt(0);
    });
    let maskedPlaceholder = placeholder;
    let isValid = true;
    const calValidate = (value: string) =>
      typeof validate === 'function' ? validate(value) : true;
    // make sure it'll not break with null or undefined inputs
    if (!maskArray.length || !value) {
      return {
        maskHasObfuscation: false,
        maskedPlaceholder,
        masked: value,
        unmasked: value,
        obfuscated: value,
        maskArray,
        placeholder,
        isValid: isValid && calValidate(value),
        nonRegexReplacedChars: [],
      };
    }
    let masked = '';
    let obfuscated = '';
    let unmasked = '';
    let maskCharIndex = 0;
    let valueCharIndex = 0;
    let maskHasObfuscation = false;
    const placeholderLength = placeholder.length;
    const nonRegexReplacedChars: IInputFormatterMaskResult['nonRegexReplacedChars'] =
      [];
    while (maskCharIndex < maskArray.length) {
      if (valueCharIndex >= value.length) {
        break;
      }
      const maskChar = maskArray[maskCharIndex];
      const valueChar = value[valueCharIndex];
      const customNonRegexReplacedChars: IInputFormatterMaskResult['nonRegexReplacedChars'] =
        [];
      let {
        isValid: customIsValid,
        masked: customMasked,
        obfuscated: cusotmObfuscated,
        isMaskRegex,
      } = handleMaskAtIndex({
        maskChar,
        nonRegexReplacedChars: customNonRegexReplacedChars,
        valueChar,
        obfuscationCharacter,
        valueCharIndex,
        maskCharIndex,
      });
      masked += customMasked;
      obfuscated += cusotmObfuscated;
      unmasked += valueChar;
      if (isMaskRegex && placeholderLength > valueCharIndex) {
        maskedPlaceholder =
          maskedPlaceholder.substring(0, maskCharIndex) +
          customMasked +
          maskedPlaceholder.substring(valueCharIndex + 1);
      }
      maskCharIndex += 1;
      valueCharIndex += 1;
      let canBreak = false;
      if (
        maskAutoComplete &&
        !isMaskRegex &&
        maskCharIndex < maskArray.length &&
        valueCharIndex < maskArray.length &&
        valueCharIndex == value.length &&
        valueChar !== customMasked
      ) {
        const nextOpts = handleMaskAtIndex({
          maskChar: maskArray[maskCharIndex],
          nonRegexReplacedChars: [],
          valueChar,
          obfuscationCharacter,
          valueCharIndex,
          maskCharIndex,
        });
        if (
          nextOpts.isMaskRegex &&
          nextOpts.isValid &&
          nextOpts.masked == valueChar
        ) {
          masked += valueChar;
          obfuscated += nextOpts.obfuscated;
          maskCharIndex += 1;
          valueCharIndex += 1;
          customIsValid = true;
          delete customNonRegexReplacedChars[0];
          canBreak = true;
        }
      }
      if (customNonRegexReplacedChars[0]) {
        nonRegexReplacedChars.push(...customNonRegexReplacedChars);
      }
      if (!customIsValid) {
        isValid = false;
      }
      if (canBreak) {
        break;
      }
    }
    return {
      masked,
      nonRegexReplacedChars,
      isValid: isValid && calValidate(value),
      maskHasObfuscation,
      placeholder,
      maskedPlaceholder,
      unmasked,
      obfuscated,
      maskArray,
    };
  }
  /***
   * Predefined masks for common moment formats.
   * The keys of the object are the moment format strings, and the values are arrays of regular expressions or strings that define the expected format of the input value.
   */
  static MOMENT_MASKS_MAP = {
    // Year tokens
    YYYY: Array(4).fill([DIGIT_REGEX, 'Y']),
    YY: Array(2).fill([DIGIT_REGEX, 'Y']),

    // Month tokens
    MM: Array(2).fill([DIGIT_REGEX, 'M']),
    M: [[DIGIT_REGEX, 'M']],
    MMMM: Array(9).fill([LETTER_REGEX, 'M']), // Longest month name (September)
    MMM: Array(3).fill([LETTER_REGEX, 'M']),

    // Day tokens
    DD: Array(2).fill([DIGIT_REGEX, 'D']),
    D: [[DIGIT_REGEX, 'D']],

    // Hour tokens
    HH: Array(2).fill([DIGIT_REGEX, 'H']), // 24-hour
    H: [[DIGIT_REGEX, 'H']], // 24-hour
    hh: Array(2).fill([DIGIT_REGEX, 'h']), // 12-hour
    h: [[DIGIT_REGEX, 'h']], // 12-hour

    // Minute tokens
    mm: Array(2).fill([DIGIT_REGEX, 'm']),
    m: [[DIGIT_REGEX, 'm']],

    // Second tokens
    ss: Array(2).fill([DIGIT_REGEX, 's']),
    s: [[DIGIT_REGEX, 's']],

    // Millisecond token
    SSS: Array(3).fill([DIGIT_REGEX, 'S']),

    // Timezone tokens
    Z: [/[+-]/, DIGIT_REGEX, DIGIT_REGEX, DIGIT_REGEX, DIGIT_REGEX],
    ZZ: [/[+-]/, DIGIT_REGEX, DIGIT_REGEX, DIGIT_REGEX, DIGIT_REGEX],

    // AM/PM
    A: ['A', 'M'],
    a: ['a', 'm'],
  };
  /***
   * A map of moment separators and their corresponding characters.
   * The keys of the object are the separators, and the values are the corresponding characters.
   */
  static MOMENT_SEPARATOR_MAP = {
    '/': '/',
    '-': '-',
    '.': '.',
    ' ': ' ',
    ':': ':',
    T: 'T',
  };
  /***
   * Creates a date mask, based on the specified moment format.
   * @param {string} momentDateFormat - The moment format string.
   * @returns {IInputFormatterMaskWithValidation}} - An object containing the mask and a validation function.
   */
  static createDateMask(
    momentDateFormat: string
  ): IInputFormatterMaskWithValidation {
    momentDateFormat = defaultStr(momentDateFormat);

    const maskMap = InputFormatter.MOMENT_MASKS_MAP;
    const separatorMap = InputFormatter.MOMENT_SEPARATOR_MAP;

    let result: IInputFormatterMaskArray = [];
    let currentToken = '';
    let i: number = 0;
    while (i < momentDateFormat.length) {
      // Handle separators
      if (separatorMap[momentDateFormat[i] as keyof typeof separatorMap]) {
        if (currentToken) {
          result.push(...(maskMap[currentToken as keyof typeof maskMap] || []));
          currentToken = '';
        }
        result.push(
          separatorMap[momentDateFormat[i] as keyof typeof separatorMap]
        );
        i++;
        continue;
      }

      // Build token
      currentToken += momentDateFormat[i];

      // Check if we have a complete token
      if (maskMap[currentToken as keyof typeof maskMap]) {
        result.push(...maskMap[currentToken as keyof typeof maskMap]);
        currentToken = '';
        i++;
        continue;
      }

      // Check if adding next character would make an invalid token
      if (
        !Object.keys(maskMap).some(
          (key) => currentToken && key.startsWith(currentToken)
        )
      ) {
        if (currentToken) {
          // Handle unknown token as literal characters
          result.push(...currentToken.split(''));
          currentToken = '';
        }
        i++;
      } else {
        i++;
      }
    }

    // Handle any remaining token
    if (currentToken && maskMap[currentToken as keyof typeof maskMap]) {
      result.push(...maskMap[currentToken as keyof typeof maskMap]);
    }
    return {
      mask: result,
      validate: (value: string) => {
        if (!momentDateFormat || !isNonNullString(value)) {
          return false;
        }
        try {
          const date = moment(value, momentDateFormat, true);
          // Check if the parsed date matches the input exactly
          // This ensures that the input is not only valid but also logically correct
          return date.isValid() && date.format(momentDateFormat) === value;
        } catch (e) {}
        return false;
      },
    };
  }
  /***
   * A mask for single facilitative space.
   * @description A mask for a single facilitative space.
   */
  static SINGLE_SPACE_MASK = ' '; //:[mask: RegExp, placeholderCharacter: string] = [/^ ?$/, ' '];
  /**
   * Generates a phone number mask based on the country code.
   * @param countryCode - The country code (e.g., "US", "FR", "IN").
   * @param {PhoneNumberFormat} [format] - The format to use for the phone number mask. Defaults to PhoneNumberFormat.INTERNATIONAL.
   * @returns {IInputFormatterMaskWithValidation} The phone number mask, an array of mask elements (strings or regexes) representing the phone number format..
   */

  static createPhoneNumberMask(
    countryCode: ICountryCode,
    format?: PhoneNumberFormat
  ): IInputFormatterMaskWithValidation {
    const countryExample = CountriesManager.getPhoneNumberExample(countryCode);
    if (isNonNullString(countryExample)) {
      const r = InputFormatter.createPhoneNumberMaskFromExample(
        countryExample,
        countryCode
      );
      if (r.mask.length) {
        return r;
      }
    }
    if (!isNonNullString(countryCode)) {
      return {
        mask: [],
        validate: (value: string) => false,
      };
    }
    try {
      // Get an example phone number for the given country code
      const exampleNumber = InputFormatter.getPhoneNumberExample(countryCode);
      if (!exampleNumber) {
        //throw new Error(`No example number found for country code: ${countryCode}`);
        return {
          mask: [],
          validate: (value: string) => false,
        };
      }
      const toFormat = format || PhoneNumberFormat.INTERNATIONAL;
      // Get formatted version
      const formattedNumber = phoneUtil.format(exampleNumber, toFormat);
      // Get dial code
      const dialCode = exampleNumber.getCountryCode() + '';
      return {
        dialCode,
        mask: generatePhoneNumberMaskArray(formattedNumber, dialCode),
        validate: (value: string) =>
          InputFormatter.isValidPhoneNumber(value, countryCode),
        countryCode,
      };
    } catch (error) {
      return {
        mask: [],
        validate: (value: string) => false,
      };
    }
  }
  /****
   * Gets the phone number example for the given country code.
   * @param countryCode The country code.
   * @returns {PhoneNumber|null} The phone number example for the given country code, or null if no example is found.
   */
  static getPhoneNumberExample(countryCode: ICountryCode): PhoneNumber | null {
    if (!isNonNullString(countryCode)) {
      return null;
    }
    const example = CountriesManager.getPhoneNumberExample(countryCode);
    if (isNonNullString(example)) {
      return InputFormatter.parsePhoneNumber(example);
    }
    try {
      return phoneUtil.getExampleNumber(countryCode);
    } catch (error) {
      return null;
    }
  }

  /**
  *  Creates a phone number mask based on the provided phone number example and country code.
  *  Uses google-libphonenumber to ensure accurate regional formatting
    
    This function takes a phone number example and an optional country code as input. It creates a mask based on the example number and the country code.
    
    The function returns an object with a mask and a validation function. The mask is an array of mask elements, where each element represents a character or a regex pattern. The validation function checks if the input value is a valid phone number based on the provided country code.
    
    If the country code is not provided, the default country code is used. If no example number is found for the provided country code, the function returns an empty mask and a validation function that always returns false.
    
    @param {string} phoneNumberExample - The phone number example to use for the mask.
    @param {ICountryCode} [countryCode] - The country code to use for the mask. If not provided, the default country code is used.
    @returns {IInputFormatterMaskWithValidation} An object containing the mask and a validation function.
  */
  static createPhoneNumberMaskFromExample(
    phoneNumber: string,
    countryCode?: ICountryCode,
    format?: PhoneNumberFormat
  ): IInputFormatterMaskWithValidation {
    const r = genPhoneNumberMask(
      InputFormatter.parsePhoneNumber(phoneNumber, countryCode),
      format
    );
    if (r.mask.length > 0) {
      return r;
    }
    if (isNonNullString(countryCode)) {
      return genPhoneNumberMask(
        InputFormatter.getPhoneNumberExample(countryCode),
        format
      );
    }
    return {
      mask: [],
      validate: (value: string) => false,
    };
  }

  /**
   * Predefined masks for common input formats.
   *
   * This object contains a set of predefined masks for common input formats such as date, time, date-time, and credit card numbers.
   * Each mask is an array of regular expressions or strings that define the expected format of the input value.
   * ```
   */
  static MASKS_WITH_VALIDATIONS = {
    /**
     * Mask for date input format.
     *
     * This mask expects the input value to be in the format of `YYYY-MM-DD` or `YYYY/MM/DD` or `YYYY.MM.DD`.
     */
    get DATE() {
      return InputFormatter.createDateMask(DateHelper.getDefaultDateFormat());
    },
    /**
     * Mask for time input format.
     *
     * This mask expects the input value to be in the format of `HH:MM:SS` or `HHHMMSS`.
     */
    get TIME() {
      return InputFormatter.createDateMask(DateHelper.getDefaultTimeFormat());
    },
    get DATE_TIME() {
      return InputFormatter.createDateMask(
        DateHelper.getDefaultDateTimeFormat()
      );
    },
    CREDIT_CARD: {
      mask: [
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        ' ',
        [/\d/],
        [/\d/],
        [/\d/],
        [/\d/],
        ' ',
        [/\d/],
        [/\d/],
        [/\d/],
        [/\d/],
        ' ',
        /\d/,
        /\d/,
        /\d/,
        /\d/,
      ] as IInputFormatterMaskArray,
      validate: (value: string) => true,
    },
  };
  /***
   * Parse a phone number using the google-libphonenumber library.
   * @param {string} number - The phone number to parse.
   * @param {ICountryCode} [countryCode] - The country code to use for parsing the phone number.
   * @returns {PhoneNumber | null} The parsed phone number, or null if the parsing fails.
   * @example
   * // Parse a phone number
   * const phoneNumber = InputFormatter.parsePhoneNumber('+1 (555) 123-4567');
   * console.log(phoneNumber); // Output: PhoneNumber { countryCode: 'US', nationalNumber: '5551234567', ...}
   *
   */
  static parsePhoneNumber(
    number: string,
    countryCode?: ICountryCode
  ): PhoneNumber | null {
    number = defaultStr(number);
    try {
      return phoneUtil.parse(number, defaultStr(countryCode).toLowerCase());
    } catch (err) {
      return null;
    }
  }
  /***
   * Prefix a phone number with a dial code.
   * @param {string} phoneNumber - The phone number to prefix.
   * @param {string} dialCode - The dial code to prefix the phone number with.
   * @returns {string} The prefixed phone number.
   * @example
   * // Prefix a phone number with a dial code
   * const prefixedPhoneNumber = InputFormatter.prefixPhoneNumberWithDialCode('5551234567', '+1');
   * console.log(prefixedPhoneNumber); // Output: +15551234567
   */
  static prefixPhoneNumberWithDialCode(
    phoneNumber: string,
    dialCode: string
  ): string {
    if (typeof phoneNumber !== 'string') return '';
    if (!isNonNullString(dialCode)) return phoneNumber;
    dialCode = '+' + dialCode.ltrim('+');
    if (
      !phoneNumber.startsWith(dialCode) &&
      !phoneNumber.trim().startsWith('+')
    )
      return dialCode.trim() + ' ' + phoneNumber.ltrim(' ');
    return phoneNumber;
  }

  /**
   * Validates a phone number using the google-libphonenumber library.
   *
   * @param {string} phoneNumber The phone number to validate.
   * @param {ICountryCode}, The country code to use for validation. If not provided, the default country code will be used.
   * @returns True if the phone number is valid, false otherwise.
   * @throws Error if there's an issue parsing the phone number.
   * @example
   * ```typescript
   * const isValid = isValidPhoneNumber ('+1 202 555 0144');
   * console.log(isValid); // Output: true
   * ```
   */
  static isValidPhoneNumber(
    phoneNumber: string,
    countryCode?: ICountryCode
  ): phoneNumber is string {
    const phoneInfo = this.parsePhoneNumber(phoneNumber, countryCode);
    if (phoneInfo) {
      return phoneUtil.isValidNumber(phoneInfo);
    }
    return false;
  }

  /***
   * An utility function that formats phone numbers using Google's libphonenumber library.
   * @example
   * // Returns "+1 650 253 0000"
   * InputFormatter.formatPhoneNumber("6502530000", "US");
   *
   * @example
   * // Returns "+44 20 7031 3000"
   * InputFormatter.formatPhoneNumber("2070313000", "GB");
   *
   * @example
   * // Returns "+33 1 42 68 53 00"
   * InputFormatter.formatPhoneNumber("+33142685300");
   *
   * @example
   * // Returns null (invalid phone number)
   * InputFormatter.formatPhoneNumber("123", "US");
   * Formats a phone number using the google-libphonenumber library.
   * @param {string} phoneNumber - The phone number to format (can be in various formats)
   * @param {ICountryCode}, - ISO 3166-1 alpha-2 country code to use if the phone number doesn't have a country code
   * @returns The formatted international phone number or null if parsing fails
   *
   */
  static formatPhoneNumber(
    phoneNumber: string,
    countryCode?: ICountryCode
  ): string | null {
    phoneNumber = defaultStr(phoneNumber);
    try {
      const formatter = new asYouTypeFormatter(
        defaultStr(countryCode).toLowerCase().trim()
      ); // eslint-disable-line new-cap
      // Clear any previous state in the formatter
      formatter.clear();
      let formatted = '';
      phoneNumber
        .replace(/-/g, '')
        .replace(/ /g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .split('')
        .forEach((n) => {
          formatted = formatter.inputDigit(n);
        });
      return formatted || null;
    } catch (e) {
      Logger.log(
        e,
        ' input formatter formatting phone number phoneNumber =',
        phoneNumber,
        ', countryCode=',
        countryCode
      );
      return null;
    }
  }
  /***
   * Cleans the phone number string by removing leading and trailing whitespace,
   * replacing dots and hyphens with empty strings, and trimming the string.
   *
   * @param phoneNumber - The phone number string to Clean
   * @returns The cleaned phone number string
   */
  static cleanPhoneNumber(phoneNumber: string): string {
    if (!isNonNullString(phoneNumber)) return '';
    return phoneNumber.trim().replace(/\s/g, '');
  }
  /**
   * Extracts the country dial code from international phone numbers.
   * Supports formats based on ITU-T E.164 and common regional variations.
   *
   * Supported formats:
   * 1. E.164 format: +[country code][area code][local number]
   *    Example: +12125551234
   *
   * 2. International format with spaces/separators:
   *    - +[country code] [area code] [local number]
   *    - +[country code].[area code].[local number]
   *    - +[country code]-[area code]-[local number]
   *    Examples:
   *    - +1 212 555 1234
   *    - +44.20.7123.4567
   *    - +81-3-1234-5678
   *
   * 3. International format with parentheses:
   *    - +[country code] ([area code]) [local number]
   *    - ([country code]) [area code] [local number]
   *    Examples:
   *    - +1 (212) 555-1234
   *    - (44) 20 7123 4567
   *
   * 4. 00 prefix format (common in Europe):
   *    - 00[country code][remainder]
   *    Example: 00441234567890
   *
   * 5. Regional formats:
   *    - 011[country code] (US/Canada international prefix)
   *    - 010[country code] (Japan international prefix)
   *
   * @param phoneNumber - The phone number string to extract the dial code from
   * @param countryCode - The country code to use for extracting the dial code
   * @returns The dial code with + prefix, or null if no valid code is found
   */
  static extractDialCodeFromPhoneNumber(
    phoneNumber: string,
    countryCode?: ICountryCode
  ): string {
    try {
      const parsedNumber = InputFormatter.parsePhoneNumber(
        phoneNumber,
        countryCode
      );
      if (parsedNumber) {
        // Get dial code
        return parsedNumber.getCountryCode() + '';
      }
    } catch (e) {}
    return '';
  }

  /***
   * Check if the provided number is a valid numeric string.
   * @param {string} n The number to check.
   * @returns {boolean} True if the number is a valid numeric string, false otherwise.
   * @example
   * ```typescript
   * console.log(isNumericString('123')); // Output: true
   * console.log(isNumericString('abc')); // Output: false
   * ```
   */
  static isNumericString(n: string) {
    return (
      isNonNullString(n) &&
      !Number.isNaN(parseFloat(n)) &&
      Number.isFinite(Number(n))
    );
  }
  /***
   * Extracts the numeric part of a phone number string.
   * @param {string} str The phone number string.
   * @returns {string} The numeric part of the phone number string.
   * @example
   * ```typescript
   * console.log(extractNumbersFromString('+1 202 555 0144')); // Output: 2025550144
   * console.log(extractNumbersFromString('+1 202 555 0144')); // Output: 2025550144
   * console.log(extractNumbersFromString('2025550144')); // Output: 2025550144
   * ```
   */
  static extractNumbersFromString(str: string) {
    if (!isNonNullString(str)) return '';
    return str.replace(/\D/g, '');
  }
}

const generatePhoneNumberMaskArray = (
  phoneNumber: string,
  dialCode: string
): IInputFormatterMaskArray => {
  dialCode = defaultStr(dialCode);
  if (dialCode) {
    dialCode = '+' + dialCode.ltrim('+');
  }
  if (!InputFormatter.cleanPhoneNumber(phoneNumber).startsWith(dialCode)) {
    dialCode;
  }
  const toSplit = dialCode
    ? phoneNumber.substring(dialCode.length)
    : phoneNumber;
  const r = [...toSplit].map((char) => (/\d/.test(char) ? /\d/ : char));
  if (dialCode) {
    return [...dialCode, ...r];
  }
  return r;
};
function handleMaskAtIndex({
  maskChar,
  valueChar,
  nonRegexReplacedChars,
  obfuscationCharacter,
  valueCharIndex,
  maskCharIndex,
}: {
  maskChar: any;
  valueCharIndex: number;
  maskCharIndex: number;
  valueChar: string;
  obfuscationCharacter?: string;
  nonRegexReplacedChars: IInputFormatterMaskResult['nonRegexReplacedChars'];
}) {
  let maskHasObfuscation = false,
    isValid = true;
  let masked = '',
    obfuscated = '';
  let mask = maskChar,
    isMaskRegex = false;
  // it's a regex maskChar: let's advance on value index and validate the value within the regex
  if (typeof maskChar === 'object') {
    const obfuscatedCharacter = defaultStr(
      Array.isArray(maskChar) ? maskChar[2] : undefined,
      obfuscationCharacter
    ).charAt(0);
    // advance on value index
    const shouldObsfucateChar =
      Array.isArray(maskChar) && maskChar[2] !== false && obfuscatedCharacter;
    if (shouldObsfucateChar) {
      maskHasObfuscation = true;
    }
    const maskCharRegex = Array.isArray(maskChar) ? maskChar[0] : maskChar;
    const maskCharString = String(maskCharRegex);
    mask = maskCharRegex;
    try {
      const isReg = isRegExp(maskCharRegex);
      isMaskRegex = isReg;
      const matchRegex = isReg && RegExp(maskCharRegex).test(valueChar);
      const matchFixed = !isReg && maskCharString === valueChar;
      const isMatch = matchRegex || matchFixed;
      const valToAdd = isReg ? valueChar : maskCharString;
      if (!isMatch) {
        isValid = false;
      }
      if (matchRegex || !isReg) {
        // value match regex: add to masked and unmasked result and advance on mask index too
        masked = valToAdd;
        obfuscated = shouldObsfucateChar ? obfuscatedCharacter : valToAdd;
        if (!isReg && !matchFixed) {
          nonRegexReplacedChars.push({
            index: valueCharIndex,
            maskIndex: maskCharIndex,
            from: valueChar,
            to: maskCharString,
            valueChar,
            maskChar,
          });
        }
      }
    } catch (e) {}
  } else if (isNonNullString(maskChar)) {
    // it's a fixed maskChar: add to maskedResult and advance on mask index
    masked = maskChar;
    obfuscated = maskChar;
    if (maskChar !== valueChar) {
      isValid = false;
      nonRegexReplacedChars.push({
        index: valueCharIndex,
        maskIndex: maskCharIndex,
        from: valueChar,
        to: maskChar,
        valueChar,
        maskChar,
      });
    }
  } else {
    isValid = false;
  }
  return {
    maskHasObfuscation,
    isMaskRegex,
    mask,
    isValid,
    masked,
    obfuscated,
    nonRegexReplacedChars,
  };
}
function genPhoneNumberMask(
  parsedNumber: PhoneNumber | null,
  format?: PhoneNumberFormat
): IInputFormatterMaskWithValidation {
  try {
    // Parse the phone number
    if (parsedNumber) {
      const toFormat = format || PhoneNumberFormat.INTERNATIONAL;
      // Get the formatted version to base the mask on
      const formattedNumber = phoneUtil.format(parsedNumber, toFormat);
      if (isNonNullString(formattedNumber)) {
        // Get region code
        const regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber);
        const dialCode = parsedNumber.getCountryCode() + '';
        return {
          dialCode,
          mask: generatePhoneNumberMaskArray(formattedNumber, dialCode),
          validate: (value: string) =>
            InputFormatter.isValidPhoneNumber(
              value,
              regionCode as ICountryCode
            ),
          countryCode: regionCode as ICountryCode,
        };
      }
    }
  } catch (error) {}
  return {
    mask: [],
    validate: () => false,
  };
}
