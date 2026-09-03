import { type Mock, vi } from 'vitest';
import { type Logger } from 'extension/common/logging/logger';

/**
 * Creates a {@link Logger} whose methods are all spies, allowing tests to assert that (and how) code under test logged
 * without polluting the test output.
 *
 * `isLevelEnabled` returns `true` by default, matching the extension's default logging configuration. Override it
 * where a test needs to cover behavior when logging is disabled.
 */
export const createLoggerMock = (): LoggerMock => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  isLevelEnabled: vi.fn(() => true),
  trace: vi.fn(),
  warn: vi.fn(),
});

/**
 * Creates a fake `LoggingService` that hands out `logger` for every name, so a test can assert on what the code
 * under test logged without needing to know the logger name it asked for.
 */
export const createLoggingServiceMock = (logger: LoggerMock = createLoggerMock()): LoggingServiceMock => ({
  getLogger: vi.fn(() => logger),
  logger,
});

export type LoggerMock = {
  [K in keyof Logger]: Mock<Logger[K]>;
};

export type LoggingServiceMock = {
  getLogger: Mock<(name: string) => Logger>;
  logger: LoggerMock;
};
