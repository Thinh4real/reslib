# API Reference

**Complete API documentation for reslib/validator**

🔙 **[Back to README](../README.md)** | 📖 **[User Guide](./GUIDE.md)** | 📋 **[Rules Reference](./RULES.md)**

---

## Table of Contents

- [Validator Class](#validator-class)
  - [Validator.validate()](#validatorvalidate)
  - [Validator.validateTarget()](#validatorvalidatetarget)
  - [Validator.registerRule()](#validatorregisterrule)
  - [Validator.getRule()](#validatorgetrule)
  - [Validator.getRules()](#validatorgetrules)
  - [Validator.hasRule()](#validatorhasrule)
- [Types](#types)
  - [ValidatorValidateOptions](#validatorvalidateoptions)
  - [ValidatorValidateResult](#validatorvalidateresult)
  - [ValidatorValidateTargetResult](#validatorvalidatetargetresult)
  - [ValidatorRules](#validatorrules)
  - [ValidatorResult](#validatorresult)

---

## Validator Class

The main `Validator` class provides static methods for validation.

### Validator.validate()

**Validate a single value against validation rules.**

```typescript
static async validate<Context = unknown>(
  options: ValidatorValidateOptions<Context>
): Promise<ValidatorValidateResult<Context>>
```

#### Parameters

| Parameter          | Type             | Required | Description                         |
| ------------------ | ---------------- | -------- | ----------------------------------- |
| `value`            | `any`            | ✅       | Value to validate                   |
| `rules`            | `ValidatorRules` | ✅       | Validation rules to apply           |
| `context`          | `Context`        | ❌       | Optional context data               |
| `fieldName`        | `string`         | ❌       | Field name for error messages       |
| `i18n`             | `I18n`           | ❌       | i18n instance for translations      |
| `phoneCountryCode` | `boolean`        | ❌       | Enable phone country code detection |

#### Returns

```typescript
Promise<ValidatorValidateResult>;

interface ValidatorValidateResult<Context = unknown> {
  isValid: boolean;
  message?: string;
  value: any;
  context?: Context;
}
```

#### Examples

**Basic validation:**

```typescript
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email'],
});

if (result.isValid) {
  console.log('✅ Valid!');
} else {
  console.log('❌ Error:', result.message);
}
```

**With parameters:**

```typescript
const result = await Validator.validate({
  value: 'password123',
  rules: [
    'Required',
    { MinLength: [8] },
    { MaxLength: [100] },
    { Matches: [/.*\d.*/, 'Must contain a number'] },
  ],
  fieldName: 'password',
});
```

**With context:**

```typescript
const result = await Validator.validate({
  value: password,
  rules: [
    ({ value, context }) => {
      if (context?.requireStrong) {
        return /[A-Z]/.test(value) || 'Must contain uppercase';
      }
      return true;
    },
  ],
  context: { requireStrong: true },
});
```

---

### Validator.validateTarget()

**Validate class instances using decorator-based rules.**

```typescript
static async validateTarget<Target extends object, Context = unknown>(
  TargetClass: new () => Target,
  options: ValidatorValidateTargetOptions<Target, Context>
): Promise<ValidatorValidateTargetResult<Target, Context>>
```

#### Parameters

| Parameter         | Type      | Required | Description                                  |
| ----------------- | --------- | -------- | -------------------------------------------- |
| `TargetClass`     | `class`   | ✅       | Class constructor with validation decorators |
| `options.data`    | `object`  | ✅       | Data to validate against class schema        |
| `options.context` | `Context` | ❌       | Optional validation context                  |
| `options.i18n`    | `I18n`    | ❌       | i18n instance for translations               |

#### Returns

```typescript
Promise<ValidatorValidateTargetResult>;

interface ValidatorValidateTargetResult<Target, Context = unknown> {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  data: Target;
  context?: Context;
}
```

#### Examples

**Basic class validation:**

```typescript
class User {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

const result = await Validator.validateTarget(User, {
  data: {
    email: 'user@example.com',
    password: 'SecurePass123',
  },
});

if (result.isValid) {
  console.log('✅ All fields valid');
  // result.data is fully validated User object
} else {
  console.log('❌ Errors:', result.errors);
  // result.errors: [{ field: 'password', message: '...' }]
}
```

**With nested validation:**

```typescript
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;
}

class User {
  @IsRequired()
  name: string;

  @ValidateNested(Address)
  address: Address;
}

const result = await Validator.validateTarget(User, {
  data: {
    name: 'John Doe',
    address: {
      street: '123 Main St',
      city: 'Springfield',
    },
  },
});
```

**With context:**

```typescript
const result = await Validator.validateTarget(UserDTO, {
  data: userData,
  context: { userId: currentUser.id, mode: 'strict' },
});
```

---

### Validator.registerRule()

**Register a custom validation rule.**

```typescript
static registerRule<Params extends ValidatorRuleParams = []>(
  name: string,
  ruleFunction: ValidatorRuleFunction<Params>
): void
```

#### Parameters

| Parameter      | Type                    | Description                       |
| -------------- | ----------------------- | --------------------------------- |
| `name`         | `string`                | Unique rule name (case-sensitive) |
| `ruleFunction` | `ValidatorRuleFunction` | Validation function               |

#### Rule Function Signature

```typescript
type ValidatorRuleFunction<Params> = (
  options: ValidatorValidateOptions<Params>
) => ValidatorResult | Promise<ValidatorResult>;

type ValidatorResult = true | string | Promise<true | string>;
```

#### Examples

**Simple custom rule:**

```typescript
Validator.registerRule('IsPositive', ({ value, i18n }) => {
  if (typeof value !== 'number' || value <= 0) {
    return i18n.t('validator.positive', { value });
  }
  return true;
});

// Use it
const result = await Validator.validate({
  value: 42,
  rules: [{ IsPositive: [] }],
});
```

**Rule with parameters:**

```typescript
Validator.registerRule('IsBetween', ({ value, ruleParams, i18n }) => {
  const [min, max] = ruleParams;
  if (value < min || value > max) {
    return i18n.t('validator.between', { min, max, value });
  }
  return true;
});

// Use it
const result = await Validator.validate({
  value: 50,
  rules: [{ IsBetween: [0, 100] }],
});
```

**Async validation:**

```typescript
Validator.registerRule('UniqueEmail', async ({ value, context }) => {
  const exists = await database.users.findByEmail(value);
  if (exists) {
    return 'Email already exists';
  }
  return true;
});
```

**With TypeScript types:**

```typescript
// Augment types for autocomplete
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    IsPositive: [];
    IsBetween: [number, number];
    UniqueEmail: [];
  }
}
```

---

### Validator.getRule()

**Get a registered validation rule by name.**

```typescript
static getRule(name: string): ValidatorRuleFunction | undefined
```

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `name`    | `string` | Rule name   |

#### Returns

The validation rule function, or `undefined` if not found.

#### Example

```typescript
const emailRule = Validator.getRule('Email');
if (emailRule) {
  console.log('Email rule exists');
}
```

---

### Validator.getRules()

**Get all registered validation rules.**

```typescript
static getRules(): ValidatorRuleFunctionsMap
```

#### Returns

```typescript
type ValidatorRuleFunctionsMap = Map<string, ValidatorRuleFunction>;
```

#### Example

```typescript
const allRules = Validator.getRules();
console.log('Total rules:', allRules.size);

for (const [name, rule] of allRules) {
  console.log(`Rule: ${name}`);
}
```

---

### Validator.hasRule()

**Check if a rule is registered.**

```typescript
static hasRule(name: string): boolean
```

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `name`    | `string` | Rule name   |

#### Returns

`true` if the rule exists, `false` otherwise.

#### Example

```typescript
if (Validator.hasRule('Email')) {
  console.log('Email validation available');
}

if (!Validator.hasRule('CustomRule')) {
  Validator.registerRule('CustomRule', customValidation);
}
```

---

## Types

### ValidatorValidateOptions

```typescript
interface ValidatorValidateOptions<Context = unknown> {
  value: any;
  rules: ValidatorRules;
  context?: Context;
  fieldName?: string;
  i18n?: I18n;
  phoneCountryCode?: boolean;
}
```

### ValidatorValidateResult

```typescript
interface ValidatorValidateResult<Context = unknown> {
  isValid: boolean;
  message?: string;
  value: any;
  context?: Context;
}
```

### ValidatorValidateTargetResult

```typescript
interface ValidatorValidateTargetResult<Target, Context = unknown> {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  data: Target;
  context?: Context;
}
```

### ValidatorRules

```typescript
type ValidatorRules = Array<
  | string // 'Required', 'Email'
  | { [ruleName: string]: any[] } // { MinLength: [8] }
  | ValidatorRuleFunction // Custom function
>;
```

### ValidatorResult

```typescript
type ValidatorResult =
  | true // Validation passed
  | string // Validation failed (error message)
  | Promise<true | string>; // Async validation
```

---

## Decorators

All 67 validation rules have corresponding decorators.

### Decorator Naming Convention

- **Decorator name:** `@IsRequired`, `@IsEmail`, `@MinLength`
- **Rule name (in arrays):** `'Required'`, `'Email'`, `'MinLength'`

### Example Decorators

```typescript
// Default
@IsRequired()
@IsOptional()
@IsNullable()

// String
@MinLength(n)
@MaxLength(n)
@IsNonNullString()

// Numeric
@IsNumber()
@IsNumberGTE(n)
@IsNumberLTE(n)

// Format
@IsEmail(options?)
@IsUrl(options?)
@IsPhoneNumber(options?)

// File
@IsFile()
@MaxFileSize(bytes)
@IsImage()

// Advanced
@OneOf(...rules)
@AllOf(...rules)
@ArrayOf(...rules)
@ValidateNested(Class)
```

📋 **[See All Rules →](./RULES.md)**

---

## Error Handling

### Validation Errors

```typescript
const result = await Validator.validate({
  value: 'invalid',
  rules: ['Required', 'Email'],
});

if (!result.isValid) {
  console.error(result.message); // "Must be a valid email"
}
```

### Target Validation Errors

```typescript
const result = await Validator.validateTarget(UserDTO, {
  data: invalidData,
});

if (!result.isValid) {
  result.errors.forEach((error) => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

---

## Best Practices

### ✅ Do's

- Use decorators for DTOs and class-based validation
- Use rule arrays for dynamic/form validation
- Register custom rules with type augmentation
- Use async rules for database checks
- Provide clear field names for better error messages

### ❌ Don'ts

- Don't mix decorator names with rule names in arrays
- Don't forget type augmentation for custom rules
- Don't use synchronous database calls in validation
- Don't skip error handling

---

## Next Steps

- 📖 **[User Guide](./GUIDE.md)** - Complete documentation
- 📋 **[Rules Reference](./RULES.md)** - All 67 validation rules
- 🔙 **[Back to README](../README.md)** - Main documentation

---

Made with ❤️ by the reslib team
