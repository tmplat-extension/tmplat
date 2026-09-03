export type Tab = browser.tabs.Tab & {
  id: number;
  url: string;
};

export type TabCriteria = {
  filter?: TabCriteriaFilter;
  query?: browser.tabs.QueryInfo;
};

export type TabCriteriaFilter = (tab: Tab) => boolean;
