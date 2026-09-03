import { createContext, useContext } from 'react';
import { type OAuthService } from 'extension/oauth/oauth.service';

export const OAuthContext = createContext<OAuthService>({} as OAuthService);

export const useOAuth = (): OAuthService => useContext(OAuthContext);
