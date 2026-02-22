/**
 * ANSI color codes for terminal output.
 * @internal
 */
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m', // DEBUG
  gray: '\x1b[90m', // LOG
  blue: '\x1b[34m', // INFO
  yellow: '\x1b[33m', // WARN
  red: '\x1b[31m', // ERROR
};

/**
 * Logger class for outputting structured log messages.
 *
 * Provides debug, log, info, warn, and error logging methods with automatic level filtering.
 * Used internally by the ORM to log database operations, seed/fixture loading, and errors.
 * @example
 * ```typescript
 * import { Logger, LogLevel } from '@miragejs/orm';
 *
 * const logger = new Logger({
 *   enabled: true,
 *   level: LogLevel.DEBUG,
 *   prefix: '[MyApp]'
 * });
 *
 * logger.debug('Internal details', { query: { name: 'John' } });
 * logger.log('Operation starting', { userId: '123' });
 * logger.info('Operation complete');
 * logger.warn('Missing optional field', { field: 'email' });
 * logger.error('Validation failed', { errors: [...] });
 * ```
 */
export default class Logger {
  private _config: LoggerConfig;

  /**
   * Creates a new Logger instance with the specified configuration.
   * @param config - Logger configuration including enabled state, log level, and optional prefix
   * @example
   * ```typescript
   * const logger = new Logger({
   *   enabled: true,
   *   level: LogLevel.DEBUG,
   *   prefix: '[Mirage]'
   * });
   * ```
   */
  constructor(config: LoggerConfig) {
    this._config = {
      prefix: '[Mirage]',
      ...config,
    };
  }

  /**
   * Logs a debug message with optional context.
   *
   * Debug logs are the most verbose and show low-level internal details.
   * Use for troubleshooting, understanding internal flow, and DB operations.
   *
   * Only outputs if logger is enabled and level is set to DEBUG.
   * Output color: green
   * @param message - The debug message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.debug('Query executed', { collection: 'users', query: { name: 'John' } });
   * // Output: [Mirage] DEBUG: Query executed { collection: 'users', query: { name: 'John' } }
   * ```
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this._log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a log-level message with optional context.
   *
   * Log messages show minor operational details like operation start.
   * Use for tracking operation flow without full debug verbosity.
   *
   * Only outputs if logger is enabled and level is DEBUG, INFO, or LOG.
   * Output color: gray
   * @param message - The log message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.log('Finding model in collection', { collection: 'users' });
   * // Output: [Mirage] LOG: Finding model in collection { collection: 'users' }
   * ```
   */
  log(message: string, context?: Record<string, unknown>): void {
    this._log(LogLevel.LOG, message, context);
  }

  /**
   * Logs an info message with optional context.
   *
   * Info logs show important events, operation starts/completions, and summaries.
   * Use for high-level actions and tracking the overall flow.
   *
   * Only outputs if logger is enabled and level is DEBUG or INFO.
   * Output color: blue
   * @param message - The info message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.info('Fixtures loaded', { collection: 'users', count: 50 });
   * // Output: [Mirage] INFO: Fixtures loaded { collection: 'users', count: 50 }
   * ```
   */
  info(message: string, context?: Record<string, unknown>): void {
    this._log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message with optional context.
   *
   * Warning logs indicate something unexpected but not breaking.
   * Use for deprecated features, unusual patterns, and potential issues.
   *
   * Only outputs if logger is enabled and level is DEBUG, LOG, INFO, or WARN.
   * Output color: yellow
   * @param message - The warning message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.warn('Foreign key mismatch', { postId: '1', authorId: '999' });
   * // Output: [Mirage] WARN: Foreign key mismatch { postId: '1', authorId: '999' }
   * ```
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this._log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message with optional context.
   *
   * Error logs indicate something failed or broke.
   * Use for operations that couldn't complete and validation failures.
   *
   * Only outputs if logger is enabled and level is not SILENT.
   * Output color: red
   * @param message - The error message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.error('Validation failed', { field: 'email', reason: 'required' });
   * // Output: [Mirage] ERROR: Validation failed { field: 'email', reason: 'required' }
   * ```
   */
  error(message: string, context?: Record<string, unknown>): void {
    this._log(LogLevel.ERROR, message, context);
  }

  /**
   * Internal method to handle actual logging with level filtering and colors.
   *
   * Checks if logging is enabled and if the message level meets the configured threshold.
   * Applies appropriate colors and routes messages to console methods based on severity.
   * @param level - The log level of the message
   * @param message - The message to log
   * @param context - Optional context object
   * @private
   */
  private _log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (!this._config.enabled) {
      return;
    }

    // Normalize configured level to enum value
    const configLevel =
      typeof this._config.level === 'string'
        ? LOG_LEVEL_MAP[this._config.level]
        : this._config.level;

    if (level < configLevel) {
      return;
    }

    const prefix = this._config.prefix;
    const levelLabel = LogLevel[level];
    const color = this._getLevelColor(level);
    const logMessage = `${prefix} ${color}${levelLabel}${COLORS.reset}: ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.LOG:
      case LogLevel.INFO:
        console.log(logMessage, context || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, context || '');
        break;
    }
  }

  /**
   * Gets the ANSI color code for a log level.
   * @param level - The log level
   * @returns The ANSI color code
   * @private
   */
  private _getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return COLORS.green;
      case LogLevel.LOG:
        return COLORS.gray;
      case LogLevel.INFO:
        return COLORS.blue;
      case LogLevel.WARN:
        return COLORS.yellow;
      case LogLevel.ERROR:
        return COLORS.red;
      default:
        return COLORS.reset;
    }
  }
}

/**
 * Log level enum defining the severity of log messages.
 *
 * Log levels follow a hierarchy where setting a level shows that level and everything above it.
 * Lower numeric values = more verbose, higher values = less verbose.
 * - `DEBUG = 0`: All messages including internal details (most verbose)
 * - `INFO = 1`: Important operations (start/end), LOG, warnings, and errors
 * - `LOG = 2`: Minor operational details, warnings, and errors
 * - `WARN = 3`: Warnings and errors
 * - `ERROR = 4`: Only errors
 * - `SILENT = 5`: No logging
 * @example
 * ```typescript
 * import { LogLevel } from '@miragejs/orm';
 *
 * // Debug level - see everything including internal DB operations
 * schema().logging({ enabled: true, level: LogLevel.DEBUG })
 *
 * // Info level - see important operations and their completions (recommended)
 * schema().logging({ enabled: true, level: LogLevel.INFO })
 *
 * // Log level - only minor operational details without info
 * schema().logging({ enabled: true, level: LogLevel.LOG })
 *
 * // Error level - only failures
 * schema().logging({ enabled: true, level: LogLevel.ERROR })
 *
 * // String values still supported for backward compatibility
 * schema().logging({ enabled: true, level: 'info' })
 * ```
 */
export enum LogLevel {
  DEBUG = 0,
  LOG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

/**
 * Logger configuration options.
 */
export interface LoggerConfig {
  /**
   * Whether logging is enabled. When false, no logs are output regardless of level.
   * @default false
   */
  enabled: boolean;

  /**
   * The minimum log level to output. Messages below this level are filtered out.
   * Can use enum values (LogLevel.DEBUG) or string values ('debug') for backward compatibility.
   * @default LogLevel.INFO
   */
  level: LogLevel | 'debug' | 'log' | 'info' | 'warn' | 'error' | 'silent';

  /**
   * Custom prefix for log messages. Useful for distinguishing ORM logs from other output.
   * @default '[Mirage]'
   */
  prefix?: string;
}

/**
 * Map string log level names to enum values for backward compatibility.
 * @internal
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  log: LogLevel.LOG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};
