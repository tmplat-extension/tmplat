export type Tab = chrome.tabs.Tab & {
  id: number;
  url: string;
};

export type TabContext = {
  readonly characterSet: string;
  readonly cookiesEnabled: boolean;
  readonly html: string;
  readonly images: readonly string[];
  readonly javaEnabled: boolean;
  readonly lastModified: string;
  readonly links: readonly string[];
  readonly meta: TabContextDictionary;
  readonly referrer: string;
  readonly screenColorDepth: number;
  readonly scripts: readonly string[];
  readonly selection: TabContextSelection;
  readonly size: TabContextDimension;
  readonly storage: TabContextStorage;
  readonly styleSheets: readonly string[];
};

export type TabContextDictionary = Readonly<Record<string, string | undefined>>;

export type TabContextDimension = {
  readonly height: number;
  readonly width: number;
};

export type TabContextSelection = {
  readonly images: readonly string[];
  readonly links: readonly string[];
  readonly html: string;
  readonly text: string;
};

export type TabContextStorage = {
  readonly local: TabContextDictionary;
  readonly session: TabContextDictionary;
};

export type TabCriteria = {
  filter?: TabCriteriaFilter;
  query?: chrome.tabs.QueryInfo;
};

export type TabCriteriaFilter = (tab: Tab) => boolean;
