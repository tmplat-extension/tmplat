import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

/**
 * Tests for the entries that read stored data or derived options: the `options` collection, the template metadata
 * entry, template counts and the deprecated flat option entries.
 */
describe('data and options context entries', () => {
  describe('options collection', () => {
    it('exposes nested option values through section access', async () => {
      const { render } = createTestTemplateContextManager({ data: { notification: { enabled: false } } });

      await expect(render('{#options}{#notifications}{enabled}{/notifications}{/options}')).resolves.toBe('false');
    });
  });

  describe('template metadata', () => {
    it('exposes the current template through {#template}', async () => {
      const { render } = createTestTemplateContextManager({
        template: { content: '{url}', id: 'tid', title: 'My Template' },
      });

      await expect(render('{#template}{title}|{id}|{content}{/template}')).resolves.toBe('My Template|tid|{url}');
    });
  });

  describe('template counts', () => {
    const templates = [
      { content: 'a', description: null, enabled: true, id: 'u1', predefined: false, shortcut: null, title: 'A' },
      { content: 'b', description: null, enabled: true, id: 'u2', predefined: false, shortcut: null, title: 'B' },
      { enabled: true, id: 'PREDEFINED.1', predefined: true, shortcut: null },
    ] as const;

    it('resolves {templateCount} to the total number of templates', async () => {
      const { render } = createTestTemplateContextManager({ data: { template: { templates: [...templates] } } });

      await expect(render('{templateCount}')).resolves.toBe('3');
    });

    it('resolves {templateCustomCount} to the number of user-defined templates', async () => {
      const { render } = createTestTemplateContextManager({ data: { template: { templates: [...templates] } } });

      await expect(render('{templateCustomCount}')).resolves.toBe('2');
    });

    it('resolves both counts to zero when there are no templates', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('{templateCount}/{templateCustomCount}')).resolves.toBe('0/0');
    });
  });

  describe('deprecated flat option entries', () => {
    it('resolves boolean option entries', async () => {
      const { render } = createTestTemplateContextManager({
        data: {
          notification: { enabled: true },
          template: {
            contextMenu: { autoPasteEnabled: false, enabled: true, optionLinkEnabled: true },
            link: { target: true, title: false },
            markdown: { inline: true },
            shortcuts: { autoPasteEnabled: true, enabled: false },
          },
        },
      });

      await expect(
        render('{notifications}|{linksTarget}|{linksTitle}|{markdownInline}|{menu}|{shortcuts}|{shortcutsPaste}'),
      ).resolves.toBe('true|true|false|true|true|false|true');
    });

    it('reflects the configured URL shortener provider', async () => {
      const { render } = createTestTemplateContextManager({
        data: { url_shortener: { provider: UrlShortenerProviderName.Yourls } },
      });

      await expect(render('{bitly}|{yourls}')).resolves.toBe('false|true');
    });

    it('resolves YOURLS credential option entries', async () => {
      const { render } = createTestTemplateContextManager({
        data: {
          url_shortener: {
            provider: UrlShortenerProviderName.Yourls,
            providers: {
              yourls: { password: 'pw', signature: null, url: 'https://y.test/', username: 'user' },
            },
          },
        },
      });

      await expect(render('{yourlsUrl}|{yourlsUsername}|{yourlsPassword}')).resolves.toBe('https://y.test/|user|pw');
    });
  });
});
