# Validator Feature - Complete User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Getting Started](#getting-started)
4. [Built-in Validation Rules](#built-in-validation-rules)
5. [Validation Methods](#validation-methods)
6. [Decorators](#decorators)
7. [Advanced Features](#advanced-features)
8. [Type Safety and Module Augmentation](#type-safety-and-module-augmentation)
9. [Examples](#examples)
10. [API Reference](#api-reference)

---

## Introduction

The `reslib/validator` is a comprehensive, type-safe validation system for TypeScript/JavaScript applications. It provides flexible validation capabilities through decorators, functions, and various rule formats, with full internationalization support.

### Key Features

- ✅ **Type-Safe Validation**: Full TypeScript support with generic types
- ✅ **Decorator Support**: Class property validation using decorators
- ✅ **Async Validation**: Support for asynchronous validation rules
- ✅ **Internationalization**: Built-in i18n support for error messages
- ✅ **Extensible**: Easy to register custom validation rules
- ✅ **Rule Composition**: Combine multiple validation rules (OneOf, AllOf, ArrayOf)
- ✅ **Nested Validation**: Validate complex nested object structures
- ✅ **Context Propagation**: Pass context data through validation hierarchy

---

## Core Concepts

### Validation Rules

A validation rule is a function that checks whether a value meets specific criteria. Rules can be specified in multiple formats:

1. **Function Rules**: Custom validation logic

   ```typescript
   ({ value }) => value > 0 || 'Must be positive';
   ```

2. **Named Rules**: Simple string references

   ```typescript
   ('Required', 'Email', 'Url');
   ```

3. **Object Rules**: Rules with parameters

   ```typescript
   { MinLength: [5] }, { MaxLength: [100] }
   ```

### Validation Results

Validation operations return discriminated union types for type-safe result handling:

```typescript
type ValidatorValidateResult<T> =
  | ValidatorValidateSuccess<T> // { success: true, value: T }
  | ValidatorValidateFailure; // { success: false, error: ValidationError }
```

### Validation Context

Context is an optional object passed through the validation pipeline, enabling context-aware validation:

```typescript
interface ValidationContext {
  userId?: number;
  userRole?: string;
  locale?: string;
}
```

---

## Getting Started

### Installation

```typescript
import { Validator, IsRequired, IsEmail, MinLength } from 'reslib/validator';
```

### Basic Usage

#### Single Value Validation

```typescript
// Validate a single value
const result = await Validator.validate({
  value: 'test@example.com',
  rules: ['Required', 'Email'],
});

if (result.success) {
  console.log('Valid email:', result.value);
} else {
  console.error('Validation error:', result.error.message);
}
```

#### Class-Based Validation with Decorators

```typescript
class User {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @MinLength(10)
  bio?: string;
}

// Validate an object against the class schema
const result = await Validator.validateTarget(User, {
  data: {
    email: 'user@example.com',
    username: 'john_doe',
    bio: 'Software developer',
  },
});

if (result.success) {
  console.log('Valid user data:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

---

## Built-in Validation Rules

### Presence Validation

#### Required

Validates that a value is present (not null, undefined, or empty string).

```typescript
// Decorator
class Model {
  @IsRequired()
  field: string;
}

// Validation
await Validator.validate({
  value: 'hello',
  rules: ['Required'],
}); // ✓ Valid

await Validator.validate({
  value: '',
  rules: ['Required'],
}); // ✗ Invalid - empty string
```

**Parameters**: None `[]`

**Rejects**: `null`, `undefined`, `""` (empty string)

**Accepts**: `0`, `false`, `NaN`, `[]`, `{}`, any non-empty string

---

#### Optional

Marks a field as optional - validation is skipped if value is undefined.

```typescript
class User {
  @IsRequired()
  email: string;

  @IsOptional()
  @IsUrl()
  website?: string; // Only validated if provided
}
```

**Parameters**: None `[]`

**Behavior**: Skips validation when value is `undefined`

---

#### Nullable

Allows null or undefined values - validation is skipped for these values.

```typescript
class Profile {
  @IsNullable()
  @IsString()
  bio?: string; // Can be null/undefined, validated if present
}
```

**Parameters**: None `[]`

**Behavior**: Skips validation when value is `null` or `undefined`

---

#### Empty

Allows empty strings - validation is skipped for empty strings.

```typescript
class Comment {
  @IsEmpty()
  @MaxLength(500)
  text: string; // Can be empty string, validated if not empty
}
```

**Parameters**: None `[]`

**Behavior**: Skips validation when value is `""` (empty string only)

---

### String Validation

#### MinLength

Validates minimum string length.

```typescript
class Password {
  @MinLength(8)
  password: string;
}

await Validator.validate({
  value: 'securepass',
  rules: [{ MinLength: [8] }],
}); // ✓ Valid
```

**Parameters**: `[minLength: number]`

---

#### MaxLength

Validates maximum string length.

```typescript
class Username {
  @MaxLength(20)
  username: string;
}

await Validator.validate({
  value: 'john',
  rules: [{ MaxLength: [20] }],
}); // ✓ Valid
```

**Parameters**: `[maxLength: number]`

---

#### Length

Validates exact length or length range.

```typescript
// Exact length
class PinCode {
  @Length(4)
  pin: string; // Must be exactly 4 characters
}

// Length range
class Username {
  @Length(3, 20)
  username: string; // Must be 3-20 characters
}

await Validator.validate({
  value: 'john',
  rules: [{ Length: [3, 20] }],
}); // ✓ Valid
```

**Parameters**: `[lengthOrMin: number, max?: number]`

**Modes**:

- Single parameter: Exact length
- Two parameters: Range (min, max)

---

#### IsString

Validates that value is a string type.

```typescript
class TextData {
  @IsString()
  content: string;
}

await Validator.validate({
  value: 'hello',
  rules: ['String'],
}); // ✓ Valid

await Validator.validate({
  value: 123,
  rules: ['String'],
}); // ✗ Invalid
```

**Parameters**: None `[]`

---

#### IsNonNullString / NonNullString

Validates that value is a non-empty, non-null string.

```typescript
class Article {
  @IsNonNullString()
  title: string; // Cannot be empty, null, or undefined
}

await Validator.validate({
  value: 'Article Title',
  rules: ['NonNullString'],
}); // ✓ Valid

await Validator.validate({
  value: '',
  rules: ['NonNullString'],
}); // ✗ Invalid
```

**Parameters**: None `[]`

---

#### StartsWithOneOf

Validates that string starts with one of the specified values.

```typescript
class FileUpload {
  @StartsWithOneOf(['image/', 'video/'])
  mimeType: string;
}

await Validator.validate({
  value: 'image/png',
  rules: [{ StartsWithOneOf: [['image/', 'video/']] }],
}); // ✓ Valid
```

**Parameters**: `[prefixes: string[]]`

---

#### EndsWithOneOf

Validates that string ends with one of the specified values.

```typescript
class FileName {
  @EndsWithOneOf(['.jpg', '.png', '.gif'])
  filename: string;
}

await Validator.validate({
  value: 'photo.jpg',
  rules: [{ EndsWithOneOf: [['.jpg', '.png', '.gif']] }],
}); // ✓ Valid
```

**Parameters**: `[suffixes: string[]]`

---

#### FileName

Validates that string is a valid filename.

```typescript
class Document {
  @IsFileName()
  filename: string;
}

await Validator.validate({
  value: 'document.pdf',
  rules: ['FileName'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

### Numeric Validation

#### IsNumber / Number

Validates that value is a number.

```typescript
class Product {
  @IsNumber()
  price: number;
}

await Validator.validate({
  value: 42,
  rules: ['Number'],
}); // ✓ Valid

await Validator.validate({
  value: '42',
  rules: ['Number'],
}); // x Invalid (numeric string)
```

**Parameters**: None `[]`

---

#### NumberGT / IsNumberGT

Validates that number is greater than specified value.

```typescript
class Age {
  @IsNumberGT(0)
  age: number; // Must be > 0
}

await Validator.validate({
  value: 25,
  rules: [{ NumberGT: [0] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberGTE / IsNumberGTE

Validates that number is greater than or equal to specified value.

```typescript
class Score {
  @IsNumberGTE(0)
  score: number; // Must be >= 0
}

await Validator.validate({
  value: 0,
  rules: [{ NumberGTE: [0] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberLT / IsNumberLT

Validates that number is less than specified value.

```typescript
class Percentage {
  @IsNumberLT(101)
  percentage: number; // Must be < 101
}

await Validator.validate({
  value: 95,
  rules: [{ NumberLT: [101] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberLTE / IsNumberLTE

Validates that number is less than or equal to specified value.

```typescript
class Rating {
  @IsNumberLTE(5)
  rating: number; // Must be <= 5
}

await Validator.validate({
  value: 4.5,
  rules: [{ NumberLTE: [5] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberEQ / IsNumberEQ

Validates that number equals specified value.

```typescript
class Constant {
  @IsNumberEQ(42)
  magicNumber: number;
}

await Validator.validate({
  value: 42,
  rules: [{ NumberEQ: [42] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberNE / IsNumberNE

Validates that number does not equal specified value.

```typescript
class NonZero {
  @IsNumberNE(0)
  value: number; // Cannot be 0
}

await Validator.validate({
  value: 10,
  rules: [{ NumberNE: [0] }],
}); // ✓ Valid
```

**Parameters**: `[compareValue: number]`

---

#### NumberBetween / IsNumberBetween

Validates that number is within specified range (inclusive).

```typescript
class Temperature {
  @IsNumberBetween(-20, 50)
  celsius: number;
}

await Validator.validate({
  value: 25,
  rules: [{ NumberBetween: [-20, 50] }],
}); // ✓ Valid
```

**Parameters**: `[min: number, max: number]`

---

#### Integer / IsInteger

Validates that value is an integer (whole number).

```typescript
class Counter {
  @IsInteger()
  count: number;
}

await Validator.validate({
  value: 42,
  rules: ['Integer'],
}); // ✓ Valid

await Validator.validate({
  value: 12.34,
  rules: ['Integer'],
}); // ✗ Invalid
```

**Parameters**: None `[]`

---

#### EvenNumber / IsEvenNumber

Validates that value is an even integer.

```typescript
class EvenCounter {
  @IsEvenNumber()
  count: number;
}

await Validator.validate({
  value: 4,
  rules: ['EvenNumber'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### OddNumber / IsOddNumber

Validates that value is an odd integer.

```typescript
class OddCounter {
  @IsOddNumber()
  count: number;
}

await Validator.validate({
  value: 5,
  rules: ['OddNumber'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### MultipleOf / IsMultipleOf

Validates that value is a multiple of specified number.

```typescript
class Pricing {
  @IsMultipleOf(0.01)
  price: number; // Must be in cent increments
}

await Validator.validate({
  value: 19.99,
  rules: [{ MultipleOf: [0.01] }],
}); // ✓ Valid
```

**Parameters**: `[multiple: number]`

---

### Format Validation

#### Email / IsEmail

Validates email address format according to RFC 5322 standards.

```typescript
class Contact {
  @IsEmail()
  email: string;
}

await Validator.validate({
  value: 'user@example.com',
  rules: ['Email'],
}); // ✓ Valid

await Validator.validate({
  value: 'invalid-email',
  rules: ['Email'],
}); // ✗ Invalid
```

**Parameters**: None `[]` (optional config object for custom constraints)

**Configuration Options**:

- `maxTotalLength`: Maximum total email length (default: 320)
- `maxLocalPartLength`: Maximum local part length (default: 64)
- `maxDomainLength`: Maximum domain length (default: 255)

---

#### Url / IsUrl

Validates URL format.

```typescript
class Website {
  @IsUrl()
  url: string;
}

await Validator.validate({
  value: 'https://example.com',
  rules: ['Url'],
}); // ✓ Valid
```

**Parameters**: None `[]` (optional config object)

**Configuration Options**:

- `requireHost`: If true, requires protocols with hostnames (default: true)
- `allowedProtocols`: Array of allowed protocols

---

#### PhoneNumber / IsPhoneNumber

Validates phone number format with optional country code.

```typescript
class Contact {
  @IsPhoneNumber()
  phone: string;
}

await Validator.validate({
  value: '+1234567890',
  rules: ['PhoneNumber'],
}); // ✓ Valid

// With country code
await Validator.validate({
  value: '1234567890',
  rules: [{ PhoneNumber: ['US'] }],
}); // ✓ Valid
```

**Parameters**: `[countryCode?: CountryCode]`

---

#### EmailOrPhoneNumber / IsEmailOrPhoneNumber

Validates that value is either a valid email or phone number.

```typescript
class Contact {
  @IsEmailOrPhoneNumber()
  contact: string; // Can be email or phone
}

await Validator.validate({
  value: 'user@example.com',
  rules: ['EmailOrPhoneNumber'],
}); // ✓ Valid

await Validator.validate({
  value: '+1234567890',
  rules: ['EmailOrPhoneNumber'],
}); // ✓ Valid
```

**Parameters**: `[countryCode?: CountryCode]`

---

#### Matches

Validates that string matches a regular expression pattern.

```typescript
class Code {
  @Matches(/^[A-Z]{3}-\d{3}$/)
  productCode: string; // Format: ABC-123
}

await Validator.validate({
  value: 'ABC-123',
  rules: [{ Matches: [/^[A-Z]{3}-\d{3}$/] }],
}); // ✓ Valid
```

**Parameters**: `[pattern: RegExp]`

---

### Boolean Validation

#### IsBoolean / Boolean

Validates that value is a boolean.

```typescript
class Settings {
  @IsBoolean()
  enabled: boolean;
}

await Validator.validate({
  value: true,
  rules: ['Boolean'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### IsTrue / True

Validates that value is exactly `true`.

```typescript
class Agreement {
  @IsTrue()
  termsAccepted: boolean;
}

await Validator.validate({
  value: true,
  rules: ['True'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### IsFalse / False

Validates that value is exactly `false`.

```typescript
class Settings {
  @IsFalse()
  disabled: boolean;
}

await Validator.validate({
  value: false,
  rules: ['False'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

### Array Validation

#### IsArray / Array

Validates that value is an array.

```typescript
class List {
  @IsArray()
  items: string[];
}

await Validator.validate({
  value: ['item1', 'item2'],
  rules: ['Array'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### ArrayMinLength

Validates minimum array length.

```typescript
class ShoppingCart {
  @ArrayMinLength(1)
  items: CartItem[]; // At least 1 item required
}

await Validator.validate({
  value: ['item1', 'item2'],
  rules: [{ ArrayMinLength: [1] }],
}); // ✓ Valid
```

**Parameters**: `[minLength: number]`

---

#### ArrayMaxLength

Validates maximum array length.

```typescript
class FileUpload {
  @ArrayMaxLength(5)
  files: File[]; // Maximum 5 files
}

await Validator.validate({
  value: [file1, file2],
  rules: [{ ArrayMaxLength: [5] }],
}); // ✓ Valid
```

**Parameters**: `[maxLength: number]`

---

#### ArrayLength

Validates exact array length or length range.

```typescript
// Exact length
class Coordinates {
  @ArrayLength(2)
  coords: [number, number]; // Must be exactly 2 elements
}

// Length range
class Team {
  @ArrayLength(2, 10)
  members: Member[]; // 2-10 members
}

await Validator.validate({
  value: [1, 2, 3],
  rules: [{ ArrayLength: [2, 5] }],
}); // ✓ Valid
```

**Parameters**: `[lengthOrMin: number, max?: number]`

---

#### ArrayUnique

Validates that array contains unique values (no duplicates).

```typescript
class Tags {
  @ArrayUnique()
  tags: string[]; // No duplicate tags
}

await Validator.validate({
  value: ['tag1', 'tag2', 'tag3'],
  rules: ['ArrayUnique'],
}); // ✓ Valid

await Validator.validate({
  value: ['tag1', 'tag2', 'tag1'],
  rules: ['ArrayUnique'],
}); // ✗ Invalid - duplicate 'tag1'
```

**Parameters**: None `[]`

---

#### ArrayContains

Validates that array contains at least one of the specified values.

```typescript
class Permissions {
  @ArrayContains(['read', 'write'])
  permissions: string[]; // Must have 'read' or 'write'
}

await Validator.validate({
  value: ['read', 'execute'],
  rules: [{ ArrayContains: [['read', 'write']] }],
}); // ✓ Valid
```

**Parameters**: `[requiredValues: any[]]`

---

#### ArrayAllStrings

Validates that all array elements are strings.

```typescript
class Tags {
  @ArrayAllStrings()
  tags: string[];
}

await Validator.validate({
  value: ['tag1', 'tag2', 'tag3'],
  rules: ['ArrayAllStrings'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### ArrayAllNumbers

Validates that all array elements are numbers.

```typescript
class Scores {
  @ArrayAllNumbers()
  scores: number[];
}

await Validator.validate({
  value: [10, 20, 30],
  rules: ['ArrayAllNumbers'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

### Date Validation

#### IsDate / Date

Validates that value is a valid date.

```typescript
class Event {
  @IsDate()
  eventDate: Date;
}

await Validator.validate({
  value: new Date(),
  rules: ['Date'],
}); // ✓ Valid
```

**Parameters**: None `[]`

---

#### DateAfter / IsDateAfter

Validates that date is after specified date.

```typescript
class Booking {
  @IsDateAfter(new Date())
  checkIn: Date; // Must be in the future
}

await Validator.validate({
  value: new Date('2025-12-31'),
  rules: [{ DateAfter: [new Date('2025-01-01')] }],
}); // ✓ Valid
```

**Parameters**: `[compareDate: Date]`

---

#### DateBefore / IsDateBefore

Validates that date is before specified date.

```typescript
class HistoricalEvent {
  @IsDateBefore(new Date())
  eventDate: Date; // Must be in the past
}

await Validator.validate({
  value: new Date('2020-01-01'),
  rules: [{ DateBefore: [new Date()] }],
}); // ✓ Valid
```

**Parameters**: `[compareDate: Date]`

---

#### DateBetween / IsDateBetween

Validates that date is between two dates.

```typescript
class Reservation {
  @IsDateBetween(new Date('2025-01-01'), new Date('2025-12-31'))
  date: Date;
}

await Validator.validate({
  value: new Date('2025-06-15'),
  rules: [{ DateBetween: [new Date('2025-01-01'), new Date('2025-12-31')] }],
}); // ✓ Valid
```

**Parameters**: `[minDate: Date, maxDate: Date]`

---

### Enum Validation

#### IsEnum / Enum

Validates that value is one of the allowed enum values.

```typescript
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

class User {
  @IsEnum(UserRole)
  role: UserRole;
}

await Validator.validate({
  value: 'admin',
  rules: [{ Enum: [[UserRole]] }],
}); // ✓ Valid
```

**Parameters**: `[enumObject: object]` or `[allowedValues: any[]]`

---

### File Validation

#### FileSize

Validates file size is within specified limits.

```typescript
class Upload {
  @FileSize(0, 5 * 1024 * 1024) // Max 5MB
  file: File;
}

await Validator.validate({
  value: file,
  rules: [{ FileSize: [0, 5242880] }],
}); // ✓ Valid
```

**Parameters**: `[minSize: number, maxSize: number]`

---

#### FileMimeType

Validates file MIME type.

```typescript
class ImageUpload {
  @FileMimeType(['image/jpeg', 'image/png'])
  image: File;
}

await Validator.validate({
  value: imageFile,
  rules: [{ FileMimeType: [['image/jpeg', 'image/png']] }],
}); // ✓ Valid
```

**Parameters**: `[allowedMimeTypes: string[]]`

---

### Multi-Rule Validators

#### OneOf

Validates that at least ONE of the sub-rules passes.

```typescript
class Contact {
  @OneOf('Email', 'PhoneNumber')
  contact: string; // Can be email OR phone
}

await Validator.validate({
  value: 'user@example.com',
  rules: ['OneOf', ['Email', 'PhoneNumber']],
}); // ✓ Valid (Email passes)

await Validator.validate({
  value: '+1234567890',
  rules: ['OneOf', ['Email', 'PhoneNumber']],
}); // ✓ Valid (PhoneNumber passes)
```

**Usage**: Accepts multiple rules as arguments, succeeds if any rule passes

---

#### AllOf

Validates that ALL of the sub-rules pass.

```typescript
class Password {
  @AllOf(
    'IsString',
    { MinLength: [8] },
    ({ value }) => /\d/.test(value) || 'Must contain number',
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase'
  )
  password: string;
}

await Validator.validate({
  value: 'SecurePass123',
  rules: ['AllOf', ['IsString', { MinLength: [8] } /* custom rules */]],
}); // ✓ Valid (all rules pass)
```

**Usage**: Accepts multiple rules as arguments, succeeds only if all rules pass

---

#### ArrayOf

Validates each element in an array against specified rules.

```typescript
class EmailList {
  @ArrayOf('Email')
  emails: string[]; // Each element must be valid email
}

await Validator.validate({
  value: ['user1@example.com', 'user2@example.com'],
  rules: ['ArrayOf', ['Email']],
}); // ✓ Valid

await Validator.validate({
  value: ['user1@example.com', 'invalid-email'],
  rules: ['ArrayOf', ['Email']],
}); // ✗ Invalid
```

**Usage**: First argument is the rule(s) to apply to each array element

---

### Nested Validation

#### ValidateNested

Validates nested objects using class schemas.

```typescript
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;

  @IsRequired()
  @Length(5)
  zipCode: string;
}

class User {
  @IsRequired()
  @IsEmail()
  email: string;

  @ValidateNested(Address)
  address: Address;
}

const result = await Validator.validateTarget(User, {
  data: {
    email: 'user@example.com',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      zipCode: '12345',
    },
  },
});
```

**Parameters**: `[targetClass: ClassConstructor]`

**Features**:

- Supports multi-level nesting
- Validates entire object hierarchies
- Context propagation through nested levels
- Parallel validation of nested properties

---

## Validation Methods

### Validator.validate()

Validates a single value against an array of rules.

```typescript
const result = await Validator.validate({
  value: 'test@example.com',
  rules: ['Required', 'Email'],
  fieldName: 'email',
  context: { userId: 123 },
});

if (result.success) {
  console.log('Valid value:', result.value);
  console.log('Validated at:', result.validatedAt);
  console.log('Duration:', result.duration, 'ms');
} else {
  console.error('Error:', result.error.message);
  console.error('Field:', result.error.fieldName);
}
```

**Options**:

- `value`: The value to validate
- `rules`: Array of validation rules
- `fieldName`: Optional field identifier
- `propertyName`: Optional property name
- `context`: Optional validation context
- `message`: Optional custom error message
- `i18n`: Optional i18n instance

**Returns**: `ValidatorValidateResult<T>`

- Success: `{ success: true, value: T, validatedAt, duration }`
- Failure: `{ success: false, error: ValidationError }`

---

### Validator.validateTarget()

Validates an entire object against a class schema with decorators.

```typescript
class UserForm {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

const result = await Validator.validateTarget(UserForm, {
  data: {
    email: 'user@example.com',
    username: 'john_doe',
    website: 'https://example.com',
  },
  context: { userId: 123 },
});

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  // Multiple field errors
  result.errors.forEach((error) => {
    console.error(`[${error.propertyName}]: ${error.message}`);
  });
}
```

**Options**:

- `data`: Object to validate
- `context`: Optional validation context
- `i18n`: Optional i18n instance

**Returns**: `ValidatorValidateTargetResult<T>`

- Success: `{ success: true, data: T, validatedAt, duration }`
- Failure: `{ success: false, errors: ValidationError[], failureCount }`

---

### Validator.registerRule()

Registers a custom validation rule.

```typescript
// Simple rule
Validator.registerRule('Positive', ({ value }) => {
  return value > 0 || 'Must be positive';
});

// Async rule
Validator.registerRule('UniqueEmail', async ({ value, context }) => {
  const exists = await database.user.findByEmail(value);
  return !exists || 'Email already taken';
});

// Rule with parameters
Validator.registerRule('DivisibleBy', ({ value, ruleParams }) => {
  const [divisor] = ruleParams;
  return value % divisor === 0 || `Must be divisible by ${divisor}`;
});

// Rule with context
Validator.registerRule('GreaterThanField', ({ value, ruleParams, context }) => {
  const [fieldName] = ruleParams;
  const otherValue = context?.data?.[fieldName];
  return value > otherValue || `Must be greater than ${fieldName}`;
});
```

**Parameters**:

- `ruleName`: Unique rule identifier
- `ruleHandler`: Validation function

**Rule Handler Options**:

- `value`: Value being validated
- `ruleParams`: Parameters passed to the rule
- `context`: Optional validation context
- `fieldName`: Field identifier
- `translatedPropertyName`: Localized field name
- `i18n`: Internationalization instance

**Returns**: `true` (valid) or `string` (error message)

---

### Validator.getRule()

Retrieves a registered validation rule function.

```typescript
const emailRule = Validator.getRule('Email');
if (emailRule) {
  const result = await emailRule({
    value: 'test@example.com',
    ruleParams: [],
  });
  console.log('Email validation result:', result);
}
```

---

### Validator.getRules()

Gets all registered validation rules.

```typescript
const allRules = Validator.getRules();
console.log('Available rules:', Object.keys(allRules));
console.log('Total rules:', Object.keys(allRules).length);
```

---

### Validator.hasRule()

Checks if a rule exists (type guard).

```typescript
function applyRuleIfExists(value: any, ruleName: string) {
  if (Validator.hasRule(ruleName)) {
    // TypeScript knows ruleName is ValidatorRuleName
    const rule = Validator.getRule(ruleName);
    return rule?.({ value, ruleParams: [] });
  }
  return 'Rule not found';
}
```

---

## Decorators

### Rule Decorators

All built-in rules have corresponding decorators that can be applied to class properties:

```typescript
class UserModel {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsNumber()
  @NumberGTE(0)
  @NumberLTE(120)
  age?: number;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsArray()
  @ArrayMinLength(1)
  @ArrayMaxLength(10)
  @ArrayOf('Email')
  emails: string[];
}
```

### Decorator Factory - buildRuleDecorator

Create custom rule decorators:

```typescript
// Create custom decorator
export const IsPositive = Validator.buildRuleDecorator<[]>(function Positive({
  value,
  i18n,
}) {
  return value > 0 || i18n.t('validator.positive');
}, 'Positive');

// Use the decorator
class Product {
  @IsPositive()
  price: number;
}
```

---

## Advanced Features

### Context-Aware Validation

Pass context data through the validation pipeline:

```typescript
interface ValidationContext {
  userId: number;
  userRole: 'admin' | 'user';
  permissions: string[];
}

class Document {
  @IsRequired()
  title: string;

  // Conditional validation based on context
  @OneOf([
    'IsString',
    ({ value, context }) => {
      const ctx = context as ValidationContext;
      if (ctx?.userRole === 'admin') {
        return true; // Admins can set any value
      }
      return /^PUBLIC-/.test(value) || 'Must start with PUBLIC-';
    },
  ])
  accessCode: string;
}

const result = await Validator.validateTarget(Document, {
  data: { title: 'Doc', accessCode: 'PRIVATE-123' },
  context: { userId: 1, userRole: 'admin', permissions: ['read', 'write'] },
});
```

---

### Asynchronous Validation

Support for async validation rules:

```typescript
// Async rule registration
Validator.registerRule('UniqueUsername', async ({ value, context }) => {
  const exists = await database.user.findByUsername(value);
  return !exists || 'Username already taken';
});

// Async custom rule
const asyncRule = async ({ value }) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return value.length > 5 || 'Too short';
};

// Use in validation
const result = await Validator.validate({
  value: 'john_doe',
  rules: ['UniqueUsername' as any, asyncRule],
});
```

---

### Custom Error Messages

Override default error messages:

```typescript
// Per-field custom message
class User {
  @IsRequired({ message: 'Email is mandatory' })
  @IsEmail({ message: 'Please provide a valid email address' })
  email: string;
}

// In validate() call
const result = await Validator.validate({
  value: '',
  rules: ['Required'],
  message: 'This field cannot be empty',
});

// Custom error message builder
const result = await Validator.validate({
  value: 'test',
  rules: ['Email'],
  errorMessageBuilder: (error, options) => {
    return `❌ ${options.fieldName}: ${error}`;
  },
});
```

---

### Internationalization

The validator has full i18n support:

```typescript
import { i18n } from 'reslib/i18n';

// Set locale
await i18n.setLocale('fr'); // French
await i18n.setLocale('es'); // Spanish
await i18n.setLocale('en'); // English

// Custom i18n instance
const customI18n = new I18n({
  validator: {
    required: 'Le champ {field} est requis',
    email: '{field} doit être une adresse email valide',
    minLength: '{field} doit contenir au moins {minLength} caractères',
  },
});

// Use custom i18n
const result = await Validator.validate({
  value: '',
  rules: ['Required'],
  fieldName: 'email',
  i18n: customI18n,
});
```

---

### Performance Optimization

```typescript
// Parallel validation of independent fields
const result = await Validator.validateTarget(LargeForm, {
  data: formData,
  // All fields validated in parallel automatically
});

// Early exit on first error (for performance)
const rules = ['Required', 'Email', 'MinLength'];
// Validation stops at first failed rule

// Reuse parsed rules for multiple validations
const { sanitizedRules } = Validator.parseAndValidateRules(rules);
// Use sanitizedRules multiple times without re-parsing
```

---

## Type Safety and Module Augmentation

### Extending ValidatorRuleParamTypes

To add custom rules with full type safety, augment the `ValidatorRuleParamTypes` interface:

````typescript
// custom-validators.ts
import { ValidatorRuleParams } from 'reslib/validator';
import { Validator } from 'reslib/validator';

// 1. Implement the validation function
export const IsPositive = Validator.buildRuleDecorator<[]>(function Positive({
  value,
  i18n,
}) {
  const numValue = Number(value);
  return (!isNaN(numValue) && numValue > 0) || 'Value must be positive';
}, 'Positive');

export const IsDivisibleBy = Validator.buildRuleDecorator<[number]>(
  function DivisibleBy({ value, ruleParams, i18n }) {
    const [divisor] = ruleParams;
    const numValue = Number(value);
    return (
      (!isNaN(numValue) && numValue % divisor === 0) ||
      `Value must be divisible by ${divisor}`
    );
  },
  'DivisibleBy'
);

// 2. Augment the ValidatorRuleParamTypes interface
declare module 'reslib/validator' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Positive Rule
     *
     * Validates that a number is positive (greater than 0).
     *
     * @example
     * ```typescript
     * class Product {
     *   @IsPositive()
     *   price: number;
     * }
     *
     * await Validator.validate({
     *   value: 10,
     *   rules: ['Positive']
     * }); // ✓ Valid
     * ```
     */
    Positive: ValidatorRuleParams<[]>;

    /**
     * ### DivisibleBy Rule
     *
     * Validates that a number is divisible by specified value.
     *
     * @example
     * ```typescript
     * class TimeSlot {
     *   @IsDivisibleBy(15)
     *   minutes: number; // Must be in 15-minute increments
     * }
     *
     * await Validator.validate({
     *   value: 30,
     *   rules: [{ DivisibleBy: [15] }]
     * }); // ✓ Valid
     * ```
     */
    DivisibleBy: ValidatorRuleParams<[divisor: number]>;
  }
}
````

**Benefits**:

- Full TypeScript autocomplete for custom rules
- Type-safe parameter validation
- Integration with existing rule system
- Compile-time error checking

---

### Using Module Augmentation

Once augmented, your custom rules work like built-in rules:

```typescript
// Type-safe usage
class Product {
  @IsPositive()
  price: number;

  @IsDivisibleBy(5)
  discountPercent: number;
}

// In validate() with full type safety
const result = await Validator.validate({
  value: 15,
  rules: ['Positive', { DivisibleBy: [5] }],
  // TypeScript knows these are valid rules
});

// Invalid usage caught at compile time
const invalid = await Validator.validate({
  value: 15,
  rules: [{ DivisibleBy: ['invalid'] }], // ✗ TypeScript error
});
```

---

## Examples

### Example 1: User Registration Form

```typescript
import {
  Validator,
  IsRequired,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'reslib/validator';

class UserRegistration {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
  password: string;

  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username: string;

  @IsOptional()
  @MinLength(10)
  @MaxLength(500)
  bio?: string;
}

// Validate registration data
async function registerUser(data: any) {
  const result = await Validator.validateTarget(UserRegistration, {
    data,
    context: { formType: 'registration' },
  });

  if (result.success) {
    // Proceed with registration
    await database.user.create(result.data);
    return { success: true, user: result.data };
  } else {
    // Return validation errors
    const errors = result.errors.map((err) => ({
      field: err.propertyName,
      message: err.message,
    }));
    return { success: false, errors };
  }
}
```

---

### Example 2: Nested Object Validation

```typescript
class Address {
  @IsRequired()
  @MinLength(5)
  street: string;

  @IsRequired()
  @MinLength(2)
  city: string;

  @IsRequired()
  @Length(5)
  @Matches(/^\d{5}$/)
  zipCode: string;

  @IsRequired()
  @Length(2)
  country: string;
}

class ContactInfo {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ValidateNested(Address)
  address: Address;
}

class User {
  @IsRequired()
  @MinLength(2)
  firstName: string;

  @IsRequired()
  @MinLength(2)
  lastName: string;

  @ValidateNested(ContactInfo)
  contact: ContactInfo;
}

// Validate nested structure
const result = await Validator.validateTarget(User, {
  data: {
    firstName: 'John',
    lastName: 'Doe',
    contact: {
      email: 'john@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        zipCode: '12345',
        country: 'US',
      },
    },
  },
});
```

---

### Example 3: Dynamic Rules with Context

```typescript
interface OrderContext {
  userType: 'guest' | 'member' | 'premium';
  orderCount: number;
  accountBalance: number;
}

class Order {
  @IsRequired()
  @IsNumber()
  @NumberGT(0)
  amount: number;

  @OneOf(
    ({ value, context }) => {
      const ctx = context as OrderContext;
      // Guest users: limited to $100
      if (ctx?.userType === 'guest') {
        return value <= 100 || 'Guest orders limited to $100';
      }
      // Members: limited to $500
      if (ctx?.userType === 'member') {
        return value <= 500 || 'Member orders limited to $500';
      }
      // Premium: no limit
      return true;
    },
    ({ value, context }) => {
      const ctx = context as OrderContext;
      // Check account balance
      return value <= ctx?.accountBalance || 'Insufficient balance';
    }
  )
  paymentAmount: number;

  @IsRequired()
  @IsArray()
  @ArrayMinLength(1)
  @ArrayOf({ MinLength: [3] })
  items: string[];
}

// Validate with context
const result = await Validator.validateTarget(Order, {
  data: {
    amount: 150,
    paymentAmount: 150,
    items: ['item1', 'item2'],
  },
  context: {
    userType: 'premium',
    orderCount: 5,
    accountBalance: 1000,
  },
});
```

---

### Example 4: Custom Async Validation

```typescript
// Register async validation rules
Validator.registerRule('UniqueEmail', async ({ value }) => {
  const exists = await database.user.findOne({ email: value });
  return !exists || 'Email already registered';
});

Validator.registerRule('ValidPromoCode', async ({ value, context }) => {
  const promo = await database.promoCode.findOne({ code: value });
  if (!promo) return 'Invalid promo code';
  if (promo.expired) return 'Promo code has expired';
  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    return 'Promo code usage limit reached';
  }
  return true;
});

class Checkout {
  @IsRequired()
  @IsEmail()
  email: string; // Will use UniqueEmail for registration

  @IsOptional()
  promoCode?: string; // Will use ValidPromoCode if provided
}

// Validate with async rules
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email', 'UniqueEmail' as any],
});
```

---

### Example 5: Array Element Validation

```typescript
class Product {
  @IsRequired()
  @IsNonNullString()
  name: string;

  @IsRequired()
  @IsNumber()
  @NumberGT(0)
  price: number;
}

class ShoppingCart {
  @IsRequired()
  @IsArray()
  @ArrayMinLength(1)
  @ArrayMaxLength(20)
  @ArrayOf(ValidateNested(Product))
  items: Product[];

  @IsRequired()
  @IsArray()
  @ArrayUnique()
  @ArrayOf('Email')
  notificationEmails: string[];

  @IsOptional()
  @IsArray()
  @ArrayAllStrings()
  @ArrayOf({ StartsWithOneOf: [['#']] })
  tags?: string[]; // Each tag must start with '#'
}

// Validate cart
const result = await Validator.validateTarget(ShoppingCart, {
  data: {
    items: [
      { name: 'Product 1', price: 19.99 },
      { name: 'Product 2', price: 29.99 },
    ],
    notificationEmails: ['user1@example.com', 'user2@example.com'],
    tags: ['#electronics', '#sale'],
  },
});
```

---

### Example 6: Conditional Validation with OneOf/AllOf

```typescript
class PaymentForm {
  @IsRequired()
  @OneOf('Email', 'PhoneNumber')
  contact: string; // Must be email OR phone

  @IsRequired()
  @AllOf(
    'IsString',
    { MinLength: [16] },
    { MaxLength: [19] },
    ({ value }) => /^\d+$/.test(value) || 'Must contain only digits',
    ({ value }) => {
      // Luhn algorithm for credit card validation
      const digits = value.split('').map(Number);
      const checksum = digits.reduceRight((sum, digit, idx) => {
        if (idx % 2 === 0) digit *= 2;
        if (digit > 9) digit -= 9;
        return sum + digit;
      }, 0);
      return checksum % 10 === 0 || 'Invalid card number';
    }
  )
  cardNumber: string; // Must satisfy ALL conditions

  @IsRequired()
  @OneOf(
    { Matches: [/^(0[1-9]|1[0-2])\/\d{2}$/] }, // MM/YY format
    { Matches: [/^\d{4}-(0[1-9]|1[0-2])$/] } // YYYY-MM format
  )
  expiry: string; // Either format is valid
}
```

---

## API Reference

### Core Types

#### ValidatorRule<TParams, Context>

Union type representing all possible rule formats.

#### ValidatorRules `<Context>`

Array of validation rules.

#### ValidatorResult

Union of `ValidatorSyncResult | ValidatorAsyncResult`.

#### ValidatorValidateResult `<T>`

Discriminated union: `ValidatorValidateSuccess<T> | ValidatorValidateFailure`.

#### ValidatorValidateTargetResult `<Context>`

Discriminated union: `ValidatorValidateTargetSuccess<Context> | ValidatorValidateTargetFailure<Context>`.

#### ValidatorRuleName

Union of all registered rule names (string literals).

#### ValidatorRuleParamTypes `<Context>`

Interface mapping rule names to their parameter types.

#### ValidatorRuleFunction<TParams, Context>

Function signature for validation rules.

---

### Main Methods

| Method                              | Description                          |
| ----------------------------------- | ------------------------------------ |
| `Validator.validate()`              | Validate single value                |
| `Validator.validateTarget()`        | Validate object against class schema |
| `Validator.registerRule()`          | Register custom validation rule      |
| `Validator.getRule()`               | Get registered rule function         |
| `Validator.getRules()`              | Get all registered rules             |
| `Validator.hasRule()`               | Check if rule exists (type guard)    |
| `Validator.parseAndValidateRules()` | Parse and normalize rules            |
| `Validator.buildRuleDecorator()`    | Create custom rule decorator         |

---

### Decorator Factories

| Factory                      | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `buildRuleDecorator()`       | Create simple rule decorator                  |
| `buildMultiRuleDecorator()`  | Create multi-rule decorator (OneOf, AllOf)    |
| `buildTargetRuleDecorator()` | Create target rule decorator (ValidateNested) |

---

## Best Practices

### 1. Use Type-Safe Rules

```typescript
// ✅ Good - Type-safe object notation
const rules = [{ MinLength: [5] }, { MaxLength: [100] }];

// ✅ Good - Named rules for simple cases
const rules = ['Required', 'Email'];

// ⚠️ Avoid - Less type-safe
const rules = ['MinLength'];
```

---

### 2. Leverage Context for Dynamic Validation

```typescript
// ✅ Good - Context-aware validation
class SecureData {
  @OneOf('IsString', ({ value, context }) => {
    if (context?.userRole === 'admin') return true;
    return value !== 'admin' || 'Admin only';
  })
  accessLevel: string;
}
```

---

### 3. Use Descriptive Field Names

```typescript
// ✅ Good - Clear field names for error messages
await Validator.validate({
  value: email,
  rules: ['Email'],
  fieldName: 'email',
  propertyName: 'email',
  translatedPropertyName: 'Email Address',
});
```

---

### 4. Handle Async Validation Properly

```typescript
// ✅ Good - Await all async validations
const result = await Validator.validate({
  value: username,
  rules: ['Required', 'UniqueUsername' as any]
});

// ❌ Bad - Missing await
const result = Validator.validate({ ... }); // Returns Promise!
```

---

### 5. Combine Rules Effectively

```typescript
// ✅ Good - Logical rule combinations
class Password {
  @IsRequired()
  @AllOf(
    'IsString',
    { MinLength: [8] },
    ({ value }) => /[A-Z]/.test(value) || 'Need uppercase',
    ({ value }) => /\d/.test(value) || 'Need number'
  )
  password: string;
}

// ✅ Good - Alternative formats
class Contact {
  @IsRequired()
  @OneOf('Email', 'PhoneNumber')
  contact: string;
}
```

---

### 6. Leverage Module Augmentation

```typescript
// ✅ Good - Extend with full type safety
declare module 'reslib/validator' {
  export interface ValidatorRuleParamTypes {
    CustomRule: ValidatorRuleParams<[param: string]>;
  }
}
```

---

### 7. Use Nested Validation for Complex Objects

```typescript
// ✅ Good - Nested validation
class Order {
  @ValidateNested(Customer)
  customer: Customer;

  @ValidateNested(Address)
  shippingAddress: Address;

  @ArrayOf(ValidateNested(OrderItem))
  items: OrderItem[];
}
```

---

## Troubleshooting

### Common Issues

#### 1. Rule Not Found Error

```typescript
// ❌ Error: Rule 'CustomRule' not found
await Validator.validate({
  value: test,
  rules: ['CustomRule' as any],
});

// ✅ Solution: Register the rule first
Validator.registerRule('CustomRule', ({ value }) => {
  return /* validation logic */;
});
```

---

#### 2. Type Errors with Custom Rules

```typescript
// ❌ TypeScript error: Rule not in ValidatorRuleParamTypes
const rules = [{ CustomRule: ['param'] }];

// ✅ Solution: Augment ValidatorRuleParamTypes
declare module 'reslib/validator' {
  export interface ValidatorRuleParamTypes {
    CustomRule: ValidatorRuleParams<[string]>;
  }
}
```

---

#### 3. Async Validation Not Working

```typescript
// ❌ Missing await
const result = Validator.validate({
  value: test,
  rules: [asyncRule],
}); // result is Promise, not result!

// ✅ Always await
const result = await Validator.validate({
  value: test,
  rules: [asyncRule],
});
```

---

#### 4. Context Not Available in Rules

```typescript
// ❌ Context not passed
await Validator.validate({
  value: test,
  rules: [contextAwareRule],
  // Missing: context: { ... }
});

// ✅ Pass context
await Validator.validate({
  value: test,
  rules: [contextAwareRule],
  context: { userId: 123 },
});
```

---

## Conclusion

The `reslib/validator` provides a powerful, flexible, and type-safe validation system with:

- ✅ 60+ built-in validation rules
- ✅ Full TypeScript support with type safety
- ✅ Decorator-based class validation
- ✅ Nested object validation
- ✅ Async validation support
- ✅ Context-aware validation
- ✅ Internationalization
- ✅ Extensible with custom rules
- ✅ Multiple rule specification formats
- ✅ Module augmentation for type safety

For questions or issues, please refer to the source code or open an issue in the repository.

---

**Last Updated**: December 3, 2025

**Version**: 2.1.0
