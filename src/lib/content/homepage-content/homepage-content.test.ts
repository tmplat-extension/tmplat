import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { HomepageContent } from 'extension/content/homepage-content/homepage-content';

const extensionId = 'abcdef';

const createExtensionInfo = (id = extensionId): ExtensionInfo =>
  ({ id, getVersion: vi.fn().mockReturnValue('2.0.0') }) as unknown as ExtensionInfo;

const installButton = (href: string, text = 'Install'): string =>
  `<a class="browser_install_button" href="${href}">${text}</a>`;

const getLink = (): HTMLAnchorElement => document.querySelector('a') as HTMLAnchorElement;

// Runs on tmplat.com to show visitors who already have the extension that it is installed
describe('HomepageContent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('inject', () => {
    it('relabels the install button', () => {
      document.body.innerHTML = installButton(`https://example.com/${extensionId}`);

      new HomepageContent(createExtensionInfo()).inject();

      expect(getLink().innerHTML).toBe('Installed');
    });

    it('disables the install button', () => {
      document.body.innerHTML = installButton(`https://example.com/${extensionId}`);

      new HomepageContent(createExtensionInfo()).inject();

      expect(getLink().classList.contains('disabled')).toBe(true);
      expect(getLink().classList.contains('browser_install_button')).toBe(false);
    });

    it('updates every matching install button', () => {
      document.body.innerHTML =
        installButton(`https://example.com/${extensionId}`) + installButton(`https://other.com/${extensionId}`);

      new HomepageContent(createExtensionInfo()).inject();

      const links = [...document.querySelectorAll('a')];

      expect(links.map((link) => link.innerHTML)).toEqual(['Installed', 'Installed']);
    });

    it('ignores a button linking to a different extension', () => {
      document.body.innerHTML = installButton('https://example.com/someotherid');

      new HomepageContent(createExtensionInfo()).inject();

      expect(getLink().innerHTML).toBe('Install');
      expect(getLink().classList.contains('browser_install_button')).toBe(true);
    });

    it('ignores a link that is not an install button', () => {
      document.body.innerHTML = `<a class="other" href="https://example.com/${extensionId}">Install</a>`;

      new HomepageContent(createExtensionInfo()).inject();

      expect(getLink().innerHTML).toBe('Install');
    });

    it('preserves surrounding markup inside the button', () => {
      document.body.innerHTML = installButton(`https://example.com/${extensionId}`, '<span>Install</span> now');

      new HomepageContent(createExtensionInfo()).inject();

      expect(getLink().innerHTML).toBe('<span>Installed</span> now');
    });

    // The class is removed as part of the update, so a second run no longer matches. Without that, `replace` would
    // turn `Installed` into `Installeded`.
    it('is idempotent', () => {
      document.body.innerHTML = installButton(`https://example.com/${extensionId}`);

      const content = new HomepageContent(createExtensionInfo());
      content.inject();
      content.inject();

      expect(getLink().innerHTML).toBe('Installed');
    });

    it('does nothing when there are no install buttons', () => {
      document.body.innerHTML = '<p>Nothing to see here</p>';

      expect(() => new HomepageContent(createExtensionInfo()).inject()).not.toThrow();
    });
  });
});
