export interface Logger {
  count(...labels: LoggerLabel[]): void;

  countAndAwait(...labels: LoggerLabel[]): Promise<void>;

  countReset(...labels: LoggerLabel[]): void;

  countResetAndAwait(...labels: LoggerLabel[]): Promise<void>;

  debug(...data: LoggerData[]): void;

  debugAndAwait(...data: LoggerData[]): Promise<void>;

  dir(...data: LoggerData[]): void;

  dirAndAwait(...data: LoggerData[]): Promise<void>;

  error(...data: LoggerData[]): void;

  errorAndAwait(...data: LoggerData[]): Promise<void>;

  info(...data: LoggerData[]): void;

  infoAndAwait(...data: LoggerData[]): Promise<void>;

  printStackTrace(caller?: LoggerCaller): void;

  printStackTraceAndAwait(caller?: LoggerCaller): Promise<void>;

  time(...labels: LoggerLabel[]): void;

  timeAndAwait(...labels: LoggerLabel[]): Promise<void>;

  timeEnd(...labels: LoggerLabel[]): void;

  timeEndAndAwait(...labels: LoggerLabel[]): Promise<void>;

  trace(...data: LoggerData[]): void;

  traceAndAwait(...data: LoggerData[]): Promise<void>;

  warn(...data: LoggerData[]): void;

  warnAndAwait(...data: LoggerData[]): Promise<void>;
}

export type LoggerCaller = (...args: any) => any;

export type LoggerData = any | (() => any);

export type LoggerLabel = string | undefined | (() => string | undefined);
