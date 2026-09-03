import { z } from 'zod';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';

export const OAuthDataProviderSchema = z
  .object({
    accessToken: z.string().nonempty().nullable(),
    principal: z.string().nonempty().nullable(),
  })
  .meta({ id: 'OAuthDataProvider' });

export type OAuthDataProvider = z.infer<typeof OAuthDataProviderSchema>;

export const OAuthDataProvidersSchema = z
  .record(z.enum(OAuthProviderName), OAuthDataProviderSchema)
  .meta({ id: 'OAuthDataProviders' });

export type OAuthDataProviders = z.infer<typeof OAuthDataProvidersSchema>;

export const OAuthDataSchema = z
  .object({
    providers: OAuthDataProvidersSchema,
  })
  .meta({ id: 'OAuthData' });

export type OAuthData = z.infer<typeof OAuthDataSchema>;
