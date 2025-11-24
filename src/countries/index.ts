import { ICurrency } from '@/currency/types';
import { i18n } from '@/i18n';
import { defaultStr } from '@utils/defaultStr';
import { isNonNullString } from '@utils/isNonNullString';
import { extendObj, isObj } from '@utils/object';
import 'reflect-metadata';
import countries from './countries';
import { ICountry, ICountryCode } from './types';
const countriesByDialCodes = {};
Object.keys(countries).map((countryCode) => {
  const country = countries[countryCode as keyof typeof countries];
  (countriesByDialCodes as any)[country.dialCode] = country.code;
});

export * from './types';

/**
 * Class representing a collection of countries with their associated properties.
 *
 * @example
 * ```typescript
 * CountriesManager.setCountry({
 *   code: 'US',
 *   dialCode: '+1',
 *   phoneNumberExample: '(123) 456-7890',
 *   flag: '🇺🇸'
 * });
 *
 * const usCountry = CountriesManager.getCountry('US');
 * console.log(usCountry); // { code: 'US', dialCode: '+1', phoneNumberExample: '(123) 456-7890', flag: '🇺🇸' }
 * ```
 */
export class CountriesManager {
  /**
   * A private static record of countries, where each key is a country code and each value is an ICountry object.
   *
   * @private
   * @type {Record<ICountryCode, ICountry>}
   */
  private static countries: Record<ICountryCode, ICountry> =
    countries as unknown as Record<ICountryCode, ICountry>;

  /**
   * Checks if a given country object is valid.
   *
   * A country object is considered valid if it is an object and has a non-null string code.
   *
   * @param {ICountry} country The country object to check.
   * @returns {boolean} True if the country object is valid, false otherwise.
   *
   * @example
   * ```typescript
   * const country: ICountry = {
   *   code: 'US',
   *   dialCode: '+1',
   *   phoneNumberExample: '(123) 456-7890',
   *   flag: '🇺🇸'
   * };
   * console.log(CountriesManager.isValid(country)); // true
   * ```
   */
  static isValid(country: ICountry): boolean {
    return isObj(country) && isNonNullString(country.code);
  }

  /**
   * Gets the phone number example for a given country code.
   *
   * @param {ICountryCode} code The country code.
   * @returns {string} The phone number example for the given country code, or an empty string if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountriesManager.getPhoneNumberExample('US')); // '(123) 456-7890'
   * ```
   */
  static getPhoneNumberExample(code: ICountryCode): string {
    return defaultStr(this.getCountry(code)?.phoneNumberExample);
  }

  /**
   * Gets the flag for a given country code.
   *
   * @param {ICountryCode} code The country code.
   * @returns {string} The flag for the given country code, or an empty string if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountriesManager.getFlag('US')); // '🇺🇸'
   * ```
   */
  static getFlag(code: ICountryCode): string {
    return defaultStr(this.getCountry(code)?.flag);
  }

  /**
   * Gets the currency for a given country code.
   *
   * @param {ICountryCode} code The country code.
   * @returns {ICurrency | undefined} The currency for the given country code, or undefined if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountriesManager.getCurrency('US')); // { code: 'USD', symbol: '$' }
   * ```
   */
  static getCurrency(code: ICountryCode): ICurrency | undefined {
    return this.getCountry(code)?.currency;
  }

  /**
   * Sets a country object in the internal record.
   *
   * The country object must be valid (i.e., it must be an object with a non-null string code).
   *
   * @param {ICountry} country The country object to set.
   *
   * @example
   * ```typescript
   * CountriesManager.setCountry({
   *   code: 'US',
   *   dialCode: '+1',
   *   phoneNumberExample: '(123) 456-7890',
   *   flag: '🇺🇸'
   * });
   * ```
   */
  static setCountry(country: ICountry): void {
    if (this.isValid(country)) {
      this.countries[country.code] = country;
    }
  }

  /**
   * Retrieves a country object by its country code.
   *
   * If the provided code is not a non-null string, it returns undefined.
   *
   * @param {ICountryCode} code The country code to look up.
   * @returns {ICountry | undefined} The country object associated with the given code, or undefined if not found.
   *
   * @example
   * ```typescript
   * const country = CountriesManager.getCountry('US');
   * console.log(country); // { code: 'US', dialCode: '+1', phoneNumberExample: '(123) 456-7890', flag: '🇺🇸' }
   * ```
   */
  static getCountry(code: ICountryCode): ICountry | undefined {
    if (!isNonNullString(code)) return undefined;
    return extendObj<ICountry>(
      {} as ICountry,
      i18n.t(`countries.${code}`),
      this.countries[code]
    );
  }

  /**
   * Retrieves all countries stored in the internal record.
   *
   * @returns {Record<ICountryCode, ICountry>} A record of all countries, where each key is a country code and each value is an ICountry object.
   *
   * @example
   * ```typescript
   * const allCountries = CountriesManager.getCountries();
   * console.log(allCountries); // { 'US': { code: 'US', ... }, ... }
   * ```
   */
  static getCountries(): Record<ICountryCode, ICountry> {
    const countries = i18n.t('countries');
    if (isObj(countries)) {
      return extendObj({}, countries, this.countries);
    }
    return this.countries;
  }

  /**
   * Sets multiple countries in the internal record.
   *
   * This method merges the provided countries with the existing ones in the internal record.
   *
   * If the provided countries object is not an object, it returns the current internal record of countries.
   *
   * @param {Partial<Record<ICountryCode, ICountry>>} countries A partial record of countries to set.
   * @returns {Record<ICountryCode, ICountry>} The updated internal record of countries.
   *
   * @example
   * ```typescript
   * Country.setCountries({
   *   'US': {
   *     code: 'US',
   *     dialCode: '+1',
   *     phoneNumberExample: '(123) 456-7890',
   *     flag: '🇺🇸'
   *   },
   *   'CA': {
   *     code: 'CA',
   *     dialCode: '+1',
   *     phoneNumberExample: '(123) 456-7890',
   *     flag: '🇨🇦'
   *   }
   * });
   * ```
   */
  static setCountries(
    countries: Partial<Record<ICountryCode, ICountry>>
  ): Record<ICountryCode, ICountry> {
    if (!isObj(countries)) return this.countries;
    for (const countryCode in countries) {
      const country = countries[countryCode as keyof typeof countries];
      if (this.isValid(country as any)) {
        this.countries[countryCode as keyof typeof countries] = extendObj(
          {},
          this.countries[countryCode as keyof typeof countries],
          country
        );
      }
    }
    return this.countries;
  }
}
