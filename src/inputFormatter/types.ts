import { ICurrencyFormatterKey } from "@/currency/types";
import { IDateFormat } from "../types/date";
import { ICountryCode } from "@countries/types";

/**
 * Options for formatting a value into a string representation.
 *
 * This interface is used in the `formatValue` function to specify the options
 * for formatting a given value, allowing for flexible and customizable
 * output based on the provided settings.
 *
 * ### Properties:
 * - `value?`: The value to be formatted. This can be of any type and is the
 *   main input for the formatting process.
 * - `type?`: The expected type of the input value, which can help in determining
 *   the appropriate formatting logic to apply.
 * - `format?`: A predefined or custom format to be used for formatting the parsed
 *   value. This allows for dynamic formatting based on the specified type.
 *
 * ### Example Usage:
 * ```typescript
 * const options: IInputFormatterOptions = {
 *   value: 1234.56,
 *   type: "number",
 *   format: "money" // Example format for monetary values
 * };
 *
 * const formattedValue = formatValue(options);
 * console.log(formattedValue); // Outputs: "$1,234.56" or similar, depending on the format
 * ```
 *
 *  * ```typescript
 * const options: IInputFormatterOptions = {
 *   value: 1234.56,
 *   type: "number",
 *   format: "formatUSD" // Example format for monetary values in $USD
 * };
 *
 * const formattedValue = formatValue(options);
 * console.log(formattedValue); // Outputs: "$1,234.56" or similar, depending on the format
 * ```
 */
export interface IInputFormatterOptions<InputType = any, ValueType = any> {
  value?: ValueType; // The value to be formatted
  type?: InputType; // The expected type of the value
  /**
   * This function is used by default to format the parsed or custom value.
   * In an input field, that function or a string used to format the value displayed in the input field.
   * ```ts
   *   format : "moneay", //will format the value to money format
   *   format : ({value:any,type:ITextInputType,format?:"custom"}) => any; //will format the value to any format
   * ```
   */
  format?: IInputFormatterValueFormat; // The format to be applied

  /***
   * Format for date types
   */
  dateFormat?: IDateFormat;
  /***
   * The phone country code, in case of formatting a phone number, type="tel"
   */
  phoneCountryCode?: ICountryCode;

  /***
   * Whether to abreviate the number
   */
  abreviateNumber?: boolean;
}

/**
 * Options for formatting a masked input value.
 *
 * This interface provides a set of properties that can be used to customize the behavior of a masked input field.
 * It includes options for specifying the input value, type, mask, and other formatting settings.
 *
 * @example
 * ```typescript
 * const maskOptions: IInputFormatterMaskOptions = {
 *   value: '12345',
 *   type: 'number',
 *   mask: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
 *   obfuscationCharacter: '*', // The character to be used for obfuscating the input value.
 *   focused: true,
 *   placeholder: '_',
 * };
 * ```
 */
export interface IInputFormatterMaskOptions {
  /**
   * The input value to be formatted.
   *
   * This property can be a string representing the value to be formatted.
   *
   * @example
   * ```typescript
   * const maskOptions: IInputFormatterMaskOptions = {
   *   value: '12345',
   * };
   * ```
   */
  value?: string;

  /**
   * The type of the input value.
   *
   * This property can be a string representing the type of the input value, such as 'number', 'date', etc.
   * ```
   */
  type?: string;

  /**
   * The mask to be applied to the input value.
   *
   * This property can be an instance of `IInputFormatterMask` or an array of strings or regular expressions.
   *
   * @example
   * ```typescript
   * const maskOptions: IInputFormatterMaskOptions = {
   *   mask: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
   * };
   * ```
   */
  mask?: IInputFormatterMask;

  /**
   * The character to be used for obfuscating the input value.
   * This property defaults to '*' if not specified. It must have a length of 1 not more than 1.
   *
   * This property defaults to '*' if not specified.
   *
   * @example
   * ```typescript
   * const maskOptions: IInputFormatterMaskOptions = {
   *   obfuscationCharacter: '*',
   * };
   * ```
   */
  obfuscationCharacter?: string;

  /**
   * The character to be used as the fill character for the default placeholder.
     The length of the character must be 1 not more than 1.
     Default value is '_'
   *
   * @example
   * ```typescript
   * const maskOptions: IInputFormatterMaskOptions = {
   *   placeholderCharacter: '_',
   * };
   * ```
   */
  placeholderCharacter?: string;

  /***
   * A function to validate the input value.
   *
   * This function is called with the input value as an argument and should return `true` if the value is valid, and `false` otherwise.
   * It's called only if the input value matches the specified mask.
   * When this function is provided, the `isValid` property of the returned `IInputFormatterMaskResult` object will be the result of that function.
   */
  validate?: (value: string) => boolean;

  /**
   * Whether to add the next mask characters to the end of the input value.
   *
   * This property defaults to `false` if not specified.
   */
  maskAutoComplete?: boolean;
}

/**
 * @interface IInputFormatterNumberMaskOptions
 * Options for formatting a number mask.
 *
 * This interface provides a set of properties that can be used to customize the behavior of a number mask.
 * It includes options for specifying the thousands delimiter, decimal precision, decimal separator, and prefix.
 *
 * @example
 * ```typescript
 * const numberMaskOptions: IInputFormatterNumberMaskOptions = {
 *   delimiter: '.',
 *   precision: 2,
 *   separator: ',',
 *   prefix: ['$', ' '],
 * };
 * ```
 */
export interface IInputFormatterNumberMaskOptions {
  /**
   * The character to be used as the thousands delimiter.
   *
   * This property defaults to `"."` if not specified.
   *
   * @example
   * ```typescript
   * const numberMaskOptions: IInputFormatterNumberMaskOptions = {
   *   delimiter: '.',
   * };
   * ```
   */
  delimiter?: string;

  /**
   * The decimal precision.
   *
   * This property defaults to `2` if not specified.
   *
   * @example
   * ```typescript
   * const numberMaskOptions: IInputFormatterNumberMaskOptions = {
   *   precision: 2,
   * };
   * ```
   */
  precision?: number;

  /**
   * The decimal separator character.
   *
   * This property defaults to `","` if not specified.
   *
   * @example
   * ```typescript
   * const numberMaskOptions: IInputFormatterNumberMaskOptions = {
   *   separator: ',',
   * };
   * ```
   */
  separator?: string;

  /**
   * The prefix to be added to the mask result.
   *
   * This property can be an array of strings or regular expressions that will be added to the beginning of the mask result.
   *
   * @example
   * ```typescript
   * const numberMaskOptions: IInputFormatterNumberMaskOptions = {
   *   prefix: ['$', ' '],
   * };
   * ```
   */
  prefix?: IInputFormatterMaskArray;
}

/***
 * @typedef IInputFormatterMaskWithValidation
 * A type representing a mask and a validation function.
 *
 * This type is used to define a mask and a validation function for an input field.
 *
 * @example
 * ```typescript
 * const maskAndValidate: IInputFormatterMaskWithValidation = {
 *   mask: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
 *   validate: (value: string) => value.length === 10,
 * };
 * ```
 */
export interface IInputFormatterMaskWithValidation extends Record<string, any> {
  mask: IInputFormatterMaskArray;
  validate: (value: string) => boolean;
  countryCode?: ICountryCode;
}

/**
 * @typedef IInputFormatterMaskArray
 * A type representing an array of mask elements.
 *
 * This type can be used to define a mask for an input field, where each element in the array represents a character or a pattern to be matched.
 * When the placeholderCharacter is provided, the obfuscationCharacter is considered only if it is provided or the obfuscationCharacter is provided when calling the formatWithMask method.
 *
 * @example
 * ```typescript
 * const maskArray: IInputFormatterMaskArray = ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
 * ```
 */
export type IInputFormatterMaskArray = Array<string | RegExp | [mask: RegExp | string, placeholderCharacter?: string, obfuscationCharacter?: string | false]>;

/**
 * @typedef IInputFormatterMask
 * A type representing a mask for an input field.
 *
 * This type can be either a static array of mask elements or a function that returns a dynamic array of mask elements based on the provided options.
 *
 * @example
 * ```typescript
 * const staticMask: IInputFormatterMask = ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
 * const dynamicMask: IInputFormatterMask = (options: IInputFormatterOptions) => {
 *   if (options.type === 'number') {
 *     return ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
 *   } else {
 *     return ['a', 'a', 'a', 'a', 'a'];
 *   }
 * };
 * ```
 */
export type IInputFormatterMask = IInputFormatterMaskArray | ((options: IInputFormatterOptions) => IInputFormatterMaskArray);

/**
 * @interface IInputFormatterResult
 * Represents the result of a formatted value obtained via the `formatValue` function.
 *
 * This interface extends the `IInputFormatterOptions` interface and contains
 * properties that provide information about the formatted value, its type,
 * and the parsed representation.
 *
 * ### Properties:
 * - `formattedValue`:
 *   - **Type**: `string`
 *   - The formatted representation of the value, which is returned
 *     after applying the formatting logic.
 *
 * - `isDecimalType`:
 *   - **Type**: `boolean`
 *   - Indicates whether the type associated with the function supports
 *     decimal values. This property helps determine how to handle the
 *     formatted value correctly.
 *
 * - `parsedValue`:
 *   - **Type**: `any`
 *   - The raw value that was parsed before formatting. By default,
 *     this will be a number when the original value is a numeric type.
 *
 * - `decimalValue`:
 *   - **Type**: `number`
 *   - The decimal representation of the formatted value. This is useful
 *     for calculations or further processing of the value as a number.
 *
 * ### Example Usage:
 * ```typescript
 * const result: IInputFormatterResult = {
 *   formattedValue: "$1,234.56",
 *   isDecimalType: true,
 *   parsedValue: 1234.56,
 *   decimalValue: 1234.56,
 * };
 * console.log(result.formattedValue); // Outputs: "$1,234.56"
 * console.log(result.isDecimalType);   // Outputs: true
 * ```
 */
export interface IInputFormatterResult extends IInputFormatterOptions, Partial<IInputFormatterMaskResult> {
  formattedValue: string; // The value to be formatted
  isDecimalType: boolean; //if the type linked to the function supports decimal values
  parsedValue: any; //defaults to a number when it is a number
  decimalValue: number; //the decimal value of the formatted value
  /***
    The date object corresponding to the input value, when the provided type is date, time or datetime
  */
  dateValue?: Date;
  /****
    there dateFormat used to format the value
  */
  dateFormat?: IDateFormat;
  /***
   * The dial code of the phone number in case of formatting a phone number
   */
  dialCode?: string;

  /***
    The international value of the phone number of the input value in case of formatting a phone number
  */
  phoneNumber?: string;
}

/**
 * Represents the result of a masked input value.
 *
 * This interface provides a set of properties that contain the masked, unmasked, and obfuscated values of the input field, as well as the original mask array.
 *
 * @example
 * ```typescript
 * const maskResult: IInputFormatterMaskResult = {
 *   masked: '12345',
 *   unmasked: '12345',
 *   obfuscated: '*****',
 *   maskArray: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
 * };
 * ```
 */
export interface IInputFormatterMaskResult {
  /**
   * The masked value of the input field.
   *
   * This property contains the value of the input field with the mask applied.
   *
   * @example
   * ```typescript
   * const maskResult: IInputFormatterMaskResult = {
   *   masked: '12345',
   * };
   * ```
   */
  masked: string;

  /**
   * The unmasked value of the input field.
   *
   * This property contains the original value of the input field without the mask applied.
   *
   * @example
   * ```typescript
   * const maskResult: IInputFormatterMaskResult = {
   *   unmasked: '12345',
   * };
   * ```
   */
  unmasked: string;

  /**
   * The obfuscated value of the input field.
   *
   * This property contains the value of the input field with all characters replaced with an obfuscation character (e.g. '*').
   *
   * @example
   * ```typescript
   * const maskResult: IInputFormatterMaskResult = {
   *   obfuscated: '*****',
   * };
   * ```
   */
  obfuscated: string;

  /***
    The auto completed mask value.
    
    This property contains the value of the input field with all characters replaced with an obfuscation character (e.g. '*').
    
    @example
    ```typescript
    const maskResult: IInputFormatterMaskResult = {
      maskedAutoCompleted: '*****',
    };
  */
  maskedAutoCompleted?: string;

  /**
   * The original mask array used to mask the input value.
   *
   * This property contains the array of mask elements that was used to mask the input value.
   *
   * @example
   * ```typescript
   * const maskResult: IInputFormatterMaskResult = {
   *   maskArray: ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
   * };
   * ```
   * Obfuscation
   * To mark a character as obfuscated, use the RegExp within an array and the second element of the array is not false, like this:
   * ```typescript
   *  const creditCardMask = [/\d/, /\d/, /\d/, /\d/, " " [/\d/], [/\d/], [/\d/], [/\d/], " ", [/\d/], [/\d/], [/\d/], [/\d/], " ", /\d/, /\d/, /\d/, /\d/];
   * ```
   */
  maskArray: IInputFormatterMaskArray;

  /***
    whether the mask has obfuscation
  */
  maskHasObfuscation: boolean;

  /**
   * Whether to display the obfuscated value in the input field.
   *
   * This property defaults to `false` if not specified.
   *
   * @example
   * ```typescript
   * const maskOptions: IInputFormatterMaskOptions = {
   *   showObfuscatedValue: true,
   * };
   * ```
   */
  //showObfuscatedValue : boolean;

  /***
    The character to be used as the fill character for the default placeholder of the input field.
  */
  placeholder: string;

  /***
   * The masked placeholder
   */
  maskedPlaceholder: string;

  /***
   * Whether the input value matches the specified mask.
   */
  isValid: boolean;

  /***
   * Represent an array of replaced non regex mask char from the input value.
   * index : the index of the replaced char in the value
   * maskIndex : the index of the replaced char in the mask
   * from : the char that was replaced. It represents the original char at index index in the value
   * to : the char that was replaced with. It represents the original char at index maskIndex in the mask
   */
  nonRegexReplacedChars: {
    index: number;
    maskIndex: number;
    from: string;
    to: string;
    valueChar: string;
    maskChar: string;
  }[];
}

/**
 * @interface
 * Represents a function that formats a field value according to specified options.
 *
 * The formatting can be customized based on the options provided when
 * the `format` function of the `IField` interface is called. This type
 * allows for greater flexibility in defining how field values should
 * be displayed or manipulated.
 *
 * ### Parameters:
 * - `options`:
 *   - **Type**: `IInputFormatterOptions`
 *   - An object containing options for formatting the value. The options may
 *     include the value to be formatted, the expected type of the value,
 *     and a custom format specification.
 *
 * ### Returns:
 * - **Type**: `string`
 *   - The formatted value as a string, based on the provided options.
 *
 * ### Example Usage:
 * ```typescript
 * const customFormatter: IInputFormatterValueFunc = (options) => {
 *     const { value, format } = options;
 *     if (format === 'money') {
 *         return `$${parseFloat(value).toFixed(2)}`; // Formats value as money
 *     }
 *     return String(value); // Default to string conversion
 * };
 *
 * const formattedValue = customFormatter({
 *     value: 1234.567,
 *     format: 'money'
 * });
 * console.log(formattedValue); // Outputs: "$1234.57"
 * ```
 */
export type IInputFormatterValueFunc = (options: IInputFormatterOptions) => string;

/**
 * Represents the format types for value formatting.
 *
 * This type can be used to specify how values should be formatted in an application, such as:
 * - As a standard number
 * - As a monetary value
 * - Using a custom format defined by the user
 *
 * ### Format Options:
 * - `"number"`: For standard numerical formatting.
 * - `"money"`: For formatting values as monetary amounts, following currency rules.
 * - `"custom"`: For user-defined formatting rules.
 * - `ICurrencyFormatterKey`: Represents a specific currency format that adheres to the structure defined in the `ICurrencyFormatterKey` interface.
 *
 * ### Example Usage:
 * ```typescript
 * // Define a value with a money format
 * const moneyValue: IInputFormatterValueFormat = "money";
 *
 * // Define a custom format
 * const customValue: IInputFormatterValueFormat = "custom";
 *
 * // Define a value using ICurrencyFormatterKey
 * const currencyValue: IInputFormatterValueFormat = "formatUSD" | "formatCAD" | "formatEUR" | "formatAED" | "formatAFN" | "formatALL" | "formatAMD" | "formatARS" |;
 * ```
 */
export type IInputFormatterValueFormat = "number" | "money" | "custom" | ICurrencyFormatterKey | IInputFormatterValueFunc;
