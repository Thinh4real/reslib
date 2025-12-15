# Validation Rules Reference

**Complete reference for all 67 validation rules in reslib/validator**

🔙 **[Back to README](../README.md)** | 📖 **[User Guide](./GUIDE.md)** | 🔧 **[API Reference](./API_REFERENCE.md)**

---

## Table of Contents

- [Default Rules](#default-rules) (4 rules)
- [String Rules](#string-rules) (7 rules)
- [Numeric Rules](#numeric-rules) (13 rules)
- [Boolean Rules](#boolean-rules) (1 rule)
- [Date Rules](#date-rules) (7 rules)
- [Array Rules](#array-rules) (8 rules)
- [File Rules](#file-rules) (6 rules)
- [Format Rules](#format-rules) (15 rules)
- [Enum Rules](#enum-rules) (1 rule)
- [Object Rules](#object-rules) (1 rule)
- [Multi Rules](#multi-rules) (3 rules)
- [Target Rules](#target-rules) (1 rule)

---

## Quick Reference

### Most Common Rules

| Rule          | Decorator          | Usage Example           |
| ------------- | ------------------ | ----------------------- |
| `Required`    | `@IsRequired()`    | Field must have a value |
| `Email`       | `@IsEmail()`       | Valid email address     |
| `PhoneNumber` | `@IsPhoneNumber()` | Valid phone number      |
| `MinLength`   | `@MinLength(n)`    | String minimum length   |
| `MaxLength`   | `@MaxLength(n)`    | String maximum length   |
| `Number`      | `@IsNumber()`      | Value is a number       |
| `NumberGTE`   | `@IsNumberGTE(n)`  | Number >= n             |
| `NumberLTE`   | `@IsNumberLTE(n)`  | Number <= n             |
| `Array`       | `@IsArray()`       | Value is an array       |
| `IsFile`      | `@IsFile()`        | Value is a file         |
| `UUID`        | `@IsUUID()`        | Valid UUID              |
| `Url`         | `@IsUrl()`         | Valid URL               |

---

## Default Rules (4 rules)

**Purpose:** Core validation rules for required/optional fields

| Rule       | Parameters | Description                                                    |
| ---------- | ---------- | -------------------------------------------------------------- |
| `Required` | `[]`       | Field must have a value (not null, undefined, or empty string) |
| `Empty`    | `[]`       | Skip validation if empty string                                |
| `Nullable` | `[]`       | Skip validation if null or undefined                           |
| `Optional` | `[]`       | Skip validation if undefined                                   |

**Example:**

```typescript
class User {
  @IsRequired()
  name: string; // Must be provided

  @IsOptional()
  nickname?: string; // Can be omitted
}
```

📖 **[Detailed Guide →](./GUIDE.md#default-rules)**

---

## String Rules (7 rules)

**Purpose:** String validation and length constraints

| Rule              | Parameters          | Description                            |
| ----------------- | ------------------- | -------------------------------------- |
| `MinLength`       | `[number]`          | String must have at least n characters |
| `MaxLength`       | `[number]`          | String must not exceed n characters    |
| `Length`          | `[number, number?]` | Exact length or range                  |
| `String`          | `[]`                | Value must be a string                 |
| `NonNullString`   | `[]`                | Non-empty, non-null string             |
| `StartsWithOneOf` | `string[]`          | Starts with one of the prefixes        |
| `EndsWithOneOf`   | `string[]`          | Ends with one of the suffixes          |

**Example:**

```typescript
class Product {
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @StartsWithOneOf('PROD-', 'SKU-')
  code: string;
}
```

📖 **[Detailed Guide →](./GUIDE.md#string-rules)**

---

## Numeric Rules (13 rules)

**Purpose:** Number validation and comparisons

| Rule            | Parameters          | Description                     |
| --------------- | ------------------- | ------------------------------- |
| `Number`        | `[]`                | Value is a number               |
| `Integer`       | `[]`                | Value is an integer             |
| `NumberGT`      | `[number]`          | Greater than (>)                |
| `NumberGTE`     | `[number]`          | Greater than or equal (>=)      |
| `NumberLT`      | `[number]`          | Less than (<)                   |
| `NumberLTE`     | `[number]`          | Less than or equal (<=)         |
| `NumberEQ`      | `[number]`          | Equal to (===)                  |
| `NumberNE`      | `[number]`          | Not equal to (!==)              |
| `NumberBetween` | `[number, number]`  | Between min and max (inclusive) |
| `DecimalPlaces` | `[number, number?]` | Specific decimal places         |
| `EvenNumber`    | `[]`                | Even integer                    |
| `OddNumber`     | `[]`                | Odd integer                     |
| `MultipleOf`    | `[number]`          | Multiple of n                   |

**Example:**

```typescript
class Price {
  @IsNumber()
  @NumberGTE(0)
  @NumberLTE(999999.99)
  @DecimalPlaces(2)
  amount: number;
}
```

📖 **[Detailed Guide →](./GUIDE.md#numeric-rules)**

---

## Boolean Rules (1 rule)

**Purpose:** Boolean type validation

| Rule      | Parameters | Description                                     |
| --------- | ---------- | ----------------------------------------------- |
| `Boolean` | `[]`       | Valid boolean (true/false, 1/0, "true"/"false") |

**Example:**

```typescript
class Settings {
  @IsBoolean()
  isActive: boolean;
}
```

📖 **[Detailed Guide →](./GUIDE.md#boolean-rules)**

---

## Date Rules (7 rules)

**Purpose:** Date validation and comparisons

| Rule          | Parameters               | Description              |
| ------------- | ------------------------ | ------------------------ |
| `Date`        | `[]`                     | Valid date object        |
| `DateAfter`   | `[Date\|string\|number]` | After specified date     |
| `DateBefore`  | `[Date\|string\|number]` | Before specified date    |
| `DateBetween` | `[date, date]`           | Between two dates        |
| `SameDate`    | `[Date\|string\|number]` | Same date (ignores time) |
| `FutureDate`  | `[]`                     | Date in the future       |
| `PastDate`    | `[]`                     | Date in the past         |

**Example:**

```typescript
class Event {
  @IsFutureDate()
  startDate: Date;

  @IsDateAfter(new Date('2024-01-01'))
  endDate: Date;
}
```

📖 **[Detailed Guide →](./GUIDE.md#date-rules)**

---

## Array Rules (8 rules)

**Purpose:** Array validation and content checks

| Rule              | Parameters | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `Array`           | `[]`       | Value is an array                   |
| `ArrayMinLength`  | `[number]` | Array has at least n elements       |
| `ArrayMaxLength`  | `[number]` | Array has at most n elements        |
| `ArrayLength`     | `[number]` | Array has exactly n elements        |
| `ArrayContains`   | `any[]`    | Array contains all specified values |
| `ArrayUnique`     | `[]`       | All array elements are unique       |
| `ArrayAllStrings` | `[]`       | All elements are strings            |
| `ArrayAllNumbers` | `[]`       | All elements are numbers            |

**Example:**

```typescript
class Tags {
  @IsArray()
  @ArrayMinLength(1)
  @ArrayMaxLength(10)
  @ArrayUnique()
  tags: string[];
}
```

📖 **[Detailed Guide →](./GUIDE.md#array-rules)**

---

## File Rules (6 rules)

**Purpose:** File upload validation

| Rule            | Parameters | Description                  |
| --------------- | ---------- | ---------------------------- |
| `File`          | `[]`       | Value is a valid file object |
| `MaxFileSize`   | `[number]` | File size <= n bytes         |
| `MinFileSize`   | `[number]` | File size >= n bytes         |
| `FileType`      | `string[]` | File MIME type matches       |
| `Image`         | `[]`       | File is an image             |
| `FileExtension` | `string[]` | File extension matches       |

**Example:**

```typescript
class Upload {
  @IsRequired()
  @IsFile()
  @IsImage()
  @MaxFileSize(5 * 1024 * 1024) // 5MB
  @FileExtension('jpg', 'png', 'webp')
  avatar: File;
}
```

📖 **[Detailed Guide →](./GUIDE.md#file-rules)**

---

## Format Rules (15 rules)

**Purpose:** Format validation for common data types

| Rule                 | Parameters          | Description                |
| -------------------- | ------------------- | -------------------------- |
| `Email`              | `[options?]`        | RFC 5322 email             |
| `Url`                | `[options?]`        | Valid URL with protocol    |
| `PhoneNumber`        | `[{countryCode?}?]` | International phone number |
| `EmailOrPhoneNumber` | `[options?]`        | Email OR phone             |
| `UUID`               | `[version?]`        | UUID (v1-v5)               |
| `MongoId`            | `[]`                | MongoDB ObjectId           |
| `IP`                 | `[4\|6?]`           | IPv4 or IPv6               |
| `MACAddress`         | `[options?]`        | MAC address                |
| `CreditCard`         | `[]`                | Credit card (Luhn)         |
| `HexColor`           | `[]`                | Hex color (#RGB/#RRGGBB)   |
| `Hexadecimal`        | `[]`                | Hexadecimal string         |
| `Base64`             | `[]`                | Base64 encoded             |
| `JSON`               | `[]`                | Valid JSON string          |
| `FileName`           | `[]`                | Safe filename              |
| `Matches`            | `[pattern, flags?]` | Custom regex               |

**Example:**

```typescript
class Contact {
  @IsEmail()
  email: string;

  @IsPhoneNumber({ countryCode: 'US' })
  phone: string;

  @IsUrl({ allowedProtocols: ['https'] })
  website: string;
}
```

📖 **[Detailed Guide →](./GUIDE.md#format-rules)**

---

## Advanced Rules

### Enum Rules (1 rule)

| Rule   | Parameters | Description          |
| ------ | ---------- | -------------------- |
| `Enum` | `any[]`    | Value in allowed set |

**Example:**

```typescript
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

class User {
  @IsEnum(Status.ACTIVE, Status.INACTIVE)
  status: string;
}
```

### Object Rules (1 rule)

| Rule     | Parameters | Description           |
| -------- | ---------- | --------------------- |
| `Object` | `[]`       | Value is plain object |

**Example:**

```typescript
class Config {
  @IsObject()
  metadata: Record<string, any>;
}
```

### Multi Rules (3 rules)

| Rule         | Logic     | Description                   |
| ------------ | --------- | ----------------------------- |
| `@OneOf()`   | OR        | At least ONE rule must pass   |
| `@AllOf()`   | AND       | ALL rules must pass           |
| `@ArrayOf()` | Array+AND | Each element passes ALL rules |

\***\*Example:**

```typescript
class User {
  @OneOf('Email', 'PhoneNumber')
  contact: string; // Either email OR phone

  @AllOf('IsString', { MinLength: [8] }, { Matches: [/.*\d.*/] })
  password: string; // All conditions

  @ArrayOf('Email', 'IsNonNullString')
  emails: string[]; // Each email valid
}
```

### Target Rules (1 rule)

| Rule                | Description                     |
| ------------------- | ------------------------------- |
| `@ValidateNested()` | Validate nested class instances |

**Example:**

```typescript
class Address {
  @IsRequired() street: string;
  @IsRequired() city: string;
}

class User {
  @ValidateNested(Address)
  address: Address;
}
```

📖 **[Detailed Guide →](./GUIDE.md#advanced-rules)**

---

## Using Rules

### Array Format (Recommended)

```typescript
const result = await Validator.validate({
  value: 'test@example.com',
  rules: ['Required', 'Email', { MaxLength: [100] }],
});
```

### Decorator Format

```typescript
class User {
  @IsRequired()
  @IsEmail()
  @MaxLength(100)
  email: string;
}
```

---

## Rule Name vs Decorator Name

⚠️ **Important:** Rule names (in arrays) differ from decorator names!

| Decorator       | Rule Name     | Usage                         |
| --------------- | ------------- | ----------------------------- |
| `@IsRequired()` | `'Required'`  | `rules: ['Required']`         |
| `@IsEmail()`    | `'Email'`     | `rules: ['Email']`            |
| `@MinLength(8)` | `'MinLength'` | `rules: [{ MinLength: [8] }]` |

📖 **[Learn More →](./GUIDE.md#decorator-vs-rule-name)**

---

## Next Steps

- 📖 **[Full User Guide](./GUIDE.md)** - Detailed documentation
- 🔧 **[API Reference](./API_REFERENCE.md)** - Complete API docs
- 🔙 **[Back to README](../README.md)** - Main documentation

---

Made with ❤️ by the reslib team
