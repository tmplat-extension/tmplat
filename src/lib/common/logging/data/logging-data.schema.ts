import { z } from 'zod';
import { LogLevel } from 'extension/common/logging/log-level.enum';

export const LoggingDataSchema = z
  .object({
    enabled: z.boolean(),
    level: z.enum(LogLevel),
  })
  .meta({ id: 'LoggingData' });

export type LoggingData = z.infer<typeof LoggingDataSchema>;
