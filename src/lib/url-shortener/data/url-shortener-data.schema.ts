import Joi from 'joi';
import { getEnumStringValues } from 'extension/common/enum.utils';
import {
  UrlShortenerData,
  UrlShortenerDataBitlyProvider,
  UrlShortenerDataDaGdProvider,
  UrlShortenerDataProviders,
  UrlShortenerDataSpooMeProvider,
  UrlShortenerDataYourlsProvider,
} from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export const urlShortenerDataBitlyProviderSchema = Joi.object<UrlShortenerDataBitlyProvider>({});

export const urlShortenerDataDaGdProviderSchema = Joi.object<UrlShortenerDataDaGdProvider>({});

export const urlShortenerDataSpooMeProviderSchema = Joi.object<UrlShortenerDataSpooMeProvider>({});

export const urlShortenerDataYourlsProviderSchema = Joi.object<UrlShortenerDataYourlsProvider>({
  authenticationMode: Joi.string()
    .valid(null, ...getEnumStringValues(YourlsAuthenticationMode))
    .required(),
  password: Joi.string().min(1).allow(null).required(),
  signature: Joi.string().min(1).allow(null).required(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(null)
    .required(),
  username: Joi.string().min(1).allow(null).required(),
});

export const urlShortenerDataProvidersSchema = Joi.object<UrlShortenerDataProviders>({
  [UrlShortenerProviderName.Bitly]: urlShortenerDataBitlyProviderSchema.required(),
  [UrlShortenerProviderName.DaGd]: urlShortenerDataDaGdProviderSchema.required(),
  [UrlShortenerProviderName.SpooMe]: urlShortenerDataSpooMeProviderSchema.required(),
  [UrlShortenerProviderName.Yourls]: urlShortenerDataYourlsProviderSchema.required(),
});

export const urlShortenerDataSchema = Joi.object<UrlShortenerData>({
  provider: Joi.string()
    .valid(...getEnumStringValues(UrlShortenerProviderName))
    .required(),
  providers: urlShortenerDataProvidersSchema.required(),
});
