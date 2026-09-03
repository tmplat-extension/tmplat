import { z } from 'zod';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';

export const OAuthProviderConfigSchema = z
  .object({
    accessToken: z.string().nonempty().nullable(),
    principal: z.string().nonempty().nullable(),
  })
  .meta({ id: 'OAuthProviderConfig' });

export type OAuthProviderConfig = z.infer<typeof OAuthProviderConfigSchema>;

export const OAuthProviderConfigsSchema = z
  .record(z.enum(OAuthProviderName), OAuthProviderConfigSchema)
  .meta({ id: 'OAuthProviderConfigs' });

export type OAuthProviderConfigs = z.infer<typeof OAuthProviderConfigsSchema>;

export const OAuthDataSchema = z
  .object({
    providers: OAuthProviderConfigsSchema,
  })
  .meta({ id: 'OAuthData' });

export type OAuthData = z.infer<typeof OAuthDataSchema>;
