import { expect, test } from './fixtures';

// Exercises the options page against the real `chrome.storage` backend, which unit tests can only approximate with
// `FakeDataStorage`. The value here is proving the round trip: React form -> DI services -> browser storage.
test.describe('options page', () => {
  test('lists the predefined templates', async ({ openExtensionPage }) => {
    const page = await openExtensionPage('options.html');

    await expect(page.getByRole('row').filter({ hasText: 'URL' }).first()).toBeVisible();
    await expect(page.getByText('1–7 of 7')).toBeVisible();
  });

  test('persists a newly created template to chrome.storage', async ({ openExtensionPage, serviceWorker }) => {
    const page = await openExtensionPage('options.html');

    await page.getByRole('button', { name: 'ADD' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('E2E Template');
    await dialog.getByLabel('Content', { exact: false }).first().fill('{title} @ {url}');
    await dialog.getByRole('button', { name: 'SAVE' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('1–8 of 8')).toBeVisible();

    // The grid could be showing purely local state, so assert against storage itself
    await expect
      .poll(async () => {
        const { template } = await serviceWorker.evaluate(() => chrome.storage.sync.get('template'));

        return JSON.stringify(template).includes('E2E Template');
      })
      .toBe(true);
  });

  test('survives a reload of the page', async ({ openExtensionPage, serviceWorker }) => {
    const page = await openExtensionPage('options.html');

    await page.getByRole('button', { name: 'ADD' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('Reload Survivor');
    await dialog.getByLabel('Content', { exact: false }).first().fill('{url}');
    await dialog.getByRole('button', { name: 'SAVE' }).click();

    await expect(dialog).toBeHidden();

    // The dialog closing only proves the React state updated, not that the write reached `chrome.storage`. Reloading
    // before it commits drops the template and fails the assertion below, which made this test intermittently flaky
    await expect
      .poll(async () => {
        const { template } = await serviceWorker.evaluate(() => chrome.storage.sync.get('template'));

        return JSON.stringify(template).includes('Reload Survivor');
      })
      .toBe(true);

    await page.reload();

    await expect(page.getByRole('row').filter({ hasText: 'Reload Survivor' })).toBeVisible();
  });

  test('cannot save a template with no title', async ({ openExtensionPage }) => {
    const page = await openExtensionPage('options.html');

    await page.getByRole('button', { name: 'ADD' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Content', { exact: false }).first().fill('{url}');

    // Validation is enforced by disabling the action rather than by rejecting the submit
    await expect(dialog.getByRole('button', { name: 'SAVE' })).toBeDisabled();
    await expect(dialog.getByText('A title is required')).toBeVisible();

    await dialog.getByLabel('Title').fill('Now Valid');

    await expect(dialog.getByRole('button', { name: 'SAVE' })).toBeEnabled();
  });
});
