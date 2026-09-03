import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { ConsoleLogger } from 'extension/common/logging/console.logger';
import { type LoggingDataRepository } from 'extension/common/logging/data/logging-data.repository';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { LoggingService, type LoggingService as LoggingServiceType } from 'extension/common/logging/logging.service';

const asExtensionInfo = (isProduction: boolean): ExtensionInfo => ({ isProduction }) as unknown as ExtensionInfo;

const createRepository = (data: LoggingData) => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  let listener: (change: { newValue: LoggingData }) => void = () => {};

  return {
    getOptional: vi.fn(async () => data),
    addChangeListener: vi.fn((fn: (change: { newValue: LoggingData }) => void) => {
      listener = fn;
    }),
    emit: (newValue: LoggingData) => listener({ newValue }),
  };
};

describe('LoggingService', () => {
  describe('default configuration', () => {
    it('enables Debug and above in production', () => {
      const service = new LoggingService(asExtensionInfo(true));

      expect(service.isLevelEnabled(LogLevel.Trace)).toBe(false);
      expect(service.isLevelEnabled(LogLevel.Debug)).toBe(true);
      expect(service.isLevelEnabled(LogLevel.Error)).toBe(true);
    });

    it('enables Trace and above outside production', () => {
      const service = new LoggingService(asExtensionInfo(false));

      expect(service.isLevelEnabled(LogLevel.Trace)).toBe(true);
    });

    it('assumes production when no extension info is available', () => {
      const service = new LoggingService(undefined);

      expect(service.isLevelEnabled(LogLevel.Trace)).toBe(false);
      expect(service.isLevelEnabled(LogLevel.Debug)).toBe(true);
    });
  });

  describe('getLogger', () => {
    it('returns a ConsoleLogger', () => {
      const service = new LoggingService(asExtensionInfo(false));

      expect(service.getLogger('Foo')).toBeInstanceOf(ConsoleLogger);
    });

    it('caches loggers by name', () => {
      const service = new LoggingService(asExtensionInfo(false));

      expect(service.getLogger('Foo')).toBe(service.getLogger('Foo'));
      expect(service.getLogger('Foo')).not.toBe(service.getLogger('Bar'));
    });

    it('exposes a stable root logger', () => {
      const service = new LoggingService(asExtensionInfo(false));

      expect(service.getRootLogger()).toBe(service.getRootLogger());
    });
  });

  describe('configure', () => {
    it('applies persisted configuration once loaded', async () => {
      const service = new LoggingService(asExtensionInfo(false));
      const repository = createRepository({ enabled: false, level: LogLevel.Error });

      service.configure(repository as unknown as LoggingDataRepository);
      await Promise.resolve();
      await Promise.resolve();

      expect(service.isLevelEnabled(LogLevel.Error)).toBe(false);
    });

    it('keeps configuration up to date via the change listener', async () => {
      const service = new LoggingService(asExtensionInfo(false));
      const repository = createRepository({ enabled: true, level: LogLevel.Trace });

      service.configure(repository as unknown as LoggingDataRepository);
      await Promise.resolve();

      repository.emit({ enabled: true, level: LogLevel.Warn });

      expect(service.isLevelEnabled(LogLevel.Info)).toBe(false);
      expect(service.isLevelEnabled(LogLevel.Warn)).toBe(true);
    });
  });
});

describe('ConsoleLogger', () => {
  let isLevelEnabled: ReturnType<typeof vi.fn>;
  let service: LoggingServiceType;
  let logger: ConsoleLogger;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    isLevelEnabled = vi.fn(() => true);
    service = { isLevelEnabled } as unknown as LoggingServiceType;
    logger = new ConsoleLogger('Widget', service);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('delegates isLevelEnabled to the owning service', () => {
    isLevelEnabled.mockReturnValue(false);

    expect(logger.isLevelEnabled(LogLevel.Info)).toBe(false);
    expect(isLevelEnabled).toHaveBeenCalledWith(LogLevel.Info);
  });

  it.each([
    ['trace', LogLevel.Trace, 'TRACE'],
    ['debug', LogLevel.Debug, 'DEBUG'],
    ['info', LogLevel.Info, 'INFO'],
    ['warn', LogLevel.Warn, 'WARN'],
    ['error', LogLevel.Error, 'ERROR'],
  ] as const)('logs at the %s level with the message and extra args', (method, level, levelName) => {
    logger[method]('hello', 1, { a: 2 });

    expect(isLevelEnabled).toHaveBeenCalledWith(level);
    expect(consoleLog).toHaveBeenCalledTimes(1);
    const [formatted, ...args] = consoleLog.mock.calls[0];
    expect(formatted).toContain(levelName);
    expect(formatted).toContain('Widget');
    expect(formatted).toContain('hello');
    expect(args).toEqual([1, { a: 2 }]);
  });

  it('does not log when the level is disabled', () => {
    isLevelEnabled.mockReturnValue(false);

    logger.info('suppressed');

    expect(consoleLog).not.toHaveBeenCalled();
  });
});
