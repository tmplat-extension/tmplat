import { createContext, useContext } from 'react';
import { type AppearanceService } from 'extension/common/appearance/appearance.service';

export const AppearanceContext = createContext<AppearanceService>({} as AppearanceService);

export const useAppearance = (): AppearanceService => useContext(AppearanceContext);
