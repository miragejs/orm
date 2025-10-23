/**
 * Log level type defining the severity of log messages.
 *
 * Log levels follow a hierarchy where setting a level shows that level and everything above it:
 * - `silent`: No logging
 * - `error`: Only errors
 * - `warn`: Warnings and errors
 * - `info`: Info, warnings, and errors
 * - `debug`: All messages (most verbose)
 * @example
 * ```typescript
 * // Debug level - see everything
 * schema().logging({ enabled: true, level: 'debug' })
 *
 * // Info level - only important operations
 * schema().logging({ enabled: true, level: 'info' })
 *
 * // Error level - only failures
 * schema().logging({ enabled: true, level: 'error' })
 * ```
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

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
   * @default 'info'
   */
  level: LogLevel;

  /**
   * Custom prefix for log messages. Useful for distinguishing ORM logs from other output.
   * @default '[Mirage]'
   */
  prefix?: string;
}

/**
 * Numeric values for log levels to enable level comparison.
 * Lower numbers = more verbose, higher numbers = less verbose.
 * @internal
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * Logger class for outputting structured log messages.
 *
 * Provides debug, info, warn, and error logging methods with automatic level filtering.
 * Used internally by the ORM to log database operations, seed/fixture loading, and errors.
 * @example
 * ```typescript
 * const logger = new Logger({
 *   enabled: true,
 *   level: 'debug',
 *   prefix: '[MyApp]'
 * });
 *
 * logger.debug('Operation started', { userId: '123' });
 * logger.info('Loaded 10 records');
 * logger.warn('Missing optional field', { field: 'email' });
 * logger.error('Validation failed', { errors: [...] });
 * ```
 */
export class Logger {
  private _config: LoggerConfig;

  /**
   * Creates a new Logger instance with the specified configuration.
   * @param config - Logger configuration including enabled state, log level, and optional prefix
   * @example
   * ```typescript
   * const logger = new Logger({
   *   enabled: true,
   *   level: 'debug',
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
   * Only outputs if logger is enabled and level is set to 'debug'.
   * @param message - The debug message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.debug('Query executed', { collection: 'users', query: { name: 'John' } });
   * // Output: [Mirage] DEBUG: Query executed { collection: 'users', query: { name: 'John' } }
   * ```
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this._log('debug', message, context);
  }

  /**
   * Logs an info message with optional context.
   *
   * Info logs show normal operations and important events.
   * Use for high-level actions, successful operations, and summaries.
   *
   * Only outputs if logger is enabled and level is 'debug' or 'info'.
   * @param message - The info message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.info('Fixtures loaded', { collection: 'users', count: 50 });
   * // Output: [Mirage] INFO: Fixtures loaded { collection: 'users', count: 50 }
   * ```
   */
  info(message: string, context?: Record<string, unknown>): void {
    this._log('info', message, context);
  }

  /**
   * Logs a warning message with optional context.
   *
   * Warning logs indicate something unexpected but not breaking.
   * Use for deprecated features, unusual patterns, and potential issues.
   *
   * Only outputs if logger is enabled and level is 'debug', 'info', or 'warn'.
   * @param message - The warning message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.warn('Foreign key mismatch', { postId: '1', authorId: '999' });
   * // Output: [Mirage] WARN: Foreign key mismatch { postId: '1', authorId: '999' }
   * ```
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this._log('warn', message, context);
  }

  /**
   * Logs an error message with optional context.
   *
   * Error logs indicate something failed or broke.
   * Use for operations that couldn't complete and validation failures.
   *
   * Only outputs if logger is enabled and level is not 'silent'.
   * @param message - The error message to log
   * @param context - Optional context object with additional information
   * @example
   * ```typescript
   * logger.error('Validation failed', { field: 'email', reason: 'required' });
   * // Output: [Mirage] ERROR: Validation failed { field: 'email', reason: 'required' }
   * ```
   */
  error(message: string, context?: Record<string, unknown>): void {
    this._log('error', message, context);
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

    if (LOG_LEVELS[level] < LOG_LEVELS[this._config.level]) {
      return;
    }

    const prefix = this._config.prefix;
    const levelLabel = level.toUpperCase();
    const logMessage = `${prefix} ${levelLabel}: ${message}`;

    switch (level) {
      case 'debug':
      case 'info':
        console.log(logMessage, context || '');
        break;
      case 'warn':
        console.warn(logMessage, context || '');
        break;
      case 'error':
        console.error(logMessage, context || '');
        break;
    }
  }
}
