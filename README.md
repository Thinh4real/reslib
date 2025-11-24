**ResLib** is a lightweight, production-ready TypeScript library for decorator-based resource management and application utilities. ResLib provides a modular framework for building scalable applications with features like authentication, internationalization, validation, session management, and observable patterns.
It is fully cross-platform—compatible with web, Node.js, React Native (including Expo), and server environments like NestJS—while delivering strong type safety, high flexibility, and optimized performance without relying on platform-specific dependencies.

## **Table of Contents**

- [Key Features](#key-features)
- [Supported Platforms](#supported-platforms)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Advanced Examples](#advanced-examples)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Key **Features**

- **Decorator-Driven Resource Management**: Use decorators to intuitively define and manage resources, resulting in cleaner, more expressive code.
- **Modular Architecture**: Treat every component as a resource, promoting reusability and better organization of application logic.
- **Extensible Framework**: Effortlessly extend core functionalities by adding custom field types, decorators, and plugins tailored to specific project needs.
- **Customizable Field Types**: Support for various built-in field types (such as number, dropdown, selectResource) that can be customized with specific properties for flexible data handling.
- **Type Safety**: Developed with TypeScript, ensuring robust type-checking for a reliable foundation for scalable applications.
- **Intuitive API**: Enjoy a developer-friendly API that leverages TypeScript features for smooth auto-completion and type hints.
- **Dynamic Ecosystem**: Easily adapt to evolving project requirements by integrating external decorators and features, allowing for a responsive and flexible development environment.
- **Production Ready**: Optimized for performance, with comprehensive testing, documentation, and support for major platforms.

## 🌐 Supported Platforms

- **Web**: Full browser support with modern bundlers
- **React Native**: Seamless integration with Expo and bare React Native
- **NestJS**: Server-side framework support for backend applications
- **Node.js**: Server-side JavaScript runtime compatibility

## ⚙️ **Getting Started**

To begin using **ResLib**, follow these steps:

### **1\. Prerequisites**

Make sure you have the following installed on your machine:

- Node.js (version 16 or higher)
- npm (Node Package Manager)

### **2\. 🛠️ Install Required Packages**

To set up ResLib, run the following command:

```typescript
npm install reslib reflect-metadata
# or
yarn add reslib reflect-metadata
```

For Expo/React Native projects:

```typescript
npx expo install reslib reflect-metadata
```

For NestJS projects:

```typescript
npm install reslib reflect-metadata @nestjs/common
```

Also, install the necessary TypeScript dev dependencies:

```plaintext
npm install --save-dev typescript @types/node # or yarn add -D typescript @types/node
```

### **3\. TypeScript Configuration**

Create a `tsconfig.json` file in your project root with the following configuration:

Create a `tsconfig.json` file in your project root with the following configuration:

```typescript
{
    "compilerOptions": {
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "target": "es6",                          // Use ES6 or higher
      "module": "commonjs",                     // Use commonjs module system
      "experimentalDecorators": true,           // Enable experimental support for decorators
      "emitDecoratorMetadata": true,             // Enable emitting design:type metadata
      "strict": true,                            // Enable all strict type checking options
      "skipLibCheck": true                       // Skip type checking of declaration files
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
}
```

### 4\. **Import** `reflect-metadata`

In your entry file (usually `index.ts` or `app.ts`), ensure that you import `reflect-metadata` at the very top of the file. This is required to enable metadata reflection for decorators.

```typescript
import 'reflect-metadata';
```

## 📚 **Documentation**

### Resources

- **Resources** are the foundation of ResLib. Use the `@ResourceMeta` decorator to define any logical entity (models, components, etc.).
- **Fields**: Add fields to your resources using the `@Field` decorator, specifying field types and options.

### Built-In Field Types

- **number**: Simple number field.
- **string**: Simple string field;
- **boolean**: Simple boolean field;
- **symbol** : Simple symbol field;
- **switch** : Can be a number of a boolean;
- **checkbox**: Can be a number of a boolean;

Once you have installed the necessary packages and set up TypeScript, you can start defining resources and fields using ResLib decorators.

### **Basic Example**

```typescript
import 'reflect-metadata';
import { ResourceMeta, Field } from 'reslib';

@ResourceMeta()
class User {
  @Field({ type: 'string' })
  name: string;

  @Field({ type: 'number' })
  age: number;

  @Field({ type: 'email' })
  email: string;
}
```

## **Examples**

### **Defining Custom Field Types**

```typescript
@Field({ type: 'dropdown', options: ['Admin', 'User', 'Guest'] })
role: string;

@Field({ type: 'selectResource', resourceName: 'Product' })
favoriteProduct: string;
```

### **Creating Extensible Decorators**

You can easily create and register new decorators to extend the functionality of your resources.

```typescript
function CustomField(options: { customProp: string }) {
  return function (target: any, propertyKey: string) {
    // Custom decorator logic
    Reflect.defineMetadata(
      'customProp',
      options.customProp,
      target,
      propertyKey
    );
  };
}
```

## **Advanced Examples**

### 🔄 **Extending the Framework**

ResLib is designed for flexibility. You can add your own custom field types or extend existing ones with full TypeScript support.

### **Extending Field Types**

You can easily extend the field types available in ResLib by creating custom decorators. To extend field types and register custom options (e.g., a `rating` field), use TypeScript's **declaration merging**.

```typescript
function ExtendedField(type: string, options: any) {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata('design:type', type, target, propertyKey);
        Reflect.defineMetadata('field:options', options, target, propertyKey);
    };
}

// Define a new field type for a color picker
@ExtendedField('colorPicker', { defaultColor: '#000000' })
color: string;
```

### This allows ResLib to recognize new custom field types, complete with IntelliSense support.

### **Adding New Resources**

You can create new resources and leverage the existing decorators for rich resource definitions.

```typescript
@ResourceMeta()
class Product {
  @Field({ type: 'string' })
  productName: string;

  @Field({ type: 'number' })
  price: number;

  @Field({ type: 'string', options: { enum: ['In Stock', 'Out of Stock'] } })
  availability: string;
}
```

### **Custom Decorator for Advanced Logic**

You can also create custom decorators that implement advanced logic, such as validation or transformation.

```typescript
function IsPositive(target: any, propertyKey: string) {
    const value = target[propertyKey];
    if (value &lt; 0) {
        throw new Error(`${propertyKey} must be a positive number.`);
    }
}

@ResourceMeta()
class Order {
    @Field({ type: 'number' })
    @IsPositive
    totalAmount: number;

    @Field({ type: 'string' })
    customerName: string;
}
```

### **Using Extended Field Types**

Here’s how you can use the newly defined field types in a resource:

```typescript
@ResourceMeta()
class EnhancedUser {
  @Field({ type: 'string' })
  name: string;

  @ExtendedField('colorPicker', { defaultColor: '#FF0000' })
  favoriteColor: string;
}
```

## 🔌 **Plugins & Extensions**

ResLib can be extended with plugins and custom modules. Define new decorators, extend resource behavior, and add complex validation logic as needed.

### Example: Custom Decorator Plugin

```typescript
import { ResourceMeta, Field, customDecorator } from 'reslib';

function LogField() {
  return customDecorator((target, key) =&gt; {
    console.log(`Field '${key}' has been initialized.`);
  });
}

@ResourceMeta
class Product {
  @LogField()
  @Field({ type: "number" })
  price: number;
}
```

## 🧩 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 📜 **License**

ResLib is licensed under the MIT License.

## 🛠 **Built With**

- **TypeScript**: Type-safe, scalable development.
- **Reflect-metadata**: For decorator metadata reflection.
- **Custom Decorators**: A clean and declarative way to extend functionality.

## 👏 **Acknowledgements**

Thanks to the open-source community for contributions and inspiration.

## 📬 **Contact**

For support or inquiries:

- GitHub:  [GitHub Link](https://github.com/boris-fouomene/reslib)
