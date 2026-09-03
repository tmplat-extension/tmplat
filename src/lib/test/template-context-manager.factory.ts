import { isPlainObject } from 'es-toolkit';
import TmplatMustache from 'tmplat-mustache';
import { vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type GeolocationCoords } from 'extension/common/geolocation/geolocation.schema';
import { type GeolocationService } from 'extension/common/geolocation/geolocation.service';
import { type IntlService } from 'extension/common/intl/intl.service';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type MarkdownService } from 'extension/common/markdown/markdown.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type TabContentMessageOutput } from 'extension/tab/message/tab-content-message.schema';
import { type TabContext } from 'extension/tab/tab-context.schema';
import { type Tab } from 'extension/tab/tab.model';
import { type TabService } from 'extension/tab/tab.service';
import { type TemplateContextData } from 'extension/template/context/template-context-data.model';
import {
  TemplateContextManager,
  type TemplateContextManagerConfig,
} from 'extension/template/context/template-context-manager';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { type UrlShortenerService } from 'extension/url-shortener/url-shortener.service';

const DEFAULT_URL = 'https://john:secret@www.example.com:8080/path/to/page.html?foo=bar&baz=qux#section';

type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Options for building a {@link TemplateContextManager} over cheap fakes.
 *
 * Every field is optional; unset fields fall back to a deterministic default so that a test only has to declare the
 * inputs that matter to the entry it is exercising.
 */
export type TestTemplateContextManagerOptions = {
  readonly cookies?: Readonly<Record<string, string>>;
  readonly coords?: GeolocationCoords;
  readonly data?: DeepPartial<TemplateContextData>;
  readonly locale?: string;
  readonly markdown?: (html: string, options?: { readonly inline?: boolean }) => string | Promise<string>;
  readonly shortUrl?: string | ((url: string) => string | Promise<string>);
  readonly tab?: Partial<Tab>;
  readonly tabContent?: TabContentMessageOutput['output'] | (() => Promise<TabContentMessageOutput['output']>);
  readonly tabContext?: DeepPartial<TabContext>;
  readonly tabs?: readonly Partial<Tab>[];
  readonly template?: Partial<Template>;
  readonly url?: string | URL;
  readonly version?: string;
};

export type TestTemplateContextHarness = {
  readonly convert: ReturnType<typeof vi.fn>;
  readonly findAllTabs: ReturnType<typeof vi.fn>;
  readonly getCoords: ReturnType<typeof vi.fn>;
  readonly getTabContent: ReturnType<typeof vi.fn>;
  readonly getTabContext: ReturnType<typeof vi.fn>;
  readonly manager: TemplateContextManager;
  readonly render: (template: string) => Promise<string>;
  readonly shorten: ReturnType<typeof vi.fn>;
};

const buildDefaultData = (): TemplateContextData => ({
  [DataNamespace.Analytics]: { clientId: '00000000-0000-0000-0000-000000000000', enabled: false },
  [DataNamespace.Legacy]: {},
  [DataNamespace.Logging]: { enabled: false, level: LogLevel.Error },
  [DataNamespace.Migration]: { versions: [] },
  [DataNamespace.Notification]: {
    changelog: { enabled: true, scope: VersionSegment.Minor },
    enabled: true,
  },
  [DataNamespace.OAuth]: { providers: { bitly: { accessToken: null, principal: null } } },
  [DataNamespace.Template]: {
    action: {
      mode: TemplateActionMode.Popup,
      popup: { autoCloseEnabled: true, optionLinkEnabled: true },
      templateId: null,
    },
    contextMenu: {
      autoPasteEnabled: false,
      enabled: true,
      mode: TemplateContextMenuMode.Menu,
      optionLinkEnabled: true,
    },
    link: { target: true, title: true },
    markdown: { inline: false },
    shortcuts: { autoPasteEnabled: false, enabled: true },
    templates: [],
  },
  [DataNamespace.UrlShortener]: {
    provider: UrlShortenerProviderName.DaGd,
    providers: {
      bitly: {},
      dagd: {},
      spoome: {},
      yourls: {
        authenticationMode: null,
        password: null,
        signature: null,
        url: null,
        username: null,
      },
    },
  },
});

const buildDefaultTabContext = (): TabContext => ({
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
});

const deepMerge = <T>(base: T, override: DeepPartial<T> | undefined): T => {
  if (override === undefined) {
    return base;
  }
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override as T;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = deepMerge((base as Record<string, unknown>)[key], value as never);
  }

  return result as T;
};

const buildTab = (url: string, overrides: Partial<Tab> = {}): Tab =>
  ({
    active: true,
    favIconUrl: 'https://www.example.com/favicon.ico',
    id: 1,
    index: 0,
    title: 'Example Page',
    url,
    ...overrides,
  }) as Tab;

const buildTemplate = (overrides: Partial<Template> = {}): Template =>
  ({
    content: '{url}',
    description: 'A test template',
    enabled: true,
    id: 'template-1',
    predefined: false,
    shortcut: null,
    title: 'Test Template',
    ...overrides,
  }) as Template;

/**
 * Builds a real {@link TemplateContextManager} wired over lightweight fakes.
 *
 * A real manager is used (rather than a hand-mocked one) so that caching, the URL stack, option/template building and
 * the render helpers are all genuinely exercised — only its collaborators are faked. Constructing it eagerly renders
 * every registered entry, so this alone smoke-tests the outer render function of all ~250 definitions.
 */
export const createTestTemplateContextManager = (
  options: TestTemplateContextManagerOptions = {},
): TestTemplateContextHarness => {
  const url = options.url instanceof URL ? options.url : new URL(options.url ?? DEFAULT_URL);
  const tab = buildTab(options.tab?.url ?? url.href, options.tab);
  const template = buildTemplate(options.template);

  const data = deepMerge(buildDefaultData(), options.data);
  const dataService = {
    local: new FakeDataStorage(data as unknown as Record<string, unknown>),
    sync: new FakeDataStorage(),
  } as unknown as DataService;

  const extensionInfo = {
    getVersion: vi.fn(() => options.version ?? '2.0.0'),
  } as unknown as ExtensionInfo;

  const getCoords = vi.fn(async () => options.coords);
  const geolocationService = { getCoords } as unknown as GeolocationService;

  const intl = {
    getLocale: vi.fn(async () => options.locale ?? 'en-US'),
  } as unknown as IntlService;

  const convert = vi.fn(async (html: string, opts?: { readonly inline?: boolean }) =>
    options.markdown ? options.markdown(html, opts) : `markdown:${html}`,
  );
  const markdownService = { convert } as unknown as MarkdownService;

  const tabContext = deepMerge(buildDefaultTabContext(), options.tabContext);
  const getTabContext = vi.fn(async () => tabContext);
  const getTabContent = vi.fn(async () =>
    typeof options.tabContent === 'function' ? options.tabContent() : (options.tabContent ?? ''),
  );
  const findAllTabs = vi.fn(async () => (options.tabs ?? [tab]).map((entry) => buildTab(entry.url ?? url.href, entry)));
  const tabService = { findAllTabs, getTabContent, getTabContext } as unknown as TabService;

  const templateService = {
    getTemplateDescription: vi.fn((value: Template) => (value as { description?: string }).description ?? null),
    getTemplateTitle: vi.fn((value: Template) => (value as { title?: string }).title ?? ''),
  } as unknown as TemplateService;

  const shorten = vi.fn(async (value: string | URL) => {
    const input = value.toString();
    if (typeof options.shortUrl === 'function') {
      return options.shortUrl(input);
    }

    return options.shortUrl ?? `https://short.test/${encodeURIComponent(input)}`;
  });
  const urlShortenerService = { shorten } as unknown as UrlShortenerService;

  if (options.cookies) {
    const cookies = Object.entries(options.cookies).map(([name, value]) => ({ name, value }));
    getBrowserApiMock().cookies.getAll.mockResolvedValue(cookies);
  }

  const config: TemplateContextManagerConfig = { tab, template, url };
  const manager = new TemplateContextManager(
    config,
    dataService,
    extensionInfo,
    geolocationService,
    intl,
    markdownService,
    tabService,
    templateService,
    urlShortenerService,
  );

  return {
    convert,
    findAllTabs,
    getCoords,
    getTabContent,
    getTabContext,
    manager,
    render: (source: string) => TmplatMustache.render(source, manager.context) as Promise<string>,
    shorten,
  };
};
