import { DateHelper } from '@utils/date';
import { defaultStr } from '@utils/defaultStr';
import 'reflect-metadata';
import { ClassConstructor } from '../types/index';

/**
 * Represents a logger that provides logging functionalities with different log levels.
 * It supports dynamic registration of a logger instance and ensures consistent logging behavior.
 *
 * @example
 * ```ts
 * @AttachLogger()
 * class MyCustomLogger implements ILogger {
 *   // Implementation of ILogger methods
 * }
 * import Logger from 'reslib/Logger';
 * Logger.log("This is a log message");
 * Logger.info("This is an info message");
 * Logger.debug("This is a debug message");
 * Logger.warn("This is a warning message");
 * Logger.error("This is an error message");
 * ```
 */
export class Logger {
  /**
   * Metadata key used to store logger information.
   * This is useful for dynamically registering a logger instance.
   */
  static readonly loggerMetaData = Symbol('logger-meta-data');

  /**
   * Internal reference to the currently registered logger.
   */
  private static _logger: ILogger;

  /**
   * Retrieves the currently registered logger instance.
   * If no logger is registered, it falls back to `console`.
   *
   * @returns {ILogger} The current logger instance.
   *
   * @example
   * ```ts
   * const currentLogger = Logger.logger;
   * currentLogger.log("Logging through the registered logger");
   * ```
   */
  static get logger(): ILogger {
    const logger = Reflect.getMetadata(Logger.loggerMetaData, Logger);
    if (isValidLogger(logger)) {
      this._logger = logger;
    }
    if (this._logger) return this._logger;
    return console;
  }

  /**
   * Sets a new logger instance dynamically.
   * Ensures the provided logger conforms to the expected interface.
   *
   * @param {ILogger} logger - The logger instance to register.
   *
   * @example
   * ```ts
   * class CustomLogger implements ILogger {
   *   log(...data: any[]) { console.log("Custom Log:", ...data); }
   *   info(...data: any[]) { console.info("Custom Info:", ...data); }
   *   warn(...data: any[]) { console.warn("Custom Warn:", ...data); }
   *   error(...data: any[]) { console.error("Custom Error:", ...data); }
   *   debug(...data: any[]) { console.debug("Custom Debug:", ...data); }
   * }
   * Logger.logger = new CustomLogger();
   * ```
   */
  static set logger(logger: ILogger) {
    if (isValidLogger(logger)) {
      Reflect.defineMetadata(Logger.loggerMetaData, logger, Logger);
    }
  }

  /**
   * Internal logging method that delegates calls to the registered logger.
   *
   * @param {ILoggerLevel} level - The log level (e.g., "info", "error").
   * @param {...any[]} data - Data to log.
   *
   * @returns {this} The logger instance for method chaining.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _log(level: ILoggerLevel, ...data: any[]) {
    const logger = Logger.logger;
    level = defaultStr(level);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (level && typeof ((logger as any)[level] as any) === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logger as any)[level](Logger.getDateTimeString(), ...data);
    } else {
      console.log('Logger level not found : [', level, ']', ...data);
    }
  }
  /**
   * Returns the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'.
   *
   * @returns {string} The current time.
   *
   * @example
   * const currentTime = Logger.getDateTimeString();
   * console.log(currentTime);
   * // Output: '[Sat 01 Jan 2022 12:30:45]'
   */
  static getDateTimeString() {
    const { day, year, hours, minutes, seconds, dayNameShort, monthName } =
      DateHelper.getUTCDateTimeDetails();
    const dayString = day < 10 ? '0' + day : day;
    const hoursString = hours < 10 ? '0' + hours : hours;
    const minutesString = minutes < 10 ? '0' + minutes : minutes;
    const secondsString = seconds < 10 ? '0' + seconds : seconds;
    return (
      '[' +
      [dayNameShort, dayString, monthName, year].join(' ') +
      ' ' +
      [hoursString, minutesString, secondsString].join(':') +
      ']'
    );
  }

  /**
   * Logs a message with the "log" level.
   * @param {...any[]} data - Data to log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static log(...data: any[]): void {
    this._log('log', ...data);
  }

  /**
   * Logs a message with the "info" level.
   * @param {...any[]} data - Data to log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static info(...data: any[]): void {
    this._log('info', ...data);
  }

  /**
   * Logs a message with the "debug" level.
   * @param {...any[]} data - Data to log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static debug(...data: any[]): void {
    this._log('debug', ...data);
  }

  /**
   * Logs a message with the "warn" level.
   * @param {...any[]} data - Data to log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static warn(...data: any[]): void {
    this._log('warn', ...data);
  }

  /**
   * Logs a message with the "error" level.
   * @param {...any[]} data - Data to log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static error(...data: any[]): void {
    this._log('error', ...data);
  }
}

/**
 * Represents valid logger levels.
 *
 * @example
 * ```ts
 * const level: ILoggerLevel = "info";
 * ```
 */
export type ILoggerLevel = 'info' | 'debug' | 'warn' | 'error' | string;

/**
 * Interface for a logger that provides methods for logging messages at different levels.
 *
 * Implementations of this interface should provide a way to log messages with varying levels of severity.
 *
 * @example
 * ```typescript
 * class ConsoleLogger implements ILogger {
 *   log(...data: any[]): void {
 *     console.log(...data);
 *   }
 *
 *   info(...data: any[]): void {
 *     console.info(...data);
 *   }
 *
 *   debug(...data: any[]): void {
 *     console.debug(...data);
 *   }
 *
 *   warn(...data: any[]): void {
 *     console.warn(...data);
 *   }
 *
 *   error(...data: any[]): void {
 *     console.error(...data);
 *   }
 * }
 * ```
 */
export interface ILogger {
  /**
   * Logs a message at the default level.
   * 
   * This method is intended for general logging purposes and should be used for messages that do not fit into any other category.
   * 
   * @param data - The data to be logged. This can be any type of data, including strings, numbers, objects, etc.
     @param {dateTimeString}, the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'
   * @example
   * ```typescript
   * logger.log('Hello, world!');
   * logger.log(123);
   * logger.log({ foo: 'bar' });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(dateTimeString: string, ...data: any[]): void;

  /**
   * Logs a message at the info level.
   * 
   * This method is intended for logging informational messages that are not critical to the application's functionality.
   * 
   * @param data - The data to be logged. This can be any type of data, including strings, numbers, objects, etc.
     @param {dateTimeString}, the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'
   * @example
   * ```typescript
   * logger.info('Application started successfully.');
   * logger.info('User  logged in.');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(dateTimeString: string, ...data: any[]): void;

  /**
   * Logs a message at the debug level.
   * 
   * This method is intended for logging debug messages that are used for troubleshooting purposes.
   * 
   * @param data - The data to be logged. This can be any type of data, including strings, numbers, objects, etc.
     @param {dateTimeString}, the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'
   * @example
   * ```typescript
   * logger.debug('Variable x has value 5.');
   * logger.debug('Function foo was called.');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(dateTimeString: string, ...data: any[]): void;

  /**
   * Logs a message at the warn level.
   *
   * This method is intended for logging warning messages that indicate potential issues with the application.
   *
   * @param data - The data to be logged. This can be any type of data, including strings, numbers, objects, etc.
   * @param {dateTimeString}, the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'
   * @example
   * ```typescript
   * logger.warn('Low disk space detected.');
   * logger.warn('Invalid user input detected.');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(dateTimeString: string, ...data: any[]): void;

  /**
   * Logs a message at the error level.
   * 
   * This method is intended for logging error messages that indicate critical issues with the application.
   * 
   * @param data - The data to be logged. This can be any type of data, including strings, numbers, objects, etc.
     @param {dateTimeString}, the current UTC time in the format '[DayNameShort Day MonthName Year Hours:Minutes:Seconds]'
   * @example
   * ```typescript
   * logger.error('Database connection failed.');
   * logger.error('Invalid data detected.');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(dateTimeString: string, ...data: any[]): void;
}

/**
 * Checks whether an object conforms to the ILogger interface.
 *
 * @param {ILogger} [logger] - The logger instance to validate.
 *
 * @returns {boolean} True if valid, otherwise false.
 *
 * @example
 * ```ts
 * const isValid = isValidLogger(myLogger);
 * ```
 */
const isValidLogger = (logger?: ILogger): boolean => {
  if (!logger) return false;
  try {
    return ['warn', 'info', 'error'].every(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => typeof (logger as any)[value] === 'function'
    );
  } catch {
    return false;
  }
};

/**
 * Decorator function that attaches a logger to the application.
 *
 * This decorator is used to register a logger class with the application. The logger class must implement the ILogger interface.
 *
 * @returns A decorator function that takes a target class constructor as an argument.
 * @example
 * ```typescript
 * @AttachLogger()
 * class MyLogger implements ILogger {
 *   // implementation of ILogger methods
 * }
 * ```
 */
export function AttachLogger() {
  return function (target: ClassConstructor<ILogger>) {
    try {
      const logger = new target();
      if (!isValidLogger(logger)) {
        return;
      }
      Logger.logger = logger;
    } catch (error) {
      console.error(error, ' registering logger');
    }
  };
}
