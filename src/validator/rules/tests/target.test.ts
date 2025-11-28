import {
  ArrayMinLength,
  ArrayOf,
  ensureRulesRegistered,
  IsArray,
  IsNonNullString,
  IsNumber,
  IsNumberGT,
  IsNumberGTE,
  IsString,
  MaxLength,
  ValidateNested,
  Validator,
} from '../../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Target Validation Rules', () => {
  describe('ValidateNested', () => {
    it('should pass when nested object validates successfully', async () => {
      class Address {
        @IsString()
        street: string = '';

        @IsString()
        city: string = '';

        @IsNumber()
        zipCode: number = -1;
      }

      class Person {
        @IsString()
        name: string = '';

        @ValidateNested(Address)
        address!: Address;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      instance.address = {
        street: '123 Main St',
        city: 'Anytown',
        zipCode: 12345,
      };

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should fail when nested object has validation errors', async () => {
      class Address {
        @IsString()
        @IsNonNullString()
        street: string = '';

        @IsString()
        @IsNonNullString()
        city: string = '';
      }

      class Person {
        @IsString()
        name: string = '';

        @ValidateNested(Address)
        address!: Address;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      instance.address = {
        street: '',
        city: 'Anytown',
      };

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(false);
      expect((result as any).errors?.length).toBeGreaterThan(0);
      expect(
        (result as any).errors?.some((e: any) =>
          e.message.includes('nonNullString')
        )
      ).toBe(true);
    });

    it('should handle null nested objects', async () => {
      class Address {
        @IsString()
        street: string = '';
      }
      class Person {
        @IsString()
        name: string = '';

        @ValidateNested(Address)
        address!: Address | null;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      instance.address = null;

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(false);
    });

    it('should handle undefined nested objects', async () => {
      class Address {
        @IsString()
        street: string = '';
      }
      class Person {
        @IsString()
        name: string = '';

        @ValidateNested(Address)
        address?: Address;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      // address is undefined
      const result = await Validator.validateTarget(Person, { data: instance });

      console.log(result, ' is rrrrrrrrr');
      expect(result.success).toBe(false);
    });

    it('should validate deeply nested objects', async () => {
      class Contact {
        @IsString()
        @IsNonNullString()
        email: string = '';
      }

      class Address {
        @IsString()
        @IsNonNullString()
        street: string = '';

        @IsString()
        @IsNonNullString()
        city: string = '';

        @ValidateNested(Contact)
        contact!: Contact;
      }

      class Person {
        @IsString()
        @IsNonNullString()
        name: string = '';

        @ValidateNested(Address)
        address!: Address;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      instance.address = {
        street: '123 Main St',
        city: 'Anytown',
        contact: {
          email: 'john@example.com',
        },
      };

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should fail for deeply nested validation errors', async () => {
      class Contact {
        @IsString()
        @IsNonNullString()
        email: string = '';
      }

      class Address {
        @IsString()
        @IsNonNullString()
        street: string = '';

        @ValidateNested(Contact)
        contact!: Contact;
      }

      class Person {
        @IsString()
        name: string = '';

        @ValidateNested(Address)
        address!: Address;
      }

      const instance = new Person();
      instance.name = 'John Doe';
      instance.address = {
        street: '123 Main St',
        contact: {
          email: '', // Invalid: empty string
        },
      };

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(false);
      expect(
        (result as any).errors?.some((e: any) =>
          e.message.includes('nonNullString')
        )
      ).toBe(true);
    });

    it('should validate arrays of nested objects', async () => {
      class Item {
        @IsString()
        @IsNonNullString()
        name: string = '';

        @IsNumber()
        @IsNumberGT(0)
        quantity: number = -1;
      }

      class Order {
        @IsString()
        orderId: string = '';

        @ArrayOf([Validator.validateNested(Item)])
        items!: Item[];
      }

      const instance = new Order();
      instance.orderId = 'ORD-001';
      instance.items = [
        { name: 'Widget A', quantity: 5 },
        { name: 'Widget B', quantity: 3 },
      ];

      const result = await Validator.validateTarget(Order, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should fail when array contains invalid nested objects', async () => {
      class Item {
        @IsString()
        @IsNonNullString()
        name: string = '';

        @IsNumber()
        @IsNumberGT(0)
        quantity: number = -1;
      }

      class Order {
        @IsString()
        orderId: string = '';

        @ValidateNested(Item)
        items!: Item[];
      }

      const instance = new Order();
      instance.orderId = 'ORD-001';
      instance.items = [
        { name: 'Widget A', quantity: 5 },
        { name: '', quantity: 0 }, // Invalid: empty name and zero quantity
      ];

      const result = await Validator.validateTarget(Order, { data: instance });
      expect(result.success).toBe(false);
      expect((result as any).errors?.length).toBeGreaterThan(0);
    });

    it('should handle empty arrays', async () => {
      class Item {
        @IsString()
        name: string = '';
      }

      class Order {
        @IsString()
        orderId: string = '';

        @ValidateNested(Item)
        items!: Item[];
      }

      const instance = new Order();
      instance.orderId = 'ORD-001';
      instance.items = [];

      const result = await Validator.validateTarget(Order, { data: instance });
      console.log(result, ' is reeeeeeeeeeee');
      expect(result.success).toBe(true);
    });

    it('should validate complex nested structures with multiple validation rules', async () => {
      class Metadata {
        @IsString()
        @MaxLength(100)
        description: string = '';

        @IsArray()
        @ArrayMinLength(1)
        tags!: string[];
      }

      class Product {
        @IsString()
        @IsNonNullString()
        name: string = '';

        @IsNumber()
        @IsNumberGT(0)
        price: number = -1;

        @ValidateNested(Metadata)
        metadata!: Metadata;
      }

      class Store {
        @IsString()
        storeName: string = '';

        @ArrayOf([Validator.validateNested(Product)])
        products!: Product[];
      }

      const instance = new Store();
      instance.storeName = 'Tech Store';
      instance.products = [
        {
          name: 'Laptop',
          price: 999.99,
          metadata: {
            description: 'High-performance laptop',
            tags: ['electronics', 'computer'],
          },
        },
        {
          name: 'Mouse',
          price: 29.99,
          metadata: {
            description: 'Wireless mouse',
            tags: ['electronics', 'peripheral'],
          },
        },
      ];

      const result = await Validator.validateTarget(Store, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should collect all validation errors from nested structures', async () => {
      class Contact {
        @IsString()
        @IsNonNullString()
        email: string = '';

        @IsString()
        @IsNonNullString()
        phone: string = '';
      }

      class Person {
        @IsString()
        @IsNonNullString()
        name: string = '';

        @IsNumber()
        @IsNumberGTE(0)
        age: number = -1;

        @ValidateNested(Contact)
        contact!: Contact;
      }

      const instance = new Person();
      instance.name = ''; // Invalid
      instance.age = -5; // Invalid
      instance.contact = {
        email: '', // Invalid
        phone: '123-456-7890', // Valid
      };

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(false);
      expect((result as any).errors?.length).toBeGreaterThan(2); // At least 3 errors
    });

    // Direct validation tests
    it('should work with direct validation for nested objects', async () => {
      class Address {
        @IsString()
        street: string = '';
      }

      const address = {
        street: '123 Main St',
      };

      const result = await Validator.validate({
        value: address,
        rules: [Validator.validateNested(Address)],
      });
      expect(result.success).toBe(true);
    });

    it('should fail direct validation for invalid nested objects', async () => {
      class Address {
        @IsString()
        @IsNonNullString()
        street: string = '';
      }

      const address = {
        street: '',
      };

      const result = await Validator.validate({
        value: address,
        rules: [Validator.validateNested(Address)],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain(
        'must be a non null string'
      );
    });

    it('should handle primitive values in direct validation', async () => {
      class Address {
        @IsString()
        street: string = '';
      }

      const result = await Validator.validate({
        value: 'not an object',
        rules: [Validator.validateNested(Address)],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be an object');
    });
  });
});
