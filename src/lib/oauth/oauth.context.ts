import { createContext, useContext } from 'react';
import { OAuthService } from 'extension/oauth/oauth.service';

export const OAuthContext = createContext<OAuthService>({} as OAuthService);

export function useOAuth(): OAuthService {
  return useContext(OAuthContext);
}
