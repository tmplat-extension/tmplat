import Joi from 'joi';

import { getEnumStringValues } from 'extension/common/enum.utils';
import {
  UrlShortenerData,
  UrlShortenerDataBitlyProvider,
  UrlShortenerDataProviders,
  UrlShortenerDataYourlsProvider,
} from 'extension/url-shortener/data/url-shortener-data.model';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export const urlShortenerDataBitlyProviderSchema = Joi.object<UrlShortenerDataBitlyProvider>({
  enabled: Joi.boolean().required(),
});

export const urlShortenerDataYourlsProviderSchema = Joi.object<UrlShortenerDataYourlsProvider>({
  authenticationMode: Joi.string()
    .valid(null, ...getEnumStringValues(YourlsAuthenticationMode))
    .required(),
  enabled: Joi.boolean().required(),
  password: Joi.string().min(1).allow(null).required(),
  signature: Joi.string().min(1).allow(null).required(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(null)
    .required(),
  username: Joi.string().min(1).allow(null).required(),
});

export const urlShortenerDataProvidersSchema = Joi.object<UrlShortenerDataProviders>({
  bitly: urlShortenerDataBitlyProviderSchema.required(),
  yourls: urlShortenerDataYourlsProviderSchema.required(),
});

export const urlShortenerDataSchema = Joi.object<UrlShortenerData>({
  providers: urlShortenerDataProvidersSchema.required(),
});
