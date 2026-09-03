import {
  type BrowserContext,
  chromium,
  expect as baseExpect,
  type Page,
  test as base,
  type Worker,
} from '@playwright/test';
import { EXTENSION_PATH, FIXTURE_BASE_URL } from '../playwright.config';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
  openExtensionPage: (path: string) => Promise<Page>;
  fixturePage: Page;
};

/**
 * Waits until the extension has finished seeding its default data.
 *
 * Seeding happens asynchronously after the service worker registers, so anything that reads templates or settings
 * before it completes sees an empty store. That surfaces as misleading, intermittent failures (an empty options grid,
 * or a content script that cannot read its template settings) rather than an obvious error.
 */
const waitForSeededData = async (serviceWorker: Worker): Promise<void> => {
  await baseExpect
    .poll(async () => Object.keys(await serviceWorker.evaluate(() => chrome.storage.sync.get())).length)
    .toBeGreaterThan(0);
};

/**
 * Playwright fixtures that launch Chromium with the unpacked extension loaded and expose its runtime identity.
 *
 * A Manifest V3 extension can only be loaded into a **persistent** context — `browser.newContext()` cannot load one —
 * and the extension ID is assigned at load time, so it has to be discovered rather than hard-coded.
 */
export const test = base.extend<ExtensionFixtures>({
  // Playwright requires a destructuring pattern here to detect fixture dependencies, so the empty pattern is load
  // bearing and cannot be replaced with an ignored parameter name.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      // `channel: 'chromium'` selects the full browser rather than the headless shell, which cannot load extensions.
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });

    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    // The MV3 background service worker may already have started before the fixture runs, so check for an existing
    // one before waiting for the event, otherwise the wait can hang forever.
    const [existing] = context.serviceWorkers();
    const serviceWorker = existing ?? (await context.waitForEvent('serviceworker'));

    await use(serviceWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    // Service worker URLs look like `chrome-extension://<id>/lib/worker/background.js`
    const extensionId = new URL(serviceWorker.url()).host;

    await use(extensionId);
  },

  openExtensionPage: async ({ context, extensionId, serviceWorker }, use) => {
    await use(async (path: string) => {
      await waitForSeededData(serviceWorker);

      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/${path}`);

      return page;
    });
  },

  /**
   * A regular web page the extension is allowed to inject into, opened only once the extension has finished seeding
   * its default data.
   *
   * Clipboard permissions are granted here because every meaningful copy assertion needs to read the clipboard back.
   */
  fixturePage: async ({ context, serviceWorker }, use) => {
    await waitForSeededData(serviceWorker);

    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: FIXTURE_BASE_URL });

    const page = await context.newPage();
    await page.goto(`${FIXTURE_BASE_URL}/index.html`);
    await page.bringToFront();

    await use(page);
  },
});

export const expect = test.expect;

/** Reads the system clipboard through `page`, which must have been granted clipboard permissions. */
export const readClipboard = (page: Page): Promise<string> => page.evaluate(() => navigator.clipboard.readText());
