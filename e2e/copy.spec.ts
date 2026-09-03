import { expect, readClipboard, test } from './fixtures';

/**
 * The full copy pipeline, driven exactly as a user drives it: a keystroke on a real web page.
 *
 * This is the only part of the suite that exercises the content script, the message round trip to the service worker,
 * the template engine against a live DOM, and the real system clipboard together.
 */
test.describe('copying via keyboard shortcut', () => {
  test('copies the current URL', async ({ fixturePage }) => {
    await fixturePage.locator('body').click();
    await fixturePage.keyboard.press('Control+Alt+u');

    await expect.poll(async () => await readClipboard(fixturePage)).toBe('http://localhost:4321/index.html');
  });

  test('renders a template that reads page metadata', async ({ fixturePage }) => {
    await fixturePage.locator('body').click();
    // The `Anchor` predefined template interpolates both the title and the URL, so it proves the template context is
    // populated from the real page rather than from the extension's own context
    await fixturePage.keyboard.press('Control+Alt+a');

    // The `href` is escaped with `{#escapeHtml}` rather than `{{url}}`: the latter also escapes `/` as `&#x2F;`,
    // which is valid but renders the URL unreadable. The title is genuine text content, so it keeps the full
    // escape set. Asserted verbatim here so that any change to escaping is caught rather than silently shipped.
    await expect
      .poll(async () => await readClipboard(fixturePage))
      .toBe('<a href="http://localhost:4321/index.html">tmplat e2e fixture</a>');
  });

  test('copies an encoded URL', async ({ fixturePage }) => {
    await fixturePage.locator('body').click();
    await fixturePage.keyboard.press('Control+Alt+e');

    await expect
      .poll(async () => await readClipboard(fixturePage))
      .toBe(encodeURIComponent('http://localhost:4321/index.html'));
  });

  test('ignores a shortcut that no template is bound to', async ({ fixturePage }) => {
    await fixturePage.evaluate(() => navigator.clipboard.writeText('UNTOUCHED'));
    await fixturePage.locator('body').click();
    await fixturePage.keyboard.press('Control+Alt+z');

    await fixturePage.waitForTimeout(1000);

    expect(await readClipboard(fixturePage)).toBe('UNTOUCHED');
  });
});
