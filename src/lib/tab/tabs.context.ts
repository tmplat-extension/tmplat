import { createContext, useContext } from 'react';
import { type TabService } from 'extension/tab/tab.service';

export const TabsContext = createContext<TabService>({} as TabService);

export const useTabs = (): TabService => useContext(TabsContext);
