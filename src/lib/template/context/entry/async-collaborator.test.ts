import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * Tests for the context entries that reach out to async collaborators (cookies, geolocation, URL shortening, page
 * querying and Markdown conversion). These carry the most failure modes, so both the happy path and the empty/missing
 * cases are pinned.
 */
describe('async collaborator context entries', () => {
  describe('cookies', () => {
    it('resolves a named {#cookie} value', async () => {
      const { render } = createTestTemplateContextManager({ cookies: { sid: 'abc', theme: 'dark' } });

      await expect(render('{#cookie}sid{/cookie}')).resolves.toBe('abc');
    });

    // See `object-collection.test.ts` for the full contract shared with `searchParams`/`hashSearchParams`.
    it('exposes {#cookies} properties for section access', async () => {
      const { render } = createTestTemplateContextManager({ cookies: { sid: 'abc' } });

      await expect(render('{#cookies}{sid}{/cookies}')).resolves.toBe('abc');
    });

    it('resolves {#cookieNames} to the sorted, de-duplicated cookie names', async () => {
      const { render } = createTestTemplateContextManager({ cookies: { zeta: '1', alpha: '2' } });

      await expect(render('{#cookieNames}{.}|{/cookieNames}')).resolves.toBe('alpha|zeta|');
    });

    it('resolves an unknown {#cookie} to an empty string', async () => {
      const { render } = createTestTemplateContextManager({ cookies: { sid: 'abc' } });

      await expect(render('[{#cookie}missing{/cookie}]')).resolves.toBe('[]');
    });
  });

  describe('geolocation', () => {
    const coords = {
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: 51.5,
      longitude: -0.12,
      speed: null,
    };

    it('resolves {#coords} to the current coordinates', async () => {
      const { render } = createTestTemplateContextManager({ coords });

      await expect(render('{#coords}{latitude},{longitude}{/coords}')).resolves.toBe('51.5,-0.12');
    });

    it('renders nothing for {#coords} when the location is unavailable', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('[{#coords}{latitude}{/coords}]')).resolves.toBe('[]');
    });
  });

  describe('URL shortening', () => {
    it('shortens an explicit URL passed to {#shorten}', async () => {
      const { render, shorten } = createTestTemplateContextManager({ shortUrl: 'https://sho.rt/1' });

      await expect(render('{#shorten}https://example.com/long{/shorten}')).resolves.toBe('https://sho.rt/1');
      expect(shorten).toHaveBeenCalledWith('https://example.com/long');
    });

    it('shortens the current page URL when {#shorten} is given no content', async () => {
      const { render, shorten } = createTestTemplateContextManager({
        shortUrl: 'https://sho.rt/2',
        url: 'https://example.com/page',
      });

      await expect(render('{#shorten}{/shorten}')).resolves.toBe('https://sho.rt/2');
      expect(shorten.mock.calls[0][0].toString()).toBe('https://example.com/page');
    });
  });

  describe('page querying', () => {
    it('resolves {#select} to the single text result', async () => {
      const { render } = createTestTemplateContextManager({ tabContent: 'first match' });

      await expect(render('{#select}.title{/select}')).resolves.toBe('first match');
    });

    it('resolves {#selectAll} to a comma-joined string of every result', async () => {
      const { render } = createTestTemplateContextManager({ tabContent: ['a', 'b', 'c'] });

      await expect(render('{#selectAll}li{/selectAll}')).resolves.toBe('a,b,c');
    });

    it('resolves {#xpath} to the single result', async () => {
      const { render } = createTestTemplateContextManager({ tabContent: 'xpath result' });

      await expect(render('{#xpath}//h1{/xpath}')).resolves.toBe('xpath result');
    });
  });

  describe('markdown conversion', () => {
    it('converts the page HTML for {markdown}', async () => {
      const { render, convert } = createTestTemplateContextManager({ tabContext: { html: '<p>x</p>' } });

      await expect(render('{markdown}')).resolves.toBe('markdown:<p>x</p>');
      expect(convert).toHaveBeenCalledWith('<p>x</p>', { inline: false });
    });

    it('converts the selection HTML for {selectionMarkdown}', async () => {
      const { render } = createTestTemplateContextManager({
        tabContext: { selection: { html: '<b>s</b>', images: [], links: [], text: 's' } },
      });

      await expect(render('{selectionMarkdown}')).resolves.toBe('markdown:<b>s</b>');
    });

    it('converts a queried result for {#selectMarkdown}', async () => {
      const { render } = createTestTemplateContextManager({ tabContent: '<i>md</i>' });

      await expect(render('{#selectMarkdown}.q{/selectMarkdown}')).resolves.toBe('markdown:<i>md</i>');
    });

    it('resolves {linkMarkdown} to an empty string when there is no link target', async () => {
      const { render } = createTestTemplateContextManager();

      await expect(render('[{linkMarkdown}]')).resolves.toBe('[]');
    });

    it('honours the markdown inline option when converting', async () => {
      const { render, convert } = createTestTemplateContextManager({
        data: { template: { markdown: { inline: true } } },
        tabContext: { html: '<p>x</p>' },
      });

      await render('{markdown}');
      expect(convert).toHaveBeenCalledWith('<p>x</p>', { inline: true });
    });
  });
});
