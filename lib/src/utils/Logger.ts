/**
 * Logger class for outputting structured log messages.
 *
 * Provides debug, info, warn, and error logging methods with automatic level filtering.
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
 * logger.debug('Operation started', { userId: '123' });
 * logger.info('Loaded 10 records');
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
   * Debug logs are the most verbose and show low-level operational details.
   * Use for troubleshooting, understanding flow, and performance analysis.
   *
   * Only outputs if logger is enabled and level is set to DEBUG.
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
   * Logs an info message with optional context.
   *
   * Info logs show normal operations and important events.
   * Use for high-level actions, successful operations, and summaries.
   *
   * Only outputs if logger is enabled and level is DEBUG or INFO.
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
   * Only outputs if logger is enabled and level is DEBUG, INFO, or WARN.
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
   * Internal method to handle actual logging with level filtering.
   *
   * Checks if logging is enabled and if the message level meets the configured threshold.
   * Routes messages to appropriate console methods based on severity.
   * @param level - The log level of the message
   * @param message - The message to log
   * @param context - Optional context object
   * @private
   */
  private _log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
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
    const logMessage = `${prefix} ${levelLabel}: ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
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
}

/**
 * Log level enum defining the severity of log messages.
 *
 * Log levels follow a hierarchy where setting a level shows that level and everything above it.
 * Lower numeric values = more verbose, higher values = less verbose.
 * - `DEBUG = 0`: All messages (most verbose)
 * - `INFO = 1`: Info, warnings, and errors
 * - `WARN = 2`: Warnings and errors
 * - `ERROR = 3`: Only errors
 * - `SILENT = 4`: No logging
 * @example
 * ```typescript
 * import { LogLevel } from '@miragejs/orm';
 *
 * // Debug level - see everything
 * schema().logging({ enabled: true, level: LogLevel.DEBUG })
 *
 * // Info level - only important operations
 * schema().logging({ enabled: true, level: LogLevel.INFO })
 *
 * // Error level - only failures
 * schema().logging({ enabled: true, level: LogLevel.ERROR })
 *
 * // String values still supported for backward compatibility
 * schema().logging({ enabled: true, level: 'debug' })
 * ```
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
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
  level: LogLevel | 'debug' | 'info' | 'warn' | 'error' | 'silent';

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
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};
