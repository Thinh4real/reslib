import { i18n } from '../../i18n';
import { ensureRulesRegistered } from '../index';
import { ArrayOf } from '../rules/multiRules';
import { Validator } from '../validator';

ensureRulesRegistered();

describe('ArrayOf Validation Rules', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  // ============================================================================
  // Section 1: validateArrayOfRule Method Tests
  // ============================================================================
  describe('validateArrayOfRule Method', () => {
    it('should return true when all items pass simple rule', async () => {
      const result = await Validator.validateArrayOfRule({
        ruleParams: ['Email'],
        value: ['user@example.com', 'admin@example.com'],
        i18n,
      });
      expect(result).toBe(true);
    });

    it('should return true for empty array and/or empty sub-rules', async () => {
      const resultEmptyArray = await Validator.validateArrayOfRule({
        ruleParams: ['Email'],
        value: [],
        i18n,
      });
      expect(resultEmptyArray).toBe(true);

      const resultEmptyRules = await Validator.validateArrayOfRule({
        ruleParams: [],
        value: ['anything'],
        i18n,
      });
      expect(resultEmptyRules).toBe(true);
    });

    it('should aggregate errors when some items fail', async () => {
      const result = await Validator.validateArrayOfRule({
        ruleParams: ['Email'],
        value: ['valid@example.com', 'not-an-email', 'also@valid.com'],
        i18n,
      });
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      expect(String(result)).toContain('Validation failed for');
      expect(String(result)).toContain('#1:');
    });

    it('should return array error message for non-array input', async () => {
      const result = await Validator.validateArrayOfRule({
        ruleParams: ['Email'],
        value: 'not-an-array' as any,
        i18n,
      });
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
      expect(String(result)).toContain('This field must be an array');
    });
  });

  // ============================================================================
  // Section 2: arrayOf Factory Method Tests
  // ============================================================================
  describe('arrayOf Factory Method', () => {
    it('should create a valid rule function', () => {
      const rule = Validator.arrayOf(['Email']);
      expect(typeof rule).toBe('function');
    });

    it('should validate arrays using factory-created rule', async () => {
      const rule = Validator.arrayOf(['Email']);
      const result = await rule({
        value: ['user@example.com'],
        ruleParams: ['Email'],
        i18n,
      });
      expect(result).toBe(true);
    });

    it('should fail with meaningful message when factory rule items invalid', async () => {
      const rule = Validator.arrayOf(['Email']);
      const result = await rule({
        value: ['invalid'],
        ruleParams: ['Email'],
        i18n,
      });
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
    });
  });

  // ============================================================================
  // Section 3: Integration Tests with Validator.validate
  // ============================================================================
  describe('Integration with Validator.validate', () => {
    it('should validate using string rule syntax', async () => {
      const result = await Validator.validate({
        value: ['test@example.com', 'ok@example.org'],
        rules: [Validator.arrayOf(['Email'])],
        i18n,
      });
      expect(result.success).toBe(true);
    });

    it('should validate using object rule syntax', async () => {
      const result = await Validator.validate({
        value: ['test@example.com'],
        rules: [Validator.arrayOf(['Email'])],
        i18n,
      });
      expect(result.success).toBe(true);
    });

    it('should produce failure when any item invalid via validate()', async () => {
      const result = await Validator.validate({
        value: ['invalid', 'test@example.com'],
        rules: [Validator.arrayOf(['Email'])],
        i18n,
      });
      expect(result.success).toBe(false);
      expect(result?.error?.message).toContain('Validation failed for');
    });
  });

  // ============================================================================
  // Section 4: Decorator Tests
  // ============================================================================
  describe('ArrayOf Decorator', () => {
    it('should apply ArrayOf decorator on class properties', async () => {
      class TestEntity {
        @ArrayOf(['Email']) emails: string[] = [];
      }

      const ok = await Validator.validateTarget(TestEntity, {
        data: { emails: ['a@b.com', 'c@d.com'] },
        i18n,
      });
      expect(ok.success).toBe(true);

      const ko = await Validator.validateTarget(TestEntity, {
        data: { emails: ['not-email', 'c@d.com'] },
        i18n,
      });
      expect(ko.success).toBe(false);
      expect(ko.message).toContain('Validation failed for');
    });
  });
});
