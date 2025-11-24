/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassConstructor } from '@/types';
import 'reflect-metadata';
import { Field, FieldBase, FieldType } from '../types';
export const fieldsMetaData = Symbol('fieldsResourcesMetadata');

export function FieldMeta<T extends FieldType = FieldType>(
  options: Field<T>
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
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
      ...(Object.assign({}, options) as FieldBase),
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
 * @returns {Record<string, ({ name: string } & Field)>} An object mapping property names to their corresponding metadata, which includes the type and other options.
 * @example
 * ```typescript
 * class MyClass {
 *   @FieldMeta({ type: 'string' }) myField: string;
 * }
 * const fields = getFields(MyClass);
 * console.log(fields); // Output: { myField: { name: 'myField', type: 'string' } }
 * ```
 */
export function getFieldsFromTarget(
  target: ClassConstructor
): Record<string, { name: string } & Field> {
  const fields = Reflect.getMetadata(fieldsMetaData, target.prototype);
  return Object.assign({}, fields);
}

/***
 * Retrieves the fields metadata from a class instance.
 * @param {T} instance - The instance of the class from which to retrieve the metadata.
 * @returns {Record<string, ({ name: string } & Field)>} An object mapping property names to their corresponding metadata, which includes the type and other options.
 */
export function getFields<T extends ClassConstructor>(
  instance: InstanceType<T>
): Record<string, { name: string } & Field> {
  const fields = Reflect.getMetadata(
    fieldsMetaData,
    Object.getPrototypeOf(instance).constructor
  );
  return Object.assign({}, fields);
}
