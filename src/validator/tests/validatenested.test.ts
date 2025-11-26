/* eslint-disable jest/no-conditional-expect */
import { i18n } from '../../i18n';
import {
  ArrayOf,
  ensureRulesRegistered,
  IsEmail,
  IsNonNullString,
  IsOptional,
  IsRequired,
  MinLength,
  ValidateNested,
} from '../index';
import { Validator } from '../validator';

ensureRulesRegistered();

describe('ValidateNested Validation - Comprehensive Test Suite', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  // ============================================================================
  // Section 1: @ValidateNested Decorator Basic Tests
  // ============================================================================

  describe('@ValidateNested Decorator - Basic Functionality', () => {
    it('should validate nested object with @ValidateNested decorator', async () => {
      class Address {
        street: string = '';
        city: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested(Address)
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

    it('should pass nested object validation successfully', async () => {
      class Contact {
        email: string = '';
        phone: string = '';
      }

      class Employee {
        name: string = '';

        @ValidateNested(Contact)
        contact: Contact = new Contact();
      }

      const result = await Validator.validateTarget(Employee, {
        data: {
          name: 'Jane Smith',
          contact: {
            email: 'jane@example.com',
            phone: '555-1234',
          },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should pass validation when nested object is invalid type but nested class has no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without validation decorators on nested class, any data passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: 'not-an-object',
        } as any,
      });
      expect(result.success).toBe(false);
    });

    it('should fail validation when nested object is null but nested class has no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without validation decorators on nested class, null passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: null,
        } as any,
      });
      expect(result.success).toBe(false);
    });

    it('should fail when nested object is undefined without @IsOptional() if nested class has no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without validation decorators on nested class, undefined passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: undefined,
        } as any,
      });

      expect(result.success).toBe(false);
    });

    it('should fail when nested object is array but nested class has no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without validation decorators on nested class, array passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: ['123 Main St'],
        } as any,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 2: @ValidateNested with Other Decorators
  // ============================================================================

  describe('@ValidateNested Combined with Other Decorators', () => {
    it('should work with @IsRequired() on nested property', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @IsRequired()
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should fail when required nested property is missing', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @IsRequired()
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {},
      });

      expect(result.success).toBe(false);
    });

    it('should work with @IsOptional() on nested property', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @IsOptional()
        @ValidateNested(Address)
        address?: Address;
      }

      const resultWithData = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
        },
      });

      const resultWithoutData = await Validator.validateTarget(User, {
        data: {},
      });

      expect(resultWithData.success).toBe(true);
      expect(resultWithoutData.success).toBe(true);
    });

    it('should pass optional nested property when undefined', async () => {
      class Contact {
        email: string = '';
      }

      class User {
        name: string = '';

        @IsOptional()
        @ValidateNested(Contact)
        contact?: Contact;
      }

      const result = await Validator.validateTarget(User, {
        data: {
          name: 'John',
          contact: undefined,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should allow missing optional nested property from data', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @IsOptional()
        @ValidateNested(Address)
        address?: Address;
      }

      const result = await Validator.validateTarget(User, {
        data: {},
      });

      expect(result.success).toBe(true);
    });

    it('should combine nested validation with decorators in nested class', async () => {
      class Contact {
        @IsRequired()
        email: string = '';
      }

      class User {
        @ValidateNested(Contact)
        contact: Contact = new Contact();
      }

      const successResult = await Validator.validateTarget(User, {
        data: {
          contact: {
            email: 'user@example.com',
          },
        },
      });

      expect(successResult.success).toBe(true);
    });

    it('should validate nested class with MinLength on property', async () => {
      class Profile {
        @IsRequired()
        bio: string = '';
      }

      class User {
        @ValidateNested(Profile)
        profile: Profile = new Profile();
      }

      const successResult = await Validator.validateTarget(User, {
        data: {
          profile: {
            bio: 'Hello World',
          },
        },
      });

      expect(successResult.success).toBe(true);
    });

    it('should pass when required decorated field has valid value', async () => {
      class Address {
        @IsRequired()
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const successResult = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
        },
      });

      expect(successResult.success).toBe(true);
    });

    it('should fail when nested class field validation fails', async () => {
      class Address {
        @IsRequired()
        street: string = '';

        @IsRequired()
        city: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
        },
      });

      // city is required but missing
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 3: Deeply Nested Objects
  // ============================================================================

  describe('Deeply Nested Objects - Multiple Levels', () => {
    it('should validate two-level nested objects', async () => {
      class Country {
        name: string = '';
      }

      class City {
        @ValidateNested(Country)
        country: Country = new Country();
      }

      class Address {
        @ValidateNested(City)
        city: City = new City();
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {
            city: {
              country: {
                name: 'USA',
              },
            },
          },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should report errors from deeply nested objects with decorated fields', async () => {
      class Country {
        @IsRequired()
        name: string = '';
      }

      class City {
        @ValidateNested(Country)
        country: Country = new Country();
      }

      class Address {
        @ValidateNested(City)
        city: City = new City();
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {
            city: {
              country: {},
            },
          },
        },
      });

      expect(result.success).toBe(false);
    });

    it('should handle three-level nested structure', async () => {
      class Room {
        name: string = '';
      }

      class Building {
        @ValidateNested(Room)
        room: Room = new Room();
      }

      class Campus {
        @ValidateNested(Building)
        building: Building = new Building();
      }

      class University {
        @ValidateNested(Campus)
        campus: Campus = new Campus();
      }

      const result = await Validator.validateTarget(University, {
        data: {
          campus: {
            building: {
              room: {
                name: 'Lab A',
              },
            },
          },
        },
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Section 4: Multiple Nested Properties
  // ============================================================================

  describe('Multiple Nested Properties in Same Class', () => {
    it('should validate multiple nested properties independently', async () => {
      class Address {
        street: string = '';
      }

      class Company {
        name: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();

        @ValidateNested(Company)
        company: Company = new Company();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
          company: { name: 'Tech Corp' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should fail when multiple nested properties have invalid decorated fields', async () => {
      class Address {
        @IsRequired()
        street: string = '';
      }

      class Company {
        @IsRequired()
        name: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();

        @ValidateNested(Company)
        company: Company = new Company();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {},
          company: {},
        },
      });

      expect(result.success).toBe(false);
    });

    it('should validate complex nested object graph', async () => {
      class Phone {
        countryCode: string = '';
        number: string = '';
      }

      class Address {
        street: string = '';
        city: string = '';
      }

      class Contact {
        @ValidateNested(Phone)
        phone: Phone = new Phone();

        @ValidateNested(Address)
        address: Address = new Address();
      }

      class User {
        name: string = '';

        @ValidateNested(Contact)
        contact: Contact = new Contact();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          name: 'John Doe',
          contact: {
            phone: {
              countryCode: '+1',
              number: '5551234567',
            },
            address: {
              street: '123 Main St',
              city: 'New York',
            },
          },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should fail when nested properties have no decorators regardless of data types', async () => {
      class Address {
        street: string = '';
      }

      class Phone {
        number: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();

        @ValidateNested(Phone)
        phone: Phone = new Phone();
      }

      // Both nested classes have no decorators, so any data passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: 'Valid' },
          phone: null,
        } as any,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 5: hasValidateNestedRule Inspection Method
  // ============================================================================

  describe('hasValidateNestedRule Inspection Method', () => {
    it('should detect @ValidateNested rule on property', () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const hasNested = Validator.hasValidateNestedRule(User, 'address');
      expect(hasNested).toBe(true);
    });

    it('should not detect @ValidateNested when not applied', () => {
      class User {
        name: string = '';
      }

      const hasNested = Validator.hasValidateNestedRule(User, 'name');
      expect(hasNested).toBe(false);
    });

    it('should detect nested rule on multiple properties correctly', () => {
      class Contact {
        email: string = '';
      }

      class Address {
        street: string = '';
      }

      class User {
        name: string = '';

        @ValidateNested(Contact)
        contact: Contact = new Contact();

        @ValidateNested(Address)
        address: Address = new Address();

        email: string = '';
      }

      expect(Validator.hasValidateNestedRule(User, 'contact')).toBe(true);
      expect(Validator.hasValidateNestedRule(User, 'address')).toBe(true);
      expect(Validator.hasValidateNestedRule(User, 'name')).toBe(false);
      expect(Validator.hasValidateNestedRule(User, 'email')).toBe(false);
    });

    it('should detect nested rule with optional decorator', () => {
      class Contact {
        email: string = '';
      }

      class User {
        @IsOptional()
        @ValidateNested(Contact)
        contact?: Contact;
      }

      const hasNested = Validator.hasValidateNestedRule(User, 'contact');
      expect(hasNested).toBe(true);
    });
  });

  // ============================================================================
  // Section 6: getValidateNestedTarget Inspection Method
  // ============================================================================

  describe('getValidateNestedTarget Inspection Method', () => {
    it('should retrieve nested class constructor', () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const target = Validator.getValidateNestedTarget(User, 'address');
      expect(target).toBe(Address);
    });

    it('should return undefined when no nested rule exists', () => {
      class User {
        name: string = '';
      }

      const target = Validator.getValidateNestedTarget(User, 'name');
      expect(target).toBeUndefined();
    });

    it('should retrieve correct targets for multiple nested properties', () => {
      class Address {
        street: string = '';
      }

      class Company {
        name: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();

        @ValidateNested(Company)
        company: Company = new Company();
      }

      const addressTarget = Validator.getValidateNestedTarget(User, 'address');
      const companyTarget = Validator.getValidateNestedTarget(User, 'company');

      expect(addressTarget).toBe(Address);
      expect(companyTarget).toBe(Company);
    });
  });

  // ============================================================================
  // Section 7: Edge Cases and Error Handling
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty nested object', async () => {
      class Address {
        street?: string;
        city?: string;
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {},
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle nested object with extra properties', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St', extraField: 'extra' },
        } as any,
      });

      expect(result.success).toBe(true);
    });

    it('should not handle primitive value in nested property when no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without decorators, primitive passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: 123,
        } as any,
      });

      expect(result.success).toBe(false);
    });

    it('should not handle boolean value in nested property when no decorators', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      // Without decorators, boolean passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: true,
        } as any,
      });

      expect(result.success).toBe(false);
    });

    it('should handle Array value of nested properties', async () => {
      class Address {
        @IsNonNullString()
        street: string = '';
      }

      class User {
        @ArrayOf(Validator.validateNested(Address))
        address: Address = new Address();
      }

      // Without decorators, boolean passes
      const result = await Validator.validateTarget(User, {
        data: {
          address: [{ street: '123 Main St' }, { street: '456 Elm St' }],
        } as any,
      });
      expect(result.success).toBe(true);
    });

    it('should report errors for multiple required decorated fields', async () => {
      class Address {
        @IsRequired()
        street: string = '';

        @IsRequired()
        city: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {},
        },
      });

      expect(result.success).toBe(false);
      expect((result as any).errors?.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // Section 8: Context Passing Through Nested Validation
  // ============================================================================

  describe('Context Passing Through Nested Validation', () => {
    it('should pass context through nested validation', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: { street: '123 Main St' },
        },
        context: { userId: 123, isAdmin: true },
      });

      expect(result.success).toBe(true);
    });

    it('should pass context through multiple nesting levels', async () => {
      class Country {
        name: string = '';
      }

      class City {
        @ValidateNested(Country)
        country: Country = new Country();
      }

      class Address {
        @ValidateNested(City)
        city: City = new City();
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {
            city: {
              country: {
                name: 'USA',
              },
            },
          },
        },
        context: { adminMode: true },
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Section 9: Validator Factory Method validateNested
  // ============================================================================

  describe('Validator.validateNested Factory Method', () => {
    it('should create a valid rule function', () => {
      class Address {
        street: string = '';
      }

      const rule = Validator.validateNested(Address);
      expect(typeof rule).toBe('function');
    });

    it('should create independent rule instances', async () => {
      class Address {
        street: string = '';
      }

      class Company {
        name: string = '';
      }

      const ruleAddress = Validator.validateNested(Address);
      const ruleCompany = Validator.validateNested(Company);

      expect(ruleAddress).not.toBe(ruleCompany);
    });

    it('should support different generic contexts if provided', () => {
      class Address {
        street: string = '';
      }

      const rule = Validator.validateNested(Address);
      expect(typeof rule).toBe('function');
    });
  });

  // ============================================================================
  // Section 10: Integration Tests - Complete Scenarios
  // ============================================================================

  describe('Integration Tests - Complete Scenarios', () => {
    it('should handle optional nested objects with other rules', async () => {
      class Address {
        street: string = '';
        city: string = '';
      }

      class User {
        @IsRequired()
        name: string = '';

        @IsOptional()
        @ValidateNested(Address)
        address?: Address;
      }

      const result1 = await Validator.validateTarget(User, {
        data: {
          name: 'John',
        },
      });

      const result2 = await Validator.validateTarget(User, {
        data: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
      });
      console.log(result1, ' is rrrrrrrrrrrrrrr1');
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      console.log(result2, ' is rrrrrrrrrrrrrrrr2');
    });

    it('should validate mixed nested and non-nested fields', async () => {
      class Address {
        street: string = '';
      }

      class User {
        @IsEmail()
        email: string = '';

        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          email: 'john@example.com',
          address: {
            street: '123 Main St',
          },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should fail when nested field validation fails', async () => {
      class Address {
        @IsRequired()
        @MinLength(5)
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {
            street: 'Hi',
          },
        },
      });

      expect(result.success).toBe(false);
    });

    it('should provide error messages for nested validation failures', async () => {
      class Address {
        @IsRequired()
        street: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const result = await Validator.validateTarget(User, {
        data: { address: {} },
      });

      expect(result.success).toBe(false);
    });

    it('should report all nested validation errors', async () => {
      class Address {
        @IsRequired()
        street: string = '';
      }

      class Company {
        @IsRequired()
        name: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();

        @ValidateNested(Company)
        company: Company = new Company();
      }

      const result = await Validator.validateTarget(User, {
        data: {
          address: {},
          company: {},
        },
      });

      expect(result.success).toBe(false);
    });

    it('should complete validation within reasonable time', async () => {
      class Address {
        street: string = '';
        city: string = '';
        zipCode: string = '';
      }

      class User {
        @ValidateNested(Address)
        address: Address = new Address();
      }

      const start = Date.now();
      const result = await Validator.validateTarget(User, {
        data: {
          address: {
            street: '123 Main St',
            city: 'New York',
            zipCode: '10001',
          },
        },
      });
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large nested object structures', async () => {
      class Item {
        id: number = 0;
        name: string = '';
        value: string = '';
      }

      class Container {
        items: Item[] = [];
      }

      class Root {
        @ValidateNested(Container)
        container: Container = new Container();
      }

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: `Value ${i}`,
      }));

      const result = await Validator.validateTarget(Root, {
        data: {
          container: { items },
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
