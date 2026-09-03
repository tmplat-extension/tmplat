import { z } from 'zod';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

const LegacyOptionalStringSchema = z
  .string()
  .transform((v) => v || null)
  .nullable()
  .optional();

export const LegacyUrlShortenerYourlsProviderDataSchema = z
  .object({
    authentication: z
      .union([z.literal(''), z.enum(YourlsAuthenticationMode)])
      .transform((v) => v || null)
      .nullable()
      .optional(),
    enabled: z.boolean().optional(),
    password: LegacyOptionalStringSchema,
    signature: LegacyOptionalStringSchema,
    url: z
      .union([z.literal(''), z.url({ protocol: /^https?$/ })])
      .transform((v) => v || null)
      .nullable()
      .optional(),
    username: LegacyOptionalStringSchema,
  })
  .meta({ id: 'LegacyUrlShortenerYourlsProviderData' });

export type LegacyUrlShortenerYourlsProviderData = z.infer<typeof LegacyUrlShortenerYourlsProviderDataSchema>;
