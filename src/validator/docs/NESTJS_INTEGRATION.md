# NestJS Integration Guide

**How to integrate reslib/validator with NestJS using a custom ValidationPipe**

🔙 **[Back to README](../README.md)** | 📖 **[User Guide](./GUIDE.md)** | 📋 **[Rules Reference](./RULES.md)** | 📊 **[Comparison](./COMPARISON.md)**

---

## 🎯 Overview

This guide shows you how to integrate **reslib/validator** with **NestJS** by creating a custom `ValidationPipe` that uses `Validator.validateTarget()`.

### Architecture

```
Your NestJS App
├── Custom ValidationPipe (you create this)
│   └── Calls Validator.validateTarget()
│       └── From reslib/validator ✨
├── DTOs with reslib decorators
└── Controllers using the pipe
```

**Key Point:** You create the `ValidationPipe` in your project. reslib/validator provides the `Validator.validateTarget()` method that does the actual validation.

---

## 🚀 Quick Start

### Step 1: Install reslib

```bash
npm install reslib
```

### Step 2: Create ValidationPipe

Create a custom pipe in your project that uses `Validator.validateTarget()`:

```typescript
// src/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Validator } from 'reslib/validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Get the DTO class from metadata
    const { metatype } = metadata;

    // Skip validation if no metatype or primitive type
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Validate using reslib/validator
    const result = await Validator.validateTarget(metatype, {
      data: value,
    });

    // Handle validation errors
    if (!result.success) {
      throw new BadRequestException(result);
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### Step 3: Register Global Pipe

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './pipes/validation.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

### Step 4: Create DTOs with reslib Decorators

```typescript
// src/users/dto/create-user.dto.ts
import { IsRequired, IsEmail, MinLength } from 'reslib/validator';

export class CreateUserDto {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}
```

### Step 5: Use in Controllers

```typescript
// src/users/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // createUserDto is automatically validated by the global pipe
    return {
      message: 'User created successfully',
      data: createUserDto,
    };
  }
}
```

**That's it!** ✅ The global `ValidationPipe` automatically validates all `@Body()`, `@Query()`, and `@Param()` decorators using reslib/validator.

---

## 📚 Understanding the Integration

### How It Works

```
1. Request arrives
   ↓
2. NestJS extracts @Body() data
   ↓
3. Your ValidationPipe.transform() is called
   ↓
4. Pipe calls Validator.validateTarget(DTO, { data })
   ↓
5. reslib/validator validates using DTO decorators
   ↓
6. If valid → data passed to controller
   If invalid → BadRequestException thrown
```

### Key Components

| Component                            | Source               | Purpose                            |
| ------------------------------------ | -------------------- | ---------------------------------- |
| `ValidationPipe`                     | **Your code**        | NestJS pipe that integrates reslib |
| `Validator.validateTarget()`         | **reslib/validator** | Validates data against DTO class   |
| DTO decorators (`@IsRequired`, etc.) | **reslib/validator** | Define validation rules            |

---

## 🎓 Basic Usage

### Body Validation

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto) {
    // dto is already validated ✅
    return { status: 'created', user: dto };
  }
}
```

**DTO:**

```typescript
import { IsRequired, IsEmail, MinLength } from 'reslib/validator';

export class CreateUserDto {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}
```

### Query Parameter Validation

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { PaginationDto } from './dto/pagination.dto';

@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Query() query: PaginationDto) {
    // query is validated ✅
    return {
      data: [],
      pagination: query,
    };
  }
}
```

**DTO:**

```typescript
import { Type } from 'class-transformer';
import { IsNumber, NumberGTE, NumberLTE } from 'reslib/validator';

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  page: number;

  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  @NumberLTE(100)
  limit: number;
}
```

**Usage:** `GET /users?page=1&limit=20`

### Array Validation

```typescript
@Post('bulk')
async bulkCreate(@Body() users: CreateUserDto[]) {
  // Each item in array is validated
  return {
    created: users.length,
    users,
  };
}
```

---

## 🔥 Advanced ValidationPipe Features

### Enhanced Pipe with Better Error Handling

```typescript
// src/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Validator } from 'reslib/validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype, type, data } = metadata;

    // Skip validation for primitives
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    this.logger.debug(`Validating ${type} parameter: ${data}`);

    // Handle array validation
    const dataToValidate = Array.isArray(value) ? value : value;

    // Validate using reslib/validator
    const result = await Validator.validateTarget(metatype, {
      data: dataToValidate,
    });

    if (!result.isValid) {
      this.logger.warn(`Validation failed for ${metatype.name}`, result.errors);

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### Pipe with i18n Support

```typescript
// src/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Validator } from 'reslib/validator';
import { I18nService } from 'nestjs-i18n'; // If using nestjs-i18n

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    @Inject(I18nService)
    private readonly i18n: I18nService
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Pass i18n instance to validator
    const result = await Validator.validateTarget(metatype, {
      data: value,
      i18n: this.i18n, // reslib/validator will use this for error messages
    });

    if (!result.isValid) {
      throw new BadRequestException({
        message: this.i18n.t('validation.failed'),
        errors: result.errors,
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### Pipe with Context

```typescript
// src/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Validator } from 'reslib/validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Get execution context (if available from request)
    const context = this.getContext();

    // Validate with context
    const result = await Validator.validateTarget(metatype, {
      data: value,
      context: {
        userId: context?.user?.id,
        role: context?.user?.role,
      },
    });

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private getContext(): any {
    // Get context from request scope if needed
    return null;
  }
}
```

---

## 💡 Real-World Examples

### Example 1: User Management API

**Controller:**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, PaginationDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    // Automatically validated by global ValidationPipe
    return this.usersService.create(dto);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    // Query params validated
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    // Body validated
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

**DTOs:**

```typescript
// create-user.dto.ts
import { IsRequired, IsEmail, MinLength, IsOptional } from 'reslib/validator';

export class CreateUserDto {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;

  @IsOptional()
  @MinLength(2)
  name?: string;
}

// update-user.dto.ts
import { IsOptional, IsEmail, MinLength } from 'reslib/validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @MinLength(2)
  name?: string;
}

// pagination.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, NumberGTE, NumberLTE } from 'reslib/validator';

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  @NumberLTE(100)
  limit: number = 20;
}
```

### Example 2: Nested Object Validation

```typescript
// address.dto.ts
import { IsRequired, IsNonNullString, Matches } from 'reslib/validator';

export class AddressDto {
  @IsRequired()
  @IsNonNullString()
  street: string;

  @IsRequired()
  @IsNonNullString()
  city: string;

  @IsRequired()
  @Matches(/^\d{5}$/)
  zipCode: string;
}

// create-user.dto.ts
import { IsRequired, IsEmail, ValidateNested } from 'reslib/validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class CreateUserDto {
  @IsRequired()
  @IsEmail()
  email: string;

  @Type(() => AddressDto)
  @ValidateNested(AddressDto)
  address: AddressDto;
}
```

**Controller:**

```typescript
@Post()
async create(@Body() dto: CreateUserDto) {
  // Both user and nested address are validated
  return this.usersService.create(dto);
}
```

**Request:**

```json
{
  "email": "user@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zipCode": "12345"
  }
}
```

### Example 3: File Upload Validation

```typescript
// upload-file.dto.ts
import {
  IsRequired,
  IsFile,
  MaxFileSize,
  FileExtension,
} from 'reslib/validator';

export class UploadFileDto {
  @IsRequired()
  @IsFile()
  @MaxFileSize(5 * 1024 * 1024) // 5MB
  @FileExtension('jpg', 'png', 'pdf')
  file: any;
}
```

**Controller:**

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // File validated by ValidationPipe
    return {
      filename: file.filename,
      size: file.size,
    };
  }
}
```

---

## 🎛️ Configuration Options

### Per-Route Validation

Instead of global pipe, use per-route:

```typescript
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { ValidationPipe } from './pipes/validation.pipe';

@Controller('users')
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe()) // Per-route pipe
  async create(@Body() dto: CreateUserDto) {
    return { status: 'created', data: dto };
  }
}
```

### Per-Parameter Validation

```typescript
@Post()
async create(
  @Body(new ValidationPipe()) dto: CreateUserDto  // Per-parameter pipe
) {
  return { status: 'created', data: dto };
}
```

### Skip Validation for Specific Routes

```typescript
// Create a custom decorator to skip validation
import { SetMetadata } from '@nestjs/common';

export const SkipValidation = () => SetMetadata('skipValidation', true);

// Use in controller
@Post('webhook')
@SkipValidation()
async handleWebhook(@Body() data: any) {
  // No validation applied
}

// Update ValidationPipe to check metadata
import { Reflector } from '@nestjs/core';

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(private reflector: Reflector) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const skipValidation = this.reflector.get<boolean>(
      'skipValidation',
      metadata.data as any,
    );

    if (skipValidation) {
      return value;
    }

    // ... rest of validation logic
  }
}
```

---

## ✅ Best Practices

### 1. Organize DTOs

```
src/
├── modules/
│   └── users/
│       ├── controllers/
│       │   └── users.controller.ts
│       ├── services/
│       │   └── users.service.ts
│       └── dto/
│           ├── create-user.dto.ts
│           ├── update-user.dto.ts
│           └── pagination.dto.ts
└── common/
    └── pipes/
        └── validation.pipe.ts  ← Your custom pipe
```

### 2. Use class-transformer

Install `class-transformer` for automatic type conversion:

```bash
npm install class-transformer
```

Use `@Type()` decorator for query parameters:

```typescript
import { Type } from 'class-transformer';
import { IsNumber, NumberGTE } from 'reslib/validator';

export class PaginationDto {
  @Type(() => Number) // Convert string to number
  @IsNumber()
  @NumberGTE(1)
  page: number;
}
```

### 3. Create Base DTOs

```typescript
// base-pagination.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, NumberGTE, NumberLTE } from 'reslib/validator';

export class BasePaginationDto {
  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @NumberGTE(1)
  @NumberLTE(100)
  limit: number = 20;
}

// users-query.dto.ts
export class UsersQueryDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
```

### 4. Use Partial for Updates

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // All fields from CreateUserDto become optional
}
```

### 5. Add Swagger Documentation

```bash
npm install @nestjs/swagger
```

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsRequired, IsEmail } from 'reslib/validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsRequired()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsRequired()
  @MinLength(8)
  password: string;
}
```

---

## 🔧 Troubleshooting

### Error: "Validation not working"

**Cause:** Global pipe not registered

**Solution:**

```typescript
// app.module.ts
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './pipes/validation.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,  // ✅ Must be APP_PIPE
      useClass: ValidationPipe,
    },
  ],
})
```

### Error: "Query parameters not validated"

**Cause:** Missing `@Type()` decorator for number/boolean conversion

**Solution:**

```typescript
import { Type } from 'class-transformer';

export class PaginationDto {
  @Type(() => Number) // ✅ Required for query params
  @IsNumber()
  page: number;
}
```

### Error: "Nested validation not working"

**Cause:** Missing `@Type()` and `@ValidateNested`

**Solution:**

```typescript
import { Type } from 'class-transformer';
import { ValidateNested } from 'reslib/validator';

export class CreateUserDto {
  @Type(() => AddressDto) // ✅ Required
  @ValidateNested(AddressDto) // ✅ Required
  address: AddressDto;
}
```

### Error: "Array validation fails"

**Cause:** Pipe doesn't handle arrays properly

**Solution:** Update your pipe:

```typescript
async transform(value: any, metadata: ArgumentMetadata) {
  const { metatype } = metadata;

  if (!metatype || !this.toValidate(metatype)) {
    return value;
  }

  // Handle both single objects and arrays
  const result = await Validator.validateTarget(metatype, {
    data: value,  // Works for both object and array
  });

  if (!result.isValid) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: result.errors,
    });
  }

  return value;
}
```

---

## 📖 Complete Example

### Full ValidationPipe Implementation

```typescript
// src/common/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Validator } from 'reslib/validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype, type, data } = metadata;

    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    this.logger.debug(`Validating ${type} parameter: ${data || 'unknown'}`);

    try {
      // Validate using reslib/validator
      const result = await Validator.validateTarget(metatype, {
        data: value,
      });

      if (!result.isValid) {
        this.logger.warn(
          `Validation failed for ${metatype.name}`,
          result.errors
        );

        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: result.errors,
          timestamp: new Date().toISOString(),
          path: data,
        });
      }

      this.logger.debug(`Validation passed for ${metatype.name}`);
      return value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Validation error', error);
      throw new BadRequestException('Validation failed');
    }
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### Module Setup

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

---

## 🔗 Next Steps

- 📖 **[Complete User Guide](./GUIDE.md)** - All 67 validation rules
- 📋 **[Rules Reference](./RULES.md)** - Quick rule lookup
- 🔧 **[API Reference](./API_REFERENCE.md)** - Full API docs
- 📊 **[Comparison Guide](./COMPARISON.md)** - vs other validators

---

## 📦 Example Repository

For a complete working example, see:

- **FinLedger AI Shared Package** - Production implementation reference

---

**Integration Type:** Custom ValidationPipe using `Validator.validateTarget()`
**Framework:** NestJS v10+
**Last Updated:** 2025-12-15
