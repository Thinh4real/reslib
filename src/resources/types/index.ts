import { IAuthPerm } from "@/auth/types";
import { IInputFormatterOptions } from "@/inputFormatter/types";
import { IUcFirst } from "@/types/dictionary";
import { IMongoQuery, IResourceQueryOrderBy } from "./filters";

export * from "./filters";

export interface IFieldBase<
  FieldType extends IFieldType = IFieldType,
  ValueType = any
> extends Partial<IResourceActionTupleObject<IResourceName>>,
    Omit<IInputFormatterOptions<FieldType, ValueType>, "value" | "type"> {
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
   * const textField: IFieldBase = {
   *   type: 'text'
   * };
   * ```
   */
  type: FieldType;

  /**
   * The name of the field.
   *
   * @description
   * This property specifies the unique name or identifier for the field.
   *
   * @example
   * ```typescript
   * const textField: IFieldBase = {
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
   * const textField: IFieldBase = {
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
   * const textField: IFieldBase = {
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
  perm?: IAuthPerm;

  /**
   * The default value of the field.
   */
  defaultValue?: ValueType;
}
// Mapped type that ensures all values in IFieldMap extend IFieldBase
export interface IFieldMap {}

/**
 * Interface defining the mapping of field actions to their string identifiers.
 * Used to specify which actions are available for different field operations.
 *
 * This interface provides a standardized way to reference field actions throughout
 * the application, ensuring consistency in field operation naming.
 *
 * @interface IFieldActionsMap
 *
 * @example
 * ```typescript
 * // Basic usage - defining field actions for a form
 * const fieldActions: IFieldActionsMap = {
 *   create: "createField",
 *   update: "updateField",
 *   createOrUpdate: "createOrUpdateField",
 *   filter: "filterField"
 * };
 *
 * // Usage in field configuration
 * const textField: IField = {
 *   type: "text",
 *   name: "username",
 *   forCreate: { required: true, minLength: 3 },
 *   forUpdate: { required: false },
 *   forFilter: { caseSensitive: false }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage - conditional field actions based on user permissions
 * function getFieldActions(userRole: string): Partial<IFieldActionsMap> {
 *   const actions: Partial<IFieldActionsMap> = {};
 *
 *   if (userRole === 'admin') {
 *     actions.create = 'adminCreate';
 *     actions.update = 'adminUpdate';
 *     actions.createOrUpdate = 'adminCreateOrUpdate';
 *     actions.filter = 'adminFilter';
 *   } else if (userRole === 'editor') {
 *     actions.update = 'editorUpdate';
 *     actions.filter = 'editorFilter';
 *   } else {
 *     actions.filter = 'readonlyFilter';
 *   }
 *
 *   return actions;
 * }
 * ```
 */
export interface IFieldActionsMap {
  create: string;
  update: string;
  createOrUpdate: string;
  filter: string;
}

export type IField<
  T extends IFieldType = IFieldType,
  ValueType = any
> = IFieldMap[T] extends IFieldBase
  ? IFieldMap[T] & {
      [key in keyof IFieldActionsMap as `for${IUcFirst<key>}`]?: Partial<
        IFieldMap[keyof IFieldMap]
      >;
    }
  : never;

/**
 * Type representing a collection of fields where each key is a string and each value is an IField.
 * This type is used to define the structure of fields for a resource or form.
 *
 * This type provides a flexible way to define multiple fields with their configurations,
 * validation rules, and action-specific overrides. It's commonly used when defining
 * the schema for resources, forms, or data validation.
 *
 * @type IFields
 *
 * @example
 * ```typescript
 * // Basic field collection for a user resource
 * const userFields: IFields = {
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
 * function createFieldsForUser(userRole: string): IFields {
 *   const baseFields: IFields = {
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
 * function validateFormData(fields: IFields, data: Record<string, any>): ValidationResult {
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
export type IFields = Record<string, IField>;

/**
 * Type representing the union of all possible field types defined in IFieldMap.
 * This type is used to constrain field types to only those defined in the field map.
 *
 * This type ensures type safety by only allowing field types that have been
 * explicitly defined in the IFieldMap interface. It prevents typos and ensures
 * that all field types are known and properly configured.
 *
 * @type IFieldType
 *
 * @example
 * ```typescript
 * // Basic usage - defining a field with a valid type
 * const textField: IFieldBase<"text"> = {
 *   type: "text", // ✓ Valid - "text" is in IFieldMap
 *   name: "username",
 *   required: true
 * };
 *
 * const emailField: IFieldBase<"email"> = {
 *   type: "email", // ✓ Valid - "email" is in IFieldMap
 *   name: "userEmail",
 *   required: true
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe field type checking
 * function createField<T extends IFieldType>(
 *   type: T,
 *   config: Omit<IFieldBase<T>, 'type'>
 * ): IFieldBase<T> {
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
 * // Error: "invalidType" is not assignable to IFieldType
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic field type validation
 * function isValidFieldType(type: string): type is IFieldType {
 *   const validTypes: IFieldType[] = ["text", "number", "boolean", "date", "email"];
 *   return validTypes.includes(type as IFieldType);
 * }
 *
 * // Usage in runtime validation
 * function validateFieldType(input: string): IFieldType {
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
export type IFieldType = keyof IFieldMap;

/**
 * A global declaration for all resource names. This is the exported name of the IResourceName type.
 * Represents a type for all resource names.
 * This type is a union of all possible resource names.
 * 
 * @description
 * This interface serves as a map for all resource names.
 * 
 * @example
 * ```typescript
  import "reslib";
 * declare module "reslib" {
 *   interface IResources {
 *   users : {
 *      actions : {
 *          read: {
 *              label: "Read User",
 *              title: "Click to read a specific user.",
 *          };
 *          create: {
 *              label: "Create User",
 *              title: "Click to create a new user.",
 *          };
 *          update: {
 *              label: "Update User",
 *              title: "Click to update a specific user.",
 *          };
 *          delete: {
 *              label: "Delete User",
 *              title: "Click to delete a specific user.",
 *          };
 *          all: {
 *              label: "All Actions",    
 *              title: "Click to perform all actions on the user.",
 *          };
 *      }
 *    }
 *   }
 * }
 * ```
 * This means that any variable or property with type `IResourceName` can only hold 
 * one of the values 'users', 'roles', or 'sales'.
 * 
 * @example
 * ```typescript
 * let resourceName: IResourceName = 'users'; // valid * let invalidResourceName: IResourceName = 'unknownResource'; // error: Type '"unknownResource"' is not assignable to type 'IResourceName'.
 * ```
 */
export interface IResources {}

type ValidatedResourceRegistry = {
  [K in keyof IResources]: ValidateResource<IResources[K]>;
};

type ValidateResource<T> = T extends IResource ? T : never;

// Helper type to get a specific resource's metadata (validated)
/**
 * Helper type to get a specific resource's metadata (validated).
 * Ensures that the resource conforms to the IResource interface structure.
 *
 * This type provides type-safe access to resource definitions, ensuring that
 * only valid resources (those defined in IResources) can be accessed and that
 * they conform to the expected IResource structure.
 *
 * @type GetResource
 * @template ResourceName - The name of the resource to retrieve
 *
 * @example
 * ```typescript
 * // Basic usage - getting a validated resource type
 * import "reslib";
 *
 * declare module "reslib" {
 *   interface IResources {
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
 *         publish: { label: "Publish Post" };
 *       }
 *     };
 *   }
 * }
 *
 * // Type-safe resource access
 * type UserResource = GetResource<"users">;
 * // Result: The validated users resource with proper typing
 *
 * type PostResource = GetResource<"posts">;
 * // Result: The validated posts resource with proper typing
 * ```
 *
 * @example
 * ```typescript
 * // Using with resource functions
 * function processResource<ResourceName extends IResourceName>(
 *   resourceName: ResourceName,
 *   data: GetResource<ResourceName>
 * ) {
 *   // TypeScript knows the exact structure of data based on resourceName
 *   console.log(`Processing ${resourceName}:`, data.actions);
 * }
 *
 * // Usage
 * const userResource: GetResource<"users"> = {
 *   actions: {
 *     read: { label: "Read User" },
 *     create: { label: "Create User" },
 *     update: { label: "Update User" }
 *   }
 * };
 *
 * processResource("users", userResource); // ✓ Valid
 * // processResource("invalid", userResource); // ✗ TypeScript error
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage - resource registry
 * class ResourceRegistry {
 *   private resources = new Map<IResourceName, GetResource<IResourceName>>();
 *
 *   register<ResourceName extends IResourceName>(
 *     name: ResourceName,
 *     resource: GetResource<ResourceName>
 *   ) {
 *     this.resources.set(name, resource);
 *   }
 *
 *   get<ResourceName extends IResourceName>(
 *     name: ResourceName
 *   ): GetResource<ResourceName> | undefined {
 *     return this.resources.get(name) as GetResource<ResourceName>;
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
 * const userResource = registry.get("users");
 * // TypeScript knows userResource has the users resource structure
 * ```
 */
export type GetResource<ResourceName extends IResourceName> =
  ValidatedResourceRegistry[ResourceName];

export type IResourceName = keyof ValidatedResourceRegistry;

/**
 * Type representing the action names for a specific resource.
 * This type extracts the literal action name strings from a resource's actions.
 *
 * This type provides compile-time safety by ensuring that only valid action names
 * for a specific resource can be used. It preserves literal types, enabling better
 * autocomplete and error detection.
 *
 * @type IResourceActionName
 * @template ResourceName - The name of the resource (optional, defaults to all resources)
 *
 * @example
 * ```typescript
 * // Basic usage with specific resource
 * import "reslib";
 *
 * declare module "reslib" {
 *   interface IResources {
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
 * type UserActionName = IResourceActionName<"users">;
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
 * function createActionHandler<ResourceName extends IResourceName>(
 *   resourceName: ResourceName,
 *   actionName: IResourceActionName<ResourceName>
 * ) {
 *   return {
 *     execute: () => console.log(`Executing ${actionName} on ${resourceName}`),
 *     getActionName: (): IResourceActionName<ResourceName> => actionName
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
 * // Error: "delete" is not assignable to IResourceActionName<"users">
 * ```
 *
 * @example
 * ```typescript
 * // Runtime action validation
 * function isValidAction<ResourceName extends IResourceName>(
 *   resourceName: ResourceName,
 *   actionName: string
 * ): actionName is IResourceActionName<ResourceName> {
 *   // This would typically check against the resource's defined actions
 *   const validActions = getResourceActions(resourceName);
 *   return validActions.includes(actionName as IResourceActionName<ResourceName>);
 * }
 *
 * // Usage
 * if (isValidAction("users", "read")) {
 *   // TypeScript now knows actionName is IResourceActionName<"users">
 *   const handler = createActionHandler("users", "read");
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Action name arrays with type safety
 * function getAllActionNames<ResourceName extends IResourceName>(
 *   resourceName: ResourceName
 * ): IResourceActionName<ResourceName>[] {
 *   // Implementation would return all action names for the resource
 *   return [] as IResourceActionName<ResourceName>[];
 * }
 *
 * // Usage
 * const userActions = getAllActionNames("users");
 * // TypeScript knows userActions contains only valid user action names
 *
 * userActions.forEach(action => {
 *   // action is typed as IResourceActionName<"users">
 *   console.log(`User action: ${action}`);
 * });
 * ```
 */
export type IResourceActionName<
  ResourceName extends IResourceName = IResourceName
> = IResourceGetActionNames<GetResource<ResourceName>>;

/**
 * @interface IResourceActionTuple
 * Represents a tuple that contains a resource name and an action name.
 * This type is a union of two possible tuple formats: `IResourceActionTupleArray` and `IResourceActionTupleObject`.
 *
 * @template ResourceName - The name of the resource. Defaults to `IResourceName`.
 *
 * @example
 * ```typescript
 * // Using IResourceActionTupleArray
 * const actionTuple: IResourceActionTuple = ["users", "read"];
 *
 * // Using IResourceActionTupleObject
 * const actionTuple: IResourceActionTuple = { resourceName: "users", action: "read" };
 * ```
 *
 * @typeParam ResourceName - The name of the resource.
 * @default IResourceName
 *
 * @typedef {(IResourceActionTupleArray<ResourceName> | IResourceActionTupleObject<ResourceName>)} IResourceActionTuple
 *
 * @see {@link IResourceActionTupleArray} for the `IResourceActionTupleArray` type.
 * @see {@link IResourceActionTupleObject} for the `IResourceActionTupleObject` type.
 */
export type IResourceActionTuple<ResourceName extends IResourceName> =
  | IResourceActionTupleArray<ResourceName>
  | IResourceActionTupleObject<ResourceName>;

/**
 * @interface IResourceActionTupleArray
 * Represents a tuple that contains a resource name and an action name in an array format.
 * This type is a tuple with two elements: the resource name and the action name.
 *
 * @template ResourceName - The name of the resource. Defaults to `IResourceName`.
 *
 * @example
 * ```typescript
 * const actionTuple: IResourceActionTupleArray = ["users", "read"];
 * ```
 *
 * @typeParam ResourceName - The name of the resource.
 * @default IResourceName
 *
 * @typedef {[ResourceName, IResourceActionName<ResourceName>]} IResourceActionTupleArray
 */
export type IResourceActionTupleArray<ResourceName extends IResourceName> = [
  /**
   * The name of the resource.
   *
   * @type {ResourceName}
   */
  ResourceName,
  /**
   * The name of the action.
   *
   * @type {IResourceActionName<ResourceName>}
   */
  IResourceActionName<ResourceName>
];

/**
 * @interface IResourceActionTupleObject
 * Represents a tuple that contains a resource name and an action name in an object format.
 * This type is an object with two properties: `resourceName` and `action`.
 *
 * @template ResourceName - The name of the resource. Defaults to `IResourceName`.
 *
 * @example
 * ```typescript
 * const actionTuple: IResourceActionTupleObject = { resourceName: "users", action: "read" };
 * ```
 *
 * @typeParam ResourceName - The name of the resource.
 * @default IResourceName
 *
 * @interface IResourceActionTupleObject
 */
export interface IResourceActionTupleObject<
  ResourceName extends IResourceName
> {
  /**
   * The name of the resource.
   *
   * @type {ResourceName}
   */
  resourceName: ResourceName;

  /**
   * The name of the action.
   *
   * @type {IResourceActionName<ResourceName>}
   */
  action: IResourceActionName<ResourceName>;
}
/**
 * @interface IResourceAction
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
 * Here is an example of how the `IResourceAction` interface can be utilized:
 *
 * ```typescript
 * // Define a resource action for creating a new document
 * const createDocumentAction: IResourceAction = {
 *     label: "Create Document",
 *     title: "Click to add a new document."
 * };
 *
 * // Function to display action information
 * function displayActionInfo(action: IResourceAction) {
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
 * - The `IResourceAction` interface is designed to be flexible, allowing developers to
 *   define actions with varying levels of details based on the needs of their application.
 * - By providing clear labels, titles, and tooltips, developers can enhance the user
 *   experience and make the application more intuitive.
 */
export interface IResourceAction {
  label?: string;
  title?: string;
}

type IResourceActionsRecord<TActions> = TActions extends Record<
  string,
  IResourceAction
>
  ? TActions & Partial<IResourceDefaultActions>
  : never;

/**
 * Type representing the actions record for a specific resource.
 * This type extracts the actions from a resource's definition, ensuring type safety.
 *
 * This type provides access to the complete actions object for a resource,
 * maintaining the exact structure and types as defined in the resource's configuration.
 * It's useful when you need to work with the entire set of actions for a resource.
 *
 * @type IResourceActions
 * @template ResourceName - The name of the resource
 *
 * @example
 * ```typescript
 * // Basic usage - getting resource actions type
 * import "reslib";
 *
 * declare module "reslib" {
 *   interface IResources {
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
 * type UserActions = IResourceActions<"users">;
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
 * function validateResourceActions<ResourceName extends IResourceName>(
 *   resourceName: ResourceName,
 *   actions: IResourceActions<ResourceName>
 * ): boolean {
 *   // Check if all required actions are present
 *   const requiredActions: (keyof IResourceActions<ResourceName>)[] = ['read', 'create', 'update'];
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
 * function createActionHandlers<ResourceName extends IResourceName>(
 *   resourceName: ResourceName,
 *   actions: IResourceActions<ResourceName>
 * ) {
 *   const handlers: Record<string, () => void> = {};
 *
 *   // TypeScript knows the exact action names available
 *   for (const actionName in actions) {
 *     handlers[actionName] = () => {
 *       const action = actions[actionName as keyof IResourceActions<ResourceName>];
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
 *   private permissions = new Map<IResourceName, Set<string>>();
 *
 *   grantPermission<ResourceName extends IResourceName>(
 *     resourceName: ResourceName,
 *     actions: (keyof IResourceActions<ResourceName>)[]
 *   ) {
 *     const current = this.permissions.get(resourceName) || new Set();
 *     actions.forEach(action => current.add(action as string));
 *     this.permissions.set(resourceName, current);
 *   }
 *
 *   hasPermission<ResourceName extends IResourceName>(
 *     resourceName: ResourceName,
 *     action: keyof IResourceActions<ResourceName>
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
export type IResourceActions<ResourceName extends IResourceName> =
  IResources[ResourceName] extends { actions: Record<string, IResourceAction> }
    ? IResourceActionsRecord<IResources[ResourceName]["actions"]>
    : never;

/**
 * Utility type to extract action names from a resource actions record.
 * This preserves the literal types of the action keys.
 *
 * @template T - The actions record type
 * @example
 * ```typescript
 * const actions = {
 *   read: { label: "Read" },
 *   create: { label: "Create" },
 *   custom: { label: "Custom" }
 * } as const;
 *
 * type ActionNames = IResourceActionNames<typeof actions>;
 * // Result: "read" | "create" | "custom"
 * ```
 */
export type IResourceActionNames<T extends Record<string, IResourceAction>> =
  keyof T & string;

type IResourceGetActionNames<
  TResource extends { actions?: Record<string, IResourceAction> }
> = keyof IResourceActionsRecord<TResource["actions"]> & string;

export interface IResourceDefaultActions {
  /**
   * The read action for the resource.
   * This action is used to retrieve a specific resource.
   *
   * @type {IResourceAction}
   * @example
   * ```typescript
   * const readAction: IResourceAction = {
   *     label: "Read Resource",
   *     title: "Click to read a specific resource.",
   * };
   * ```
   */
  read: IResourceAction;

  /**
   * The create action for the resource.
   * This action is used to create a new resource.
   *
   * @type {IResourceAction}
   * @example
   * ```typescript
   * const createAction: IResourceAction = {
   *     label: "Create Resource",
   *     title: "Click to create a new resource.",
   * };
   * ```
   */
  create: IResourceAction;

  /**
   * The update action for the resource.
   * This action is used to update a specific resource.
   *
   * @type {IResourceAction}
   * @example
   * ```typescript
   * const updateAction: IResourceAction = {
   *     label: "Update Resource",
   *     title: "Click to update a specific resource.",
   * };
   * ```
   */
  update: IResourceAction;

  /**
   * The delete action for the resource.
   * This action is used to delete a specific resource.
   *
   * @type {IResourceAction}
   * @example
   * ```typescript
   * const deleteAction: IResourceAction = {
   *     label: "Delete Resource",
   *     title: "Click to delete a specific resource.",
   * };
   * ```
   */
  delete: IResourceAction;

  /**
   * The all action for the resource.
   * This action is used to perform all actions on the resource.
   *
   * @type {IResourceAction}
   * @example
   * ```typescript
   * const allAction: IResourceAction = {
   *     label: "All Actions",
   *     title: "Click to perform all actions on the resource.",
   * };
   * ```
   */
  all: IResourceAction;
}

export interface IResource<
  Name extends IResourceName = IResourceName,
  DataType = unknown,
  PrimaryKeyType extends IResourcePrimaryKey = IResourcePrimaryKey,
  Actions extends Record<string, IResourceAction> = Record<
    string,
    IResourceAction
  >
> {
  /**
   * The internal name of the resource.
   *
   * This name is used within the system for referencing the resource programmatically.
   * It is often a short, unique identifier for the resource.
   *
   * @example
   * ```typescript
   * const userResource: IResource = { name: "user" };
   * ```
   */
  name?: IResourceName;

  /**
   * A user-friendly label for the resource.
   *
   * This is typically a shorter name intended for display in UI elements, such as dropdowns or buttons.
   * It helps users identify the resource within the user interface.
   *
   * @example
   * ```typescript
   * const productResource: IResource = { label: "Product" };
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
   * const userResource: IResource = { title: "This resource manages user information." };
   * ```
   */
  title?: string;

  /**
   * The actions associated with this resource.
   * This is a well-typed record that preserves key inference while satisfying Record<string, IResourceAction>.
   *
   * @example
   * ```typescript
   * const userResource: IResource = {
   *   actions: {
   *     read: { label: "Read User" },
   *     create: { label: "Create User" },
   *     archive: { label: "Archive User" } // Custom action
   *   }
   * };
   *
   * // TypeScript infers: "read" | "create" | "archive"
   * type UserActionNames = IResourceGetActionNames<typeof userResource>;
   *
   * // Still compatible with generic Record<string, IResourceAction>
   * const genericActions: Record<string, IResourceAction> = userResource.actions;
   * ```
   */
  actions: IResourceActionsRecord<Actions>;

  /***
   * The class name of the resource
   * This information is used to identify the resource class in the application.
   * It is retrieved from the target class passed to the @ResourceMeta decorator.
   */
  className?: string;
}

/**
 * @type IResourcePrimaryKey
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
 *     const compositeKey: PrimaryKeyType = { userId: "user123", orderId: 456 };
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
 * - Consider using `IResource` for defining the overall structure of a resource
 *   that utilizes this primary key type.
 *
 * ### Example Usage:
 * Here’s how you might use the `IResourcePrimaryKey` type in a function that
 * retrieves a resource by its primary key:
 *
 * ```typescript
 * function getResourceById(id: PrimaryKeyType): ResourceMeta {
 *     // Implementation to list the resource based on the provided primary key
 * }
 *
 * const resource = getResourceById("user123"); // Fetching by string ID
 * const anotherResource = getResourceById(456); // Fetching by numeric ID
 * const compositeResource = getResourceById({ userId: "user123", orderId: 456 }); // Fetching by composite key
 * ```
 *
 * ### Summary:
 * The `IResourcePrimaryKey` type provides a versatile way to define primary keys
 * for resources, supporting simple and complex identifiers. This flexibility is
 * essential for applications that manage diverse data structures and require
 * unique identification of resources.
 */
export type IResourcePrimaryKey = string | number | object;

/**
 * @interface IResourceDataService
 *
 * Represents a data provider interface for managing resources.
 * This interface defines methods for performing CRUD (Create, Read, Update, Delete)
 * operations on resources, allowing for flexible data management.
 *
 * @template DataType - The type of the resource data being managed. Defaults to `any`,
 * allowing for flexibility in the type of data handled by the provider.
 *
 * @template PrimaryKeyType - The type of the primary key used to identify resources.
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
 * - **update(primaryKey: PrimaryKeyType, updatedData: Partial<DataType>)**: Updates an existing resource record.
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
 * - **delete(primaryKey: PrimaryKeyType)**: Deletes a resource record by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to delete.
 *     indicating the success or failure of the delete operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.delete("resourceId");
 *     ```
 *
 * - **findOne(primaryKey: PrimaryKeyType)**: Retrieves a single resource record by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to retrieve.
 *   - **Returns**: A promise that resolves to an `DataType | null`,
 *     containing the requested resource record or null if not found.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.findOne("resourceId");
 *     ```
 *
 * - **findOneOrFail(primaryKey: PrimaryKeyType)**: Retrieves a single resource record by its primary key or throws an error if not found.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to retrieve.
 *   - **Returns**: A promise that resolves to an `DataType`,
 *     containing the requested resource record.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.findOneOrFail("resourceId");
 *     ```
 *
 * - **find(options?: IResourceQueryOptions<DataType>)**: Retrieves multiple resource records based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the results.
 *   - **Returns**: A promise that resolves to an `IResourcePaginatedResult<DataType>`,
 *     containing the list of resource records.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.find({ limit: 10, skip: 0 });
 *     ```
 *
 * - **findAndCount(options?: IResourceQueryOptions<DataType>)**: Retrieves multiple resource records and the total count based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the results.
 *   - **Returns**: A promise that resolves to an `IResourcePaginatedResult<DataType>`,
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
 * - **updateMany(data: IResourceManyCriteria<PrimaryKeyType,DataType>)**: Updates multiple resource records.
 *   - **Parameters**:
 *     - `data`: An object containing the updated data for the resources.
 *   - **Returns**: A promise that resolves to an `DataType[]`,
 *     indicating the success or failure of the update operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.updateMany({ status: "active" });
 *     ```
 *
 * - **deleteMany(criteria: IResourceQueryOptions<DataType>)**: Deletes multiple resource records based on criteria.
 *   - **Parameters**:
 *     - `criteria`: The criteria to filter which resources to delete.
 *   - **Returns**: A promise that resolves to an `number`,
 *     indicating the success or failure of the delete operation.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.deleteMany({ filters: { status: "inactive" } });
 *     ```
 *
 * - **count(options?: IResourceQueryOptions<DataType>)**: Counts the total number of resource records based on query options.
 *   - **Parameters**:
 *     - `options`: Optional query options to filter the count.
 *   - **Returns**: A promise that resolves to an `number`,
 *     containing the total count of resource records.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.count({ filters: { status: "active" } });
 *     ```
 *
 * - **exists(primaryKey: PrimaryKeyType)**: Checks if a resource record exists by its primary key.
 *   - **Parameters**:
 *     - `primaryKey`: The primary key of the resource to check.
 *   - **Returns**: A promise that resolves to an `boolean`,
 *     indicating whether the resource exists.
 *   - **Example**:
 *     ```typescript
 *     const result = await dataProvider.exists("resourceId");
 *     ```
 *
 * - **distinct?(field: keyof DataType, options?: IResourceQueryOptions<DataType>)**: Retrieves distinct values for a specified field.
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
 * Here’s how you might implement the `IResourceDataService` interface:
 *
 * ```typescript
 * class MyDataProvider implements IResourceDataService<MyResourceType> {
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
 * The `IResourceDataService` interface defines a comprehensive set of methods
 * for managing resources, facilitating CRUD operations and ensuring a consistent
 * approach to data handling in applications.
 */
export interface IResourceDataService<
  DataType = unknown,
  PrimaryKeyType extends IResourcePrimaryKey = IResourcePrimaryKey
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
   * @param updatedData An object containing the updated data for the resource.
   * @returns A promise that resolves to an `DataType`,
   * indicating the success or failure of the update operation.
   * @example
   *   ```typescript
   *   const result = await dataProvider.update("resourceId", { name: "Updated ResourceMeta" });
   *     ```
   */
  update<T extends Partial<DataType>>(
    primaryKey: PrimaryKeyType,
    updatedData: T
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
  delete(primaryKey: PrimaryKeyType): Promise<boolean>;
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
    options: PrimaryKeyType | IResourceQueryOptions<DataType>
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
    options: PrimaryKeyType | IResourceQueryOptions<DataType>
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
  find(options?: IResourceQueryOptions<DataType>): Promise<DataType[]>;

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
    options?: IResourceQueryOptions<DataType>
  ): Promise<[DataType[], number]>;

  /***
   * Retrieves multiple resource records and paginates the results.
   * @param options Optional query options to filter the results.
   * @returns A promise that resolves to an `IResourcePaginatedResult<DataType>`,
   * containing the list of resource records and the total count.
   * @example
   *   ```typescript
   *   const result = await dataProvider.findAndPaginate({ limit: 10, skip: 0 });
   */
  findAndPaginate(
    options?: IResourceQueryOptions<DataType>
  ): Promise<IResourcePaginatedResult<DataType>>;

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
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>,
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
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>
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
  count(options?: IResourceQueryOptions<DataType>): Promise<number>;
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
  exists(primaryKey: PrimaryKeyType): Promise<boolean>;

  /**
   * Retrieves distinct values for a specific field across all resource records.
   *
   * This method returns an array of unique values for the specified field from all records
   * in the resource collection. It's useful for generating dropdown options, filtering criteria,
   * or understanding the data distribution across a particular field.
   *
   * **Use Cases:**
   * - Generating filter dropdowns (e.g., unique categories, statuses, tags)
   * - Data analysis and reporting (e.g., unique values in a dataset)
   * - Form validation (e.g., checking existing values)
   * - Search suggestions and autocomplete
   *
   * **Query Filtering:**
   * - The `options.where` parameter can filter which records are considered for distinct values
   * - Other query options like `includeDeleted` affect which records are included
   * - Results are always deduplicated regardless of the underlying data
   *
   * @template DataType - The resource data type for type-safe field selection
   * @param {keyof DataType} field - The field name to get distinct values for
   * @param {IResourceQueryOptions<DataType>} [options] - Optional query options to filter the records
   * @returns {Promise<any[]>} Array of distinct values for the specified field
   *
   * @example
   * ```typescript
   * // Get all unique user roles
   * interface User {
   *   id: number;
   *   name: string;
   *   role: 'admin' | 'user' | 'moderator';
   *   department: string;
   * }
   *
   * const userRoles = await dataService.distinct('role');
   * // Result: ['admin', 'user', 'moderator']
   * ```
   *
   * @example
   * ```typescript
   * // Get distinct departments for active users only
   * const departments = await dataService.distinct('department', {
   *   where: { status: 'active' }
   * });
   * // Result: ['Engineering', 'Sales', 'Marketing'] (only from active users)
   * ```
   *
   * @example
   * ```typescript
   * // Get unique tags from published posts
   * interface Post {
   *   id: number;
   *   title: string;
   *   tags: string[];
   *   status: 'draft' | 'published';
   * }
   *
   * const tags = await dataService.distinct('tags', {
   *   where: { status: 'published' }
   * });
   * // Result: ['javascript', 'typescript', 'react', 'node.js']
   * ```
   *
   * @example
   * ```typescript
   * // Get distinct product categories
   * const categories = await dataService.distinct('category');
   * // Result: ['Electronics', 'Clothing', 'Books', 'Home & Garden']
   * ```
   *
   * @example
   * ```typescript
   * // Get unique order statuses with filtering
   * const orderStatuses = await dataService.distinct('status', {
   *   where: {
   *     createdAt: { $gte: new Date('2024-01-01') } // Only recent orders
   *   }
   * });
   * // Result: ['pending', 'shipped', 'delivered'] (from orders in 2024+)
   * ```
   *
   * @example
   * ```typescript
   * // Include soft-deleted records in distinct values
   * const allStatuses = await dataService.distinct('status', {
   *   includeDeleted: true
   * });
   * // Result: ['active', 'inactive', 'suspended', 'archived'] (including deleted)
   * ```
   *
   * @example
   * ```typescript
   * // Get distinct values for nested object fields
   * interface User {
   *   id: number;
   *   profile: {
   *     city: string;
   *     country: string;
   *   };
   * }
   *
   * const cities = await dataService.distinct('profile.city');
   * // Result: ['New York', 'London', 'Tokyo', 'Paris']
   * ```
   *
   * @example
   * ```typescript
   * // Use in form validation - check if email already exists
   * const existingEmails = await dataService.distinct('email');
   * const isEmailTaken = existingEmails.includes('newuser@example.com');
   * ```
   *
   * @example
   * ```typescript
   * // Generate filter options for a search interface
   * const filterOptions = {
   *   categories: await dataService.distinct('category'),
   *   statuses: await dataService.distinct('status'),
   *   priorities: await dataService.distinct('priority')
   * };
   * // Use these in dropdown components
   * ```
   *
   * @example
   * ```typescript
   * // Data analysis - count frequency of values
   * const colors = await dataService.distinct('color');
   * const colorCounts = {};
   * for (const color of colors) {
   *   colorCounts[color] = await dataService.count({
   *     where: { color }
   *   });
   * }
   * // Result: { 'red': 15, 'blue': 8, 'green': 12, 'yellow': 5 }
   * ```
   *
   * @remarks
   * - Results are automatically deduplicated (no duplicate values in the array)
   * - The order of returned values is not guaranteed (depends on database implementation)
   * - Null and undefined values are typically excluded from results
   * - For array fields, individual array elements become separate distinct values
   * - The method is optional - not all data service implementations may support it
   * - Performance may vary based on field cardinality and data size
   * - Consider indexing the field for better performance on large datasets
   */
  distinct?(
    field: keyof DataType,
    options?: IResourceQueryOptions<DataType>
  ): Promise<any[]>;

  /**
   * // Supports MongoDB-style aggregation pipelines
   * Aggregates resources based on a pipeline.
   * @param pipeline
   */
  aggregate?(pipeline: any[]): Promise<any[]>;
}

/**
 * @type IResourceManyCriteria
 *
 * Represents the criteria used for  multiple actions on a resource.
 * This type allows for flexible definitions of what constitutes an update,
 * accommodating various scenarios based on the primary key or partial data.
 *
 * ### Type Parameters
 * - **PrimaryKeyType**: The type of the primary key used to identify resources.
 *   Defaults to `IResourcePrimaryKey`, which can be a string, number, or object.
 * - **DataType**: The type of data associated with the resource. Defaults to `IDict`,
 *   which is a generic dictionary type allowing for any key-value pairs.
 *
 * ### Possible Forms
 * The `IResourceManyCriteria` can take one of the following forms:
 *
 * 1. **Array of Primary Keys**:
 *    - An array of primary keys that uniquely identify the resources to be updated.
 *    - **Example**:
 *      ```typescript
 *      const updateCriteria: IResourceManyCriteria<string> = ["user123", "user456"];
 *      ```
 *
 * 2. **Partial Data Object**:
 *    - An object containing partial data that represents the fields to be updated.
 *    - **Example**:
 *      ```typescript
 *      const updateCriteria: IResourceManyCriteria<string, { name: string; age: number }> = {
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
 *      const updateCriteria: IResourceManyCriteria<string, { name: string; age: number }> = {
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
 * Here’s how you might use the `IResourceManyCriteria` type in a function that
 * updates resources:
 *
 * ```typescript
 * function updateResources(criteria: IResourceManyCriteria<string, { name: string; age: number }>) {
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
 * @typeParam PrimaryKeyType - The type of the primary key used to identify resources.
 * @default IResourcePrimaryKey
 * @see {@link IResourcePrimaryKey} for the `IResourcePrimaryKey` type.
 * @see {@link IMongoQuery} for the `IMongoQuery` type.
 * @example
 * // Example of using IResourceManyCriteria
 * const criteria: IResourceManyCriteria<string, { name: string; age: number }> = {
 *   name: "John Doe",
 *   age: 30
 * };
 * @Example
 * // Example of using IResourceManyCriteria with an array of primary keys
 * const criteria: IResourceManyCriteria<string, { name: string; age: number }> = [
 *   "user123",
 *   "user456"
 * ];
 */
export type IResourceManyCriteria<
  DataType = unknown,
  PrimaryKeyType extends IResourcePrimaryKey = IResourcePrimaryKey
> = PrimaryKeyType[] | IMongoQuery<DataType>;

/**
 * Interface representing options for fetching resources.
 *
 * This interface allows you to specify various options when retrieving resources,
 * including filters to narrow down the results based on specific criteria.
 *
 * @template DataType - The type of data being fetched. Defaults to 'any'.
 * @example
 * // Example of using IResourceQueryOptions
 * const fetchOptions: IResourceQueryOptions<MyDataType, string> = {
 *     filters: {
 *             status: { $eq: "active" }, // Filter for active resources
 *             category: { $in: ["A", "B"] } // Filter for categories A or B
 *      },
 *      orderBy: { createdAt: 'desc' }, // Sort by creation date descending
 *      limit: 20, // Limit results to 20
 *      skip: 0 // Do not skip any results
 * };
 */
export interface IResourceQueryOptions<DataType = unknown> {
  /** Fields to include in the response. */
  fields?: Array<keyof DataType extends never ? string : keyof DataType>;
  relations?: string[]; // The relations to include in the response.
  orderBy?: IResourceQueryOrderBy<DataType>; // Optional sorting criteria for the results
  limit?: number; // Optional limit on the number of results to return
  skip?: number; // Optional number of results to skip before returning
  page?: number; // Optional page number for pagination, We can use it instead of skip

  /** Include relationships or nested resources. */
  include?: IResourceName[];

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
   * @type {IMongoQuery}
   * @see {@link https://www.mongodb.com/docs/manual/reference/operator/query/} for more information on MongoDB query operators.
   * @example
   * const queryOptions: IResourceQueryOptions<{ id: number, name: string }> = {
   *   where: {
   *     name : "John",
   *     surname : "Doe"
   *   },
   *   orderBy: { name: 'asc' },
   *   limit: 10,
   *   skip: 0
   * };
   * @see {@link IMongoQuery} for more information on where clauses.
   * @example
   * const queryOptions: IResourceQueryOptions<{ id: number, name: string }> = {
   *   where: {
   *     name : "John",
   *     surname : "Doe"
   *   },
   *   orderBy: { name: 'asc' },
   *   limit: 10,
   *   skip: 0
   * };
   */
  where?: IMongoQuery<DataType>;
}

/**
 * @interface IResourcePaginatedResult
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
 *     const result: IResourcePaginatedResult<User> = {
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
 * Here’s how you might use the `IResourcePaginatedResult` interface in a function that fetches paginated user data:
 *
 * ```typescript
 * async function fetchUsers(page: number): Promise<IResourcePaginatedResult<User>> {
 *     const response = await list(`http://api.example.com/users?page=${page}`);
 *     const result: IResourcePaginatedResult<User> = await response.json();
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
export interface IResourcePaginatedResult<DataType = unknown> {
  /** List of fetched resources. */
  data: DataType[];

  statusCode?: number; // HTTP status code for the operation
  success?: boolean; // Indicates if the operation was successful
  error?: any; // Optional error message if the operation failed
  message?: string; // Optional message for the operation
  status?: string; // Optional status of the operation
  errors?: string | Error[]; // Optional errors for the operation

  /** Pagination metadata. */
  meta?: IResourcePaginationMetaData;

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
 * @typedef IResourcePaginationMetaData
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
export interface IResourcePaginationMetaData {
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
 * @type IResourceDefaultEvent
 * @template ResourceName - The name of the resource
 *
 * @example
 * ```typescript
 * // Basic usage - event type for a specific resource
 * import "reslib";
 *
 * declare module "reslib" {
 *   interface IResources {
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
 * type UserEvent = IResourceDefaultEvent<"users">;
 * // Result: "read" | "create" | "update" | "archive" | "create" | "update" | "delete" | "findOne" | "find" | ...
 *
 * // Note: Includes both resource actions and data service methods
 * ```
 *
 * @example
 * ```typescript
 * // Event-driven resource management
 * class ResourceEventEmitter<ResourceName extends IResourceName> {
 *   private listeners = new Map<IResourceDefaultEvent<ResourceName>, Function[]>();
 *
 *   on(event: IResourceDefaultEvent<ResourceName>, listener: Function) {
 *     const current = this.listeners.get(event) || [];
 *     current.push(listener);
 *     this.listeners.set(event, current);
 *   }
 *
 *   emit(event: IResourceDefaultEvent<ResourceName>, data?: any) {
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
 * interface AuditLog<ResourceName extends IResourceName> {
 *   resource: ResourceName;
 *   event: IResourceDefaultEvent<ResourceName>;
 *   userId: string;
 *   timestamp: Date;
 *   data?: any;
 * }
 *
 * class ResourceAuditor {
 *   private logs: AuditLog<IResourceName>[] = [];
 *
 *   log<ResourceName extends IResourceName>(
 *     resource: ResourceName,
 *     event: IResourceDefaultEvent<ResourceName>,
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
 *   getLogsForResource<ResourceName extends IResourceName>(
 *     resource: ResourceName
 *   ): AuditLog<ResourceName>[] {
 *     return this.logs.filter(log => log.resource === resource) as AuditLog<ResourceName>[];
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
 * function useResourceEvent<ResourceName extends IResourceName>(
 *   resource: ResourceName,
 *   event: IResourceDefaultEvent<ResourceName>,
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
 * type MiddlewareFn<ResourceName extends IResourceName> = (
 *   event: IResourceDefaultEvent<ResourceName>,
 *   data: any,
 *   next: () => void
 * ) => void;
 *
 * class ResourceMiddleware<ResourceName extends IResourceName> {
 *   private middlewares: MiddlewareFn<ResourceName>[] = [];
 *
 *   use(middleware: MiddlewareFn<ResourceName>) {
 *     this.middlewares.push(middleware);
 *   }
 *
 *   async execute(event: IResourceDefaultEvent<ResourceName>, data: any) {
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
export type IResourceDefaultEvent<ResourceName extends IResourceName> =
  | IResourceActionName<ResourceName>
  | keyof IResourceDataService;

/**
 * Represents contextual information about a resource for operations like translations, logging, and error handling.
 *
 * This interface provides a standardized way to pass resource identification and contextual data
 * throughout the application. It's primarily used for internationalization, error messages, and
 * logging where resource-specific information is needed.
 *
 * @interface IResourceContext
 *
 * @example
 * ```typescript
 * // Basic usage in translations
 * const context: IResourceContext = {
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
 * const extendedContext: IResourceContext = {
 *   resourceName: "product",
 *   resourceLabel: "Product",
 *   category: "electronics",
 *   price: 99.99
 * };
 * ```
 */
export interface IResourceContext extends Record<string, any> {
  /** The unique programmatic name of the resource */
  resourceName: IResourceName;

  /** The human-readable label of the resource for display purposes */
  resourceLabel: string;
}

/**
 * @interface IResourceTranslations
 *
 * Represents the translation structure for resources in the application.
 * This type defines the expected structure of translations for each resource,
 * including labels, titles, and action-specific translations.
 *
 * @example
 * ```typescript
 * // resources actions translations structure :
 * // Here is an example of the structure of the translations for the "user" resource:
 * const userTranslations: IResourceTranslations = {
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
export type IResourceTranslations = {
  [Name in IResourceName]: IResourceTranslation<Name>;
}[IResourceName];

/**
 * @interface IResourceTranslation
 *
 * Represents the translation structure for a specific resource in the application.
 * This generic type defines the expected structure of translations for a given resource,
 * dynamically generating the translation keys based on the resource's defined actions.
 *
 * @template Name - The name of the resource for which translations are defined.
 * Must be a valid `IResourceName`.
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
 * const userTranslations: IResourceTranslation<"user"> = {
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
export type IResourceTranslation<Name extends IResourceName> = {
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
} & (IResources[Name] extends { actions: infer Actions }
  ? Actions extends Record<string, IResourceAction>
    ? {
        [Key in keyof Actions]: {
          /**
           * The display label for the action.
           */
          label: string;
          /**
           * The tooltip or help text for the action.
           */
          title: string;
          /**
           * Message when no items are affected (for pluralization).
           */
          zero: string;
          /**
           * Message when one item is affected (for pluralization).
           */
          one: string;
          /**
           * Message when multiple items are affected (for pluralization).
           */
          other: string;
        };
      }[keyof Actions]
    : {}
  : {}) &
  Record<string, any>;
