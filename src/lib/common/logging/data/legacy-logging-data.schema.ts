import { z } from 'zod';
import { LogLevel } from 'extension/common/logging/log-level.enum';

export const LegacyLoggerDataSchema = z
  .object({
    enabled: z.boolean().optional(),
    level: z
      .preprocess(
        (value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value),
        z.enum(LogLevel),
      )
      .optional(),
  })
  .meta({ id: 'LegacyLoggerData' });

export type LegacyLoggerData = z.infer<typeof LegacyLoggerDataSchema>;
