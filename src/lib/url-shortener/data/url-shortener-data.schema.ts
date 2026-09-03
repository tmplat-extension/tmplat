import { z } from 'zod';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export const UrlShortenerDaGdProviderConfigSchema = z.object({}).meta({ id: 'UrlShortenerDaGdProviderConfig' });

export type UrlShortenerDaGdProviderConfig = z.infer<typeof UrlShortenerDaGdProviderConfigSchema>;

export const UrlShortenerSpooMeProviderConfigSchema = z.object({}).meta({ id: 'UrlShortenerSpooMeProviderConfig' });

export type UrlShortenerSpooMeProviderConfig = z.infer<typeof UrlShortenerSpooMeProviderConfigSchema>;

export const UrlShortenerYourlsProviderConfigSchema = z
  .object({
    authenticationMode: z.enum(YourlsAuthenticationMode).nullable(),
    password: z.string().nonempty().nullable(),
    signature: z.string().nonempty().nullable(),
    url: z.url({ protocol: /^https?$/ }).nullable(),
    username: z.string().nonempty().nullable(),
  })
  .meta({ id: 'UrlShortenerYourlsProviderConfig' });

export type UrlShortenerYourlsProviderConfig = z.infer<typeof UrlShortenerYourlsProviderConfigSchema>;

export const UrlShortenerProviderConfigSchema = z
  .union([
    UrlShortenerDaGdProviderConfigSchema,
    UrlShortenerSpooMeProviderConfigSchema,
    UrlShortenerYourlsProviderConfigSchema,
  ])
  .meta({ id: 'UrlShortenerProviderConfig' });

export type UrlShortenerProviderConfig = z.infer<typeof UrlShortenerProviderConfigSchema>;

export const UrlShortenerProviderConfigsSchema = z
  .object({
    [UrlShortenerProviderName.DaGd]: UrlShortenerDaGdProviderConfigSchema,
    [UrlShortenerProviderName.SpooMe]: UrlShortenerSpooMeProviderConfigSchema,
    [UrlShortenerProviderName.Yourls]: UrlShortenerYourlsProviderConfigSchema,
  })
  .meta({ id: 'UrlShortenerProviderConfigs' });

export type UrlShortenerProviderConfigs = z.infer<typeof UrlShortenerProviderConfigsSchema>;

export const UrlShortenerDataSchema = z
  .object({
    provider: z.enum(UrlShortenerProviderName),
    providers: UrlShortenerProviderConfigsSchema,
  })
  .meta({ id: 'UrlShortenerData' });

export type UrlShortenerData = z.infer<typeof UrlShortenerDataSchema>;
