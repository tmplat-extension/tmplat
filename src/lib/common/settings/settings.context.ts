import { createContext, useContext } from 'react';
import { type SettingsService } from 'extension/common/settings/settings.service';

export const SettingsContext = createContext<SettingsService>({} as SettingsService);

export const useSettings = (): SettingsService => useContext(SettingsContext);
