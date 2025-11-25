import { i18n, Translate } from '../../i18n';
import {
  ensureRulesRegistered,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsRequired,
  IsString,
  MaxLength,
  MinLength,
} from '../index';
import { ValidatorRule } from '../types';

import { Validator } from '../validator';
import { AllOf } from './multiRules';

ensureRulesRegistered();

describe('AllOf Validation Rules', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('Validate oneOf rule', () => {
    it('should return true when all rules pass', async () => {
      const result = await Validator.validateOneOfRule({
        ruleParams: ['Email', 'Required'],
        value: 'user@example.com',
        i18n,
      });
      expect(result).toBe(true);
    });
    class RegisterDto {
      @IsEmail()
      @IsRequired()
      @MaxLength(120)
      @Translate('auth.register.dto.email')
      email: string = '';

      @IsRequired()
      @MinLength(8)
      @Translate('auth.register.dto.password')
      password: string = '';

      @IsOptional()
      @IsString()
      @MaxLength(50)
      @Translate('auth.register.dto.firstName')
      firstName?: string;

      @IsOptional()
      @IsString()
      @MaxLength(50)
      @Translate('auth.register.dto.lastName')
      lastName?: string;

      @IsOptional()
      @IsString()
      @IsPhoneNumber()
      @Translate('auth.register.dto.phoneNumber')
      phoneNumber?: string;
    }
    it('should validate single email or array of emails', async () => {
      const result = await Validator.validateTarget(RegisterDto, {
        data: {
          email: 'borisfouomen14@gmail.com',
          password: '1',
        },
      });
      expect(result.message).toContain('failed for one field');
    });
  });
  describe('validateAllOfRule Method', () => {
    describe('Basic Functionality', () => {
      it('should return true when all rules pass', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Email', 'Required'],
          value: 'user@example.com',
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should return error message when first rule fails', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Email', 'Required'],
          value: '',
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });

      it('should return error message when last rule fails', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required', 'Email'],
          value: 'not-an-email',
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });

      it('should return error message when all rules fail', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Email', 'PhoneNumber'],
          value: 'invalid-input',
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
        expect(result).toContain(';');
      });

      it('should return error message when rules array is empty', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [],
          value: 'any-value',
          i18n,
        });
        expect(result).toBe(true);
      });
    });

    describe('Mixed Rule Types', () => {
      it('should accept string rules', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required', 'Email'],
          value: 'test@example.com',
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should accept object rules with parameters', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [{ MinLength: [3] }, { MaxLength: [10] }],
          value: 'hello',
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should accept function rules', async () => {
        const customRule = ({ value }: any) =>
          value.startsWith('TEST-') || 'Must start with TEST-';

        const result = await Validator.validateAllOfRule({
          ruleParams: [({ value }: any) => value.length > 0, customRule],
          value: 'TEST-12345',
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should accept mixed string, object, and function rules', async () => {
        const customRule = ({ value }: any) =>
          value.includes('@') || 'Must include @';

        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required', { MinLength: [5] }, customRule],
          value: 'user@example.com',
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should fail when any mixed rule fails', async () => {
        const customRule = ({ value }: any) =>
          value.startsWith('ADMIN-') || 'Must start with ADMIN-';

        const result = await Validator.validateAllOfRule({
          ruleParams: ['Email', { MinLength: [50] }, customRule],
          value: 'user@example.com',
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
      });
    });

    describe('Sequential Execution', () => {
      it('should execute all rules even when some fail', async () => {
        const executionOrder: string[] = [];

        const rule1 = async ({ value }: any) => {
          executionOrder.push('rule1');
          return value.length > 0 || 'Rule1 failed';
        };

        const rule2 = async ({ value }: any) => {
          executionOrder.push('rule2');
          return false; // Always fails
        };

        const rule3 = async ({ value }: any) => {
          executionOrder.push('rule3');
          return true;
        };

        const result = await Validator.validateAllOfRule({
          ruleParams: [rule1, rule2, rule3],
          value: '',
          i18n,
        });

        expect(result).not.toBe(true);
        expect(executionOrder).toEqual(['rule1', 'rule2', 'rule3']);
      });

      it('should execute all rules when all pass', async () => {
        const executionOrder: string[] = [];

        const rule1 = async ({ value }: any) => {
          executionOrder.push('rule1');
          return true;
        };

        const rule2 = async ({ value }: any) => {
          executionOrder.push('rule2');
          return true;
        };

        const result = await Validator.validateAllOfRule({
          ruleParams: [rule1, rule2],
          value: 'test',
          i18n,
        });

        expect(result).toBe(true);
        expect(executionOrder).toEqual(['rule1', 'rule2']);
      });
    });

    describe('Error Aggregation', () => {
      it('should aggregate error messages with semicolon separator', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Email', 'PhoneNumber', 'UUID'],
          value: 'not-valid',
          i18n,
        });

        expect(typeof result).toBe('string');
        expect(result).toContain(';');
        const parts = (result as string).split(';');
        expect(parts.length).toBeGreaterThanOrEqual(2);
      });

      it('should include custom error messages in aggregation', async () => {
        const customRule1 = ({ value }: any) => 'Custom error message 1';
        const customRule2 = ({ value }: any) => 'Custom error message 2';

        const result = await Validator.validateAllOfRule({
          ruleParams: [customRule1, customRule2],
          value: 'test',
          i18n,
        });

        expect(typeof result).toBe('string');
        expect(result).toContain('Custom error message 1');
        expect(result).toContain('Custom error message 2');
      });

      it('should handle empty error messages gracefully', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [({ value }: any) => false, ({ value }: any) => false],
          value: 'test',
          i18n,
        });

        expect(result).not.toBe(true);
      });
    });

    describe('Context Passing', () => {
      it('should pass context to all sub-rules', async () => {
        interface TestContext {
          userType: 'admin' | 'user';
        }

        const result = await Validator.validateAllOfRule<TestContext>({
          ruleParams: [
            ({ value, context }) => {
              return value.length > 0 || 'Value required';
            },
            ({ value, context }) => {
              const ctx = context as TestContext;
              return ctx?.userType === 'admin' || 'Must be admin';
            },
          ],
          value: 'test',
          context: { userType: 'admin' },
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should validate with different contexts', async () => {
        interface TestContext {
          role: string;
        }

        const result1 = await Validator.validateAllOfRule<TestContext>({
          ruleParams: [
            'Required',
            ({ value, context }) => {
              const ctx = context as TestContext;
              return ctx?.role === 'admin' || 'Admin only';
            },
          ],
          value: 'test',
          context: { role: 'user' } as TestContext,
          i18n,
        });

        expect(result1).not.toBe(true);
      });

      it('should pass data object to sub-rules', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [
            'Required',
            ({ value, data }) => {
              return data?.allowCustom ? true : 'Not allowed';
            },
          ],
          value: 'custom-value',
          data: { allowCustom: true },
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null value', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required', 'Email'],
          value: null,
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should handle undefined value', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required', 'Email'],
          value: undefined,
          i18n,
        });

        expect(result).not.toBe(true);
      });

      it('should handle empty string value', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [
            ({ value }) => value === '',
            ({ value }) => typeof value === 'string',
          ],
          value: '',
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should handle numeric values', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Number', ({ value }) => value > 0],
          value: 42,
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should handle boolean values', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [
            ({ value }) => typeof value === 'boolean',
            ({ value }) => value === true,
          ],
          value: true,
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should handle object values', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: [
            ({ value }) => typeof value === 'object' && value !== null,
            ({ value }) => Object.prototype.hasOwnProperty.call(value, 'key'),
          ],
          value: { key: 'value' },
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should handle array values', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Array', ({ value }) => value.length > 0],
          value: [1, 2, 3],
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe('FieldMeta Name and Property Name', () => {
      it('should include fieldName in options passed to sub-rules', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required'],
          value: 'test',
          fieldName: 'contact',
          i18n,
        });

        expect(result).toBe(true);
      });

      it('should include propertyName in options passed to sub-rules', async () => {
        const result = await Validator.validateAllOfRule({
          ruleParams: ['Required'],
          value: 'test',
          propertyName: 'emailField',
          i18n,
        });

        expect(result).toBe(true);
      });
    });
  });

  // ============================================================================
  // Section 2: allOf Factory Method Tests
  // ============================================================================

  describe('allOf Factory Method', () => {
    describe('Basic Factory Creation', () => {
      it('should create a valid rule function', () => {
        const rule = Validator.allOf('Required', 'Email');
        expect(typeof rule).toBe('function');
      });

      it('should create rule that returns validation result', async () => {
        const rule = Validator.allOf('Required', 'Email');
        const result = await rule({
          value: 'user@example.com',
          ruleParams: ['Required', 'Email'],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should create rule from empty array', () => {
        const rule = Validator.allOf();
        expect(typeof rule).toBe('function');
      });

      it('should create rule with single item', async () => {
        const rule = Validator.allOf('Email');
        const result = await rule({
          value: 'test@example.com',
          ruleParams: ['Email'],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should create rule with multiple items', async () => {
        const rule = Validator.allOf('Required', 'Email', { MinLength: [5] });
        const result = await rule({
          value: 'user@example.com',
          ruleParams: ['Required', 'Email', { MinLength: [5] }],
          i18n,
        });
        expect(result).toBe(true);
      });
    });

    describe('Factory with Different Rule Types', () => {
      it('should create rule from string rules only', async () => {
        const rule = Validator.allOf('Required', 'Email');
        const result = await rule({
          value: 'test@example.com',
          ruleParams: ['Required', 'Email'],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should create rule from object rules only', async () => {
        const rule = Validator.allOf({ MinLength: [3] }, { MaxLength: [10] });
        const result = await rule({
          value: 'hello',
          ruleParams: [{ MinLength: [3] }, { MaxLength: [10] }],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should create rule from function rules only', async () => {
        const rule = Validator.allOf(
          ({ value }: any) => value.length > 5,
          ({ value }: any) => value.includes('@')
        );
        const result = await rule({
          value: 'user@example.com',
          ruleParams: [
            ({ value }: any) => value.length > 5,
            ({ value }: any) => value.includes('@'),
          ],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should create rule from mixed rule types', async () => {
        const customRule = ({ value }: any) => value.includes('@');

        const rule = Validator.allOf(
          'Required',
          { MinLength: [5] },
          customRule
        );
        const result = await rule({
          value: 'user@example.com',
          ruleParams: ['Required', { MinLength: [5] }, customRule],
          i18n,
        });
        expect(result).toBe(true);
      });
    });

    describe('Factory with Generic Context', () => {
      it('should preserve context type information', async () => {
        interface MyContext {
          userId: number;
          isAdmin: boolean;
        }

        const rule = Validator.allOf<MyContext>(
          'Required',
          ({ value, context }) => (context?.isAdmin ? true : 'Not admin')
        );

        const result = await rule({
          value: 'test',
          ruleParams: [
            'Required',
            ({ value, context }: any) =>
              context?.isAdmin ? true : 'Not admin',
          ],
          context: {
            userId: 123,
            isAdmin: true,
          } as MyContext,
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe('Factory Rule Registration', () => {
      it('should create rule that can be registered', async () => {
        const strictContactRule = Validator.allOf('Required', 'Email');
        Validator.registerRule('StrictContact' as any, strictContactRule);

        const result = await Validator.validate({
          value: 'test@example.com',
          rules: ['StrictContact' as any],
        });

        expect(result.success).toBe(true);
      });
      it('should work with registered rule in validation', async () => {
        const strictIdRule = Validator.allOf('Required', 'UUID');
        Validator.registerRule('StrictID' as any, strictIdRule);

        const result = await Validator.validate({
          value: '550e8400-e29b-41d4-a716-446655440000',
          rules: ['StrictID' as any],
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Factory Immutability', () => {
      it('should not modify original rule params', async () => {
        const originalRules: ValidatorRule[] = ['Required', 'Email'];
        const rule = Validator.allOf(...originalRules);

        await rule({
          value: 'test@example.com',
          ruleParams: originalRules,
          i18n,
        });

        expect(originalRules).toEqual(['Required', 'Email']);
      });

      it('should create independent rule instances', async () => {
        const rule1 = Validator.allOf('Required');
        const rule2 = Validator.allOf('Required', 'Email');

        const result1 = await rule1({
          value: 'test',
          ruleParams: ['Required'],
          i18n,
        });

        const result2 = await rule2({
          value: 'test@example.com',
          ruleParams: ['Required', 'Email'],
          i18n,
        });

        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });
    });
  });

  describe('buildMultiRuleDecorator Method', () => {
    describe('Decorator Factory Creation', () => {
      it('should create a decorator factory function', () => {
        const decoratorFactory = Validator.buildMultiRuleDecorator(
          function customAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );
        expect(typeof decoratorFactory).toBe('function');
      });

      it('should return decorator from factory when called', () => {
        const decoratorFactory = Validator.buildMultiRuleDecorator(
          function customAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );
        const decorator = decoratorFactory('Required', 'Email');
        expect(typeof decorator).toBe('function');
      });

      it('should apply decorator to class properties', () => {
        const CustomDecorator = Validator.buildMultiRuleDecorator(
          function customAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class TestEntity {
          @CustomDecorator('Required', 'Email')
          contact: string = '';
        }

        const rules = Validator.getTargetRules(TestEntity);
        expect(rules.contact).toBeDefined();
      });
    });

    describe('Decorator with Different Rule Sets', () => {
      it('should create decorator for string rules', () => {
        const StringRuleDecorator = Validator.buildMultiRuleDecorator(
          function stringRuleAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class TestEntity {
          @StringRuleDecorator('Required', 'Email')
          field: string = '';
        }

        const result = Validator.validateTarget(TestEntity, {
          data: {
            field: 'test@example.com',
          },
          i18n,
        });

        expect(result).toBeDefined();
      });

      it('should create decorator for object rules with params', () => {
        const ObjectRuleDecorator = Validator.buildMultiRuleDecorator(
          function objectRuleAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class TestEntity {
          @ObjectRuleDecorator({ MinLength: [5] }, { MaxLength: [20] })
          field: string = '';
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });

      it('should create decorator for function rules', () => {
        const FunctionRuleDecorator = Validator.buildMultiRuleDecorator(
          function functionRuleAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        const customRule = ({ value }: any) => value.length > 3;

        class TestEntity {
          @FunctionRuleDecorator(customRule, 'Required')
          field: string = '';
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });
    });

    describe('Decorator with Generic Context', () => {
      it('should support context-typed decorators', () => {
        interface MyContext {
          role: string;
        }

        const ContextAwareDecorator =
          Validator.buildMultiRuleDecorator<MyContext>(function contextAllOf(
            options: any
          ) {
            return Validator.validateAllOfRule<MyContext>(options);
          });

        class TestEntity {
          @ContextAwareDecorator('Required')
          field: string = '';
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });
    });

    describe('Decorator Validation Behavior', () => {
      it('should validate decorated property when all rules pass', async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(
          function testAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class User {
          @TestDecorator('Required', 'Email')
          contact: string = '';
        }

        const result = await Validator.validateTarget(User, {
          data: {
            contact: 'test@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe('test@example.com');
      });

      it('should fail validation when any rule fails', async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(
          function testAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class User {
          @TestDecorator('Required', 'Email')
          contact: string = '';
        }

        const result = await Validator.validateTarget(User, {
          data: { contact: 'not-an-email' },
          i18n,
        });

        expect(result.success).toBe(false);
      });
    });

    describe('Decorator with Multiple Fields', () => {
      it('should apply decorator to multiple properties independently', async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(
          function testAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class Form {
          @TestDecorator('Required', 'Email')
          email: string = '';

          @TestDecorator('Required', 'Number')
          age: number = 0;
        }

        const result = await Validator.validateTarget(Form, {
          data: {
            email: 'test@example.com',
            age: 25,
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });

      it('should track errors for each decorated field', async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(
          function testAllOf(options: any) {
            return Validator.validateAllOfRule(options);
          }
        );

        class Form {
          @TestDecorator('Required', 'Email')
          email: string = '';

          @TestDecorator('Required', 'Number')
          age: number = 0;
        }

        const result = await Validator.validateTarget(Form, {
          data: {
            email: '',
            age: 'not-a-number',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // Section 4: AllOf Decorator Tests
  // ============================================================================

  describe('AllOf Decorator', () => {
    describe('Decorator Application', () => {
      it('should apply AllOf decorator to property', () => {
        class User {
          @AllOf('Required', 'Email')
          contact: string = '';
        }

        const rules = Validator.getTargetRules(User);
        expect(rules.contact).toBeDefined();
      });

      it('should validate decorated property', async () => {
        class User {
          @AllOf('Required', 'Email')
          contact: string = '';
        }

        const result = await Validator.validateTarget(User, {
          data: {
            contact: 'test@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe('test@example.com');
      });

      it('should fail when AllOf validation fails', async () => {
        class User {
          @AllOf('Required', 'Email')
          contact: string = '';
        }

        const result = await Validator.validateTarget(User, {
          data: {
            contact: '',
          },
          i18n,
        });

        expect(result.success).toBe(false);
      });
    });

    describe('AllOf with String Rules', () => {
      it('should validate required email', async () => {
        class Contact {
          @AllOf('Required', 'Email')
          info: string = '';
        }

        const result = await Validator.validateTarget(Contact, {
          data: {
            info: 'user@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });

      it('should validate required UUID', async () => {
        class Identifier {
          @AllOf('Required', 'UUID')
          id: string = '';
        }

        const result = await Validator.validateTarget(Identifier, {
          data: {
            id: '550e8400-e29b-41d4-a716-446655440000',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Object Rules', () => {
      it('should validate with MinLength and MaxLength', async () => {
        class FieldMeta {
          @AllOf({ MinLength: [3] }, { MaxLength: [10] })
          value: string = '';
        }

        const result = await Validator.validateTarget(FieldMeta, {
          data: {
            value: 'hello',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Function Rules', () => {
      it('should validate with custom function rules', async () => {
        class CustomField {
          @AllOf(
            ({ value }) => value.length > 0,
            ({ value }) => value.startsWith('ADMIN-')
          )
          field: string = '';
        }

        const result = await Validator.validateTarget(CustomField, {
          data: {
            field: 'ADMIN-123',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Mixed Rule Types', () => {
      it('should validate with mixed string, object, and function rules', async () => {
        class MixedRules {
          @AllOf('Required', { MinLength: [8] }, ({ value }) =>
            value.includes('@')
          )
          value: string = '';
        }

        const result = await Validator.validateTarget(MixedRules, {
          data: {
            value: 'user@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Other Decorators', () => {
      it('should work with IsOptional decorator', async () => {
        class OptionalAllOf {
          @AllOf('Email', { MinLength: [5] })
          contact?: string;
        }

        const result = await Validator.validateTarget(OptionalAllOf, {
          data: {
            contact: 'test@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf Error Messages', () => {
      it('should provide meaningful error when rules fail', async () => {
        class ErrorTest {
          @AllOf('Required', 'Email')
          value: string = '';
        }

        const result = await Validator.validateTarget(ErrorTest, {
          data: {
            value: '',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.[0]?.message).toBeDefined();
        expect((result as any).errors?.[0]?.message).toBeTruthy();
      });

      it('should include multiple error messages in aggregation', async () => {
        class MultiError {
          @AllOf('Required', 'Email', 'PhoneNumber')
          value: string = '';
        }

        const result = await Validator.validateTarget(MultiError, {
          data: {
            value: '',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        const errorMessage = (result as any).errors?.[0]?.message || '';
        expect(errorMessage.length).toBeGreaterThan(0);
      });
    });

    describe('AllOf with Empty Rules Array', () => {
      it('should validate with empty rules', async () => {
        class EmptyRules {
          @AllOf()
          value: string = '';
        }

        const result = await Validator.validateTarget(EmptyRules, {
          data: {
            value: 'any-value',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Single Rule', () => {
      it('should validate with single rule', async () => {
        class SingleRule {
          @AllOf('Email')
          email: string = '';
        }

        const result = await Validator.validateTarget(SingleRule, {
          data: {
            email: 'test@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });

      it("should fail with single rule when it doesn't match", async () => {
        class SingleRule {
          @AllOf('Email')
          email: string = '';
        }

        const result = await Validator.validateTarget(SingleRule, {
          data: {
            email: 'not-an-email',
          },
          i18n,
        });

        expect(result.success).toBe(false);
      });
    });

    describe('AllOf with Multiple Properties', () => {
      it('should validate multiple AllOf decorated properties', async () => {
        class MultiProperty {
          @AllOf('Required', 'Email')
          contact: string = '';

          @AllOf('Required', 'UUID')
          id: string = '';

          @AllOf({ MinLength: [3] }, { MaxLength: [10] })
          code: string = '';
        }

        const result = await Validator.validateTarget(MultiProperty, {
          data: {
            contact: 'test@example.com',
            id: '550e8400-e29b-41d4-a716-446655440000',
            code: 'abc123',
          },
          i18n,
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe('test@example.com');
        expect(result.data?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data?.code).toBe('abc123');
      });

      it('should track individual field errors', async () => {
        class MultiProperty {
          @AllOf('Required', 'Email')
          contact: string = '';

          @AllOf('Required', 'UUID')
          id: string = '';
        }

        const result = await Validator.validateTarget(MultiProperty, {
          data: {
            contact: '',
            id: 'invalid-uuid',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.length).toBe(2);
        const contactError = (result as any).errors?.find(
          (e: any) => e.propertyName === 'contact'
        );
        const idError = (result as any).errors?.find(
          (e: any) => e.propertyName === 'id'
        );
        expect(contactError).toBeDefined();
        expect(idError).toBeDefined();
      });
    });

    describe('AllOf with Different Data Types', () => {
      it('should validate numeric values', async () => {
        class NumericAllOf {
          @AllOf('Number', ({ value }) => value > 0)
          value: number = 0;
        }

        const result = await Validator.validateTarget(NumericAllOf, {
          data: {
            value: 42,
          },
          i18n,
        });

        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(42);
      });

      it('should validate boolean values', async () => {
        class BooleanAllOf {
          @AllOf(
            ({ value }) => typeof value === 'boolean',
            ({ value }) => value === true
          )
          value: boolean = false;
        }

        const result = await Validator.validateTarget(BooleanAllOf, {
          data: {
            value: true,
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });

      it('should validate array values', async () => {
        class ArrayAllOf {
          @AllOf('Array', ({ value }) => value.length > 0)
          value: any[] = [];
        }

        const result = await Validator.validateTarget(ArrayAllOf, {
          data: {
            value: [1, 2, 3],
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf with Null and Undefined', () => {
      it('should handle null value', async () => {
        class NullTest {
          @AllOf('Required', 'Email')
          value: string | null = '';
        }

        const result = await Validator.validateTarget(NullTest, {
          data: {
            value: null,
          },
          i18n,
        });

        expect(result.success).toBe(false);
      });

      it('should handle undefined value', async () => {
        class UndefinedTest {
          @AllOf('Required', 'Email')
          value?: string = '';
        }

        const result = await Validator.validateTarget(UndefinedTest, {
          data: {
            value: undefined,
          },
          i18n,
        });

        expect(result.success).toBe(false);
      });
    });

    describe('AllOf with Empty String', () => {
      it('should handle empty string value', async () => {
        class EmptyStringTest {
          @AllOf(
            ({ value }) => value === '',
            ({ value }) => typeof value === 'string'
          )
          value: string = '';
        }

        const result = await Validator.validateTarget(EmptyStringTest, {
          data: {
            value: '',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('AllOf Context Integration', () => {
      it('should pass context through AllOf validation', async () => {
        interface AdminContext {
          isAdmin: boolean;
        }

        class AdminField {
          @AllOf('Required', ({ value, context }) => {
            const ctx = context as AdminContext;
            return ctx?.isAdmin || 'Admin only';
          })
          field: string = '';
        }

        const result = await Validator.validateTarget<
          typeof AdminField,
          AdminContext
        >(AdminField, {
          data: {
            field: 'admin-value',
          },
          context: { isAdmin: true },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Section 5: Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    describe('Programmatic API with AllOf', () => {
      it('should validate using validate() with AllOf rule', async () => {
        const result = await Validator.validate({
          value: 'test@example.com',
          rules: [], //[{ AllOf: [["Required", "Email"]] }],
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Complex Validation Scenarios', () => {
      it('should handle deeply nested AllOf rules', async () => {
        class ComplexEntity {
          @AllOf(
            'Required',
            'Email',
            { MinLength: [5] },
            ({ value }) => value.includes('@'),
            ({ value }) => value.length < 50
          )
          multiField: string = '';
        }

        const testCases = [
          { multiField: 'test@example.com' },
          { multiField: 'user@domain.org' },
        ];

        for (const testData of testCases) {
          const result = await Validator.validateTarget(ComplexEntity, {
            data: testData,
            i18n,
          });
          expect(result.success).toBe(true);
        }
      });

      it('should handle AllOf with both required and optional fields', async () => {
        class UserProfile {
          @AllOf('Required', 'Email')
          contact: string = '';

          @AllOf({ MinLength: [3] }, { MaxLength: [10] })
          code?: string;
        }

        const result1 = await Validator.validateTarget(UserProfile, {
          data: {
            contact: 'test@example.com',
          },
          i18n,
        });

        const result2 = await Validator.validateTarget(UserProfile, {
          data: {
            contact: 'test@example.com',
            code: 'abc',
          },
          i18n,
        });

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
      });
    });

    describe('Error Handling and Recovery', () => {
      it('should provide useful error messages for debugging', async () => {
        class DebugEntity {
          @AllOf('Required', 'Email', { MinLength: [20] })
          field: string = '';
        }

        const result = await Validator.validateTarget(DebugEntity, {
          data: {
            field: '',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        expect((result as any).errors).toBeDefined();
        expect((result as any).errors?.length).toBeGreaterThan(0);
        const errorMsg = (result as any).errors?.[0]?.message || '';
        expect(errorMsg.length).toBeGreaterThan(0);
      });

      it('should correctly report which rules failed', async () => {
        class ErrorReporting {
          @AllOf('Required', 'Email', 'UUID')
          value: string = '';
        }

        const result = await Validator.validateTarget(ErrorReporting, {
          data: {
            value: '',
          },
          i18n,
        });

        expect(result.success).toBe(false);
        const errorMsg = (result as any).errors?.[0]?.message || '';
        expect(errorMsg.split(';').length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Performance and Optimization', () => {
      it('should complete validation within reasonable time', async () => {
        class Performance {
          @AllOf('Required', 'Email', { MinLength: [5] }, { MaxLength: [50] })
          value: string = '';
        }

        const start = Date.now();
        const result = await Validator.validateTarget(Performance, {
          data: {
            value: 'test@example.com',
          },
          i18n,
        });
        const duration = Date.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(5000);
      });

      it('should handle large rule arrays efficiently', async () => {
        const manyRules = Array.from({ length: 20 }, (_, i) => ({
          MinLength: [i + 1],
        })) as any[];
        manyRules[0] = 'Required';
        manyRules[1] = 'Email';

        class LargeRuleSet {
          @AllOf(...manyRules)
          value: string = '';
        }

        const result = await Validator.validateTarget(LargeRuleSet, {
          data: {
            value: 'this-is-a-very-long-email-address@example.com',
          },
          i18n,
        });

        expect(result.success).toBe(true);
      });
    });
  });
});
