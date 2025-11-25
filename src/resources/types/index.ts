/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import { AuthPerm } from '@/auth/types';
import { InputFormatterOptions } from '@/inputFormatter/types';
import { Dictionary, UppercaseFirst } from '@/types/dictionary';
import { MongoQuery, ResourceQueryOrderBy } from './filters';

export * from './filters';

export interface FieldBase<
  TFieldType extends FieldType = FieldType,
  TValueType = any,
> extends Partial<ResourceActionTupleObject<ResourceName>>,
    Omit<InputFormatterOptions<TFieldType, TValueType>, 'value' | 'type'> {
  /**
   * The type of the field.
   *
   * @description
   * This property specifies the type of the field, such as "text", "number", or "date".
   *
   * @default "text"
   *
   * @example
   * ```typescript
   * const textField: FieldBase = {
   *   type: 'text'
   * };
   * ```
   */
  type: TFieldType;

  /**
   * The name of the field.
   *
   * @description
   * This property specifies the unique name or identifier for the field.
   *
   * @example
   * ```typescript
   * const textField: FieldBase = {
   *   name: 'textField'
   * };
   * ```
   */
  name?: string;

  /**
   * The name of the field in the database table.
   *
   * @description
   * This property specifies the name of the field as it appears in the database table.
   *
   * @example
   * ```typescript
   * const textField: FieldBase = {
   *   databaseName: 'text_field'
   * };
   * ```
   */
  databaseName?: string;

  /**
   * The name of the field's table or collection in the database.
   *
   * @description
   * This property specifies the name of the table or collection that contains the field in the database.
   *
   * @example
   * ```typescript
   * const textField: FieldBase = {
   *   databaseTableName: 'text_fields'
   * };
   * ```
   */
  databaseTableName?: string;

  /***
   * weatherr the field is a primary key or not
   */
  primaryKey?: boolean;

  /**
   * weatherr the field is rendable or not
   * It is used to determine if the field should be rendered or not.
   */
  rendable?: boolean;

  /***
   * weatherr the field is readonly or not
   */
  readOnly?: boolean;

  /**
   * weatherr the field is disabled or not
   */
  disabled?: boolean;

  /***
   * weatherr the field is unique for the resource or not
   */
  unique?: boolean;

  /**
   * weatherr the field is required or not
   */
  required?: boolean;

  /***
   * the min length of the field
   */
  minLength?: number;
  /**
   * the max length of the field
   */
  maxLength?: number;

  /**
   * the length of the field
   */
  length?: number;

  /***
   * whether the field is visible or not
   */
  visible?: boolean;

  /***
   * The permission associated with the field. This permission is used to determine if the field will be rendered or not.
   */
  perm?: AuthPerm;

  /**
   * The default value of the field.
   */
  defaultValue?: TValueType;
}
/**
 * ## FieldMap Interface
 *
 * A global interface for defining field mappings in the resource system.
 * This interface serves as a central registry for all available field types
 * and their configurations, enabling type-safe field definitions across the application.
 *
 * ### Purpose
 * The `FieldMap` interface is designed for **module augmentation**, allowing developers
 * to extend it with custom field definitions. Each key represents a field type (e.g., "text", "number"),
 * and each value must extend the `FieldBase` interface, ensuring consistent structure
 * and type safety for all field configurations.
 *
 * ### How It Works
 * - **Empty by Design**: The interface is intentionally empty in the core library.
 * - **Module Augmentation**: Developers extend it via `declare module` statements.
 * - **Type Safety**: The `Field<T>` type uses `FieldMap[T]` to enforce that field
 *   configurations match their declared types.
 * - **Extensibility**: New field types can be added without modifying the core library.
 *
 * ### Template Parameters
 * This interface doesn't use generic parameters itself, but the values must conform to `FieldBase<TFieldType, ValueType>`.
 *
 * ### Examples
 *
 * #### Basic Module Augmentation
 * ```typescript
 * // In your application's types file (e.g., types.ts or global.d.ts)
 * import "reslib/resources";
 *
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     // Define a text field type
 *     text: FieldBase<"text", string>;
 *
 *     // Define a number field type
 *     number: FieldBase<"number", number>;
 *
 *     // Define an email field type
 *     email: FieldBase<"email", string>;
 *   }
 * }
 * ```
 *
 * #### Advanced FieldMeta Configuration
 * ```typescript
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     // Text field with validation
 *     text: FieldBase<"text", string> & {
 *       minLength?: number;
 *       maxLength?: number;
 *       pattern?: RegExp;
 *     };
 *
 *     // Number field with range constraints
 *     number: FieldBase<"number", number> & {
 *       min?: number;
 *       max?: number;
 *       step?: number;
 *     };
 *
 *     // Select field with predefined options
 *     select: FieldBase<"select", string> & {
 *       options: Array<{ label: string; value: string }>;
 *       multiple?: boolean;
 *     };
 *
 *     // Date field with format options
 *     date: FieldBase<"date", Date> & {
 *       format?: string;
 *       minDate?: Date;
 *       maxDate?: Date;
 *     };
 *   }
 * }
 * ```
 *
 * #### Using Defined Fields
 * ```typescript
 * // After augmentation, you can create type-safe fields
 * const userFields: Fields = {
 *   username: {
 *     type: "text",        // ✓ TypeScript knows this is valid
 *     name: "username",
 *     required: true,
 *     minLength: 3,        // ✓ Additional properties available
 *     maxLength: 50,
 *     forCreate: { required: true },
 *     forUpdate: { required: false }
 *   },
 *   age: {
 *     type: "number",      // ✓ TypeScript knows this is valid
 *     name: "age",
 *     min: 0,              // ✓ Range constraints available
 *     max: 150,
 *     forFilter: { allowRange: true }
 *   },
 *   email: {
 *     type: "email",       // ✓ TypeScript knows this is valid
 *     name: "email",
 *     required: true,
 *     forCreate: { required: true }
 *   }
 * };
 *
 * // TypeScript will catch invalid field types:
 * // const invalidField: Field = { type: "invalid" }; // ✗ Error: "invalid" not in FieldMap
 * ```
 *
 * #### Conditional FieldMeta Extensions
 * ```typescript
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     // Conditional field that changes behavior based on context
 *     conditional: FieldBase<"conditional", any> & {
 *       condition: (context: any) => boolean;
 *       trueField: keyof FieldMap;
 *       falseField: keyof FieldMap;
 *     };
 *   }
 * }
 * ```
 *
 * ### Best Practices
 * - **Consistent Naming**: Use lowercase strings for field type keys (e.g., "text", "number").
 * - **Extensive Properties**: Add as many type-specific properties as needed for your use case.
 * - **Documentation**: Document custom field types clearly for team members.
 * - **Versioning**: Consider the impact on existing field definitions when adding new properties.
 * - **Validation**: Use TypeScript's type system to enforce field constraints at compile time.
 *
 * ### Integration with Other Types
 * - **Field<T>**: Uses `FieldMap[T]` to create type-safe field configurations.
 * - **FieldType**: Derives from `keyof FieldMap` to constrain valid field types.
 * - **FieldBase**: Provides the base structure that all field definitions must extend.
 *
 * ### Migration Notes
 * If you're upgrading from a version where field types were defined differently,
 * update your module augmentations to use this new structure for better type safety.
 *
 * @interface FieldMap
 * @public
 *
 * @see {@link FieldBase} - The base interface that field definitions must extend
 * @see {@link Field} - How field configurations are created from this map
 * @see {@link FieldType} - The union type of all defined field types
 * @example
 * ```typescript
 * // Complete example of extending FieldMap
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     text: FieldBase<"text", string> & {
 *       minLength?: number;
 *       maxLength?: number;
 *       placeholder?: string;
 *     };
 *
 *     number: FieldBase<"number", number> & {
 *       min?: number;
 *       max?: number;
 *       step?: number;
 *     };
 *
 *     boolean: FieldBase<"boolean", boolean>;
 *
 *     date: FieldBase<"date", Date> & {
 *       format?: string;
 *     };
 *
 *     select: FieldBase<"select", string> & {
 *       options: Array<{ label: string; value: any }>;
 *       multiple?: boolean;
 *     };
 *   }
 * }
 * ```
 */
export interface FieldMap {}

/**
 * ## FieldActionsMap Interface
 *
 * A global interface defining the action contexts available for field configurations.
 * This interface serves as a central registry for all possible field action types
 * that can have different validation rules, requirements, or behaviors.
 *
 * ### Purpose
 * The `FieldActionsMap` interface defines the different contexts in which fields
 * can be used within the resource system. Each key represents an action context
 * (e.g., "create", "update", "filter"), and the corresponding string value is used
 * for type-level operations and transformations.
 *
 * ### How It Works
 * - **Action Contexts**: Defines the different operations where field behavior might differ
 * - **Type Generation**: Used by `Field<T>` to generate action-specific field overrides
 *   like `forCreate`, `forUpdate`, `forCreateOrUpdate`, and `forFilter`
 * - **Module Augmentation**: Can be extended via `declare module` for custom action contexts
 * - **String Values**: The string values are primarily used for TypeScript type manipulation
 *
 * ### Default Action Contexts
 *
 * - **create**: FieldMeta configuration when creating new resource instances
 * - **update**: FieldMeta configuration when updating existing resource instances
 * - **createOrUpdate**: FieldMeta configuration for operations that can create or update
 * - **filter**: FieldMeta configuration for filtering/searching resource instances
 *
 * ### Template Parameters
 * This interface doesn't use generic parameters itself, but serves as a foundation
 * for generating action-specific field configurations.
 *
 * ### Examples
 *
 * #### Basic Usage in FieldMeta Definitions
 * ```typescript
 * // Fields can have different configurations for different actions
 * const userFields: Fields = {
 *   password: {
 *     type: "text",
 *     required: true,
 *     minLength: 8,
 *     // Different requirements for create vs update
 *     forCreate: { required: true },  // Password required when creating
 *     forUpdate: { required: false }  // Password optional when updating
 *   },
 *   email: {
 *     type: "email",
 *     required: true,
 *     unique: true,
 *     // Email validation differs by context
 *     forCreate: { required: true, unique: true },
 *     forUpdate: { required: true, unique: true },
 *     forFilter: { required: false } // Email optional for filtering
 *   }
 * };
 * ```
 *
 * #### Module Augmentation for Custom Actions
 * ```typescript
 * // In your application's types file
 * import "reslib/resources/resources";
 *
 * declare module "reslib/resources/resources" {
 *   interface FieldActionsMap {
 *     // Add custom action contexts
 *     import: string;      // For bulk import operations
 *     export: string;      // For data export configurations
 *     validate: string;    // For validation-only contexts
 *     preview: string;     // For preview/display contexts
 *   }
 * }
 *
 * // Now you can use these in field definitions
 * const productFields: Fields = {
 *   sku: {
 *     type: "text",
 *     required: true,
 *     forCreate: { required: true },
 *     forUpdate: { required: true },
 *     forImport: { required: true, pattern: "^[A-Z0-9]+$" }, // Custom validation for imports
 *     forExport: { required: false } // SKU optional in exports
 *   }
 * };
 * ```
 *
 * #### Advanced FieldMeta Behavior Overrides
 * ```typescript
 * declare module "reslib/resources/resources" {
 *   interface FieldActionsMap {
 *     bulkUpdate: string;
 *     softDelete: string;
 *     archive: string;
 *   }
 * }
 *
 * const documentFields: Fields = {
 *   status: {
 *     type: "select",
 *     options: ["draft", "published", "archived"],
 *     required: true,
 *     forCreate: { required: true, defaultValue: "draft" },
 *     forUpdate: { required: true },
 *     forBulkUpdate: { required: false }, // Optional in bulk operations
 *     forSoftDelete: { readOnly: true },  // Can't change status when soft deleting
 *     forArchive: { required: true, allowedValues: ["archived"] } // Only allow archive status
 *   },
 *   deletedAt: {
 *     type: "date",
 *     readOnly: true,
 *     forSoftDelete: { required: true }, // Must set deletion timestamp
 *     forArchive: { required: false }    // Optional for archiving
 *   }
 * };
 * ```
 *
 * #### Conditional FieldMeta Requirements
 * ```typescript
 * const orderFields: Fields = {
 *   paymentMethod: {
 *     type: "select",
 *     options: ["credit_card", "paypal", "bank_transfer"],
 *     forCreate: { required: true },
 *     forUpdate: { required: false }, // Can't change payment method after creation
 *     forFilter: { required: false }
 *   },
 *   creditCardNumber: {
 *     type: "text",
 *     pattern: "^\\d{16}$",
 *     forCreate: {
 *       required: true,
 *       // Only required if payment method is credit card
 *       conditionalRequired: (data) => data.paymentMethod === "credit_card"
 *     },
 *     forUpdate: { readOnly: true }, // Never updatable for security
 *     forFilter: { required: false }
 *   }
 * };
 * ```
 *
 * ### Best Practices
 * - **Consistent Naming**: Use lowercase action names (e.g., "create", "update")
 * - **Semantic Actions**: Choose action names that clearly describe their purpose
 * - **Minimal Overrides**: Only override field properties when behavior genuinely differs
 * - **Security Considerations**: Use action contexts to enforce security rules
 *   (e.g., making fields read-only in certain contexts)
 * - **Documentation**: Document custom action contexts for team members
 *
 * ### Integration with Other Types
 * - **Field<T>**: Uses `FieldActionsMap` to generate action-specific properties
 * - **FieldMap**: Provides the base field configurations that can be overridden
 * - **UppercaseFirst**: Used to transform action names (e.g., "create" → "Create" → "forCreate")
 *
 * ### Migration Notes
 * When adding new action contexts, ensure that existing field definitions are
 * compatible. Consider providing default behaviors for new actions to maintain
 * backward compatibility.
 *
 * @interface FieldActionsMap
 * @public
 *
 * @see {@link Field} - How action contexts are used in field definitions
 * @see {@link FieldMap} - The base field configurations that can be overridden
 * @see {@link UppercaseFirst} - Utility for transforming action names
 * @example
 * ```typescript
 * // Complete example of extending FieldActionsMap
 * declare module "reslib/resources/resources" {
 *   interface FieldActionsMap {
 *     // Standard CRUD operations
 *     create: string;
 *     update: string;
 *     createOrUpdate: string;
 *     filter: string;
 *
 *     // Custom business logic actions
 *     approve: string;      // For approval workflows
 *     reject: string;       // For rejection workflows
 *     publish: string;      // For content publishing
 *     archive: string;      // For archiving operations
 *
 *     // Data operations
 *     import: string;       // For bulk import
 *     export: string;       // For data export
 *     migrate: string;      // For data migration
 *
 *     // Administrative actions
 *     adminUpdate: string;  // For admin-only updates
 *     systemUpdate: string; // For system-generated updates
 *   }
 * }
 *
 * // Usage in field definitions
 * const contentFields: Fields = {
 *   publishedAt: {
 *     type: "date",
 *     readOnly: true,
 *     forCreate: { required: false },
 *     forPublish: { required: true },    // Must set when publishing
 *     forUpdate: { required: false },
 *     forAdminUpdate: { required: false } // Admins can modify
 *   },
 *   approvalStatus: {
 *     type: "select",
 *     options: ["pending", "approved", "rejected"],
 *     defaultValue: "pending",
 *     forCreate: { required: false },
 *     forApprove: { required: true, allowedValues: ["approved"] },
 *     forReject: { required: true, allowedValues: ["rejected"] },
 *     forUpdate: { readOnly: true } // Status changes through specific actions
 *   }
 * };
 * ```
 */
export interface FieldActionsMap {
  create: string;
  update: string;
  createOrUpdate: string;
  filter: string;
}

/**
 * ## Field Type
 *
 * The core type representing a field configuration in the resource system.
 * This conditional type combines base field properties with action-specific overrides,
 * enabling flexible and type-safe field definitions across different operations.
 *
 * ### Purpose
 * The `Field` type serves as the primary interface for defining fields in resource schemas.
 * It provides a structured way to specify field behavior, validation rules, and operation-specific
 * customizations, ensuring type safety and consistency throughout the application.
 *
 * ### How It Works
 * This type uses TypeScript's conditional types and mapped types to dynamically construct
 * field configurations based on the field type and available actions:
 *
 * 1. **Base Configuration**: Inherits all properties from the specific field type in `FieldMap[T]`
 * 2. **Action Overrides**: Adds optional properties for each action in `FieldActionsMap`
 * 3. **Type Safety**: Ensures only valid field types and action contexts are used
 * 4. **Extensibility**: Supports module augmentation for custom field types and actions
 *
 * ### Template Parameters
 * - **T**: The field type (extends `FieldType`, which is `keyof FieldMap`). Defaults to `FieldType`.
 *
 * ### Type Construction
 * ```typescript
 * Field<T> = FieldMap[T] extends FieldBase
 *   ? FieldMap[T] & {
 *       [key in keyof FieldActionsMap as `for${UppercaseFirst<key>}`]?: Partial<FieldMap[keyof FieldMap]>
 *     }
 *   : never
 * ```
 *
 * This creates a type that includes:
 * - All base properties from `FieldMap[T]` (e.g., `type`, `name`, `required`, field-specific properties)
 * - Optional action-specific overrides like `forCreate`, `forUpdate`, `forFilter`, etc.
 *
 * ### Examples
 *
 * #### Basic Field Definition
 * ```typescript
 * // Define a text field with basic properties
 * const usernameField: Field<"text"> = {
 *   type: "text",
 *   name: "username",
 *   required: true,
 *   minLength: 3,
 *   maxLength: 50,
 *   placeholder: "Enter username"
 * };
 * ```
 *
 * #### Field with Action-Specific Overrides
 * ```typescript
 * // Field that behaves differently for different actions
 * const passwordField: Field<"text"> = {
 *   type: "text",
 *   name: "password",
 *   // Base configuration
 *   minLength: 8,
 *   pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
 *
 *   // Action-specific overrides
 *   forCreate: {
 *     required: true,        // Password required when creating
 *     minLength: 8          // Minimum length for creation
 *   },
 *   forUpdate: {
 *     required: false,       // Password optional when updating
 *     minLength: 0           // No minimum when updating (keep existing)
 *   },
 *   forFilter: {
 *     required: false,       // Not used in filtering
 *     minLength: 0
 *   }
 * };
 * ```
 *
 * #### Complex Field with Multiple Overrides
 * ```typescript
 * const statusField: Field<"select"> = {
 *   type: "select",
 *   name: "status",
 *   required: true,
 *   options: ["draft", "published", "archived"],
 *   defaultValue: "draft",
 *
 *   // Different validation rules per action
 *   forCreate: {
 *     required: false,       // Optional during creation
 *     defaultValue: "draft"  // Default to draft
 *   },
 *   forUpdate: {
 *     required: true,        // Required during updates
 *     allowedValues: ["published", "archived"] // Can't go back to draft
 *   },
 *   forFilter: {
 *     required: false,       // Optional in filters
 *     multiple: true         // Allow multiple values in filters
 *   }
 * };
 * ```
 *
 * #### Field Collection Usage
 * ```typescript
 * // Using fields in a resource definition
 * const userFields: Fields = {
 *   id: {
 *     type: "uuid",
 *     name: "id",
 *     primaryKey: true,
 *     readOnly: true
 *   },
 *   username: {
 *     type: "text",
 *     name: "username",
 *     required: true,
 *     minLength: 3,
 *     maxLength: 50,
 *     forCreate: { required: true },
 *     forUpdate: { required: true }
 *   },
 *   email: {
 *     type: "email",
 *     name: "email",
 *     required: true,
 *     unique: true,
 *     forCreate: { required: true, unique: true },
 *     forUpdate: { required: true, unique: true }
 *   },
 *   role: {
 *     type: "select",
 *     name: "role",
 *     options: ["admin", "user", "moderator"],
 *     defaultValue: "user",
 *     forCreate: { required: false },
 *     forUpdate: { required: true, allowedValues: ["admin", "user"] }
 *   }
 * };
 * ```
 *
 * #### Type-Safe Field Access
 * ```typescript
 * // TypeScript ensures type safety
 * function processField<T extends FieldType>(field: Field<T>) {
 *   // field.type is guaranteed to be T
 *   // field.name is always available
 *   // Action overrides are optional and type-safe
 *
 *   if (field.forCreate) {
 *     console.log("Create-specific config:", field.forCreate);
 *   }
 *
 *   if (field.forUpdate) {
 *     console.log("Update-specific config:", field.forUpdate);
 *   }
 * }
 * ```
 *
 * #### Advanced Usage with Custom Field Types
 * ```typescript
 * // After extending FieldMap with custom types
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     richText: FieldBase<"richText", string> & {
 *       toolbar: string[];
 *       maxLength: number;
 *       allowedFormats: string[];
 *     };
 *     dateRange: FieldBase<"dateRange", { start: Date; end: Date }> & {
 *       minDate?: Date;
 *       maxDate?: Date;
 *       format: string;
 *     };
 *   }
 * }
 *
 * // Now you can use these custom types
 * const contentField: Field<"richText"> = {
 *   type: "richText",
 *   name: "content",
 *   toolbar: ["bold", "italic", "link"],
 *   maxLength: 10000,
 *   allowedFormats: ["html", "markdown"],
 *   forCreate: { required: true },
 *   forUpdate: { required: false }
 * };
 *
 * const dateRangeField: Field<"dateRange"> = {
 *   type: "dateRange",
 *   name: "eventDates",
 *   format: "YYYY-MM-DD",
 *   minDate: new Date(),
 *   forFilter: { required: false }
 * };
 * ```
 *
 * ### Action-Specific Properties
 * The `Field` type automatically generates properties for each action defined in `FieldActionsMap`:
 *
 * - **`forCreate`**: Configuration when creating new resource instances
 * - **`forUpdate`**: Configuration when updating existing resource instances
 * - **`forCreateOrUpdate`**: Configuration for operations that can create or update
 * - **`forFilter`**: Configuration for filtering/searching resource instances
 *
 * Each action property is optional and can contain any subset of properties from any field type,
 * allowing flexible customization of field behavior per operation.
 *
 * ### Best Practices
 * - **Consistent Base Properties**: Define common properties (like `name`, `type`) at the base level
 * - **Minimal Overrides**: Only specify action-specific properties when behavior genuinely differs
 * - **Type Safety**: Leverage TypeScript's inference for field types and action properties
 * - **Documentation**: Document custom field types and their action-specific behaviors
 * - **Validation**: Use action overrides to enforce security rules and business logic
 *
 * ### Integration with Other Types
 * - **`FieldMap`**: Provides the base field type definitions
 * - **`FieldActionsMap`**: Defines available action contexts
 * - **`Fields`**: Collection of fields for resource definitions
 * - **`FieldBase`**: Common base properties for all field types
 * - **`FieldType`**: Union of all valid field type keys
 *
 * ### Migration Notes
 * When upgrading from simpler field definitions, gradually add action-specific overrides
 * to maintain backward compatibility. The base properties remain available and functional
 * even when action overrides are not specified.
 *
 * @type Field
 * @template T - The field type (must be a key of FieldMap)
 * @default FieldType
 * @public
 *
 * @see {@link FieldMap} - The interface defining field type configurations
 * @see {@link FieldActionsMap} - The interface defining action contexts
 * @see {@link FieldBase} - The base properties shared by all field types
 * @see {@link Fields} - How fields are collected into resource schemas
 * @example
 * ```typescript
 * // Complete example of field definitions with action overrides
 * import "reslib/resources/resources";
 *
 * declare module "reslib/resources/resources" {
 *   interface FieldMap {
 *     text: FieldBase<"text", string> & {
 *       minLength?: number;
 *       maxLength?: number;
 *       pattern?: RegExp;
 *       placeholder?: string;
 *     };
 *     select: FieldBase<"select", string> & {
 *       options: string[];
 *       multiple?: boolean;
 *       defaultValue?: string;
 *     };
 *     number: FieldBase<"number", number> & {
 *       min?: number;
 *       max?: number;
 *       step?: number;
 *     };
 *   }
 * }
 *
 * // Define a comprehensive user resource schema
 * const userFields: Fields = {
 *   username: {
 *     type: "text",
 *     name: "username",
 *     required: true,
 *     minLength: 3,
 *     maxLength: 50,
 *     pattern: /^[a-zA-Z0-9_]+$/,
 *     forCreate: { required: true },
 *     forUpdate: { required: true },
 *     forFilter: { required: false }
 *   } as Field<"text">,
 *
 *   email: {
 *     type: "email",
 *     name: "email",
 *     required: true,
 *     forCreate: { required: true },
 *     forUpdate: { required: true },
 *     forFilter: { required: false }
 *   } as Field<"text">, // email extends text with validation
 *
 *   role: {
 *     type: "select",
 *     name: "role",
 *     options: ["admin", "user", "moderator"],
 *     defaultValue: "user",
 *     forCreate: { required: false },
 *     forUpdate: { required: true },
 *     forFilter: { required: false, multiple: true }
 *   } as Field<"select">,
 *
 *   age: {
 *     type: "number",
 *     name: "age",
 *     min: 0,
 *     max: 150,
 *     forCreate: { required: false },
 *     forUpdate: { required: false },
 *     forFilter: { required: false, min: 18, max: 100 }
 *   } as Field<"number">
 * };
 *
 * // Type-safe usage
 * function validateField(field: Field, action: keyof FieldActionsMap, value: any): boolean {
 *   const actionConfig = field[`for${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Field];
 *
 *   if (actionConfig && 'required' in actionConfig) {
 *     if (actionConfig.required && (value === undefined || value === null)) {
 *       return false;
 *     }
 *   }
 *
 *   // Additional validation logic...
 *   return true;
 * }
 * ```
 */
export type Field<T extends FieldType = FieldType> =
  FieldMap[T] extends FieldBase
    ? FieldMap[T] & {
        [key in keyof FieldActionsMap as `for${UppercaseFirst<key>}`]?: Partial<
          FieldMap[keyof FieldMap]
        >;
      }
    : never;

/**
 * Type representing a collection of fields where each key is a string and each value is an Field.
 * This type is used to define the structure of fields for a resource or form.
 *
 * This type provides a flexible way to define multiple fields with their configurations,
 * validation rules, and action-specific overrides. It's commonly used when defining
 * the schema for resources, forms, or data validation.
 *
 * @type Fields
 *
 * @example
 * ```typescript
 * // Basic field collection for a user resource
 * const userFields: Fields = {
 *   username: {
 *     type: "text",
 *     name: "username",
 *     required: true,
 *     minLength: 3,
 *     maxLength: 50,
 *     forCreate: { required: true },
 *     forUpdate: { required: false }
 *   },
 *   email: {
 *     type: "email",
 *     name: "email",
 *     required: true,
 *     unique: true,
 *     forCreate: { required: true },
 *     forUpdate: { required: true }
 *   },
 *   age: {
 *     type: "number",
 *     name: "age",
 *     required: false,
 *     min: 0,
 *     max: 150,
 *     forFilter: { allowRange: true }
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic field collection based on user permissions
 * function createFieldsForUser(userRole: string): Fields {
 *   const baseFields: Fields = {
 *     id: { type: "uuid", name: "id", primaryKey: true, readOnly: true },
 *     createdAt: { type: "date", name: "createdAt", readOnly: true },
 *     updatedAt: { type: "date", name: "updatedAt", readOnly: true }
 *   };
 *
 *   if (userRole === 'admin') {
 *     return {
 *       ...baseFields,
 *       adminNotes: {
 *         type: "textarea",
 *         name: "adminNotes",
 *         required: false,
 *         maxLength: 1000
 *       },
 *       isActive: {
 *         type: "boolean",
 *         name: "isActive",
 *         required: true,
 *         defaultValue: true
 *       }
 *     };
 *   }
 *
 *   return baseFields;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Form validation using field collection
 * function validateFormData(fields: Fields, data: Record<string, any>): ValidationResult {
 *   const errors: string[] = [];
 *
 *   for (const [fieldName, fieldConfig] of Object.entries(fields)) {
 *     const value = data[fieldName];
 *
 *     // Check required fields
 *     if (fieldConfig.required && (value === undefined || value === null || value === '')) {
 *       errors.push(`${fieldConfig.name || fieldName} is required`);
 *     }
 *
 *     // Check string length constraints
 *     if (typeof value === 'string') {
 *       if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
 *         errors.push(`${fieldName} must be at least ${fieldConfig.minLength} characters`);
 *       }
 *       if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
 *         errors.push(`${fieldName} must be at most ${fieldConfig.maxLength} characters`);
 *       }
 *     }
 *   }
 *
 *   return { isValid: errors.length === 0, errors };
 * }
 * ```
 */
export type Fields = Record<string, Field>;

/**
 * Type representing the union of all possible field types defined in FieldMap.
 * This type is used to constrain field types to only those defined in the field map.
 *
 * This type ensures type safety by only allowing field types that have been
 * explicitly defined in the FieldMap interface. It prevents typos and ensures
 * that all field types are known and properly configured.
 *
 * @type FieldType
 *
 * @example
 * ```typescript
 * // Basic usage - defining a field with a valid type
 * const textField: FieldBase<"text"> = {
 *   type: "text", // ✓ Valid - "text" is in FieldMap
 *   name: "username",
 *   required: true
 * };
 *
 * const emailField: FieldBase<"email"> = {
 *   type: "email", // ✓ Valid - "email" is in FieldMap
 *   name: "userEmail",
 *   required: true
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe field type checking
 * function createField<T extends FieldType>(
 *   type: T,
 *   config: Omit<FieldBase<T>, 'type'>
 * ): FieldBase<T> {
 *   return { type, ...config };
 * }
 *
 * // Usage with type safety
 * const numberField = createField("number", {
 *   name: "age",
 *   required: true,
 *   min: 0,
 *   max: 150
 * });
 *
 * const dateField = createField("date", {
 *   name: "birthDate",
 *   required: false
 * });
 *
 * // This would cause a TypeScript error:
 * // const invalidField = createField("invalidType", { name: "test" });
 * // Error: "invalidType" is not assignable to FieldType
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic field type validation
 * function isValidFieldType(type: string): type is FieldType {
 *   const validTypes: FieldType[] = ["text", "number", "boolean", "date", "email"];
 *   return validTypes.includes(type as FieldType);
 * }
 *
 * // Usage in runtime validation
 * function validateFieldType(input: string): FieldType {
 *   if (!isValidFieldType(input)) {
 *     throw new Error(`Invalid field type: ${input}. Valid types are: text, number, boolean, date, email`);
 *   }
 *   return input;
 * }
 *
 * // Safe usage
 * const fieldType = validateFieldType("text"); // ✓ Valid
 * // const invalidType = validateFieldType("invalid"); // ✗ Throws error
 * ```
 */
export type FieldType = keyof FieldMap;

/**
 * ## Resources Interface
 *
 * A global interface for defining resource configurations in the application.
 * This interface serves as a central registry for all available resources and their
 * metadata, enabling type-safe resource management across the entire codebase.
 *
 * ### Purpose
 * The `Resources` interface is designed for **module augmentation**, allowing developers
 * to extend it with custom resource definitions. Each key represents a resource name
 * (e.g., "users", "posts", "products"), and each value must conform to the `ResourceBase` interface,
 * ensuring consistent structure and type safety for all resource configurations.
 *
 * ### How It Works
 * - **Empty by Design**: The interface is intentionally empty in the core library.
 * - **Module Augmentation**: Developers extend it via `declare module` statements.
 * - **Type Safety**: The `ResourceConfig<T>`, `ResourceName`, and other types use `Resources[K]`
 *   to enforce that resource configurations match their declared types.
 * - **Extensibility**: New resources can be added without modifying the core library.
 *
 * ### Template Parameters
 * This interface doesn't use generic parameters itself, but the values must conform to `ResourceBase<Name, DataType, TPrimaryKey, Actions>`.
 *
 * ### Examples
 *
 * #### Basic Module Augmentation
 * ```typescript
 * // In your application's types file (e.g., types.ts or global.d.ts)
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     // Define a users resource
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         delete: { label: "Delete User" };
 *       }
 *     };
 *
 *     // Define a posts resource
 *     posts: {
 *       actions: {
 *         read: { label: "Read Post" };
 *         create: { label: "Create Post" };
 *         publish: { label: "Publish Post" };
 *         archive: { label: "Archive Post" };
 *       }
 *     };
 *   }
 * }
 * ```
 *
 * #### Advanced Resource Configuration
 * ```typescript
 * declare module "reslib/resources" {
 *   interface Resources {
 *     // User resource with comprehensive actions
 *     users: {
 *       actions: {
 *         read: { label: "Read User", title: "View user details" };
 *         create: { label: "Create User", title: "Add new user" };
 *         update: { label: "Update User", title: "Modify user data" };
 *         delete: { label: "Delete User", title: "Remove user" };
 *         activate: { label: "Activate User", title: "Enable user account" };
 *         deactivate: { label: "Deactivate User", title: "Disable user account" };
 *         resetPassword: { label: "Reset Password", title: "Send password reset" };
 *       }
 *     };
 *
 *     // Product resource with inventory management
 *     products: {
 *       actions: {
 *         read: { label: "View Product" };
 *         create: { label: "Add Product" };
 *         update: { label: "Edit Product" };
 *         delete: { label: "Remove Product" };
 *         restock: { label: "Restock Product" };
 *         discontinue: { label: "Discontinue Product" };
 *       }
 *     };
 *
 *     // Order resource with workflow actions
 *     orders: {
 *       actions: {
 *         read: { label: "View Order" };
 *         create: { label: "Create Order" };
 *         update: { label: "Update Order" };
 *         cancel: { label: "Cancel Order" };
 *         ship: { label: "Ship Order" };
 *         deliver: { label: "Mark Delivered" };
 *         refund: { label: "Process Refund" };
 *       }
 *     };
 *   }
 * }
 * ```
 *
 * #### Using Defined Resources
 * ```typescript
 * // After augmentation, you can use type-safe resource operations
 * import { ResourceConfig, ResourceName, ResourceActions } from "reslib/resources";
 *
 * // Type-safe resource access
 * type UserResource = ResourceConfig<"users">;
 * type PostResource = ResourceConfig<"posts">;
 *
 * // Type-safe action names
 * type UserActionNames = ResourceActionName<"users">;
 * // Result: "read" | "create" | "update" | "delete" | "activate" | "deactivate" | "resetPassword"
 *
 * // Type-safe action access
 * type UserActions = ResourceActions<"users">;
 * // Result: Complete actions record for users resource
 *
 * // Runtime usage with type safety
 * function processUserAction(action: UserActionNames, userId: string) {
 *   console.log(`Processing ${action} for user ${userId}`);
 *
 *   // TypeScript ensures action is a valid user action
 *   switch (action) {
 *     case "create":
 *       return createUser();
 *     case "activate":
 *       return activateUser(userId);
 *     case "resetPassword":
 *       return resetUserPassword(userId);
 *     // TypeScript will catch invalid actions
 *   }
 * }
 * ```
 *
 * #### Resource Registry Implementation
 * ```typescript
 * // Create a type-safe resource registry
 * class ResourceRegistry {
 *   private resources = new Map<ResourceName, ResourceConfig<ResourceName>>();
 *
 *   register<TResourceName extends ResourceName>(
 *     name: TResourceName,
 *     config: ResourceConfig<TResourceName>
 *   ) {
 *     this.resources.set(name, config);
 *   }
 *
 *   get<TResourceName extends ResourceName>(
 *     name: TResourceName
 *   ): ResourceConfig<TResourceName> | undefined {
 *     return this.resources.get(name) as ResourceConfig<TResourceName>;
 *   }
 *
 *   getAllActions<TResourceName extends ResourceName>(
 *     name: TResourceName
 *   ): ResourceActions<TResourceName> {
 *     const resource = this.get(name);
 *     if (!resource) throw new Error(`Resource ${name} not found`);
 *     return resource.actions;
 *   }
 * }
 *
 * // Usage
 * const registry = new ResourceRegistry();
 *
 * registry.register("users", {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   }
 * });
 *
 * const userActions = registry.getAllActions("users");
 * // TypeScript knows this contains only user actions
 * ```
 *
 * #### Permission System Integration
 * ```typescript
 * // Define permissions based on resource actions
 * type Permission<TResourceName extends ResourceName> = {
 *   resource: TResourceName;
 *   action: ResourceActionName<TResourceName>;
 *   granted: boolean;
 * };
 *
 * class PermissionManager {
 *   private permissions = new Map<string, Permission<ResourceName>>();
 *
 *   grant<TResourceName extends ResourceName>(
 *     resource: TResourceName,
 *     action: ResourceActionName<TResourceName>
 *   ) {
 *     const key = `${resource}:${action}`;
 *     this.permissions.set(key, { resource, action, granted: true });
 *   }
 *
 *   check<TResourceName extends ResourceName>(
 *     resource: TResourceName,
 *     action: ResourceActionName<TResourceName>
 *   ): boolean {
 *     const key = `${resource}:${action}`;
 *     return this.permissions.get(key)?.granted ?? false;
 *   }
 * }
 *
 * // Usage
 * const permManager = new PermissionManager();
 *
 * permManager.grant("users", "create");
 * permManager.grant("users", "update");
 * permManager.grant("posts", "publish");
 *
 * // Type-safe permission checks
 * if (permManager.check("users", "create")) {
 *   // User can create users
 * }
 *
 * // This would cause a TypeScript error:
 * // permManager.check("users", "invalidAction"); // ✗ Error: not a valid user action
 * ```
 *
 * ### Best Practices
 * - **Consistent Naming**: Use lowercase, plural resource names (e.g., "users", "products").
 * - **Comprehensive Actions**: Define all relevant actions for each resource's lifecycle.
 * - **Documentation**: Document custom resources and their actions clearly for team members.
 * - **Versioning**: Consider the impact on existing code when adding new resources or actions.
 * - **Validation**: Use TypeScript's type system to enforce resource constraints at compile time.
 *
 * ### Integration with Other Types
 * - **ResourceConfig<T>**: Provides type-safe access to individual resource configurations.
 * - **ResourceName**: Union type of all defined resource names.
 * - **ResourceActions<T>**: Type-safe access to a resource's actions.
 * - **ResourceActionName<T>**: Union type of action names for a specific resource.
 * - **ResourceBase**: The base interface that all resource definitions must implement.
 *
 * ### Migration Notes
 * If you're upgrading from a version where resources were defined differently,
 * update your module augmentations to use this new structure for better type safety.
 * Existing code using the old structure may need to be updated to match the new interface.
 *
 * @interface Resources
 * @public
 *
 * @see {@link ResourceBase} - The base interface that resource definitions must implement
 * @see {@link ResourceConfig} - How to access individual resource configurations
 * @see {@link ResourceName} - The union type of all defined resource names
 * @see {@link ResourceActions} - How to access resource actions with type safety
 * @example
 * ```typescript
 * // Complete example of extending Resources
 * declare module "reslib/resources" {
 *   interface Resources {
 *     // User management resource
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         delete: { label: "Delete User" };
 *         activate: { label: "Activate User" };
 *         deactivate: { label: "Deactivate User" };
 *       }
 *     };
 *
 *     // Content management resource
 *     posts: {
 *       actions: {
 *         read: { label: "Read Post" };
 *         create: { label: "Create Post" };
 *         update: { label: "Update Post" };
 *         delete: { label: "Delete Post" };
 *         publish: { label: "Publish Post" };
 *         archive: { label: "Archive Post" };
 *       }
 *     };
 *
 *     // E-commerce resource
 *     products: {
 *       actions: {
 *         read: { label: "View Product" };
 *         create: { label: "Add Product" };
 *         update: { label: "Edit Product" };
 *         delete: { label: "Remove Product" };
 *         restock: { label: "Restock Product" };
 *         discontinue: { label: "Discontinue Product" };
 *       }
 *     };
 *
 *     // Order management resource
 *     orders: {
 *       actions: {
 *         read: { label: "View Order" };
 *         create: { label: "Create Order" };
 *         update: { label: "Update Order" };
 *         cancel: { label: "Cancel Order" };
 *         ship: { label: "Ship Order" };
 *         deliver: { label: "Mark Delivered" };
 *         refund: { label: "Process Refund" };
 *       }
 *     };
 *   }
 * }
 *
 * // Usage examples with type safety
 * type UserResource = ResourceConfig<"users">;
 * type UserActions = ResourceActionName<"users">;
 *
 * function handleUserAction(action: UserActions, userId: string) {
 *   // TypeScript ensures action is a valid user action
 *   console.log(`Handling ${action} for user ${userId}`);
 * }
 *
 * // Valid usage
 * handleUserAction("create", "123");
 * handleUserAction("activate", "456");
 *
 * // Invalid usage (TypeScript error)
 * // handleUserAction("invalidAction", "123"); // ✗ Error
 * ```
 */
export interface Resources {}

type ValidatedResources = {
  [K in keyof Resources]: ValidateResource<Resources[K]>;
};

type ValidateResource<T> = T extends ResourceBase ? T : never;

/**
 * ## ResourceName Type
 *
 * A union type representing all valid resource names defined in the global Resources interface.
 * This type provides compile-time safety by ensuring that only resources that have been
 * properly defined and validated can be referenced throughout the application.
 *
 * ### Purpose
 * The `ResourceName` type serves as the foundation for type-safe resource operations by
 * creating a union of all resource names that have been defined via module augmentation.
 * It ensures that developers can only reference resources that actually exist and conform
 * to the expected structure, preventing typos and invalid resource references.
 *
 * ### How It Works
 * - **Module Augmentation**: Resources are defined by extending the `Resources` interface
 * - **Validation**: `ValidatedResources` ensures each resource implements `ResourceBase`
 * - **Key Extraction**: `keyof ValidatedResources` creates a union of all valid resource names
 * - **Type Safety**: Any operation using `ResourceName` is guaranteed to reference a valid resource
 *
 * ### Type Construction
 * ```typescript
 * ResourceName = keyof ValidatedResources
 * ```
 *
 * Where `ValidatedResources` maps each resource to its validated configuration.
 *
 * ### Examples
 *
 * #### Basic Resource Definition and Usage
 * ```typescript
 * // Define resources via module augmentation
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *       }
 *     };
 *     posts: {
 *       actions: {
 *         read: { label: "Read Post" };
 *         create: { label: "Create Post" };
 *         publish: { label: "Publish Post" };
 *       }
 *     };
 *     products: {
 *       actions: {
 *         read: { label: "View Product" };
 *         create: { label: "Add Product" };
 *         update: { label: "Edit Product" };
 *       }
 *     };
 *   }
 * }
 *
 * // ResourceName automatically becomes: "users" | "posts" | "products"
 * type AvailableResources = ResourceName; // "users" | "posts" | "products"
 *
 * // Type-safe resource operations
 * function getResourceConfig(name: ResourceName): ResourceConfig<ResourceName> {
 *   // TypeScript ensures name is a valid resource
 *   return getResourceConfiguration(name);
 * }
 *
 * getResourceConfig("users");    // ✓ Valid
 * getResourceConfig("posts");    // ✓ Valid
 * getResourceConfig("products"); // ✓ Valid
 * // getResourceConfig("invalid"); // ✗ TypeScript error
 * ```
 *
 * #### Generic Functions with Resource Names
 * ```typescript
 * // Generic function that works with any resource
 * function createResourceHandler<T extends ResourceName>(resourceName: T) {
 *   return {
 *     name: resourceName,
 *     config: {} as ResourceConfig<T>,
 *     actions: [] as ResourceActionName<T>[]
 *   };
 * }
 *
 * // Usage with type safety
 * const userHandler = createResourceHandler("users");
 * // TypeScript knows this is specifically for users
 *
 * const postHandler = createResourceHandler("posts");
 * // TypeScript knows this is specifically for posts
 * ```
 *
 * #### Resource Registry with Type Safety
 * ```typescript
 * // Type-safe resource registry
 * class ResourceRegistry {
 *   private resources = new Map<ResourceName, ResourceConfig<ResourceName>>();
 *
 *   register<T extends ResourceName>(
 *     name: T,
 *     config: ResourceConfig<T>
 *   ): void {
 *     this.resources.set(name, config);
 *   }
 *
 *   get<T extends ResourceName>(name: T): ResourceConfig<T> | undefined {
 *     return this.resources.get(name) as ResourceConfig<T> | undefined;
 *   }
 *
 *   has(name: ResourceName): boolean {
 *     return this.resources.has(name);
 *   }
 *
 *   getAllResourceNames(): ResourceName[] {
 *     return Array.from(this.resources.keys());
 *   }
 * }
 *
 * // Usage
 * const registry = new ResourceRegistry();
 *
 * registry.register("users", {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" }
 *   }
 * });
 *
 * registry.register("posts", {
 *   actions: {
 *     read: { label: "Read Post" },
 *     create: { label: "Create Post" }
 *   }
 * });
 *
 * // Type-safe access
 * const userConfig = registry.get("users"); // ResourceConfig<"users">
 * const postConfig = registry.get("posts"); // ResourceConfig<"posts">
 * ```
 *
 * #### Permission System with Resource Names
 * ```typescript
 * // Permission type using ResourceName
 * type ResourcePermission = {
 *   resource: ResourceName;
 *   action: string; // Could be ResourceActionName<ResourceName> for full type safety
 *   granted: boolean;
 * };
 *
 * class PermissionManager {
 *   private permissions = new Map<string, ResourcePermission>();
 *
 *   grantPermission(resource: ResourceName, action: string): void {
 *     const key = `${resource}:${action}`;
 *     this.permissions.set(key, { resource, action, granted: true });
 *   }
 *
 *   checkPermission(resource: ResourceName, action: string): boolean {
 *     const key = `${resource}:${action}`;
 *     return this.permissions.get(key)?.granted ?? false;
 *   }
 *
 *   getAllPermissionsForResource(resource: ResourceName): ResourcePermission[] {
 *     return Array.from(this.permissions.values())
 *       .filter(perm => perm.resource === resource);
 *   }
 * }
 *
 * // Usage
 * const permManager = new PermissionManager();
 *
 * permManager.grantPermission("users", "read");
 * permManager.grantPermission("users", "create");
 * permManager.grantPermission("posts", "read");
 *
 * permManager.checkPermission("users", "read");    // true
 * permManager.checkPermission("users", "delete");  // false
 * permManager.checkPermission("invalid", "read");  // ✗ TypeScript error
 * ```
 *
 * #### API Route Generation
 * ```typescript
 * // Generate API routes for all defined resources
 * function generateApiRoutes(resources: ResourceName[]): string[] {
 *   const routes: string[] = [];
 *
 *   for (const resource of resources) {
 *     routes.push(`/api/${resource}`);
 *     routes.push(`/api/${resource}/:id`);
 *   }
 *
 *   return routes;
 * }
 *
 * // Usage
 * const allRoutes = generateApiRoutes(["users", "posts", "products"]);
 * // Result: ["/api/users", "/api/users/:id", "/api/posts", "/api/posts/:id", ...]
 * ```
 *
 * ### Best Practices
 * - **Module Augmentation**: Always define resources via `declare module` to extend the `Resources` interface
 * - **Consistent Naming**: Use lowercase, plural resource names (e.g., "users", "products", "orders")
 * - **Type Constraints**: Use `T extends ResourceName` in generic functions for type safety
 * - **Validation**: Resources must implement `ResourceBase` to be included in `ResourceName`
 * - **Documentation**: Document custom resources and their purposes for team members
 *
 * ### Integration with Other Types
 * - **`Resources`**: The global interface that defines all resource configurations
 * - **`ResourceConfig<T>`**: Provides type-safe access to individual resource configurations
 * - **`ResourceActionName<T>`**: Union type of action names for a specific resource
 * - **`ResourceActions<T>`**: Type-safe access to a resource's actions
 * - **`ResourceBase`**: The base interface that all resources must implement
 *
 * ### Migration Notes
 * When adding new resources, ensure they are defined via module augmentation of the `Resources`
 * interface. The `ResourceName` type will automatically include new resources without requiring
 * code changes elsewhere. Existing code using string literals for resource names can be updated
 * to use `ResourceName` for better type safety.
 *
 * @type ResourceName
 * @public
 *
 * @see {@link Resources} - The global interface defining all resource configurations
 * @see {@link ResourceConfig} - How to access individual resource configurations
 * @see {@link ResourceActionName} - Action names for specific resources
 * @example
 * ```typescript
 * // Complete example of using ResourceName for type safety
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         delete: { label: "Delete User" };
 *       };
 *       permissions: {
 *         adminOnly: string[];
 *         publicAccess: string[];
 *       };
 *     };
 *
 *     posts: {
 *       actions: {
 *         read: { label: "Read Post" };
 *         create: { label: "Create Post" };
 *         publish: { label: "Publish Post" };
 *         archive: { label: "Archive Post" };
 *       };
 *       categories: string[];
 *     };
 *
 *     products: {
 *       actions: {
 *         read: { label: "View Product" };
 *         create: { label: "Add Product" };
 *         update: { label: "Edit Product" };
 *         discontinue: { label: "Discontinue Product" };
 *       };
 *       pricing: {
 *         currency: string;
 *         taxRate: number;
 *       };
 *     };
 *   }
 * }
 *
 * // ResourceName is automatically: "users" | "posts" | "products"
 * type AvailableResources = ResourceName;
 *
 * // Type-safe resource operations
 * function processResource<T extends ResourceName>(name: T) {
 *   console.log(`Processing resource: ${name}`);
 *
 *   // TypeScript knows the exact configuration available
 *   const config = {} as ResourceConfig<T>;
 *
 *   // TypeScript knows the exact actions available
 *   const actions = [] as ResourceActionName<T>[];
 *
 *   return { name, config, actions };
 * }
 *
 * // Usage with full type safety
 * const userProcessor = processResource("users");
 * // userProcessor.name: "users"
 * // userProcessor.config: ResourceConfig<"users">
 * // userProcessor.actions: ResourceActionName<"users">[]
 *
 * const postProcessor = processResource("posts");
 * // postProcessor.name: "posts"
 * // postProcessor.config: ResourceConfig<"posts">
 * // postProcessor.actions: ResourceActionName<"posts">[]
 *
 * // Invalid usage (TypeScript errors)
 * // processResource("invalidResource"); // ✗ Error: not in ResourceName
 * ```
 */
export type ResourceName = keyof ValidatedResources;

/**
 * ## ResourceConfig Type
 *
 * A type-safe accessor for individual resource configurations from the global Resources interface.
 * This type provides compile-time guarantees that resource configurations conform to the expected structure
 * and enables type-safe operations on specific resources throughout the application.
 *
 * ### Purpose
 * The `ResourceConfig` type serves as a bridge between the global `Resources` interface and individual
 * resource operations. It ensures that when you reference a specific resource by name, you get the
 * exact configuration defined for that resource, with full type safety and IntelliSense support.
 *
 * ### How It Works
 * This type uses TypeScript's indexed access types to extract the configuration for a specific resource:
 *
 * 1. **Type Validation**: Leverages `ValidatedResources` to ensure the resource configuration
 *    implements the `ResourceBase` interface
 * 2. **Indexed Access**: Uses `ValidatedResources[TResourceName]` to extract the specific resource config
 * 3. **Type Safety**: Provides compile-time guarantees about the structure and available actions
 * 4. **Extensibility**: Automatically reflects changes when new resources are added via module augmentation
 *
 * ### Template Parameters
 * - **TResourceName**: The name of the resource (must be a key of the Resources interface).
 *   This parameter is constrained to `ResourceName`, ensuring only defined resources can be accessed.
 *
 * ### Type Construction
 * ```typescript
 * ResourceConfig<TResourceName> = ValidatedResources[TResourceName]
 * ```
 *
 * Where `ValidatedResources` ensures each resource configuration extends `ResourceBase`.
 *
 * ### Examples
 *
 * #### Basic Resource Access
 * ```typescript
 * // After defining resources via module augmentation
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *       }
 *     };
 *     posts: {
 *       actions: {
 *         read: { label: "Read Post" };
 *         create: { label: "Create Post" };
 *         publish: { label: "Publish Post" };
 *       }
 *     };
 *   }
 * }
 *
 * // Type-safe access to resource configurations
 * type UserConfig = ResourceConfig<"users">;
 * // Result: The complete configuration object for the users resource
 *
 * type PostConfig = ResourceConfig<"posts">;
 * // Result: The complete configuration object for the posts resource
 * ```
 *
 * #### Type-Safe Resource Operations
 * ```typescript
 * // Function that works with any resource configuration
 * function createResourceHandler<TResourceName extends ResourceName>(
 *   resourceName: TResourceName,
 *   config: ResourceConfig<TResourceName>
 * ) {
 *   console.log(`Setting up handlers for ${resourceName}`);
 *
 *   // TypeScript knows the exact actions available for this resource
 *   for (const actionName in config.actions) {
 *     console.log(`Action: ${actionName}`);
 *     // actionName is typed as keyof config.actions
 *   }
 *
 *   return {
 *     getConfig: (): ResourceConfig<TResourceName> => config,
 *     getActionNames: (): (keyof ResourceConfig<TResourceName>['actions'])[] => {
 *       return Object.keys(config.actions) as (keyof ResourceConfig<TResourceName>['actions'])[];
 *     }
 *   };
 * }
 *
 * // Usage with type safety
 * const userHandler = createResourceHandler("users", {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   }
 * });
 *
 * // TypeScript ensures only valid user actions are used
 * const userActions = userHandler.getActionNames();
 * // Result: ("read" | "create" | "update")[]
 * ```
 *
 * #### Resource Registry with Type Safety
 * ```typescript
 * // Type-safe resource registry
 * class ResourceRegistry {
 *   private resources = new Map<ResourceName, ResourceConfig<ResourceName>>();
 *
 *   register<TResourceName extends ResourceName>(
 *     name: TResourceName,
 *     config: ResourceConfig<TResourceName>
 *   ) {
 *     this.resources.set(name, config);
 *   }
 *
 *   get<TResourceName extends ResourceName>(
 *     name: TResourceName
 *   ): ResourceConfig<TResourceName> | undefined {
 *     return this.resources.get(name) as ResourceConfig<TResourceName> | undefined;
 *   }
 *
 *   getAllActions<TResourceName extends ResourceName>(
 *     name: TResourceName
 *   ): ResourceConfig<TResourceName>['actions'] {
 *     const resource = this.get(name);
 *     if (!resource) throw new Error(`Resource ${name} not found`);
 *     return resource.actions;
 *   }
 * }
 *
 * // Usage
 * const registry = new ResourceRegistry();
 *
 * registry.register("users", {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   }
 * });
 *
 * const userConfig = registry.get("users");
 * // TypeScript knows this is ResourceConfig<"users">
 *
 * const userActions = registry.getAllActions("users");
 * // TypeScript knows this contains only user actions
 * ```
 *
 * #### Advanced Configuration with Custom Properties
 * ```typescript
 * // Resources with additional configuration properties
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *       };
 *       // Custom properties
 *       permissions: {
 *         adminOnly: string[];
 *         publicAccess: string[];
 *       };
 *       validationRules: {
 *         passwordMinLength: number;
 *         requireEmailVerification: boolean;
 *       };
 *     };
 *   }
 * }
 *
 * // Type-safe access to custom properties
 * function configureUserResource(config: ResourceConfig<"users">) {
 *   // TypeScript knows about custom properties
 *   console.log("Admin actions:", config.permissions.adminOnly);
 *   console.log("Password min length:", config.validationRules.passwordMinLength);
 *
 *   // Standard actions are still available
 *   const actions = config.actions;
 *   // actions is typed with user-specific actions
 * }
 *
 * const userConfig: ResourceConfig<"users"> = {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   },
 *   permissions: {
 *     adminOnly: ["delete", "ban"],
 *     publicAccess: ["read", "create"]
 *   },
 *   validationRules: {
 *     passwordMinLength: 8,
 *     requireEmailVerification: true
 *   }
 * };
 *
 * configureUserResource(userConfig);
 * ```
 *
 * #### Generic Resource Processing
 * ```typescript
 * // Generic function that processes any resource
 * function processResource<TResourceName extends ResourceName>(
 *   name: TResourceName,
 *   config: ResourceConfig<TResourceName>,
 *   processor: (config: ResourceConfig<TResourceName>) => void
 * ) {
 *   console.log(`Processing resource: ${name}`);
 *   processor(config);
 * }
 *
 * // Usage with different resources
 * processResource("users", userConfig, (config) => {
 *   // config is typed as ResourceConfig<"users">
 *   console.log("User actions:", Object.keys(config.actions));
 * });
 *
 * processResource("posts", postConfig, (config) => {
 *   // config is typed as ResourceConfig<"posts">
 *   console.log("Post actions:", Object.keys(config.actions));
 * });
 * ```
 *
 * ### Best Practices
 * - **Type Constraints**: Always use `TResourceName extends ResourceName` to constrain resource names
 * - **Generic Functions**: Use generics to create reusable functions that work with any resource type
 * - **Module Augmentation**: Define resources via module augmentation for better organization
 * - **Type Safety**: Leverage TypeScript's inference to avoid manual type assertions
 * - **Consistent Naming**: Use lowercase, plural resource names (e.g., "users", "products")
 * - **Documentation**: Document custom resource properties for team members
 *
 * ### Integration with Other Types
 * - **`Resources`**: The global interface that `ResourceConfig` accesses
 * - **`ResourceName`**: Union type of all defined resource names
 * - **`ResourceActions<TResourceName>`**: Type-safe access to a resource's actions
 * - **`ResourceActionName<TResourceName>`**: Union type of action names for a specific resource
 * - **`ResourceBase`**: The base interface that all resource configurations must implement
 *
 * ### Migration Notes
 * When upgrading from direct resource object usage, replace explicit types with `ResourceConfig<TResourceName>`
 * to gain type safety and automatic updates when resource definitions change. The type provides the same
 * runtime behavior while adding compile-time guarantees.
 *
 * @type ResourceConfig
 * @template TResourceName - The name of the resource (must be a key of Resources)
 * @public
 *
 * @see {@link Resources} - The global interface defining all resource configurations
 * @see {@link ResourceName} - Union type of all defined resource names
 * @see {@link ResourceActions} - How to access resource actions with type safety
 * @see {@link ResourceBase} - The base interface that resource definitions must implement
 * @example
 * ```typescript
 * // Complete example of using ResourceConfig
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         delete: { label: "Delete User" };
 *       };
 *       permissions: {
 *         adminOnly: string[];
 *         publicAccess: string[];
 *       };
 *     };
 *
 *     products: {
 *       actions: {
 *         read: { label: "View Product" };
 *         create: { label: "Add Product" };
 *         update: { label: "Edit Product" };
 *         discontinue: { label: "Discontinue Product" };
 *       };
 *       categories: string[];
 *       pricing: {
 *         currency: string;
 *         taxRate: number;
 *       };
 *     };
 *   }
 * }
 *
 * // Type-safe resource configuration access
 * type UserConfig = ResourceConfig<"users">;
 * type ProductConfig = ResourceConfig<"products">;
 *
 * // Function that works with any resource configuration
 * function setupResource<TResourceName extends ResourceName>(
 *   name: TResourceName,
 *   config: ResourceConfig<TResourceName>
 * ) {
 *   console.log(`Setting up ${name} resource`);
 *
 *   // Access standard properties
 *   const actions = Object.keys(config.actions);
 *   console.log(`Available actions: ${actions.join(', ')}`);
 *
 *   // Access resource-specific properties with type safety
 *   if (name === "users") {
 *     const userConfig = config as ResourceConfig<"users">;
 *     console.log(`Admin actions: ${userConfig.permissions.adminOnly.join(', ')}`);
 *   } else if (name === "products") {
 *     const productConfig = config as ResourceConfig<"products">;
 *     console.log(`Categories: ${productConfig.categories.join(', ')}`);
 *     console.log(`Currency: ${productConfig.pricing.currency}`);
 *   }
 * }
 *
 * // Usage examples
 * const userResource: ResourceConfig<"users"> = {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" },
 *     delete: { label: "Delete User" }
 *   },
 *   permissions: {
 *     adminOnly: ["delete"],
 *     publicAccess: ["read", "create"]
 *   }
 * };
 *
 * const productResource: ResourceConfig<"products"> = {
 *   actions: {
 *     read: { label: "View Product" },
 *     create: { label: "Add Product" },
 *     update: { label: "Edit Product" },
 *     discontinue: { label: "Discontinue Product" }
 *   },
 *   categories: ["electronics", "clothing", "books"],
 *   pricing: {
 *     currency: "USD",
 *     taxRate: 0.08
 *   }
 * };
 *
 * setupResource("users", userResource);
 * setupResource("products", productResource);
 * ```
 */
export type ResourceConfig<TResourceName extends ResourceName> =
  ValidatedResources[TResourceName];

/**
 * Type representing the action names for a specific resource.
 * This type extracts the literal action name strings from a resource's actions.
 *
 * This type provides compile-time safety by ensuring that only valid action names
 * for a specific resource can be used. It preserves literal types, enabling better
 * autocomplete and error detection.
 *
 * @type ResourceActionName
 * @template TResourceName - The name of the resource (optional, defaults to all resources)
 *
 * @example
 * ```typescript
 * // Basic usage with specific resource
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         archive: { label: "Archive User" };
 *       }
 *     };
 *   }
 * }
 *
 * // Type-safe action names for users resource
 * type UserActionName = ResourceActionName<"users">;
 * // Result: "read" | "create" | "update" | "archive"
 *
 * function performUserAction(action: UserActionName) {
 *   console.log(`Performing ${action} on user`);
 * }
 *
 * performUserAction("read"); // ✓ Valid
 * performUserAction("create"); // ✓ Valid
 * // performUserAction("delete"); // ✗ TypeScript error - not a valid user action
 * ```
 *
 * @example
 * ```typescript
 * // Generic function with resource-specific actions
 * function createActionHandler<TResourceName extends ResourceName>(
 *   resourceName: TResourceName,
 *   actionName: ResourceActionName<TResourceName>
 * ) {
 *   return {
 *     execute: () => console.log(`Executing ${actionName} on ${resourceName}`),
 *     getActionName: (): ResourceActionName<TResourceName> => actionName
 *   };
 * }
 *
 * // Usage with type safety
 * const userReadHandler = createActionHandler("users", "read");
 * // TypeScript knows actionName must be a valid user action
 *
 * const userCreateHandler = createActionHandler("users", "create");
 * // TypeScript knows actionName must be a valid user action
 *
 * // This would cause a TypeScript error:
 * // const invalidHandler = createActionHandler("users", "delete");
 * // Error: "delete" is not assignable to ResourceActionName<"users">
 * ```
 *
 * @example
 * ```typescript
 * // Runtime action validation
 * function isValidAction<TResourceName extends ResourceName>(
 *   resourceName: TResourceName,
 *   actionName: string
 * ): actionName is ResourceActionName<TResourceName> {
 *   // This would typically check against the resource's defined actions
 *   const validActions = getResourceActions(resourceName);
 *   return validActions.includes(actionName as ResourceActionName<TResourceName>);
 * }
 *
 * // Usage
 * if (isValidAction("users", "read")) {
 *   // TypeScript now knows actionName is ResourceActionName<"users">
 *   const handler = createActionHandler("users", "read");
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Action name arrays with type safety
 * function getAllActionNames<TResourceName extends ResourceName>(
 *   resourceName: TResourceName
 * ): ResourceActionName<TResourceName>[] {
 *   // Implementation would return all action names for the resource
 *   return [] as ResourceActionName<TResourceName>[];
 * }
 *
 * // Usage
 * const userActions = getAllActionNames("users");
 * // TypeScript knows userActions contains only valid user action names
 *
 * userActions.forEach(action => {
 *   // action is typed as ResourceActionName<"users">
 *   console.log(`User action: ${action}`);
 * });
 * ```
 */
export type ResourceActionName<
  TResourceName extends ResourceName = ResourceName,
> = GetResourceActionNames<ResourceConfig<TResourceName>>;

/**
 * @interface ResourceActionTuple
 * Represents a tuple that contains a resource name and an action name.
 * This type is a union of two possible tuple formats: `ResourceActionTupleArray` and `ResourceActionTupleObject`.
 *
 * @template TResourceName - The name of the resource. Defaults to `ResourceName`.
 *
 * @example
 * ```typescript
 * // Using ResourceActionTupleArray
 * const actionTuple: ResourceActionTuple = ["users", "read"];
 *
 * // Using ResourceActionTupleObject
 * const actionTuple: ResourceActionTuple = { resourceName: "users", action: "read" };
 * ```
 *
 * @typeParam TResourceName - The name of the resource.
 * @default ResourceName
 *
 * @typedef {(ResourceActionTupleArray<TResourceName> | ResourceActionTupleObject<TResourceName>)} ResourceActionTuple
 *
 * @see {@link ResourceActionTupleArray} for the `ResourceActionTupleArray` type.
 * @see {@link ResourceActionTupleObject} for the `ResourceActionTupleObject` type.
 */
export type ResourceActionTuple<TResourceName extends ResourceName> =
  | ResourceActionTupleArray<TResourceName>
  | ResourceActionTupleObject<TResourceName>;

/**
 * @interface ResourceActionTupleArray
 * Represents a tuple that contains a resource name and an action name in an array format.
 * This type is a tuple with two elements: the resource name and the action name.
 *
 * @template TResourceName - The name of the resource. Defaults to `ResourceName`.
 *
 * @example
 * ```typescript
 * const actionTuple: ResourceActionTupleArray = ["users", "read"];
 * ```
 *
 * @typeParam TResourceName - The name of the resource.
 * @default ResourceName
 *
 * @typedef {[TResourceName, ResourceActionName<TResourceName>]} ResourceActionTupleArray
 */
export type ResourceActionTupleArray<TResourceName extends ResourceName> = [
  /**
   * The name of the resource.
   *
   * @type {TResourceName}
   */
  TResourceName,
  /**
   * The name of the action.
   *
   * @type {ResourceActionName<TResourceName>}
   */
  ResourceActionName<TResourceName>,
];

/**
 * @interface ResourceActionTupleObject
 * Represents a tuple that contains a resource name and an action name in an object format.
 * This type is an object with two properties: `resourceName` and `action`.
 *
 * @template TResourceName - The name of the resource. Defaults to `ResourceName`.
 *
 * @example
 * ```typescript
 * const actionTuple: ResourceActionTupleObject = { resourceName: "users", action: "read" };
 * ```
 *
 * @typeParam TResourceName - The name of the resource.
 * @default ResourceName
 *
 * @interface ResourceActionTupleObject
 */
export interface ResourceActionTupleObject<TResourceName extends ResourceName> {
  /**
   * The name of the resource.
   *
   * @type {TResourceName}
   */
  resourceName: TResourceName;

  /**
   * The name of the action.
   *
   * @type {ResourceActionName<TResourceName>}
   */
  action: ResourceActionName<TResourceName>;
}
/**
 * @interface ResourceAction
 *
 * Represents the structure of an action that can be performed on a resource within the application.
 * This interface defines the essential properties that describe the action, allowing for a
 * consistent representation of actions across different resources.
 *
 * ### Properties
 *
 * - `label` (optional): A user-friendly label for the action. This label is typically
 *   displayed in the user interface (UI) to help users understand what the action does.
 *   It should be concise and descriptive.
 *
 * - `title` (optional): A short text that appears when the user hovers over the action
 *   in the UI. The title provides extra information about the action, helping users
 *   understand its purpose without cluttering the interface.
 *
 * ### Example Usage
 *
 * Here is an example of how the `ResourceAction` interface can be utilized:
 *
 * ```typescript
 * // Define a resource action for creating a new document
 * const createDocumentAction: ResourceAction = {
 *     label: "Create Document",
 *     title: "Click to add a new document."
 * };
 *
 * // Function to display action information
 * function displayActionInfo(action: ResourceAction) {
 *     console.log(`Action: ${action.label}`);
 *     console.log(`Title: ${action.title}`);
 * }
 *
 * // Example of displaying action information
 * displayActionInfo(createDocumentAction);
 * // Output:
 * // Action: Create Document
 * // Title: Create a new document in the system
 * // Tooltip: Click to add a new document.
 * ```
 *
 * ### Notes
 *
 * - The `ResourceAction` interface is designed to be flexible, allowing developers to
 *   define actions with varying levels of details based on the needs of their application.
 * - By providing clear labels, titles, and tooltips, developers can enhance the user
 *   experience and make the application more intuitive.
 */
export interface ResourceAction {
  label?: string;
  title?: string;
}

type ResourceActionsRecord<TActions> =
  TActions extends Record<string, ResourceAction>
    ? TActions & Partial<ResourceDefaultActions>
    : never;

/**
 * Type representing the actions record for a specific resource.
 * This type extracts the actions from a resource's definition, ensuring type safety.
 *
 * This type provides access to the complete actions object for a resource,
 * maintaining the exact structure and types as defined in the resource's configuration.
 * It's useful when you need to work with the entire set of actions for a resource.
 *
 * @type ResourceActions
 * @template TResourceName - The name of the resource
 *
 * @example
 * ```typescript
 * // Basic usage - getting resource actions type
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User", title: "View user details" };
 *         create: { label: "Create User", title: "Add new user" };
 *         update: { label: "Update User", title: "Modify user data" };
 *         archive: { label: "Archive User", title: "Soft delete user" };
 *       }
 *     };
 *   }
 * }
 *
 * // Type-safe access to user actions
 * type UserActions = ResourceActions<"users">;
 * // Result: The complete actions record for users resource
 *
 * const userActions: UserActions = {
 *   read: { label: "Read User", title: "View user details" },
 *   create: { label: "Create User", title: "Add new user" },
 *   update: { label: "Update User", title: "Modify user data" },
 *   archive: { label: "Archive User", title: "Soft delete user" }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Function that works with resource actions
 * function validateResourceActions<TResourceName extends ResourceName>(
 *   resourceName: TResourceName,
 *   actions: ResourceActions<TResourceName>
 * ): boolean {
 *   // Check if all required actions are present
 *   const requiredActions: (keyof ResourceActions<TResourceName>)[] = ['read', 'create', 'update'];
 *
 *   return requiredActions.every(action =>
 *     action in actions && actions[action] !== undefined
 *   );
 * }
 *
 * // Usage
 * const validUserActions = validateResourceActions("users", {
 *   read: { label: "Read" },
 *   create: { label: "Create" },
 *   update: { label: "Update" },
 *   archive: { label: "Archive" }
 * }); // Returns true
 * ```
 *
 * @example
 * ```typescript
 * // Building action handlers with type safety
 * function createActionHandlers<TResourceName extends ResourceName>(
 *   resourceName: TResourceName,
 *   actions: ResourceActions<TResourceName>
 * ) {
 *   const handlers: Record<string, () => void> = {};
 *
 *   // TypeScript knows the exact action names available
 *   for (const actionName in actions) {
 *     handlers[actionName] = () => {
 *       const action = actions[actionName as keyof ResourceActions<TResourceName>];
 *       console.log(`Executing ${action?.label} on ${resourceName}`);
 *     };
 *   }
 *
 *   return handlers;
 * }
 *
 * // Usage
 * const userActionHandlers = createActionHandlers("users", {
 *   read: { label: "Read User" },
 *   create: { label: "Create User" },
 *   update: { label: "Update User" }
 * });
 *
 * userActionHandlers.read(); // ✓ Valid - calls read handler
 * userActionHandlers.create(); // ✓ Valid - calls create handler
 * // userActionHandlers.delete(); // ✗ TypeScript error - delete not in user actions
 * ```
 *
 * @example
 * ```typescript
 * // Permission system based on resource actions
 * class PermissionManager {
 *   private permissions = new Map<ResourceName, Set<string>>();
 *
 *   grantPermission<TResourceName extends ResourceName>(
 *     resourceName: TResourceName,
 *     actions: (keyof ResourceActions<TResourceName>)[]
 *   ) {
 *     const current = this.permissions.get(resourceName) || new Set();
 *     actions.forEach(action => current.add(action as string));
 *     this.permissions.set(resourceName, current);
 *   }
 *
 *   hasPermission<TResourceName extends ResourceName>(
 *     resourceName: TResourceName,
 *     action: keyof ResourceActions<TResourceName>
 *   ): boolean {
 *     const resourcePerms = this.permissions.get(resourceName);
 *     return resourcePerms?.has(action as string) ?? false;
 *   }
 * }
 *
 * // Usage
 * const permManager = new PermissionManager();
 * permManager.grantPermission("users", ["read", "create"]);
 *
 * permManager.hasPermission("users", "read"); // true
 * permManager.hasPermission("users", "update"); // false
 * // permManager.hasPermission("users", "invalid"); // ✗ TypeScript error
 * ```
 */
export type ResourceActions<TResourceName extends ResourceName> =
  Resources[TResourceName] extends { actions: Record<string, ResourceAction> }
    ? ResourceActionsRecord<Resources[TResourceName]['actions']>
    : never;

type GetResourceActionNames<
  TResource extends { actions?: Record<string, ResourceAction> },
> = keyof ResourceActionsRecord<TResource['actions']> & string;

/**
 * ## ResourceDefaultActions Interface
 *
 * A foundational interface defining the standard CRUD (Create, Read, Update, Delete) actions
 * that can be performed on resources, plus an "all" action for comprehensive permissions.
 * This interface serves as the base set of actions that resource configurations can extend,
 * override, or supplement with custom actions.
 *
 * ### Purpose
 * The `ResourceDefaultActions` interface establishes a consistent set of core actions that
 * most resources will support. It provides a standardized foundation for resource management
 * while allowing flexibility for custom actions specific to particular resources.
 *
 * ### How It Works
 * - **Base Actions**: Defines the five fundamental actions (read, create, update, delete, all)
 * - **Extensibility**: Used in `ResourceActionsRecord` to create action records that can be extended
 * - **Type Safety**: Each action is typed as `ResourceAction`, ensuring consistent structure
 * - **Optional Override**: Resources can override these defaults or add custom actions alongside them
 *
 * ### Default Actions
 *
 * - **`read`**: Retrieve/view resource data (GET operations)
 * - **`create`**: Create new resource instances (POST operations)
 * - **`update`**: Modify existing resource instances (PUT/PATCH operations)
 * - **`delete`**: Remove resource instances (DELETE operations)
 * - **`all`**: Perform any action on the resource (wildcard permission)
 *
 * ### Template Parameters
 * This interface doesn't use generic parameters itself, but serves as a foundation for
 * action-based type operations and resource configurations.
 *
 * ### Examples
 *
 * #### Basic Resource with Default Actions
 * ```typescript
 * // A simple resource using only default actions
 * const userResource: ResourceBase = {
 *   name: "users",
 *   label: "Users",
 *   actions: {
 *     read: { label: "View Users" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" },
 *     delete: { label: "Delete User" },
 *     all: { label: "Full User Access" }
 *   }
 * };
 * ```
 *
 * #### Resource Extending Default Actions
 * ```typescript
 * // Resource with default actions plus custom ones
 * const blogResource: ResourceBase = {
 *   name: "posts",
 *   label: "Blog Posts",
 *   actions: {
 *     // Default actions
 *     read: { label: "View Posts" },
 *     create: { label: "Write Post" },
 *     update: { label: "Edit Post" },
 *     delete: { label: "Delete Post" },
 *     all: { label: "Full Post Access" },
 *
 *     // Custom actions
 *     publish: { label: "Publish Post" },
 *     archive: { label: "Archive Post" },
 *     feature: { label: "Feature Post" }
 *   }
 * };
 * ```
 *
 * #### Permission System Using Default Actions
 * ```typescript
 * // Permission checking with default actions
 * class PermissionManager {
 *   private permissions = new Map<string, Set<string>>();
 *
 *   grantDefaultActions(resourceName: string) {
 *     const key = `resource:${resourceName}`;
 *     const actions = this.permissions.get(key) || new Set();
 *
 *     // Grant all default actions
 *     actions.add('read');
 *     actions.add('create');
 *     actions.add('update');
 *     actions.add('delete');
 *
 *     this.permissions.set(key, actions);
 *   }
 *
 *   hasPermission(resourceName: string, action: keyof ResourceDefaultActions): boolean {
 *     const key = `resource:${resourceName}`;
 *     const actions = this.permissions.get(key);
 *     return actions?.has(action) ?? false;
 *   }
 * }
 *
 * // Usage
 * const permManager = new PermissionManager();
 * permManager.grantDefaultActions('users');
 *
 * permManager.hasPermission('users', 'read');    // true
 * permManager.hasPermission('users', 'create');  // true
 * permManager.hasPermission('users', 'delete');  // true
 * permManager.hasPermission('users', 'all');     // false (not granted)
 * ```
 *
 * #### UI Component with Action-Based Rendering
 * ```typescript
 * // Component that renders different UI based on available actions
 * interface ResourceActionButtonProps {
 *   resourceName: string;
 *   action: keyof ResourceDefaultActions;
 *   onClick: () => void;
 *   children: React.ReactNode;
 * }
 *
 * function ResourceActionButton({
 *   resourceName,
 *   action,
 *   onClick,
 *   children
 * }: ResourceActionButtonProps) {
 *   const hasPermission = usePermission(resourceName, action);
 *
 *   if (!hasPermission) return null;
 *
 *   return (
 *     <button onClick={onClick} data-action={action}>
 *       {children}
 *     </button>
 *   );
 * }
 *
 * // Usage in a resource management component
 * function UserManagement() {
 *   return (
 *     <div>
 *       <ResourceActionButton resourceName="users" action="create">
 *         Add User
 *       </ResourceActionButton>
 *
 *       <ResourceActionButton resourceName="users" action="read">
 *         View Users
 *       </ResourceActionButton>
 *
 *       <ResourceActionButton resourceName="users" action="update">
 *         Edit User
 *       </ResourceActionButton>
 *
 *       <ResourceActionButton resourceName="users" action="delete">
 *         Delete User
 *       </ResourceActionButton>
 *     </div>
 *   );
 * }
 * ```
 *
 * #### API Route Protection
 * ```typescript
 * // Middleware for protecting API routes based on default actions
 * function requireAction(resourceName: string, action: keyof ResourceDefaultActions) {
 *   return (req: Request, res: Response, next: NextFunction) => {
 *     const user = getCurrentUser(req);
 *     const hasPermission = checkUserPermission(user, resourceName, action);
 *
 *     if (!hasPermission) {
 *       return res.status(403).json({
 *         error: 'Forbidden',
 *         message: `You don't have permission to ${action} ${resourceName}`
 *       });
 *     }
 *
 *     next();
 *   };
 * }
 *
 * // Usage in Express routes
 * app.get('/api/users', requireAction('users', 'read'), getUsers);
 * app.post('/api/users', requireAction('users', 'create'), createUser);
 * app.put('/api/users/:id', requireAction('users', 'update'), updateUser);
 * app.delete('/api/users/:id', requireAction('users', 'delete'), deleteUser);
 * ```
 *
 * #### Form Validation Based on Actions
 * ```typescript
 * // Form component that adapts based on available actions
 * interface SmartFormProps<T> {
 *   resourceName: string;
 *   initialData?: T;
 *   onSubmit: (data: T) => void;
 * }
 *
 * function SmartForm<T>({ resourceName, initialData, onSubmit }: SmartFormProps<T>) {
 *   const canCreate = usePermission(resourceName, 'create');
 *   const canUpdate = usePermission(resourceName, 'update');
 *   const isEditing = !!initialData;
 *
 *   // Don't render form if no appropriate permissions
 *   if (isEditing && !canUpdate) return { error: 'No permission to edit' };
 *   if (!isEditing && !canCreate) return { error: 'No permission to create' };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit">
 *         {isEditing ? 'Update' : 'Create'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 *
 * ### Best Practices
 * - **Consistent Action Names**: Always use the standard action names (read, create, update, delete, all)
 * - **Clear Labels**: Provide descriptive labels for each action in resource definitions
 * - **Permission Granularity**: Use specific actions rather than relying only on "all"
 * - **Documentation**: Document custom actions that extend beyond the defaults
 * - **UI Consistency**: Use these actions consistently across different UI components
 *
 * ### Integration with Other Types
 * - **`ResourceActions<T>`**: Uses this interface as the base for resource-specific actions
 * - **`ResourceActionName<T>`**: Provides type-safe action names for specific resources
 * - **`ResourceBase`**: Resources can extend or override these default actions
 * - **`ResourceAction`**: The type definition for individual actions
 *
 * ### Migration Notes
 * When upgrading from custom action definitions, map your existing actions to these standard
 * names where possible. The "all" action can be used for comprehensive permissions that
 * previously used different naming conventions.
 *
 * @interface ResourceDefaultActions
 * @public
 *
 * @see {@link ResourceActions} - How these actions are used in resource configurations
 * @see {@link ResourceAction} - The structure of individual actions
 * @see {@link ResourceBase} - How resources define their available actions
 * @example
 * ```typescript
 * // Complete example of using ResourceDefaultActions in a resource definition
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: ResourceDefaultActions & {
 *         // Extend with custom actions
 *         resetPassword: { label: "Reset Password" };
 *         activate: { label: "Activate Account" };
 *         deactivate: { label: "Deactivate Account" };
 *       }
 *     };
 *
 *     products: {
 *       actions: ResourceDefaultActions & {
 *         // Product-specific actions
 *         restock: { label: "Restock Product" };
 *         discontinue: { label: "Discontinue Product" };
 *         feature: { label: "Feature Product" };
 *       }
 *     };
 *   }
 * }
 *
 * // Type-safe usage
 * type UserActions = ResourceActions<"users">;
 * // Includes: read, create, update, delete, all, resetPassword, activate, deactivate
 *
 * type ProductActions = ResourceActions<"products">;
 * // Includes: read, create, update, delete, all, restock, discontinue, feature
 *
 * // Permission checking function
 * function canPerformAction<T extends ResourceName>(
 *   resource: T,
 *   action: keyof ResourceActions<T>
 * ): boolean {
 *   // Implementation would check user permissions
 *   return true; // Simplified for example
 * }
 *
 * // Usage
 * canPerformAction("users", "create");        // ✓ Valid - default action
 * canPerformAction("users", "resetPassword"); // ✓ Valid - custom action
 * canPerformAction("users", "restock");       // ✗ TypeScript error - not a user action
 * ```
 */
export interface ResourceDefaultActions {
  /**
   * The read action for the resource.
   * This action is used to retrieve a specific resource.
   *
   * @type {ResourceAction}
   * @example
   * ```typescript
   * const readAction: ResourceAction = {
   *     label: "Read Resource",
   *     title: "Click to read a specific resource.",
   * };
   * ```
   */
  read: ResourceAction;

  /**
   * The create action for the resource.
   * This action is used to create a new resource.
   *
   * @type {ResourceAction}
   * @example
   * ```typescript
   * const createAction: ResourceAction = {
   *     label: "Create Resource",
   *     title: "Click to create a new resource.",
   * };
   * ```
   */
  create: ResourceAction;

  /**
   * The update action for the resource.
   * This action is used to update a specific resource.
   *
   * @type {ResourceAction}
   * @example
   * ```typescript
   * const updateAction: ResourceAction = {
   *     label: "Update Resource",
   *     title: "Click to update a specific resource.",
   * };
   * ```
   */
  update: ResourceAction;

  /**
   * The delete action for the resource.
   * This action is used to delete a specific resource.
   *
   * @type {ResourceAction}
   * @example
   * ```typescript
   * const deleteAction: ResourceAction = {
   *     label: "Delete Resource",
   *     title: "Click to delete a specific resource.",
   * };
   * ```
   */
  delete: ResourceAction;

  /**
   * The all action for the resource.
   * This action is used to perform all actions on the resource.
   *
   * @type {ResourceAction}
   * @example
   * ```typescript
   * const allAction: ResourceAction = {
   *     label: "All Actions",
   *     title: "Click to perform all actions on the resource.",
   * };
   * ```
   */
  all: ResourceAction;
}

/**
 * ## ResourceBase Interface
 *
 * The foundational interface that defines the structure and properties required for all resources
 * in the application. This interface serves as the base contract that all resource definitions
 * must implement to be considered valid within the resource management system.
 *
 * ### Purpose
 * The `ResourceBase` interface establishes the minimum structure that every resource must have,
 * ensuring consistency and type safety across all resource definitions. It acts as a constraint
 * that validates resource configurations during module augmentation, preventing invalid or
 * incomplete resource definitions from being accepted by the type system.
 *
 * ### How It Works
 * - **Module Augmentation**: Resources are defined by extending the global `Resources` interface
 * - **Validation**: The `ValidateResource<T>` type ensures each resource implements `ResourceBase`
 * - **Type Safety**: Only resources that conform to this interface are included in `ResourceName`
 * - **Extensibility**: Generic parameters allow resources to specify their own action types
 *
 * ### Template Parameters
 * - **TResourceName**: The specific resource name type (extends `ResourceName`)
 * - **Actions**: The record of actions available for this resource (extends `Record<string, ResourceAction>`)
 *
 * ### Examples
 *
 * #### Basic Resource Definition
 * ```typescript
 * // Define a simple user resource
 * const userResource: ResourceBase<"users"> = {
 *   name: "users",
 *   label: "Users",
 *   title: "User Management",
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   }
 * };
 * ```
 *
 * #### Advanced Resource with Custom Actions
 * ```typescript
 * // Define a product resource with custom actions
 * const productResource: ResourceBase<"products", {
 *   read: ResourceAction;
 *   create: ResourceAction;
 *   update: ResourceAction;
 *   discontinue: ResourceAction;
 *   restock: ResourceAction;
 * }> = {
 *   name: "products",
 *   label: "Products",
 *   title: "Product Catalog Management",
 *   actions: {
 *     read: { label: "View Product", title: "Display product details" },
 *     create: { label: "Add Product", title: "Create new product entry" },
 *     update: { label: "Edit Product", title: "Modify product information" },
 *     discontinue: { label: "Discontinue Product", title: "Mark product as discontinued" },
 *     restock: { label: "Restock Product", title: "Update product inventory" }
 *   }
 * };
 * ```
 *
 * #### Module Augmentation Usage
 * ```typescript
 * // In your application's types file
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     // All of these must implement ResourceBase
 *     users: {
 *       name: "users";
 *       label: "Users";
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *       };
 *     };
 *
 *     posts: {
 *       name: "posts";
 *       label: "Posts";
 *       title: "Blog Posts";
 *       actions: {
 *         read: { label: "Read Post" };
 *         publish: { label: "Publish Post" };
 *       };
 *     };
 *   }
 * }
 *
 * // TypeScript will enforce ResourceBase structure
 * // Invalid resources will cause compilation errors
 * ```
 *
 * #### Type-Safe Resource Operations
 * ```typescript
 * // Using ResourceBase for type-safe operations
 * function createResourceHandler<T extends ResourceBase>(
 *   resource: T
 * ): ResourceHandler<T> {
 *   return {
 *     name: resource.name,
 *     label: resource.label,
 *     actions: Object.keys(resource.actions),
 *     // TypeScript knows resource has name, label, and actions
 *   };
 * }
 *
 * const userHandler = createResourceHandler(userResource);
 * // userHandler.name: "users"
 * // userHandler.label: "Users"
 * // userHandler.actions: string[]
 * ```
 *
 * #### Resource Validation
 * ```typescript
 * // Custom validation using ResourceBase structure
 * function validateResource(resource: any): resource is ResourceBase {
 *   return (
 *     typeof resource === 'object' &&
 *     typeof resource.name === 'string' &&
 *     typeof resource.actions === 'object' &&
 *     resource.actions !== null
 *   );
 * }
 *
 * // Usage
 * if (validateResource(someResource)) {
 *   // TypeScript knows this is a ResourceBase
 *   console.log(`Valid resource: ${someResource.name}`);
 * }
 * ```
 *
 * ### Best Practices
 * - **Consistent Naming**: Use lowercase resource names (e.g., "users", "products")
 * - **Descriptive Labels**: Provide clear, user-friendly labels for UI display
 * - **Comprehensive Actions**: Define all relevant actions for the resource's lifecycle
 * - **Optional Properties**: Use `label` and `title` for better UX, but they're optional
 * - **Type Safety**: Leverage the generic parameters for precise action typing
 * - **Documentation**: Document custom actions and their purposes
 *
 * ### Integration with Other Types
 * - **`Resources`**: Global interface where resources are defined via module augmentation
 * - **`ResourceName`**: Union type of all valid resource names (requires ResourceBase compliance)
 * - **`ResourceConfig<T>`**: Provides type-safe access to individual resource configurations
 * - **`ResourceActions<T>`**: Type-safe access to a resource's actions
 * - **`ValidateResource<T>`**: Type-level validation that checks ResourceBase implementation
 * - **`ValidatedResources`**: Maps all resources to ensure they extend ResourceBase
 *
 * ### Migration Notes
 * When adding new resources, ensure they implement all required `ResourceBase` properties.
 * The `name` property must match the key used in the `Resources` interface. Existing
 * resources that don't conform to this interface will cause TypeScript compilation errors
 * after upgrading, helping catch configuration issues early.
 *
 * @interface ResourceBase
 * @template TResourceName - The specific resource name type
 * @template Actions - The record of actions for this resource
 * @public
 *
 * @see {@link Resources} - Global interface for resource definitions
 * @see {@link ResourceName} - Union of all valid resource names
 * @see {@link ResourceConfig} - Type-safe resource configuration access
 * @see {@link ValidateResource} - Type-level validation of resource structure
 * @example
 * ```typescript
 * // Complete example of ResourceBase usage
 * import "reslib/resources";
 *
 * // Define custom action types for better type safety
 * interface UserActions {
 *   read: ResourceAction;
 *   create: ResourceAction;
 *   update: ResourceAction;
 *   delete: ResourceAction;
 *   activate: ResourceAction;
 *   deactivate: ResourceAction;
 * }
 *
 * // Create a fully typed resource
 * const userResource: ResourceBase<"users", UserActions> = {
 *   name: "users",
 *   label: "Users",
 *   title: "User Account Management",
 *   actions: {
 *     read: {
 *       label: "Read User",
 *       title: "View user account details"
 *     },
 *     create: {
 *       label: "Create User",
 *       title: "Add new user account"
 *     },
 *     update: {
 *       label: "Update User",
 *       title: "Modify user account information"
 *     },
 *     delete: {
 *       label: "Delete User",
 *       title: "Remove user account"
 *     },
 *     activate: {
 *       label: "Activate User",
 *       title: "Enable user account access"
 *     },
 *     deactivate: {
 *       label: "Deactivate User",
 *       title: "Disable user account access"
 *     }
 *   }
 * };
 *
 * // Module augmentation for global availability
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: typeof userResource;
 *   }
 * }
 *
 * // Type-safe usage throughout the application
 * type UserName = "users"; // From ResourceName union
 * type UserConfig = ResourceConfig<"users">; // Full type safety
 * type UserActionNames = ResourceActionName<"users">; // "read" | "create" | "update" | ...
 * ```
 */
export interface ResourceBase<
  TResourceName extends ResourceName = ResourceName,
  Actions extends Record<string, ResourceAction> = Record<
    string,
    ResourceAction
  >,
> {
  /**
   * The internal name of the resource.
   *
   * This name is used within the system for referencing the resource programmatically.
   * It is often a short, unique identifier for the resource.
   *
   * @example
   * ```typescript
   * const userResource: ResourceBase = { name: "user" };
   * ```
   */
  name: TResourceName;

  /**
   * A user-friendly label for the resource.
   *
   * This is typically a shorter name intended for display in UI elements, such as dropdowns or buttons.
   * It helps users identify the resource within the user interface.
   *
   * @example
   * ```typescript
   * const productResource: ResourceBase = { label: "Product" };
   * ```
   */
  label?: string;

  /**
   * A short text that appears when the user hovers over the resource.
   * The title provides additional context or information about the resource.
   *
   * Typically used in user interfaces to clarify what a particular resource represents or to give instructions.
   *
   * @example
   * ```typescript
   * const userResource: ResourceBase = { title: "This resource manages user information." };
   * ```
   */
  title?: string;

  /**
   * The actions associated with this resource.
   * This is a well-typed record that preserves key inference while satisfying Record<string, ResourceAction>.
   *
   * @example
   * ```typescript
   * const userResource: ResourceBase = {
   *   actions: {
   *     read: { label: "Read User" },
   *     create: { label: "Create User" },
   *     archive: { label: "Archive User" } // Custom action
   *   }
   * };
   *
   * // TypeScript infers: "read" | "create" | "archive"
   * type UserActionNames = GetResourceActionNames<typeof userResource>;
   *
   * // Still compatible with generic Record<string, ResourceAction>
   * const genericActions: Record<string, ResourceAction> = userResource.actions;
   * ```
   */
  actions: ResourceActionsRecord<Actions>;
}

/**
 * @type ResourcePrimaryKey
 *
 * Represents the type of primary keys that can be utilized in a resource.
 * This type is a union that provides flexibility in defining unique identifiers
 * for resources, accommodating various data structures and use cases.
 *
 * ### Possible Forms:
 *
 * - **Record<string, string | number>**: An object where the keys are strings
 *   and the values can be either strings or numbers. This allows for composite keys
 *   that consist of multiple fields.
 *   - **Example**:
 *     ```typescript
 *     const compositeKey: TPrimaryKey = { userId: "user123", orderId: 456 };
 *     // A composite key representing a user and their order
 *     ```
 *
 * ### Notes:
 * - This type is particularly useful in scenarios where resources may have
 *   different types of identifiers, such as in databases or APIs.
 * - Using a `Record` allows for more complex primary key structures, which can
 *   be beneficial in applications that require composite keys.
 *
 * ### Use Cases:
 * - Defining primary keys in database models.
 * - Creating unique identifiers for API resources.
 * - Handling composite keys in data structures.
 *
 * ### Related Types:
 * - Consider using `ResourceBase` for defining the overall structure of a resource
 *   that utilizes this primary key type.
 *
 * ### Example Usage:
 * Here’s how you might use the `ResourcePrimaryKey` type in a function that
 * retrieves a resource by its primary key:
 *
 * ```typescript
 * function getResourceById(id: TPrimaryKey): ResourceMeta {
 *     // Implementation to list the resource based on the provided primary key
 * }
 *
 * const resource = getResourceById("user123"); // Fetching by string ID
 * const anotherResource = getResourceById(456); // Fetching by numeric ID
 * const compositeResource = getResourceById({ userId: "user123", orderId: 456 }); // Fetching by composite key
 * ```
 *
 * ### Summary:
 * The `ResourcePrimaryKey` type provides a versatile way to define primary keys
 * for resources, supporting simple and complex identifiers. This flexibility is
 * essential for applications that manage diverse data structures and require
 * unique identification of resources.
 */
export type ResourcePrimaryKey = string | number | object;

/**
 * @interface ResourceDataService
 *
 * Represents a data provider interface for managing resources.
 * This interface defines methods for performing CRUD (Create, Read, Update, Delete)
 * operations on resources, allowing for flexible data management.
 *
 * @template DataType - The type of the resource data being managed. Defaults to `any`,
 * allowing for flexibility in the type of data handled by the provider.
 *
 * @template TPrimaryKey - The type of the primary key used to identify resources.
 *
 *
 * ### Methods:
 *
 * - **create(record: Partial<DataType>)**: Creates a new resource record.
 *   - **Parameters**:
 *     - `record`: The data for the new resource to be created.
 *   - **Returns**: A promise that resolves to an `DataType`,
 *     indicating the success or failure of the operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.create({ name: "New ResourceMeta" });
 *     ```
 *
 * - **update(primaryKey: TPrimaryKey, updatedData: Partial<DataType>)**: Updates an existing resource record.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to update.
 *     - `updatedData`: An object containing the updated data for the resource.
 *   - **Returns**: A promise that resolves to an `DataType`,
 *     indicating the success or failure of the update operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.update("resourceId", { name: "Updated ResourceMeta" });
 *     ```
 *
 * - **delete(primaryKey: TPrimaryKey)**: Deletes a resource record by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to delete.
 *     indicating the success or failure of the delete operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.delete("resourceId");
 *     ```
 *
 * - **findOne(primaryKey: TPrimaryKey)**: Retrieves a single resource record by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to retrieve.
 *   - **Returns**: A promise that resolves to an `DataType | null`,
 *     containing the requested resource record or null if not found.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.findOne("resourceId");
 *     ```
 *
 * - **findOneOrFail(primaryKey: TPrimaryKey)**: Retrieves a single resource record by its primary key or throws an error if not found.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to retrieve.
 *   - **Returns**: A promise that resolves to an `DataType`,
 *     containing the requested resource record.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.findOneOrFail("resourceId");
 *     ```
 *
 * - **find(options?: ResourceQueryOptions<DataType>)**: Retrieves multiple resource records based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the results.
 *   - **Returns**: A promise that resolves to an `ResourcePaginatedResult<DataType>`,
 *     containing the list of resource records.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.find({ limit: 10, skip: 0 });
 *     ```
 *
 * - **findAndCount(options?: ResourceQueryOptions<DataType>)**: Retrieves multiple resource records and the total count based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the results.
 *   - **Returns**: A promise that resolves to an `ResourcePaginatedResult<DataType>`,
 *     containing the list of resource records and the total count.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.findAndCount({ limit: 10, skip: 0 });
 *     ```
 *
 * - **createMany(data: Partial<DataType>[])**: Creates multiple resource records.
 *   - **Parameters**:
 *     - `data`: An array of data for the new resources to be created.
 *   - **Returns**: A promise that resolves to an `DataType[]`,
 *     indicating the success or failure of the operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.createMany([{ name: "ResourceMeta 1" }, { name: "ResourceMeta 2" }]);
 *     ```
 *
 * - **updateMany(data: ResourceManyCriteria<TPrimaryKey,DataType>)**: Updates multiple resource records.
 *   - **Parameters**:
 *     - `data`: An object containing the updated data for the resources.
 *   - **Returns**: A promise that resolves to an `DataType[]`,
 *     indicating the success or failure of the update operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.updateMany({ status: "active" });
 *     ```
 *
 * - **deleteMany(criteria: ResourceQueryOptions<DataType>)**: Deletes multiple resource records based on criteria.
 *   - **Parameters**:
 *     - `criteria`: The criteria to filter which resources to delete.
 *   - **Returns**: A promise that resolves to an `number`,
 *     indicating the success or failure of the delete operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.deleteMany({ filters: { status: "inactive" } });
 *     ```
 *
 * - **count(options?: ResourceQueryOptions<DataType>)**: Counts the total number of resource records based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the count.
 *   - **Returns**: A promise that resolves to an `number`,
 *     containing the total count of resource records.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.count({ filters: { status: "active" } });
 *     ```
 *
 * - **exists(primaryKey: TPrimaryKey)**: Checks if a resource record exists by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to check.
 *   - **Returns**: A promise that resolves to an `boolean`,
 *     indicating whether the resource exists.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.exists("resourceId");
 *     ```
 *
 * - **distinct?(field: keyof DataType, options?: ResourceQueryOptions<DataType>)**: Retrieves distinct values for a specified field.
 *   - **Parameters**:
 *     - `field`: The field for which to retrieve distinct values.
 *     - `options`: Optional query options to filter the results.
 *   - **Returns**: A promise that resolves to an `DataType[]`,
 *     containing the distinct values.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.distinct("category");
 *     ```
 *
 * - **aggregate?(pipeline: any[])**: Performs aggregation operations on the resource data.
 *   - **Parameters**:
 *     - `pipeline`: An array representing the aggregation pipeline.
 *   - **Returns**: A promise that resolves to an `number`,
 *     containing the aggregated results.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
 *     ```
 *
 * ### Notes:
 * - This interface provides a standard way to interact with resource data,
 *   ensuring that all operations return consistent results.
 * - The use of promises allows for asynchronous operations, making it suitable
 *   for use in modern web applications.
 *
 * ### Example Usage:
 * Here’s how you might implement the `ResourceDataService` interface:
 *
 * ```typescript
 * class MyDataProvider implements ResourceDataService<MyResourceType> {
 *     async create(record: MyResourceType) {
 *         // Implementation for creating a resource
 *     }
 *
 *     async list() {
 *         // Implementation for fetching resources
 *     }
 *
 *     // Implement other methods...
 * }
 * ```
 *
 * ### Summary:
 * The `ResourceDataService` interface defines a comprehensive set of methods
 * for managing resources, facilitating CRUD operations and ensuring a consistent
 * approach to data handling in applications.
 */
export interface ResourceDataService<
  DataType = unknown,
  TPrimaryKey extends ResourcePrimaryKey = ResourcePrimaryKey,
> {
  /***
   * Creates a new resource record.
   * @template T - The type of the resource data being created.
   * @param record The data for the new resource to be created.
   * @returns A promise that resolves to an `DataType`,
   * indicating the success or failure of the operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.create({ name: "New ResourceMeta" });
   *     ```
   */
  create<T extends DataType>(record: T): Promise<DataType>;
  /***
   * Updates an existing resource record.
   * @template T - The type of the resource data being updated.
   * @param primaryKey The primary key of the resource to update.
   * @param updateData An object containing the updated data for the resource.
   * @returns A promise that resolves to an `DataType`,
   * indicating the success or failure of the update operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.update("resourceId", { name: "Updated ResourceMeta" });
   *     ```
   */
  update<T extends Partial<DataType>>(
    primaryKey: TPrimaryKey,
    updateData: T
  ): Promise<DataType>;
  /***
   * Deletes a resource record by its primary key.
   * @param primaryKey The primary key of the resource to delete.
   * @returns A promise that resolves to an `Promise<boolean>`,
   * indicating the success or failure of the delete operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.delete("resourceId");
   *     ```
   */
  delete(primaryKey: TPrimaryKey): Promise<boolean>;
  /***
   * Retrieves a single resource record by its primary key.
   * @param options The primary key or query options of the resource to retrieve.
   * @returns A promise that resolves to an `DataType | null`,
   * containing the requested resource record or null if not found.
   * @example
   *   ```typescript
   *   const result = await dataProvider.findOne("resourceId");
   *     ```
   * @example
   *   ```typescript
   *   const result = await dataProvider.findOne({ firstName: 1 });
   *     ```
   */
  findOne(
    options: TPrimaryKey | ResourceQueryOptions<DataType>
  ): Promise<DataType | null>;
  /***
   * Retrieves a single resource record by its primary key or throws an error if not found.
   * @param primaryKey The primary key or query options of the resource to retrieve.
   * @returns A promise that resolves to an `DataType`,
   * containing the requested resource record.
   * @example
   *   ```typescript
   *   const result = await dataProvider.findOneOrFail("resourceId");
   *     ```
   */
  findOneOrFail(
    options: TPrimaryKey | ResourceQueryOptions<DataType>
  ): Promise<DataType>;
  /***
   * Retrieves multiple resource records based on query options.
   * @param options Optional query options to filter the results.
   * @returns A promise that resolves to an `DataType[]`,
   * containing the list of resource records.
   * @example
   *   ```typescript
   *   const result = await dataProvider.find({ limit: 10, skip: 0 });
   *     ```
   */
  find(options?: ResourceQueryOptions<DataType>): Promise<DataType[]>;

  /***
   * Retrieves multiple resource records and the total count based on query options.
   * @param options Optional query options to filter the results.
   * @returns A promise that resolves to an `DataType[]`,
   * containing the list of resource records and the total count.
   * @example
   *   ```typescript
   *   const result = await dataProvider.findAndCount({ limit: 10, skip: 0 });
   *     ```
   */
  findAndCount(
    options?: ResourceQueryOptions<DataType>
  ): Promise<[DataType[], number]>;

  /***
   * Retrieves multiple resource records and paginates the results.
   * @param options Optional query options to filter the results.
   * @returns A promise that resolves to an `ResourcePaginatedResult<DataType>`,
   * containing the list of resource records and the total count.
   * @example
   *   ```typescript
   *   const result = await dataProvider.findAndPaginate({ limit: 10, skip: 0 });
   */
  findAndPaginate(
    options?: ResourceQueryOptions<DataType>
  ): Promise<ResourcePaginatedResult<DataType>>;

  /***
   * Creates multiple resource records.
   * @template T - The type of the resource data being created.
   * @param data An array of data for the new resources to be created.
   * @returns A promise that resolves to an `DataType[]`,
   * indicating the success or failure of the operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.createMany([{ name: "ResourceMeta 1" }, { name: "ResourceMeta 2" }]);
   *     ```
   */
  createMany<T extends DataType>(data: T[]): Promise<DataType[]>;
  /***
   * Updates multiple resource records.
   * @template T - The type of the resource data being updated.
   * @param criteria An object containing the filter criteria for the resources.
   * @param data An object containing the updated data for the resources.
   * @returns A promise that resolves to an `DataType[]`,
   * indicating the success or failure of the update operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.updateMany({ status: "active" });
   *     ```
   */
  updateMany<T extends Partial<DataType>>(
    criteria: ResourceManyCriteria<DataType, TPrimaryKey>,
    data: T
  ): Promise<number>;
  /**
   *
   * @param criteria The criteria to filter which resources to delete.
   * @returns A promise that resolves to an `number`,
   * indicating the success or failure of the delete operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.deleteMany({ filters: { status: "inactive" } });
   *     ```
   */
  deleteMany(
    criteria: ResourceManyCriteria<DataType, TPrimaryKey>
  ): Promise<number>;
  /***
   * Counts the total number of resource records based on query options.
   * @param options Optional query options to filter the count.
   * @returns A promise that resolves to an `number`,
   * containing the total count of resource records.
   * @example
   *   ```typescript
   *   const result = await dataProvider.count({ filters: { status: "active" } });
   *     ```
   */
  count(options?: ResourceQueryOptions<DataType>): Promise<number>;
  /**
   *
   * @param primaryKey The primary key of the resource to check.
   * @returns A promise that resolves to an `boolean`,
   * indicating whether the resource exists.
   * @example
   *   ```typescript
   *   const result = await dataProvider.exists("resourceId");
   *     ```
   */
  exists(primaryKey: TPrimaryKey): Promise<boolean>;
}

/**
 * @type ResourceManyCriteria
 *
 * Represents the criteria used for  multiple actions on a resource.
 * This type allows for flexible definitions of what constitutes an update,
 * accommodating various scenarios based on the primary key or partial data.
 *
 * ### Type Parameters
 * - **TPrimaryKey**: The type of the primary key used to identify resources.
 *   Defaults to `ResourcePrimaryKey`, which can be a string, number, or object.
 * - **DataType**: The type of data associated with the resource. Defaults to `Dictionary`,
 *   which is a generic dictionary type allowing for any key-value pairs.
 *
 * ### Possible Forms
 * The `ResourceManyCriteria` can take one of the following forms:
 *
 * 1. **Array of Primary Keys**:
 *    - An array of primary keys that uniquely identify the resources to be updated.
 *    - **Example**:
 *      ```typescript
 *      const updateCriteria: ResourceManyCriteria<string> = ["user123", "user456"];
 *      ```
 *
 * 2. **Partial Data Object**:
 *    - An object containing partial data that represents the fields to be updated.
 *    - **Example**:
 *      ```typescript
 *      const updateCriteria: ResourceManyCriteria<string, { name: string; age: number }> = {
 *          name: "John Doe",
 *          age: 30
 *      };
 *      ```
 *
 * 3. **Record of Data Fields**:
 *    - A record where each key corresponds to a field in the resource, allowing for
 *      updates to specific fields.
 *    - **Example**:
 *      ```typescript
 *      const updateCriteria: ResourceManyCriteria<string, { name: string; age: number }> = {
 *          name: "Jane Doe",
 *          age: 25
 *      };
 *      ```
 *
 * ### Notes
 * - This type is particularly useful in scenarios where resources can be updated
 *   based on different criteria, such as updating multiple records at once or
 *   modifying specific fields of a resource.
 * - By leveraging TypeScript's generics, this type provides strong typing and
 *   flexibility, ensuring that the criteria used for updates are well-defined and
 *   type-safe.
 *
 * ### Example Usage
 * Here’s how you might use the `ResourceManyCriteria` type in a function that
 * updates resources:
 *
 * ```typescript
 * function updateResources(criteria: ResourceManyCriteria<string, { name: string; age: number }>) {
 *     // Implementation to update resources based on the provided criteria
 * }
 *
 * // Example of updating resources by primary keys
 * updateResources(["user123", "user456"]);
 *
 * // Example of updating resources with partial data
 * updateResources({ name: "John Doe", age: 30 });
 * ```
 * @typeParam DataType - The type of data associated with the resource.
 * @default any
 * @typeParam TPrimaryKey - The type of the primary key used to identify resources.
 * @default ResourcePrimaryKey
 * @see {@link ResourcePrimaryKey} for the `ResourcePrimaryKey` type.
 * @see {@link MongoQuery} for the `MongoQuery` type.
 * @example
 * // Example of using ResourceManyCriteria
 * const criteria: ResourceManyCriteria<string, { name: string; age: number }> = {
 *   name: "John Doe",
 *   age: 30
 * };
 * @Example
 * // Example of using ResourceManyCriteria with an array of primary keys
 * const criteria: ResourceManyCriteria<string, { name: string; age: number }> = [
 *   "user123",
 *   "user456"
 * ];
 */
export type ResourceManyCriteria<
  DataType = unknown,
  TPrimaryKey extends ResourcePrimaryKey = ResourcePrimaryKey,
> = TPrimaryKey[] | MongoQuery<DataType>;

/**
 * Interface representing options for fetching resources.
 *
 * This interface allows you to specify various options when retrieving resources,
 * including filters to narrow down the results based on specific criteria.
 *
 * @template DataType - The type of data being fetched. Defaults to 'any'.
 * @example
 * // Example of using ResourceQueryOptions
 * const fetchOptions: ResourceQueryOptions<MyDataType, string> = {
 *     filters: {
 *             status: { $eq: "active" }, // Filter for active resources
 *             category: { $in: ["A", "B"] } // Filter for categories A or B
 *      },
 *      orderBy: { createdAt: 'desc' }, // Sort by creation date descending
 *      limit: 20, // Limit results to 20
 *      skip: 0 // Do not skip any results
 * };
 */
export interface ResourceQueryOptions<DataType = unknown> {
  /** Fields to include in the response. */
  fields?: Array<keyof DataType extends never ? string : keyof DataType>;
  relations?: string[]; // The relations to include in the response.
  orderBy?: ResourceQueryOrderBy<DataType>; // Optional sorting criteria for the results
  limit?: number; // Optional limit on the number of results to return
  skip?: number; // Optional number of results to skip before returning
  page?: number; // Optional page number for pagination, We can use it instead of skip

  /** Include relationships or nested resources. */
  include?: ResourceName[];

  /** Include only distinct results or specific fields for distinct values. */
  distinct?: boolean | Array<keyof DataType>;

  /** Include soft-deleted resources. */
  includeDeleted?: boolean;

  /** Cache the results for performance optimization. */
  cache?: boolean;

  /** Time-to-Live for cache, in seconds. */
  cacheTTL?: number;

  /**
   * Where clause to filter the results.
   * Resources are filtered using a MongoDB-like query syntax.
   * This allows you to specify conditions for filtering resources based on various criteria.
   *
   * @type {MongoQuery}
   * @see {@link https://www.mongodb.com/docs/manual/reference/operator/query/} for more information on MongoDB query operators.
   * @example
   * const queryOptions: ResourceQueryOptions<{ id: number, name: string }> = {
   *   where: {
   *     name : "John",
   *     surname : "Doe"
   *   },
   *   orderBy: { name: 'asc' },
   *   limit: 10,
   *   skip: 0
   * };
   * @see {@link MongoQuery} for more information on where clauses.
   * @example
   * const queryOptions: ResourceQueryOptions<{ id: number, name: string }> = {
   *   where: {
   *     name : "John",
   *     surname : "Doe"
   *   },
   *   orderBy: { name: 'asc' },
   *   limit: 10,
   *   skip: 0
   * };
   */
  where?: MongoQuery<DataType>;
}

/**
 * @interface ResourcePaginatedResult
 *
 * Represents the result of a paginated resource list operation.
 * This interface encapsulates the data retrieved from a paginated API response,
 * along with metadata about the pagination state and navigation links.
 *
 * @template DataType - The type of the resources being fetched. Defaults to `any`.
 *
 * ### Properties:
 *
 * - **data**: An array of fetched resources.
 *   - **Type**: `DataType[]`
 *   - **Description**: This property contains the list of resources retrieved from the API.
 *   - **Example**:
 *     ```typescript
 *     const result: ResourcePaginatedResult<User> = {
 *         data: [
 *             { id: 1, name: "John Doe" },
 *             { id: 2, name: "Jane Smith" }
 *         ],
 *         meta: { totalItems: 100, currentPage: 1, pageSize: 10, totalPages: 10 },
 *         links: { first: null, previous: null, next: "http://api.example.com/users?page=2", last: "http://api.example.com/users?page=10" }
 *     };
 *     ```
 *
 * - **meta**: Metadata about the pagination state.
 *   - **Type**: `Object`
 *   - **Description**: This property provides information about the total number of items, the current page, the page size, and the total number of pages.
 *   - **Properties**:
 *     - **totalItems**: The total number of items available across all pages.
 *       - **Type**: `number`
 *       - **Example**: `100` indicates there are 100 items in total.
 *     - **currentPage**: The current page number being viewed.
 *       - **Type**: `number`
 *       - **Example**: `1` indicates the first page.
 *     - **pageSize**: The number of items displayed per page.
 *       - **Type**: `number`
 *       - **Example**: `10` indicates that 10 items are shown per page.
 *     - **totalPages**: The total number of pages available.
 *       - **Type**: `number`
 *       - **Example**: `10` indicates there are 10 pages in total.
 *
 * - **links**: Navigation links for paginated results.
 *   - **Type**: `Object`
 *   - **Description**: This property contains URLs for navigating through the paginated results.
 *   - **Properties**:
 *     - **first**: URL to the first page of results.
 *       - **Type**: `string | null`
 *       - **Example**: `"http://api.example.com/users?page=1"` or `null` if there is no first page.
 *     - **previous**: URL to the previous page of results.
 *       - **Type**: `string | null`
 *       - **Example**: `"http://api.example.com/users?page=1"` or `null` if there is no previous page.
 *     - **next**: URL to the next page of results.
 *       - **Type**: `string | null`
 *       - **Example**: `"http://api.example.com/users?page=2"` or `null` if there is no next page.
 *     - **last**: URL to the last page of results.
 *       - **Type**: `string | null`
 *       - **Example**: `"http://api.example.com/users?page=10"` or `null` if there is no last page.
 *
 * ### Example Usage:
 * Here’s how you might use the `ResourcePaginatedResult` interface in a function that fetches paginated user data:
 *
 * ```typescript
 * async function fetchUsers(page: number): Promise<ResourcePaginatedResult<User>> {
 *     const response = await list(`http://api.example.com/users?page=${page}`);
 *     const result: ResourcePaginatedResult<User> = await response.json();
 *     return result;
 * }
 *
 * fetchUsers(1).then(result => {
 *     console.log(`Total Users: ${result.meta.totalItems}`);
 *     console.log(`Current Page: ${result.meta.currentPage}`);
 *     console.log(`Users on this page:`, result.data);
 * });
 * ```
 *
 * ### Notes:
 * - This interface is particularly useful for APIs that return large datasets,
 *   allowing clients to retrieve data in manageable chunks.
 * - The `links` property facilitates easy navigation between pages, enhancing user experience.
 */
export interface ResourcePaginatedResult<DataType = unknown> {
  /** List of fetched resources. */
  data: DataType[];

  statusCode?: number; // HTTP status code for the operation
  success?: boolean; // Indicates if the operation was successful
  error?: any; // Optional error message if the operation failed
  message?: string; // Optional message for the operation
  status?: string; // Optional status of the operation
  errors?: string | Error[]; // Optional errors for the operation

  /** Pagination metadata. */
  meta?: ResourcePaginationMeta;

  /** Links for navigation in paginated results. */
  links?: {
    /** URL or index to the first page. */
    first?: string | number;
    /** URL or index to the previous page. */
    previous?: string | number;
    /** URL or index to the next page. */
    next?: string | number;
    /** URL or index to the last page. */
    last?: string | number;
  };
}

/**
 * @typedef ResourcePaginationMeta
 * Represents the pagination metadata for a resource.
 *
 * This type defines the structure of the pagination metadata returned by a resource query operation.
 * It includes information about the total number of items, the current page, the page size, and other
 * pagination-related properties.
 *
 * @property {number} total - The total number of items available.
 * @property {number} [currentPage] - The current page number.
 * @property {number} [pageSize] - The number of items per page.
 * @property {number} [totalPages] - The total number of pages.
 * @property {number} [nextPage] - The next page number.
 * @property {number} [previousPage] - The previous page number.
 * @property {number} [lastPage] - The last page number.
 * @property {boolean} [hasNextPage] - Whether there is a next page.
 * @property {boolean} [hasPreviousPage] - Whether there is a previous page.
 */
export interface ResourcePaginationMeta {
  /** The total number of items available. */
  total: number;
  /** The current page number. */
  currentPage?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** The total number of pages. */
  totalPages?: number;
  nextPage?: number;
  previousPage?: number;
  lastPage?: number;
  /***
   * Whether there is a next page.
   */
  hasNextPage?: boolean;
  /***
   * Whether there is a previous page.
   */
  hasPreviousPage?: boolean;
}

/**
 * Type representing default events that can occur on a resource.
 * This includes both action names and data service method names.
 *
 * This type combines resource-specific action names with standard data service
 * operations to provide a comprehensive set of events that can be tracked or
 * handled for a given resource. It's useful for event-driven architectures,
 * logging, auditing, and reactive systems.
 *
 * @type ResourceDefaultEvent
 * @template TResourceName - The name of the resource
 *
 * @example
 * ```typescript
 * // Basic usage - event type for a specific resource
 * import "reslib/resources";
 *
 * declare module "reslib/resources" {
 *   interface Resources {
 *     users: {
 *       actions: {
 *         read: { label: "Read User" };
 *         create: { label: "Create User" };
 *         update: { label: "Update User" };
 *         archive: { label: "Archive User" };
 *       }
 *     };
 *   }
 * }
 *
 * // All possible events for the users resource
 * type UserEvent = ResourceDefaultEvent<"users">;
 * // Result: "read" | "create" | "update" | "archive" | "create" | "update" | "delete" | "findOne" | "find" | ...
 *
 * // Note: Includes both resource actions and data service methods
 * ```
 *
 * @example
 * ```typescript
 * // Event-driven resource management
 * class ResourceEventEmitter<TResourceName extends ResourceName> {
 *   private listeners = new Map<ResourceDefaultEvent<TResourceName>, Function[]>();
 *
 *   on(event: ResourceDefaultEvent<TResourceName>, listener: Function) {
 *     const current = this.listeners.get(event) || [];
 *     current.push(listener);
 *     this.listeners.set(event, current);
 *   }
 *
 *   emit(event: ResourceDefaultEvent<TResourceName>, data?: any) {
 *     const listeners = this.listeners.get(event) || [];
 *     listeners.forEach(listener => listener(data));
 *   }
 * }
 *
 * // Usage
 * const userEmitter = new ResourceEventEmitter<"users">();
 *
 * userEmitter.on("create", (userData) => {
 *   console.log("User created:", userData);
 *   // Send welcome email, update analytics, etc.
 * });
 *
 * userEmitter.on("findOne", (userId) => {
 *   console.log("User accessed:", userId);
 *   // Log access, update last accessed time, etc.
 * });
 *
 * // Trigger events
 * userEmitter.emit("create", { id: 1, name: "John" });
 * userEmitter.emit("findOne", 1);
 * ```
 *
 * @example
 * ```typescript
 * // Audit logging with typed events
 * interface AuditLog<TResourceName extends ResourceName> {
 *   resource: TResourceName;
 *   event: ResourceDefaultEvent<TResourceName>;
 *   userId: string;
 *   timestamp: Date;
 *   data?: any;
 * }
 *
 * class ResourceAuditor {
 *   private logs: AuditLog<ResourceName>[] = [];
 *
 *   log<TResourceName extends ResourceName>(
 *     resource: TResourceName,
 *     event: ResourceDefaultEvent<TResourceName>,
 *     userId: string,
 *     data?: any
 *   ) {
 *     this.logs.push({
 *       resource,
 *       event,
 *       userId,
 *       timestamp: new Date(),
 *       data
 *     });
 *   }
 *
 *   getLogsForResource<TResourceName extends ResourceName>(
 *     resource: TResourceName
 *   ): AuditLog<TResourceName>[] {
 *     return this.logs.filter(log => log.resource === resource) as AuditLog<TResourceName>[];
 *   }
 * }
 *
 * // Usage
 * const auditor = new ResourceAuditor();
 *
 * auditor.log("users", "create", "user123", { name: "John Doe" });
 * auditor.log("users", "update", "user456", { id: 1, name: "Jane Doe" });
 * auditor.log("users", "find", "user789"); // Data service method
 *
 * const userLogs = auditor.getLogsForResource("users");
 * // TypeScript knows these are user-related events
 * ```
 *
 * @example
 * ```typescript
 * // Reactive resource hooks
 * function useResourceEvent<TResourceName extends ResourceName>(
 *   resource: TResourceName,
 *   event: ResourceDefaultEvent<TResourceName>,
 *   callback: (data?: any) => void
 * ) {
 *   // Implementation would set up event listeners
 *   console.log(`Setting up ${event} listener for ${resource}`);
 *   // Return cleanup function, etc.
 * }
 *
 * // Usage in a React-like component
 * function UserComponent() {
 *   // Type-safe event handling
 *   useResourceEvent("users", "create", (userData) => {
 *     console.log("New user created:", userData);
 *     // Update UI, refresh data, etc.
 *   });
 *
 *   useResourceEvent("users", "update", (updateData) => {
 *     console.log("User updated:", updateData);
 *     // Refresh user data, show notification, etc.
 *   });
 *
 *   useResourceEvent("users", "findOne", (userId) => {
 *     console.log("User profile viewed:", userId);
 *     // Track analytics, etc.
 *   });
 *
 *   return <div>User Management Component</div>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Middleware system with typed events
 * type MiddlewareFn<TResourceName extends ResourceName> = (
 *   event: ResourceDefaultEvent<TResourceName>,
 *   data: any,
 *   next: () => void
 * ) => void;
 *
 * class ResourceMiddleware<TResourceName extends ResourceName> {
 *   private middlewares: MiddlewareFn<TResourceName>[] = [];
 *
 *   use(middleware: MiddlewareFn<TResourceName>) {
 *     this.middlewares.push(middleware);
 *   }
 *
 *   async execute(event: ResourceDefaultEvent<TResourceName>, data: any) {
 *     let index = 0;
 *
 *     const next = () => {
 *       if (index < this.middlewares.length) {
 *         this.middlewares[index++](event, data, next);
 *       }
 *     };
 *
 *     next();
 *   }
 * }
 *
 * // Usage
 * const userMiddleware = new ResourceMiddleware<"users">();
 *
 * userMiddleware.use((event, data, next) => {
 *   console.log(`Pre-${event} validation`);
 *   // Validate permissions, data, etc.
 *   next();
 * });
 *
 * userMiddleware.use((event, data, next) => {
 *   console.log(`Post-${event} logging`);
 *   // Log the event, send notifications, etc.
 *   next();
 * });
 *
 * // Execute middleware for events
 * userMiddleware.execute("create", { name: "John" });
 * userMiddleware.execute("findOne", 123);
 * ```
 */
export type ResourceDefaultEvent<TResourceName extends ResourceName> =
  | ResourceActionName<TResourceName>
  | keyof ResourceDataService;

/**
 * Represents contextual information about a resource for operations like translations, logging, and error handling.
 *
 * This interface provides a standardized way to pass resource identification and contextual data
 * throughout the application. It's primarily used for internationalization, error messages, and
 * logging where resource-specific information is needed.
 *
 * @interface ResourceContext
 *
 * @example
 * ```typescript
 * // Basic usage in translations
 * const context: ResourceContext = {
 *   resourceName: "user",
 *   resourceLabel: "User",
 *   operation: "create",
 *   count: 5
 * };
 *
 * // Used in error messages
 * i18n.t("resources.notFound", context);
 * // Results in: "User with ID 123 not found"
 * ```
 *
 * @example
 * ```typescript
 * // Extended with custom properties
 * const extendedContext: ResourceContext = {
 *   resourceName: "product",
 *   resourceLabel: "Product",
 *   category: "electronics",
 *   price: 99.99
 * };
 * ```
 */
export interface ResourceContext extends Record<string, any> {
  /** The unique programmatic name of the resource */
  resourceName: ResourceName;

  /** The human-readable label of the resource for display purposes */
  resourceLabel: string;
}

/**
 * @interface ResourceTranslations
 *
 * Represents the translation structure for resources in the application.
 * This type defines the expected structure of translations for each resource,
 * including labels, titles, and action-specific translations.
 *
 * @example
 * ```typescript
 * // resources actions translations structure :
 * // Here is an example of the structure of the translations for the "user" resource:
 * const userTranslations: ResourceTranslations = {
 *   user: {
 *     label: "User",
 *     title: "Manage user data",
 *     create: {
 *       label: "Create User",
 *       title: "Click to add a new user.",
 *     },
 *     read: {
 *       label: "View User",
 *       title: "Click to view a specific user.",
 *     },
 *     update: {
 *       label: "Update User",
 *       title: "Click to update a specific user.",
 *       zero: "No users to update.",
 *       one: "Updated one user.",
 *       other: "Updated %{count} users.",
 *     },
 *     delete: {
 *       label: "Delete User",
 *       title: "Click to delete a specific user.",
 *       zero: "No users to delete.",
 *       one: "Deleted one user.",
 *       other: "Deleted %{count} users.",
 *     },
 *   }
 * };
 * ```
 */
export type ResourceTranslations = {
  [Name in ResourceName]: ResourceTranslation<Name>;
}[ResourceName];

/**
 * @interface ResourceTranslation
 *
 * Represents the translation structure for a specific resource in the application.
 * This generic type defines the expected structure of translations for a given resource,
 * dynamically generating the translation keys based on the resource's defined actions.
 *
 * @template Name - The name of the resource for which translations are defined.
 * Must be a valid `ResourceName`.
 *
 * ### Structure:
 *
 * - **Core Properties**:
 *   - `label`: The display name of the resource (required).
 *   - `title`: The title or heading for the resource (optional).
 *   - `description`: A detailed description of the resource (optional).
 *   - `forbiddenError`: Error message when access to the resource is forbidden (required).
 *   - `notFoundError`: Error message when the resource is not found (required).
 *
 * - **Action Translations**: Dynamically generated based on the resource's actions.
 *   Each action defined in the resource's `actions` property will have:
 *   - `label`: The display label for the action.
 *   - `title`: The tooltip or help text for the action.
 *   - `zero`: Message when no items are affected (for pluralization).
 *   - `one`: Message when one item is affected (for pluralization).
 *   - `other`: Message when multiple items are affected (for pluralization).
 *
 * - **Additional Properties**: Any additional translation keys can be added via `Record<string, any>`.
 *
 * ### Type Generation:
 *
 * The type uses conditional types and mapped types to dynamically generate the structure:
 * - It checks if the resource has an `actions` property.
 * - For each action, it creates a translation object with the required fields.
 * - It combines this with the core properties and allows for additional custom properties.
 *
 * @example
 * ```typescript
 * // For a resource with actions: { read: {...}, create: {...}, update: {...}, delete: {...} }
 * const userTranslations: ResourceTranslation<"user"> = {
 *   label: "User",
 *   title: "Manage user data",
 *   description: "User management and administration",
 *   forbiddenError: "You do not have permission to access this resource.",
 *   notFoundError: "The requested user was not found.",
 *
 *   // Action-specific translations (auto-generated based on resource actions)
 *   read: {
 *     label: "View User",
 *     title: "Click to view a specific user.",
 *     zero: "No users found.",
 *     one: "Viewing one user.",
 *     other: "Viewing %{count} users."
 *   },
 *   create: {
 *     label: "Create User",
 *     title: "Click to add a new user.",
 *     zero: "No users created.",
 *     one: "Created one user.",
 *     other: "Created %{count} users."
 *   },
 *   update: {
 *     label: "Update User",
 *     title: "Click to update a specific user.",
 *     zero: "No users updated.",
 *     one: "Updated one user.",
 *     other: "Updated %{count} users."
 *   },
 *   delete: {
 *     label: "Delete User",
 *     title: "Click to delete a specific user.",
 *     zero: "No users deleted.",
 *     one: "Deleted one user.",
 *     other: "Deleted %{count} users."
 *   },
 *
 *   // Additional custom translations
 *   customAction: "Custom action performed",
 *   validationError: "Please check your input"
 * };
 * ```
 *
 * ### Notes:
 *
 * - The action translations are automatically inferred from the resource's action definitions.
 * - The `zero`, `one`, and `other` fields support pluralization in internationalization.
 * - The `%{count}` placeholder can be used in pluralization messages for dynamic counts.
 * - Additional properties allow for custom translations specific to the resource's needs.
 * - This type ensures type safety by tying translations directly to the resource structure.
 */
export type ResourceTranslation<Name extends ResourceName> = {
  /**
   * The display name of the resource (required).
   */
  label: string;
  /**
   * The title or heading for the resource (optional).
   */
  title?: string;
  /**
   * A detailed description of the resource (optional).
   */
  description?: string;
  /**
   * Error message when access to the resource is forbidden (required).
   */
  forbiddenError: string;
  /**
   * Error message when the resource is not found (required).
   */
  notFoundError: string;
} & (Resources[Name] extends { actions: infer Actions }
  ? Actions extends Record<string, ResourceAction>
    ? {
        [Key in keyof Actions]: {
          /**
           * The display label for the action.
           */
          label?: string;
          /**
           * The tooltip or help text for the action.
           */
          title?: string;
          /**
           * Message when no items are affected (for pluralization).
           */
          zero?: string;
          /**
           * Message when one item is affected (for pluralization).
           */
          one?: string;
          /**
           * Message when multiple items are affected (for pluralization).
           */
          other?: string;
        };
      }[keyof Actions]
    : {}
  : {}) &
  Dictionary;
