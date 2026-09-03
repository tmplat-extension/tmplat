import { isNumber, isString, isUndefined } from 'extension/common/type.utils';
import { Tab, TabCriteriaFilter } from 'extension/tab/tab.model';

export function filterTab(tab: browser.tabs.Tab | undefined, filter?: TabCriteriaFilter): tab is Tab {
  return isTab(tab) && (!filter || filter(tab));
}

export function isTab(tab: browser.tabs.Tab | undefined): tab is Tab {
  return !isUndefined(tab) && isNumber(tab.id) && isString(tab.url);
}
