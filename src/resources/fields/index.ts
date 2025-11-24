import { ClassConstructor } from '@/types';
import 'reflect-metadata';
import { IField, IFieldBase, IFieldType } from '../types';
export const fieldsMetaData = Symbol('fieldsResourcesMetadata');

/**
 * Decorator function that creates a decorator for class properties. A decorator is a special kind of function that can be used to modify or enhance classes and their members.
 *
 * This function allows specifying field options, including the type, and automatically assigns a default type if none is specified.
 *The purpose of this Field function is to add metadata to class properties. Metadata is extra information about the property that can be used later in the program. This is particularly useful for creating dynamic forms, validating data, or generating database schemas based on the class structure.

 * The function takes an input called options, which is an object containing various settings for the field. These options can include things like the field type, validation rules, or display preferences.
 * The output of this function is another function, known as a decorator function. This decorator function is what actually gets applied to a class property when you use the @Field() syntax in TypeScript.
 ** @template T - The type of the field. Defaults to `any`.
 * 
 * - If `T` is a key of `IFieldMap`, it constructs a type by omitting keys from `IFieldBase` 
 *   and merging with the mapped type from `IFieldMap`, ensuring the `type` field is included.
 * 
 * - If `T` is an object, it omits overlapping keys from `IFieldBase` and merges the object type `T`.
 * 
 * - If none of the above conditions apply, it defaults to `IFieldBase<T>`.
 *  
  @param {IField<T>} options - An object containing field options.
 *                              - `type` (optional): The type of the field (string, number, boolean, etc.)
 *                              - Additional options specific to the field type defined in IField.
 * @returns A decorator function that takes two parameters: target (the class the property belongs to) and propertyKey (the name of the property).
 * @example
 * ```typescript
 * class MyClass {
 *   @Field({ type: 'string' }) myField: string;
 * }
 * ```
 */
export function Field<T extends IFieldType = IFieldType>(
  options: IField<T>
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const fields = Object.assign(
      {},
      Reflect.getMetadata(fieldsMetaData, target) || {}
    );
    const reflecType = String(
      Reflect.getMetadata('design:type', target, propertyKey)?.name
    ).toLowerCase();
    if ((options as any).type === undefined) {
      (options as any).type = ['string', 'number', 'boolean', 'date'].includes(
        reflecType
      )
        ? reflecType
        : 'text';
    }
    fields[propertyKey] = {
      name: propertyKey,
      ...(Object.assign({}, options) as IFieldBase),
    };
    Reflect.defineMetadata(fieldsMetaData, fields, target);
  };
}
/**
 * Retrieves the fields metadata from a class target.
 *
 * This function uses reflection to access the metadata associated with the given target class.
 * It returns an object where the keys are property names, and the values are objects containing the type, name, and any additional options defined in the field metadata.
 *
 * @param {any} target - The target class or instance from which to retrieve the metadata.
 * @returns {Record<string, ({ name: string } & IField)>} An object mapping property names to their corresponding metadata, which includes the type and other options.
 * @example
 * ```typescript
 * class MyClass {
 *   @Field({ type: 'string' }) myField: string;
 * }
 * const fields = getFields(MyClass);
 * console.log(fields); // Output: { myField: { name: 'myField', type: 'string' } }
 * ```
 */
export function getFieldsFromTarget(
  target: ClassConstructor
): Record<string, { name: string } & IField> {
  const fields = Reflect.getMetadata(fieldsMetaData, target.prototype);
  return Object.assign({}, fields);
}

/***
 * Retrieves the fields metadata from a class instance.
 * @param {T} instance - The instance of the class from which to retrieve the metadata.
 * @returns {Record<string, ({ name: string } & IField)>} An object mapping property names to their corresponding metadata, which includes the type and other options.
 */
export function getFields<T extends ClassConstructor = any>(
  instance: InstanceType<T>
): Record<string, { name: string } & IField> {
  const fields = Reflect.getMetadata(fieldsMetaData, instance.constructor);
  return Object.assign({}, fields);
}
