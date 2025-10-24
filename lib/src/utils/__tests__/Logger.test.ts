import Logger from '../Logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] DEBUG: test message', '');
    });

    it('should create logger with custom prefix', () => {
      const logger = new Logger({ enabled: true, level: 'debug', prefix: '[MyORM]' });
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[MyORM] DEBUG: test message', '');
    });

    it('should not log when disabled', () => {
      const logger = new Logger({ enabled: false, level: 'debug' });
      logger.debug('test message');
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

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] DEBUG: debug message', '');
    });

    it('should log info messages at info level', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] INFO: info message', '');
    });

    it('should log warn messages at warn level', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      logger.warn('warn message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Mirage] WARN: warn message', '');
    });

    it('should log error messages at error level', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Mirage] ERROR: error message', '');
    });

    it('should not log anything at silent level', () => {
      const logger = new Logger({ enabled: true, level: 'silent' });
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Log level filtering', () => {
    it('should filter out debug messages when level is info', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      logger.debug('debug message');
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] INFO: info message', '');
    });

    it('should filter out debug and info messages when level is warn', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Mirage] WARN: warn message', '');
    });

    it('should only log error messages when level is error', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Mirage] ERROR: error message', '');
    });
  });

  describe('Context logging', () => {
    it('should log context object with debug message', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      const context = { userId: '123', action: 'create' };
      logger.debug('test message', context);

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] DEBUG: test message', context);
    });

    it('should log context object with info message', () => {
      const logger = new Logger({ enabled: true, level: 'info' });
      const context = { count: 5 };
      logger.info('test message', context);

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] INFO: test message', context);
    });

    it('should log context object with warn message', () => {
      const logger = new Logger({ enabled: true, level: 'warn' });
      const context = { issue: 'missing field' };
      logger.warn('test message', context);

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Mirage] WARN: test message', context);
    });

    it('should log context object with error message', () => {
      const logger = new Logger({ enabled: true, level: 'error' });
      const context = { error: 'validation failed' };
      logger.error('test message', context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Mirage] ERROR: test message', context);
    });

    it('should handle empty context', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[Mirage] DEBUG: test message', '');
    });
  });

  describe('All log levels', () => {
    it('should log all levels at debug level', () => {
      const logger = new Logger({ enabled: true, level: 'debug' });
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
