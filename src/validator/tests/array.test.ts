import { i18n } from '../../i18n';
import {
  ArrayAllNumbers,
  ArrayAllStrings,
  ArrayContains,
  ArrayLength,
  ArrayMaxLength,
  ArrayMinLength,
  ArrayUnique,
  IsArray,
} from '../rules/array';
import { Validator } from '../validator';

describe('Array Validation Rules', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('Array Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays', async () => {
        const result = await Validator.getRules().Array({
          value: [1, 2, 3],
          i18n,
          ruleParams: [],
        });
        expect(result).toBe(true);
      });

      it('should validate empty arrays', async () => {
        const result = await Validator.getRules().Array({
          value: [],
          i18n,
          ruleParams: [],
        });
        expect(result).toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().Array({
          value: 'not an array',
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });

      it('should reject null', async () => {
        const result = await Validator.getRules().Array({
          value: null,
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });

      it('should reject undefined', async () => {
        const result = await Validator.getRules().Array({
          value: undefined,
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate array with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3],
          rules: ['Array'],
        });
        expect(result.success).toBe(true);
      });

      it('should reject non-array with programmatic API', async () => {
        const result = await Validator.validate({
          value: 'not an array',
          rules: ['Array'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @IsArray()
        items?: any[];
      }

      it('should register Array rule in target rules', () => {
        const rules = Validator.getTargetRules(TestEntity);
        expect(rules.items).toContain('Array');
      });

      it('should validate array with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: [1, 2, 3] },
        });
        expect(result.data?.items).toEqual([1, 2, 3]);
      });

      it('should reject non-array with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: 'not an array' },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayMinLength Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays with sufficient length', async () => {
        const result = await Validator.getRules().ArrayMinLength({
          value: [1, 2, 3],
          ruleParams: [2],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should validate arrays with exact minimum length', async () => {
        const result = await Validator.getRules().ArrayMinLength({
          value: [1, 2],
          ruleParams: [2],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should reject arrays with insufficient length', async () => {
        const result = await Validator.getRules().ArrayMinLength({
          value: [1],
          ruleParams: [2],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().ArrayMinLength({
          value: 'not an array',
          ruleParams: [1],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject invalid parameters', async () => {
        const result = await Validator.getRules().ArrayMinLength({
          value: [1, 2, 3],
          ruleParams: [-1],
          i18n,
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3],
          rules: [{ ArrayMinLength: [2] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject insufficient length with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1],
          rules: [{ ArrayMinLength: [2] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @ArrayMinLength(2)
        items?: any[];
      }

      it('should register ArrayMinLength rule in target rules', () => {
        const rules = Validator.getTargetRules(TestEntity);
        expect(rules.items).toContainEqual(expect.any(Function));
      });

      it('should validate sufficient length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: [1, 2, 3] },
        });
        expect(result.data?.items).toEqual([1, 2, 3]);
      });

      it('should reject insufficient length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: [1] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayMaxLength Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays with length under maximum', async () => {
        const result = await Validator.getRules().ArrayMaxLength({
          value: [1, 2],
          ruleParams: [3],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should validate arrays with exact maximum length', async () => {
        const result = await Validator.getRules().ArrayMaxLength({
          value: [1, 2, 3],
          ruleParams: [3],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should reject arrays exceeding maximum length', async () => {
        const result = await Validator.getRules().ArrayMaxLength({
          value: [1, 2, 3, 4],
          ruleParams: [3],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().ArrayMaxLength({
          value: 'not an array',
          ruleParams: [3],
          i18n,
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2],
          rules: [{ ArrayMaxLength: [3] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject excessive length with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3, 4],
          rules: [{ ArrayMaxLength: [3] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @ArrayMaxLength(3)
        items?: any[];
      }

      it('should validate under maximum length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: [1, 2] },
        });
        expect(result.data?.items).toEqual([1, 2]);
      });

      it('should reject excessive length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { items: [1, 2, 3, 4] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayLength Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays with exact length', async () => {
        const result = await Validator.getRules().ArrayLength({
          value: [1, 2, 3],
          ruleParams: [3],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should reject arrays with different length', async () => {
        const result = await Validator.getRules().ArrayLength({
          value: [1, 2],
          ruleParams: [3],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().ArrayLength({
          value: 'not an array',
          ruleParams: [3],
          i18n,
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate exact length with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3],
          rules: [{ ArrayLength: [3] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject wrong length with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2],
          rules: [{ ArrayLength: [3] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @ArrayLength(3)
        coordinates?: number[];
      }

      it('should validate exact length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { coordinates: [1, 2, 3] },
        });
        expect(result.data?.coordinates).toEqual([1, 2, 3]);
      });

      it('should reject wrong length with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { coordinates: [1, 2] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayContains Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays containing all required values', async () => {
        const result = await Validator.getRules().ArrayContains({
          value: [1, 2, 3, 4],
          ruleParams: [2, 3],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should validate arrays with object comparison', async () => {
        const result = await Validator.getRules().ArrayContains({
          value: [{ id: 1 }, { id: 2 }, { id: 3 }],
          ruleParams: [{ id: 2 }],
          i18n,
        });
        expect(result).toBe(true);
      });

      it('should reject arrays missing required values', async () => {
        const result = await Validator.getRules().ArrayContains({
          value: [1, 2, 3],
          ruleParams: [4],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().ArrayContains({
          value: 'not an array',
          ruleParams: [1],
          i18n,
        });
        expect(result).not.toBe(true);
      });

      it('should reject empty rule parameters', async () => {
        const result = await Validator.getRules().ArrayContains({
          value: [1, 2, 3],
          ruleParams: [],
          i18n,
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate containing values with programmatic API', async () => {
        const result = await Validator.validate({
          value: ['read', 'write', 'delete'],
          rules: [{ ArrayContains: ['read', 'write'] }],
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing values with programmatic API', async () => {
        const result = await Validator.validate({
          value: ['read', 'write'],
          rules: [{ ArrayContains: ['read', 'delete'] }],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @ArrayContains(['read'])
        permissions?: string[];
      }

      it('should validate containing values with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { permissions: ['read', 'write', 'delete'] },
        });
        expect(result.data?.permissions).toEqual(['read', 'write', 'delete']);
      });

      it('should reject missing values with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { permissions: ['write', 'delete'] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayUnique Rule', () => {
    describe('Rule Function', () => {
      it('should validate arrays with unique primitive values', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: [1, 2, 3],
          i18n,
          ruleParams: [],
        });
        expect(result).toBe(true);
      });

      it('should validate arrays with unique string values', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: ['a', 'b', 'c'],
          i18n,
          ruleParams: [],
        });
        expect(result).toBe(true);
      });

      it('should validate arrays with unique objects', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: [{ id: 1 }, { id: 2 }, { id: 3 }],
          i18n,
          ruleParams: [],
        });
        expect(result).toBe(true);
      });

      it('should reject arrays with duplicate primitives', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: [1, 2, 2, 3],
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });

      it('should reject arrays with duplicate objects', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: [{ id: 1 }, { id: 1 }, { id: 2 }],
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });

      it('should reject non-arrays', async () => {
        const result = await Validator.getRules().ArrayUnique({
          value: 'not an array',
          i18n,
          ruleParams: [],
        });
        expect(result).not.toBe(true);
      });
    });

    describe('Validation Behavior', () => {
      it('should validate unique values with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3],
          rules: ['ArrayUnique'],
        });
        expect(result.success).toBe(true);
      });

      it('should reject duplicate values with programmatic API', async () => {
        const result = await Validator.validate({
          value: [1, 2, 2, 3],
          rules: ['ArrayUnique'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Decorator', () => {
      class TestEntity {
        @ArrayUnique()
        tags?: string[];
      }

      it('should validate unique values with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { tags: ['javascript', 'typescript', 'react'] },
        });
        expect(result.data?.tags).toEqual([
          'javascript',
          'typescript',
          'react',
        ]);
      });

      it('should reject duplicate values with decorator', async () => {
        const result = await Validator.validateTarget(TestEntity, {
          data: { tags: ['javascript', 'typescript', 'javascript'] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ArrayAllStrings Rule', () => {
    describe('Rule Function', () => {
      it('validates arrays of strings', async () => {
        const r1 = await Validator.getRules().ArrayAllStrings({
          value: ['a', 'b'],
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllStrings({
          value: ['', 'x'],
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllStrings({
          value: [],
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(true);
        expect(r2).toBe(true);
        expect(r3).toBe(true);
      });

      it('rejects arrays containing non-strings', async () => {
        const r1 = await Validator.getRules().ArrayAllStrings({
          value: ['a', 1],
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllStrings({
          value: [null],
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllStrings({
          value: [undefined],
          i18n,
          ruleParams: [],
        });
        const r4 = await Validator.getRules().ArrayAllStrings({
          value: [true],
          i18n,
          ruleParams: [],
        });
        const r5 = await Validator.getRules().ArrayAllStrings({
          value: [['nested']],
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(i18n.t('validator.arrayAllStrings'));
        expect(r2).toBe(i18n.t('validator.arrayAllStrings'));
        expect(r3).toBe(i18n.t('validator.arrayAllStrings'));
        expect(r4).toBe(i18n.t('validator.arrayAllStrings'));
        expect(r5).toBe(i18n.t('validator.arrayAllStrings'));
      });

      it('rejects non-array values with array message', async () => {
        const r1 = await Validator.getRules().ArrayAllStrings({
          value: 'not array',
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllStrings({
          value: 123,
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllStrings({
          value: null as any,
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(i18n.t('validator.array'));
        expect(r2).toBe(i18n.t('validator.array'));
        expect(r3).toBe(i18n.t('validator.array'));
      });
    });

    describe('Decorator', () => {
      class StringList {
        @ArrayAllStrings()
        items?: string[];
      }

      it('registers decorator and validates', async () => {
        const rules = Validator.getTargetRules(StringList);
        expect(rules.items).toContain(Function);

        const ok = await Validator.validateTarget(StringList, {
          data: { items: ['x', 'y'] },
        });
        expect(ok.success).toBe(true);

        const bad = await Validator.validateTarget(StringList, {
          data: { items: ['x', 1 as any] },
        });
        expect(bad.success).toBe(false);
      });
    });
  });

  describe('ArrayAllNumbers Rule', () => {
    describe('Rule Function', () => {
      it('validates arrays of numbers', async () => {
        const r1 = await Validator.getRules().ArrayAllNumbers({
          value: [1, 2, 3],
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllNumbers({
          value: [1.1, 2.2],
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllNumbers({
          value: [-1, 0, 5],
          i18n,
          ruleParams: [],
        });
        const r4 = await Validator.getRules().ArrayAllNumbers({
          value: [],
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(true);
        expect(r2).toBe(true);
        expect(r3).toBe(true);
        expect(r4).toBe(true);
      });

      it('rejects arrays containing non-numbers or NaN', async () => {
        const r1 = await Validator.getRules().ArrayAllNumbers({
          value: [1, '2' as any],
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllNumbers({
          value: [NaN],
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllNumbers({
          value: [null],
          i18n,
          ruleParams: [],
        });
        const r4 = await Validator.getRules().ArrayAllNumbers({
          value: [undefined],
          i18n,
          ruleParams: [],
        });
        const r5 = await Validator.getRules().ArrayAllNumbers({
          value: [[1]],
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(i18n.t('validator.arrayAllNumbers'));
        expect(r2).toBe(i18n.t('validator.arrayAllNumbers'));
        expect(r3).toBe(i18n.t('validator.arrayAllNumbers'));
        expect(r4).toBe(i18n.t('validator.arrayAllNumbers'));
        expect(r5).toBe(i18n.t('validator.arrayAllNumbers'));
      });

      it('rejects non-array values with array message', async () => {
        const r1 = await Validator.getRules().ArrayAllNumbers({
          value: 'not array',
          i18n,
          ruleParams: [],
        });
        const r2 = await Validator.getRules().ArrayAllNumbers({
          value: 123,
          i18n,
          ruleParams: [],
        });
        const r3 = await Validator.getRules().ArrayAllNumbers({
          value: null as any,
          i18n,
          ruleParams: [],
        });
        expect(r1).toBe(i18n.t('validator.array'));
        expect(r2).toBe(i18n.t('validator.array'));
        expect(r3).toBe(i18n.t('validator.array'));
      });
    });

    describe('Decorator', () => {
      class NumberList {
        @ArrayAllNumbers()
        values?: number[];
      }

      it('registers decorator and validates', async () => {
        const rules = Validator.getTargetRules(NumberList);
        expect(rules.values).toContain(Function);

        const ok = await Validator.validateTarget(NumberList, {
          data: { values: [1, 2, 3] },
        });
        expect(ok.success).toBe(true);

        const bad = await Validator.validateTarget(NumberList, {
          data: { values: [1, '2' as any] },
        });
        expect(bad.success).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Multiple Array Rules', () => {
      class StrictArrayEntity {
        @IsArray()
        @ArrayMinLength(2)
        @ArrayMaxLength(5)
        @ArrayUnique()
        items?: any[];
      }

      it('should validate array meeting all criteria', async () => {
        const result = await Validator.validateTarget(StrictArrayEntity, {
          data: { items: [1, 2, 3] },
        });
        expect(result.data?.items).toEqual([1, 2, 3]);
      });

      it('should reject array failing any criteria', async () => {
        const result = await Validator.validateTarget(StrictArrayEntity, {
          data: { items: [1, 1, 2, 3, 4, 5] }, // Not unique and too long
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Programmatic API with Multiple Rules', () => {
      it('should validate with multiple array rules', async () => {
        const result = await Validator.validate({
          value: [1, 2, 3],
          rules: [
            'Array',
            { ArrayMinLength: [2] },
            { ArrayMaxLength: [5] },
            'ArrayUnique',
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should reject when any rule fails', async () => {
        const result = await Validator.validate({
          value: [1, 1, 1],
          rules: [
            'Array',
            { ArrayMinLength: [2] },
            { ArrayMaxLength: [5] },
            'ArrayUnique',
          ],
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
