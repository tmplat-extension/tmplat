import { expect, test } from './fixtures';

/**
 * The popup is opened as an ordinary tab because Playwright cannot click the browser's own action button.
 *
 * That has one important consequence: Chrome then populates `sender.tab` with the *popup's* tab, and
 * `ExecuteTemplateMessageListener` prefers `sender.tab` over the explicit `tabId` in the message, so executing a
 * template from here targets the popup itself and is rejected as a restricted tab. Template execution is therefore
 * covered by `copy.spec.ts` (via the keyboard shortcut) instead, and this spec sticks to the popup's own behaviour.
 */
test.describe('popup', () => {
  test('lists only the templates enabled for the popup', async ({ fixturePage, openExtensionPage }) => {
    const popup = await openExtensionPage('popup.html');

    // Opening the popup steals focus, so restore the fixture as the active tab and re-mount the popup, otherwise it
    // resolves itself as the current tab
    await fixturePage.bringToFront();
    await popup.reload();

    await expect(popup.getByText('URL', { exact: true })).toBeVisible();
    await expect(popup.getByText('Anchor', { exact: true })).toBeVisible();
    // `Markdown` is a predefined template that is not shown in the popup by default
    await expect(popup.getByText('Markdown', { exact: true })).toBeHidden();
  });

  test('shows the shortcut bound to each template', async ({ fixturePage, openExtensionPage }) => {
    const popup = await openExtensionPage('popup.html');

    await fixturePage.bringToFront();
    await popup.reload();

    await expect(popup.getByText('Ctrl+Alt+U')).toBeVisible();
  });

  test('opens the options page', async ({ context, fixturePage, openExtensionPage }) => {
    const popup = await openExtensionPage('popup.html');

    await fixturePage.bringToFront();
    await popup.reload();

    const optionsPage = context.waitForEvent('page');
    await popup.getByText('Options', { exact: true }).click();

    expect((await optionsPage).url()).toContain('options.html');
  });
});
