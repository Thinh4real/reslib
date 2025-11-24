import { IAuthUser } from '@/auth/types';
import { i18n } from '@/i18n';
import { observableFactory } from '@/observable';
import { Scope, TranslateOptions } from 'i18n-js';
import 'reflect-metadata';
import { Auth } from '../auth';
import { Logger } from '../logger';
import { IClassConstructor } from '../types/index';
import {
  defaultStr,
  extendObj,
  IInterpolateOptions,
  interpolate,
  isNonNullString,
  isObj,
  stringify,
} from '../utils/index';
import { getFields } from './fields';
import { ResourcePaginationHelper } from './ResourcePaginationHelper';
import {
  IField,
  IResource,
  IResourceAction,
  IResourceActionName,
  IResourceActions,
  IResourceActionTupleArray,
  IResourceContext,
  IResourceDataService,
  IResourceDefaultEvent,
  IResourceManyCriteria,
  IResourceName,
  IResourcePaginatedResult,
  IResourcePrimaryKey,
  IResourceQueryOptions,
} from './types';

export * from './decorators';
export * from './fields';
export * from './filters';
export * from './ResourcePaginationHelper';
export * from './types';

const resourcesMetaDataKey = Symbol('resources');
const resourcesClassNameMetaData = Symbol('resourceFromClassName');

export abstract class Resource<
  Name extends IResourceName = IResourceName,
  DataType = unknown,
  PrimaryKeyType extends IResourcePrimaryKey = IResourcePrimaryKey,
  EventType = IResourceDefaultEvent<Name>,
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
  protected abstract name: Name;
  private _onDictionaryChangedListener?: { remove: () => any };
  private _onLocaleChangeListener?: { remove: () => any };
  constructor() {
    this._onDictionaryChangedListener = i18n.on(
      'translations-changed',
      this.onI18nChange.bind(this)
    );
    this._onLocaleChangeListener = i18n.on(
      'locale-changed',
      this.onI18nChange.bind(this)
    );
    this.init();
  }
  actions?: Partial<IResourceActions<Name>>;
  getMetaData(): IResource<Name, DataType> {
    return Object.assign(
      {},
      Reflect.getMetadata(ResourcesManager.resourceMetaData, this.constructor)
    );
  }
  static events = observableFactory<
    IResourceDefaultEvent<IResourceName> | string
  >();

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
   * The tooltip provides additional context or information about the resource.
   *
   * Typically used in user interfaces to clarify what a particular resource represents or to give instructions.
   *
   * @example
   * ```typescript
   * const userResource: IResource = { title : "This resource manages user information." };
   * ```
   */
  title?: string;

  /**
  * A type that represents a map of field names to their corresponding IField instances.
   @description this is the list of fields that are part of the resource.It's a map where each key represents a field name, and the value contains field metadata.
   Fields are created using the @Field decorator when resources are defined.
  */
  fields?: Record<string, IField>;
  /**
   * Resolves the translations for the resource when the i18n dictionary or locale changes.
   * This method is called when the "translations-changed" or "locale-changed" events are triggered.
   */
  onI18nChange() {
    this.resolveTranslations();
  }
  /**
   * Resolves the translations for the resource when the i18n dictionary or locale changes.
   * This method is called when the "translations-changed" or "locale-changed" events are triggered.
   */
  resolveTranslations(options?: TranslateOptions) {
    return i18n.resolveTranslations(this);
  }
  /**
   * Removes the event listeners for the "translations-changed" and "locale-changed" events.
   * This method is called when the resource is being destroyed to clean up the event listeners.
   */
  destroy() {
    this._onDictionaryChangedListener?.remove();
    this._onLocaleChangeListener?.remove();
  }
  /**
   * Creates a resource context object containing the resource's name, label, and any additional parameters.
   *
   * This context is primarily used for internationalization (i18n) and event handling,
   * providing essential resource information to translation functions and event listeners.
   *
   * @param additionalParams - Optional additional parameters to include in the context object.
   * @returns An IResourceContext object containing resource information and additional parameters.
   *
   * @example
   * ```typescript
   * const context = resource.getResourceContext({ userId: 123 });
   * // Returns: { resourceName: "user", resourceLabel: "User", userId: 123 }
   * ```
   */
  getResourceContext(additionalParams?: Record<string, any>): IResourceContext {
    return {
      ...Object.assign({}, additionalParams),
      resourceLabel: this.getLabel(),
      resourceName: this.getName(),
    };
  }
  /**
   *
   * @returns {string} the message to display when the DataProvider for the resource is invalid
   */
  get INVALID_DATA_PROVIDER_ERROR(): string {
    return i18n.t('resources.invalidDataProvider', this.getResourceContext());
  }
  hasDataService(): boolean {
    const dataService = this.getDataService();
    return (
      dataService != null &&
      typeof dataService?.update === 'function' &&
      typeof dataService?.create === 'function' &&
      typeof dataService?.find === 'function' &&
      typeof dataService?.update === 'function' &&
      typeof dataService?.delete === 'function'
    );
  }
  /**
   * get the data provider for the resource.
   * @returns {IResourceDataService<DataType>} The data provider for the resource.
   */
  abstract getDataService(): IResourceDataService<DataType>;
  /***
   * trigger the event
   * @param event - The event to trigger.
   * When the event is triggered, the events observable is also triggered.
   * @param args - The arguments to pass to the event.
   */
  trigger(event: EventType | IResourceDefaultEvent<Name>, ...args: any[]) {
    Resource.events.trigger(event as any, this.getResourceContext(), ...args);
  }
  /**
   * Authorizes the user to perform a specific action on this resource.
   *
   * This method validates both that the resource has a data service available
   * and that the user has permission to perform the specified action.
   *
   * @param action - The action name to authorize (e.g., 'read', 'create', 'update', 'delete').
   * @returns A promise that resolves if authorization succeeds, or rejects with a translated error if authorization fails.
   * @throws Error with translated message if data service is unavailable or user lacks permission.
   *
   * @example
   * ```typescript
   * await resource.authorizeAction('read');
   * await resource.authorizeAction('create');
   * ```
   */
  async authorizeAction(action: IResourceActionName<Name>): Promise<void> {
    if (!this.hasDataService()) {
      throw new Error(this.INVALID_DATA_PROVIDER_ERROR);
    }
    let hasPermission: boolean;

    // Map action names to permission methods
    switch (action) {
      case 'read':
        hasPermission = this.canUserRead();
        break;
      case 'create':
        hasPermission = this.canUserCreate();
        break;
      case 'update':
        hasPermission = this.canUserUpdate();
        break;
      case 'delete':
        hasPermission = this.canUserDelete();
        break;
      default:
        // For custom actions, check if user is allowed
        hasPermission = this.isAllowed(action as IResourceActionName<Name>);
        break;
    }

    if (!hasPermission) {
      throw new Error(
        i18n.t(
          this.buildTranslationPath('forbiddenError'),
          this.getResourceContext({ action })
        )
      );
    }
  }
  /***
   * Fetches all records from the resource.
   * @param {IResourceQueryOptions<DataType>} options - Optional options for fetching resources.
   * @returns {Promise<IResourcePaginatedResult<DataType>>} A promise that resolves to the result of the list operation.
   */
  async find(options?: IResourceQueryOptions<DataType>) {
    return this.authorizeAction('read').then(() => {
      return this.getDataService()
        ?.find(options)
        .then((result) => {
          this.trigger('find' as EventType, result);
          return result;
        });
    });
  }
  /***
   * fetches a single record from the resource.
   * @param {PrimaryKeyType | IResourceQueryOptions<DataType>} options - The primary key or query options of the resource to retrieve.
   * @returns {Promise<IResourceOperationResult<DataType>>} A promise that resolves to the result of the list operation.
   */
  async findOne(options: PrimaryKeyType | IResourceQueryOptions<DataType>) {
    return this.authorizeAction('read').then(() => {
      return this.getDataService()
        .findOne(options)
        .then((result) => {
          this.trigger('findOne' as EventType, result);
          return result;
        });
    });
  }
  /**
   * Builds a translation path for the resource by combining the resource prefix with the provided key.
   *
   * This method constructs hierarchical translation paths used by the i18n system. It creates paths
   * like "resources.user.notFoundError" or "resources.user.forbiddenError" that correspond to
   * nested translation keys in the internationalization files.
   *
   * @param {string} key - The specific translation key to append to the resource prefix.
   *                      Leading dots are automatically trimmed to avoid double dots in the path.
   * @returns {string} The complete translation path. If no key is provided, returns just the resource prefix.
   *
   * @example
   * ```typescript
   * // For a resource named "user"
   * resource.buildTranslationPath("notFoundError"); // "resources.user.notFoundError"
   * resource.buildTranslationPath("forbiddenError"); // "resources.user.forbiddenError"
   * resource.buildTranslationPath(); // "resources.user."
   * ```
   */
  buildTranslationPath(key?: string): string {
    const name = this.getName();
    const prefix = `resources${isNonNullString(name) ? `.${name}` : ''}.`;
    if (isNonNullString(key)) {
      return `${prefix}${key.trim().ltrim('.')}`;
    }
    return prefix;
  }
  /***
   * fetches a single record from the resource.
   * If the record is not found, it throws an error.
   * @param {PrimaryKeyType | IResourceQueryOptions<DataType>} options - The primary key or query options of the resource to retrieve.
   */
  async findOneOrFail(
    options: PrimaryKeyType | IResourceQueryOptions<DataType>
  ) {
    const result = await this.findOne(options);
    if (!isObj(result) || !result) {
      throw new Error(
        i18n.t(
          this.buildTranslationPath('notFoundError'),
          Object.assign(
            {},
            { options: JSON.stringify(options) },
            this.getResourceContext()
          )
        )
      );
    }
    return result;
  }
  /**
   * trigger called before the create operation.
   * @param record {Partial<DataType>} The record to be created.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeCreate(record: Partial<DataType>): Promise<void> {}
  /***
   * trigger called after the create operation.
   * @param {DataType} record - The created record.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterCreate(record: DataType): Promise<void> {}
  /**
   * Trigger called before the update operation.
   * @param primaryKey {PrimaryKeyType}, the primary key of the record to be updated.
   * @param dataToUpdate {Partial<DataType>} - The updated data for the record.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeUpdate(
    primaryKey: PrimaryKeyType,
    dataToUpdate: Partial<DataType>
  ): Promise<void> {}
  /**
   * Triggers called after the update operation.
   * @param {DataType} updatedData  - The updated record.
   * @param {PrimaryKeyType} primaryKey  - The primary key of the updated record.
   * @param {Partial<DataType>} dataToUpdate - The data that was used to update the record.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterUpdate(
    updatedData: DataType,
    primaryKey: PrimaryKeyType,
    dataToUpdate: Partial<DataType>
  ): Promise<void> {}

  /**
   * Trigger called before the delete operation.
   * @param primaryKey {PrimaryKeyType} - The primary key of the record to be deleted.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeDelete(primaryKey: PrimaryKeyType): Promise<void> {}
  /***
   * Triggers called after the delete operation.
   * @param {boolean} result - The result of the delete operation.
   * @param {PrimaryKeyType} primaryKey - The primary key of the deleted record.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterDelete(
    result: boolean,
    primaryKey: PrimaryKeyType
  ): Promise<void> {}

  /***
   * trigger called before the createMany operation.
   * @param {Partial<DataType>[]} records - The records to be created.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeCreateMany(records: Partial<DataType>[]) {}
  /***
   * trigger called after the createMany operation.
   * @param {DataType[]} records - The created records.
   * @param {Partial<DataType>[]} data - The data used to create the records.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterCreateMany(
    records: DataType[],
    data: Partial<DataType>[]
  ) {}
  /***
   * Trigger called before the updateMany operation.
   * @param {IResourceManyCriteria} criteria - The criteria for the update operation.
   * @param {Partial<DataType>} data - The data for the update operation.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeUpdateMany(
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>,
    data: Partial<DataType>
  ) {}
  /**
   * Triggers called after the updateMany operation.
   * @param affectedRows {number} The number of records updated
   * @param criteria {IResourceManyCriteria} The criteria used for the update operation.
   * @param {Partial<DataType>[]} records The records updated
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterUpdateMany(
    affectedRows: number,
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>,
    records: Partial<DataType>
  ) {}
  /***
   * Trigger called before the deleteMany operation.
   * @param {IResourceManyCriteria} criteria - The criteria for the delete operation.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async beforeDeleteMany(
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>
  ) {}

  /**
   * Trigger called after the deleteMany operation.
   * @param {number} affectedRows The number of affected rows
   * @param {IResourceManyCriteria<DataType,PrimaryKeyType>} criteria The criteria for the delete operation.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  protected async afterDeleteMany(
    affectedRows: number,
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>
  ) {}
  /***
   * creates a new record in the resource.
   * This method allows you to create a new record in the resource.
   * It first authorizes the action, then calls the `beforeCreate` hook, performs the creation,
   * and finally calls the `afterCreate` hook before triggering the "create" event.
   * @template T - The type of the data being created.
   * @param {DataType} record - The data for the new record.
   * @returns {Promise<IResourceOperationResult<DataType>>} A promise that resolves to the result of the create operation.
   */
  async create<T extends DataType>(record: T): Promise<DataType> {
    return this.authorizeAction('create').then(() => {
      return this.beforeCreate(record).then(() => {
        return this.getDataService()
          .create(record)
          .then((result) => {
            return this.afterCreate(result).then(() => {
              this.trigger('create' as EventType, result);
              return result;
            });
          });
      });
    });
  }
  /**
   * updates a record in the resource.
   * This method allows you to update an existing record in the resource.
   * It first authorizes the action, then calls the `beforeUpdate` hook, performs the update,
   * and finally calls the `afterUpdate` hook before triggering the "update" event.
   * @template T - The type of the data being updated.
   * @param key {PrimaryKeyType} The primary key of the resource to update.
   * @param dataToUpdate
   * @returns
   */
  async update<T extends Partial<DataType>>(
    primaryKey: PrimaryKeyType,
    dataToUpdate: T
  ) {
    return this.authorizeAction('update').then(async () => {
      return this.beforeUpdate(primaryKey, dataToUpdate).then(() => {
        return this.getDataService()
          ?.update(primaryKey, dataToUpdate)
          .then((result) => {
            return this.afterUpdate(result, primaryKey, dataToUpdate).then(
              () => {
                this.trigger(
                  'update' as EventType,
                  result,
                  primaryKey,
                  dataToUpdate
                );
                return result;
              }
            );
          });
      });
    });
  }
  /***
   * deletes a record from the resource.
   * This method allows you to delete an existing record from the resource.
   * It first authorizes the action, then calls the `beforeDelete` hook, performs the deletion,
   * and finally calls the `afterDelete` hook before triggering the "delete" event.
   *
   * @template PrimaryKeyType - The type of the primary key of the resource.
   * @param primaryKey {PrimaryKeyType} The primary key of the resource to delete.
   * @returns Promise<number> A promise that resolves to the result of the delete operation.
   */
  async delete(primaryKey: PrimaryKeyType) {
    return this.authorizeAction('delete').then(() => {
      return this.beforeDelete(primaryKey).then(() => {
        return this.getDataService()
          ?.delete(primaryKey)
          .then((result) => {
            return this.afterDelete(result, primaryKey).then(() => {
              this.trigger('delete' as EventType, result, primaryKey);
              return result;
            });
          });
      });
    });
  }

  /**
   * Fetches a list of records from the resource and returns the total count.
   * This method allows you to retrieve a list of records from the resource,
   * along with the total count of records that match the query options.
   * It first authorizes the action, then calls the `findAndCount` method on the data service,
   * @param options - Optional query options to filter, sort, and paginate the results.
   * @returns A promise that resolves to an object containing the list of records and the total count.
   */
  async findAndCount(options?: IResourceQueryOptions<DataType>) {
    return this.authorizeAction('read').then(() => {
      return this.getDataService()
        .findAndCount(options)
        .then((result) => {
          this.trigger('findAndCount' as EventType, result);
          return result;
        });
    });
  }
  /**
   * Fetches a paginated list of records from the resource.
   * This method allows you to retrieve a paginated list of records from the resource,
   * along with the total count of records that match the query options.
   * It first authorizes the action, then calls the `findAndPaginate` method on the data service,
   * and finally triggers the "findAndPaginate" event.
   * @param options - Optional query options to filter, sort, and paginate the results.
   * @returns A promise that resolves to an object containing the paginated list of records and the total count.
   */
  async findAndPaginate(
    options?: IResourceQueryOptions<DataType> | undefined
  ): Promise<IResourcePaginatedResult<DataType>> {
    options = Object.assign({}, options);
    const [data, count] = await this.findAndCount(options);
    return ResourcePaginationHelper.paginate<DataType>(
      data,
      count,
      options as any
    );
  }
  /**
   * Creates multiple records in the resource.
   * This method allows you to create multiple records in the resource in a single operation.
   * It first authorizes the action, then calls the `beforeCreateMany` hook, performs the creation,
   * and finally calls the `afterCreateMany` hook before triggering the "createMany" event.
   * @template T - The type of the data being created.
   * @param data - An array of partial data objects to create.
   * @returns A promise that resolves to the result of the create operation.
   */
  async createMany<T extends DataType>(data: T[]) {
    return this.authorizeAction('create').then(() => {
      return this.beforeCreateMany(data).then(() => {
        return this.getDataService()
          .createMany(data)
          .then((result) => {
            return this.afterCreateMany(result, data).then(() => {
              this.trigger('createMany' as EventType, result, data);
              return result;
            });
          });
      });
    });
  }
  /**
   * Updates multiple records in the resource.
   * This method allows you to update multiple records in the resource in a single operation.
   * It first authorizes the action, then calls the `beforeUpdateMany` hook, performs the update,
   * and finally calls the `afterUpdateMany` hook before triggering the "updateMany" event.
   * @template T - The type of the data being updated.
   * @param criteria - The query options to filter the records to be updated.
   * @param data - An array of partial data objects to update.
   * @returns A promise that resolves to the result of the update operation.
   */
  async updateMany<T extends Partial<DataType>>(
    criteria: IResourceManyCriteria<DataType, PrimaryKeyType>,
    data: T
  ) {
    return this.authorizeAction('update').then(() => {
      return this.beforeUpdateMany(criteria, data).then(() => {
        return this.getDataService()
          .updateMany(criteria, data)
          .then((affectedRows) => {
            return this.afterUpdateMany(affectedRows, criteria, data).then(
              () => {
                this.trigger(
                  'updateMany' as EventType,
                  affectedRows,
                  criteria,
                  data
                );
                return affectedRows;
              }
            );
          });
      });
    });
  }
  /**
   * Deletes multiple records from the resource based on the provided criteria.
   * This method allows you to delete multiple records in the resource in a single operation.
   * It first authorizes the action, then calls the `beforeDeleteMany` hook, performs the deletion,
   * and finally calls the `afterDeleteMany` hook before triggering the "deleteMany" event.
   * @param criteria - The query options to filter the records to be deleted.
   * @returns A promise that resolves to the result of the delete operation.
   */
  async deleteMany(criteria: IResourceManyCriteria<DataType, PrimaryKeyType>) {
    return this.authorizeAction('delete').then(() => {
      return this.beforeDeleteMany(criteria).then(() => {
        return this.getDataService()
          .deleteMany(criteria)
          .then((affectedRows) => {
            return this.afterDeleteMany(affectedRows, criteria).then(() => {
              this.trigger('deleteMany' as EventType, affectedRows, criteria);
              return affectedRows;
            });
          });
      });
    });
  }
  /**
   * Counts the number of records in the resource.
   * This method allows you to count the total number of records in the resource.
   * It first authorizes the action, then calls the `count` method on the data service,
   * and finally triggers the "read" event with the count result.
   *
   * @template DataType - The type of the data being counted.
   * @param options - Optional query options to filter the results.
   * @returns {Promise<number>} A promise that resolves to the result of the count operation.
   */
  async count(options?: IResourceQueryOptions<DataType>) {
    return this.authorizeAction('read').then(() => {
      return this.getDataService()
        .count(options)
        .then((result) => {
          this.trigger('read' as EventType, result);
          return result;
        });
    });
  }
  /***
   * checks if the resource has the record
   * This method allows you to check if a record exists in the resource.
   * It first authorizes the action, then calls the `exists` method on the data service,
   * and finally triggers the "exists" event with the result.
   * @param {PrimaryKeyType} primaryKey - The primary key of the record to check.
   * @returns {Promise<boolean>} A promise that resolves to the result of the exists operation.
   */
  async exists(primaryKey: PrimaryKeyType): Promise<boolean> {
    return this.authorizeAction('read').then(() => {
      return this.getDataService()
        .exists(primaryKey)
        .then((result) => {
          this.trigger('exits' as EventType, result);
          return result;
        });
    });
  }
  updateMetadata(
    options: IResource<Name, DataType>
  ): IResource<Name, DataType> {
    options = Object.assign({}, options);
    const metadata = extendObj({}, this.getMetaData(), options);
    Reflect.defineMetadata(
      ResourcesManager.resourceMetaData,
      metadata,
      this.constructor
    );
    return metadata;
  }
  /**
   * Initializes the resource with the provided metaData.
   *
   * @param metaData - An object implementing the IResource interface, containing the data to initialize the resource with.
   *
   * This method assigns the provided metaData to the resource, ensuring that any empty properties
   * on the resource are filled with the corresponding values from the metaData object. It skips
   * properties that are functions. After assigning the metaData, it calls the `getFields` method
   * to further process the resource.
   */
  init() {
    this.resolveTranslations();
    this.getFields();
  }
  /**
   * Retrieves the i18n translations for the resource.
   *
   * @param {string} [locale] - The locale to use for the translations. If not provided, the default locale from the i18n instance will be used.
   * @returns {Record<string,any>} - An object containing the translations for the resource, keyed by the property names.
   * @example
   * // Register translations for the "en" locale.
   * i18n.registerTranslations({
   *   en: {
   *     resources: {
   *       user: {  // The resource name
   *         label: "User",  // The label property
   *         title: "User Information",  // The title property
   *       }
   *     }
   *   }
   * });
   *
   * // Retrieve the translations for the "user" resource.
   * const userResource = ResourcesManager.getResource("user");
   * const userTranslations = userResource.getTranslations();
   * console.log(userTranslations);
   * // Output:
   * // {
   * //   label: "User",
   * //   title: "User Information",
   * // }
   */
  getTranslations(locale?: string): Record<string, any> {
    locale = defaultStr(locale, i18n.getLocale());
    const nameStr = String(this.getName()).trim();
    if (!isNonNullString(nameStr)) return {};
    const t = i18n.getNestedTranslation(['resources', nameStr], locale) as any;
    return isObj(t) && t ? t : {};
  }

  /**
   *Translates the given scope using the i18n default instance, ensuring that the resource name is prefixed correctly.
   *
   * @param {Scope} scope - The scope to use for the translation. This can be a string or an array of strings.
   * @param {TranslateOptions} [options] - Optional options to pass to the translation function.
   * @returns {string | T} - The translated string, or the translated value of type T if the scope returns a non-string value.
   * @example
   * // Register translations for the "en" locale.
   * i18n.registerTranslations({
   *   en: {
   *     resources: {
   *       user: {  // The resource name
   *         label: "User",  // The label property
   *         title: "User Information",  // The title property
   *         create: {
   *            label: "Create User",
   *            title: "Create a new user",
   *         },
   *         read: {
   *            label: "View User",
   *            title: "View a specific user",
   *         },
   *       }
   *     }
   *   }
   * });
   * // Translate the "label" property of the "user" resource.
   * const userResource = ResourcesManager.getResource("user");
   * const label = userResource.translate("label"); // "User"
   *
   * // Translate the "title" property of the "user" resource.
   * const title = userResource.translate("title"); // "Manage user data"
   */
  translate<T = string>(scope: Scope, options?: TranslateOptions): string | T {
    const scopeArray = isNonNullString(scope)
      ? scope.trim().split('.')
      : Array.isArray(scope)
        ? scope
        : [];
    if (
      scopeArray[0] !== 'resources' &&
      !ResourcesManager.hasResource(scopeArray[1] as IResourceName)
    ) {
      scopeArray.unshift(this.getName(), 'resources');
    }
    return i18n.translate<T>(scopeArray, options);
  }

  /**
   * Retrieves the name of the resource.
   * @returns {Name} The name of the resource, cast to the Name type.
   */
  getName(): Name {
    return defaultStr(this.name, this.getMetaData().name) as Name;
  }
  /**
   * Retrieves the actions associated with the resource.
   * If the actions are not already defined or not an object,
   * it initializes them as an empty object of type `IResourceActions`.
   *
   * @returns  The map of resource actions.
   */
  getActions(): Partial<IResourceActions<Name>> {
    if (!isObj(this.actions) || !this.actions) {
      this.actions = {};
    }
    return this.actions;
  }
  /**
   * checks if the resource has the action
   * @param action - The action to check
   * @returns true if the action exists, false otherwise
   */
  hasAction(action: string): action is IResourceActionName<Name> {
    if (!isNonNullString(action)) return false;
    const actions = this.getActions();
    return (
      isObj(actions[action as keyof typeof actions]) &&
      actions[action as keyof typeof actions] !== undefined
    );
  }

  /**
   * Determines if the given permission is allowed for the specified user.
   *
   * @param action - The action to check. It can be a string or an array of strings representing the action name and the resource name.

   * @param user - The user for whom the permission is being checked. It can be an object implementing the IAuthUser interface.The user object for whom the permission.If not provided, the function will attempt 
   *   to retrieve the signed user from the session.
   * @returns A boolean indicating whether the permission is allowed for the user.
   *
   * The method performs the following steps:
   * 1. Constructs a prefix using the resource name.
   * 2. If the permission is a string, it trims and processes it to ensure it has the correct prefix.
   * 3. Checks if the permission string has the correct prefix.
   * 4. Extracts the action part of the permission and checks if it is a valid action.
   * 5. If the action is "all" or matches any of the resource's actions, it returns true.
   * 6. Otherwise, it delegates the permission check to the Auth.isAllowed method.
   */
  isAllowed(
    action?: IResourceActionName<Name> | IResourceActionName<Name>[],
    user?: IAuthUser
  ): boolean {
    const perms: IResourceActionTupleArray<Name>[] = [];
    if (isNonNullString(action)) {
      perms.push([this.getName(), action as IResourceActionName<Name>]);
    } else if (Array.isArray(action)) {
      action.forEach((a) => {
        if (isNonNullString(a)) {
          perms.push([this.getName(), a as IResourceActionName<Name>]);
        }
      });
    }
    return Auth.isAllowed(perms, user);
  } /**
   * Determines if the specified user has read access.
   *
   * @param user - The user whose read access is being checked. If no user is provided, the method will use default permissions.
   * @returns A boolean indicating whether the user has read access.
   */
  canUserRead(user?: IAuthUser): boolean {
    return this.isAllowed(`read`, user);
  }
  /**
   * Determines if the user has permission to create a resource.
   *
   * @param user - The user whose permissions are being checked. If not provided, the method will use the default user.
   * @returns A boolean indicating whether the user is allowed to create the resource.
   */
  canUserCreate(user?: IAuthUser): boolean {
    return this.isAllowed(`create`, user);
  }
  /**
   * Determines if the specified user has permission to update the resource.
   *
   * @param user - The user whose update permissions are being checked. If no user is provided, the method will use default permissions.
   * @returns A boolean indicating whether the user has permission to update the resource.
   */
  canUserUpdate(user?: IAuthUser): boolean {
    return this.isAllowed(`update`, user);
  }

  /**
   * Determines if the user has permission to delete.
   *
   * @param user - The authenticated user whose permissions are being checked. Optional.
   * @returns A boolean indicating whether the user is allowed to delete.
   */
  canUserDelete(user?: IAuthUser): boolean {
    return this.isAllowed(`delete`, user);
  }

  /**
   * Retrieves the translated value of the specified property, using the resource's translations.
   * If the property is not found in the translations, it returns the fallback value or the property name.
   *
   * @param propertyName - The name of the property to translate.
   * @param fallbackValue - The fallback value to use if the property is not found in the translations.
   * @param options - Additional options to pass to the translation function.
   * @returns The translated value of the property.
   */
  translateProperty(
    propertyName: string,
    fallbackValue?: string,
    options?: TranslateOptions
  ): string {
    propertyName = defaultStr(propertyName).trim();
    options = Object.assign({}, { resourceName: this.getName() }, options);
    const translations = this.getTranslations();
    if (isNonNullString(propertyName) && translations[propertyName]) {
      const translatedValue = stringify(i18n.t(propertyName, options));
      if (
        isNonNullString(translatedValue) &&
        translatedValue.includes('.' + propertyName.ltrim('.'))
      ) {
        return translatedValue;
      }
    }
    return defaultStr(fallbackValue, propertyName);
  }

  /**
   * Retrieves the label of the resource.
   *
   * If the label is not defined, it returns a default empty string.
   *
   * @returns {string} The label of the resource.
   */
  getLabel(): string {
    const labelMetaData = this.getMetaData().label;
    const label = this.translateProperty(
      'label',
      defaultStr(labelMetaData, this.label, this.getName())
    );
    return String(label).toLowerCase().trim() != 'label'
      ? label
      : defaultStr(this.getName());
  }

  /**
   * Retrieves the title of the resource.
   *
   * If the title is not defined, it returns a default empty string.
   *
   * @returns {string} The title of the resource.
   */
  getTitle(): string {
    return this.translateProperty(
      'title',
      defaultStr(this.getMetaData().title, this.title, this.getLabel())
    );
  }

  /**
   * Retrieves the fields associated with the resource.
   *
   * This method populates the `fields` property by invoking an external `getFields` function,
   * which dynamically retrieves and returns all the fields related to the resource.
   *
   * @returns {Record<string, IField>} A record containing all the fields of the resource.
   */
  getFields(): Record<string, IField> {
    try {
      this.resolveTranslations();
      this.fields = getFields(this) as Record<string, IField>;
      return this.fields;
    } catch (e) {
      Logger.log(e, ' getting resources fieldss');
    }
    return {};
  }

  /**
   * Interpolates placeholders in a string with values from a parameters object, automatically including resource context.
   *
   * This method provides a convenient wrapper around the global `interpolate` function, automatically
   * merging the provided parameters with the resource's context information (resource name, label, etc.).
   * This is particularly useful for internationalization and dynamic string generation within resource operations.
   *
   * **Placeholder Format:**
   * - Uses the default `{key}` format for placeholders
   * - Keys can contain dots (e.g., `{user.name}`) but are treated as flat object keys
   * - Custom regex patterns can be specified via options for different placeholder formats
   *
   * **Resource Context:**
   * - Automatically includes `resourceName`, `resourceLabel`, and any additional context from `getResourceContext()`
   * - Provided parameters take precedence over resource context values
   *
   * **Value Handling:**
   * - Missing keys or undefined/null values result in empty strings
   * - Values are automatically formatted using the default formatter that handles all JavaScript types
   * - Custom formatters can be provided for specialized formatting requirements
   *
   * @param {string} [text] - The template string containing placeholders to be replaced.
   *                          If null, undefined, or empty, returns an empty string.
   * @param {Record<string, any>} [params] - An object containing key-value pairs for interpolation.
   *                                         These parameters will be merged with the resource context.
   *                                         If null, undefined, or empty object, only resource context is used.
   * @param {IInterpolateOptions} [options] - Optional configuration object for advanced interpolation behavior.
   *                                          Note: The `tagRegex` option will override the default `{key}` pattern.
   * @returns {string} The interpolated string with all placeholders replaced by their corresponding values.
   *                   Placeholders without matching keys are replaced with empty strings.
   *
   * @example
   * // Basic interpolation with resource context
   * const message = resource.interpolate("Welcome to {resourceLabel}!", { user: "Alice" });
   * // Result: "Welcome to User!" (assuming resource label is "User")
   *
   * @example
   * // Using resource context values
   * const title = resource.interpolate("{resourceName}: {action}", { action: "created" });
   * // Result: "user: created" (assuming resource name is "user")
   *
   * @example
   * // Parameters override resource context
   * const custom = resource.interpolate("{resourceLabel}", { resourceLabel: "Custom Label" });
   * // Result: "Custom Label" (parameter takes precedence)
   *
   * @example
   * // Complex objects are JSON stringified
   * const dataMsg = resource.interpolate("Data: {info}", { info: { count: 5 } });
   * // Result: "Data: {"count":5}"
   *
   * @example
   * // Custom formatter for specialized formatting
   * const formatted = resource.interpolate("Price: {amount}", { amount: 99.99 }, {
   *   valueFormatter: (value, tagName) => {
   *     if (tagName === 'amount' && typeof value === 'number') {
   *       return `$${value.toFixed(2)}`;
   *     }
   *     return String(value);
   *   }
   * });
   * // Result: "Price: $99.99"
   *
   * @example
   * // Custom regex for different placeholder syntax
   * const customSyntax = resource.interpolate("Hello [[name]]!", { name: "World" }, {
   *   tagRegex: /\[\[([^\]]+)\]\]/g
   * });
   * // Result: "Hello World!"
   */
  interpolate(
    text?: string,
    params?: Record<string, any>,
    options?: IInterpolateOptions
  ) {
    return interpolate(text, this.getResourceContext(params), {
      tagRegex: /\{([^}]+)\}/g,
      ...options,
    });
  }
  /**
   * Retrieves the label for a specified action, optionally formatting it with provided parameters.
   *
   * @param actionName - The name of the action for which to get the label.
   * @param params - Optional parameters to format the label.
   * @returns The formatted action label.
   */
  getActionLabel(
    actionName: IResourceActionName<Name>,
    params?: Record<string, any>
  ) {
    return this.interpolate(this.getAction(actionName)?.label, params);
  }
  /**
   * Retrieves the title of a specified action, optionally formatting it with provided parameters.
   *
   * @param actionName - The name of the action for which the title is to be retrieved.
   * @param params - An optional record of parameters to format the title.
   * @returns The formatted title of the specified action.
   */
  getActionTitle(
    actionName: IResourceActionName<Name>,
    params?: Record<string, any>
  ) {
    return this.interpolate(this.getAction(actionName)?.title, params);
  }
  /**
   * Retrieves a specific action by its name.
   *
   * @param {IResourceActionName<Name>} actionName - The name of the action to retrieve.
   * @returns {IResourceAction} The action object if found, otherwise an empty object.
   */
  getAction(actionName: IResourceActionName<Name>): IResourceAction {
    if (!isNonNullString(actionName)) return {};
    const actions = this.getActions();
    return (isObj(actions[actionName]) && actions[actionName]) || {};
  }

  /**
   * Retrieves the primary key fields from the current object's fields.
   *
   * @returns {IField[]} An array of fields that are marked as primary keys.
   */
  getPrimaryKeys(): IField[] {
    const primaryKeys: IField[] = [];
    if (isObj(this.fields)) {
      for (let i in this.fields) {
        if (isObj(this.fields[i]) && (this.fields[i] as any).primaryKey) {
          primaryKeys.push(this.fields[i]);
        }
      }
    }
    return primaryKeys;
  }
}

/**
 * Manages a collection of resources within the application.
 *
 * The `ResourcesManager` class provides static methods to store, retrieve, and manage resource instances.
 * It maintains a global record of all instantiated resources, allowing for easy access and management.
 * Each resource is identified by a unique name, which is derived from the `Name` type.
 *
 * @example
 * // Instantiate and add resources to the manager
 * const userResource = new UserResource();
 * ResourcesManager.addResource('userResource', userResource);
 *
 * // Retrieve the names of all resources
 * const resourceNames = ResourcesManager.getAllNames();
 * console.log(resourceNames); // Output: ['userResource']
 *
 * // Retrieve a specific resource
 * const retrievedResource = ResourcesManager.getResource<UserResource>('userResource');
 * if (retrievedResource) {
 *   console.log(retrievedResource.getLabel()); // Output: The label of the user resource
 * }
 */
export class ResourcesManager {
  static resourceMetaData = Symbol('resource');
  /**
   * A global constant storing a record of all instantiated resources.
   *
   * This represents a record of all resources, where the keys are derived from `IResourceName`
   * and the values are instances of `Resource`.
   *
   * @example
   * const allResources: IAllResource = {
   *   userResource: new UserResource()
   * };
   */
  private static resources: Record<IResourceName, Resource> = {} as Record<
    IResourceName,
    Resource
  >;

  /**
   * Retrieves the global record of all resource metaData managed by the `ResourcesManager`.
   *
   * This method returns a copy of the internal record of resource metaData, which can be used to access
   * the configuration and settings for each registered resource.
   *
   * @returns {Record<IResourceName, IResource>} A copy of the resource metaData record.
   */
  public static getAllMetaData(): Record<IResourceName, IResource> {
    return Object.assign(
      {},
      Reflect.getMetadata(resourcesMetaDataKey, ResourcesManager)
    );
  }
  /**
   * Adds resource metaData to the global record managed by the `ResourcesManager`.
   *
   * This method updates the internal record of resource metaData with the provided `metaData` for the given `resourceName`.
   * The updated record is then stored as metadata on the `ResourcesManager` class.
   *
   * @param {IResourceName} resourceName - The unique name of the resource.
   * @param {IResource} metaData - The resource metaData to be associated with the given `resourceName`.
   */
  public static addMetaData(resourceName: IResourceName, metaData: IResource) {
    const allOptions = this.getAllMetaData();
    if (!isNonNullString(resourceName) || !resourceName) return;
    metaData = Object.assign({}, metaData);
    metaData.name = isNonNullString(metaData?.name)
      ? metaData.name
      : resourceName;
    (allOptions as any)[resourceName] = metaData;
    Reflect.defineMetadata(resourcesMetaDataKey, allOptions, ResourcesManager);
    if (isNonNullString(metaData.className)) {
      const classNames = ResourcesManager.getAllClassNames();
      (classNames as any)[metaData.className] = metaData.name;
      Reflect.defineMetadata(
        resourcesClassNameMetaData,
        classNames,
        ResourcesManager
      );
    }
  }
  /**
   * Retrieves the global record of resource class names managed by the `ResourcesManager`.
   *
   * This method returns a copy of the internal record of resource class names, which can be used to access
   * the class name associated with each registered resource.
   *
   * @returns {Record<string,IResourceName>} A copy of the resource class names record.
   */
  public static getAllClassNames(): Record<string, IResourceName> {
    return Object.assign(
      {},
      Reflect.getMetadata(resourcesClassNameMetaData, ResourcesManager)
    );
  }
  /**
   * Retrieves the class name associated with the specified resource name.
   *
   * This method looks up the class name for the given `resourceName` in the global record of resource class names
   * managed by the `ResourcesManager`. If the resource name is not found, or is not a valid non-null string, this
   * method will return `undefined`.
   *
   * @param {IResourceName} resourceName - The unique name of the resource to retrieve the class name for.
   * @returns {string | undefined} The class name associated with the specified resource name, or `undefined` if not found.
   */
  public static getNameFromClassName(
    className: string
  ): IResourceName | undefined {
    if (!isNonNullString(className)) return undefined;
    const classNames = this.getAllClassNames();
    return classNames[className];
  }
  /**
   * Retrieves the resource metaData for the specified resource name.
   *
   * This method retrieves the resource metaData associated with the given `resourceName` from the global
   * record of resource metaData managed by the `ResourcesManager`. If the resource name is not a valid
   * non-null string, or if the resource metaData are not found, this method will return `undefined`.
   *
   * @param {IResourceName} resourceName - The unique name of the resource to retrieve the metaData for.
   * @returns {IResource | undefined} The resource metaData for the specified resource name, or `undefined` if not found.
   */
  public static getMetaDataFromName(
    resourceName: IResourceName
  ): IResource | undefined {
    const allOptions = this.getAllMetaData();
    if (!isNonNullString(resourceName) || !resourceName) return;
    return (allOptions as any)[resourceName];
  }

  /**
   * Retrieves the resource metadata associated with the given target class.
   *
   * This function uses reflection to access the metadata stored on the target class using the `@ResourceMeta` decorator.
   * It returns a new object that is a copy of the metadata, which includes properties like `name`, `label`, `title`, and `tooltip`.
   *
   * @param {any} target - The target class or instance from which to retrieve the metadata.
   * @returns {Resource} An object containing the resource metadata for the given target.
   */
  public static getMetaDataFromTarget(
    target: IClassConstructor
  ): IResource | undefined {
    return Object.assign(
      {},
      Reflect.getMetadata(ResourcesManager.resourceMetaData, target.prototype)
    );
  }

  /**
   * Retrieves the resource metaData for the specified resource class name.
   *
   * This method first looks up the resource name associated with the given class name using the `getNameFromClassName` method.
   * If the resource name is found, it then retrieves the resource metaData for that resource name using the `getMetaData` method.
   * If the resource name is not found, or if the resource metaData are not found, this method will return `undefined`.
   *
   * @param {string} className - The class name of the resource to retrieve the metaData for.
   * @returns {IResource<any, any> | undefined} The resource mata data for the specified resource class name, or `undefined` if not found.
   */
  public static getMetaDataByClassName(
    className: string
  ): IResource | undefined {
    const resourceName = this.getNameFromClassName(className);
    if (!resourceName) return undefined;
    return this.getMetaDataFromName(resourceName);
  }

  /**
   * Retrieves the names of all registered resources.
   *
   * This method returns an array of resource names that are currently managed by the `ResourcesManager`.
   *
   * @returns {string[]} An array of resource names.
   *
   * @example
   * const names = ResourcesManager.getAllNames();
   * console.log(names); // Output: ['userResource', 'productResource']
   */
  public static getAllNames() {
    return Object.keys(this.resources);
  }

  /**
   * Retrieves a resource instance by its name from the `resources` record.
   *
   * @template ResourceInstanceType The type extending `Resource` for the resource being returned.
   * @param {IResourceName} name - The name of the resource to retrieve, as defined in `IResourceName`.
   * @returns {(ResourceInstanceType | null)} The resource instance if it exists, or `null` if the resource is not found.
   *
   * @example
   * const userResource = ResourcesManager.getResource<UserResource>('userResource');
   * if (userResource) {
   *   console.log(userResource.getLabel()); // Output: The label of the user resource
   * }
   */
  public static getResource<ResourceInstanceType extends Resource = Resource>(
    name: IResourceName
  ): ResourceInstanceType | null {
    if (typeof name === 'string' && name) {
      return this.resources[name] as ResourceInstanceType;
    }
    return null;
  }

  /**
   * Checks if a resource with the given name exists in the `ResourcesManager`.
   *
   * @param {IResourceName} name - The name of the resource to check.
   * @returns {boolean} `true` if the resource exists, `false` otherwise.
   */
  public static hasResource(name: IResourceName) {
    if (!isNonNullString(name) || !name) return false;
    const metaData = ResourcesManager.getMetaDataFromName(name);
    if (isObj(metaData) && metaData?.name == name) return true;
    return !!this.getResource(name);
  }
  /**
   * Adds a new resource instance to the manager.
   *
   * @param {IResourceName} name - The unique name of the resource to add.
   * @param {Resource<Name,DataType>} resource - The resource instance to be added.
   * @template DataType The type of data associated with the resource.
   *
   * @example
   * const productResource = new ProductResource();
   * ResourcesManager.addResource('productResource', productResource);
   * console.log(ResourcesManager.getAllNames()); // Output: ['userResource', 'productResource']
   */
  public static addResource<Name extends IResourceName, DataType = unknown>(
    name: Name,
    resource: Resource<Name, DataType>
  ) {
    if (
      typeof name === 'string' &&
      name &&
      resource &&
      resource instanceof Resource
    ) {
      (this.resources as any)[name] = resource;
    }
  }
  /**
   * Removes a resource instance from the manager by its name.
   *
   * This method deletes the specified resource from the `resources` record.
   * If the resource exists, it will be removed, and the updated list of resources will be returned.
   *
   * @param {IResourceName} name - The name of the resource to be removed from the manager.
   *
   * @returns {Record<IResourceName, Resource>} The updated record of all remaining resources after the removal.
   *
   * @example
   * // Assuming a resource named 'userResource' has been previously added
   * console.log(ResourcesManager.getAllNames()); // Output: ['userResource', 'productResource']
   *
   * // Remove the user resource
   * ResourcesManager.removeResource('userResource');
   *
   * // Check the remaining resources
   * console.log(ResourcesManager.getAllNames()); // Output: ['productResource']
   */
  public static removeResource(
    name: IResourceName
  ): Record<IResourceName, Resource> {
    if (typeof name === 'string') {
      delete (this.resources as any)[name];
    }
    return this.resources;
  }

  /**
   * Retrieves all resource instances managed by the manager.
   *
   * This method returns a record of all resources currently stored in the `ResourcesManager`.
   * The keys are derived from `IResourceName`, and the values are instances of `Resource`.
   * This allows for easy access to all registered resources.
   *
   * @returns {Record<IResourceName, Resource>} A record containing all resource instances, where each key is a resource name.
   *
   * @example
   * // Retrieve all registered resources
   * const allResources = ResourcesManager.getResources();
   * console.log(allResources);
   * // Output:
   * // {
   * //   userResource: UserResourceInstance,
   * //   productResource: ProductResourceInstance
   * // }
   */
  public static getResources(): Record<IResourceName, Resource> {
    return this.resources;
  }
}

/**
 * A decorator function that adds resource metadata to a class that implements `Resource`
 *
 * This decorator stores the resource properties (`name`, `label`, `title`) using Reflect metadata.
 *
 * @typeParam Datatype - An optional type representing the data that this resource holds. Defaults to `any`.
 * @param metaData - The properties to be set as metadata on the class.
 *
 * @example
 * ```typescript
 * @ResourceMeta({
 *   name: "user",
 *   label: "User",
 *   title: "User Management",
 * })
 * class User {}
 *
 * ```
 */
export function ResourceMeta<
  Name extends IResourceName = IResourceName,
  DataType = unknown,
  PrimaryKeyType extends IResourcePrimaryKey = IResourcePrimaryKey,
>(
  metaData?: IResource<Name, DataType, PrimaryKeyType> & {
    /***
     * whether the resource should be instanciated or not
     */
    instanciate?: boolean;
  }
) {
  return function (target: typeof Resource<Name, DataType, PrimaryKeyType>) {
    metaData = Object.assign({}, metaData);
    metaData.className = defaultStr(metaData.className, target?.name);
    if (typeof target == 'function') {
      if (metaData?.instanciate) {
        try {
          const resource = new (target as any)() as Resource<Name, DataType>;
          resource.updateMetadata(metaData);
          ResourcesManager.addResource<Name, DataType>(
            metaData.name as any,
            resource
          );
        } catch {}
      }
    }
    Reflect.defineMetadata(ResourcesManager.resourceMetaData, metaData, target);
    ResourcesManager.addMetaData(metaData.name as IResourceName, metaData);
  };
}
