import { createContext, useContext } from 'react';
import { AppearanceService } from 'extension/common/appearance/appearance.service';

export const AppearanceContext = createContext<AppearanceService>({} as AppearanceService);

export function useAppearance(): AppearanceService {
  return useContext(AppearanceContext);
}
