import { z } from 'zod';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export const UrlShortenerDataBitlyProviderSchema = z.object({}).meta({ id: 'UrlShortenerDataBitlyProvider' });

export type UrlShortenerDataBitlyProvider = z.infer<typeof UrlShortenerDataBitlyProviderSchema>;

export const UrlShortenerDataDaGdProviderSchema = z.object({}).meta({ id: 'UrlShortenerDataDaGdProvider' });

export type UrlShortenerDataDaGdProvider = z.infer<typeof UrlShortenerDataDaGdProviderSchema>;

export const UrlShortenerDataSpooMeProviderSchema = z.object({}).meta({ id: 'UrlShortenerDataSpooMeProvider' });

export type UrlShortenerDataSpooMeProvider = z.infer<typeof UrlShortenerDataSpooMeProviderSchema>;

export const UrlShortenerDataYourlsProviderSchema = z
  .object({
    authenticationMode: z.enum(YourlsAuthenticationMode).nullable(),
    password: z.string().nonempty().nullable(),
    signature: z.string().nonempty().nullable(),
    url: z.httpUrl().nullable(),
    username: z.string().nonempty().nullable(),
  })
  .meta({ id: 'UrlShortenerDataYourlsProvider' });

export type UrlShortenerDataYourlsProvider = z.infer<typeof UrlShortenerDataYourlsProviderSchema>;

export const UrlShortenerDataProviderSchema = z.union([
  UrlShortenerDataBitlyProviderSchema,
  UrlShortenerDataDaGdProviderSchema,
  UrlShortenerDataSpooMeProviderSchema,
  UrlShortenerDataYourlsProviderSchema,
]);

export type UrlShortenerDataProvider = z.infer<typeof UrlShortenerDataProviderSchema>;

export const UrlShortenerDataProvidersSchema = z
  .object({
    [UrlShortenerProviderName.Bitly]: UrlShortenerDataBitlyProviderSchema,
    [UrlShortenerProviderName.DaGd]: UrlShortenerDataDaGdProviderSchema,
    [UrlShortenerProviderName.SpooMe]: UrlShortenerDataSpooMeProviderSchema,
    [UrlShortenerProviderName.Yourls]: UrlShortenerDataYourlsProviderSchema,
  })
  .meta({ id: 'UrlShortenerDataProviders' });

export type UrlShortenerDataProviders = z.infer<typeof UrlShortenerDataProvidersSchema>;

export const UrlShortenerDataSchema = z
  .object({
    provider: z.enum(UrlShortenerProviderName),
    providers: UrlShortenerDataProvidersSchema,
  })
  .meta({ id: 'UrlShortenerData' });

export type UrlShortenerData = z.infer<typeof UrlShortenerDataSchema>;
