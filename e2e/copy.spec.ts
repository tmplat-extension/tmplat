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

    // The template uses `{{url}}`, which HTML-escapes, and the engine escapes forward slashes as `&#x2F;`. Valid
    // HTML, and asserted verbatim here so that any change to escaping is caught rather than silently shipped.
    await expect
      .poll(async () => await readClipboard(fixturePage))
      .toBe('<a href="http:&#x2F;&#x2F;localhost:4321&#x2F;index.html">tmplat e2e fixture</a>');
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
