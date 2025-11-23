import { InputFormatter } from "./index";
import "../utils/index";
describe("InputFormatter", () => {
  describe("formatValue", () => {
    it("should format a decimal value", () => {
      const options = {
        value: "123.45",
        type: "decimal",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("123.45");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("123.45");
      expect(result.parsedValue).toBe(123.45);
      expect(result.decimalValue).toBe(123.45);
    });
    test("test abreviateNumber", () => {
      expect(
        InputFormatter.formatValue({
          value: 123456789,
          type: "number",
          abreviateNumber: true,
        }).formattedValue
      ).toBe("123.45679M");
      expect(
        InputFormatter.formatValue({
          value: 12345,
          type: "number",
          abreviateNumber: true,
          format: "formatCAD",
        }).formattedValue
      ).toBe("CA$ 12.35K");

      expect(
        InputFormatter.formatValue({
          value: 12345,
          abreviateNumber: true,
          type: "number",
          format: "formatXAF",
        }).formattedValue
      ).toBe("12.345K FCFA");
    });
    it("should format a numeric value", () => {
      const options = {
        value: "123",
        type: "numeric",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("123");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("123");
      expect(result.parsedValue).toBe(123);
      expect(result.decimalValue).toBe(123);
    });

    it("should format a number value", () => {
      const options = {
        value: "123",
        type: "number",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("123");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("123");
      expect(result.parsedValue).toBe(123);
      expect(result.decimalValue).toBe(123);
    });

    it("should format a date value", () => {
      const options = {
        value: new Date("2022-01-01"),
        type: "date",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("2022-01-01");
      expect(result.isDecimalType).toBe(false);
      expect(result.value).toBeInstanceOf(Date);
      expect(result.parsedValue).toBeInstanceOf(Date);
      expect(result.decimalValue).toBe(0);
    });

    it("should format a time value", () => {
      const options = {
        value: new Date("2022-01-01T12:00:00"),
        type: "time",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("12:00");
      expect(result.isDecimalType).toBe(false);
      expect(result.value).toBeInstanceOf(Date);
      expect(result.parsedValue).toBeInstanceOf(Date);
      expect(result.decimalValue).toBe(0);
    });

    it("should format a datetime value", () => {
      const options = {
        value: new Date("2022-01-01T12:00:00"),
        type: "datetime",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("2022-01-01 12:00");
      expect(result.isDecimalType).toBe(false);
      expect(result.value).toBeInstanceOf(Date);
      expect(result.parsedValue).toBeInstanceOf(Date);
      expect(result.decimalValue).toBe(0);
    });

    it("should format a value with a custom format function", () => {
      const options = {
        value: "123",
        type: "custom",
        format: (opts: { value: string }) => `${opts.value} formatted`,
      };
      const result = InputFormatter.formatValue(options as any);
      expect(result.formattedValue).toBe("123 formatted");
      expect(result.isDecimalType).toBe(false);
      expect(result.value).toBe("123");
      expect(result.parsedValue).toBe("123");
      expect(result.decimalValue).toBe(0);
    });

    it("should format an empty value", () => {
      const options = {
        value: "",
        type: "decimal",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("0");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("");
      expect(result.parsedValue).toBe(0);
      expect(result.decimalValue).toBe(0);
    });

    it("should format a null value", () => {
      const options = {
        value: null,
        type: "decimal",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("0");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("");
      expect(result.parsedValue).toBe(0);
      expect(result.decimalValue).toBe(0);
    });

    it("should format an undefined value", () => {
      const options = {
        value: undefined,
        type: "decimal",
      };
      const result = InputFormatter.formatValue(options);
      expect(result.formattedValue).toBe("0");
      expect(result.isDecimalType).toBe(true);
      expect(result.value).toBe("");
      expect(result.parsedValue).toBe(0);
      expect(result.decimalValue).toBe(0);
    });
  });

  describe("formatValueAsString", () => {
    it("should format a decimal value", () => {
      const options = {
        value: "123.45",
        type: "decimal",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("123.45");
    });

    it("should format a numeric value", () => {
      const options = {
        value: "123",
        type: "numeric",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("123");
    });

    it("should format a number value", () => {
      const options = {
        value: "123",
        type: "number",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("123");
    });

    it("should format a date value", () => {
      const options = {
        value: new Date("2022-01-01"),
        type: "date",
      };
      const result = InputFormatter.formatValueAsString(options);

      expect(result).toBe("2022-01-01");
    });

    it("should format a time value", () => {
      const options = {
        value: new Date("2022-01-01T12:00:00"),
        type: "time",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("12:00");
    });

    it("should format a datetime value", () => {
      const options = {
        value: new Date("2022-01-01T12:00:00"),
        type: "datetime",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("2022-01-01 12:00");
    });

    it("should format a value with a custom format function", () => {
      const options = {
        value: "123",
        type: "custom",
        format: (opts: { value: string }) => `${opts.value} formatted`,
      };
      const result = InputFormatter.formatValueAsString(options as any);
      expect(result).toBe("123 formatted");
    });

    it("should format an empty value", () => {
      const options = {
        value: "",
        type: "decimal",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("0");
    });

    it("should format a null value", () => {
      const options = {
        value: null,
        type: "decimal",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("0");
    });

    it("should format an undefined value", () => {
      const options = {
        value: undefined,
        type: "decimal",
      };
      const result = InputFormatter.formatValueAsString(options);
      expect(result).toBe("0");
    });
  });

  describe("isValidMask", () => {
    it("should return true for an array mask", () => {
      const mask = ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
      expect(InputFormatter.isValidMask(mask)).toBe(true);
    });

    it("should return true for a function mask", () => {
      const mask = () => ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
      expect(InputFormatter.isValidMask(mask)).toBe(true);
    });

    it("should return false for a string mask", () => {
      const mask = "12345";
      expect(InputFormatter.isValidMask(mask as any)).toBe(false);
    });

    it("should return false for a number mask", () => {
      const mask = 12345;
      expect(InputFormatter.isValidMask(mask as any)).toBe(false);
    });

    it("should return false for a null mask", () => {
      const mask = null;
      expect(InputFormatter.isValidMask(mask as any)).toBe(false);
    });

    it("should return false for an undefined mask", () => {
      const mask = undefined;
      expect(InputFormatter.isValidMask(mask)).toBe(false);
    });
  });

  describe("parseDecimal", () => {
    it("should parse a decimal string", () => {
      const value = "123.45";
      expect(InputFormatter.parseDecimal(value)).toBe(123.45);
    });

    it("should parse a numeric string", () => {
      const value = "123";
      expect(InputFormatter.parseDecimal(value)).toBe(123);
    });

    it("should parse a number value", () => {
      const value = 123.45;
      expect(InputFormatter.parseDecimal(value)).toBe(123.45);
    });

    it("should return 0 for an empty string", () => {
      const value = "";
      expect(InputFormatter.parseDecimal(value)).toBe(0);
    });

    it("should return 0 for a null value", () => {
      const value = null;
      expect(InputFormatter.parseDecimal(value)).toBe(0);
    });

    it("should return 0 for an undefined value", () => {
      const value = undefined;
      expect(InputFormatter.parseDecimal(value)).toBe(0);
    });

    it("should return 0 for a non-numeric string", () => {
      const value = "abc";
      expect(InputFormatter.parseDecimal(value)).toBe(0);
    });
  });

  describe("formatWithMask", () => {
    it("should format a value with a mask", () => {
      const options = {
        value: "12345",
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
      };
      const result = InputFormatter.formatWithMask(options);
      expect(result.masked).toBe("(23) ");
      expect(result.unmasked).toBe("12345");
      expect(result.obfuscated).toBe("(23) ");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(false);
    });

    it("should format a value with a mask and obfuscation", () => {
      const options = {
        value: "12345",
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
        validate: (value: string) => value.length === 10,
      };
      const result = InputFormatter.formatWithMask(options);
      expect(result.masked).toBe("(23) ");
      expect(result.unmasked).toBe("12345");
      expect(result.obfuscated).toBe("(23) ");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(false);
    });

    it("should format a value with a mask and validation", () => {
      const options = {
        value: "1234567890",
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
        validate: (value: string) => value.length === 10,
      };
      const result = InputFormatter.formatWithMask(options);
      expect(result.masked).toBe("(23) 67890");
      expect(result.unmasked).toBe("1234567890");
      expect(result.obfuscated).toBe("(23) 67890");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(false);
    });

    it("should return an empty result for an empty value", () => {
      const options = {
        value: "",
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
      };
      const result = InputFormatter.formatWithMask(options);
      expect(result.masked).toBe("");
      expect(result.unmasked).toBe("");
      expect(result.obfuscated).toBe("");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(true);
    });

    it("should return an empty result for a null value", () => {
      const options = {
        value: null,
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
      };
      const result = InputFormatter.formatWithMask(options as any);
      expect(result.masked).toBe("");
      expect(result.unmasked).toBe("");
      expect(result.obfuscated).toBe("");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(true);
    });

    it("should return an empty result for an undefined value", () => {
      const options = {
        value: undefined,
        mask: ["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        obfuscationCharacter: "*",
      };
      const result = InputFormatter.formatWithMask(options);
      expect(result.masked).toBe("");
      expect(result.unmasked).toBe("");
      expect(result.obfuscated).toBe("");
      expect(result.maskHasObfuscation).toBe(false);
      expect(result.placeholder).toBe("(__) _____-____");
      expect(result.isValid).toBe(true);
    });
  });

  describe("createDateMask", () => {
    it("should create a date mask with a moment format", () => {
      const mask = InputFormatter.createDateMask("YYYY/MM/DD");
      expect(mask.mask).toEqual([[/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], "/", [/\d/, "M"], [/\d/, "M"], "/", [/\d/, "D"], [/\d/, "D"]]);
    });

    it("should create a date mask with a moment format and validation", () => {
      const mask = InputFormatter.createDateMask("YYYY-MM-DD");
      expect(InputFormatter.formatWithMask({ value: "2022-01-01", ...mask })).toMatchObject({ masked: "2022-01-01", unmasked: "2022-01-01", obfuscated: "2022-01-01", maskHasObfuscation: false, placeholder: "YYYY-MM-DD", isValid: true });
      expect(InputFormatter.formatWithMask({ value: "2022-02-30", ...mask })).toMatchObject({ masked: "2022-02-30", unmasked: "2022-02-30", obfuscated: "2022-02-30", maskHasObfuscation: false, placeholder: "YYYY-MM-DD", isValid: false });
    });

    it("Should test Time format", () => {
      const mask = InputFormatter.createDateMask("HH:mm:ss");
      expect(InputFormatter.formatWithMask({ value: "12:00:00", ...mask })).toMatchObject({ masked: "12:00:00", unmasked: "12:00:00", obfuscated: "12:00:00", maskHasObfuscation: false, placeholder: "HH:mm:ss", isValid: true });
      expect(InputFormatter.formatWithMask({ value: "12:60:00", ...mask })).toMatchObject({ masked: "12:60:00", unmasked: "12:60:00", obfuscated: "12:60:00", maskHasObfuscation: false, placeholder: "HH:mm:ss", isValid: false });
    });
  });
  describe("create cameroon phone number mask", () => {
    it("should create a phone number mask with a CM country code", () => {
      const mask = InputFormatter.createPhoneNumberMaskFromExample("+23769965076");
      expect(mask).toMatchObject({
        mask: ["+", "2", "3", "7", " ", /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/],
        countryCode: "CM",
        dialCode: "237",
      });
    });
  });
  describe("createPhoneNumberMask", () => {
    it("should create a phone number mask with a US country code", () => {
      const mask = InputFormatter.createPhoneNumberMask("US");
      expect(mask.mask).toEqual(["+", "1", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]);
    });
  });

  describe("MASKS_WITH_VALIDATIONS", () => {
    it("should have a date mask", () => {
      expect(InputFormatter.MASKS_WITH_VALIDATIONS.DATE.mask).toEqual([[/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], "-", [/\d/, "M"], [/\d/, "M"], "-", [/\d/, "D"], [/\d/, "D"]]);
    });

    it("should have a time mask", () => {
      expect(InputFormatter.MASKS_WITH_VALIDATIONS.TIME.mask).toEqual([[/\d/, "H"], [/\d/, "H"], ":", [/\d/, "m"], [/\d/, "m"]]);
    });

    it("should have a datetime mask", () => {
      expect(InputFormatter.MASKS_WITH_VALIDATIONS.DATE_TIME.mask).toEqual([[/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], [/\d/, "Y"], "-", [/\d/, "M"], [/\d/, "M"], "-", [/\d/, "D"], [/\d/, "D"], " ", [/\d/, "H"], [/\d/, "H"], ":", [/\d/, "m"], [/\d/, "m"]]);
    });

    it("should have a credit card mask", () => {});
  });

  describe("cleanPhoneNumber", () => {
    it("should clean a phone number", () => {
      expect(InputFormatter.cleanPhoneNumber("+1 (555) 123-4567")).toBe("+1(555)123-4567");
      expect(InputFormatter.cleanPhoneNumber("+44 20 7123 4567")).toBe("+442071234567");
      expect(InputFormatter.cleanPhoneNumber("+81 3-1234-5678")).toBe("+813-1234-5678");
      expect(InputFormatter.cleanPhoneNumber("020 7183 8750")).toBe("02071838750");
      expect(InputFormatter.cleanPhoneNumber("invalid-phone")).toBe("invalid-phone");
    });
  });
  describe("extractDialCodeFromPhoneNumber", () => {
    it("should extract dial code from phone number", () => {
      expect(InputFormatter.extractDialCodeFromPhoneNumber("+1 (555) 123-4567")).toBe("1");
      expect(InputFormatter.extractDialCodeFromPhoneNumber("+44 20 7123 4567")).toBe("44");
      expect(InputFormatter.extractDialCodeFromPhoneNumber("+81 3-1234-5678")).toBe("81");
      expect(InputFormatter.extractDialCodeFromPhoneNumber("020 7183 8750")).toBe("");
      expect(InputFormatter.extractDialCodeFromPhoneNumber("invalid-phone")).toBe("");
    });
  });

  describe("Formatting phone numbers", () => {
    it("should format phone numbers", () => {
      expect(InputFormatter.formatPhoneNumber("+1 (555) 123-4567")).toBe("+1 555-123-4567");
      expect(InputFormatter.formatPhoneNumber("+44 20 7123 4567")).toBe("+44 20 7123 4567");
      expect(InputFormatter.formatPhoneNumber("+81 3-1234-5678")).toBe("+81 3-1234-5678");
      expect(InputFormatter.formatPhoneNumber("020 7183 8750")).toBe("02071838750");
      expect(InputFormatter.formatPhoneNumber("invalid-phone")).toBe("invalidphone");
      expect(InputFormatter.formatPhoneNumber("123")).toBe("123");
      expect(InputFormatter.formatPhoneNumber("6 99 34 44 23", "CM")).toBe("6 99 34 44 23");
      expect(InputFormatter.formatPhoneNumber("+237655334422")).toBe("+237 6 55 33 44 22");
    });
  });
});
