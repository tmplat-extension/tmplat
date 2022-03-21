import { isNumber, isString, isUndefined } from 'lodash-es';

import { Tab, TabCriteriaFilter } from 'extension/tab/tab.model';

export function filterTab(tab: chrome.tabs.Tab | undefined, filter?: TabCriteriaFilter): tab is Tab {
  return isTab(tab) && (!filter || filter(tab));
}

export function isTab(tab: chrome.tabs.Tab | undefined): tab is Tab {
  return !isUndefined(tab) && isNumber(tab.id) && isString(tab.url);
}
