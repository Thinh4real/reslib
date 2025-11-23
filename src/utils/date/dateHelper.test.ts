import { DateHelper } from './index';
describe('DateHelper.parseString', () => {
  // Helper function to create a date with time set to midnight
  const createDate = (year: number, month: number, day: number, hours?: number, minutes?: number, seconds?: number): Date => {
    const d = new Date(year, month - 1, day);
    d.setHours(typeof hours === "number" ? hours : 0);
    d.setMinutes(typeof minutes === "number" ? minutes : 0);
    d.setSeconds(typeof seconds === "number" ? seconds : 0);
    d.setMilliseconds(0);
    return d;
  };

  describe('ISO format parsing', () => {
    test('parses YYYY-MM-DD format', () => {
      const result = DateHelper.parseString('2024-02-20');
      expect(result.isValid).toBe(true);
      expect(result.date).toEqual(createDate(2024, 2, 20));
      expect(result.matchedFormat).toBe('YYYY-MM-DD');
    });

    test('parses YYYY-MM-DDTHH:mm:ss format', () => {
      const result = DateHelper.parseString('2024-02-20T15:30:45');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('YYYY-MM-DDTHH:mm:ss');
    });

    test('parses YYYY-MM-DDTHH:mm:ssZ format', () => {
      const result = DateHelper.parseString('2024-02-20T15:30:45Z');
      expect(result.isValid).toBe(true);
      //expect(result.matchedFormat).toBe('YYYY-MM-DDTHH:mm:ssZ');
    });

    test('parses YYYY-MM-DDTHH:mm:ss.SSSZ format', () => {
      const result = DateHelper.parseString('2024-02-20T15:30:45.123Z');
      expect(result.isValid).toBe(true);
      //expect(result.matchedFormat).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');
    });
  });

  describe('US format parsing', () => {
    test('parses MM/DD/YYYY format', () => {
      const result = DateHelper.parseString('02/20/2024');
      expect(result.isValid).toBe(true);
      expect(result.date).toEqual(createDate(2024, 2, 20));
      expect(result.matchedFormat).toBe('MM/DD/YYYY');
    });

    test('parses MM-DD-YYYY format', () => {
      const result = DateHelper.parseString('02-20-2024');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('MM-DD-YYYY');
    });

    test('parses MMMM DD, YYYY format', () => {
      const result = DateHelper.parseString('February 20, 2024');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('MMMM DD, YYYY');
    });

    test('parses MMM DD, YYYY format', () => {
      const result = DateHelper.parseString('Feb 20, 2024');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('MMM DD, YYYY');
    });
  });

  describe('European format parsing', () => {
    test('parses DD/MM/YYYY format', () => {
      const result = DateHelper.parseString('20/02/2024');
      expect(result.isValid).toBe(true);
      expect(result.date).toEqual(createDate(2024, 2, 20));
      expect(result.matchedFormat).toBe('DD/MM/YYYY');
    });

    test('parses DD-MM-YYYY format', () => {
      const result = DateHelper.parseString('20-02-2024');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('DD-MM-YYYY');
    });

    test('parses DD MMMM YYYY format', () => {
      const result = DateHelper.parseString('20 February 2024');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('DD MMMM YYYY');
    });
  });

  describe('Time format parsing', () => {
    test('parses HH:mm:ss format', () => {
      const result = DateHelper.parseString('15:30:45');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('HH:mm:ss');
    });

    test('parses HH:mm format', () => {
      const result = DateHelper.parseString('15:30');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('HH:mm');
    });

    test('parses hh:mm A format', () => {
      const result = DateHelper.parseString('03:30 PM');
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('hh:mm A');
    });
  });

  describe('Relative format parsing', () => {
    test('parses YYYY-DDD format', () => {
      const result = DateHelper.parseString('2024-051', "YYYY-DDD"); // February 20, 2024
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('YYYY-DDD');
    });

    test('parses YYYY-Www format', () => {
      const result = DateHelper.parseString('2024-W08'); // Week 8 of 2024
      expect(result.isValid).toBe(true);
      //expect(result.matchedFormat).toBe('YYYY-Www');
    });
  });

  describe('Preferred formats', () => {
    test('uses preferred format when provided and valid', () => {
      const result = DateHelper.parseString('20.02.2024', ['DD.MM.YYYY']);
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('DD.MM.YYYY');
    });

    test('falls back to standard formats when preferred format fails', () => {
      const result = DateHelper.parseString('2024-02-20', ['DD.MM.YYYY']);
      expect(result.isValid).toBe(true);
      expect(result.matchedFormat).toBe('YYYY-MM-DD');
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles invalid date strings', () => {
      const result = DateHelper.parseString('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.date).toBeNull();
      expect(result.matchedFormat).toBeNull();
    });

    test('handles empty string', () => {
      const result = DateHelper.parseString('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles null input', () => {
      const result = DateHelper.parseString(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles undefined input', () => {
      const result = DateHelper.parseString(undefined as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles dates with invalid day of month', () => {
      const result = DateHelper.parseString('2024-02-30'); // February 30th doesn't exist
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles leap year dates correctly', () => {
      const result = DateHelper.parseString('2024-02-28'); // 2024 is a leap year
      expect(result.isValid).toBe(true);
      expect(result.date).toEqual(createDate(2024, 2, 28));
    });
  });

  describe('Boundary conditions', () => {
    test('handles dates at year boundaries', () => {
      const result1 = DateHelper.parseString('2024-01-01');
      expect(result1.isValid).toBe(true);
      expect(result1.date).toEqual(createDate(2024, 1, 1));

      const result2 = DateHelper.parseString('2024-12-31');
      expect(result2.isValid).toBe(true);
      expect(result2.date).toEqual(createDate(2024, 12, 31));
    });

    test('handles minimum and maximum dates', () => {
      const result1 = DateHelper.parseString('0000-01-01');
      expect(result1.isValid).toBe(true);

      const result2 = DateHelper.parseString('9999-12-31');
      expect(result2.isValid).toBe(true);
    });
  });
});