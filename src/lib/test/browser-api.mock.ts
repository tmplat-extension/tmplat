import { vi } from 'vitest';

/**
 * The shape of the callback that production code registers via `browser.runtime.onMessage.addListener`. Returning
 * `true` keeps the message channel open so that `sendResponse` can be called asynchronously.
 */
export type RuntimeOnMessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

/**
 * Creates a minimal fake of the WebExtensions API surface that is reachable from unit-testable code.
 *
 * Only the members that are actually needed by the modules under test are faked. Add more as tests expand into code
 * that touches other parts of the API.
 */
export const createBrowserApiMock = () => ({
  action: {
    onClicked: {
      addListener: vi.fn<(listener: (tab: unknown) => void) => void>(),
      removeListener: vi.fn<(listener: (tab: unknown) => void) => void>(),
    },
    setPopup: vi.fn<(details: { popup: string }) => Promise<void>>(async () => undefined),
  },
  contextMenus: {
    ContextType: { ALL: 'all' },
    create: vi.fn<(properties: Record<string, unknown>, callback?: () => void) => string | number>(
      (_properties, callback) => {
        callback?.();
        return 'menu-id';
      },
    ),
    onClicked: {
      addListener: vi.fn<(listener: (info: unknown, tab?: unknown) => void) => void>(),
      removeListener: vi.fn<(listener: (info: unknown, tab?: unknown) => void) => void>(),
    },
    removeAll: vi.fn<() => Promise<void>>(async () => undefined),
  },
  cookies: {
    getAll: vi.fn<(details: { url: string }) => Promise<{ name: string; value: string }[]>>(async () => []),
  },
  i18n: {
    getAcceptLanguages: vi.fn<() => Promise<string[]>>(async () => []),
    getMessage: vi.fn<(key: string, substitutions?: string[]) => string>(() => ''),
    getUILanguage: vi.fn<() => string>(() => 'en'),
  },
  identity: {
    getRedirectURL: vi.fn<() => string>(() => 'https://test-extension-id.chromiumapp.org/'),
    launchWebAuthFlow: vi.fn<(details: { interactive: boolean; url: string }) => Promise<string | undefined>>(),
  },
  offscreen: {
    closeDocument: vi.fn<() => Promise<void>>(async () => undefined),
    createDocument: vi.fn<(parameters: Record<string, unknown>) => Promise<void>>(async () => undefined),
  },
  runtime: {
    getContexts: vi.fn<(filter: Record<string, unknown>) => Promise<{ contextType: string }[]>>(async () => []),
    getManifest: vi.fn(() => ({ version: '0.0.0' })),
    id: 'test-extension-id',
    onMessage: {
      addListener: vi.fn<(listener: RuntimeOnMessageListener) => void>(),
      hasListener: vi.fn<(listener: RuntimeOnMessageListener) => boolean>(() => false),
      removeListener: vi.fn<(listener: RuntimeOnMessageListener) => void>(),
    },
    lastError: undefined as { message?: string } | undefined,
    openOptionsPage: vi.fn<() => Promise<void>>(async () => undefined),
    sendMessage: vi.fn<(message: unknown) => Promise<unknown>>(),
  },
  scripting: {
    executeScript: vi.fn<(injection: Record<string, unknown>) => Promise<{ result?: unknown }[]>>(async () => []),
  },
  tabs: {
    create: vi.fn<(properties: Record<string, unknown>) => Promise<unknown>>(async () => ({})),
    get: vi.fn<(tabId: number) => Promise<unknown>>(async () => ({})),
    getCurrent: vi.fn<() => Promise<unknown>>(async () => undefined),
    query: vi.fn<(queryInfo: Record<string, unknown>) => Promise<unknown[]>>(async () => []),
    sendMessage: vi.fn<(tabId: number, message: unknown) => Promise<unknown>>(),
  },
});

let currentMock: BrowserApiMock | undefined;

/**
 * Returns the {@link BrowserApiMock} installed for the current test so that its behavior can be configured and its
 * calls asserted on.
 */
export const getBrowserApiMock = (): BrowserApiMock => {
  if (!currentMock) {
    throw new Error('No browser API mock has been installed for the current test');
  }

  return currentMock;
};

/**
 * Installs a fresh {@link BrowserApiMock} as both the `chrome` and `browser` globals.
 *
 * This is called automatically before every test (see `extension/test/setup`), so tests only need to call
 * {@link getBrowserApiMock} to configure it.
 */
export const installBrowserApiMock = (): BrowserApiMock => {
  currentMock = createBrowserApiMock();

  vi.stubGlobal('chrome', currentMock);
  vi.stubGlobal('browser', currentMock);

  return currentMock;
};

export type BrowserApiMock = ReturnType<typeof createBrowserApiMock>;
