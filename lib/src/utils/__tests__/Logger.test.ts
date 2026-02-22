import type { Mock } from 'vitest';

import Logger, { LogLevel } from '../Logger';

// ANSI color codes for matching colored log output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m', // DEBUG
  gray: '\x1b[90m', // LOG
  blue: '\x1b[34m', // INFO
  yellow: '\x1b[33m', // WARN
  red: '\x1b[31m', // ERROR
};

// Helper to create expected colored message
const coloredLevel = (level: 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR') => {
  const colorMap = {
    DEBUG: COLORS.green,
    LOG: COLORS.gray,
    INFO: COLORS.blue,
    WARN: COLORS.yellow,
    ERROR: COLORS.red,
  };
  return `${colorMap[level]}${level}${COLORS.reset}`;
};

describe('Logger', () => {
  let consoleLogSpy: Mock<typeof vi.spyOn>;
  let consoleWarnSpy: Mock<typeof vi.spyOn>;
  let consoleErrorSpy: Mock<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic functionality', () => {
    it('should create logger with default prefix', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: test message`,
        '',
      );
    });

    it('should create logger with custom prefix', () => {
      const logger = new Logger({
        enabled: true,
        level: 'debug',
        prefix: '[MyORM]',
      });
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[MyORM] ${coloredLevel('DEBUG')}: test message`,
        '',
      );
    });

    it('should not log when disabled', () => {
      const logger = new Logger({ enabled: false, level: 'debug' });
      logger.debug('test message');
      logger.log('test message');
      logger.info('test message');
      logger.warn('test message');
      logger.error('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Log levels', () => {
    it('should log debug messages at debug level', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: debug message`,
        '',
      );
    });

    it('should log log messages at log level', () => {
      const logger = new Logger({ enabled: true, level: 'log' });
      logger.log('log message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: log message`,
        '',
      );
    });

    it('should log info messages at info level', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: info message`,
        '',
      );
    });

    it('should log warn messages at warn level', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      logger.warn('warn message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('WARN')}: warn message`,
        '',
      );
    });

    it('should log error messages at error level', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('ERROR')}: error message`,
        '',
      );
    });

    it('should not log anything at silent level', () => {
      const logger = new Logger({ enabled: true, level: 'silent' });
      logger.debug('debug message');
      logger.log('log message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Log level filtering', () => {
    it('should filter out debug messages when level is log', () => {
      const logger = new Logger({ enabled: true, level: 'log' });
      logger.debug('debug message');
      logger.log('log message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: log message`,
        '',
      );
    });

    it('should filter out debug and log messages when level is info', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      logger.debug('debug message');
      logger.log('log message');
      logger.info('info message');

      // INFO level (2) shows INFO, WARN, ERROR (levels >= 2)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: info message`,
        '',
      );
    });

    it('should filter out debug, log, and info messages when level is warn', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      logger.debug('debug message');
      logger.log('log message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('WARN')}: warn message`,
        '',
      );
    });

    it('should only log error messages when level is error', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      logger.debug('debug message');
      logger.log('log message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('ERROR')}: error message`,
        '',
      );
    });
  });

  describe('Context logging', () => {
    it('should log context object with debug message', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      const context = { userId: '123', action: 'create' };
      logger.debug('test message', context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: test message`,
        context,
      );
    });

    it('should log context object with log message', () => {
      const logger = new Logger({ enabled: true, level: 'log' });
      const context = { operation: 'find' };
      logger.log('test message', context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: test message`,
        context,
      );
    });

    it('should log context object with info message', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      const context = { count: 5 };
      logger.info('test message', context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('INFO')}: test message`,
        context,
      );
    });

    it('should log context object with warn message', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      const context = { issue: 'missing field' };
      logger.warn('test message', context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('WARN')}: test message`,
        context,
      );
    });

    it('should log context object with error message', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      const context = { error: 'validation failed' };
      logger.error('test message', context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('ERROR')}: test message`,
        context,
      );
    });

    it('should handle empty context', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('DEBUG')}: test message`,
        '',
      );
    });
  });

  describe('All log levels', () => {
    it('should log all levels at debug level', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('debug');
      logger.log('log');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // debug, log, and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('LogLevel enum', () => {
    it('should have correct level hierarchy', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.LOG).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.WARN).toBe(3);
      expect(LogLevel.ERROR).toBe(4);
      expect(LogLevel.SILENT).toBe(5);
    });

    it('should work with enum values directly', () => {
      const logger = new Logger({ enabled: true, level: LogLevel.LOG });
      logger.debug('debug message');
      logger.log('log message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[Mirage] ${coloredLevel('LOG')}: log message`,
        '',
      );
    });
  });
});
