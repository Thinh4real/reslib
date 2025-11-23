import { _abreviateNumber, IAbreviateNumberResult } from '../numbers';

describe('_abreviateNumber function', () => {
    // Basic functionality tests
    describe('Basic functionality', () => {
        test('should return an empty string for null when returnObject is false', () => {
            // @ts-ignore: Deliberately passing null for testing
            expect(_abreviateNumber(null).result).toBe("");
        });

        test('should return an empty object for null when returnObject is true', () => {
            // @ts-ignore: Deliberately passing null for testing
            expect(_abreviateNumber(null)).toMatchObject({
                format: ""
            });
        });

        test('should handle zero correctly', () => {
            expect(_abreviateNumber(0).result).toBe("0");

            const result = _abreviateNumber(0) as IAbreviateNumberResult;
            expect(result).toEqual({
                result: "0",
                value: 0,
                format: '',
                suffix: '',
                formattedValue: "0",
                minAbreviationDecimalDigits: 0
            });
        });

        test('should handle non-number inputs', () => {
            // @ts-ignore: Deliberately passing non-number for testing
            expect(_abreviateNumber("not a number").result).toBe("");

            // @ts-ignore: Deliberately passing non-number for testing
            //expect(_abreviateNumber("not a number")).toMatchObject({ formatedValue: "", result: "" });
        });
    });

    // Infinity handling tests
    describe('Infinity handling', () => {
        test('should handle positive infinity', () => {
            expect(_abreviateNumber(Infinity).result).toBe("∞");

            const result = _abreviateNumber(Infinity) as IAbreviateNumberResult;
            expect(result).toEqual({
                result: "∞",
                value: Infinity,
                format: '',
                suffix: '',
                formattedValue: "∞",
                minAbreviationDecimalDigits: 0
            });
        });

        test('should handle negative infinity', () => {
            expect(_abreviateNumber(-Infinity).result).toBe("-∞");

            const result = _abreviateNumber(-Infinity) as IAbreviateNumberResult;
            expect(result).toEqual({
                result: "-∞",
                value: -Infinity,
                format: '',
                suffix: '',
                formattedValue: "-∞",
                minAbreviationDecimalDigits: 0
            });
        });
    });

    // NaN handling tests
    describe('NaN handling', () => {
        test('should handle NaN values', () => {
            expect(_abreviateNumber(NaN).result).toBe("");

            expect(_abreviateNumber(NaN)).toMatchObject({
                format: ""
            });
        });
    });

    // Decimal precision tests
    describe('Decimal precision handling', () => {
        test('should handle numbers with different decimal places', () => {
            expect(_abreviateNumber(1.23456).result).toBe("1.23456");

            const result1 = _abreviateNumber(1.23456) as IAbreviateNumberResult;
            expect(result1.result).toBe("1.23456");
            expect(result1.minAbreviationDecimalDigits).toBe(5);

            const result2 = _abreviateNumber(1.2) as IAbreviateNumberResult;
            expect(result2.result).toBe("1.2");
            expect(result2.minAbreviationDecimalDigits).toBe(1);
        });

        test('should remove trailing zeros in formatted output', () => {
            expect(_abreviateNumber(1.2000).result).toBe("1.2");
            expect(_abreviateNumber(5.0).result).toBe("5");
        });
    });

    // Return type tests
    describe('Return type handling', () => {
        test('should return a string when returnObject is false', () => {
            const result = _abreviateNumber(1000).result;
            expect(typeof result).toBe('string');
        });

        test('should return an object when returnObject is true', () => {
            const result = _abreviateNumber(1000) as IAbreviateNumberResult;
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('result');
            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('format');
            expect(result).toHaveProperty('suffix');
            expect(result).toHaveProperty('formattedValue');
            expect(result).toHaveProperty('minAbreviationDecimalDigits');
        });
    });

    // Abbreviation functionality tests
    describe('Abbreviation functionality', () => {
        test('should not abbreviate small numbers under 1000', () => {
            expect(_abreviateNumber(999).result).toBe("999");
            expect(_abreviateNumber(0.5).result).toBe("0.5");
            expect(_abreviateNumber(100).result).toBe("100");
        });

        test('should abbreviate thousands with K', () => {
            expect(_abreviateNumber(1000).result).toBe("1K");
            expect(_abreviateNumber(1500).result).toBe("1.5K");
            expect(_abreviateNumber(9999).result).toBe("9.999K");

            const result = _abreviateNumber(1234) as IAbreviateNumberResult;
            expect(result.formattedValue).toBe("1.234");
            expect(result.suffix).toBe("K");
            expect(result.result).toBe("1.234K");
        });

        test('should abbreviate millions with M', () => {
            expect(_abreviateNumber(1000000).result).toBe("1M");
            expect(_abreviateNumber(1500000).result).toBe("1.5M");
            expect(_abreviateNumber(999500000).result).toBe("999.5M");

            const result = _abreviateNumber(1234567) as IAbreviateNumberResult;
            expect(result.result).toBe("1.23457M");
            expect(result.suffix).toBe("M");
        });

        test('should abbreviate billions with B', () => {
            expect(_abreviateNumber(1000000000).result).toBe("1B");
            expect(_abreviateNumber(1500000000).result).toBe("1.5B");

            const result = _abreviateNumber(1234567890) as IAbreviateNumberResult;
            expect(result.result).toBe("1.23457B");
            expect(result.suffix).toBe("B");
        });

        test('should abbreviate trillions with T', () => {
            expect(_abreviateNumber(1000000000000).result).toBe("1T");
            expect(_abreviateNumber(1500000000000).result).toBe("1.5T");

            const result = _abreviateNumber(1234567890123) as IAbreviateNumberResult;
            expect(result.result).toBe("1.23457T");
            expect(result.suffix).toBe("T");
        });
    });

    // minAbreviationDecimalDigits tests
    describe('minAbreviationDecimalDigits property', () => {
        test('should calculate minimum decimal digits for K abbreviation', () => {
            const result1 = _abreviateNumber(1000) as IAbreviateNumberResult;
            expect(result1.minAbreviationDecimalDigits).toBe(0);

            const result2 = _abreviateNumber(1234) as IAbreviateNumberResult;
            expect(result2.minAbreviationDecimalDigits).toBe(3);

            const result3 = _abreviateNumber(1500) as IAbreviateNumberResult;
            expect(result3.minAbreviationDecimalDigits).toBe(1);
        });

        test('should calculate minimum decimal digits for M abbreviation', () => {
            const result1 = _abreviateNumber(1000000) as IAbreviateNumberResult;
            expect(result1.minAbreviationDecimalDigits).toBe(0);

            const result2 = _abreviateNumber(1234567) as IAbreviateNumberResult;
            expect(result2.minAbreviationDecimalDigits).toBe(5);

            const result3 = _abreviateNumber(1200000) as IAbreviateNumberResult;
            expect(result3.minAbreviationDecimalDigits).toBe(1);
        });

        test('should calculate minimum decimal digits for B abbreviation', () => {
            const result1 = _abreviateNumber(1000000000) as IAbreviateNumberResult;
            expect(result1.minAbreviationDecimalDigits).toBe(0);

            const result2 = _abreviateNumber(1234567890) as IAbreviateNumberResult;
            expect(result2.minAbreviationDecimalDigits).toBe(5);
        });

        test('should calculate minimum decimal digits for T abbreviation', () => {
            const result1 = _abreviateNumber(1000000000000) as IAbreviateNumberResult;
            expect(result1.minAbreviationDecimalDigits).toBe(0);

            const result2 = _abreviateNumber(1234567890123) as IAbreviateNumberResult;
            expect(result2.minAbreviationDecimalDigits).toBe(5);
        });

        test('should cap minimum decimal digits at 5', () => {
            const result = _abreviateNumber(1000123456789) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(5); // Not 9, because we cap at 5
        });
    });

    // Edge case tests
    describe('Edge cases', () => {
        test('should handle negative numbers', () => {
            expect(_abreviateNumber(-1000).result).toBe("-1K");
            expect(_abreviateNumber(-1500000).result).toBe("-1.5M");

            const result = _abreviateNumber(-1234) as IAbreviateNumberResult;
            expect(result.result).toBe("-1.234K");
            expect(result.value).toBe(-1234);
            expect(result.minAbreviationDecimalDigits).toBe(3);
        });

        test('should handle very large numbers', () => {
            // JavaScript's max safe integer is 9007199254740991
            expect(_abreviateNumber(9007199254740991, undefined, ' ').result).toBe("9 007.19925T");
        });

        test('should handle very small decimals', () => {
            expect(_abreviateNumber(0.0000001).result).toBe("0");

            const result = _abreviateNumber(0.0000001) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(0); // Capped at 5
        });

        test('should handle numbers at the threshold boundaries', () => {
            expect(_abreviateNumber(999).result).toBe("999");
            expect(_abreviateNumber(1000).result).toBe("1K");
            expect(_abreviateNumber(999999).result).toBe("999.999K");
            expect(_abreviateNumber(1000000).result).toBe("1M");
        });
    });

    describe('minAbreviationDecimalDigits property tests', () => {
        test('should calculate correct decimal digits for 1500', () => {
            const result = _abreviateNumber(1500) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(1);
            expect(result.result).toBe("1.5K");
        });

        test('should calculate correct decimal digits for 1000', () => {
            const result = _abreviateNumber(1000) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(0);
            expect(result.result).toBe("1K");
        });

        test('should calculate correct decimal digits for 1234', () => {
            const result = _abreviateNumber(1234) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(3);
            expect(result.result).toBe("1.234K");
        });

        test('should calculate correct decimal digits for 1230', () => {
            const result = _abreviateNumber(1230) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(2);
            expect(result.result).toBe("1.23K");
        });

        test('should calculate correct decimal digits for 1200', () => {
            const result = _abreviateNumber(1200) as IAbreviateNumberResult;
            expect(result.minAbreviationDecimalDigits).toBe(1);
            expect(result.result).toBe("1.2K");
        });
    });
});