import type { ValidatorRuleParams } from '../types';
import { ValidatorResult, ValidatorRuleParamTypes } from '../types';
import { Validator } from '../validator';

/**
 * ### Date Rule
 *
 * Validates that the field under validation is a valid date.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Event {
 *   @IsRequired()
 *   @IsDate()
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Date']
>(function _Date({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return true;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return true;
    } else {
      const message = i18n.t('validator.date', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return message;
    }
  } else {
    const message = i18n.t('validator.date', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'Date');

/**
 * ### DateAfter Rule
 *
 * Validates that the date is after the specified date.
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Event {
 *   @IsDateAfter(new Date('2024-01-01'))
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateAfter = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateAfter']
>(function DateAfter({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateAfter',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateAfter',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate > compareDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### DateBefore Rule
 *
 * Validates that the date is before the specified date.
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Deadline {
 *   @IsDateBefore(new Date('2024-12-31'))
 *   submissionDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateBefore = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateBefore']
>(function DateBefore({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBefore',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBefore',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate < compareDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### DateBetween Rule
 *
 * Validates that the date is between the specified start and end dates (inclusive).
 *
 * #### Parameters
 * - Start date (Date object, ISO string, or timestamp)
 * - End date (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Vacation {
 *   @IsDateBetween(new Date('2024-01-01'), new Date('2024-12-31'))
 *   vacationDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing start date and end date
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateBetween = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateBetween']
>(function DateBetween({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams?.[0] || '',
      endDate: ruleParams?.[1] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams?.[0] || '',
      endDate: ruleParams?.[1] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || ruleParams.length < 2) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const startDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  const endDate =
    ruleParams[1] instanceof Date ? ruleParams[1] : new Date(ruleParams[1]);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate >= startDate && valueDate <= endDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams[0],
      endDate: ruleParams[1],
      ...rest,
    });
    return message;
  }
});

/**
 * ### SameDate Rule
 *
 * Validates that the date equals the specified date (compares date part only, ignores time).
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Birthday {
 *   @IsSameDate(new Date('1990-01-01'))
 *   birthDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsSameDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['SameDate']
>(function SameDate({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'SameDate',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'SameDate',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  // Compare dates by setting time to start of day for date-only comparison
  const valueStartOfDay = new Date(
    valueDate.getFullYear(),
    valueDate.getMonth(),
    valueDate.getDate()
  );
  const compareStartOfDay = new Date(
    compareDate.getFullYear(),
    compareDate.getMonth(),
    compareDate.getDate()
  );

  if (valueStartOfDay.getTime() === compareStartOfDay.getTime()) {
    return true;
  } else {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### IsFutureDate Rule
 *
 * Validates that the date is in the future.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Appointment {
 *   @IsFutureDate
 *   appointmentDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsFutureDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['FutureDate']
>(function FutureDate({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const now = new Date();
  if (valueDate > now) {
    return true;
  } else {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'FutureDate');

/**
 * ### PastDate Rule
 *
 * Validates that the date is in the past.
 *
 * @example
 * ```typescript
 * // Class validation
 * class HistoricalEvent {
 *   @IsPastDate
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsPastDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['PastDate']
>(function IsPassDate({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const now = new Date();
  if (valueDate < now) {
    return true;
  } else {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'PastDate');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * @summary Validates that the field contains a valid date value.
     * @description
     * Ensures the input represents a valid date that can be parsed into a JavaScript Date object.
     * Accepts Date instances, ISO date strings, and numeric timestamps.
     *
     * @example
     * ```typescript
     * // Valid date inputs
     * await Validator.validate({
     *   value: new Date(),
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-01-01T10:30:00Z',
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 1640995200000, // Unix timestamp
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * // Invalid inputs
     * await Validator.validate({
     *   value: 'invalid-date-string',
     *   rules: ['Date']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['Date']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: {},
     *   rules: ['Date']
     * }); // ✗ Invalid
     * ```
     *
     * @example
     * ```typescript
     * // Class validation usage
     * class Event {
     *   @IsRequired()
     *   @IsDate()
     *   eventDate: Date;
     * }
     * ```
     *
     * @public
     */
    Date: ValidatorRuleParams<[]>;

    /**
     * @summary Validates that the date occurs after a specified reference date.
     * @description
     * Checks if the input date is strictly greater than the provided comparison date.
     * Both dates are converted to Date objects for comparison.
     *
     * @param date - The reference date to compare against. Accepts Date object, ISO string, or timestamp.
     *
     * @example
     * ```typescript
     * // Valid examples (date must be after reference)
     * await Validator.validate({
     *   value: new Date('2024-01-02'),
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-06-15T12:00:00Z',
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✗ Invalid (before reference)
     *
     * await Validator.validate({
     *   value: '2024-01-01T23:59:59Z',
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✗ Invalid (same date, not after)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation with dynamic reference
     * class Event {
     *   @IsDateAfter(new Date('2024-01-01'))
     *   eventDate: Date;
     * }
     * ```
     *
     * @public
     */
    DateAfter: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * @summary Validates that the date occurs before a specified reference date.
     * @description
     * Checks if the input date is strictly less than the provided comparison date.
     * Both dates are converted to Date objects for comparison.
     *
     * @param date - The reference date to compare against. Accepts Date object, ISO string, or timestamp.
     *
     * @example
     * ```typescript
     * // Valid examples (date must be before reference)
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2023-06-15T12:00:00Z',
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2024-01-02'),
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✗ Invalid (after reference)
     *
     * await Validator.validate({
     *   value: '2024-01-01T00:00:01Z',
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✗ Invalid (same date, not before)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation with deadline
     * class Deadline {
     *   @IsDateBefore(new Date('2024-12-31'))
     *   submissionDate: Date;
     * }
     * ```
     *
     * @public
     */
    DateBefore: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * @summary Validates that the date falls within a specified date range (inclusive).
     * @description
     * Checks if the input date is greater than or equal to the start date and
     * less than or equal to the end date. All dates are converted to Date objects.
     *
     * @param minDate - The minimum/earliest allowed date. Accepts Date object, ISO string, or timestamp.
     * @param maxDate - The maximum/latest allowed date. Accepts Date object, ISO string, or timestamp.
     *
     * @example
     * ```typescript
     * // Valid examples (within range inclusive)
     * await Validator.validate({
     *   value: new Date('2024-06-15'),
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-01-01T00:00:00Z', // Start boundary
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-12-31T23:59:59Z', // End boundary
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✗ Invalid (before range)
     *
     * await Validator.validate({
     *   value: '2025-01-01',
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✗ Invalid (after range)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation for vacation period
     * class Vacation {
     *   @IsDateBetween(new Date('2024-01-01'), new Date('2024-12-31'))
     *   vacationDate: Date;
     * }
     * ```
     *
     * @public
     */
    DateBetween: ValidatorRuleParams<
      [minDate: ValidatorDate, maxDate: ValidatorDate]
    >;

    /**
     * @summary Validates that the date matches a specific date (ignoring time components).
     * @description
     * Compares only the date parts (year, month, day) of the input and reference dates,
     * ignoring hours, minutes, seconds, and milliseconds. Useful for date-only equality checks.
     *
     * @param date - The reference date to match against. Accepts Date object, ISO string, or timestamp.
     *
     * @example
     * ```typescript
     * // Valid examples (same date regardless of time)
     * await Validator.validate({
     *   value: new Date('2024-01-01T10:30:45Z'),
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✓ Valid (time ignored)
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['SameDate[2024-01-01T23:59:59Z]']
     * }); // ✓ Valid (time ignored)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2024-01-02T00:00:00Z'),
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✗ Invalid (different date)
     *
     * await Validator.validate({
     *   value: '2024-01-01T10:30:00Z',
     *   rules: ['SameDate[2024-01-02]']
     * }); // ✗ Invalid (different date)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation for specific birthday
     * class Birthday {
     *   @IsSameDate(new Date('1990-01-01'))
     *   birthDate: Date;
     * }
     * ```
     *
     * @public
     */
    SameDate: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * @summary Validates that the date is in the future relative to the current time.
     * @description
     * Checks if the input date occurs after the current moment (now).
     * Useful for validating future events, deadlines, or appointments.
     *
     * @example
     * ```typescript
     * // Valid examples (future dates)
     * await Validator.validate({
     *   value: new Date(Date.now() + 86400000), // Tomorrow
     *   rules: ['FutureDate']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2025-01-01T00:00:00Z',
     *   rules: ['FutureDate']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date(Date.now() - 86400000), // Yesterday
     *   rules: ['FutureDate']
     * }); // ✗ Invalid (past date)
     *
     * await Validator.validate({
     *   value: new Date(), // Current time
     *   rules: ['FutureDate']
     * }); // ✗ Invalid (not strictly future)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['FutureDate']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation for future appointments
     * class Appointment {
     *   @IsFutureDate()
     *   appointmentDate: Date;
     * }
     * ```
     *
     * @public
     */
    FutureDate: ValidatorRuleParams<[]>;

    /**
     * @summary Validates that the date is in the past relative to the current time.
     * @description
     * Checks if the input date occurs before the current moment (now).
     * Useful for validating historical events or past occurrences.
     *
     * @example
     * ```typescript
     * // Valid examples (past dates)
     * await Validator.validate({
     *   value: new Date(Date.now() - 86400000), // Yesterday
     *   rules: ['PastDate']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2020-01-01T00:00:00Z',
     *   rules: ['PastDate']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date(Date.now() + 86400000), // Tomorrow
     *   rules: ['PastDate']
     * }); // ✗ Invalid (future date)
     *
     * await Validator.validate({
     *   value: new Date(), // Current time
     *   rules: ['PastDate']
     * }); // ✗ Invalid (not strictly past)
     *
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['PastDate']
     * }); // ✗ Invalid (invalid input date)
     * ```
     *
     * @example
     * ```typescript
     * // Class validation for historical events
     * class HistoricalEvent {
     *   @IsPastDate()
     *   eventDate: Date;
     * }
     * ```
     *
     * @public
     */
    PastDate: ValidatorRuleParams<[]>;
  }
}

type ValidatorDate = string | Date | number;
