import { InputFormatter } from "@/inputFormatter";
import { ICountryCode } from "@countries/types";
import { defaultStr } from "@utils/defaultStr";
import { isNonNullString } from "@utils/isNonNullString";
import { isValidUrl } from "@utils/uri";
import { isValidEmail } from "@utils/validators/isValidEmail";
import { IValidatorResult, IValidatorValidateOptions } from "../types";
import { Validator } from "../validator";

/**
 * ### IsEmail Decorator
 *
 * Validates that a property value is a properly formatted email address.
 * Uses comprehensive email validation that checks for valid email format
 * according to RFC standards.
 *
 * @example
 * ```typescript
 * class Contact {
 *   @IsRequired
 *   @IsEmail
 *   primaryEmail: string;
 *
 *   @IsEmail  // Optional email
 *   secondaryEmail?: string;
 * }
 *
 * // Valid data
 * const contact = {
 *   primaryEmail: "user@example.com",
 *   secondaryEmail: "backup@company.org"
 * };
 *
 * // Invalid data
 * const invalid = {
 *   primaryEmail: "not-an-email",
 *   secondaryEmail: "user@"
 * };
 * // Will fail validation with errors about invalid email format
 * ```
 *
 * @decorator
 * @since 1.0.0
 * @see {@link IsRequired} - Often used together
 * @public
 */
export const IsEmail = Validator.buildPropertyDecorator(["Email"]);

Validator.registerRule("Email", function Email(options) {
  const { value, i18n } = options;
  const message = i18n.t("validator.email", options);
  if (!isNonNullString(value)) {
    return message;
  }
  return isValidEmail(value) || message;
});

/**
 * ### IsUrl Decorator
 *
 * Validates that a property value is a properly formatted URL. Checks for
 * valid URL structure including protocol, domain, and optional path components.
 *
 * @example
 * ```typescript
 * class Website {
 *   @IsRequired
 *   @IsUrl
 *   homepage: string;
 *
 *   @IsUrl
 *   blogUrl?: string;
 *
 *   @IsUrl
 *   apiEndpoint: string;
 * }
 *
 * // Valid data
 * const website = {
 *   homepage: "https://example.com",
 *   blogUrl: "https://blog.example.com/posts",
 *   apiEndpoint: "https://api.example.com/v1"
 * };
 *
 * // Invalid data
 * const invalid = {
 *   homepage: "not-a-url",
 *   apiEndpoint: "ftp://invalid-protocol"
 * };
 * ```
 *
 * @decorator
 * @since 1.0.0
 * @public
 */
export const IsUrl = Validator.buildPropertyDecorator(["Url"]);

Validator.registerRule("Url", function Url(options) {
  const { value, i18n } = options;
  return !value || typeof value !== "string"
    ? true
    : isValidUrl(value) || i18n.t("validator.url", options);
});

function phoneNumber(
  options: IValidatorValidateOptions<[countryCode?: ICountryCode]>
) {
  const { value, phoneCountryCode, i18n, ruleParams } = options;
  const message = i18n.t("validator.phoneNumber", options);
  if (!isNonNullString(value)) {
    return message;
  }
  return (
    InputFormatter.isValidPhoneNumber(
      value,
      phoneCountryCode ? ruleParams?.[0] : undefined
    ) || message
  );
}
Validator.registerRule("PhoneNumber", phoneNumber);

/**
 * A validator decorator to check if a phone number is valid.
 *
 * @param phoneNumber The phone number to validate.
 * @param ruleParams.countryCode The optional country code to validate the phone number against.
 * @returns A validator decorator that checks if the phone number is valid.
 * @example
 * ```typescript
 * class User {
 *   @IsPhoneNumber()
 *   phoneNumber: string;
 * }
 * ```
 */
export const IsPhoneNumber =
  Validator.buildRuleDecoratorOptional<[countryCode?: ICountryCode]>(
    phoneNumber
  );

function emailOrPhoneNumber(options: IValidatorValidateOptions) {
  const { value, phoneCountryCode, i18n } = options;
  return (
    isValidEmail(value) ||
    InputFormatter.isValidPhoneNumber(value, phoneCountryCode) ||
    i18n.t("validator.emailOrPhoneNumber", options)
  );
}
Validator.registerRule("EmailOrPhoneNumber", emailOrPhoneNumber);

/**
 * A validator decorator to check if value is a valid email or phone number.
 *
 * @param value The email or phone number to validate.
 * @returns A validator decorator that checks if the email or phone number is valid.
 * @example
 * ```typescript
 * class User {
 *   @IsEmailOrPhone
 *   emailOrPhoneNumber : string;
 * }
 * ```
 */
export const IsEmailOrPhone = Validator.buildPropertyDecorator([
  "EmailOrPhoneNumber",
]);

/**
 * ### IsFileName Decorator
 *
 * Validates that a property value is a valid filename. Checks for proper
 * filename format and excludes invalid characters that are not allowed
 * in file systems.
 *
 * @example
 * ```typescript
 * class FileUpload {
 *   @IsRequired
 *   @IsFileName
 *   filename: string;
 *
 *   @IsFileName
 *   thumbnailName?: string;
 * }
 *
 * // Valid data
 * const upload = {
 *   filename: "document.pdf",
 *   thumbnailName: "thumb_001.jpg"
 * };
 *
 * // Invalid data
 * const invalid = {
 *   filename: "file<with>invalid:chars.txt"
 * };
 * ```
 *
 * @decorator
 * @since 1.0.0
 * @public
 */
export const IsFileName = Validator.buildPropertyDecorator(["FileName"]);

Validator.registerRule("FileName", function FileName(options) {
  const { value, i18n } = options;
  const message = i18n.t("validator.fileName", options);
  if (!isNonNullString(value)) return message;
  const rg1 = /^[^\\/:*?"<>|]+$/; // forbidden characters \ / : * ? " < > |
  const rg2 = /^\./; // cannot start with dot (.)
  const rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
  return (
    (rg1.test(String(value)) && !rg2.test(value) && !rg3.test(value)) || message
  );
});

function _UUID({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.uuid", {
        field: translatedPropertyName || fieldName,
        fieldName,
        translatedPropertyName,
        value,
        ...rest,
      });
      return reject(message);
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) {
      resolve(true);
    } else {
      const message = i18n.t("validator.uuid", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("UUID", _UUID);

/**
 * ### UUID Rule
 *
 * Validates that the field under validation is a valid UUID (v1-v5).
 *
 * @example
 * ```typescript
 * // Class validation
 * class Entity {
 *   @IsRequired
 *   @IsUUID
 *   id: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsUUID = Validator.buildPropertyDecorator(["UUID"]);

function _JSON({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.json", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    try {
      JSON.parse(value);
      resolve(true);
    } catch (error) {
      const message = i18n.t("validator.json", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("JSON", _JSON);

/**
 * ### JSON Rule
 *
 * Validates that the field under validation is valid JSON.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Config {
 *   @IsRequired
 *   @IsJSON
 *   settings: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsJSON = Validator.buildPropertyDecorator(["JSON"]);

function _Base64({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.base64", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    const base64Regex =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (base64Regex.test(value)) {
      resolve(true);
    } else {
      const message = i18n.t("validator.base64", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("Base64", _Base64);

/**
 * ### Base64 Rule
 *
 * Validates that the field under validation is valid Base64 encoded string.
 *
 * @example
 * ```typescript
 * // Class validation
 * class ImageData {
 *   @IsRequired
 *   @IsBase64
 *   data: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsBase64 = Validator.buildPropertyDecorator(["Base64"]);

function _HexColor({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.hexColor", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    // Supports #RGB, #RRGGBB, #RRGGBBAA formats
    const hexColorRegex =
      /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    if (hexColorRegex.test(value)) {
      resolve(true);
    } else {
      const message = i18n.t("validator.hexColor", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("HexColor", _HexColor);

/**
 * ### HexColor Rule
 *
 * Validates that the field under validation is a valid hexadecimal color code.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Theme {
 *   @IsRequired
 *   @IsHexColor
 *   primaryColor: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsHexColor = Validator.buildPropertyDecorator(["HexColor"]);

function _CreditCard({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.creditCard", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    // Remove spaces and dashes
    const cleanValue = value.replace(/[\s-]/g, "");

    // Check if it's all digits and length is between 13-19
    if (!/^\d{13,19}$/.test(cleanValue)) {
      const message = i18n.t("validator.creditCard", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanValue.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanValue.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    if (sum % 10 === 0) {
      resolve(true);
    } else {
      const message = i18n.t("validator.creditCard", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("CreditCard", _CreditCard);

/**
 * ### CreditCard Rule
 *
 * Validates that the field under validation is a valid credit card number using Luhn algorithm.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Payment {
 *   @IsRequired
 *   @IsCreditCard
 *   cardNumber: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsCreditCard = Validator.buildPropertyDecorator(["CreditCard"]);

function _IsIP({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions<string[]>): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.ip", {
        field: translatedPropertyName || fieldName,
        value,
        version: ruleParams?.[0] || "4/6",
        ...rest,
      });
      return reject(message);
    }

    const version = ruleParams?.[0] || "4/6";
    let ipRegex: RegExp;

    switch (version) {
      case "4":
        ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        break;
      case "6":
        ipRegex =
          /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        break;
      default: // 4/6
        const ipv4Regex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex =
          /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        ipRegex = new RegExp(`(?:${ipv4Regex.source})|(?:${ipv6Regex.source})`);
        break;
    }

    if (ipRegex.test(value)) {
      resolve(true);
    } else {
      const message = i18n.t("validator.ip", {
        field: translatedPropertyName || fieldName,
        value,
        version,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("IP", _IsIP);

/**
 * ### IP Rule
 *
 * Validates that the field under validation is a valid IP address.
 *
 * #### Parameters
 * - IP version: "4", "6", or "4/6" (default: "4/6")
 *
 * @example
 * ```typescript
 * // Class validation
 * class Server {
 *   @IsIP(['4']) // IPv4 only
 *   ipv4Address: string;
 *
 *   @IsIP(['6']) // IPv6 only
 *   ipv6Address: string;
 *
 *   @IsIP() // IPv4 or IPv6
 *   ipAddress: string;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing IP version ("4", "6", or "4/6")
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsIP = Validator.buildRuleDecorator<string[]>(_IsIP);

function _MACAddress({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions): IValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== "string") {
      const message = i18n.t("validator.macAddress", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    // Supports formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
    const macRegex =
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})$/;
    if (macRegex.test(value)) {
      resolve(true);
    } else {
      const message = i18n.t("validator.macAddress", {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}
Validator.registerRule("MACAddress", _MACAddress);

/**
 * ### MACAddress Rule
 *
 * Validates that the field under validation is a valid MAC address.
 *
 * @example
 * ```typescript
 * // Class validation
 * class NetworkDevice {
 *   @IsRequired
 *   @IsMACAddress
 *   macAddress: string;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const IsMACAddress = Validator.buildPropertyDecorator(["MACAddress"]);

function _Matches({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: IValidatorValidateOptions<
  [rule: RegExp, errorMessage?: string]
>): IValidatorResult {
  if (typeof value !== "string") {
    const message = i18n.t("validator.regex", {
      field: translatedPropertyName || fieldName,
      value,
      pattern: ruleParams?.[0] || "",
      ...rest,
    });
    return message;
  }

  if (!ruleParams || !ruleParams[0]) {
    const message = i18n.t("validator.invalidRuleParams", {
      rule: "Matches",
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  const messageParams = defaultStr(ruleParams[1]).trim();
  const translatedMessage = defaultStr(
    messageParams ? i18n.getNestedTranslation(messageParams) : ""
  ).trim();
  const message =
    translatedMessage ??
    i18n.t("validator.regex", {
      field: translatedPropertyName || fieldName,
      value,
      pattern: ruleParams[0],
      ...rest,
    });
  try {
    const regex = new RegExp(ruleParams[0]);
    return regex.test(value) ? true : message;
  } catch (error) {}
  return message;
}
Validator.registerRule("Matches", _Matches);

/**
 * ### Matches Rule
 *
 * Validates that the field under validation matches the specified regular expression.
 *
 * #### Parameters
 * - Regular expression pattern (string)
 *
 * @example
 * ```typescript
 * // Class validation
 * class CustomFormat {
 *   @Matches(['^[A-Z]{2}\\d{4}$','Invalid custom code format']) // Two letters followed by 4 digits
 *   customCode: string;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing regex pattern
 * @param options.ruleParams[0] - Regex pattern
 * @param options.ruleParams[1] - Optional error message or error message translation key
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 * @since 1.22.0
 * @public
 */
export const Matches =
  Validator.buildRuleDecorator<[rule: RegExp, errorMessage?: string]>(_Matches);

declare module "../types" {
  export interface IValidatorRulesMap<Context = unknown> {
    /**
     * ### UUID Rule
     *
     * Validates that the field under validation is a valid UUID (v1-v5).
     *
     * @example
     * ```typescript
     * // Valid UUIDs
     * await Validator.validate({
     *   value: '550e8400-e29b-41d4-a716-446655440000',
     *   rules: ['UUID']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
     *   rules: ['UUID']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-a-uuid',
     *   rules: ['UUID']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '550e8400-e29b-41d4-a716', // Too short
     *   rules: ['UUID']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['UUID']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Entity {
     *   @Required
     *   @UUID
     *   id: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    UUID: IValidatorRuleParams<[], Context>;

    /**
     * ### JSON Rule
     *
     * Validates that the field under validation is valid JSON.
     *
     * @example
     * ```typescript
     * // Valid JSON strings
     * await Validator.validate({
     *   value: '{"name": "John", "age": 30}',
     *   rules: ['JSON']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '[1, 2, 3]',
     *   rules: ['JSON']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '{"name": "John", "age": }', // Invalid JSON
     *   rules: ['JSON']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['JSON']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Config {
     *   @Required
     *   @JSON
     *   settings: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    JSON: IValidatorRuleParams<[], Context>;

    /**
     * ### Base64 Rule
     *
     * Validates that the field under validation is valid Base64 encoded string.
     *
     * @example
     * ```typescript
     * // Valid Base64 strings
     * await Validator.validate({
     *   value: 'SGVsbG8gV29ybGQ=', // "Hello World"
     *   rules: ['Base64']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'dGVzdA==', // "test"
     *   rules: ['Base64']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-base64!',
     *   rules: ['Base64']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Base64']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class ImageData {
     *   @Required
     *   @Base64
     *   data: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    Base64: IValidatorRuleParams<[], Context>;

    /**
     * ### HexColor Rule
     *
     * Validates that the field under validation is a valid hexadecimal color code.
     *
     * @example
     * ```typescript
     * // Valid hex colors
     * await Validator.validate({
     *   value: '#FF0000',
     *   rules: ['HexColor']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '#3366cc',
     *   rules: ['HexColor']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '#abc', // Short format
     *   rules: ['HexColor']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '#FF000080', // With alpha
     *   rules: ['HexColor']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '#GGG', // Invalid characters
     *   rules: ['HexColor']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '#12', // Too short
     *   rules: ['HexColor']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['HexColor']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Theme {
     *   @Required
     *   @HexColor
     *   primaryColor: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    HexColor: IValidatorRuleParams<[], Context>;

    /**
     * ### CreditCard Rule
     *
     * Validates that the field under validation is a valid credit card number using Luhn algorithm.
     *
     * @example
     * ```typescript
     * // Valid credit card numbers
     * await Validator.validate({
     *   value: '4532015112830366', // Visa test number
     *   rules: ['CreditCard']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '4532-0151-1283-0366', // With dashes
     *   rules: ['CreditCard']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '4532015112830367', // Invalid checksum
     *   rules: ['CreditCard']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '123',
     *   rules: ['CreditCard']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 4532015112830366,
     *   rules: ['CreditCard']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Payment {
     *   @Required
     *   @CreditCard
     *   cardNumber: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    CreditCard: IValidatorRuleParams<[], Context>;

    /**
     * ### IP Rule
     *
     * Validates that the field under validation is a valid IP address.
     *
     * #### Parameters
     * - IP version: "4", "6", or "4/6" (default: "4/6")
     *
     * @example
     * ```typescript
     * // Valid IP addresses
     * await Validator.validate({
     *   value: '192.168.1.1',
     *   rules: ['IP[4]']
     * }); // ✓ Valid IPv4
     *
     * await Validator.validate({
     *   value: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
     *   rules: ['IP[6]']
     * }); // ✓ Valid IPv6
     *
     * await Validator.validate({
     *   value: '192.168.1.1',
     *   rules: ['IP'] // Default allows both
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '256.1.1.1', // Invalid IPv4
     *   rules: ['IP[4]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '192.168.1.1',
     *   rules: ['IP[6]'] // IPv4 not valid for IPv6 only
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['IP']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Server {
     *   @IsIP(['4']) // IPv4 only
     *   ipv4Address: string;
     *
     *   @IsIP(['6']) // IPv6 only
     *   ipv6Address: string;
     *
     *   @IsIP() // IPv4 or IPv6
     *   ipAddress: string;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing IP version ("4", "6", or "4/6")
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    IP: IValidatorRuleParams<string[], Context>;

    /**
     * ### MACAddress Rule
     *
     * Validates that the field under validation is a valid MAC address.
     *
     * @example
     * ```typescript
     * // Valid MAC addresses
     * await Validator.validate({
     *   value: '00:1B:44:11:3A:B7',
     *   rules: ['MACAddress']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '00-1B-44-11-3A-B7',
     *   rules: ['MACAddress']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '001B44113AB7',
     *   rules: ['MACAddress']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '00:1B:44:11:3A', // Too short
     *   rules: ['MACAddress']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 'GG:1B:44:11:3A:B7', // Invalid characters
     *   rules: ['MACAddress']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['MACAddress']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class NetworkDevice {
     *   @Required
     *   @MACAddress
     *   macAddress: string;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    MACAddress: IValidatorRuleParams<[], Context>;

    /**
     * ### Matches Rule
     *
     * Validates that the field under validation matches the specified regular expression.
     *
     * #### Parameters
     * - Regular expression pattern (string)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: 'ABC1234',
     *   rules: ['Matches[^[A-Z]{3}\\d{4}$]']
     * }); // ✓ Valid (3 letters + 4 digits)
     *
     * await Validator.validate({
     *   value: 'user@example.com',
     *   rules: ['Matches[^\\S+@\\S+\\.\\S+$]']
     * }); // ✓ Valid email pattern
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'abc123',
     *   rules: ['Matches[^[A-Z]{3}\\d{4}$]']
     * }); // ✗ Invalid (lowercase letters)
     *
     * await Validator.validate({
     *   value: 'invalid-pattern(',
     *   rules: ['Matches[(]'] // Invalid regex
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Matches[\\d+]']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation
     * class CustomFormat {
     *   @Matches(['^[A-Z]{2}\\d{4}$','Invalid custom code format']) // Two letters followed by 4 digits
     *   customCode: string;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing regex pattern
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     * @since 1.22.0
     * @public
     */
    Matches: IValidatorRuleParams<string[], Context>;
  }
}
