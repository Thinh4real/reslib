import { Currency } from '@/currency/types';
import { Dictionary } from '@/types';
import { countries } from './countries';
/****
 * @typedef CountryCode
 * The type of the country code.
 * example: US, FR, IN
 * @see {@link CountryCode}, for more information about the CountryCode type.
 */
export type CountryCode = keyof typeof countries;

/**
 * Interface representing a country with its associated properties.
 *
 * @extends Record<string, any>
 *
 * @example
 * ```typescript
 * const country: Country = {
 *   code: 'US',
 *   dialCode: '+1',
 *   phoneNumberExample: '(123) 456-7890',
 *   flag: '🇺🇸'
 * };
 * ```
 */
export interface Country extends Dictionary {
  /**
   * The unique code of the country.
   *
   * @type {CountryCode}
   * @example 'US'
   */
  code: CountryCode;

  /***
   * The name of the country.
   */
  name: string;

  /****
   * The currency of the country.
   */
  currency?: Currency;

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
