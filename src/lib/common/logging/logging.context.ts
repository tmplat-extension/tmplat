import { createContext, useContext } from 'react';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService } from 'extension/common/logging/logging.service';

export const LoggingContext = createContext<LoggingService>({} as LoggingService);

export const useLogger = (name: string): Logger => useLogging().getLogger(`UI.${name}`);

export const useLogging = (): LoggingService => useContext(LoggingContext);
