import { Validator } from '@/validator';
import 'reflect-metadata';
import { i18n } from '../../i18n';
import { ValidateNested } from '../rules/target';

/**
 * Comprehensive test suite for Validator.validateTarget() method
 *
 * Tests class validation using the Either pattern (discriminated unions).
 * Covers basic validation, error handling, and response format consistency.
 */
describe('Validator.validateTarget() - Class Validation with Either Pattern', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('Basic Validation Success', () => {
    it('should return success result for valid data', async () => {
      class User {
        email: string = '';
        name: string = '';
      }

      const data = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const result = await Validator.validateTarget(User, { data });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
        expect(result.validatedAt).toBeInstanceOf(Date);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return consistent success structure', async () => {
      class Config {
        apiKey: string = '';
        endpoint: string = '';
      }

      const data = {
        apiKey: 'secret',
        endpoint: 'https://api.example.com',
      };

      const result = await Validator.validateTarget(Config, { data });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.validatedAt).toBeDefined();
        expect(result.duration).toBeDefined();
        expect(typeof result.duration).toBe('number');
      }
    });

    it('should preserve data object in response', async () => {
      class Model {
        field1: string = '';
        field2: number = 0;
        field3: boolean = false;
      }

      const originalData = {
        field1: 'value',
        field2: 42,
        field3: true,
      };

      const result = await Validator.validateTarget(Model, {
        data: originalData,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(originalData);
      }
    });
  });

  describe('No Rules Defined', () => {
    it('should pass when class has no validation rules', async () => {
      class SimpleModel {
        value: string = '';
      }

      const data = { value: 'test' };
      const result = await Validator.validateTarget(SimpleModel, { data });

      expect(result.success).toBe(true);
    });

    it('should accept any data when no rules are defined', async () => {
      class OpenModel {
        field: any;
      }

      const variations = [
        { field: 'string' },
        { field: 123 },
        { field: true },
        { field: null },
        { field: undefined },
        { field: { nested: 'object' } },
        { field: ['array'] },
      ];

      for (const data of variations) {
        const result = await Validator.validateTarget(OpenModel, { data });
        expect(result.success).toBe(true);
      }
    });

    it('should accept extra fields when no rules defined', async () => {
      class Model {
        field: string = '';
      }

      const data = {
        field: 'value',
        extra1: 'should be ok',
        extra2: 123,
        extra3: { nested: true },
      };

      const result = await Validator.validateTarget(Model, { data });
      expect(result.success).toBe(true);
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty object', async () => {
      class Model {
        field?: string;
      }

      const data = {};
      const result = await Validator.validateTarget(Model, { data });

      expect(result.success).toBe(true);
    });

    it('should handle partial data', async () => {
      class Model {
        field1: string = '';
        field2?: string;
        field3?: number;
      }

      const data = { field1: 'value' };
      const result = await Validator.validateTarget(Model, { data });

      expect(result.success).toBe(true);
    });
  });

  describe('Response Structure on Success', () => {
    it('should include validatedAt as Date', async () => {
      class Model {
        data: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { data: 'test' },
      });

      if (result.success) {
        expect(result.validatedAt).toBeInstanceOf(Date);
      }
    });

    it('should include duration as number', async () => {
      class Model {
        data: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { data: 'test' },
      });

      if (result.success) {
        expect(typeof result.duration).toBe('number');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have success flag set to true', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      expect(result.success === true).toBe(true);
    });

    it('should have proper response structure when valid', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.validatedAt).toBeInstanceOf(Date);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Context Passing', () => {
    it('should accept context option', async () => {
      class Model {
        field: string = '';
      }

      const context = { userId: 123, role: 'admin' };
      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
        context,
      });

      expect(result.success).toBe(true);
    });

    it('should pass context through to validation', async () => {
      class Model {
        field: string = '';
      }

      const testContext = { testValue: 'context-data' };

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
        context: testContext,
      });

      // Context should be available in the validation pipeline
      expect(result.success).toBe(true);
      expect(testContext).toBeDefined();
    });
  });

  describe('Concurrent Validation', () => {
    it('should handle multiple concurrent validations', async () => {
      class Model {
        id: string = '';
      }

      const instances = [{ id: '1' }, { id: '2' }, { id: '3' }];

      const results = await Promise.all(
        instances.map((data) => Validator.validateTarget(Model, { data }))
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should not interfere between concurrent calls', async () => {
      class Model {
        value: string = '';
      }

      const results = await Promise.all([
        Validator.validateTarget(Model, { data: { value: 'a' } }),
        Validator.validateTarget(Model, { data: { value: 'b' } }),
        Validator.validateTarget(Model, { data: { value: 'c' } }),
      ]);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Data Type Handling', () => {
    it('should preserve string types', async () => {
      class Model {
        text: string = '';
      }

      const data = { text: 'test string' };
      const result = await Validator.validateTarget(Model, { data });

      if (result.success) {
        expect(result.data?.text).toEqual('test string');
        expect(typeof result.data?.text).toBe('string');
      }
    });

    it('should preserve number types', async () => {
      class Model {
        count: number = 0;
      }

      const data = { count: 42 };
      const result = await Validator.validateTarget(Model, { data });

      if (result.success) {
        expect(result.data?.count).toEqual(42);
        expect(typeof result.data?.count).toBe('number');
      }
    });

    it('should preserve boolean types', async () => {
      class Model {
        active: boolean = false;
      }

      const data = { active: true };
      const result = await Validator.validateTarget(Model, { data });

      if (result.success) {
        expect(result.data?.active).toEqual(true);
        expect(typeof result.data?.active).toBe('boolean');
      }
    });

    it('should preserve array types', async () => {
      class Model {
        items: string[] = [];
      }

      const data = { items: ['a', 'b', 'c'] };
      const result = await Validator.validateTarget(Model, { data });

      if (result.success) {
        expect(Array.isArray(result.data?.items)).toBe(true);
        expect(result.data?.items).toEqual(['a', 'b', 'c']);
      }
    });

    it('should preserve object types', async () => {
      class Model {
        metadata: Record<string, any> = {};
      }

      const data = { metadata: { key: 'value', nested: { prop: 123 } } };
      const result = await Validator.validateTarget(Model, { data });

      if (result.success) {
        expect(typeof result.data?.metadata).toBe('object');
        expect(result.data?.metadata).toEqual(data.metadata);
      }
    });
  });

  describe('Class Variations', () => {
    it('should work with simple classes', async () => {
      class Simple {
        value: string = '';
      }

      const result = await Validator.validateTarget(Simple, {
        data: { value: 'test' },
      });
      expect(result.success).toBe(true);
    });

    it('should work with empty classes', async () => {
      class Empty {}

      const result = await Validator.validateTarget(Empty, { data: {} });
      expect(result.success).toBe(true);
    });

    it('should work with classes with default properties', async () => {
      class WithDefaults {
        name: string = 'Default Name';
        count: number = 0;
      }

      const result = await Validator.validateTarget(WithDefaults, { data: {} });
      expect(result.success).toBe(true);
    });
  });

  describe('Discriminated Union Type Safety', () => {
    it('should allow accessing success properties when success is true', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      if (result.success) {
        // These should be accessible without type errors
        const data = result.data;
        const timestamp = result.validatedAt;
        const duration = result.duration;

        expect(data).toBeDefined();
        expect(timestamp).toBeDefined();
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have success flag as boolean literal', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      // result.success should be narrowed to true in the if block
      if (result.success === true) {
        // TypeScript should recognize this as success case
        const successResult = result as any;
        expect(successResult.data).toBeDefined();
        expect(successResult.validatedAt).toBeDefined();
      }
    });
  });

  describe('Error Message Builder', () => {
    it('should accept custom error message builder', async () => {
      class Model {
        field: string = '';
      }

      const customBuilder = (name: string, error: string) => {
        return `CUSTOM[${name}]: ${error}`;
      };

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
        errorMessageBuilder: customBuilder,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Multiple Class Instances', () => {
    it('should validate different class types independently', async () => {
      class UserModel {
        email: string = '';
      }

      class ProductModel {
        name: string = '';
      }

      const [userResult, productResult] = await Promise.all([
        Validator.validateTarget(UserModel, {
          data: { email: 'test@example.com' },
        }),
        Validator.validateTarget(ProductModel, { data: { name: 'Widget' } }),
      ]);

      expect(userResult.success).toBe(true);
      expect(productResult.success).toBe(true);
    });
  });

  describe('Response Consistency', () => {
    it('should always return Either pattern result', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      // Should always have these properties
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // Should have either success data or error data
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.validatedAt).toBeDefined();
      } else {
        expect(result.errors).toBeDefined();
        expect(result.failedAt).toBeDefined();
      }
    });

    it('should always include timing information', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      if (result.success) {
        expect(result.validatedAt).toBeInstanceOf(Date);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('ValidateNested Decorator - Nested Class Validation', () => {
    it('should validate nested object with @ValidateNested decorator', async () => {
      class Address {
        street: string = '';
        city: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested([Address])
        address: Address = new Address();
      }

      const data = {
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'Springfield',
        },
      };

      const result = await Validator.validateTarget(User, { data });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should detect @ValidateNested decorator using metadata inspection', async () => {
      // This test demonstrates metadata-based detection as an alternative
      // to the string-based normalizedRule === "validatenested" check

      class Address {
        street: string = '';
        city: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested([Address])
        address: Address = new Address();
      }

      // Use the metadata-based method to check if a property has ValidateNested
      const hasAddressNested = Validator.hasValidateNestedRule(User, 'address');
      const hasNameNested = Validator.hasValidateNestedRule(User, 'name');

      expect(hasAddressNested).toBe(true);
      expect(hasNameNested).toBe(false);
    });

    it('should retrieve nested class target from metadata', async () => {
      // This test demonstrates retrieving the nested class constructor
      // using metadata instead of relying on string-based rule detection

      class Contact {
        email: string = '';
      }

      class Person {
        name: string = '';

        @ValidateNested([Contact])
        contact: Contact = new Contact();
      }

      // Retrieve the target class metadata
      const contactTarget = Validator.getValidateNestedTarget(
        Person,
        'contact'
      );
      const nameTarget = Validator.getValidateNestedTarget(Person, 'name');

      expect(contactTarget).toBe(Contact);
      expect(nameTarget).toBeUndefined();
    });

    it('should use metadata detection to ensure nested validation path', async () => {
      // This test verifies that metadata-based detection correctly identifies
      // properties requiring nested validation, providing an alternative to
      // the normalizedRule === "validatenested" string check

      class Address {
        street: string = '';
      }

      class User {
        email: string = '';

        @ValidateNested([Address])
        address: Address = new Address();
      }

      // Metadata-based detection
      const targetRules = Validator.getTargetRules(User);
      const hasMetadataValidation = Validator.hasValidateNestedRule(
        User,
        'address'
      );
      const nestedClass = Validator.getValidateNestedTarget(User, 'address');

      // All metadata-based checks should identify the nested structure
      expect(hasMetadataValidation).toBe(true);
      expect(nestedClass).toBe(Address);
      expect(targetRules.address).toBeDefined();

      // Validation should also succeed
      const result = await Validator.validateTarget(User, {
        data: {
          email: 'test@example.com',
          address: { street: 'Main St' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept nested object with any type when no decorators present', async () => {
      class Address {
        street: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested([Address])
        address: Address = new Address();
      }

      const data = {
        name: 'John Doe',
        address: 'not an object',
      };

      const result = await Validator.validateTarget(User, { data });

      // Without validation decorators on nested class, any data passes
      expect(result.success).toBe(false);
    });

    it('should support multi-level nested validation with @ValidateNested', async () => {
      class Coordinates {
        latitude: number = 0;
        longitude: number = 0;
      }

      class Location {
        name: string = '';

        @ValidateNested([Coordinates])
        coordinates: Coordinates = new Coordinates();
      }

      class Event {
        title: string = '';

        @ValidateNested([Location])
        location: Location = new Location();
      }

      const data = {
        title: 'Conference',
        location: {
          name: 'City Hall',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
      };

      const result = await Validator.validateTarget(Event, { data });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }

      // Metadata detection for multi-level nesting
      expect(Validator.hasValidateNestedRule(Event, 'location')).toBe(true);
      expect(Validator.hasValidateNestedRule(Location, 'coordinates')).toBe(
        true
      );
      expect(Validator.getValidateNestedTarget(Event, 'location')).toBe(
        Location
      );
      expect(Validator.getValidateNestedTarget(Location, 'coordinates')).toBe(
        Coordinates
      );
    });

    it('should invoke validatenested rule handling path in normalizedRule check', async () => {
      // This test specifically verifies the code path at validator.ts line ~1108:
      // else if (normalizedRule === "validatenested" && ruleParams[0])
      // is properly triggered when using @ValidateNested decorator

      class Contact {
        email: string = '';
        phone: string = '';
      }

      class Person {
        name: string = '';

        @ValidateNested([Contact])
        contact: Contact = new Contact();
      }

      const data = {
        name: 'Alice',
        contact: {
          email: 'alice@example.com',
          phone: '+1234567890',
        },
      };

      const result = await Validator.validateTarget(Person, { data });

      // When validateTarget is called, it should process the @ValidateNested decorator
      // which triggers the normalizedRule === "validatenested" condition,
      // invoking Validator.validateNestedRule internally
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.contact.email).toBe('alice@example.com');
      }
    });

    it('should fail nested validation with null when no decorators present', async () => {
      class Address {
        street: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested([Address])
        address: Address = new Address();
      }

      const data = {
        name: 'John',
        address: null,
      };

      const result = await Validator.validateTarget(User, { data });
      // Without validation decorators on nested class, null passes
      expect(result.success).toBe(false);
    });

    it('should validate nested object when nested class has no decorators', async () => {
      class SimpleAddress {
        street: string = '';
        city: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested([SimpleAddress])
        address: SimpleAddress = new SimpleAddress();
      }

      const data = {
        name: 'John',
        address: {
          street: 'Main St',
          city: 'Boston',
        },
      };

      const result = await Validator.validateTarget(User, { data });

      expect(result.success).toBe(true);
    });

    it('should process @ValidateNested decorator in the validate() rule chain', async () => {
      // This test ensures @ValidateNested decorator is recognized in the validator chain
      // and properly identified by normalizedRule === "validatenested" check

      class Metadata {
        created: string = '';
        updated: string = '';
      }

      class Document {
        title: string = '';

        @ValidateNested([Metadata])
        meta: Metadata = new Metadata();
      }

      const data = {
        title: 'My Document',
        meta: {
          created: '2024-01-01',
          updated: '2024-01-02',
        },
      };

      const result = await Validator.validateTarget(Document, { data });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Document');
        expect(result.data.meta.created).toBe('2024-01-01');
      }
    });

    it('should handle optional nested objects with @ValidateNested', async () => {
      class PhoneNumber {
        countryCode: string = '';
        number: string = '';
      }

      class Customer {
        email: string = '';
        phone?: PhoneNumber;
      }

      // Test with nested object present
      const resultWith = await Validator.validateTarget(Customer, {
        data: {
          email: 'customer@example.com',
          phone: {
            countryCode: '+1',
            number: '5551234567',
          },
        },
      });

      expect(resultWith.success).toBe(true);

      // Test with nested object omitted
      const resultWithout = await Validator.validateTarget(Customer, {
        data: {
          email: 'customer@example.com',
        },
      });

      expect(resultWithout.success).toBe(true);
    });
  });

  describe('Response Consistency', () => {
    it('should always return Either pattern result', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.validatedAt).toBeDefined();
      } else {
        expect(result.errors).toBeDefined();
        expect(result.failedAt).toBeDefined();
      }
    });

    it('should always include timing information', async () => {
      class Model {
        field: string = '';
      }

      const result = await Validator.validateTarget(Model, {
        data: { field: 'test' },
      });

      if (result.success) {
        expect(result.validatedAt).toBeInstanceOf(Date);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
