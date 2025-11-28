# ResLib Validator

A comprehensive, type-safe validation system for TypeScript/JavaScript applications. The ResLib Validator provides flexible and powerful validation capabilities with full TypeScript support, decorator-based validation, and an extensive ecosystem of built-in validation rules.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Validation](#basic-validation)
- [Decorator-Based Validation](#decorator-based-validation)
- [Available Validation Rules](#available-validation-rules)
- [Custom Rules](#custom-rules)
- [Module Augmentation](#module-augmentation)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Migration Guide](#migration-guide)

## Features

- **Type-Safe Validation**: Full TypeScript support with generic types and compile-time validation
- **Decorator Support**: Class property validation using decorators for clean, declarative validation
- **Async Validation**: Support for asynchronous validation rules
- **Internationalization**: Built-in i18n support for error messages
- **Extensible**: Easy to register custom validation rules
- **Rule Composition**: Combine multiple validation rules with logical operators
- **Performance Optimized**: Efficient validation with minimal overhead
- **Framework Agnostic**: Works with any JavaScript/TypeScript framework

## Installation

The validator is part of the ResLib library. Install ResLib to use the validator:

```bash
npm install reslib
# or
yarn add reslib
# or
pnpm add reslib
```

## Quick Start

### Basic Validation

```typescript
import { Validator } from 'reslib/validator';

// Simple validation
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email']
});

if (result.success) {
  console.log('Validation passed!');
} else {
  console.log('Validation failed:', result.error.message);
}
```

### Decorator-Based Validation

```typescript
import { IsRequired, IsEmail, IsNumber, MinLength } from 'reslib/validator';

class User {
  @IsRequired()
  @MinLength(2)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsNumber()
  age?: number;
}

// Validate an instance
const userData = { name: 'John', email: 'john@example.com', age: 25 };
const result = await Validator.validateTarget(User, { data: userData });

if (result.success) {
  console.log('User is valid:', result.data);
} else {
  console.log('Validation errors:', result.errors);
}
```

## Basic Validation

The validator provides several methods for different validation scenarios:

### Single Value Validation

```typescript
import { Validator } from 'reslib/validator';

// Validate a single value
const result = await Validator.validate({
  value: 'test@example.com',
  rules: ['Required', 'Email'],
  context: { userId: 123 } // Optional context
});

console.log(result.success); // true or false
```

### Multiple Rules

```typescript
// Array of rules
const result = await Validator.validate({
  value: 'password123',
  rules: [
    'Required',
    { MinLength: [8] },
    { MaxLength: [128] },
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase letter'
  ]
});
```

### Rule Formats

The validator supports multiple rule specification formats:

```typescript
// Named rules (strings)
rules: ['Required', 'Email']

// Parameterized rules (objects)
rules: [{ MinLength: [5] }, { MaxLength: [100] }]

// Function rules
rules: [({ value }) => value.length > 3 || 'Too short']

// Mixed rules
rules: [
  'Required',           // Named
  { MinLength: [3] },   // Parameterized
  ({ value }) => true   // Function
]
```

## Decorator-Based Validation

Decorators provide a clean, declarative way to define validation rules on class properties.

### Basic Decorators

```typescript
import { 
  IsRequired, IsEmail, IsNumber, IsString,
  MinLength, MaxLength, IsOptional 
} from 'reslib/validator';

class User {
  @IsRequired()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsString()
  bio?: string;
}
```

### Validation Execution

```typescript
// Validate data against the class
const result = await Validator.validateTarget(User, {
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    bio: 'Software developer'
  }
});

if (result.success) {
  console.log('All validations passed');
} else {
  // result.errors contains field-specific errors
  console.log('Validation errors:', result.errors);
}
```

### Nested Validation

```typescript
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;

  @IsRequired()
  @Matches(/^\d{5}$/)
  zipCode: string;
}

class User {
  @IsRequired()
  name: string;

  @ValidateNested(Address)
  address: Address;
}
```

## Available Validation Rules

The validator comes with a comprehensive set of built-in rules:

### String Rules

- `String` - Validates that the value is a string
- `MinLength` - Minimum string length
- `MaxLength` - Maximum string length
- `Length` - Exact string length or range
- `StartsWithOneOf` - String starts with one of the specified values
- `EndsWithOneOf` - String ends with one of the specified values
- `NonNullString` - Validates non-null string

### Number Rules

- `Number` - Validates that the value is a number
- `NumberLTE` - Number less than or equal to
- `NumberLT` - Number less than
- `NumberGTE` - Number greater than or equal to
- `NumberGT` - Number greater than
- `NumberEQ` - Number equal to
- `NumberNE` - Number not equal to
- `NumberBetween` - Number within range
- `IsInteger` - Validates integer
- `EvenNumber` - Validates even number
- `OddNumber` - Validates odd number
- `MultipleOf` - Validates multiple of a number
- `HasDecimalPlaces` - Validates decimal places

### Boolean Rules

- `Boolean` - Validates boolean values (true, false, 1, 0, "true", "false")

### Date Rules

- `Date` - Validates date values
- `DateAfter` - Date after specified date
- `DateBefore` - Date before specified date
- `DateBetween` - Date within range
- `FutureDate` - Date in the future
- `PastDate` - Date in the past

### Format Rules

- `Email` - Email address validation
- `Url` - URL validation
- `PhoneNumber` - Phone number validation
- `UUID` - UUID validation
- `MACAddress` - MAC address validation
- `FileName` - File name validation
- `Matches` - Regular expression matching

### File Rules

- `File` - File object validation
- `MaxFileSize` - Maximum file size
- `MinFileSize` - Minimum file size

### Enum Rules

- `Enum` - Value within allowed set

### Default Rules

- `Required` - Value is not null/undefined/empty
- `Optional` - Allows null/undefined (skips other validations)
- `Nullable` - Allows null values
- `Empty` - Allows empty strings

## Custom Rules

### Registering Custom Rules

```typescript
import { Validator } from 'reslib/validator';

// Register a custom rule
Validator.registerRule('MinWords', ({ value, ruleParams }) => {
  const [minWords] = ruleParams;
  if (typeof value !== 'string') return 'Must be a string';
  
  const wordCount = value.trim().split(/\s+/).length;
  return wordCount >= minWords || `Must contain at least ${minWords} words`;
});

// Use the custom rule
const result = await Validator.validate({
  value: 'This is a test',
  rules: [{ MinWords: [3] }]
});
```

### Custom Rule Functions

```typescript
// Synchronous rule
const customRule = ({ value, ruleParams, context }) => {
  // Your validation logic
  return true; // or error message
};

// Asynchronous rule
const asyncRule = async ({ value, ruleParams, context }) => {
  const isValid = await someAsyncCheck(value);
  return isValid || 'Async validation failed';
};

// Use in validation
const result = await Validator.validate({
  value: 'test',
  rules: [customRule, asyncRule]
});
```

## Module Augmentation

Extend the validator with custom rules using TypeScript module augmentation:

```typescript
// custom-rules.ts
import 'reslib/validator';

// Augment the ValidatorRuleParamTypes interface
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    CustomRule: ValidatorRuleParams<[string]>;
    AnotherRule: ValidatorRuleParams<[]>;
  }
}

// Register the implementations
Validator.registerRule('CustomRule', ({ value, ruleParams }) => {
  const [param] = ruleParams;
  // Implementation
  return true;
});

Validator.registerRule('AnotherRule', ({ value }) => {
  // Implementation
  return true;
});

// Now you can use them with full type safety
const result = await Validator.validate({
  value: 'test',
  rules: [{ CustomRule: ['param'] }, 'AnotherRule']
});
```

## Advanced Features

### Logical Rule Composition

#### OneOf - OR Logic

```typescript
import { OneOf } from 'reslib/validator';

class Contact {
  @OneOf(['Email', 'PhoneNumber'])
  contactInfo: string;
}

// Valid: either email or phone number
const contact1 = { contactInfo: 'user@example.com' }; // ✓
const contact2 = { contactInfo: '+1234567890' }; // ✓
const contact3 = { contactInfo: 'invalid' }; // ✗
```

#### AllOf - AND Logic

```typescript
import { AllOf } from 'reslib/validator';

class SecurePassword {
  @AllOf([
    { MinLength: [8] },
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase',
    ({ value }) => /[a-z]/.test(value) || 'Must contain lowercase',
    ({ value }) => /\d/.test(value) || 'Must contain number'
  ])
  password: string;
}
```

#### ArrayOf - Validate Array Elements

```typescript
import { ArrayOf } from 'reslib/validator';

class TagList {
  @ArrayOf(['Required', { MinLength: [2] }, { MaxLength: [20] }])
  tags: string[];
}

// Each tag must be required, 2-20 characters
const valid = { tags: ['javascript', 'typescript'] }; // ✓
const invalid = { tags: ['js', ''] }; // ✗ (empty string)
```

### Validation Context

Pass context data to validation rules:

```typescript
interface UserContext {
  currentUser: { id: number; role: string };
  permissions: string[];
}

class Post {
  @IsRequired()
  title: string;

  @IsRequired()
  content: string;

  // Custom rule using context
  @(({ value, context }) => {
    const ctx = context as UserContext;
    if (ctx.currentUser.role === 'admin') return true;
    return value.length <= 1000 || 'Content too long for non-admin users';
  })
  content: string;
}

const result = await Validator.validateTarget(Post, {
  data: postData,
  context: {
    currentUser: { id: 1, role: 'user' },
    permissions: ['read', 'write']
  }
});
```

### Internationalization

The validator supports internationalization for error messages:

```typescript
import { i18n } from 'reslib/i18n';

// Set locale
await i18n.setLocale('fr');

// Error messages will now be in French
const result = await Validator.validate({
  value: '',
  rules: ['Required']
});
// result.error.message will be in French
```

### Custom Error Messages

```typescript
// Per-rule custom messages
const result = await Validator.validate({
  value: 'short',
  rules: [{
    MinLength: [10, { message: 'custom.minLength' }]
  }]
});

// Or with decorators
class User {
  @IsRequired({ message: 'user.name.required' })
  @MinLength(3, { message: 'user.name.tooShort' })
  name: string;
}
```

## API Reference

### Validator Class

#### Static Methods

- `validate(options)` - Validate a single value
- `validateTarget(Class, options)` - Validate data against a class schema
- `registerRule(name, handler)` - Register a custom validation rule
- `getRules()` - Get all registered rules
- `getRule(name)` - Get a specific rule
- `hasRule(name)` - Check if a rule exists

#### Validation Options

```typescript
interface ValidatorValidateOptions {
  value: any;
  rules: ValidatorRules;
  context?: any;
  fieldName?: string;
  i18n?: I18n;
}

interface ValidatorValidateTargetOptions {
  data: any;
  context?: any;
  i18n?: I18n;
  errorMessageBuilder?: ErrorMessageBuilder;
}
```

### Rule Types

```typescript
type ValidatorRule =
  | string                          // Named rule
  | ValidatorRuleFunction          // Function rule
  | ValidatorRuleObject;           // Object rule

type ValidatorRules = ValidatorRule | ValidatorRule[];
```

### Decorators

All decorators follow the same pattern:

```typescript
@DecoratorName(param1, param2, ...)
property: Type;
```

## Examples

### User Registration

```typescript
import { 
  IsRequired, IsEmail, IsString, MinLength, MaxLength,
  IsNumber, IsOptional, OneOf, ValidateNested
} from 'reslib/validator';

class Address {
  @IsRequired()
  @IsString()
  @MinLength(5)
  street: string;

  @IsRequired()
  @IsString()
  city: string;

  @IsRequired()
  @Matches(/^\d{5}$/)
  zipCode: string;
}

class User {
  @IsRequired()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsRequired()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @OneOf(['Email', 'PhoneNumber'])
  contactMethod: string;

  @ValidateNested(Address)
  address: Address;
}

// Validation
const userData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  age: 30,
  contactMethod: 'email',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    zipCode: '12345'
  }
};

const result = await Validator.validateTarget(User, { data: userData });
```

### Form Validation

```typescript
class ContactForm {
  @IsRequired()
  @MinLength(3)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @OneOf(['general', 'support', 'sales'])
  category?: string;
}
```

### API Input Validation

```typescript
class CreateUserRequest {
  @IsRequired()
  @IsString()
  username: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @AllOf([
    { MinLength: [8] },
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase',
    ({ value }) => /[a-z]/.test(value) || 'Must contain lowercase',
    ({ value }) => /\d/.test(value) || 'Must contain number'
  ])
  password: string;
}

// In your API handler
app.post('/users', async (req, res) => {
  const result = await Validator.validateTarget(CreateUserRequest, {
    data: req.body
  });

  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }

  // Create user with validated data
  const user = await createUser(result.data);
  res.json(user);
});
```

## Migration Guide

### From Other Validation Libraries

#### From Joi

```typescript
// Joi
const schema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required()
});

// ResLib
class User {
  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;
}
```

#### From Yup

```typescript
// Yup
const schema = yup.object({
  name: yup.string().min(3).max(50).required(),
  email: yup.string().email().required()
});

// ResLib
class User {
  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;
}
```

### Upgrading from Previous Versions

- All existing APIs remain compatible
- New rules are additive
- Custom rules continue to work
- Decorator signatures unchanged

## Contributing

The validator is designed to be extensible. To add new rules:

1. Create a new rule file in `src/validator/rules/`
2. Implement the rule logic
3. Export the decorator
4. Add type definitions to `ValidatorRuleParamTypes`
5. Add tests in `src/validator/tests/`
6. Update this documentation

## License

This validator is part of the ResLib library and follows the same license terms.