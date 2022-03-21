import { createContext, useContext } from 'react';

import { TabService } from 'extension/tab/tab.service';

export const TabsContext = createContext<TabService>({} as TabService);

export function useTabs(): TabService {
  return useContext(TabsContext);
}
