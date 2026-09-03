import { type TabContext } from 'extension/tab/tab-context.schema';
import { type Tab } from 'extension/tab/tab.model';

/**
 * Builds a {@link Tab} with sensible defaults, overridable per test.
 *
 * The two properties that make a `browser.tabs.Tab` a {@link Tab} (a numeric `id` and a string `url`) are always
 * present unless a test explicitly overrides them, so the result is a valid `Tab` by construction. Additional
 * `browser.tabs.Tab` fields are supplied to cover the members production code reads (e.g. `title`, `active`).
 */
export const createTab = (overrides: Partial<Tab> = {}): Tab =>
  ({
    active: true,
    favIconUrl: 'https://www.example.com/favicon.ico',
    id: 1,
    index: 0,
    title: 'Example Page',
    url: 'https://www.example.com/',
    windowId: 1,
    ...overrides,
  }) as Tab;

/**
 * Builds a fully-populated {@link TabContext}, overridable per test.
 *
 * Mirrors the deterministic default used by `template-context-manager.factory`, so a `tab/` test and a template
 * context entry test agree on the shape of the context gathered from a page.
 */
export const createTabContext = (overrides: Partial<TabContext> = {}): TabContext => ({
  characterSet: 'UTF-8',
  cookiesEnabled: true,
  html: '<html></html>',
  images: [],
  javaEnabled: false,
  lastModified: '2024-01-01T00:00:00.000Z',
  links: [],
  meta: {},
  plugins: [],
  referrer: '',
  screenColorDepth: 24,
  screenSize: { height: 1080, width: 1920 },
  scripts: [],
  selection: { html: '', images: [], links: [], text: '' },
  size: { height: 800, width: 1280 },
  storage: { local: {}, session: {} },
  styleSheets: [],
  text: '',
  ...overrides,
});
