import { extendObj } from '@utils/object';
import 'reflect-metadata';
import { ClassConstructor } from '../../types';

/**
 * Creates a property decorator that stores metadata without making the property readonly
   @template MetadataType - The type of the metadata
   @template PropertyKeyType - The type of the property key
 * @param metadataKey - The key to store the metadata under
   @param metadata - The metadata to store, or a function that returns the metadata
 * @returns PropertyDecorator
 */
export function buildPropertyDecorator<
  MetadataType = unknown,
  PropertyKeyType extends MetadataPropertyKey = MetadataPropertyKey,
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadataKey: any,
  /**
      Retrieves the metadata for a property
      @param {Object} target - The class constructor
      @param {PropertyKeyType} propertyKey - The property key
      @param {MetadataType} existingMetaData - The existing metadata for the property
      @param {Record<PropertyKeyType, MetadataType>} allExistingMetadata - All existing metadata for the class
      @returns {MetadataType} The metadata for the property
      
  */
  metadata:
    | ((
        existingMetaData: MetadataType,
        allExistingMetadata: Record<PropertyKeyType, MetadataType>,
        target: object,
        propertyKey: MetadataPropertyKey
      ) => MetadataType)
    | MetadataType
): PropertyDecorator {
  return (target: object, propertyKey: MetadataPropertyKey) => {
    const constructor = target?.constructor;
    const allExistingMetadata: Record<PropertyKeyType, MetadataType> =
      Object.assign({}, Reflect.getMetadata(metadataKey, constructor));
    const existingMetaData: MetadataType | undefined =
      allExistingMetadata[propertyKey as keyof typeof allExistingMetadata];
    const newMetatdata: MetadataType =
      typeof metadata === 'function'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (metadata as any)(
            existingMetaData,
            allExistingMetadata,
            target,
            propertyKey
          )
        : metadata;
    allExistingMetadata[propertyKey as keyof typeof allExistingMetadata] =
      newMetatdata;
    // Update the metadata on the class
    Reflect.defineMetadata(metadataKey, allExistingMetadata, constructor);
    // Store additional metadata for this specific property if needed
    Reflect.defineMetadata(metadataKey, metadata, target, propertyKey);
  };
}

/**
 * Retrieves all properties of a class that have been decorated with a specific metadata key.
   @template MetaDataType - The type of the metadata
   @template PropertyKeyType - The type of the property key
 * @param target The class to retrieve decorated properties from.
 * @param metadataKey The metadata key.
 * @returns Record of property names and their metadata
 */
export function getDecoratedProperties<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MetaDataType = any,
  PropertyKeyType extends MetadataPropertyKey = MetadataPropertyKey,
>(
  target: ClassConstructor,
  metadataKey: MetadataPropertyKey
): Record<PropertyKeyType, MetaDataType> {
  return extendObj(
    {},
    Reflect.getMetadata(metadataKey, target),
    Reflect.getMetadata(metadataKey, target.prototype)
  );
}

/**
 * Retrieves metadata for a specific property.
 * @template MetaDataType - The type of the metadata
 * @param target - target The class or object containing the property.
 * @param metadataKey - The key to retrieve metadata for
 *@param propertyKey - The name of the propertyfor which metadata is being retrieved.
 * @returns {MetaDataType} The metadata value for the property.
 */
export function getDecoratedProperty<MetaDataType = unknown>(
  target: ClassConstructor,
  metadataKey: MetadataPropertyKey,
  propertyKey: MetadataPropertyKey
): MetaDataType {
  return getDecoratedProperties(target, metadataKey)[propertyKey];
}

type MetadataPropertyKey = string | symbol;
