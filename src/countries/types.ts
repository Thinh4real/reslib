import { ICurrency } from "@/currency/types";
import countries from "./countries";
/****
 * @typedef ICountryCode
 * The type of the country code.
 * example: US, FR, IN
 * @see {@link CountryCode}, for more information about the CountryCode type.
 */
export type ICountryCode = keyof typeof countries;

/**
 * Interface representing a country with its associated properties.
 *
 * @extends Record<string, any>
 *
 * @example
 * ```typescript
 * const country: ICountry = {
 *   code: 'US',
 *   dialCode: '+1',
 *   phoneNumberExample: '(123) 456-7890',
 *   flag: '🇺🇸'
 * };
 * ```
 */
export interface ICountry extends Record<string, any> {
  /**
   * The unique code of the country.
   *
   * @type {ICountryCode}
   * @example 'US'
   */
  code: ICountryCode;

  /***
   * The name of the country.
   */
  name: string;

  /****
   * The currency of the country.
   */
  currency?: ICurrency;

  /**
   * The dial code of the country.
   *
   * @type {string}
   * @example '+1'
   */
  dialCode: string;

  /**
   * An example of a phone number in the country.
   *
   * @type {string}
   * @example '(123) 456-7890'
   */
  phoneNumberExample: string;

  /**
   * The flag of the country (optional).
   * This string can be a Unicode emoji, or a data URI or a URL to an image file.
   *
   * @type {string}
   * @optional
   * @example '🇺🇸'
   */
  flag?: string;
}
