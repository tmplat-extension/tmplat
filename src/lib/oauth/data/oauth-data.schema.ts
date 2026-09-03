import Joi from 'joi';
import { getEnumStringValues } from 'extension/common/enum.utils';
import { OAuthData, OAuthDataProvider } from 'extension/oauth/data/oauth-data.model';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';

export const oauthDataProviderSchema = Joi.object<OAuthDataProvider>({
  accessToken: Joi.string().min(1).allow(null),
  principal: Joi.string().min(1).allow(null),
});

export const oauthDataProvidersSchema = Joi.object<Record<OAuthProviderName, OAuthDataProvider>>(
  Object.fromEntries(getEnumStringValues(OAuthProviderName).map((name) => [name, oauthDataProviderSchema.required()])),
);

export const oauthDataSchema = Joi.object<OAuthData>({
  providers: oauthDataProvidersSchema.required(),
});
