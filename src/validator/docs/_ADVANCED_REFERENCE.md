# Additional Validation Rules - Complete Documentation

## Enum, Object, Multi, and Target Rules

This document contains the complete documentation for the 4 specialized rule categories.

## Enum Rules

✅ **SCANNED FROM:** `src/validator/rules/enum.ts`

**Category:** Enumeration validation for restricting values to allowed sets

### Rules in this Category

| Rule   | Decorator            | Parameters | String Format | Object Format             | Description                  |
| ------ | -------------------- | ---------- | ------------- | ------------------------- | ---------------------------- |
| `Enum` | `@IsEnum(...values)` | `any[]`    | ❌            | ✅ `[{ Enum: [values] }]` | Value must be in allowed set |

### IsEnum -Enum Validation

**Validates that a value matches one of the allowed enum values.**

#### Usage

```typescript
// Single value
const result = await Validator.validate({
  value: 'active',
  rules: [{ Enum: ['active', 'inactive', 'pending'] }],
});
// ✅ Success

// Array values (multi-select)
const result2 = await Validator.validate({
  value: ['yes', 'no'],
  rules: [{ Enum: ['yes', 'no', 'maybe'] }],
});
// ✅ Success

// Decorator
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

class User {
  @IsEnum(Status.ACTIVE, Status.INACTIVE)
  status: string;
}
```

---

## Object Rules

✅ **SCANNED FROM:** `src/validator/rules/object.ts`

| Rule     | Decorator     | Parameters | Description                |
| -------- | ------------- | ---------- | -------------------------- |
| `Object` | `@IsObject()` | `[]`       | Value must be plain object |

### IsObject

**Validates plain JavaScript objects.**

```typescript
class UserProfile {
  @IsObject()
  metadata: Record<string, any>;
}

// Valid: {}, {key: 'value'}
// Invalid: null, [], "string", 42
```

---

## Multi Rules

✅ **SCANNED FROM:** `src/validator/rules/multiRules.ts`

| Decorator    | Logic       | Description                 |
| ------------ | ----------- | --------------------------- |
| `@OneOf()`   | OR logic    | At least ONE rule must pass |
| `@AllOf()`   | AND logic   | ALL rules must pass         |
| `@ArrayOf()` | Array + AND | All elements pass all rules |

### OneOf - OR Logic

```typescript
class User {
  @OneOf('Email', 'PhoneNumber')
  contact: string; // Either email OR phone
}
```

### AllOf - AND Logic

```typescript
class User {
  @AllOf('IsString', { MinLength: [8] }, { Matches: [/.*\\d.*/] })
  password: string; // Must pass ALL rules
}
```

### ArrayOf - Array Validation

```typescript
class User {
  @ArrayOf('Email', 'IsNonNullString')
  emails: string[]; // Each element passes ALL rules
}
```

---

## Target Rules

✅ **SCANNED FROM:** `src/validator/rules/target.ts`

| Decorator           | Description                      |
| ------------------- | -------------------------------- |
| `@ValidateNested()` | Validates nested class instances |

### ValidateNested

**Validates nested objects using their class rules.**

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
```

---

**Total: 6 additional rules documented!**

- Enum: 1 rule
- Object: 1 rule
- Multi: 3 rules (OneOf, AllOf, ArrayOf)
- Target: 1 rule

**Grand Total: 61 + 6 = 67 rules fully documented! 🎉**

See main COMPREHENSIVE_DOCUMENTATION.md for complete details.
