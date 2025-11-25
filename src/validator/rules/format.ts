import { InputFormatter } from '@/inputFormatter';
import { CountryCode } from '@countries/types';
import { defaultStr } from '@utils/defaultStr';
import { isEmail, IsEmailOptions } from '@utils/isEmail';
import { isNonNullString } from '@utils/isNonNullString';
import { isUrl, IsUrlOptions } from '@utils/uri';
import type { ValidatorRuleParams, ValidatorRuleParamTypes } from '../types';
import { ValidatorResult, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

/**
 * ### IsEmail Decorator
 *
 * Validates that a property value is a properly formatted email address according to RFC 5322 standards.
 * This decorator performs comprehensive email validation including:
 *
 * - **Local part validation**: Checks the part before @ for valid characters, proper dot placement, and quoted strings
 * - **Domain validation**: Validates domain structure, TLD requirements, and supports international domains (IDN)
 * - **IP address domains**: Supports [IPv4] and [IPv6] bracketed formats
 * - **Length constraints**: Configurable limits for total length, local part, domain, and domain labels
 * - **Edge case handling**: Consecutive dots, leading/trailing dots, escaped characters in quoted strings
 *
 * The validation is based on RFC 5321 (SMTP) and RFC 5322 (Internet Message Format) specifications,
 * ensuring compatibility with modern email systems while being strict enough to catch common typos.
 *
 * #### Configuration Options
 *
 * The decorator accepts an optional configuration object to customize validation constraints:
 *
 * - `maxTotalLength`: Maximum total email length (default: 320 characters, per RFC 5321)
 * - `maxLocalPartLength`: Maximum local part length (default: 64 characters, per RFC 5321)
 * - `maxDomainLength`: Maximum domain length (default: 255 characters, per RFC 1035)
 * - `maxDomainLabelLength`: Maximum individual domain label length (default: 63 characters, per RFC 1035)
 *
 * #### Usage Examples
 *
 * **Basic usage (default settings):**
 * ```typescript
 * class User {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsEmail() // Optional email field
 *   backupEmail?: string;
 * }
 *
 * // Valid examples
 * const user1 = { email: "user@example.com" }; // ✓ Valid
 * const user2 = { email: "test.email+tag@subdomain.example.co.uk" }; // ✓ Valid
 * const user3 = { email: "\"quoted.name\"@example.com" }; // ✓ Valid (quoted local part)
 * const user4 = { email: "user@[192.168.1.1]" }; // ✓ Valid (IP domain)
 *
 * // Invalid examples
 * const invalid1 = { email: "not-an-email" }; // ✗ Missing @
 * const invalid2 = { email: "@example.com" }; // ✗ Empty local part
 * const invalid3 = { email: "user@" }; // ✗ Empty domain
 * const invalid4 = { email: "user..name@example.com" }; // ✗ Consecutive dots
 * ```
 *
 * **Custom length constraints:**
 * ```typescript
 * class StrictUser {
 *   @IsEmail({
 *     maxTotalLength: 100,        // Shorter total limit
 *     maxLocalPartLength: 32,     // Shorter local part
 *     maxDomainLength: 50         // Shorter domain
 *   })
 *   email: string;
 * }
 *
 * // Valid with custom limits
 * const user = { email: "short@example.com" }; // ✓ Valid (under limits)
 *
 * // Invalid with custom limits
 * const tooLong = { email: "very.long.local.part.that.exceeds.limits@example.com" }; // ✗ Too long
 * ```
 *
 * **Integration with other validators:**
 * ```typescript
 * class ContactForm {
 *   @IsRequired()
 *   @IsEmail()
 *   @MaxLength(254) // Additional length check
 *   email: string;
 *
 *   @IsOptional()
 *   @IsEmail({
 *     maxTotalLength: 320,
 *     maxLocalPartLength: 64
 *   })
 *   ccEmail?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid format**: Returns localized error message from i18n system
 * - **Valid emails**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - Email validation is computationally lightweight and suitable for high-throughput validation
 * - The regex-based validation is optimized for common email patterns
 * - Custom length constraints are checked first for early rejection of obviously invalid inputs
 * - Supports both simple and complex email formats without performance degradation
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.email'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **User registration:**
 * ```typescript
 * class RegisterUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 * }
 * ```
 *
 * **Contact forms:**
 * ```typescript
 * class Contact {
 *   @IsEmail()
 *   email?: string; // Optional contact email
 * }
 * ```
 *
 * **API data validation:**
 * ```typescript
 * class APIUser {
 *   @IsEmail({
 *     maxTotalLength: 254, // RFC 3696 recommendation
 *     maxLocalPartLength: 64,
 *     maxDomainLength: 255
 *   })
 *   email: string;
 * }
 * ```
 *
 * @template {IsEmailOptions} [TOptions=[options?: IsEmailOptions]]
 *   Type parameter for the email validation options tuple
 *
 * @param {TOptions} [options] - Optional configuration object for email validation constraints
 * @param {number} [options.maxTotalLength=320] - Maximum total email length in characters
 * @param {number} [options.maxLocalPartLength=64] - Maximum local part length in characters
 * @param {number} [options.maxDomainLength=255] - Maximum domain length in characters
 * @param {number} [options.maxDomainLabelLength=63] - Maximum domain label length in characters
 *
 * @returns {PropertyDecorator} A property decorator that validates email format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class User {
 *   @IsEmail()
 *   email: string;
 * }
 *
 * // With custom options
 * class StrictUser {
 *   @IsEmail({
 *     maxTotalLength: 100,
 *     maxLocalPartLength: 32
 *   })
 *   email: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsEmail = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Email']
>(function _IsEmail(options) {
  const { value, i18n } = options;
  const message = i18n.t('validator.email', options);
  if (!isNonNullString(value)) {
    return message;
  }
  return isEmail(value) || message;
}, 'Email');

/**
 * ### IsUrl Decorator
 *
 * Validates that a property value is a properly formatted URL. Checks for
 * valid URL structure including protocol, domain, and optional path components.
 * This decorator provides comprehensive URL validation with configurable options
 * for protocol requirements and allowed protocols.
 *
 * #### Configuration Options
 *
 * The decorator accepts an optional configuration object to customize validation behavior:
 *
 * - `requireHost`: If true, only allows protocols that require a hostname (http, https, ftp, etc.).
 *   If false, allows all valid protocols including mailto, tel, data, etc. (default: true)
 * - `allowedProtocols`: List of allowed protocols. If provided, only URLs with these protocols are considered valid.
 *   Protocols should be specified without the trailing colon (e.g., 'http', not 'http:').
 *
 * #### Validation Logic
 *
 * - **Protocol validation**: Ensures URL starts with a valid protocol
 * - **Host requirements**: Can require or allow hostless protocols (mailto, tel, data)
 * - **Protocol filtering**: Optional whitelist of allowed protocols
 * - **Structure validation**: Validates overall URL format and components
 *
 * #### Usage Examples
 *
 * **Basic usage (default settings):**
 * ```typescript
 * class Website {
 *   @IsRequired()
 *   @IsUrl()
 *   homepage: string;
 *
 *   @IsUrl() // Optional URL field
 *   blogUrl?: string;
 * }
 *
 * // Valid examples
 * const site1 = { homepage: "https://example.com" }; // ✓ Valid
 * const site2 = { homepage: "https://example.com/path?query=value#fragment" }; // ✓ Valid
 * const site3 = { homepage: "ftp://ftp.example.com/file.txt" }; // ✓ Valid
 *
 * // Invalid examples
 * const invalid1 = { homepage: "not-a-url" }; // ✗ Missing protocol
 * const invalid2 = { homepage: "example.com" }; // ✗ Missing protocol
 * const invalid3 = { homepage: "mailto:user@example.com" }; // ✗ Requires host by default
 * ```
 *
 * **Custom protocol requirements:**
 * ```typescript
 * class FlexibleSite {
 *   @IsUrl({ requireHost: false }) // Allow mailto, tel, data, etc.
 *   contactUrl?: string;
 *
 *   @IsUrl({ allowedProtocols: ['https'] }) // Only HTTPS allowed
 *   secureUrl: string;
 *
 *   @IsUrl({ allowedProtocols: ['http', 'https', 'ftp'] }) // Multiple protocols
 *   resourceUrl: string;
 * }
 *
 * // Valid with custom settings
 * const flexible = {
 *   contactUrl: "mailto:user@example.com", // ✓ Valid (host not required)
 *   secureUrl: "https://secure.example.com", // ✓ Valid (HTTPS allowed)
 *   resourceUrl: "ftp://ftp.example.com/file.txt" // ✓ Valid (FTP allowed)
 * };
 *
 * // Invalid with custom settings
 * const invalid = {
 *   contactUrl: "https://example.com", // ✗ Would be valid but not testing here
 *   secureUrl: "http://insecure.example.com", // ✗ HTTP not in allowed protocols
 *   resourceUrl: "file:///local/path" // ✗ file protocol not allowed
 * };
 * ```
 *
 * **Integration with other validators:**
 * ```typescript
 * class WebResource {
 *   @IsRequired()
 *   @IsUrl()
 *   @MaxLength(2048) // Reasonable URL length limit
 *   url: string;
 *
 *   @IsOptional()
 *   @IsUrl({ requireHost: false })
 *   callbackUrl?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Considered valid (use `@IsRequired()` for mandatory fields)
 * - **Non-string values**: Considered valid (other validators should handle type checking)
 * - **Invalid URLs**: Returns localized error message from i18n system
 * - **Valid URLs**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - URL validation is computationally lightweight using efficient regex patterns
 * - Protocol filtering is performed early for fast rejection of invalid protocols
 * - Suitable for high-throughput validation scenarios
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.url'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Web application URLs:**
 * ```typescript
 * class WebApp {
 *   @IsRequired()
 *   @IsUrl({ allowedProtocols: ['https'] })
 *   apiUrl: string;
 * }
 * ```
 *
 * **Contact information:**
 * ```typescript
 * class Contact {
 *   @IsUrl({ requireHost: false })
 *   website?: string; // Allow mailto:, tel:, etc.
 * }
 * ```
 *
 * **Resource links:**
 * ```typescript
 * class Resource {
 *   @IsUrl({ allowedProtocols: ['http', 'https', 'ftp'] })
 *   downloadUrl: string;
 * }
 * ```
 *
 * @param options - Optional configuration object for URL validation
 * @param options.requireHost - Whether to require protocols that need a hostname (default: true)
 * @param options.allowedProtocols - Array of allowed protocols without colons
 * @returns A property decorator that validates URL format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Website {
 *   @IsUrl()
 *   homepage: string;
 * }
 *
 * // With custom options
 * class SecureSite {
 *   @IsUrl({ allowedProtocols: ['https'] })
 *   secureUrl: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsUrl = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Url']
>(function Url(options) {
  const { value, i18n, ruleParams } = options;
  return !value || typeof value !== 'string'
    ? true
    : isUrl(value, ruleParams[0]) || i18n.t('validator.url', options);
}, 'Url');

/**
 * ### IsPhoneNumber Decorator
 *
 * Validates that a property value is a valid phone number. This decorator uses
 * the InputFormatter's comprehensive phone number validation which supports
 * international phone numbers with automatic country code detection and validation
 * against specific country formats.
 *
 * #### Configuration Options
 *
 * The decorator accepts an optional configuration object:
 *
 * - `countryCode`: Optional country code to validate against a specific country's format.
 *   If not provided, automatic country detection is used based on the phone number format.
 *
 * #### Validation Logic
 *
 * - **International format support**: Validates E.164 international format (+country code)
 * - **National format support**: Validates local/national phone number formats
 * - **Country-specific validation**: Can enforce validation against specific country rules
 * - **Format normalization**: Accepts various input formats (spaces, dashes, parentheses)
 * - **Length validation**: Ensures phone numbers meet minimum/maximum length requirements
 * - **Digit validation**: Ensures only valid phone number characters and patterns
 *
 * #### Usage Examples
 *
 * **Basic usage (automatic country detection):**
 * ```typescript
 * class Contact {
 *   @IsRequired()
 *   @IsPhoneNumber()
 *   phone: string;
 *
 *   @IsPhoneNumber() // Optional phone field
 *   mobile?: string;
 * }
 *
 * // Valid examples (automatic detection)
 * const contact1 = { phone: "+1234567890" }; // ✓ Valid (US/CA format)
 * const contact2 = { phone: "(555) 123-4567" }; // ✓ Valid (US national format)
 * const contact3 = { phone: "+44 20 7123 4567" }; // ✓ Valid (UK format)
 * const contact4 = { phone: "+33 1 23 45 67 89" }; // ✓ Valid (France format)
 *
 * // Invalid examples
 * const invalid1 = { phone: "not-a-phone-number" }; // ✗ Invalid format
 * const invalid2 = { phone: "123" }; // ✗ Too short
 * const invalid3 = { phone: "" }; // ✗ Empty string
 * ```
 *
 * **Country-specific validation:**
 * ```typescript
 * class LocalizedContact {
 *   @IsPhoneNumber({ countryCode: 'US' }) // US format only
 *   usPhone: string;
 *
 *   @IsPhoneNumber({ countryCode: 'GB' }) // UK format only
 *   ukPhone: string;
 *
 *   @IsPhoneNumber({ countryCode: 'FR' }) // France format only
 *   frPhone: string;
 * }
 *
 * // Valid with country constraints
 * const localized = {
 *   usPhone: "(555) 123-4567", // ✓ Valid for US
 *   ukPhone: "+44 20 7123 4567", // ✓ Valid for UK
 *   frPhone: "+33 1 23 45 67 89" // ✓ Valid for France
 * };
 *
 * // Invalid with country constraints
 * const invalidLocalized = {
 *   usPhone: "+44 20 7123 4567", // ✗ UK number for US field
 *   ukPhone: "(555) 123-4567", // ✗ US number for UK field
 * };
 * ```
 *
 * **Integration with other validators:**
 * ```typescript
 * class UserRegistration {
 *   @IsRequired()
 *   @IsPhoneNumber()
 *   @MaxLength(20) // Reasonable phone length limit
 *   phoneNumber: string;
 *
 *   @IsOptional()
 *   @IsPhoneNumber({ countryCode: 'US' })
 *   backupPhone?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid phone numbers**: Returns localized error message from i18n system
 * - **Valid phone numbers**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - Phone number validation uses efficient pattern matching and country detection algorithms
 * - Country-specific validation is optimized for common phone number formats
 * - Suitable for high-throughput validation with minimal performance impact
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.phoneNumber'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **User registration:**
 * ```typescript
 * class RegisterUser {
 *   @IsRequired()
 *   @IsPhoneNumber()
 *   phoneNumber: string;
 * }
 * ```
 *
 * **Contact forms:**
 * ```typescript
 * class ContactForm {
 *   @IsPhoneNumber()
 *   phone?: string; // Optional contact phone
 * }
 * ```
 *
 * **Country-specific applications:**
 * ```typescript
 * class USApplication {
 *   @IsRequired()
 *   @IsPhoneNumber({ countryCode: 'US' })
 *   phoneNumber: string;
 * }
 * ```
 *
 * @param options - Optional configuration object for phone number validation
 * @param options.countryCode - Country code to validate against specific country's format
 * @returns A property decorator that validates phone number format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Contact {
 *   @IsPhoneNumber()
 *   phone: string;
 * }
 *
 * // With country code
 * class USContact {
 *   @IsPhoneNumber({ countryCode: 'US' })
 *   phone: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsPhoneNumber = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['PhoneNumber']
>(function phoneNumber(
  options: ValidatorValidateOptions<[countryCode?: CountryCode]>
) {
  const { value, phoneCountryCode, i18n, ruleParams } = options;
  const message = i18n.t('validator.phoneNumber', options);
  if (!isNonNullString(value)) {
    return message;
  }
  return (
    InputFormatter.isValidPhoneNumber(
      value,
      phoneCountryCode ? ruleParams?.[0] : undefined
    ) || message
  );
}, 'PhoneNumber');

/**
 * ### IsEmailOrPhone Decorator
 *
 * Validates that a property value is either a valid email address or a valid phone number.
 * This decorator provides flexible validation for contact information fields that can accept
 * either email or phone number formats, automatically detecting and validating the appropriate type.
 *
 * #### Configuration Options
 *
 * The decorator accepts an optional configuration object with separate options for email and phone validation:
 *
 * - `email`: Email validation options (same as IsEmail rule - maxTotalLength, maxLocalPartLength, etc.)
 * - `phoneNumber`: Phone number validation options with country code
 *
 * #### Validation Logic
 *
 * - **Automatic type detection**: Attempts email validation first, then phone validation if email fails
 * - **Email validation**: Full RFC 5322 compliant email validation with configurable constraints
 * - **Phone validation**: International phone number validation with country code support
 * - **Flexible input**: Accepts various email and phone number formats
 * - **Fallback behavior**: If neither validation passes, returns appropriate error message
 *
 * #### Usage Examples
 *
 * **Basic usage (automatic detection):**
 * ```typescript
 * class Contact {
 *   @IsRequired()
 *   @IsEmailOrPhone()
 *   contactInfo: string;
 *
 *   @IsEmailOrPhone() // Optional contact field
 *   backupContact?: string;
 * }
 *
 * // Valid examples (either email or phone)
 * const contact1 = { contactInfo: "user@example.com" }; // ✓ Valid (email)
 * const contact2 = { contactInfo: "+1234567890" }; // ✓ Valid (phone)
 * const contact3 = { contactInfo: "(555) 123-4567" }; // ✓ Valid (phone)
 * const contact4 = { contactInfo: "test.email+tag@subdomain.example.co.uk" }; // ✓ Valid (email)
 *
 * // Invalid examples
 * const invalid1 = { contactInfo: "not-valid-contact" }; // ✗ Neither valid email nor phone
 * const invalid2 = { contactInfo: "@example.com" }; // ✗ Invalid email, not a phone
 * const invalid3 = { contactInfo: "123" }; // ✗ Too short for phone, not email
 * const invalid4 = { contactInfo: "" }; // ✗ Empty string
 * ```
 *
 * **Custom validation constraints:**
 * ```typescript
 * class FlexibleContact {
 *   @IsEmailOrPhone({
 *     email: { maxTotalLength: 100 },
 *     phoneNumber: { countryCode: 'US' }
 *   })
 *   contact: string;
 *
 *   @IsEmailOrPhone({
 *     email: { maxLocalPartLength: 32 },
 *     phoneNumber: { countryCode: 'GB' }
 *   })
 *   internationalContact: string;
 * }
 *
 * // Valid with custom constraints
 * const flexible = {
 *   contact: "user@example.com", // ✓ Valid email (under length limit)
 *   internationalContact: "+44 20 7123 4567" // ✓ Valid UK phone
 * };
 *
 * // Invalid with custom constraints
 * const invalidFlexible = {
 *   contact: "very.long.email.address.that.exceeds.limit@example.com", // ✗ Email too long
 *   internationalContact: "(555) 123-4567" // ✗ US phone for UK field
 * };
 * ```
 *
 * **Integration with other validators:**
 * ```typescript
 * class UserContact {
 *   @IsRequired()
 *   @IsEmailOrPhone()
 *   @MaxLength(254) // Reasonable contact length limit
 *   primaryContact: string;
 *
 *   @IsOptional()
 *   @IsEmailOrPhone({
 *     email: { maxTotalLength: 320 },
 *     phoneNumber: { countryCode: 'US' }
 *   })
 *   secondaryContact?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Valid email or phone**: Returns `true`
 * - **Invalid input**: Returns localized error message indicating neither email nor phone format is valid
 *
 * #### Performance Considerations
 *
 * - Efficient validation with early rejection for obviously invalid inputs
 * - Email validation attempted first (typically faster regex-based)
 * - Phone validation only performed if email validation fails
 * - Suitable for contact form validation with good performance characteristics
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.emailOrPhoneNumber'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **User registration with flexible contact:**
 * ```typescript
 * class RegisterUser {
 *   @IsRequired()
 *   @IsEmailOrPhone()
 *   usernameOrEmailOrPhone: string;
 * }
 * ```
 *
 * **Contact forms:**
 * ```typescript
 * class ContactForm {
 *   @IsEmailOrPhone()
 *   preferredContact?: string; // User can provide either email or phone
 * }
 * ```
 *
 * **Multi-channel communication:**
 * ```typescript
 * class NotificationSettings {
 *   @IsRequired()
 *   @IsEmailOrPhone()
 *   contactMethod: string; // Email or SMS capable number
 * }
 * ```
 *
 * @param options - Optional configuration object for email and phone validation
 * @param options.email - Email validation options (maxTotalLength, maxLocalPartLength, etc.)
 * @param options.phoneNumber - Phone validation options with country code
 * @returns A property decorator that validates email or phone number format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Contact {
 *   @IsEmailOrPhone()
 *   contactInfo: string;
 * }
 *
 * // With custom options
 * class FlexibleContact {
 *   @IsEmailOrPhone({
 *     email: { maxTotalLength: 100 },
 *     phoneNumber: { countryCode: 'US' }
 *   })
 *   contact: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsEmailOrPhone = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['EmailOrPhoneNumber']
>(function emailOrPhoneNumber(options: ValidatorValidateOptions) {
  const { value, phoneCountryCode, i18n, ruleParams } = options;
  return (
    isEmail(value, ruleParams?.[0]?.email) ||
    InputFormatter.isValidPhoneNumber(
      value,
      phoneCountryCode ?? ruleParams?.[0]?.phoneNumber?.countryCode
    ) ||
    i18n.t('validator.emailOrPhoneNumber', options)
  );
}, 'EmailOrPhoneNumber');

/**
 * ### IsFileName Decorator
 *
 * Validates that a property value is a valid file name. This decorator checks for
 * forbidden characters and reserved names that cannot be used as file names across
 * different operating systems (Windows, macOS, Linux).
 *
 * #### Validation Logic
 *
 * - **Forbidden characters**: Blocks \ / : * ? " < > | which are invalid in file names
 * - **Starting character**: Cannot start with a dot (.) to prevent hidden files
 * - **Reserved names**: Blocks Windows reserved names (nul, prn, con, lpt[0-9], com[0-9])
 * - **Case insensitive**: Reserved name checks are case-insensitive
 * - **Cross-platform**: Validates against restrictions from multiple operating systems
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class FileUpload {
 *   @IsRequired()
 *   @IsFileName()
 *   fileName: string;
 *
 *   @IsFileName() // Optional file name field
 *   displayName?: string;
 * }
 *
 * // Valid file names
 * const upload1 = { fileName: "document.txt" }; // ✓ Valid
 * const upload2 = { fileName: "my-file_123.pdf" }; // ✓ Valid
 * const upload3 = { fileName: "file with spaces.jpg" }; // ✓ Valid
 * const upload4 = { fileName: "résumé.docx" }; // ✓ Valid (Unicode supported)
 * const upload5 = { fileName: "file-name.tar.gz" }; // ✓ Valid
 *
 * // Invalid examples
 * const invalid1 = { fileName: "file:with:colons.txt" }; // ✗ Contains forbidden characters
 * const invalid2 = { fileName: "con" }; // ✗ Reserved name (Windows)
 * const invalid3 = { fileName: ".hidden" }; // ✗ Starts with dot
 * const invalid4 = { fileName: "file<name>.txt" }; // ✗ Contains < >
 * const invalid5 = { fileName: "file|name.txt" }; // ✗ Contains |
 * const invalid6 = { fileName: "" }; // ✗ Empty string
 * ```
 *
 * **Integration with file upload:**
 * ```typescript
 * class FileMetadata {
 *   @IsRequired()
 *   @IsFileName()
 *   @MaxLength(255) // Reasonable file name length
 *   originalName: string;
 *
 *   @IsOptional()
 *   @IsFileName()
 *   displayName?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid file names**: Returns localized error message from i18n system
 * - **Valid file names**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - File name validation uses efficient regex patterns for character validation
 * - Reserved name checking is optimized with case-insensitive string comparison
 * - Suitable for high-throughput file upload validation
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.fileName'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **File upload forms:**
 * ```typescript
 * class UploadForm {
 *   @IsRequired()
 *   @IsFileName()
 *   fileName: string;
 * }
 * ```
 *
 * **Document management:**
 * ```typescript
 * class Document {
 *   @IsRequired()
 *   @IsFileName()
 *   fileName: string;
 *
 *   @IsFileName()
 *   alias?: string;
 * }
 * ```
 *
 * **Asset naming:**
 * ```typescript
 * class Asset {
 *   @IsRequired()
 *   @IsFileName()
 *   @Matches(['^[a-zA-Z0-9._-]+$', 'asset.invalidChars'])
 *   name: string;
 * }
 * ```
 *
 * #### Security Considerations
 *
 * - Prevents path traversal attacks by blocking directory separators
 * - Blocks reserved names that could cause system conflicts
 * - Helps prevent filesystem-related security vulnerabilities
 *
 * @returns A property decorator that validates file name format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class FileUpload {
 *   @IsFileName()
 *   fileName: string;
 * }
 *
 * // With additional constraints
 * class StrictFileUpload {
 *   @IsFileName()
 *   @MaxLength(100)
 *   @Matches(['^[a-zA-Z0-9._-]+$', 'filename.invalid'])
 *   fileName: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsFileName = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['FileName']
>(function FileName(options) {
  const { value, i18n } = options;
  const message = i18n.t('validator.fileName', options);
  if (!isNonNullString(value)) return message;
  const rg1 = /^[^\\/:*?"<>|]+$/; // forbidden characters \ / : * ? " < > |
  const rg2 = /^\./; // cannot start with dot (.)
  const rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
  return (
    (rg1.test(String(value)) && !rg2.test(value) && !rg3.test(value)) || message
  );
}, 'FileName');

/**
 * ### IsUUID Decorator
 *
 * Validates that a property value is a valid Universally Unique Identifier (UUID).
 * This decorator validates UUIDs according to RFC 4122 standards, supporting all
 * UUID versions (v1-v5) with proper format and variant validation.
 *
 * #### Validation Logic
 *
 * - **Format validation**: Ensures UUID follows the standard 8-4-4-4-12 hexadecimal format
 * - **Version support**: Accepts UUIDs of any version (1-5) as indicated by version bits
 * - **Variant validation**: Ensures correct UUID variant (RFC 4122 variant)
 * - **Case insensitive**: Accepts both uppercase and lowercase hexadecimal digits
 * - **Hyphen requirements**: Requires proper hyphen placement between groups
 *
 * #### UUID Format
 *
 * UUIDs must follow the pattern: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
 * where each `x` is a hexadecimal digit (0-9, a-f, A-F).
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class Entity {
 *   @IsRequired()
 *   @IsUUID()
 *   id: string;
 *
 *   @IsUUID() // Optional UUID field
 *   parentId?: string;
 * }
 *
 * // Valid UUIDs (all versions)
 * const entity1 = { id: "550e8400-e29b-41d4-a716-446655440000" }; // ✓ Valid (v4)
 * const entity2 = { id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" }; // ✓ Valid (v1)
 * const entity3 = { id: "550E8400-E29B-41D4-A716-446655440000" }; // ✓ Valid (uppercase)
 * const entity4 = { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" }; // ✓ Valid (v4)
 *
 * // Invalid examples
 * const invalid1 = { id: "not-a-uuid" }; // ✗ Invalid format
 * const invalid2 = { id: "550e8400-e29b-41d4-a716" }; // ✗ Too short
 * const invalid3 = { id: "550e8400-e29b-41d4-a716-446655440000-extra" }; // ✗ Too long
 * const invalid4 = { id: "550e8400e29b41d4a716446655440000" }; // ✗ Missing hyphens
 * const invalid5 = { id: "550e8400-e29b-41d4-a716-44665544000g" }; // ✗ Invalid character (g)
 * const invalid6 = { id: "" }; // ✗ Empty string
 * ```
 *
 * **Integration with database entities:**
 * ```typescript
 * class DatabaseEntity {
 *   @IsRequired()
 *   @IsUUID()
 *   @MaxLength(36) // UUIDs are always 36 characters
 *   id: string;
 *
 *   @IsOptional()
 *   @IsUUID()
 *   tenantId?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid UUIDs**: Returns localized error message from i18n system
 * - **Valid UUIDs**: Returns `true` (asynchronous validation)
 *
 * #### Performance Considerations
 *
 * - UUID validation uses efficient regex pattern matching
 * - Asynchronous validation allows for non-blocking validation in high-throughput scenarios
 * - Regex is optimized for the specific UUID format requirements
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.uuid'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Database primary keys:**
 * ```typescript
 * class Model {
 *   @IsRequired()
 *   @IsUUID()
 *   id: string;
 * }
 * ```
 *
 * **API resource identifiers:**
 * ```typescript
 * class APIResource {
 *   @IsRequired()
 *   @IsUUID()
 *   resourceId: string;
 * }
 * ```
 *
 * **Session tokens:**
 * ```typescript
 * class Session {
 *   @IsRequired()
 *   @IsUUID()
 *   sessionId: string;
 * }
 * ```
 *
 * #### Standards Compliance
 *
 * - **RFC 4122**: Compliant with UUID standard format and variant requirements
 * - **Version agnostic**: Accepts UUIDs of all versions (v1-v5)
 * - **Case insensitive**: Follows RFC guidelines for hexadecimal representation
 *
 * @returns A property decorator that validates UUID format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Entity {
 *   @IsUUID()
 *   id: string;
 * }
 *
 * // With additional constraints
 * class StrictEntity {
 *   @IsUUID()
 *   @MaxLength(36)
 *   id: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsUUID = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['UUID']
>(function _UUID({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== 'string') {
      const message = i18n.t('validator.uuid', {
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
      const message = i18n.t('validator.uuid', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}, 'UUID');

/**
 * ### IsJSON Decorator
 *
 * Validates that a property value is valid JSON (JavaScript Object Notation).
 * This decorator attempts to parse the string value as JSON and validates that
 * it conforms to proper JSON syntax and structure.
 *
 * #### Validation Logic
 *
 * - **Syntax validation**: Ensures the string is valid JSON syntax
 * - **Structure validation**: Validates that the JSON represents valid data structures
 * - **Encoding**: Assumes UTF-8 encoding for the JSON string
 * - **Parsing**: Uses native JSON.parse() for validation
 * - **Error handling**: Catches and reports JSON parsing errors
 *
 * #### Supported JSON Types
 *
 * - Objects: `{"key": "value", "number": 123}`
 * - Arrays: `[1, 2, 3, "string"]`
 * - Strings: `"Hello World"`
 * - Numbers: `123`, `123.45`, `-123`
 * - Booleans: `true`, `false`
 * - null: `null`
 * - Nested structures: Objects and arrays can be nested
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class Config {
 *   @IsRequired()
 *   @IsJSON()
 *   settings: string;
 *
 *   @IsJSON() // Optional JSON field
 *   metadata?: string;
 * }
 *
 * // Valid JSON strings
 * const config1 = { settings: '{"name": "John", "age": 30}' }; // ✓ Valid object
 * const config2 = { settings: '[1, 2, 3]' }; // ✓ Valid array
 * const config3 = { settings: '"Hello World"' }; // ✓ Valid string
 * const config4 = { settings: '123' }; // ✓ Valid number
 * const config5 = { settings: 'true' }; // ✓ Valid boolean
 * const config6 = { settings: 'null' }; // ✓ Valid null
 *
 * // Invalid examples
 * const invalid1 = { settings: '{"name": "John", "age": }' }; // ✗ Invalid JSON (trailing comma)
 * const invalid2 = { settings: '{"name": "John", "age": 30' }; // ✗ Missing closing brace
 * const invalid3 = { settings: '[1, 2, 3' }; // ✗ Missing closing bracket
 * const invalid4 = { settings: '{"name": "John" "age": 30}' }; // ✗ Missing comma
 * const invalid5 = { settings: 'undefined' }; // ✗ undefined is not valid JSON
 * const invalid6 = { settings: '{name: "John"}' }; // ✗ Unquoted keys
 * const invalid7 = { settings: "" }; // ✗ Empty string
 * ```
 *
 * **Configuration storage:**
 * ```typescript
 * class AppConfig {
 *   @IsRequired()
 *   @IsJSON()
 *   @MaxLength(10000) // Reasonable JSON size limit
 *   configData: string;
 *
 *   @IsOptional()
 *   @IsJSON()
 *   userPreferences?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid JSON**: Returns localized error message from i18n system
 * - **Valid JSON**: Returns `true` (asynchronous validation)
 *
 * #### Performance Considerations
 *
 * - JSON validation uses native browser/Node.js JSON.parse() which is highly optimized
 * - Asynchronous validation allows for non-blocking validation of large JSON strings
 * - Suitable for configuration and data validation scenarios
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.json'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Configuration files:**
 * ```typescript
 * class Configuration {
 *   @IsRequired()
 *   @IsJSON()
 *   appConfig: string;
 * }
 * ```
 *
 * **API responses:**
 * ```typescript
 * class APIResponse {
 *   @IsRequired()
 *   @IsJSON()
 *   data: string;
 * }
 * ```
 *
 * **User preferences:**
 * ```typescript
 * class UserSettings {
 *   @IsJSON()
 *   preferences?: string;
 * }
 * ```
 *
 * #### Security Considerations
 *
 * - JSON validation helps prevent malformed data from being processed
 * - Does not execute JavaScript code (safe for untrusted input)
 * - Validates structure but does not validate content semantics
 *
 * @returns A property decorator that validates JSON format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Config {
 *   @IsJSON()
 *   settings: string;
 * }
 *
 * // With size constraints
 * class LimitedConfig {
 *   @IsJSON()
 *   @MaxLength(5000)
 *   settings: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsJSON = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['JSON']
>(function _JSON({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== 'string') {
      const message = i18n.t('validator.json', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return reject(message);
    }

    try {
      JSON.parse(value);
      resolve(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const message = i18n.t('validator.json', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}, 'JSON');

/**
 * ### IsBase64 Decorator
 *
 * Validates that a property value is a valid Base64 encoded string.
 * This decorator checks that the string conforms to Base64 encoding standards,
 * ensuring it can be properly decoded and contains only valid Base64 characters.
 *
 * #### Validation Logic
 *
 * - **Character validation**: Ensures only valid Base64 characters (A-Z, a-z, 0-9, +, /, =)
 * - **Length validation**: Checks that length is appropriate for Base64 encoding
 * - **Padding validation**: Validates proper padding with = characters
 * - **Format compliance**: Ensures the string follows Base64 encoding rules
 * - **Decodability**: Validates that the string can be properly decoded
 *
 * #### Base64 Format
 *
 * Base64 encoding represents binary data as ASCII text using 64 different characters.
 * Valid characters are: A-Z, a-z, 0-9, +, / with = used for padding.
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class ImageData {
 *   @IsRequired()
 *   @IsBase64()
 *   data: string;
 *
 *   @IsBase64() // Optional Base64 field
 *   thumbnail?: string;
 * }
 *
 * // Valid Base64 strings
 * const image1 = { data: "SGVsbG8gV29ybGQ=" }; // ✓ Valid ("Hello World")
 * const image2 = { data: "dGVzdA==" }; // ✓ Valid ("test")
 * const image3 = { data: "UGF5bG9hZA==" }; // ✓ Valid ("Payload")
 * const image4 = { data: "YWJjZGVmZ2hpams=" }; // ✓ Valid (longer string)
 *
 * // Invalid examples
 * const invalid1 = { data: "not-base64!" }; // ✗ Invalid characters
 * const invalid2 = { data: "SGVsbG8gV29ybGQ" }; // ✗ Missing padding
 * const invalid3 = { data: "SGVsbG8gV29ybGQ==" }; // ✗ Incorrect padding
 * const invalid4 = { data: "SGVsbG8gV29ybGQ===" }; // ✗ Too much padding
 * const invalid5 = { data: "" }; // ✗ Empty string
 * ```
 *
 * **File upload validation:**
 * ```typescript
 * class FileUpload {
 *   @IsRequired()
 *   @IsBase64()
 *   @MaxLength(1048576) // 1MB Base64 limit
 *   fileData: string;
 *
 *   @IsOptional()
 *   @IsBase64()
 *   previewData?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid Base64**: Returns localized error message from i18n system
 * - **Valid Base64**: Returns `true` (asynchronous validation)
 *
 * #### Performance Considerations
 *
 * - Base64 validation uses efficient regex pattern matching
 * - Asynchronous validation allows for non-blocking validation of large Base64 strings
 * - Regex is optimized for Base64 character and format validation
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.base64'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Image data:**
 * ```typescript
 * class Image {
 *   @IsRequired()
 *   @IsBase64()
 *   base64Data: string;
 * }
 * ```
 *
 * **File uploads:**
 * ```typescript
 * class Upload {
 *   @IsRequired()
 *   @IsBase64()
 *   fileContent: string;
 * }
 * ```
 *
 * **Binary data:**
 * ```typescript
 * class BinaryData {
 *   @IsBase64()
 *   encodedData?: string;
 * }
 * ```
 *
 * #### Standards Compliance
 *
 * - **RFC 4648**: Compliant with Base64 encoding standard
 * - **RFC 2045**: Compatible with MIME Base64 encoding
 * - **Padding**: Properly validates padding requirements
 * - **Alphabet**: Uses standard Base64 alphabet (A-Z, a-z, 0-9, +, /)
 *
 * @returns A property decorator that validates Base64 format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class ImageData {
 *   @IsBase64()
 *   data: string;
 * }
 *
 * // With size constraints
 * class LimitedImageData {
 *   @IsBase64()
 *   @MaxLength(100000)
 *   data: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsBase64 = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Base64']
>(function Base64({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  return new Promise((resolve, reject) => {
    if (typeof value !== 'string') {
      const message = i18n.t('validator.base64', {
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
      const message = i18n.t('validator.base64', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      reject(message);
    }
  });
}, 'Base64');

/**
 * ### IsHexColor Decorator
 *
 * Validates that a property value is a valid hexadecimal color code.
 * This decorator supports various hexadecimal color formats including
 * 3-digit, 4-digit, 6-digit, and 8-digit hex colors with optional alpha channels.
 *
 * #### Supported Formats
 *
 * - **3-digit**: `#RGB` (e.g., `#F00`, `#ABC`)
 * - **4-digit**: `#RGBA` (e.g., `#F00A`, `#ABCD`) - with alpha
 * - **6-digit**: `#RRGGBB` (e.g., `#FF0000`, `#3366CC`)
 * - **8-digit**: `#RRGGBBAA` (e.g., `#FF000080`, `#3366CCFF`) - with alpha
 *
 * #### Validation Logic
 *
 * - **Format validation**: Ensures proper # prefix and valid hex digits
 * - **Length validation**: Accepts only valid lengths (4, 5, 7, or 9 characters)
 * - **Character validation**: Ensures only valid hexadecimal characters (0-9, A-F, a-f)
 * - **Case insensitive**: Accepts both uppercase and lowercase hex digits
 * - **Alpha support**: Supports alpha channel in 4-digit and 8-digit formats
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class Theme {
 *   @IsRequired()
 *   @IsHexColor()
 *   primaryColor: string;
 *
 *   @IsHexColor() // Optional color field
 *   secondaryColor?: string;
 * }
 *
 * // Valid hex colors
 * const theme1 = { primaryColor: "#FF0000" }; // ✓ Valid (6-digit red)
 * const theme2 = { primaryColor: "#3366cc" }; // ✓ Valid (6-digit blue)
 * const theme3 = { primaryColor: "#abc" }; // ✓ Valid (3-digit)
 * const theme4 = { primaryColor: "#FF000080" }; // ✓ Valid (8-digit with alpha)
 * const theme5 = { primaryColor: "#F00A" }; // ✓ Valid (4-digit with alpha)
 * const theme6 = { primaryColor: "#ABCDEF" }; // ✓ Valid (uppercase)
 *
 * // Invalid examples
 * const invalid1 = { primaryColor: "#GGG" }; // ✗ Invalid characters
 * const invalid2 = { primaryColor: "#12" }; // ✗ Too short
 * const invalid3 = { primaryColor: "#12345" }; // ✗ Invalid length
 * const invalid4 = { primaryColor: "FF0000" }; // ✗ Missing #
 * const invalid5 = { primaryColor: "#FF0000FF0" }; // ✗ Too long
 * const invalid6 = { primaryColor: "" }; // ✗ Empty string
 * ```
 *
 * **CSS/styling validation:**
 * ```typescript
 * class Stylesheet {
 *   @IsRequired()
 *   @IsHexColor()
 *   @MaxLength(9) // Max hex color length
 *   backgroundColor: string;
 *
 *   @IsOptional()
 *   @IsHexColor()
 *   borderColor?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid hex colors**: Returns localized error message from i18n system
 * - **Valid hex colors**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - Hex color validation uses efficient regex pattern matching
 * - Synchronous validation for fast color validation in UI contexts
 * - Regex is optimized for hex color format validation
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.hexColor'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Theme configuration:**
 * ```typescript
 * class ThemeConfig {
 *   @IsRequired()
 *   @IsHexColor()
 *   primaryColor: string;
 * }
 * ```
 *
 * **CSS properties:**
 * ```typescript
 * class CSSProperties {
 *   @IsHexColor()
 *   color?: string;
 * }
 * ```
 *
 * **Design systems:**
 * ```typescript
 * class ColorPalette {
 *   @IsHexColor()
 *   brandColor?: string;
 * }
 * ```
 *
 * #### Standards Compliance
 *
 * - **CSS Color Module Level 4**: Supports modern CSS color formats
 * - **HTML5**: Compatible with HTML color input validation
 * - **Web standards**: Follows web color specification standards
 * - **Alpha channels**: Supports CSS rgba equivalent in hex format
 *
 * @returns A property decorator that validates hexadecimal color format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Theme {
 *   @IsHexColor()
 *   primaryColor: string;
 * }
 *
 * // With length constraints
 * class StrictTheme {
 *   @IsHexColor()
 *   @MaxLength(7) // 6-digit colors only
 *   primaryColor: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsHexColor = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['HexColor']
>(function _HexColor({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (typeof value !== 'string') {
    const message = i18n.t('validator.hexColor', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  // Supports #RGB, #RRGGBB, #RRGGBBAA formats
  const hexColorRegex =
    /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  if (hexColorRegex.test(value)) {
    return true;
  } else {
    const message = i18n.t('validator.hexColor', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'HexColor');

/**
 * ### IsCreditCard Decorator
 *
 * Validates that a property value is a valid credit card number using the Luhn algorithm.
 * This decorator checks the format and performs mathematical validation to ensure
 * the credit card number follows proper checksum rules used by major card networks.
 *
 * #### Validation Logic
 *
 * - **Format validation**: Removes spaces and dashes, checks for valid digits only
 * - **Length validation**: Ensures 13-19 digits (standard credit card length range)
 * - **Luhn algorithm**: Performs mathematical checksum validation
 * - **Character filtering**: Accepts spaces, dashes, and digits in input
 * - **Card type agnostic**: Works with all major credit card types (Visa, Mastercard, etc.)
 *
 * #### Luhn Algorithm
 *
 * The Luhn algorithm (mod 10) is a checksum formula used to validate credit card numbers:
 * 1. Double every second digit from right to left
 * 2. If doubling results in a two-digit number, add the digits
 * 3. Sum all the digits
 * 4. If the total modulo 10 is 0, the number is valid
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class Payment {
 *   @IsRequired()
 *   @IsCreditCard()
 *   cardNumber: string;
 *
 *   @IsCreditCard() // Optional card field
 *   backupCard?: string;
 * }
 *
 * // Valid credit card numbers
 * const payment1 = { cardNumber: "4532015112830366" }; // ✓ Valid Visa test number
 * const payment2 = { cardNumber: "4532-0151-1283-0366" }; // ✓ Valid with dashes
 * const payment3 = { cardNumber: "4532 0151 1283 0366" }; // ✓ Valid with spaces
 * const payment4 = { cardNumber: "5555555555554444" }; // ✓ Valid Mastercard test number
 * const payment5 = { cardNumber: "4111111111111111" }; // ✓ Valid Visa test number
 *
 * // Invalid examples
 * const invalid1 = { cardNumber: "4532015112830367" }; // ✗ Invalid checksum
 * const invalid2 = { cardNumber: "123" }; // ✗ Too short
 * const invalid3 = { cardNumber: "45320151128303664532015112830366" }; // ✗ Too long
 * const invalid4 = { cardNumber: "453201511283036a" }; // ✗ Contains letters
 * const invalid5 = { cardNumber: "" }; // ✗ Empty string
 * ```
 *
 * **Payment processing:**
 * ```typescript
 * class Transaction {
 *   @IsRequired()
 *   @IsCreditCard()
 *   @MaxLength(19) // Standard card number length
 *   cardNumber: string;
 *
 *   @IsOptional()
 *   @IsCreditCard()
 *   previousCard?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid card numbers**: Returns localized error message from i18n system
 * - **Valid card numbers**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - Credit card validation uses efficient mathematical operations
 * - Synchronous validation for fast payment processing validation
 * - Luhn algorithm is computationally lightweight
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.creditCard'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Payment forms:**
 * ```typescript
 * class PaymentForm {
 *   @IsRequired()
 *   @IsCreditCard()
 *   cardNumber: string;
 * }
 * ```
 *
 * **Billing information:**
 * ```typescript
 * class Billing {
 *   @IsCreditCard()
 *   cardNumber?: string;
 * }
 * ```
 *
 * **Subscription services:**
 * ```typescript
 * class Subscription {
 *   @IsRequired()
 *   @IsCreditCard()
 *   paymentMethod: string;
 * }
 * ```
 *
 * #### Security Considerations
 *
 * - **Client-side only**: This validation should be complemented with server-side validation
 * - **No card type detection**: Only validates mathematical correctness, not card type
 * - **Test cards**: Accepts test card numbers commonly used in development
 * - **Tokenization**: Consider using tokenized card numbers for enhanced security
 *
 * #### Standards Compliance
 *
 * - **ISO/IEC 7812**: Compatible with credit card numbering standards
 * - **Luhn algorithm**: Implements standard checksum validation
 * - **Major card networks**: Works with Visa, Mastercard, American Express, Discover, etc.
 *
 * @returns A property decorator that validates credit card number format and checksum
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class Payment {
 *   @IsCreditCard()
 *   cardNumber: string;
 * }
 *
 * // With additional constraints
 * class SecurePayment {
 *   @IsCreditCard()
 *   @MaxLength(19)
 *   cardNumber: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsCreditCard = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['CreditCard']
>(function CreditCard({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (typeof value !== 'string') {
    const message = i18n.t('validator.creditCard', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  // Remove spaces and dashes
  const cleanValue = value.replace(/[\s-]/g, '');

  // Check if it's all digits and length is between 13-19
  if (!/^\d{13,19}$/.test(cleanValue)) {
    const message = i18n.t('validator.creditCard', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
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
    return true;
  } else {
    const message = i18n.t('validator.creditCard', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'CreditCard');

/**
 * ### IsIP Decorator
 *
 * Validates that a property value is a valid IP (Internet Protocol) address.
 * This decorator supports both IPv4 and IPv6 address validation with configurable
 * version restrictions, ensuring proper network address format compliance.
 *
 * #### Validation Logic
 *
 * - **Version support**: Accepts IPv4, IPv6, or both (configurable)
 * - **IPv4 validation**: Validates dotted decimal format (0.0.0.0 to 255.255.255.255)
 * - **IPv6 validation**: Validates hexadecimal format with colon separation
 * - **Format compliance**: Ensures proper octet/hexadecimal group structure
 * - **Leading zeros**: Allows but validates proper range limits
 * - **Compressed notation**: Supports IPv6 compression (::) and leading zero compression
 *
 * #### IP Address Formats
 *
 * **IPv4**: `192.168.1.1`, `10.0.0.1`, `172.16.0.0`
 * **IPv6**: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`, `::1`, `::ffff:192.0.2.1`
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class NetworkConfig {
 *   @IsRequired()
 *   @IsIP() // Accepts both IPv4 and IPv6
 *   serverAddress: string;
 *
 *   @IsIP() // Optional IP field
 *   gatewayAddress?: string;
 * }
 *
 * // Valid IP addresses
 * const config1 = { serverAddress: "192.168.1.1" }; // ✓ Valid IPv4
 * const config2 = { serverAddress: "2001:0db8:85a3::8a2e:0370:7334" }; // ✓ Valid IPv6
 * const config3 = { serverAddress: "::1" }; // ✓ Valid IPv6 loopback
 * const config4 = { serverAddress: "10.0.0.1" }; // ✓ Valid IPv4
 * const config5 = { serverAddress: "::ffff:192.0.2.1" }; // ✓ Valid IPv4-mapped IPv6
 *
 * // Invalid examples
 * const invalid1 = { serverAddress: "256.1.1.1" }; // ✗ Invalid IPv4 (octet > 255)
 * const invalid2 = { serverAddress: "192.168.1" }; // ✗ Invalid IPv4 (missing octet)
 * const invalid3 = { serverAddress: "2001:0db8:85a3:0000:0000:8a2e:0370" }; // ✗ Invalid IPv6 (incomplete)
 * const invalid4 = { serverAddress: "not-an-ip" }; // ✗ Invalid format
 * const invalid5 = { serverAddress: "" }; // ✗ Empty string
 * ```
 *
 * **Version-specific validation:**
 * ```typescript
 * class StrictNetworkConfig {
 *   @IsRequired()
 *   @IsIP(['4']) // IPv4 only
 *   ipv4Address: string;
 *
 *   @IsRequired()
 *   @IsIP(['6']) // IPv6 only
 *   ipv6Address: string;
 *
 *   @IsIP() // Both versions allowed
 *   flexibleAddress?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid IP addresses**: Returns localized error message from i18n system
 * - **Valid IP addresses**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - IP validation uses efficient regular expressions optimized for each IP version
 * - Synchronous validation for fast network configuration validation
 * - Regex patterns are pre-compiled and cached for repeated use
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.ip'` and supports interpolation with field names, values, and IP version.
 *
 * #### Common Validation Scenarios
 *
 * **Network configuration:**
 * ```typescript
 * class NetworkSettings {
 *   @IsRequired()
 *   @IsIP(['4'])
 *   ipAddress: string;
 *
 *   @IsIP(['4'])
 *   subnetMask?: string;
 *
 *   @IsIP(['4'])
 *   gateway?: string;
 * }
 * ```
 *
 * **Server configuration:**
 * ```typescript
 * class ServerConfig {
 *   @IsRequired()
 *   @IsIP() // Accepts both IPv4 and IPv6
 *   bindAddress: string;
 *
 *   @IsIP()
 *   allowedHosts?: string[];
 * }
 * ```
 *
 * **DNS and networking:**
 * ```typescript
 * class DNSRecord {
 *   @IsRequired()
 *   @IsIP()
 *   address: string;
 *
 *   @IsIP(['6'])
 *   ipv6Address?: string;
 * }
 * ```
 *
 * #### Standards Compliance
 *
 * - **RFC 791**: IPv4 address format compliance
 * - **RFC 4291**: IPv6 address format compliance
 * - **RFC 5952**: IPv6 text representation recommendations
 * - **RFC 3986**: URI address literal format support
 *
 * #### Security Considerations
 *
 * - Validates address format but does not check for reserved/private addresses
 * - Does not perform reachability or routing validation
 * - Suitable for format validation in network configuration contexts
 * - Consider additional validation for security-critical applications
 *
 * @param ruleParams - Optional array specifying IP version(s) to validate
 * @param ruleParams[0] - IP version: "4" (IPv4 only), "6" (IPv6 only), or "4/6" (both, default)
 * @returns A property decorator that validates IP address format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage (accepts both IPv4 and IPv6)
 * class NetworkDevice {
 *   @IsIP()
 *   ipAddress: string;
 * }
 *
 * // IPv4 only
 * class IPv4Device {
 *   @IsIP(['4'])
 *   ipv4Address: string;
 * }
 *
 * // IPv6 only
 * class IPv6Device {
 *   @IsIP(['6'])
 *   ipv6Address: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsIP = Validator.buildRuleDecorator<ValidatorRuleParamTypes['IP']>(
  function IsIP({
    value,
    ruleParams,
    fieldName,
    translatedPropertyName,
    i18n,
    ...rest
  }: ValidatorValidateOptions<string[]>): ValidatorResult {
    if (typeof value !== 'string') {
      const message = i18n.t('validator.ip', {
        field: translatedPropertyName || fieldName,
        value,
        version: ruleParams?.[0] || '4/6',
        ...rest,
      });
      return message;
    }

    const version = ruleParams?.[0] || '4/6';
    let ipRegex: RegExp;

    switch (version) {
      case '4':
        ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        break;
      case '6':
        ipRegex =
          /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        break;
      default: // 4/6
        // eslint-disable-next-line no-case-declarations
        const ipv4Regex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // eslint-disable-next-line no-case-declarations
        const ipv6Regex =
          /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        ipRegex = new RegExp(`(?:${ipv4Regex.source})|(?:${ipv6Regex.source})`);
        break;
    }

    if (ipRegex.test(value)) {
      return true;
    } else {
      const message = i18n.t('validator.ip', {
        field: translatedPropertyName || fieldName,
        value,
        version,
        ...rest,
      });
      return message;
    }
  },
  'IP'
);

/**
 * ### IsMACAddress Decorator
 *
 * Validates that a property value is a valid Media Access Control (MAC) address.
 * This decorator supports multiple common MAC address formats used in networking,
 * ensuring proper hardware address format compliance for network device identification.
 *
 * #### Validation Logic
 *
 * - **Format support**: Accepts colon-separated, dash-separated, and compact hexadecimal formats
 * - **Character validation**: Ensures only valid hexadecimal characters (0-9, A-F, a-f)
 * - **Length validation**: Validates proper 48-bit (6-byte) MAC address length
 * - **Case insensitive**: Accepts both uppercase and lowercase hexadecimal digits
 * - **Separator validation**: Supports standard networking separators (: and -)
 *
 * #### MAC Address Formats
 *
 * - **Colon-separated**: `00:1B:44:11:3A:B7` (most common)
 * - **Dash-separated**: `00-1B-44-11-3A-B7` (Windows format)
 * - **Compact**: `001B44113AB7` (12 hexadecimal digits, no separators)
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class NetworkDevice {
 *   @IsRequired()
 *   @IsMACAddress()
 *   macAddress: string;
 *
 *   @IsMACAddress() // Optional MAC field
 *   backupMac?: string;
 * }
 *
 * // Valid MAC addresses
 * const device1 = { macAddress: "00:1B:44:11:3A:B7" }; // ✓ Valid (colon-separated)
 * const device2 = { macAddress: "00-1B-44-11-3A-B7" }; // ✓ Valid (dash-separated)
 * const device3 = { macAddress: "001B44113AB7" }; // ✓ Valid (compact)
 * const device4 = { macAddress: "a1:b2:c3:d4:e5:f6" }; // ✓ Valid (lowercase)
 * const device5 = { macAddress: "FF:FF:FF:FF:FF:FF" }; // ✓ Valid (broadcast)
 * const device6 = { macAddress: "00:00:00:00:00:00" }; // ✓ Valid (null address)
 *
 * // Invalid examples
 * const invalid1 = { macAddress: "00:1B:44:11:3A" }; // ✗ Invalid (too short)
 * const invalid2 = { macAddress: "00:1B:44:11:3A:B7:extra" }; // ✗ Invalid (too long)
 * const invalid3 = { macAddress: "GG:1B:44:11:3A:B7" }; // ✗ Invalid (non-hex character)
 * const invalid4 = { macAddress: "00:1B:44:11:3A:B" }; // ✗ Invalid (incomplete byte)
 * const invalid5 = { macAddress: "001B44113AB" }; // ✗ Invalid (too short)
 * const invalid6 = { macAddress: "" }; // ✗ Empty string
 * ```
 *
 * **Network device configuration:**
 * ```typescript
 * class RouterConfig {
 *   @IsRequired()
 *   @IsMACAddress()
 *   @MaxLength(17) // Standard MAC address length
 *   deviceMac: string;
 *
 *   @IsOptional()
 *   @IsMACAddress()
 *   gatewayMac?: string;
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid MAC addresses**: Returns localized error message from i18n system
 * - **Valid MAC addresses**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - MAC address validation uses efficient regular expressions
 * - Synchronous validation for fast network device validation
 * - Regex patterns are optimized for common MAC address formats
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * The default error key is `'validator.macAddress'` and supports interpolation with field names and values.
 *
 * #### Common Validation Scenarios
 *
 * **Network hardware:**
 * ```typescript
 * class NetworkInterface {
 *   @IsRequired()
 *   @IsMACAddress()
 *   physicalAddress: string;
 * }
 * ```
 *
 * **Device management:**
 * ```typescript
 * class Device {
 *   @IsRequired()
 *   @IsMACAddress()
 *   macAddress: string;
 *
 *   @IsMACAddress()
 *   bluetoothMac?: string;
 * }
 * ```
 *
 * **Access control:**
 * ```typescript
 * class AccessList {
 *   @IsMACAddress()
 *   allowedMacs?: string[];
 * }
 * ```
 *
 * #### Standards Compliance
 *
 * - **IEEE 802**: Compliant with IEEE 802 MAC address standards
 * - **EUI-48**: Supports Extended Unique Identifier (48-bit) format
 * - **RFC 2469**: Compatible with IPv6 interface identifiers
 * - **RFC 7042**: Supports various MAC address text representations
 *
 * #### Security Considerations
 *
 * - **Format validation only**: Validates address format but does not check for reserved addresses
 * - **No uniqueness validation**: Does not verify MAC address uniqueness in networks
 * - **Privacy considerations**: MAC addresses can be used for device tracking
 * - **Access control**: Consider additional validation for security-critical applications
 *
 * @returns A property decorator that validates MAC address format
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic usage
 * class NetworkDevice {
 *   @IsMACAddress()
 *   macAddress: string;
 * }
 *
 * // With additional constraints
 * class StrictNetworkDevice {
 *   @IsMACAddress()
 *   @MaxLength(17) // Enforce colon-separated format
 *   macAddress: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const IsMACAddress = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MACAddress']
>(function MACAddress({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (typeof value !== 'string') {
    const message = i18n.t('validator.macAddress', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  // Supports formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
  const macRegex =
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})$/;
  if (macRegex.test(value)) {
    return true;
  } else {
    const message = i18n.t('validator.macAddress', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'MACAddress');

/**
 * ### Matches Decorator
 *
 * Validates that a property value matches a specified regular expression pattern.
 * This decorator provides flexible pattern-based validation using JavaScript regular expressions,
 * allowing for complex string validation requirements beyond built-in format validators.
 *
 * #### Validation Logic
 *
 * - **Pattern matching**: Uses JavaScript RegExp for flexible pattern validation
 * - **Custom patterns**: Accepts any valid regular expression pattern
 * - **Case sensitivity**: Respects regex flags (case-insensitive with /i flag)
 * - **Error customization**: Supports custom error messages via i18n keys
 * - **Pattern validation**: Validates regex syntax before testing
 *
 * #### Pattern Format
 *
 * Patterns can be provided as:
 * - **String patterns**: `'^[a-z]+$'` (converted to RegExp)
 * - **RegExp objects**: `/^[a-z]+$/i` (direct RegExp usage)
 *
 * #### Usage Examples
 *
 * **Basic usage:**
 * ```typescript
 * class User {
 *   @IsRequired()
 *   @Matches(['^[a-zA-Z0-9_]+$', 'username.invalid'])
 *   username: string;
 *
 *   @Matches(['^\\+?[1-9]\\d{1,14}$']) // E.164 phone pattern
 *   phoneNumber?: string;
 * }
 *
 * // Valid matches
 * const user1 = { username: "john_doe123" }; // ✓ Valid (alphanumeric + underscore)
 * const user2 = { username: "testUser" }; // ✓ Valid (letters and numbers)
 * const user3 = { phoneNumber: "+1234567890" }; // ✓ Valid (E.164 format)
 * const user4 = { phoneNumber: "1234567890" }; // ✓ Valid (without country code)
 *
 * // Invalid examples
 * const invalid1 = { username: "user-name" }; // ✗ Invalid (contains hyphen)
 * const invalid2 = { username: "user@domain" }; // ✗ Invalid (contains @)
 * const invalid3 = { username: "" }; // ✗ Invalid (empty string)
 * const invalid4 = { phoneNumber: "abc123" }; // ✗ Invalid (non-numeric)
 * ```
 *
 * **Advanced patterns:**
 * ```typescript
 * class ValidationExamples {
 *   @Matches(['^[A-Z][a-z]+$', 'name.capitalized'])
 *   firstName: string; // Must start with capital letter
 *
 *   @Matches(['^\\d{5}(-\\d{4})?$', 'zipcode.invalid'])
 *   zipCode: string; // US ZIP code format
 *
 *   @Matches(['^(http|https)://[^\\s/$.?#].[^\\s]*$', 'url.invalid'])
 *   website?: string; // Basic URL pattern
 *
 *   @Matches(['^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', 'uuid.invalid'])
 *   customId?: string; // UUID pattern
 * }
 * ```
 *
 * #### Validation Behavior
 *
 * - **Empty/null values**: Returns validation error message (use `@IsOptional()` for optional fields)
 * - **Non-string values**: Returns validation error message
 * - **Invalid patterns**: Returns error for malformed regex patterns
 * - **No pattern provided**: Returns parameter validation error
 * - **Pattern mismatch**: Returns localized error message from i18n system
 * - **Valid matches**: Returns `true`
 *
 * #### Performance Considerations
 *
 * - Regex compilation happens on each validation (consider caching for high-frequency patterns)
 * - Synchronous validation for immediate pattern matching
 * - Complex regex patterns may impact performance with large input strings
 * - Simple patterns are highly optimized by JavaScript engines
 *
 * #### Internationalization Support
 *
 * Error messages are fully internationalized and can be customized through the validator's i18n system.
 * Supports both default error key `'validator.regex'` and custom error message keys.
 * The default error key supports interpolation with field names, values, and pattern information.
 *
 * #### Common Validation Scenarios
 *
 * **Username validation:**
 * ```typescript
 * class UserAccount {
 *   @IsRequired()
 *   @Matches(['^[a-zA-Z0-9_]{3,20}$', 'username.invalid'])
 *   username: string;
 * }
 * ```
 *
 * **Password complexity:**
 * ```typescript
 * class SecureAccount {
 *   @Matches(['(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', 'password.weak'])
 *   password?: string; // At least 1 lowercase, 1 uppercase, 1 digit, 1 special char, 8+ chars
 * }
 * ```
 *
 * **Custom formats:**
 * ```typescript
 * class Product {
 *   @Matches(['^[A-Z]{2}-\\d{4}$', 'productCode.invalid'])
 *   productCode: string; // Format: AB-1234
 *
 *   @Matches(['^v\\d+\\.\\d+\\.\\d+$', 'version.invalid'])
 *   version?: string; // Semantic versioning: v1.2.3
 * }
 * ```
 *
 * #### Security Considerations
 *
 * - **ReDoS vulnerability**: Complex regex patterns can be vulnerable to Regular Expression Denial of Service
 * - **Input validation**: Always validate input length before regex matching
 * - **Pattern complexity**: Avoid overly complex patterns that may cause performance issues
 * - **User input in patterns**: Never allow user-provided regex patterns in production code
 * - **Sanitization**: Ensure patterns don't contain malicious regex constructs
 *
 * #### Best Practices
 *
 * - **Pattern testing**: Thoroughly test regex patterns with various inputs
 * - **Anchors**: Use `^` and `$` anchors to match entire strings
 * - **Escaping**: Properly escape special regex characters in patterns
 * - **Alternatives**: Consider built-in validators for common patterns (email, URL, etc.)
 * - **Documentation**: Document complex patterns for maintainability
 * - **Performance**: Profile regex performance with expected input sizes
 *
 * @param ruleParams - Array containing regex pattern and optional error message
 * @param ruleParams[0] - Regular expression pattern as string or RegExp object (required)
 * @param ruleParams[1] - Optional custom error message key for i18n translation
 * @returns A property decorator that validates string patterns using regular expressions
 *
 * @throws {ValidationError} When validation fails, containing localized error message
 *
 * @example
 * ```typescript
 * // Basic pattern matching
 * class Validation {
 *   @Matches(['^[a-z]+$', 'lowercase.required'])
 *   lowercaseOnly: string;
 * }
 *
 * // With custom error message
 * class CustomValidation {
 *   @Matches(['^\\d{3}-\\d{2}-\\d{4}$', 'ssn.invalid'])
 *   socialSecurity: string;
 * }
 *
 * // Complex validation
 * class AdvancedValidation {
 *   @Matches(['(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', 'password.complexity'])
 *   strongPassword: string;
 * }
 * ```
 *
 * @decorator
 * @public
 */
export const Matches = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Matches']
>(function Matches({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (typeof value !== 'string') {
    const message = i18n.t('validator.regex', {
      field: translatedPropertyName || fieldName,
      value,
      pattern: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || !ruleParams[0]) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'Matches',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  const messageParams = defaultStr(ruleParams[1]).trim();
  const translatedMessage = defaultStr(
    messageParams ? i18n.getNestedTranslation(messageParams) : ''
  ).trim();
  const message =
    translatedMessage ??
    i18n.t('validator.regex', {
      field: translatedPropertyName || fieldName,
      value,
      pattern: ruleParams[0],
      ...rest,
    });
  try {
    const regex = new RegExp(ruleParams[0]);
    return regex.test(value) ? true : message;
    // eslint-disable-next-line no-empty, @typescript-eslint/no-unused-vars
  } catch (error) {}
  return message;
});

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Url Rule
     *
     * Validates that the field under validation is a properly formatted URL.
     * This rule checks for valid URL structure including protocol, domain, and optional path components.
     *
     * #### Configuration Options
     *
     * The rule accepts an optional configuration object to customize validation behavior:
     *
     * - `requireHost`: If true, only allows protocols that require a hostname (http, https, ftp, etc.).
     *   If false, allows all valid protocols including mailto, tel, data, etc. (default: true)
     * - `allowedProtocols`: List of allowed protocols. If provided, only URLs with these protocols are considered valid.
     *   Protocols should be specified without the trailing colon (e.g., 'http', not 'http:').
     *
     * @example
     * ```typescript
     * // Valid URLs
     * await Validator.validate({
     *   value: 'https://example.com',
     *   rules: ['Url']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'https://example.com/path?query=value#fragment',
     *   rules: ['Url']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'ftp://ftp.example.com/file.txt',
     *   rules: ['Url']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-a-url',
     *   rules: ['Url']
     * }); // ✗ Invalid (missing protocol)
     *
     * await Validator.validate({
     *   value: 'example.com',
     *   rules: ['Url']
     * }); // ✗ Invalid (missing protocol)
     *
     * await Validator.validate({
     *   value: 'mailto:user@example.com',
     *   rules: ['Url']
     * }); // ✗ Invalid (default requires host)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Url']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation with custom options
     * class Website {
     *   @IsUrl() // Default: requires host
     *   homepage: string;
     *
     *   @IsUrl({ requireHost: false }) // Allow mailto, tel, etc.
     *   contactUrl?: string;
     *
     *   @IsUrl({ allowedProtocols: ['https'] }) // Only HTTPS
     *   secureUrl: string;
     * }
     * ```
     *
     * @param options - Optional configuration object for URL validation
     * @param options.requireHost - Whether to require protocols that need a hostname (default: true)
     * @param options.allowedProtocols - Array of allowed protocols without colons
     * @returns Promise resolving to true if valid URL, rejecting with error message if invalid
     *
     * @public
     */
    Url: ValidatorRuleParams<[options?: IsUrlOptions]>;

    /**
     * ### FileName Rule
     *
     * Validates that the field under validation is a valid file name.
     * This rule checks for forbidden characters and reserved names that cannot be used as file names
     * across different operating systems (Windows, macOS, Linux).
     *
     * #### Validation Logic
     * - Forbids characters: \ / : * ? " < > |
     * - Cannot start with a dot (.)
     * - Cannot be reserved names: nul, prn, con, lpt[0-9], com[0-9]
     * - Case-insensitive checks for reserved names
     *
     * @example
     * ```typescript
     * // Valid file names
     * await Validator.validate({
     *   value: 'document.txt',
     *   rules: ['FileName']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'my-file_123.pdf',
     *   rules: ['FileName']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'file with spaces.jpg',
     *   rules: ['FileName']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'file:with:colons.txt',
     *   rules: ['FileName']
     * }); // ✗ Invalid (contains forbidden characters)
     *
     * await Validator.validate({
     *   value: 'con',
     *   rules: ['FileName']
     * }); // ✗ Invalid (reserved name)
     *
     * await Validator.validate({
     *   value: '.hidden',
     *   rules: ['FileName']
     * }); // ✗ Invalid (starts with dot)
     *
     * await Validator.validate({
     *   value: 'file<name>.txt',
     *   rules: ['FileName']
     * }); // ✗ Invalid (contains < >)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['FileName']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation
     * class FileUpload {
     *   @IsRequired()
     *   @IsFileName
     *   fileName: string;
     *
     *   @IsOptional()
     *   @IsFileName
     *   displayName?: string;
     * }
     * ```
     *
     * @returns Promise resolving to true if valid file name, rejecting with error message if invalid
     *
     * @public
     */
    FileName: ValidatorRuleParams<[]>;

    /**
     * ### PhoneNumber Rule
     *
     * Validates that the field under validation is a valid phone number.
     * This rule uses the InputFormatter's phone number validation which supports
     * international phone numbers with country code detection.
     *
     * #### Parameters
     * - `countryCode`: Optional country code to validate against a specific country's format
     *
     * @example
     * ```typescript
     * // Valid phone numbers
     * await Validator.validate({
     *   value: '+1234567890',
     *   rules: ['PhoneNumber']
     * }); // ✓ Valid (international format)
     *
     * await Validator.validate({
     *   value: '(555) 123-4567',
     *   rules: ['PhoneNumber']
     * }); // ✓ Valid (US format)
     *
     * await Validator.validate({
     *   value: '+44 20 7123 4567',
     *   rules: ['PhoneNumber']
     * }); // ✓ Valid (UK format)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-a-phone-number',
     *   rules: ['PhoneNumber']
     * }); // ✗ Invalid (invalid format)
     *
     * await Validator.validate({
     *   value: '123',
     *   rules: ['PhoneNumber']
     * }); // ✗ Invalid (too short)
     *
     * await Validator.validate({
     *   value: 1234567890,
     *   rules: ['PhoneNumber']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation
     * class Contact {
     *   @IsRequired()
     *   @IsPhoneNumber() // Auto-detect country
     *   phone: string;
     *
     *   @IsPhoneNumber({ countryCode: 'US' }) // US format only
     *   usPhone?: string;
     * }
     * ```
     *
     * @param options - Optional configuration object
     * @param options.countryCode - Country code to validate against specific country's format
     * @returns Promise resolving to true if valid phone number, rejecting with error message if invalid
     *
     * @public
     */
    PhoneNumber: ValidatorRuleParams<[countryCode?: CountryCode]>;

    /**
     * ### EmailOrPhoneNumber Rule
     *
     * Validates that the field under validation is either a valid email address or a valid phone number.
     * This rule provides flexible validation for contact information fields that can accept either format.
     *
     * #### Configuration Options
     *
     * The rule accepts an optional configuration object with separate options for email and phone validation:
     *
     * - `email`: Email validation options (same as IsEmail rule)
     * - `phoneNumber`: Phone number validation options with country code
     *
     * @example
     * ```typescript
     * // Valid examples (either email or phone)
     * await Validator.validate({
     *   value: 'user@example.com',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✓ Valid (email)
     *
     * await Validator.validate({
     *   value: '+1234567890',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✓ Valid (phone)
     *
     * await Validator.validate({
     *   value: '(555) 123-4567',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✓ Valid (phone)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-valid-contact',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✗ Invalid (neither valid email nor phone)
     *
     * await Validator.validate({
     *   value: '@example.com',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✗ Invalid (invalid email, not a phone)
     *
     * await Validator.validate({
     *   value: '123',
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✗ Invalid (too short for phone, not email)
     *
     * await Validator.validate({
     *   value: 1234567890,
     *   rules: ['EmailOrPhoneNumber']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation
     * class ContactForm {
     *   @IsRequired()
     *   @IsEmailOrPhoneNumber() // Either email or phone
     *   contact: string;
     *
     *   @IsEmailOrPhoneNumber({
     *     email: { maxTotalLength: 100 },
     *     phoneNumber: { countryCode: 'US' }
     *   })
     *   flexibleContact?: string;
     * }
     * ```
     *
     * @param options - Optional configuration object for email and phone validation
     * @param options.email - Email validation options (maxTotalLength, etc.)
     * @param options.phoneNumber - Phone validation options with country code
     * @returns Promise resolving to true if valid email or phone, rejecting with error message if invalid
     *
     * @public
     */
    EmailOrPhoneNumber: ValidatorRuleParams<
      [
        options?: {
          email?: IsEmailOptions;
          phoneNumber?: {
            countryCode?: CountryCode;
          };
        },
      ]
    >;

    /**
     * ### Email Rule
     *
     * Validates that the field under validation is a properly formatted email address according to RFC 5322 standards.
     * This decorator performs comprehensive email validation including local part validation, domain validation,
     * international domains (IDN), IP address domains, and configurable length constraints.
     *
     * #### Configuration Options
     *
     * The rule accepts an optional configuration object to customize validation constraints:
     *
     * - `maxTotalLength`: Maximum total email length (default: 320 characters, per RFC 5321)
     * - `maxLocalPartLength`: Maximum local part length (default: 64 characters, per RFC 5321)
     * - `maxDomainLength`: Maximum domain length (default: 255 characters, per RFC 1035)
     * - `maxDomainLabelLength`: Maximum individual domain label length (default: 63 characters, per RFC 1035)
     *
     * @example
     * ```typescript
     * // Valid emails
     * await Validator.validate({
     *   value: 'user@example.com',
     *   rules: ['Email']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'test.email+tag@subdomain.example.co.uk',
     *   rules: ['Email']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '"quoted.name"@example.com',
     *   rules: ['Email']
     * }); // ✓ Valid (quoted local part)
     *
     * await Validator.validate({
     *   value: 'user@[192.168.1.1]',
     *   rules: ['Email']
     * }); // ✓ Valid (IP domain)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'not-an-email',
     *   rules: ['Email']
     * }); // ✗ Invalid (missing @)
     *
     * await Validator.validate({
     *   value: '@example.com',
     *   rules: ['Email']
     * }); // ✗ Invalid (empty local part)
     *
     * await Validator.validate({
     *   value: 'user@',
     *   rules: ['Email']
     * }); // ✗ Invalid (empty domain)
     *
     * await Validator.validate({
     *   value: 'user..name@example.com',
     *   rules: ['Email']
     * }); // ✗ Invalid (consecutive dots)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Email']
     * }); // ✗ Invalid (not a string)
     *
     * // Class validation with custom options
     * class User {
     *   @IsRequired()
     *   @IsEmail() // Default settings
     *   email: string;
     *
     *   @IsEmail({
     *     maxTotalLength: 100,
     *     maxLocalPartLength: 32
     *   }) // Custom constraints
     *   backupEmail?: string;
     * }
     * ```
     *
     * @param options - Optional configuration object for email validation constraints
     * @param options.maxTotalLength - Maximum total email length in characters (default: 320)
     * @param options.maxLocalPartLength - Maximum local part length in characters (default: 64)
     * @param options.maxDomainLength - Maximum domain length in characters (default: 255)
     * @param options.maxDomainLabelLength - Maximum domain label length in characters (default: 63)
     * @returns Promise resolving to true if valid email, rejecting with error message if invalid
     *
     * @public
     */
    Email: ValidatorRuleParams<[options?: IsEmailOptions]>;

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
     *
     * @public
     */
    UUID: ValidatorRuleParams<[]>;

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
     *
     * @public
     */
    JSON: ValidatorRuleParams<[]>;

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
     *
     * @public
     */
    Base64: ValidatorRuleParams<[]>;

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
     *
     * @public
     */
    HexColor: ValidatorRuleParams<[]>;

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
     *
     * @public
     */
    CreditCard: ValidatorRuleParams<[]>;

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
     *
     * @public
     */
    IP: ValidatorRuleParams<string[]>;

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
     *
     * @public
     */
    MACAddress: ValidatorRuleParams<[]>;

    /**
     * ### Matches Rule
     *
     * Validates that the field under validation matches a regular expression pattern.
     * This rule provides flexible pattern-based validation using JavaScript regular expressions.
     *
     * #### Parameters
     * - `pattern`: Regular expression pattern to match against (required)
     * - `errorMessage`: Optional custom error message key for i18n translation
     *
     * #### Pattern Format
     * The pattern can be provided as a string that will be converted to a RegExp,
     * or as a RegExp object directly.
     *
     * @example
     * ```typescript
     * // Valid matches
     * await Validator.validate({
     *   value: 'abc123',
     *   rules: ['Matches[/^[a-z]+\\d+$/]']
     * }); // ✓ Valid (letters followed by numbers)
     *
     * await Validator.validate({
     *   value: 'test@example.com',
     *   rules: ['Matches[/^[\\w.-]+@[\\w.-]+\\.\\w+$/]']
     * }); // ✓ Valid (simple email pattern)
     *
     * await Validator.validate({
     *   value: 'Hello World',
     *   rules: ['Matches[/^Hello/]']
     * }); // ✓ Valid (starts with "Hello")
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: '123abc',
     *   rules: ['Matches[/^[a-z]+\\d+$/]']
     * }); // ✗ Invalid (numbers before letters)
     *
     * await Validator.validate({
     *   value: 'hello world',
     *   rules: ['Matches[/^Hello/]']
     * }); // ✗ Invalid (case sensitive)
     *
     * await Validator.validate({
     *   value: 123,
     *   rules: ['Matches[/^\\d+$/]']
     * }); // ✗ Invalid (not a string)
     *
     * await Validator.validate({
     *   value: 'test',
     *   rules: ['Matches[/^$/]']
     * }); // ✗ Invalid (empty pattern)
     *
     * // Class validation
     * class User {
     *   @IsRequired()
     *   @Matches(['^[a-zA-Z0-9_]+$', 'username.invalid'])
     *   username: string;
     *
     *   @Matches(['^\\+?[1-9]\\d{1,14}$']) // E.164 phone pattern
     *   phoneNumber?: string;
     * }
     * ```
     *
     * @param ruleParams - Array containing pattern and optional error message
     * @param ruleParams[0] - Regular expression pattern as string or RegExp object
     * @param ruleParams[1] - Optional custom error message key for i18n
     * @returns Promise resolving to true if pattern matches, rejecting with error message if invalid
     *
     * @public
     */
    Matches: ValidatorRuleParams<
      [pattern: string | RegExp, errorMessage?: string]
    >;
  }
}
