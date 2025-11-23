import { extendObj } from "@utils/object";
import "reflect-metadata";
import { IClassConstructor, ITypeRegistryRenderer } from "../../types";
import { defaultStr } from "../../utils/defaultStr";

/**
 * Creates a property decorator that stores metadata without making the property readonly
   @template MetadataType - The type of the metadata
   @template PropertyKeyType - The type of the property key
 * @param metadataKey - The key to store the metadata under
   @param metadata - The metadata to store, or a function that returns the metadata
 * @returns PropertyDecorator
 */
export function buildPropertyDecorator<
  MetadataType = any,
  PropertyKeyType extends string | symbol | number = any,
>(
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
        target: Object,
        propertyKey: any
      ) => MetadataType)
    | MetadataType
): PropertyDecorator {
  return (target: Object, propertyKey: any) => {
    const constructor = target?.constructor;
    const allExistingMetadata: Record<PropertyKeyType, MetadataType> =
      Object.assign({}, Reflect.getMetadata(metadataKey, constructor));
    const existingMetaData: MetadataType | undefined =
      allExistingMetadata[propertyKey as keyof typeof allExistingMetadata];
    const newMetatdata: MetadataType =
      typeof metadata === "function"
        ? (metadata as any)(
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
  MetaDataType = any,
  PropertyKeyType extends string | symbol | number = any,
>(
  target: IClassConstructor,
  metadataKey: any
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
export function getDecoratedProperty<MetaDataType = any>(
  target: IClassConstructor,
  metadataKey: any,
  propertyKey: any
): MetaDataType {
  return getDecoratedProperties(target, metadataKey)[propertyKey];
}

/**
 * A key used for storing the component registry in the metadata.
 */
const TYPE_REGISTRY_KEY = "typeRegistry";

const COMPONENT_REGISTRY_KEY = "componentRegistry";

/**
 * @class TypeRegistry
 * 
 * A utility class responsible for registering and managing custom renderers for various types of components.
 * 
 * This class supports extensibility by allowing external users to register their own renderers
 * for different components, such as `datagridCell` or `formField`. It uses a centralized registry
 * to map types (e.g., 'number', 'string', 'date') to rendering functions.
 * 
 * The `TypeRegistry` is primarily designed to help render components dynamically based on the value's type
 * and the component type. It makes use of internal registries to store and retrieve these renderers
 * based on the context.

 * It's allows external users to register custom renderers for specific value types
 * (e.g., 'number', 'string') and component types (e.g., 'datagridCell', 'formField'). These renderers
 * can then be retrieved and used to render dynamic content in components.
 * 
 * The class makes use of a centralized registry to store and retrieve renderers for various contexts,
 * ensuring that each component type has its own set of renderers.
  This implementation uses Reflect Metadata to store and retrieve renderers efficiently.
 * 
 * ## Example Usage:
 * 
 * ```typescript
 * // Register a number renderer for datagrid cells
 * TypeRegistry.register('number', 'datagridCell', (value: number) => {
 *   return `<div class="cell number">${value}</div>`;
 * });
 * 
 * // Render a number cell
 * const numberCell = TypeRegistry.getRenderer('number', 'datagridCell');
 * console.log(numberCell?.(123)); // Output: <div class="cell number">123</div>
 * 
 * // Register a text renderer for form fields
 * TypeRegistry.register('text', 'formField', (value: string) => {
 *   return `<input type="text" value="${value}" />`;
 * });
 * 
 * // Render a form text field
 * const textField = TypeRegistry.getRenderer('text', 'formField');
 * console.log(textField?.('Hello World')); // Output: <input type="text" value="Hello World" />
 * ```
 */
export class TypeRegistry {
  private static getMetadataKey(type: string, componentType: string): string {
    return `${TYPE_REGISTRY_KEY}-${componentType}:${type}`.trim();
  }

  /**
   * Registers a new renderer for a specific value type and component type.
   * 
   * This method allows users to extend the system by adding their own custom renderers for various types.
   * For example, you can register a renderer for numbers in a datagrid or a custom input field for forms.
   * 
    @template InputType - The type of the value to be rendered.
    @template OutputType - The type of output that the rendering function will produce.
   * @param {string} type - The value type (e.g., 'number', 'string', 'date').
   * @param {string} componentType - The component type (e.g., 'datagridCell', 'formField').
   * @param {ITypeRegistryRenderer<InputType,OutputType>} renderer - The function that renders the value as an HTML string.
   * 
   * ## Example:
   * 
   * ```typescript
   * TypeRegistry.register('number', 'datagridCell', (value: number) => {
   *   return `<div class="cell number">${value}</div>`;
   * });
   * ```
   */
  static register<InputType = any, OutputType = any>(
    type: string,
    componentType: string,
    renderer: ITypeRegistryRenderer<InputType, OutputType>
  ): void {
    if (
      !type ||
      typeof type !== "string" ||
      !componentType ||
      typeof componentType !== "string"
    )
      return;
    // Use Reflect Metadata to set the renderer for the specific value and component type
    Reflect.defineMetadata(
      this.getMetadataKey(type, componentType),
      renderer,
      TypeRegistry
    );
  }

  /**
   * Retrieves a registered renderer for a specific value type and component type.
   * 
   * This method allows users to fetch a renderer for a particular type (e.g., 'number', 'string')
   * and component type (e.g., `datagridCell`, `formField`), which can then be used to render values dynamically.
   * 
   * @template InputType - The type of the value that the renderer handles.
     @template OutputType - The type of output that the rendering function will produce.
   * @param {string} type - The value type (e.g., 'number', 'string', 'date').
   * @param {string} componentType - The component type (e.g., 'datagridCell', 'formField').
   * @returns {ITypeRegistryRenderer<InputType,OuputType> | undefined} - The renderer function if found, or `undefined` if no renderer is registered.
   * 
   * ## Example:
   * 
   * ```typescript
   * const renderer = TypeRegistry.getRenderer('number', 'datagridCell');
   * if (renderer) {
   *   const html = renderer(123);
   *   console.log(html);  // Output: <div class="cell number">123</div>
   * }
   * ```
   */
  static getRenderer<InputType = any, OutputType = any>(
    type: string,
    componentType: string
  ): ITypeRegistryRenderer<InputType, OutputType> | undefined {
    // Use Reflect Metadata to get the renderer for the specific value and component type
    return Reflect.getMetadata(
      this.getMetadataKey(type, componentType),
      TypeRegistry
    );
  }

  /**
   * Checks if a renderer exists for a specific value type and component type.
   *
   * This method can be used to verify whether a renderer is registered for a given type
   * and component before attempting to render content dynamically.
   *
   * @param {string} type - The value type (e.g., 'number', 'string').
   * @param {string} componentType - The component type (e.g., 'datagridCell', 'formField').
   * @returns {boolean} - Returns `true` if a renderer is found, otherwise `false`.
   *
   * ## Example:
   *
   * ```typescript
   * const hasRenderer = TypeRegistry.hasRenderer('number', 'datagridCell');
   * console.log(hasRenderer); // Output: true or false depending on if a renderer exists
   * ```
   */
  static hasRenderer(type: string, componentType: string): boolean {
    return !!this.getRenderer(type, componentType);
  }
  /**
 * Renders a component based on its registered type and value.
 *   
   @template InputType - The type of the value that the renderer handles.
   @template OutputType - The type of output that the rendering function will produce.
 * @param type - The type of the value (e.g., 'number', 'string').
 * @param value - The value to be rendered.
 * @param componentType - The type of component being rendered (e.g., 'datagridCell', 'formField').
   @param fallbackValue - The value to be rendered if no renderer is found.
 * @returns {OutputType}.The rendered content
 */
  static render<InputType = any, OutputType = any>(
    type: string,
    value: InputType,
    componentType: string,
    fallbackValue?: OutputType
  ): OutputType {
    const renderer = TypeRegistry.getRenderer<InputType, OutputType>(
      type,
      componentType
    );
    if (renderer) {
      return renderer(value) as OutputType;
    }
    return fallbackValue as OutputType;
  }
}

/**
 * A decorator factory that registers a rendering function for a specific type and component.
 *
 * This function creates a decorator that can be applied to a rendering function,
 * allowing the user to register that function with the `TypeRegistry` under a specific
 * type and component type. This makes it easy to extend rendering capabilities for
 * different components dynamically.
 *
 * @template InputType - The type of input that the rendering function will accept.
 * @template OutputType - The type of output that the rendering function will produce.
 *
 * @param {string} componentType - The type of component being registered (e.g., 'datagridCell', 'formField').
 * @returns {function(type: string): function(target: ITypeRegistryRenderer<InputType, OutputType>): void} -
 * A decorator function that accepts the type and registers the rendering function.
 *
 * ## Example:
 *
 * ```typescript
 * // Create a number renderer for datagrid cells
 * const numberRenderer: ITypeRegistryRenderer<number, string> = (value) => {
 *   return `<div class="cell number">${value}</div>`;
 * };
 *
 * // Use the decorator to register the renderer
 * @createTypeRegistryDecorator<number, string>('datagridCell')('number')
 * class NumberCellRenderer {
 *   render(value: number): string {
 *     return numberRenderer(value);
 *   }
 * }
 *
 * // The number renderer can now be used in a datagrid
 * const renderer = TypeRegistry.getRenderer('number', 'datagridCell');
 * console.log(renderer(123)); // Output: <div class="cell number">123</div>
 * ```
 */
export function createTypeRegistryDecorator<InputType = any, OutputType = any>(
  componentType: string
) {
  return (type: string) => {
    return function (
      target: ITypeRegistryRenderer<InputType, OutputType>
    ): void {
      // Register the rendering function with the TypeRegistry
      TypeRegistry.register(type, componentType, target);
    };
  };
}

/**
 * The `ComponentRegistry` class is a dynamic registry system that associates renderers (functions)
 * with specific component names. It allows you to register and retrieve renderers for various components
 * based on their names, making it easier to decouple the rendering logic from the components themselves.
 * This is especially useful in cases where different components may require distinct rendering behavior
 * for different types of data.
 *
 * The renderers are stored using Reflect metadata, enabling the system to dynamically resolve and invoke
 * the appropriate renderer without hard-coding logic for each component.
 *
 * ### Key Features:
 * - **Dynamic Registration**: Register renderers for specific components at runtime.
 * - **Flexible Rendering**: Retrieve and apply the correct renderer based on component name.
 * - **Type-Safe**: Generic types `InputType` and `OutputType` allow for strong typing of the renderer functions.
 * - **Fallback Mechanism**: Provide a fallback value when no renderer is found for a given component name.
 *
 * ### Use Cases:
 *
 * #### 1. Custom UI Rendering Based on Component Types
 * In UI applications, components can have different rendering logic for different data types.
 * For example, rendering numbers differently from dates. The `ComponentRegistry` allows you to register
 * specific renderers for these different components and render them based on their types.
 *
 * ```ts
 * // Register a renderer for handling numbers
 * ComponentRegistry.register<number, string>("numberRenderer", (input: number) => {
 *   return `Formatted Number: ${input.toFixed(2)}`;
 * });
 *
 * // Register a renderer for handling dates
 * ComponentRegistry.register<Date, string>("dateRenderer", (input: Date) => {
 *   return `Formatted Date: ${input.toDateString()}`;
 * });
 *
 * // Render a number using the registered number renderer
 * const renderedNumber = ComponentRegistry.render(123.456, "numberRenderer");
 * console.log(renderedNumber); // Outputs: "Formatted Number: 123.46"
 *
 * // Render a date using the registered date renderer
 * const renderedDate = ComponentRegistry.render(new Date(2024, 9, 15), "dateRenderer");
 * console.log(renderedDate); // Outputs: "Formatted Date: Mon Oct 15 2024"
 * ```
 *
 * #### 2. Fallback Rendering for Unregistered Components
 * In cases where a renderer is not registered for a given component, you can provide a fallback value.
 * This ensures that your application can handle missing renderers gracefully.
 *
 * ```ts
 * // Render with a fallback when no renderer is registered for the component
 * const renderedValue = ComponentRegistry.render(42, "unknownRenderer", "Fallback: No renderer found");
 * console.log(renderedValue); // Outputs: "Fallback: No renderer found"
 *
 * // Register a renderer for text components later on
 * ComponentRegistry.register<string, string>("textRenderer", (input: string) => {
 *   return `Text: ${input.toUpperCase()}`;
 * });
 *
 * // Render the text component after registration
 * const renderedText = ComponentRegistry.render("hello", "textRenderer", "Default text");
 * console.log(renderedText); // Outputs: "Text: HELLO"
 * ```
 *
 * #### 3. Conditional Rendering for Complex Components
 * For applications with multiple components that require different renderers depending on conditions
 * (e.g., dashboard widgets, form elements), the `ComponentRegistry` can dynamically choose which renderer
 * to use at runtime.
 *
 * ```ts
 * // Register a renderer for number widgets
 * ComponentRegistry.register<number, string>("widgetNumberRenderer", (input: number) => {
 *   return `Widget Number: ${input}`;
 * });
 *
 * // Register a renderer for string widgets
 * ComponentRegistry.register<string, string>("widgetStringRenderer", (input: string) => {
 *   return `Widget String: ${input}`;
 * });
 *
 * // Use conditional rendering based on component names
 * const widgetData = { type: "widgetNumberRenderer", value: 25 };
 * const renderedWidget = ComponentRegistry.render(widgetData.value, widgetData.type, "Default Widget");
 * console.log(renderedWidget); // Outputs: "Widget Number: 25"
 * ```
 *
 * The `ComponentRegistry` provides an elegant and scalable solution for managing rendering logic across
 * various types of components, enabling flexible and maintainable code.
 */
export class ComponentRegistry {
  /**
   * Constructs the metadata key used for storing component renderers.
   *
   * @param componentName - The name of the component for which the metadata key is generated.
   * If not provided, defaults to `"undefined-component-name"`.
   * @returns The generated metadata key string, in the format `COMPONENT_REGISTRY_KEY:componentName`.
   *
   * @example
   * ```ts
   * const key = ComponentRegistry.getMetadataKey("myComponent");
   * // key would be something like "COMPONENT_REGISTRY_KEY:myComponent"
   * ```
   */
  private static getMetadataKey(componentName: string): string {
    componentName = defaultStr(componentName, "undefined-component-name");
    return `${COMPONENT_REGISTRY_KEY}:${componentName}`.trim();
  }

  /**
   * Registers a renderer for a specific component by its name.
   * The renderer is stored using Reflect metadata and can be retrieved later for rendering specific values.
   *
   * @typeParam InputType - The type of the input value that the renderer will handle.
   * @typeParam OutputType - The type of the output value produced by the renderer.
   * @param componentName - The name of the component to register the renderer for. Must be a non-empty string.
   * @param renderer - A function that takes an input of `InputType` and returns an output of `OutputType`.
   *
   * @example
   * ```ts
   * ComponentRegistry.register<number, string>("numberRenderer", (input: number) => `The number is ${input}`);
   * ```
   */
  static register<InputType = any, OutputType = any>(
    componentName: string,
    renderer: ITypeRegistryRenderer<InputType, OutputType>
  ): void {
    if (!componentName || typeof componentName !== "string") return;
    Reflect.defineMetadata(
      this.getMetadataKey(componentName),
      renderer,
      ComponentRegistry
    );
  }

  /**
   * Retrieves the renderer function for a specific component by its name.
   *
   * @typeParam InputType - The type of the input value that the renderer handles.
   * @typeParam OutputType - The type of the output value produced by the renderer.
   * @param componentName - The name of the component whose renderer is being retrieved.
   * @returns The renderer function, if one is registered for the component, otherwise `undefined`.
   *
   * @example
   * ```ts
   * const renderer = ComponentRegistry.getRenderer<number, string>("numberRenderer");
   * if (renderer) {
   *   console.log(renderer(42)); // Outputs: "The number is 42"
   * }
   * ```
   */
  static getRenderer<InputType = any, OutputType = any>(
    componentName: string
  ): ITypeRegistryRenderer<InputType, OutputType> | undefined {
    return Reflect.getMetadata(
      this.getMetadataKey(componentName),
      ComponentRegistry
    );
  }

  /**
   * Checks if a renderer is registered for a given component name.
   *
   * @param componentName - The name of the component to check.
   * @returns `true` if a renderer is registered for the component, otherwise `false`.
   *
   * @example
   * ```ts
   * const hasRenderer = ComponentRegistry.hasRenderer("numberRenderer");
   * console.log(hasRenderer); // Outputs: true or false
   * ```
   */
  static hasRenderer(componentName: string): boolean {
    return !!this.getRenderer(componentName);
  }

  /**
   * Renders a value using the registered renderer for the specified component.
   * If no renderer is found, it returns the `fallbackValue` (if provided).
   *
   * @typeParam InputType - The type of the input value to be rendered.
   * @typeParam OutputType - The type of the output value produced by the renderer.
   * @param value - The input value to be rendered by the component's renderer.
   * @param componentName - The name of the component whose renderer will process the input value.
   * @param fallbackValue - (Optional) A value to return if no renderer is registered for the component.
   * @returns The output value produced by the renderer, or the `fallbackValue` if no renderer is registered.
   *
   * @example
   * ```ts
   * const output = ComponentRegistry.render(42, "numberRenderer", "No renderer available");
   * console.log(output); // Outputs: "The number is 42" or "No renderer available" if the renderer isn't registered
   * ```
   */
  static render<InputType = any, OutputType = any>(
    value: InputType,
    componentName: string,
    fallbackValue?: OutputType
  ): OutputType {
    const renderer = this.getRenderer<InputType, OutputType>(componentName);
    if (renderer) {
      return renderer(value) as OutputType;
    }
    return fallbackValue as OutputType;
  }
}

/**
 * Creates a decorator that registers a rendering function for a specified component in the `ComponentRegistry`.
 * This allows the decorated function to be automatically registered as a renderer for the given component name.
 *
 * The decorator can be applied to any function or class that matches the signature of the `ITypeRegistryRenderer<InputType, OutputType>`.
 * This is useful for associating a specific component renderer with a component name without manually calling `ComponentRegistry.register()`.
 *
 * ### Example Usage:
 *
 * #### 1. Registering a String Renderer
 *
 * ```ts
 * // Create a string renderer decorator for the component "stringRenderer"
 * const StringRenderer = createComponentRegistryDecorator<string, string>("stringRenderer");
 *
 * // Apply the decorator to a string rendering function
 * @StringRenderer
 * function renderString(input: string): string {
 *   return `Formatted String: ${input.toUpperCase()}`;
 * }
 *
 * // Use the ComponentRegistry to render a string using the registered function
 * const renderedString = ComponentRegistry.render("hello world", "stringRenderer");
 * console.log(renderedString); // Outputs: "Formatted String: HELLO WORLD"
 * ```
 *
 * #### 2. Registering a Date Renderer
 *
 * ```ts
 * // Create a date renderer decorator for the component "dateRenderer"
 * const DateRenderer = createComponentRegistryDecorator<Date, string>("dateRenderer");
 *
 * // Apply the decorator to a date rendering function
 * @DateRenderer
 * function renderDate(input: Date): string {
 *   return `Formatted Date: ${input.toISOString()}`;
 * }
 *
 * // Use the registered renderer for dates
 * const renderedDate = ComponentRegistry.render(new Date(), "dateRenderer");
 * console.log(renderedDate); // Outputs: "Formatted Date: 2024-10-15T12:00:00.000Z" (example output)
 * ```
 *
 * @typeParam InputType - The type of the input value that the renderer handles.
 * @typeParam OutputType - The type of the output value produced by the renderer.
 * @param componentName - The name of the component to register the renderer for.
 * @returns A decorator function that registers the target function as a renderer in the `ComponentRegistry`.
 */
export function createComponentRegistryDecorator<
  InputType = any,
  OutputType = any,
>(componentName: string) {
  return function (target: ITypeRegistryRenderer<InputType, OutputType>): void {
    // Register the rendering function with the ComponentRegistry
    ComponentRegistry.register(componentName, target);
  };
}
