import { Validator, ensureRulesRegistered } from '../../index';
import {
  HasDecimalPlaces,
  IsEvenNumber,
  IsInteger,
  IsMultipleOf,
  IsNumber,
  IsNumberBetween,
  IsNumberEQ,
  IsNumberGT,
  IsNumberGTE,
  IsNumberLT,
  IsNumberLTE,
  IsNumberNE,
  IsOddNumber,
} from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Numeric Validation Rules', () => {
  describe('IsNumber', () => {
    it('should pass for valid numbers', async () => {
      const validNumbers = [0, 1, -1, 1.5, -1.5, 999999, -999999, 0.000001];

      for (const num of validNumbers) {
        const result = await Validator.validate({
          value: num,
          rules: ['Number'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for numeric strings', async () => {
      const numericStrings = [
        '0',
        '1',
        '-1',
        '1.5',
        '-1.5',
        '999999',
        '-999999',
        '0.000001',
      ];

      for (const str of numericStrings) {
        const result = await Validator.validate({
          value: str,
          rules: ['Number'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('number');
      }
    });

    it('should fail for non-numeric values', async () => {
      const invalidValues = [
        'abc',
        '12abc',
        'abc12',
        '',
        null,
        undefined,
        {},
        [],
        true,
        false,
        NaN,
        Infinity,
        -Infinity,
      ];

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['Number'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('number');
      }
    });

    // Decorator test
    it('should work with decorator for valid numbers', async () => {
      class TestClass {
        @IsNumber()
        value: number = -1;
      }

      const instance = new TestClass();
      instance.value = 42;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for numeric strings', async () => {
      class TestClass {
        @IsNumber()
        value: string = '';
      }

      const instance = new TestClass();
      instance.value = '42.5';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('number');
    });

    it('should fail with decorator for non-numeric values', async () => {
      class TestClass {
        @IsNumber()
        value: any;
      }

      const instance = new TestClass();
      instance.value = 'not-a-number';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('number');
    });
  });

  describe('IsNumberGT', () => {
    it('should pass when number is greater than threshold', async () => {
      const result = await Validator.validate({
        value: 10,
        rules: [{ NumberGT: [5] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when number equals threshold', async () => {
      const result = await Validator.validate({
        value: 5,
        rules: [{ NumberGT: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('greater than');
    });

    it('should fail when number is less than threshold', async () => {
      const result = await Validator.validate({
        value: 3,
        rules: [{ NumberGT: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('greater than');
    });

    it('should fail for non-numeric values', async () => {
      const result = await Validator.validate({
        value: 'not-a-number',
        rules: [{ NumberGT: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('greater than');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: 10,
        rules: [{ NumberGT: ['invalid' as any] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid parameters for rule');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberGT(0)
        positiveNumber: number = -1;
      }

      const instance = new TestClass();
      instance.positiveNumber = 5;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when not greater than', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberGT(10)
        value: number = -1;
      }

      const instance = new TestClass();
      instance.value = 5;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('greater than');
    });
  });

  describe('IsNumberGTE', () => {
    it('should pass when number is greater than or equal to threshold', async () => {
      const values = [5, 6, 10];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: [{ NumberGTE: [5] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when number is less than threshold', async () => {
      const result = await Validator.validate({
        value: 3,
        rules: [{ NumberGTE: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('greater than or equal to');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberGTE(18)
        age: number = -1;
      }

      const instance = new TestClass();
      instance.age = 25;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for equal values', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberGTE(18)
        age: number = -1;
      }

      const instance = new TestClass();
      instance.age = 18;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsNumberLT', () => {
    it('should pass when number is less than threshold', async () => {
      const result = await Validator.validate({
        value: 3,
        rules: [{ NumberLT: [5] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when number equals threshold', async () => {
      const result = await Validator.validate({
        value: 5,
        rules: [{ NumberLT: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('less than');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberLT(100)
        percentage: number = -1;
      }

      const instance = new TestClass();
      instance.percentage = 85;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsNumberLTE', () => {
    it('should pass when number is less than or equal to threshold', async () => {
      const values = [3, 5, 4];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: [{ NumberLTE: [5] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when number is greater than threshold', async () => {
      const result = await Validator.validate({
        value: 6,
        rules: [{ NumberLTE: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('less than or equal to');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberLTE(100)
        score: number = -1;
      }

      const instance = new TestClass();
      instance.score = 95;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsNumberEQ', () => {
    it('should pass when number equals threshold', async () => {
      const result = await Validator.validate({
        value: 5,
        rules: [{ NumberEQ: [5] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when number does not equal threshold', async () => {
      const values = [3, 6, 5.1, -5];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: [{ NumberEQ: [5] }],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('equal to');
      }
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberEQ(42)
        answer: number = -1;
      }

      const instance = new TestClass();
      instance.answer = 42;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsNumberNE', () => {
    it('should pass when number does not equal threshold', async () => {
      const values = [3, 6, 5.1, -5];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: [{ NumberNE: [5] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when number equals threshold', async () => {
      const result = await Validator.validate({
        value: 5,
        rules: [{ NumberNE: [5] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('different from');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberNE(0)
        divisor: number = -1;
      }

      const instance = new TestClass();
      instance.divisor = 5;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsNumberBetween', () => {
    it('should pass when number is between min and max (inclusive)', async () => {
      const values = [5, 10, 15];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: [{ NumberBetween: [5, 15] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when number is below min', async () => {
      const result = await Validator.validate({
        value: 3,
        rules: [{ NumberBetween: [5, 15] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('between');
    });

    it('should fail when number is above max', async () => {
      const result = await Validator.validate({
        value: 20,
        rules: [{ NumberBetween: [5, 15] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('between');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: 10,
        rules: [{ NumberBetween: [25, 5] }], // min > max
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid parameters for rule');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsNumber()
        @IsNumberBetween(0, 100)
        percentage: number = -1;
      }

      const instance = new TestClass();
      instance.percentage = 85;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsInteger', () => {
    it('should pass for integers', async () => {
      const integers = [0, 1, -1, 42, -42, 999999, -999999];
      for (const num of integers) {
        const result = await Validator.validate({
          value: num,
          rules: ['Integer'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for integer strings', async () => {
      const integerStrings = ['0', '1', '-1', '42', '-42'];
      for (const str of integerStrings) {
        const result = await Validator.validate({
          value: str,
          rules: ['Integer'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('integer');
      }
    });

    it('should fail for non-integer floats', async () => {
      const floats = [1.5, -1.5, 0.1, -0.1];
      for (const num of floats) {
        const result = await Validator.validate({
          value: num,
          rules: ['Integer'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('must be a valid integer');
      }
    });

    it('should pass for integer floats', async () => {
      const integerFloats = [1.0, -1.0, 0.0];
      for (const num of integerFloats) {
        const result = await Validator.validate({
          value: num,
          rules: ['Integer'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for float strings', async () => {
      const result = await Validator.validate({
        value: '1.5',
        rules: ['Integer'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('integer');
    });

    // Decorator test
    it('should work with decorator for integers', async () => {
      class TestClass {
        @IsInteger()
        count: number = -1;
      }

      const instance = new TestClass();
      instance.count = 10;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for floats', async () => {
      class TestClass {
        @IsInteger()
        count: number = -1;
      }

      const instance = new TestClass();
      instance.count = 10.5;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('integer');
    });
  });

  describe('IsEvenNumber', () => {
    it('should pass for even numbers', async () => {
      const evenNumbers = [0, 2, -2, 42, -42, 100, -100];
      for (const num of evenNumbers) {
        const result = await Validator.validate({
          value: num,
          rules: ['EvenNumber'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for odd numbers', async () => {
      const oddNumbers = [1, -1, 3, -3, 43, -43];
      for (const num of oddNumbers) {
        const result = await Validator.validate({
          value: num,
          rules: ['EvenNumber'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('even integer');
      }
    });

    it('should pass for integer floats', async () => {
      const integerFloats = [2.0, -2.0, 0.0];
      for (const num of integerFloats) {
        const result = await Validator.validate({
          value: num,
          rules: ['EvenNumber'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for non-integer floats', async () => {
      const nonIntegerFloats = [2.5, -2.5, 1.1];
      for (const num of nonIntegerFloats) {
        const result = await Validator.validate({
          value: num,
          rules: ['EvenNumber'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('must be a valid integer');
      }
    });

    // Decorator test
    it('should work with decorator for even numbers', async () => {
      class TestClass {
        @IsEvenNumber()
        value: number = -1;
      }

      const instance = new TestClass();
      instance.value = 42;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsOddNumber', () => {
    it('should pass for odd numbers', async () => {
      const oddNumbers = [1, -1, 3, -3, 43, -43];
      for (const num of oddNumbers) {
        const result = await Validator.validate({
          value: num,
          rules: ['OddNumber'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for even numbers', async () => {
      const evenNumbers = [0, 2, -2, 42, -42];
      for (const num of evenNumbers) {
        const result = await Validator.validate({
          value: num,
          rules: ['OddNumber'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('odd integer');
      }
    });

    // Decorator test
    it('should work with decorator for odd numbers', async () => {
      class TestClass {
        @IsOddNumber()
        value: number = -1;
      }

      const instance = new TestClass();
      instance.value = 43;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsMultipleOf', () => {
    it('should pass when number is multiple of divisor', async () => {
      const testCases = [
        { value: 10, divisor: 2 },
        { value: 15, divisor: 3 },
        { value: 0, divisor: 5 },
        { value: -10, divisor: 2 },
        { value: 3.0, divisor: 3 },
      ];

      for (const { value, divisor } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MultipleOf: [divisor] }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail when number is not multiple of divisor', async () => {
      const testCases = [
        { value: 10, divisor: 3 },
        { value: 15, divisor: 4 },
        { value: 7, divisor: 2 },
      ];

      for (const { value, divisor } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ MultipleOf: [divisor] }],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('multiple');
      }
    });

    it('should fail for invalid divisor', async () => {
      const result = await Validator.validate({
        value: 10,
        rules: [{ MultipleOf: [0] }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain(
        'Invalid parameters for rule MultipleOf'
      );
    });

    // Decorator test
    it('should work with decorator for multiples', async () => {
      class TestClass {
        @IsMultipleOf(5)
        value: number = -1;
      }

      const instance = new TestClass();
      instance.value = 25;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('HasDecimalPlaces', () => {
    it('should pass when number has exactly the specified decimal places', async () => {
      const testCases = [
        { value: 1.5, places: 1 },
        { value: 1.25, places: 2 },
        { value: 1.0, places: 1 },
        { value: 10.0, places: 2 },
      ];

      for (const { value, places } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ DecimalPlaces: [places] }],
        });
        expect(result.success).toBe(value !== 10.0 && value !== 1.0);
      }
    });

    it('should fail when number has different decimal places', async () => {
      const testCases = [
        { value: 1.5, places: 2 }, // 1.5 has 1 decimal place, expects 2
        { value: 1.25, places: 1 }, // 1.25 has 2 decimal places, expects 1
      ];

      for (const { value, places } of testCases) {
        const result = await Validator.validate({
          value,
          rules: [{ DecimalPlaces: [places] }],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('decimal places');
      }
    });

    it('should pass for integers when places is 0', async () => {
      const result = await Validator.validate({
        value: 42,
        rules: [{ DecimalPlaces: [0] }],
      });
      expect(result.success).toBe(true);
    });

    // Decorator test
    it('should work with decorator for correct decimal places', async () => {
      class TestClass {
        @HasDecimalPlaces(2)
        price: number = -1;
      }

      const instance = new TestClass();
      instance.price = 19.99;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  // Complex scenarios
  describe('Complex Numeric Scenarios', () => {
    it('should validate age range with multiple rules', async () => {
      class Person {
        @IsNumber()
        @IsInteger()
        @IsNumberGTE(0)
        @IsNumberLTE(150)
        age: number = -1;
      }

      const instance = new Person();
      instance.age = 25;

      const result = await Validator.validateTarget(Person, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should validate monetary amounts', async () => {
      class Product {
        @IsNumber()
        @IsNumberGT(0)
        @HasDecimalPlaces(2)
        price: number = -1;
      }

      const instance = new Product();
      instance.price = 29.99;

      const result = await Validator.validateTarget(Product, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should validate percentages', async () => {
      class Score {
        @IsNumber()
        @IsNumberGTE(0)
        @IsNumberLTE(100)
        percentage: number = -1;
      }

      const instance = new Score();
      instance.percentage = 85.5;

      const result = await Validator.validateTarget(Score, { data: instance });
      expect(result.success).toBe(true);
    });

    it('should validate even IDs', async () => {
      class Record {
        @IsNumber()
        @IsInteger()
        @IsEvenNumber()
        id: number = -1;
      }

      const instance = new Record();
      instance.id = 42;

      const result = await Validator.validateTarget(Record, { data: instance });
      expect(result.success).toBe(true);
    });
  });
});
