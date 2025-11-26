import { i18n, Translate } from '../../i18n';

import {
  IsEmail,
  IsEmpty,
  IsNonNullString,
  IsNullable,
  IsNumber,
  IsNumberGT,
  IsNumberLT,
  IsNumberNE,
  IsOptional,
  IsRequired,
  IsUrl,
  Length,
  Validator,
} from '../index';

describe('Validator Rules', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  describe('numberLessThanOrEquals 5, and 10', () => {
    it('should validate if the number 5 is less than  or equal to the specified value 10', async () => {
      const result = await Validator.getRules().NumberLTE({
        value: 5,
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('numberLessThan', () => {
    it('should validate if the number is less than the specified value', async () => {
      const result = await Validator.getRules().NumberLT({
        value: 5,
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('NumberGTE', () => {
    it('should validate if the number is greater than or equal to the specified value', async () => {
      const result = await Validator.getRules().NumberGTE({
        value: 10,
        ruleParams: [5],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('NumberGT', () => {
    it('should validate if the number is greater than the specified value', async () => {
      const result = await Validator.getRules().NumberGT({
        value: 15,
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('numberEquals', () => {
    it('should validate if the number is equal to the specified value', async () => {
      const result = await Validator.getRules().NumberEQ({
        value: 10,
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('numberIsDifferentFrom', () => {
    it('should validate if the number is not equal to the specified value', async () => {
      const result = await Validator.getRules().NumberNE({
        value: 5,
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });
  });

  describe('EvenNumber', () => {
    it('validates even integers', async () => {
      const r1 = await Validator.getRules().EvenNumber({
        value: 0,
        i18n,
        ruleParams: [],
      });
      const r2 = await Validator.getRules().EvenNumber({
        value: 2,
        i18n,
        ruleParams: [],
      });
      const r3 = await Validator.getRules().EvenNumber({
        value: '8',
        i18n,
        ruleParams: [],
      });
      const r4 = await Validator.getRules().EvenNumber({
        value: -4,
        i18n,
        ruleParams: [],
      });
      expect(r1).toBe(true);
      expect(r2).toBe(true);
      expect(r3).toBe(true);
      expect(r4).toBe(true);
    });

    it('rejects odd integers', async () => {
      const r = await Validator.getRules().EvenNumber({
        value: 7,
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.evenNumber'));
    });

    it('rejects non-integer numeric values with integer message', async () => {
      const r = await Validator.getRules().EvenNumber({
        value: 2.5,
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.integer'));
    });

    it('rejects non-numeric inputs with number message', async () => {
      const r = await Validator.getRules().EvenNumber({
        value: 'abc',
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.number'));
    });
  });

  describe('OddNumber', () => {
    it('validates odd integers', async () => {
      const r1 = await Validator.getRules().OddNumber({
        value: 1,
        i18n,
        ruleParams: [],
      });
      const r2 = await Validator.getRules().OddNumber({
        value: '7',
        i18n,
        ruleParams: [],
      });
      const r3 = await Validator.getRules().OddNumber({
        value: -5,
        i18n,
        ruleParams: [],
      });
      expect(r1).toBe(true);
      expect(r2).toBe(true);
      expect(r3).toBe(true);
    });

    it('rejects even integers', async () => {
      const r = await Validator.getRules().OddNumber({
        value: 10,
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.oddNumber'));
    });

    it('rejects non-integer numeric values with integer message', async () => {
      const r = await Validator.getRules().OddNumber({
        value: 3.14,
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.integer'));
    });

    it('rejects non-numeric inputs with number message', async () => {
      const r = await Validator.getRules().OddNumber({
        value: null as any,
        i18n,
        ruleParams: [],
      });
      expect(r).toBe(i18n.t('validator.number'));
    });
  });

  describe('required', () => {
    it('should validate if the value is present', () => {
      const result = Validator.getRules().Required({
        value: 'Hello',
        i18n,
        ruleParams: [],
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the value is not present', () => {
      const result = Validator.getRules().Required({
        value: '',
        i18n,
        ruleParams: [],
      });
      expect(result).toBe(i18n.t('validator.required'));
    });
  });

  describe('length', () => {
    it('should validate if the string length is within the specified range', () => {
      const result = Validator.getRules().Length({
        value: 'Hello',
        ruleParams: [3, 10],
        i18n,
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the string length is not within the specified range', () => {
      const result = Validator.getRules().Length({
        value: 'Hi',
        ruleParams: [3, 10],
        i18n,
      });
      expect(result).not.toBe(true);
    });
  });

  describe('email', () => {
    it('should validate if the value is a valid email', () => {
      const result = Validator.getRules().Email({
        value: 'test@example.com',
        i18n,
        ruleParams: [],
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the value is not a valid email', () => {
      const result = Validator.getRules().Email({
        value: 'invalid-email',
        i18n,
        ruleParams: [],
      });
      expect(result).not.toBe(true);
    });
  });

  describe('url', () => {
    it('should validate if the value is a valid URL', () => {
      const result = Validator.getRules().Url({
        value: 'https://example.com',
        i18n,
        ruleParams: [],
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the value is not a valid URL', () => {
      const result = Validator.getRules().Url({
        value: 'invalid-url',
        i18n,
        ruleParams: [],
      });
      expect(result).not.toBe(true);
    });
  });

  describe('minLength', () => {
    it('should validate if the string meets the minimum length requirement', () => {
      const result = Validator.getRules().MinLength({
        value: 'Hello',
        ruleParams: [3],
        i18n,
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the string does not meet the minimum length requirement', () => {
      const result = Validator.getRules().MinLength({
        value: 'Hi',
        ruleParams: [3],
        i18n,
      });
      expect(result).not.toBe(true);
    });
  });

  describe('maxLength', () => {
    it('should validate if the string does not exceed the maximum length', () => {
      const result = Validator.getRules().MaxLength({
        value: 'Hello',
        ruleParams: [10],
        i18n,
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the string exceeds the maximum length', () => {
      const result = Validator.getRules().MaxLength({
        value: 'Hello, World!',
        ruleParams: [10],
        i18n,
      });
      expect(result).not.toBe(true);
    });
  });

  describe('fileName', () => {
    it('should validate if the value is a valid file name', () => {
      const result = Validator.getRules().FileName({
        value: 'validFileName.txt',
        i18n,
        ruleParams: [],
      });
      expect(result).toBe(true);
    });

    it('should return an error message if the value is not a valid file name', () => {
      const result = Validator.getRules().FileName({
        value: 'invalid/file:name.txt',
        i18n,
        ruleParams: [],
      });
      expect(result).not.toBe(true);
    });
  });

  describe('Test valdidator rules with decorators', () => {
    class Entity {
      constructor(options?: Entity) {
        try {
          this.email = options?.email;
          this.id = options?.id;
          this.aString = options?.aString;
          this.name = options?.name;
          this.note = options?.note;
          this.url = options?.url;
        } catch (error) {
          //console.log(error, " instance of Entity");
        }
      }
      @IsNumber()
      @Translate('validator.tests.entity.id')
      @IsNumberNE(10)
      id?: number;

      @IsRequired()
      @IsNonNullString()
      @Translate('validator.tests.entity.name')
      name?: string;

      @Translate('validator.tests.entity.Email')
      @IsEmail()
      @IsRequired()
      email?: string;

      @Translate('validator.tests.entity.Url')
      @IsUrl()
      url?: string;

      @IsRequired()
      @IsNumberLT(10)
      @IsNumberGT(5)
      @Translate('validator.tests.entity.note')
      note?: number;

      @Translate('validator.tests.entity.aString')
      @IsRequired()
      @Length(10)
      @Length(5, 20)
      aString?: string;
    }

    const allRules = Validator.getTargetRules(Entity);
    console.log(allRules, ' are all rules heein');
    it('Getting validation rules', async () => {
      expect(allRules).toMatchObject({
        id: expect.arrayContaining(['Number', expect.any(Function)]),
        name: expect.arrayContaining(['Required', 'NonNullString']),
        email: expect.arrayContaining(['Email', 'Required']),
        url: ['Url'],
        note: expect.arrayContaining([
          'Required',
          expect.any(Function),
          expect.any(Function),
        ]),
        aString: expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          'Required',
        ]),
      });
    });
    it('Validate rules with decorators on entity', async () => {
      try {
        await Validator.validateTarget(Entity, {
          data: { id: 10, aString: '1234567890' },
        });
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error).toMatchObject({
          message: 'Validation failed for 4 fields',
        });
      }
    });
  });

  describe('Nullable Validation Rules', () => {
    describe('Empty Rule', () => {
      describe('Rule Function', () => {
        it('should always return true (Empty rule always passes)', () => {
          expect(
            Validator.getRules().Empty({ value: '', i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({ value: null, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({
              value: undefined,
              i18n,
              ruleParams: [],
            })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({ value: 'test', i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({ value: 123, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({ value: [], i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Empty({ value: {}, i18n, ruleParams: [] })
          ).toBe(true);
        });
      });

      describe('Validation Behavior', () => {
        it('should skip validation when value is empty string', async () => {
          const result = await Validator.validate({
            value: '',
            rules: ['Empty', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is not empty string', async () => {
          const result = await Validator.validate({
            value: null,
            rules: ['Empty', 'Required'],
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is undefined', async () => {
          const result = await Validator.validate({
            value: undefined,
            rules: ['Empty', 'Required'],
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is valid', async () => {
          const result = await Validator.validate({
            value: 'valid',
            rules: ['Empty', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is invalid', async () => {
          const result = await Validator.validate({
            value: 'not-empty',
            rules: ['Empty', 'Email'],
          });
          expect(result.success).toBe(false);
        });
      });

      describe('Decorator', () => {
        class TestEntity {
          @IsEmpty()
          @IsRequired()
          emptyField?: string;

          @IsEmpty()
          @IsEmail()
          optionalEmail?: string;
        }

        it('should register Empty rule in target rules', () => {
          const rules = Validator.getTargetRules(TestEntity);
          expect(rules.emptyField).toContain('Empty');
          expect(rules.optionalEmail).toContain('Empty');
        });

        it('should skip validation for empty string with decorator', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: { emptyField: '', optionalEmail: '' },
          });
          expect(result.data?.emptyField).toBe('');
          expect(result.data?.optionalEmail).toBe('');
        });

        it('should apply other rules when not empty string', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: { emptyField: null, optionalEmail: 'invalid-email' },
          });
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Nullable Rule', () => {
      describe('Rule Function', () => {
        it('should always return true (Nullable rule always passes)', () => {
          expect(
            Validator.getRules().Nullable({ value: null, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({
              value: undefined,
              i18n,
              ruleParams: [],
            })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({ value: '', i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({
              value: 'test',
              i18n,
              ruleParams: [],
            })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({ value: 123, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({ value: [], i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Nullable({ value: {}, i18n, ruleParams: [] })
          ).toBe(true);
        });
      });

      describe('Validation Behavior', () => {
        it('should skip validation when value is null', async () => {
          const result = await Validator.validate({
            value: null,
            rules: ['Nullable', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should skip validation when value is undefined', async () => {
          const result = await Validator.validate({
            value: undefined,
            rules: ['Nullable', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is empty string', async () => {
          const result = await Validator.validate({
            value: '',
            rules: ['Nullable', 'Required'],
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is valid', async () => {
          const result = await Validator.validate({
            value: 'valid',
            rules: ['Nullable', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is invalid', async () => {
          const result = await Validator.validate({
            value: 'invalid-email',
            rules: ['Nullable', 'Email'],
          });
          expect(result.success).toBe(false);
        });

        it('should skip validation for null even with strict rules', async () => {
          const result = await Validator.validate({
            value: null,
            rules: ['Nullable', 'NonNullString'],
          });
          expect(result.success).toBe(true);
        });

        it('should skip validation for undefined even with strict rules', async () => {
          const result = await Validator.validate({
            value: undefined,
            rules: ['Nullable', 'NonNullString'],
          });
          expect(result.success).toBe(true);
        });
      });

      describe('Decorator', () => {
        class TestEntity {
          @IsNullable()
          @IsRequired()
          nullableField?: string;

          @IsNullable()
          @IsEmail()
          optionalEmail?: string;

          @IsNullable()
          @IsNonNullString()
          strictString?: string;
        }

        it('should register Nullable rule in target rules', () => {
          const rules = Validator.getTargetRules(TestEntity);
          expect(rules.nullableField).toContain('Nullable');
          expect(rules.optionalEmail).toContain('Nullable');
          expect(rules.strictString).toContain('Nullable');
        });

        it('should skip validation for null with decorator', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              nullableField: null,
              optionalEmail: null,
              strictString: null,
            },
          });
          expect(result.data?.nullableField).toBe(null);
          expect(result.data?.optionalEmail).toBe(null);
          expect(result.data?.strictString).toBe(null);
        });

        it('should skip validation for undefined with decorator', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              nullableField: undefined,
              optionalEmail: undefined,
              strictString: undefined,
            },
          });
          expect(result.data?.nullableField).toBe(undefined);
          expect(result.data?.optionalEmail).toBe(undefined);
          expect(result.data?.strictString).toBe(undefined);
        });

        it('should apply other rules when value is empty string', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              nullableField: '',
              optionalEmail: 'invalid-email',
              strictString: '',
            },
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is valid', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              nullableField: 'valid',
              optionalEmail: 'test@example.com',
              strictString: 'non-empty',
            },
          });
          expect(result.data?.nullableField).toBe('valid');
          expect(result.data?.optionalEmail).toBe('test@example.com');
          expect(result.data?.strictString).toBe('non-empty');
        });
      });
    });

    describe('Optional Rule', () => {
      describe('Rule Function', () => {
        it('should always return true (Optional rule always passes)', () => {
          expect(
            Validator.getRules().Optional({
              value: undefined,
              i18n,
              ruleParams: [],
            })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({ value: null, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({ value: '', i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({
              value: 'test',
              i18n,
              ruleParams: [],
            })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({ value: 123, i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({ value: [], i18n, ruleParams: [] })
          ).toBe(true);
          expect(
            Validator.getRules().Optional({ value: {}, i18n, ruleParams: [] })
          ).toBe(true);
        });
      });

      describe('Validation Behavior', () => {
        it('should skip validation when value is undefined', async () => {
          const result = await Validator.validate({
            value: undefined,
            rules: ['Optional', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is null', async () => {
          const result = await Validator.validate({
            value: null,
            rules: ['Optional', 'Required'],
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is empty string', async () => {
          const result = await Validator.validate({
            value: '',
            rules: ['Optional', 'Required'],
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is valid', async () => {
          const result = await Validator.validate({
            value: 'valid',
            rules: ['Optional', 'Required'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply other rules when value is invalid', async () => {
          const result = await Validator.validate({
            value: 'invalid-email',
            rules: ['Optional', 'Email'],
          });
          expect(result.success).toBe(false);
        });

        it('should skip validation for undefined even with strict rules', async () => {
          const result = await Validator.validate({
            value: undefined,
            rules: ['Optional', 'NonNullString'],
          });
          expect(result.success).toBe(true);
        });

        it('should apply validation for null with strict rules', async () => {
          const result = await Validator.validate({
            value: null,
            rules: ['Optional', 'NonNullString'],
          });
          expect(result.success).toBe(false);
        });
      });

      describe('Decorator', () => {
        class TestEntity {
          @IsOptional()
          @IsRequired()
          sometimesField?: string;

          @IsOptional()
          @IsEmail()
          optionalEmail?: string;

          @IsOptional()
          @IsNonNullString()
          strictString?: string;
        }

        it('should register Optional rule in target rules', () => {
          const rules = Validator.getTargetRules(TestEntity);
          expect(rules.sometimesField).toContain('Optional');
          expect(rules.optionalEmail).toContain('Optional');
          expect(rules.strictString).toContain('Optional');
        });

        it('should skip validation for undefined with decorator', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              sometimesField: undefined,
              optionalEmail: undefined,
              strictString: undefined,
            },
          });
          expect(result.data?.sometimesField).toBe(undefined);
          expect(result.data?.optionalEmail).toBe(undefined);
          expect(result.data?.strictString).toBe(undefined);
        });

        it('should skip validation when field is absent from data', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {},
          });
          expect(result.data).toEqual({});
        });

        it('should apply other rules when value is null', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              sometimesField: null,
              optionalEmail: 'invalid-email',
              strictString: null,
            },
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is empty string', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              sometimesField: '',
              optionalEmail: 'invalid-email',
              strictString: '',
            },
          });
          expect(result.success).toBe(false);
        });

        it('should apply other rules when value is valid', async () => {
          const result = await Validator.validateTarget(TestEntity, {
            data: {
              sometimesField: 'valid',
              optionalEmail: 'test@example.com',
              strictString: 'non-empty',
            },
          });
          expect(result.data?.sometimesField).toBe('valid');
          expect(result.data?.optionalEmail).toBe('test@example.com');
          expect(result.data?.strictString).toBe('non-empty');
        });
      });
    });

    describe('Rule Combinations', () => {
      it('should handle multiple nullable rules (Empty takes precedence)', async () => {
        const result = await Validator.validate({
          value: '',
          rules: ['Empty', 'Nullable', 'Optional', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle multiple nullable rules (Nullable takes precedence over Optional)', async () => {
        const result = await Validator.validate({
          value: null,
          rules: ['Nullable', 'Optional', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle Optional rule when value is undefined', async () => {
        const result = await Validator.validate({
          value: undefined,
          rules: ['Optional', 'Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should apply validation when no nullable conditions are met', async () => {
        const result = await Validator.validate({
          value: 'invalid',
          rules: ['Empty', 'Nullable', 'Optional', 'Email'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero as valid value (not skipped)', async () => {
        const result = await Validator.validate({
          value: 0,
          rules: ['Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle false as valid value (not skipped)', async () => {
        const result = await Validator.validate({
          value: false,
          rules: ['Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle empty array as valid value (not skipped)', async () => {
        const result = await Validator.validate({
          value: [],
          rules: ['Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle empty object as valid value (not skipped)', async () => {
        const result = await Validator.validate({
          value: {},
          rules: ['Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle NaN as valid value (not skipped)', async () => {
        const result = await Validator.validate({
          value: NaN,
          rules: ['Nullable', 'Required'],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Integration with validateTarget', () => {
      class ComprehensiveEntity {
        @IsRequired()
        @IsEmail()
        requiredEmail: string = '';

        @IsEmpty()
        @IsEmail()
        emptyEmail?: string;

        @IsNullable()
        @IsEmail()
        nullableEmail?: string;

        @IsOptional()
        @IsEmail()
        sometimesEmail?: string;

        @IsEmpty()
        @IsRequired()
        emptyRequired?: string;

        @IsNullable()
        @IsRequired()
        nullableRequired?: string;

        @IsOptional()
        @IsRequired()
        sometimesRequired?: string;
      }

      it('should validate complex entity with all nullable rules', async () => {
        const validData = {
          requiredEmail: 'test@example.com',
          emptyEmail: '',
          nullableEmail: null,
          sometimesEmail: undefined,
          emptyRequired: '',
          nullableRequired: null,
          sometimesRequired: undefined,
        };

        const result = await Validator.validateTarget(ComprehensiveEntity, {
          data: validData,
        });
        expect(result.data).toEqual(validData);
      });

      it('should fail when required fields are missing', async () => {
        const result = await Validator.validateTarget(ComprehensiveEntity, {
          data: {
            emptyEmail: '',
            nullableEmail: null,
            sometimesEmail: undefined,
            emptyRequired: '',
            nullableRequired: null,
            sometimesRequired: undefined,
          },
        });
        expect(result.success).toBe(false);
      });

      it('should fail when nullable fields have invalid values', async () => {
        const result = await Validator.validateTarget(ComprehensiveEntity, {
          data: {
            requiredEmail: 'test@example.com',
            emptyEmail: 'invalid-email',
            nullableEmail: 'invalid-email',
            sometimesEmail: 'invalid-email',
            emptyRequired: '',
            nullableRequired: null,
            sometimesRequired: undefined,
          },
        });
        expect(result.success).toBe(false);
      });

      it('should skip Optional fields when absent from data', async () => {
        const result = await Validator.validateTarget(ComprehensiveEntity, {
          data: {
            requiredEmail: 'test@example.com',
            emptyRequired: '',
            nullableRequired: null,
            // sometimesEmail and sometimesRequired are absent
          },
        });
        expect(result.data?.requiredEmail).toBe('test@example.com');
        expect(result.data?.emptyRequired).toBe('');
        expect(result.data?.nullableRequired).toBe(null);
      });
    });
  });
});
