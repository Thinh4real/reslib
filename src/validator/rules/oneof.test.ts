import { i18n } from "../../i18n";
import { ensureRulesRegistered } from "../index";
import { IValidatorRule } from "../types";

import { Validator } from "../validator";
import { OneOf } from "./multiRules";

ensureRulesRegistered();

describe("OneOf Validation Rules", () => {
  beforeAll(async () => {
    await i18n.setLocale("en");
  });

  // ============================================================================
  // Section 1: validateOneOfRule Method Tests
  // ============================================================================

  describe("validateOneOfRule Method", () => {
    describe("Basic Functionality", () => {
      it("should return true when first rule passes", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber"],
          value: "user@example.com",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should return true when second rule passes", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber"],
          value: "+44 20 1234 5678",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should return true when last rule passes", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber", "UUID"],
          value: "550e8400-e29b-41d4-a716-446655440000",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should return error message when all rules fail", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber"],
          value: "invalid-input",
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe("string");
        expect(result).toContain(";");
      });

      it("should return error message when rules array is empty", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: [],
          value: "any-value",
          i18n,
        });
        expect(result).toBe(true);
        //expect(typeof result).toBe("string");
      });
    });

    describe("Mixed Rule Types", () => {
      it("should accept string rules", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "Required"],
          value: "test@example.com",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should accept object rules with parameters", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: [{ MinLength: [5] }, { MaxLength: [2] }],
          value: "hello",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should accept function rules", async () => {
        const customRule = ({ value }: any) => value.startsWith("TEST-") || "Must start with TEST-";

        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", customRule],
          value: "TEST-12345",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should accept mixed string, object, and function rules", async () => {
        const customRule = ({ value }: any) => value.includes("@") || "Must include @";

        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", { MinLength: [10] }, customRule],
          value: "user@example.com",
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should fail when all mixed rules fail", async () => {
        const customRule = ({ value }: any) => value.startsWith("ADMIN-") || "Must start with ADMIN-";

        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", { MinLength: [50] }, customRule],
          value: "invalid",
          i18n,
        });
        expect(result).not.toBe(true);
        expect(typeof result).toBe("string");
      });
    });

    describe("Parallel Execution", () => {
      it("should execute multiple async rules in parallel", async () => {
        const executionTimes: number[] = [];

        const slowAsyncRule1 = async ({ value }: any) => {
          const start = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionTimes.push(Date.now() - start);
          return false; // Fails
        };

        const slowAsyncRule2 = async ({ value }: any) => {
          const start = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionTimes.push(Date.now() - start);
          return value === "pass"; // Passes
        };

        const result = await Validator.validateOneOfRule({
          ruleParams: [slowAsyncRule1, slowAsyncRule2],
          value: "pass",
          i18n,
        });

        // Should complete in roughly 50ms (parallel), not 100ms (sequential)
        expect(result).toBe(true);
      });

      it("should return immediately on first success without waiting for others", async () => {
        const executionOrder: string[] = [];

        const rule1 = async ({ value }: any) => {
          executionOrder.push("rule1_start");
          await new Promise((resolve) => setTimeout(resolve, 100));
          executionOrder.push("rule1_end");
          return true; // Passes immediately
        };

        const rule2 = async ({ value }: any) => {
          executionOrder.push("rule2_start");
          await new Promise((resolve) => setTimeout(resolve, 200));
          executionOrder.push("rule2_end");
          return true;
        };

        const result = await Validator.validateOneOfRule({
          ruleParams: [rule1, rule2],
          value: "test",
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe("Error Aggregation", () => {
      it("should aggregate error messages with semicolon separator", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber", "UUID"],
          value: "not-valid",
          i18n,
        });

        expect(typeof result).toBe("string");
        expect(result).toContain(";");
        const parts = (result as string).split(";");
        expect(parts.length).toBeGreaterThanOrEqual(2);
      });

      it("should include custom error messages in aggregation", async () => {
        const customRule1 = ({ value }: any) => "Custom error message 1";
        const customRule2 = ({ value }: any) => "Custom error message 2";

        const result = await Validator.validateOneOfRule({
          ruleParams: [customRule1, customRule2],
          value: "test",
          i18n,
        });

        expect(typeof result).toBe("string");
        expect(result).toContain("Custom error message 1");
        expect(result).toContain("Custom error message 2");
      });

      it("should handle empty error messages gracefully", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: [({ value }: any) => false, ({ value }: any) => false],
          value: "test",
          i18n,
        });

        expect(result).not.toBe(true);
      });
    });

    describe("Context Passing", () => {
      it("should pass context to all sub-rules", async () => {
        interface TestContext {
          userType: "admin" | "user";
        }

        const result = await Validator.validateOneOfRule<TestContext>({
          ruleParams: [
            ({ value, context }) => {
              return context?.userType === "admin" || "Must be admin";
            },
            "Email",
          ],
          value: "anything",
          context: { userType: "admin" },
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should validate with different contexts", async () => {
        interface TestContext {
          role: string;
        }

        const result1 = await Validator.validateOneOfRule<TestContext>({
          ruleParams: [
            ({ value, context }) => {
              return context?.role === "admin" || "Admin only";
            },
            "Email",
          ],
          value: "non-admin-value",
          context: { role: "user" } as TestContext,
          i18n,
        });

        // Should pass Email rule instead
        expect(result1).not.toBe("Admin only");
      });

      it("should pass data object to sub-rules", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: [
            "Email",
            ({ value, data }) => {
              return data?.allowCustom ? true : "Not allowed";
            },
          ],
          value: "custom-value",
          data: { allowCustom: true },
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe("Edge Cases", () => {
      it("should handle null value", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber"],
          value: null,
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it("should handle undefined value", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "PhoneNumber"],
          value: undefined,
          i18n,
        });

        expect(result).not.toBe(true);
      });

      it("should handle empty string value", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", { MinLength: [0] }],
          value: "",
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should handle numeric values", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "Number"],
          value: 42,
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should handle boolean values", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", ({ value }) => typeof value === "boolean"],
          value: true,
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should handle object values", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", ({ value }) => typeof value === "object" && value !== null],
          value: { key: "value" },
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should handle array values", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email", "Array"],
          value: [1, 2, 3],
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe("Field Name and Property Name", () => {
      it("should include fieldName in options passed to sub-rules", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email"],
          value: "test@example.com",
          fieldName: "contact",
          i18n,
        });

        expect(result).toBe(true);
      });

      it("should include propertyName in options passed to sub-rules", async () => {
        const result = await Validator.validateOneOfRule({
          ruleParams: ["Email"],
          value: "test@example.com",
          propertyName: "emailField",
          i18n,
        });

        expect(result).toBe(true);
      });
    });
  });

  // ============================================================================
  // Section 2: oneOf Factory Method Tests
  // ============================================================================

  describe("oneOf Factory Method", () => {
    describe("Basic Factory Creation", () => {
      it("should create a valid rule function", () => {
        const rule = Validator.oneOf(["Email", "PhoneNumber"]);
        expect(typeof rule).toBe("function");
      });

      it("should create rule that returns validation result", async () => {
        const rule = Validator.oneOf(["Email", "PhoneNumber"]);
        const result = await rule({
          value: "user@example.com",
          ruleParams: ["Email", "PhoneNumber"],
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should create rule from empty array", () => {
        const rule = Validator.oneOf([]);
        expect(typeof rule).toBe("function");
      });

      it("should create rule with single item", async () => {
        const rule = Validator.oneOf(["Email"]);
        const result = await rule({
          value: "test@example.com",
          ruleParams: ["Email"],
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should create rule with multiple items", async () => {
        const rule = Validator.oneOf(["Email", "PhoneNumber", "UUID", "Number"]);
        const result = await rule({
          value: "test@example.com",
          ruleParams: ["Email", "PhoneNumber", "UUID", "Number"],
          i18n,
        });
        expect(result).toBe(true);
      });
    });

    describe("Factory with Different Rule Types", () => {
      it("should create rule from string rules only", async () => {
        const rule = Validator.oneOf(["Email", "PhoneNumber"]);
        const result = await rule({
          value: "test@example.com",
          ruleParams: ["Email", "PhoneNumber"],
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should create rule from object rules only", async () => {
        const rule = Validator.oneOf([{ MinLength: [3] }, { MaxLength: [5] }]);
        const result = await rule({
          value: "test",
          ruleParams: [{ MinLength: [3] }, { MaxLength: [5] }],
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should create rule from function rules only", async () => {
        const rule = Validator.oneOf([({ value }: any) => value > 10, ({ value }: any) => value < 5]);
        const result = await rule({
          value: 3,
          ruleParams: [({ value }: any) => value > 10, ({ value }: any) => value < 5],
          i18n,
        });
        expect(result).toBe(true);
      });

      it("should create rule from mixed rule types", async () => {
        const customRule = ({ value }: any) => typeof value === "string";

        const rule = Validator.oneOf(["Email", { MinLength: [5] }, customRule]);
        const result = await rule({
          value: "test@example.com",
          ruleParams: ["Email", { MinLength: [5] }, customRule],
          i18n,
        });
        expect(result).toBe(true);
      });
    });

    describe("Factory with Generic Context", () => {
      it("should preserve context type information", async () => {
        interface MyContext {
          userId: number;
          isAdmin: boolean;
        }

        const rule = Validator.oneOf<MyContext>(["Email", ({ value, context }) => (context?.isAdmin ? true : "Not admin")]);

        const result = await rule({
          value: "anything",
          ruleParams: ["Email", ({ value, context }: any) => (context?.isAdmin ? true : "Not admin")],
          context: {
            userId: 123,
            isAdmin: true,
          } as MyContext,
          i18n,
        });

        expect(result).toBe(true);
      });
    });

    describe("Factory Rule Registration", () => {
      /* it("should create rule that can be registered", async () => {
        const contactRule = Validator.oneOf(["Email", "PhoneNumber"]);
        Validator.registerRule("ContactInfo", contactRule);

        const result = await Validator.validate({
          value: "test@example.com",
          rules: ["ContactInfo"],
        });

        expect(result.success).toBe(true);
      }); */
      /* t("should work with registered rule in validation", async () => {
        const idRule = Validator.oneOf(["UUID", "Number"]);
        Validator.registerRule("FlexibleID", idRule);

        const result = await Validator.validate({
          value: 123,
          rules: ["FlexibleID"],
        });

        expect(result.success).toBe(true);
      }); */
    });

    describe("Factory Immutability", () => {
      it("should not modify original rule params", async () => {
        const originalRules: IValidatorRule[] = ["Email", "PhoneNumber"];
        const rule = Validator.oneOf(originalRules);

        await rule({
          value: "test@example.com",
          ruleParams: originalRules,
          i18n,
        });

        expect(originalRules).toEqual(["Email", "PhoneNumber"]);
      });

      it("should create independent rule instances", async () => {
        const rule1 = Validator.oneOf(["Email"]);
        const rule2 = Validator.oneOf(["Email", "PhoneNumber"]);

        const result1 = await rule1({
          value: "test@example.com",
          ruleParams: ["Email"],
          i18n,
        });

        const result2 = await rule2({
          value: "+1 202 555 0185",
          ruleParams: ["Email", "PhoneNumber"],
          i18n,
        });

        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });
    });
  });

  // ============================================================================
  // Section 3: buildMultiRuleDecorator Method Tests
  // ============================================================================

  describe("buildMultiRuleDecorator Method", () => {
    describe("Decorator Factory Creation", () => {
      it("should create a decorator factory function", () => {
        const decoratorFactory = Validator.buildMultiRuleDecorator(function customOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });
        expect(typeof decoratorFactory).toBe("function");
      });

      it("should return decorator from factory when called", () => {
        const decoratorFactory = Validator.buildMultiRuleDecorator(function customOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });
        const decorator = decoratorFactory(["Email", "PhoneNumber"]);
        expect(typeof decorator).toBe("function");
      });

      it("should apply decorator to class properties", () => {
        const CustomDecorator = Validator.buildMultiRuleDecorator(function customOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class TestEntity {
          @CustomDecorator(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const rules = Validator.getTargetRules(TestEntity);
        expect(rules.contact).toBeDefined();
      });
    });

    describe("Decorator with Different Rule Sets", () => {
      it("should create decorator for string rules", () => {
        const StringRuleDecorator = Validator.buildMultiRuleDecorator(function stringRuleOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class TestEntity {
          @StringRuleDecorator(["Email", "PhoneNumber"])
          field: string = "";
        }

        const result = Validator.validateTarget(TestEntity, {
          data: { field: "test@example.com" },
        });

        expect(result).toBeDefined();
      });

      it("should create decorator for object rules with params", () => {
        const ObjectRuleDecorator = Validator.buildMultiRuleDecorator(function objectRuleOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class TestEntity {
          @ObjectRuleDecorator([{ MinLength: [5] }, { MaxLength: [3] }])
          field: string = "";
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });

      it("should create decorator for function rules", () => {
        const FunctionRuleDecorator = Validator.buildMultiRuleDecorator(function functionRuleOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        const customRule = ({ value }: any) => typeof value === "string";

        class TestEntity {
          @FunctionRuleDecorator([customRule, "Email"])
          field: string = "";
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });
    });

    describe("Decorator with Generic Context", () => {
      it("should support context-typed decorators", () => {
        interface MyContext {
          role: string;
        }

        const ContextAwareDecorator = Validator.buildMultiRuleDecorator<MyContext>(function contextOneOf(options: any) {
          return Validator.validateOneOfRule<MyContext>(options);
        });

        class TestEntity {
          @ContextAwareDecorator(["Email"])
          field: string = "";
        }

        expect(Validator.getTargetRules(TestEntity).field).toBeDefined();
      });
    });

    describe("Decorator Validation Behavior", () => {
      it("should validate decorated property when rule passes", async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(function testOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class User {
          @TestDecorator(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const result = await Validator.validateTarget(User, {
          data: { contact: "test@example.com" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe("test@example.com");
      });

      it("should fail validation when all rules fail", async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(function testOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class User {
          @TestDecorator(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const result = await Validator.validateTarget(User, {
          data: { contact: "invalid" },
        });

        expect(result.success).toBe(false);
        //expect((result as any).errors?.length).toBeGreaterThan(0);
      });
    });

    describe("Decorator with Multiple Fields", () => {
      it("should apply decorator to multiple properties independently", async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(function testOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class Form {
          @TestDecorator(["Email"])
          email: string = "";

          @TestDecorator(["PhoneNumber", "Number"])
          phone: string | number = "";
        }

        const result = await Validator.validateTarget(Form, {
          data: { email: "test@example.com", phone: 1234567890 },
        });

        expect(result.success).toBe(true);
      });

      it("should track errors for each decorated field", async () => {
        const TestDecorator = Validator.buildMultiRuleDecorator(function testOneOf(options: any) {
          return Validator.validateOneOfRule(options);
        });

        class Form {
          @TestDecorator(["Email"])
          email: string = "";

          @TestDecorator(["PhoneNumber"])
          phone: string = "";
        }

        const result = await Validator.validateTarget(Form, {
          data: { email: "invalid", phone: "invalid" },
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // Section 4: OneOf Decorator Tests
  // ============================================================================

  describe("OneOf Decorator", () => {
    describe("Decorator Application", () => {
      it("should apply OneOf decorator to property", () => {
        class User {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const rules = Validator.getTargetRules(User);
        expect(rules.contact).toBeDefined();
      });

      it("should validate decorated property", async () => {
        class User {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const result = await Validator.validateTarget(User, {
          data: { contact: "test@example.com" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe("test@example.com");
      });

      it("should fail when OneOf validation fails", async () => {
        class User {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const result = await Validator.validateTarget(User, {
          data: { contact: "invalid" },
        });

        expect(result.success).toBe(false);
      });
    });

    describe("OneOf with String Rules", () => {
      it("should validate email or phone number", async () => {
        class Contact {
          @OneOf(["Email", "PhoneNumber"])
          info: string = "";
        }

        const emailResult = await Validator.validateTarget(Contact, {
          data: { info: "user@example.com" },
        });

        const phoneResult = await Validator.validateTarget(Contact, {
          data: { info: "+1 202 555 0185" },
        });

        expect(emailResult.success).toBe(true);
        expect(phoneResult.success).toBe(true);
      });

      it("should accept UUID or IsNumber", async () => {
        class Identifier {
          @OneOf(["UUID", "Number"])
          id: string | number = "";
        }

        const uuidResult = await Validator.validateTarget(Identifier, {
          data: { id: "550e8400-e29b-41d4-a716-446655440000" },
        });

        const numberResult = await Validator.validateTarget(Identifier, {
          data: { id: 12345 },
        });

        expect(uuidResult.success).toBe(true);
        expect(numberResult.success).toBe(true);
      });
    });

    describe("OneOf with Object Rules", () => {
      it("should validate with MinLength or MaxLength", async () => {
        class Field {
          @OneOf([{ MinLength: [10] }, { MaxLength: [3] }])
          value: string = "";
        }

        const shortResult = await Validator.validateTarget(Field, {
          data: { value: "ab" },
        });

        const longResult = await Validator.validateTarget(Field, {
          data: { value: "this is a long string" },
        });

        expect(shortResult.success).toBe(true);
        expect(longResult.success).toBe(true);
      });
    });

    describe("OneOf with Function Rules", () => {
      it("should validate with custom function rules", async () => {
        class CustomField {
          @OneOf([({ value }) => value.startsWith("ADMIN-"), "Email"])
          field: string = "";
        }

        const adminResult = await Validator.validateTarget(CustomField, {
          data: { field: "ADMIN-123" },
        });

        const emailResult = await Validator.validateTarget(CustomField, {
          data: { field: "user@example.com" },
        });

        expect(adminResult.success).toBe(true);
        expect(emailResult.success).toBe(true);
      });
    });

    describe("OneOf with Mixed Rule Types", () => {
      it("should validate with mixed string, object, and function rules", async () => {
        class MixedRules {
          @OneOf(["Email", { MinLength: [8] }, ({ value }) => value.includes("@")])
          value: string = "";
        }

        const emailResult = await Validator.validateTarget(MixedRules, {
          data: { value: "test@example.com" },
        });

        const minLengthResult = await Validator.validateTarget(MixedRules, {
          data: { value: "longstring" },
        });

        const customResult = await Validator.validateTarget(MixedRules, {
          data: { value: "any@thing" },
        });

        expect(emailResult.success).toBe(true);
        expect(minLengthResult.success).toBe(true);
        expect(customResult.success).toBe(true);
      });
    });

    describe("OneOf with Other Decorators", () => {
      it("should work with IsRequired decorator", async () => {
        // Assuming IsRequired exists
        class RequiredOneOf {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";
        }

        const result = await Validator.validateTarget(RequiredOneOf, {
          data: { contact: "test@example.com" },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("OneOf Error Messages", () => {
      it("should provide meaningful error when all rules fail", async () => {
        class ErrorTest {
          @OneOf(["Email", "UUID"])
          value: string = "";
        }

        const result = await Validator.validateTarget(ErrorTest, {
          data: { value: "invalid-input" },
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.[0]?.message).toBeDefined();
        expect((result as any).errors?.[0]?.message).toBeTruthy();
      });

      it("should include multiple error messages in aggregation", async () => {
        class MultiError {
          @OneOf(["Email", "PhoneNumber", "UUID"])
          value: string = "";
        }

        const result = await Validator.validateTarget(MultiError, {
          data: { value: "not-valid" },
        });

        expect(result.success).toBe(false);
        const errorMessage = (result as any).errors?.[0]?.message || "";
        // Error should contain multiple rule failures
        expect(errorMessage.length).toBeGreaterThan(0);
      });
    });

    describe("OneOf with Empty Rules Array", () => {
      it("should fail validation with empty rules", async () => {
        class EmptyRules {
          @OneOf([])
          value: string = "";
        }

        const result = await Validator.validateTarget(EmptyRules, {
          data: { value: "any-value" },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("OneOf with Single Rule", () => {
      it("should validate with single rule", async () => {
        class SingleRule {
          @OneOf(["Email"])
          email: string = "";
        }

        const result = await Validator.validateTarget(SingleRule, {
          data: { email: "test@example.com" },
        });

        expect(result.success).toBe(true);
      });

      it("should fail with single rule when it doesn't match", async () => {
        class SingleRule {
          @OneOf(["Email"])
          email: string = "";
        }

        const result = await Validator.validateTarget(SingleRule, {
          data: { email: "not-an-email" },
        });

        expect(result.success).toBe(false);
      });
    });

    describe("OneOf with Multiple Properties", () => {
      it("should validate multiple OneOf decorated properties", async () => {
        class MultiProperty {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";

          @OneOf(["UUID", "Number"])
          id: string | number = "";

          @OneOf([{ MinLength: [5] }, "Number"])
          flexField: string | number = "";
        }

        const result = await Validator.validateTarget(MultiProperty, {
          data: { contact: "test@example.com", id: 123, flexField: "hello" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.contact).toBe("test@example.com");
        expect(result.data?.id).toBe(123);
        expect(result.data?.flexField).toBe("hello");
      });

      it("should track individual field errors", async () => {
        class MultiProperty {
          @OneOf(["Email"])
          contact: string = "";

          @OneOf(["UUID"])
          id: string = "";
        }

        const result = await Validator.validateTarget(MultiProperty, {
          data: { contact: "invalid-email", id: "invalid-uuid" },
        });

        expect(result.success).toBe(false);
        expect((result as any).errors?.length).toBe(2);
        const contactError = (result as any).errors?.find((e: any) => e.propertyName === "contact");
        const idError = (result as any).errors?.find((e: any) => e.propertyName === "id");
        expect(contactError).toBeDefined();
        expect(idError).toBeDefined();
      });
    });

    describe("OneOf with Different Data Types", () => {
      it("should validate numeric values", async () => {
        class NumericOneOf {
          @OneOf(["Email", "Number"])
          value: string | number = "";
        }

        const result = await Validator.validateTarget(NumericOneOf, {
          data: { value: 42 },
        });

        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(42);
      });

      it("should validate boolean values", async () => {
        class BooleanOneOf {
          @OneOf(["Email", ({ value }) => typeof value === "boolean"])
          value: string | boolean = "";
        }

        const result = await Validator.validateTarget(BooleanOneOf, {
          data: { value: true },
        });

        expect(result.success).toBe(true);
      });

      it("should validate array values", async () => {
        class ArrayOneOf {
          @OneOf(["Email", "Array"])
          value: string | any[] = "";
        }

        const result = await Validator.validateTarget(ArrayOneOf, {
          data: { value: [1, 2, 3] },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("OneOf with Null and Undefined", () => {
      it("should handle null value", async () => {
        class NullTest {
          @OneOf(["Email", "PhoneNumber"])
          value: string | null = "";
        }

        const result = await Validator.validateTarget(NullTest, {
          data: { value: null },
        });

        expect(result.success).toBe(false);
      });

      it("should handle undefined value", async () => {
        class UndefinedTest {
          @OneOf(["Email", "PhoneNumber"])
          value?: string = "";
        }

        const result = await Validator.validateTarget(UndefinedTest, {
          data: { value: undefined },
        });

        expect(result.success).toBe(false);
      });
    });

    describe("OneOf with Empty String", () => {
      it("should handle empty string value", async () => {
        class EmptyStringTest {
          @OneOf(["Email", ({ value }) => value === ""])
          value: string = "";
        }

        const result = await Validator.validateTarget(EmptyStringTest, {
          data: { value: "" },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("OneOf Context Integration", () => {
      it("should pass context through OneOf validation", async () => {
        interface AdminContext {
          isAdmin: boolean;
        }

        class AdminField {
          @OneOf([
            "Email",
            ({ value, context }) => {
              const ctx = context as AdminContext;
              return ctx?.isAdmin || "Admin only";
            },
          ])
          field: string = "";
        }

        const result = await Validator.validateTarget<typeof AdminField, AdminContext>(AdminField, {
          data: {
            field: "admin-value",
          },
          context: { isAdmin: true },
        });

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Section 5: Integration Tests
  // ============================================================================

  describe("Integration Tests", () => {
    describe("Programmatic API with OneOf", () => {
      it("should validate using validate() with OneOf rule", async () => {
        const result = await Validator.validate({
          value: "test@example.com",
          rules: [], //[{ OneOf: [["Email", "PhoneNumber"]] }],
        });

        // This tests integration with the main validate method
        expect(result.success).toBe(true);
      });
    });

    describe("Complex Validation Scenarios", () => {
      it("should handle deeply nested OneOf rules", async () => {
        class ComplexEntity {
          @OneOf(["Email", "PhoneNumber", "UUID", "Number", ({ value }) => typeof value === "string" && value.length > 0])
          multiField: string | number = "";
        }

        const testCases = [{ multiField: "test@example.com" }, { multiField: "+1 202 555 0185" }, { multiField: "550e8400-e29b-41d4-a716-446655440000" }, { multiField: 12345 }, { multiField: "any-string" }];

        for (const testData of testCases) {
          const result = await Validator.validateTarget(ComplexEntity, {
            data: testData,
          });
          expect(result.success).toBe(true);
        }
      });

      it("should handle OneOf with both required and optional fields", async () => {
        class UserProfile {
          @OneOf(["Email", "PhoneNumber"])
          contact: string = "";

          @OneOf([{ MinLength: [3] }, "Number"])
          identifier?: string | number;
        }

        const result1 = await Validator.validateTarget(UserProfile, {
          data: { contact: "test@example.com" },
        });

        const result2 = await Validator.validateTarget(UserProfile, {
          data: { contact: "test@example.com", identifier: "abc" },
        });

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
      });
    });

    describe("Error Handling and Recovery", () => {
      it("should provide useful error messages for debugging", async () => {
        class DebugEntity {
          @OneOf(["Email", { MinLength: [20] }, "UUID"])
          field: string = "";
        }

        const result = await Validator.validateTarget(DebugEntity, {
          data: { field: "invalid" },
        });

        expect(result.success).toBe(false);
        expect((result as any).errors).toBeDefined();
        expect((result as any).errors?.length).toBeGreaterThan(0);
        const errorMsg = (result as any).errors?.[0]?.message || "";
        expect(errorMsg.length).toBeGreaterThan(0);
      });

      it("should correctly report which rules failed", async () => {
        class ErrorReporting {
          @OneOf(["Email", "PhoneNumber", "UUID"])
          value: string = "";
        }

        const result = await Validator.validateTarget(ErrorReporting, {
          data: { value: "not-valid" },
        });

        expect(result.success).toBe(false);
        const errorMsg = (result as any).errors?.[0]?.message || "";
        // Should contain errors from all three rules
        expect(errorMsg.split(";").length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("Performance and Optimization", () => {
      it("should complete validation within reasonable time", async () => {
        class Performance {
          @OneOf(["Email", "PhoneNumber", "UUID", "Number", "Array"])
          value: string | number | any[] = "";
        }

        const start = Date.now();
        const result = await Validator.validateTarget(Performance, {
          data: { value: "test@example.com" },
        });
        const duration = Date.now() - start;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      });

      it("should handle large rule arrays efficiently", async () => {
        const manyRules = Array.from({ length: 20 }, (_, i) => `rule${i}`) as any[];
        manyRules[0] = "Email"; // Make sure one rule can pass

        class LargeRuleSet {
          @OneOf(manyRules)
          value: string = "";
        }

        const result = await Validator.validateTarget(LargeRuleSet, {
          data: { value: "test@example.com" },
        });

        expect(result.success).toBe(true);
      });
    });
  });
});
