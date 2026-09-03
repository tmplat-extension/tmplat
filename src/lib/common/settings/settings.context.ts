import { createContext, useContext } from 'react';
import { SettingsService } from 'extension/common/settings/settings.service';

export const SettingsContext = createContext<SettingsService>({} as SettingsService);

export function useSettings(): SettingsService {
  return useContext(SettingsContext);
}
