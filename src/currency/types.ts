/**
 * @interface ICurrency
 * @group Currency
 * Represents a currency with its associated properties for formatting and display.
 *
 * This type provides essential details about a currency, including its symbol,
 * name, formatting options, and how it should be displayed. It is useful for
 * applications that require currency management, such as financial applications,
 * e-commerce platforms, and accounting software.
 *
 * @example
 * // Example of a currency object for US Dollar
 * const usd: ICurrency = {
 *   symbol: "$",
 *   name: "United States Dollar",
 *   symbolNative: "$",
 *   decimalDigits: 2,
 *   rounding: 2,
 *   code: "USD",
 *   namePlural: "US dollars",
 *   format: "%v %s", // Displays value followed by the symbol
 *   decimalSeparator: ".",
 *   thousandSeparator: ","
 * };
 */
export type ICurrency = {
  /**
   * The symbol of the currency (e.g., "$", "FCFA").
   *
   * Represents the visual symbol used to denote the currency.
   *
   * @example
   * `$` or `FCFA`
   */
  symbol?: string;

  /**
   * The full name of the currency (e.g., "Euro", "United States Dollar").
   *
   * Provides the complete name for the currency as it is recognized globally.
   *
   * @example
   * `Euro`
   */
  name?: string;

  /**
   * The native symbol of the currency (e.g., "€" for Euro).
   *
   * This symbol may differ from the standard currency symbol and is used in
   * the currency's country of origin.
   *
   * @example
   * `€`
   */
  symbolNative?: string;

  /**
   * The number of decimal places for the currency (e.g., 2 for most currencies, 0 for some).
   *
   * Indicates how many decimal places are used when displaying the currency amount.
   *
   * @example
   * `2`
   */
  decimalDigits?: number;

  /**
   * The rounding value for the currency (e.g., 2 for rounding to 2 decimal places).
   *
   * Specifies how the currency amounts should be rounded.
   *
   * @example
   * `2`
   */
  rounding?: number;

  /**
   * The ISO 4217 code for the currency (e.g., "USD" for United States Dollar).
   *
   * This code is used internationally to represent currencies in a standardized format.
   *
   * @example
   * `USD`
   */
  code?: string;

  /**
   * The plural name of the currency (e.g., "US dollars").
   *
   * Used for indicating the currency when referring to multiple units.
   *
   * @example
   * `US dollars`
   */
  namePlural?: string;

  /**
   * The display format for the currency (e.g., `%v %s` for "123.45 USD").
   *
   * This optional property defines how the currency value is formatted when displayed.
   *
   * @example
   * `%v %s` // Value followed by symbol
   */
  format?: string;

  /**
   * The decimal separator for the currency (e.g., "." for most currencies).
   *
   * Specifies the character used to separate the integer part from the fractional part
   * of a currency amount.
   *
   * @example
   * `.`
   */
  decimalSeparator?: string;

  /**
   * The thousands separator for the currency (e.g., " " for some European currencies).
   *
   * Indicates the character used to group thousands in large numbers for improved readability.
   *
   * @example
   * ` `
   */
  thousandSeparator?: string;
};

/**
 * @group Currency
 * @interface ICurrencyFormatter
 * Dynamically formats a number into a string based on currency properties (like symbol and decimal places)
 * retrieved from a predefined currency object.
 *
 * This function does **not** require passing the currency details manually; instead, it retrieves them
 * automatically based on the dynamically generated formatter (e.g., `formatUSD`).
 *
 * @param decimalDigits - (Optional) The number of decimal digits to include. If not provided, the function will default to the currency's predefined decimal digits.
 * @param thousandSeparator - (Optional) The character used as a thousand separator. If not provided, defaults to ','.
 * @param decimalSeparator - (Optional) The character used as a decimal separator. If not provided, defaults to '.'.
 * @param format - (Optional) A format string where `%s` is replaced with the currency symbol and `%v` with the formatted value. If not provided, defaults to the currency's format.
 * 
 * @returns The formatted string representation of the number based on the currency settings.
 *
 * @example
 * // Formatting in US dollars, pulling currency data from the internal USD object:
 * const formattedUSD = (123456.789).formatUSD();
 * // Result: "$123,456.79"
 * 
 * @example
 * // Formatting in Canadian dollars with a custom separator and decimal places:
 * const formattedCAD = (123456.789).formatCAD(3, '.', ',');
 * // Result: "CA$123.456,789"
 * 
 * @example
 * // Custom format using Euro currency (retrieved from EUR object):
 * const formattedEUR = (123456.789).formatEUR(2, ' ', ',', '%v %s');
 * // Result: "123 456,79 €"
 * @description 
 * How the Dynamic Formatter Works
 * In this story, imagine you're setting up a formatter for currencies, but you don't need to pass the currency details every time. The function, let's say formatUSD, magically knows how US dollars should be formatted because it retrieves the currency details (like symbol, decimal digits, and format) from an internal object that has already defined them.
 * You, the developer, simply call the formatter like this:
 * ```ts
 *  const formattedUSD = (123456.789).formatUSD();
    console.log(formattedUSD); // "$123,456.79"
    // Assuming `formatUSD` and `formatEUR` are dynamically created functions based on a currency object

    // Basic usage with USD defaults
    const result1 = formatUSD(123456.789); 
    console.log(result1); // Output: "$123,456.79"

    // Custom decimal digits and separators for USD
    const result2 = formatUSD(123456.789, 3, '.', ',');
    console.log(result2); // Output: "$123.456,789"

    // Using a custom format string for EUR
    const result3 = formatEUR(123456.789, 2, ',', '.', '%v %s');
    console.log(result3); // Output: "123,456.79 €"
 * ```
 */
export type ICurrencyFormatter = (
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
) => string;

/**
 * @group Currency
 * @interface
 * A string template type representing the dynamic formatter function names.
 *
 * This type constructs the keys for the formatter functions by combining the `format` prefix
 * with the currency codes from the `currencies` object (e.g., `formatUSD`, `formatCAD`).
 *
 * The currency codes are derived dynamically from the keys of the `currencies` object, ensuring
 * that the formatters correspond to the available currencies.
 *
 * @example
 * // If `currencies` contains { USD, CAD, EUR }, the keys will be:
 * // 'formatUSD', 'formatCAD', 'formatEUR'
 */
export type ICurrencyFormatterKey = `format${ICurrencyCode}`;

/**
 * @group Currency
 * Represents a string template type for dynamically generating keys for abbreviated currency formatters.
 *
 * The `ICurrencyAbreviate2FormatKey` type constructs keys by combining the `abreviate2Format` prefix
 * with the keys of the `ICurrencies` interface. This allows for the creation of dynamic formatter keys
 * specific to each currency.
 *
 * @template ICurrencyCode - The keys of the `ICurrencies` interface, representing ISO currency codes.
 *
 * @example
 * ```typescript
 * // Assuming the `ICurrencies` interface contains the following keys:
 * // { USD, CAD, EUR }
 *
 * type AbbreviatedFormatKeys = ICurrencyAbreviate2FormatKey;
 *
 * // The resulting type will include:
 * // 'abreviate2FormatUSD', 'abreviate2FormatCAD', 'abreviate2FormatEUR'
 *
 * const formatKey: ICurrencyAbreviate2FormatKey = "abreviate2FormatUSD";
 * console.log(formatKey); // Output: "abreviate2FormatUSD"
 * ```
 *
 * @remarks
 * - This type is useful for defining dynamic keys for currency-specific formatting functions.
 * - It ensures that the keys are consistent with the currencies defined in the `ICurrencies` interface.
 *
 * @see {@link ICurrencies} for the structure of the currencies interface.
 * @see {@link ICurrencyFormatterKey} for a similar type used for general currency formatters.
 */
export type ICurrencyAbreviate2FormatKey = `abreviate2Format${ICurrencyCode}`;

/**
 * @group Currency
 * Represents a collection of dynamically generated currency formatter functions.
 *
 * Each key is a string formed by combining the `format` prefix with a currency code
 * (e.g., `formatUSD`, `formatCAD`), and the value is a function that formats numbers
 * according to the respective currency's settings (e.g., symbol, decimal digits).
 *
 * The formatters automatically retrieve currency properties (like symbols, decimal places, etc.)
 * from the `currencies` object.
 *
 * @example
 * // Assuming the `currencies` object contains USD and CAD:
 * const formatters: ICurrencyFormatters = {
 *   formatUSD: (value) => `$${value.toFixed(2)}`,
 *   formatCAD: (value) => `CA$${value.toFixed(2)}`,
 *
 * };
 *
 * // Usage of the dynamically generated formatters:
 * const formattedUSD = formatters.formatUSD(123456.789);
 * console.log(formattedUSD); // Output: "$123,456.79"
 *
 * const formattedCAD = formatters.formatCAD(123456.789);
 * console.log(formattedCAD); // Output: "CA$123,456.79"
 */
export type ICurrencyFormatters = Record<
  ICurrencyFormatterKey | ICurrencyAbreviate2FormatKey,
  ICurrencyFormatter
>;

/**
 * @interface ICurrencies
 * Represents a collection of currencies, with each currency identified by its ISO code.
 * Each currency is associated with the `ICurrency` interface, which defines its attributes such as symbol, name, and formatting options.
 * This interface allows for easy management of various currencies by providing a
 * centralized structure. Each currency is identified by its ISO 4217 code, and
 * contains detailed information such as symbol, name, and formatting options.
 * This is particularly useful in applications dealing with multiple currencies,
 * such as e-commerce platforms, financial applications, and accounting software.
 *
 * @example
 * // Example of an ICurrencies object containing multiple currencies
 * const currencies: ICurrencies = {
 *     USD: {
 *         symbol: "$",
 *         name: "United States Dollar",
 *         symbolNative: "$",
 *         decimalDigits: 2,
 *         rounding: 2,
 *         code: "USD",
 *         namePlural: "US dollars",
 *         format: "%v %s",
 *         decimalSeparator: ".",
 *         thousandSeparator: ","
 *     },
 *     CAD: {
 *         symbol: "CA$",
 *         name: "Canadian Dollar",
 *         symbolNative: "$",
 *         decimalDigits: 2,
 *         rounding: 2,
 *         code: "CAD",
 *         namePlural: "Canadian dollars",
 *         format: "%s %v",
 *         decimalSeparator: ".",
 *         thousandSeparator: ","
 *     },
 *     EUR: {
 *         symbol: "€",
 *         name: "Euro",
 *         symbolNative: "€",
 *         decimalDigits: 2,
 *         rounding: 0,
 *         code: "EUR",
 *         namePlural: "euros",
 *         format: "%s %v",
 *         decimalSeparator: ",",
 *         thousandSeparator: "."
 *     },
 *     // ... additional currencies
 * };
 */
export interface ICurrencies {
  /**
   * The United States Dollar (USD).
   *
   * @type {ICurrency}
   */
  USD: ICurrency;

  /**
   * The Canadian Dollar (CAD).
   *
   * @type {ICurrency}
   */
  CAD: ICurrency;

  /**
   * The Euro (EUR).
   *
   * @type {ICurrency}
   */
  EUR: ICurrency;

  /**
   * The United Arab Emirates Dirham (AED).
   *
   * @type {ICurrency}
   */
  AED: ICurrency;

  /**
   * The Afghan Afghani (AFN).
   *
   * @type {ICurrency}
   */
  AFN: ICurrency;

  /**
   * The Albanian Lek (ALL).
   *
   * @type {ICurrency}
   */
  ALL: ICurrency;

  /**
   * The Armenian Dram (AMD).
   *
   * @type {ICurrency}
   */
  AMD: ICurrency;

  /**
   * The Argentine Peso (ARS).
   *
   * @type {ICurrency}
   */
  ARS: ICurrency;

  /**
   * The Australian Dollar (AUD).
   *
   * @type {ICurrency}
   */
  AUD: ICurrency;

  /**
   * The Azerbaijani Manat (AZN).
   *
   * @type {ICurrency}
   */
  AZN: ICurrency;

  /**
   * The Bosnia and Herzegovina Convertible Mark (BAM).
   *
   * @type {ICurrency}
   */
  BAM: ICurrency;

  /**
   * The Bangladeshi Taka (BDT).
   *
   * @type {ICurrency}
   */
  BDT: ICurrency;

  /**
   * The Bulgarian Lev (BGN).
   *
   * @type {ICurrency}
   */
  BGN: ICurrency;

  /**
   * The Bahraini Dinar (BHD).
   *
   * @type {ICurrency}
   */
  BHD: ICurrency;

  /**
   * The Burundian Franc (BIF).
   *
   * @type {ICurrency}
   */
  BIF: ICurrency;

  /**
   * The Brunei Dollar (BND).
   *
   * @type {ICurrency}
   */
  BND: ICurrency;

  /**
   * The Bolivian Boliviano (BOB).
   *
   * @type {ICurrency}
   */
  BOB: ICurrency;

  /**
   * The Brazilian Real (BRL).
   *
   * @type {ICurrency}
   */
  BRL: ICurrency;

  /**
   * The Botswana Pula (BWP).
   *
   * @type {ICurrency}
   */
  BWP: ICurrency;

  /**
   * The Belarusian Ruble (BYR).
   *
   * @type {ICurrency}
   */
  BYR: ICurrency;

  /**
   * The Belize Dollar (BZD).
   *
   * @type {ICurrency}
   */
  BZD: ICurrency;

  /**
   * The Congolese Franc (CDF).
   *
   * @type {ICurrency}
   */
  CDF: ICurrency;

  /**
   * The Swiss Franc (CHF).
   *
   * @type {ICurrency}
   */
  CHF: ICurrency;

  /**
   * The Chilean Peso (CLP).
   *
   * @type {ICurrency}
   */
  CLP: ICurrency;

  /**
   * The Chinese Yuan Renminbi (CNY).
   *
   * @type {ICurrency}
   */
  CNY: ICurrency;

  /**
   * The Colombian Peso (COP).
   *
   * @type {ICurrency}
   */
  COP: ICurrency;

  /**
   * The Costa Rican Colón (CRC).
   *
   * @type {ICurrency}
   */
  CRC: ICurrency;

  /**
   * The Cape Verdean Escudo (CVE).
   *
   * @type {ICurrency}
   */
  CVE: ICurrency;

  /**
   * The Czech Koruna (CZK).
   *
   * @type {ICurrency}
   */
  CZK: ICurrency;

  /**
   * The Djiboutian Franc (DJF).
   *
   * @type {ICurrency}
   */
  DJF: ICurrency;

  /**
   * The Danish Krone (DKK).
   *
   * @type {ICurrency}
   */
  DKK: ICurrency;

  /**
   * The Dominican Peso (DOP).
   *
   * @type {ICurrency}
   */
  DOP: ICurrency;

  /**
   * The Algerian Dinar (DZD).
   *
   * @type {ICurrency}
   */
  DZD: ICurrency;

  /**
   * The Estonian Kroon (EEK).
   *
   * @type {ICurrency}
   */
  EEK: ICurrency;

  /**
   * The Egyptian Pound (EGP).
   *
   * @type {ICurrency}
   */
  EGP: ICurrency;

  /**
   * The Eritrean Nakfa (ERN).
   *
   * @type {ICurrency}
   */
  ERN: ICurrency;

  /**
   * The Ethiopian Birr (ETB).
   *
   * @type {ICurrency}
   */
  ETB: ICurrency;

  /**
   * The British Pound Sterling (GBP).
   *
   * @type {ICurrency}
   */
  GBP: ICurrency;

  /**
   * The Georgian Lari (GEL).
   *
   * @type {ICurrency}
   */
  GEL: ICurrency;

  /**
   * The Ghanaian Cedi (GHS).
   *
   * @type {ICurrency}
   */
  GHS: ICurrency;

  /**
   * The Guinean Franc (GNF).
   *
   * @type {ICurrency}
   */
  GNF: ICurrency;

  /**
   * The Guatemalan Quetzal (GTQ).
   *
   * @type {ICurrency}
   */
  GTQ: ICurrency;

  /**
   * The Hong Kong Dollar (HKD).
   *
   * @type {ICurrency}
   */
  HKD: ICurrency;

  /**
   * The Honduran Lempira (HNL).
   *
   * @type {ICurrency}
   */
  HNL: ICurrency;

  /**
   * The Croatian Kuna (HRK).
   *
   * @type {ICurrency}
   */
  HRK: ICurrency;

  /**
   * The Hungarian Forint (HUF).
   *
   * @type {ICurrency}
   */
  HUF: ICurrency;

  /**
   * The Indonesian Rupiah (IDR).
   *
   * @type {ICurrency}
   */
  IDR: ICurrency;

  /**
   * The Israeli New Shekel (ILS).
   *
   * @type {ICurrency}
   */
  ILS: ICurrency;

  /**
   * The Indian Rupee (INR).
   *
   * @type {ICurrency}
   */
  INR: ICurrency;

  /**
   * The Iraqi Dinar (IQD).
   *
   * @type {ICurrency}
   */
  IQD: ICurrency;

  /**
   * The Iranian Rial (IRR).
   *
   * @type {ICurrency}
   */
  IRR: ICurrency;

  /**
   * The Icelandic Króna (ISK).
   *
   * @type {ICurrency}
   */
  ISK: ICurrency;

  /**
   * The Jamaican Dollar (JMD).
   *
   * @type {ICurrency}
   */
  JMD: ICurrency;

  /**
   * The Jordanian Dinar (JOD).
   *
   * @type {ICurrency}
   */
  JOD: ICurrency;

  /**
   * The Japanese Yen (JPY).
   *
   * @type {ICurrency}
   */
  JPY: ICurrency;

  /**
   * The Kenyan Shilling (KES).
   *
   * @type {ICurrency}
   */
  KES: ICurrency;

  /**
   * The Cambodian Riel (KHR).
   *
   * @type {ICurrency}
   */
  KHR: ICurrency;

  /**
   * The Comorian Franc (KMF).
   *
   * @type {ICurrency}
   */
  KMF: ICurrency;

  /**
   * The South Korean Won (KRW).
   *
   * @type {ICurrency}
   */
  KRW: ICurrency;

  /**
   * The Kuwaiti Dinar (KWD).
   *
   * @type {ICurrency}
   */
  KWD: ICurrency;

  /**
   * The Kazakhstani Tenge (KZT).
   *
   * @type {ICurrency}
   */
  KZT: ICurrency;

  /**
   * The Lebanese Pound (LBP).
   *
   * @type {ICurrency}
   */
  LBP: ICurrency;

  /**
   * The Sri Lankan Rupee (LKR).
   *
   * @type {ICurrency}
   */
  LKR: ICurrency;

  /**
   * The Lithuanian Litas (LTL).
   *
   * @type {ICurrency}
   */
  LTL: ICurrency;

  /**
   * The Latvian Lats (LVL).
   *
   * @type {ICurrency}
   */
  LVL: ICurrency;

  /**
   * The Libyan Dinar (LYD).
   *
   * @type {ICurrency}
   */
  LYD: ICurrency;

  /**
   * The Moroccan Dirham (MAD).
   *
   * @type {ICurrency}
   */
  MAD: ICurrency;

  /**
   * The Moldovan Leu (MDL).
   *
   * @type {ICurrency}
   */
  MDL: ICurrency;

  /**
   * The Malagasy Ariary (MGA).
   *
   * @type {ICurrency}
   */
  MGA: ICurrency;

  /**
   * The Macedonian Denar (MKD).
   *
   * @type {ICurrency}
   */
  MKD: ICurrency;

  /**
   * The Myanmar Kyat (MMK).
   *
   * @type {ICurrency}
   */
  MMK: ICurrency;

  /**
   * The Macanese Pataca (MOP).
   *
   * @type {ICurrency}
   */
  MOP: ICurrency;

  /**
   * The Mauritian Rupee (MUR).
   *
   * @type {ICurrency}
   */
  MUR: ICurrency;

  /**
   * The Mexican Peso (MXN).
   *
   * @type {ICurrency}
   */
  MXN: ICurrency;

  /**
   * The Malaysian Ringgit (MYR).
   *
   * @type {ICurrency}
   */
  MYR: ICurrency;

  /**
   * The Mozambican Metical (MZN).
   *
   * @type {ICurrency}
   */
  MZN: ICurrency;

  /**
   * The Namibian Dollar (NAD).
   *
   * @type {ICurrency}
   */
  NAD: ICurrency;

  /**
   * The Nigerian Naira (NGN).
   *
   * @type {ICurrency}
   */
  NGN: ICurrency;

  /**
   * The Nicaraguan Córdoba (NIO).
   *
   * @type {ICurrency}
   */
  NIO: ICurrency;

  /**
   * The Norwegian Krone (NOK).
   *
   * @type {ICurrency}
   */
  NOK: ICurrency;

  /**
   * The Nepalese Rupee (NPR).
   *
   * @type {ICurrency}
   */
  NPR: ICurrency;

  /**
   * The New Zealand Dollar (NZD).
   *
   * @type {ICurrency}
   */
  NZD: ICurrency;

  /**
   * The Omani Rial (OMR).
   *
   * @type {ICurrency}
   */
  OMR: ICurrency;

  /**
   * The Panamanian Balboa (PAB).
   *
   * @type {ICurrency}
   */
  PAB: ICurrency;

  /**
   * The Peruvian Sol (PEN).
   *
   * @type {ICurrency}
   */
  PEN: ICurrency;

  /**
   * The Philippine Peso (PHP).
   *
   * @type {ICurrency}
   */
  PHP: ICurrency;

  /**
   * The Pakistani Rupee (PKR).
   *
   * @type {ICurrency}
   */
  PKR: ICurrency;

  /**
   * The Polish Zloty (PLN).
   *
   * @type {ICurrency}
   */
  PLN: ICurrency;

  /**
   * The Paraguayan Guarani (PYG).
   *
   * @type {ICurrency}
   */
  PYG: ICurrency;

  /**
   * The Qatari Rial (QAR).
   *
   * @type {ICurrency}
   */
  QAR: ICurrency;

  /**
   * The Romanian Leu (RON).
   *
   * @type {ICurrency}
   */
  RON: ICurrency;

  /**
   * The Serbian Dinar (RSD).
   *
   * @type {ICurrency}
   */
  RSD: ICurrency;

  /**
   * The Russian Ruble (RUB).
   *
   * @type {ICurrency}
   */
  RUB: ICurrency;

  /**
   * The Rwandan Franc (RWF).
   *
   * @type {ICurrency}
   */
  RWF: ICurrency;

  /**
   * The Saudi Riyal (SAR).
   *
   * @type {ICurrency}
   */
  SAR: ICurrency;

  /**
   * The Sudanese Pound (SDG).
   *
   * @type {ICurrency}
   */
  SDG: ICurrency;

  /**
   * The Swedish Krona (SEK).
   *
   * @type {ICurrency}
   */
  SEK: ICurrency;

  /**
   * The Singapore Dollar (SGD).
   *
   * @type {ICurrency}
   */
  SGD: ICurrency;

  /**
   * The Somali Shilling (SOS).
   *
   * @type {ICurrency}
   */
  SOS: ICurrency;

  /**
   * The Syrian Pound (SYP).
   *
   * @type {ICurrency}
   */
  SYP: ICurrency;

  /**
   * The Thai Baht (THB).
   *
   * @type {ICurrency}
   */
  THB: ICurrency;

  /**
   * The Tunisian Dinar (TND).
   *
   * @type {ICurrency}
   */
  TND: ICurrency;

  /**
   * The Tongan Paʻanga (TOP).
   *
   * @type {ICurrency}
   */
  TOP: ICurrency;

  /**
   * The Turkish Lira (TRY).
   *
   * @type {ICurrency}
   */
  TRY: ICurrency;

  /**
   * The Trinidad and Tobago Dollar (TTD).
   *
   * @type {ICurrency}
   */
  TTD: ICurrency;

  /**
   * The New Taiwan Dollar (TWD).
   *
   * @type {ICurrency}
   */
  TWD: ICurrency;

  /**
   * The Tanzanian Shilling (TZS).
   *
   * @type {ICurrency}
   */
  TZS: ICurrency;

  /**
   * The Ukrainian Hryvnia (UAH).
   *
   * @type {ICurrency}
   */
  UAH: ICurrency;

  /**
   * The Ugandan Shilling (UGX).
   *
   * @type {ICurrency}
   */
  UGX: ICurrency;

  /**
   * The Uruguayan Peso (UYU).
   *
   * @type {ICurrency}
   */
  UYU: ICurrency;

  /**
   * The Uzbek Som (UZS).
   *
   * @type {ICurrency}
   */
  UZS: ICurrency;

  /**
   * The Venezuelan Bolívar (VEF).
   *
   * @type {ICurrency}
   */
  VEF: ICurrency;

  /**
   * The Vietnamese Dong (VND).
   *
   * @type {ICurrency}
   */
  VND: ICurrency;

  /**
   * The Central African CFA Franc (XAF).
   *
   * @type {ICurrency}
   */
  XAF: ICurrency;

  /**
   * The West African CFA Franc (XOF).
   *
   * @type {ICurrency}
   */
  XOF: ICurrency;

  /**
   * The Yemeni Rial (YER).
   *
   * @type {ICurrency}
   */
  YER: ICurrency;

  /**
   * The South African Rand (ZAR).
   *
   * @type {ICurrency}
   */
  ZAR: ICurrency;

  /**
   * The Zambian Kwacha (ZMK).
   *
   * @type {ICurrency}
   */
  ZMK: ICurrency;
}

/**
 * @group Currency
 * Represents the ISO 4217 currency codes available in the currencies collection.
 *
 * This type is derived from the keys of the `ICurrencies` interface, ensuring that
 * only valid currency codes are accepted. It provides type safety when working
 * with currency codes throughout the application.
 *
 * @example
 * ```typescript
 * const currencyCode: ICurrencyCode = "USD"; // Valid
 * const invalidCode: ICurrencyCode = "INVALID"; // TypeScript error
 * ```
 */
export type ICurrencyCode = keyof ICurrencies;

/**
 * @group Currency
 * Represents the currency symbols for all available currencies.
 *
 * This type extracts the symbol property from each currency in the `ICurrencies`
 * interface, providing a union type of all possible currency symbols. It's useful
 * for type-safe operations involving currency symbols.
 *
 * @example
 * ```typescript
 * const symbol: ICurrencySymbol = "$"; // Valid (USD symbol)
 * const euroSymbol: ICurrencySymbol = "€"; // Valid (EUR symbol)
 * ```
 */
export type ICurrencySymbol = ICurrencies[ICurrencyCode]["symbol"];
