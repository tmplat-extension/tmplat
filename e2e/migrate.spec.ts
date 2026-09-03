import { type Page, type Worker } from '@playwright/test';
import { expect, test } from './fixtures';

// The version the user is upgrading *from*. Deliberately earlier than the migration's own `1.2.9` key, which names the
// legacy data *format* rather than a version a user must have been on.
const LEGACY_VERSION = '1.2.5';

// 1.x stored templates in `localStorage` and sorted them by `index` on load (`background.coffee:2061`), maintaining
// order by swapping `index` values rather than reordering the array (`options.coffee:980-981`). So array order here is
// deliberately NOT the user's order, and the migration has to honour `index` to preserve it.
const legacyTemplates = [
  {
    content: '{url}',
    enabled: true,
    image: 'globe',
    index: 4,
    key: 'PREDEFINED.00001',
    readOnly: true,
    shortcut: 'U',
    title: 'URL',
    usage: 12,
  },
  {
    content: 'E2E {title} <{url}>',
    enabled: true,
    image: 'file',
    index: 0,
    key: 'CUSTOM.00001',
    readOnly: false,
    shortcut: 'C',
    title: 'E2E Custom',
    usage: 3,
  },
  {
    content: '{#shorten}{url}{/shorten}',
    enabled: false,
    image: 'link',
    index: 2,
    key: 'PREDEFINED.00002',
    readOnly: true,
    shortcut: 'S',
    title: 'Short URL',
    usage: 0,
  },
];

// A realistic 1.x payload. `logger.level` is a *string* because the legacy options page persisted `$(select).val()`
// verbatim, and `yourls` is the untouched default every 1.x user carried whether or not they ever configured it — both
// shapes previously failed schema validation outright.
const legacyData: Record<string, unknown> = {
  links: { target: true, title: true },
  logger: { enabled: true, level: '20' },
  templates: legacyTemplates,
  toolbar: { close: false, key: 'CUSTOM.00001', options: false, popup: false },
  yourls: {
    authentication: '',
    enabled: false,
    password: '',
    signature: '',
    url: '',
    usage: 0,
    username: '',
  },
};

/**
 * Seeds legacy 1.x data into `page`'s `localStorage`.
 *
 * `page` must already be on an extension page, since the legacy data lives on the extension's own origin rather than in
 * `chrome.storage`.
 */
const seedLegacyData = (page: Page, data: Record<string, unknown>): Promise<void> =>
  page.evaluate((entries) => {
    for (const [key, value] of entries) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, Object.entries(data));

const getLegacyKeys = (page: Page): Promise<string[]> => page.evaluate(() => Object.keys(window.localStorage));

// Drives `migrate.html` against real legacy data in the extension origin's `localStorage`. This is the only coverage of
// the upgrade path as a 1.x user actually experiences it: unit tests fake the storage, so they cannot prove that the
// page reads the same place the legacy extension wrote.
/**
 * Reads the migrated templates back in stored order.
 *
 * Templates live one per `template:item:<id>` key in local storage, ordered by `template:index`, so the order the
 * migration restores can only be asserted by resolving the index rather than by reading a single namespace.
 */
const readStoredTemplates = async (serviceWorker: Worker): Promise<{ id: string; title?: string }[]> =>
  await serviceWorker.evaluate(async () => {
    const stored = await chrome.storage.local.get();
    const order = (stored['template:index'] as string[] | undefined) ?? [];

    return order
      .map((id) => stored[`template:item:${id}`] as { id: string; title?: string } | undefined)
      .filter((template) => template != null);
  });

test.describe('migrate page', () => {
  test('migrates real 1.x data end to end', async ({ extensionId, openExtensionPage, serviceWorker }) => {
    const page = await openExtensionPage('options.html');
    await seedLegacyData(page, legacyData);

    await page.goto(`chrome-extension://${extensionId}/migrate.html?version=${LEGACY_VERSION}`);

    // The page must preview and wait, never migrate on load
    await expect(page.getByRole('heading', { name: 'Data from version 1.2.9' })).toBeVisible();
    await expect(page.getByText('Transferring templates to', { exact: false })).toBeVisible();
    expect(await getLegacyKeys(page)).toContain('templates');

    await page.getByRole('button', { name: 'Start migration' }).click();

    await expect(page.getByText('Migration complete')).toBeVisible();

    // Migrated steps delete their legacy key, so nothing should be left behind
    expect(await getLegacyKeys(page)).not.toContain('templates');
    expect(await getLegacyKeys(page)).not.toContain('yourls');

    const { template } = await serviceWorker.evaluate(() => chrome.storage.sync.get('template'));
    const templates = await readStoredTemplates(serviceWorker);
    const ids = templates.map(({ id }) => id);

    // The custom template had legacy `index` 0, so it must lead; the two predefined templates follow in `index` order
    // (2 then 4), and the templates that never existed in 1.x sort last
    expect(templates[0]).toMatchObject({ title: 'E2E Custom' });
    expect(ids.slice(1)).toEqual([
      'PREDEFINED.00002',
      'PREDEFINED.00001',
      'PREDEFINED.00003',
      'PREDEFINED.00004',
      'PREDEFINED.00005',
      'PREDEFINED.00006',
      'PREDEFINED.00007',
    ]);

    // The toolbar pointed at the legacy `CUSTOM.00001` key, which only resolves through the migration record written by
    // the templates step
    expect(template).toMatchObject({ action: { templateId: ids[0] }, link: { target: true, title: true } });

    // Legacy `'20'` is the string form of `LogLevel.Debug`, which 2.0 remaps to `LogLevel.Info` (30)
    const { logging } = await serviceWorker.evaluate(() => chrome.storage.sync.get('logging'));
    expect(logging).toMatchObject({ level: 30 });
  });

  test('reports that there is nothing left to migrate after a reload', async ({
    extensionId,
    openExtensionPage,
    serviceWorker,
  }) => {
    const page = await openExtensionPage('options.html');
    await seedLegacyData(page, legacyData);

    await page.goto(`chrome-extension://${extensionId}/migrate.html?version=${LEGACY_VERSION}`);
    await page.getByRole('button', { name: 'Start migration' }).click();
    await expect(page.getByText('Migration complete')).toBeVisible();

    await page.reload();

    // Regression guard: completion is recorded against the version the user upgraded from, so a reload used to find no
    // progress under the migration version and offer to migrate all over again
    await expect(page.getByText('Already up to date')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start migration' })).toBeHidden();

    // The migrated data must survive the reload, not just the message
    expect((await readStoredTemplates(serviceWorker))[0]).toMatchObject({ title: 'E2E Custom' });
  });

  test('explains itself when opened without a version', async ({ openExtensionPage }) => {
    const page = await openExtensionPage('migrate.html');

    await expect(page.getByText('Nothing to migrate here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start migration' })).toBeHidden();
  });

  test('retains legacy data it cannot understand so the migration stays retryable', async ({
    extensionId,
    openExtensionPage,
  }) => {
    const page = await openExtensionPage('options.html');
    await seedLegacyData(page, { ...legacyData, templates: [{ nonsense: true }] });

    await page.goto(`chrome-extension://${extensionId}/migrate.html?version=${LEGACY_VERSION}`);
    await page.getByRole('button', { name: 'Start migration' }).click();

    await expect(page.getByText('Migration finished with problems')).toBeVisible();
    await expect(page.getByText('Data that could not be migrated')).toBeVisible();

    // The templates step validates before mutating, so a failure must leave the legacy key untouched rather than
    // destroying data it could not read
    expect(await getLegacyKeys(page)).toContain('templates');

    // Steps that did understand their data still completed
    expect(await getLegacyKeys(page)).not.toContain('links');

    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
