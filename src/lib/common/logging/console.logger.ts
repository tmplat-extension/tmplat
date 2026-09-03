import chalk from 'chalk';
import { getEnumStringValues, invertNumberEnum } from 'extension/common/enum.utils';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService } from 'extension/common/logging/logging.service';

const maxLogLevelNameLength = Math.max(0, ...getEnumStringValues(LogLevel).map((name) => name.length));
const formattedLogLevels = invertNumberEnum(
  LogLevel,
  (name) => ' ' + name.toUpperCase().padEnd(maxLogLevelNameLength + 1),
);

export class ConsoleLogger implements Logger {
  constructor(
    private readonly name: string,
    private readonly service: LoggingService,
  ) {}

  debug(message: string, ...args: unknown[]) {
    this.log(LogLevel.Debug, message, args);
  }

  error(message: string, ...args: unknown[]) {
    this.log(LogLevel.Error, message, args);
  }

  info(message: string, ...args: unknown[]) {
    this.log(LogLevel.Info, message, args);
  }

  trace(message: string, ...args: unknown[]) {
    this.log(LogLevel.Trace, message, args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log(LogLevel.Warn, message, args);
  }

  private log(level: LogLevel, message: string, args: unknown[]) {
    if (!this.service.isLevelEnabled(level)) {
      return;
    }

    const levelName = ConsoleLogger.formatLevelName(level);
    const name = this.formatName();
    const timestamp = ConsoleLogger.formatTimestamp();
    const formatted = `${timestamp} ${levelName} [${name}] ${message}`;

    console.log(formatted, ...args);
  }

  private formatName(): string {
    return chalk.italic(this.name);
  }

  private static formatLevelName(level: LogLevel): string {
    const formatted = formattedLogLevels[level];

    switch (level) {
      case LogLevel.Trace:
        return chalk.bgGray.black(formatted);
      case LogLevel.Debug:
        return chalk.bgBlue.whiteBright(formatted);
      case LogLevel.Info:
        return chalk.bgGreen.black(formatted);
      case LogLevel.Warn:
        return chalk.bgYellow.black(formatted);
      case LogLevel.Error:
        return chalk.bgRed.whiteBright(formatted);
    }
  }

  private static formatTimestamp(): string {
    const formatted = new Date().toISOString();

    return chalk.gray(formatted);
  }
}
