# Modern Next.js Integration Guide

**Production-ready validation for Next.js 15 Server Actions, React 19, and Server Components.**

---

## 🎯 Overview

reslib/validator provides a powerful, type-safe validation solution for modern Next.js applications using **Server Actions** and **React 19**.

While `reslib/validator` handles the actual data validation, the integration with Next.js forms is typically handled through a reusable **Factory Pattern** in your application.

✅ **Server Actions** - Native integration via your own `formActionFactory`  
✅ **React 19** - Compatible with `useActionState` hook  
✅ **Client & Server** - Shared validation rules  
✅ **Type Safety** - Full TypeScript support  
✅ **Zero Config** - 67+ built-in rules ready to use

---

## 🚀 The Architecture

The recommended architecture involves three layers in your application:

1.  **Type Definitions** - Define your Form and Field types (Application Code)
2.  **Server Action Factory** - A helper to connect `reslib` with Server Actions (Application Code)
3.  **Form Configuration** - Defining rules for specific forms (Application Code)

### 1. Application Type Definitions

First, define the shape of your form fields in your project (e.g., `src/types/form.ts`):

```typescript
// Example: Your application's form types
export interface FormFieldConfig {
  type: 'text' | 'email' | 'password';
  required?: boolean;
  // Use reslib's rule format
  validationRules?: Array<{ rule: string; params?: any[]; message?: string }>;
}

export type FormFields = Record<string, FormFieldConfig>;
```

### 2. Form Configuration

Define your form structure using these types:

```typescript
// src/app/login/fields.ts
import { FormFields } from '@/types/form'; // Your types

export const loginFields = {
  email: {
    type: 'email',
    required: true,
    validationRules: ['Email'],
  },
  password: {
    type: 'password',
    required: true,
    validationRules: [{ MinLength: [8] }],
  },
} satisfies FormFields;
```

### 3. Server Action Factory Pattern

Create a reusable factory in your utils. This factory uses `reslib/validator` to validate data against your configuration.

```typescript
// src/lib/actions.ts
import { Validator } from 'reslib/validator';
import { FormFields } from '@/types/form';

// Generic factory function
export function formActionFactory<Fields extends FormFields>(
  action: (data: { values: any }) => Promise<any>,
  fields: Fields
) {
  return async (prevState: any, formData: FormData) => {
    // 1. Extract plain object from FormData
    const values = Object.fromEntries(formData);

    // 2. Validate using reslib/validator
    // Transform your fields config to reslib rule format if necessary
    const result = await Validator.validate({
      value: values,
      rules: extractRulesFromFields(fields), // Helper to map your config to rules
    });

    if (!result.isValid) {
      return { success: false, errors: result.errors };
    }

    // 3. Execute your business logic
    return action({ values });
  };
}
```

### 4. Implementation in Server Action

Everything becomes clean and type-safe:

```typescript
// src/app/actions/auth.ts
'use server';
import { formActionFactory } from '@/lib/actions';
import { loginFields } from '@/app/login/fields';

export const loginAction = formActionFactory(async ({ values }) => {
  // values is validated!
  await auth.login(values.email, values.password);
  return { success: true, message: 'Logged in!' };
}, loginFields);
```

### 5. Client Component (React 19)

Consume the action with `useActionState`:

```tsx
'use client';
import { useActionState } from 'react';
import { loginAction } from './actions';

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <form action={action}>
      <input name="email" />
      <input name="password" type="password" />
      <button disabled={isPending}>Login</button>
    </form>
  );
}
```

---

## 🔌 Advanced Features

### Validation Context

Pass dynamic context (like user roles or database state) to your validators.

```typescript
// Server Action
export const updateProfile = formActionFactory(
  async ({ values }) => { ... },
  fields,
  {
    // Factory builds context
    contextFactory: async () => ({
      userId: await getUserId(),
      isAdmin: await checkAdmin()
    })
  }
);
```

### Server-Side Only Validation

Use `reslib/validator` directly in API routes or Server Components:

```typescript
// app/api/webhook/route.ts
import { Validator } from 'reslib/validator';

export async function POST(req: Request) {
  const body = await req.json();

  const result = await Validator.validate({
    value: body,
    rules: ['IsObject', { Required: [], field: 'eventId' }],
  });

  if (!result.isValid) {
    return Response.json({ error: result.errors }, { status: 400 });
  }

  // ...
}
```

---

## 🏆 Benefits over Zod/Yup

1.  **Dual API**: Use decorators for your backend DTOs and functional rules for your frontend forms - **same library, consistent rules**.
2.  **Built-in Rules**: 67+ rules mean you don't need to write custom regex for Phones, IPs, UUIDs, etc.
3.  **i18n**: Zero-config internationalization for error messages.
4.  **No Schema Duplication**: Define rules in a JSON-serializable format that can be shared or generated dynamically.
