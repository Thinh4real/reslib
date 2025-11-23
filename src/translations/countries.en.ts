import { ICountry, ICountryCode } from "@countries/index";

/***
 * The list of available countries in the application.
 * This object contains the country codes and their corresponding country objects.
 */
export const countries = {
  /*** example country ***/
  US: {
    code: "US",
    dialCode: "+1",
    phoneNumberExample: "(123) 456-7890",
    //flag: "🇺🇸",
    name: "United States",
  },
  CA: {
    code: "CA",
    dialCode: "+1",
    phoneNumberExample: "(123) 456-7890",
    //flag: "🇨🇦",
    name: "Canada",
  },
} as Record<ICountryCode, ICountry>;
