import { isNumber, isString } from 'es-toolkit';
import { type Tab, type TabCriteriaFilter } from 'extension/tab/tab.model';

export const filterTab = (tab: browser.tabs.Tab | undefined, filter?: TabCriteriaFilter): tab is Tab =>
  isTab(tab) && (!filter || filter(tab));

export const isTab = (tab: browser.tabs.Tab | undefined): tab is Tab =>
  tab !== undefined && isNumber(tab.id) && isString(tab.url);
