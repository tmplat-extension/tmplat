import { z } from 'zod';

export const LegacyOAuthProviderDataSchema = z
  .object({
    accessToken: z.string().nonempty().nullable().optional(),
    login: z.string().nonempty().nullable().optional(),
  })
  .meta({ id: 'LegacyOAuthProviderData' });

export type LegacyOAuthProviderData = z.infer<typeof LegacyOAuthProviderDataSchema>;
