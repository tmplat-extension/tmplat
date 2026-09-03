import { describe, expect, it, vi } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

/**
 * Tests for `TemplateContextManager` itself — the caching, URL stack, option building and render helpers that every
 * entry relies on. These are driven directly against the manager rather than through the templating engine.
 */
describe('TemplateContextManager', () => {
  describe('construction', () => {
    it('eagerly renders every registered entry into the context', () => {
      const { manager } = createTestTemplateContextManager();

      expect(Object.keys(manager.context).length).toBeGreaterThan(100);
      expect(manager.context).toHaveProperty('url');
    });
  });

  describe('caching', () => {
    it('computes a value once and returns the cached value thereafter', async () => {
      const { manager } = createTestTemplateContextManager();
      const computer = vi.fn(() => 'value');

      const first = await manager.computeCacheIfAbsent('key', computer);
      const second = await manager.computeCacheIfAbsent('key', computer);

      expect(first).toBe('value');
      expect(second).toBe('value');
      expect(computer).toHaveBeenCalledTimes(1);
    });

    it('keeps and returns the existing cached value from addCacheIfAbsent', () => {
      // `addCacheIfAbsent` must honour the same get-or-insert contract as `computeCacheIfAbsent`: it refuses to
      // overwrite an existing entry *and* returns the value actually held in the cache. Returning the passed value
      // instead would leave the result disagreeing with a subsequent `getCache` for the same key.
      const { manager } = createTestTemplateContextManager();

      manager.addCache('key', 'original');
      const result = manager.addCacheIfAbsent('key', 'replacement');

      expect(result).toBe('original');
      expect(manager.getCache('key')).toBe('original');
    });

    it('inserts and returns the value from addCacheIfAbsent when the key is absent', () => {
      const { manager } = createTestTemplateContextManager();

      const result = manager.addCacheIfAbsent('key', 'fresh');

      expect(result).toBe('fresh');
      expect(manager.getCache('key')).toBe('fresh');
    });

    it('reports whether a key is cached', () => {
      const { manager } = createTestTemplateContextManager();

      expect(manager.isCached('key')).toBe(false);
      manager.addCache('key', 1);
      expect(manager.isCached('key')).toBe(true);
    });

    it('keys the cache on the built value of a cache-key builder', async () => {
      const { manager } = createTestTemplateContextManager();
      const computer = vi.fn(() => 'v');

      await manager.computeCacheIfAbsent(manager.cacheKeyBuilder('a', 'b'), computer);
      await manager.computeCacheIfAbsent(manager.cacheKeyBuilder('a', 'b'), computer);
      await manager.computeCacheIfAbsent(manager.cacheKeyBuilder('a', 'c'), computer);

      expect(computer).toHaveBeenCalledTimes(2);
    });
  });

  describe('URL stack', () => {
    it('returns the configured URL by default', () => {
      const { manager } = createTestTemplateContextManager({ url: 'https://example.com/base' });

      expect(manager.getUrl().href).toBe('https://example.com/base');
    });

    it('returns the most recently pushed URL, then restores the previous on pop', async () => {
      const { manager } = createTestTemplateContextManager({ url: 'https://example.com/base' });

      await manager.pushUrl('https://other.test/x');
      expect(manager.getUrl().hostname).toBe('other.test');

      await manager.pushUrl('https://third.test/y');
      expect(manager.getUrl().hostname).toBe('third.test');

      manager.popUrl();
      expect(manager.getUrl().hostname).toBe('other.test');

      manager.popUrl();
      expect(manager.getUrl().href).toBe('https://example.com/base');
    });

    it('is reflected by the {url}/{host} entries as the URL stack changes', async () => {
      const { render } = createTestTemplateContextManager({ url: 'https://example.com/base' });

      await expect(
        render('{host}|{#pushUrl}https://other.test/x{/pushUrl}{host}|{#popUrl}{/popUrl}{host}'),
      ).resolves.toBe('example.com|other.test|example.com');
    });
  });

  describe('options', () => {
    it('builds options from the merged data', async () => {
      const { manager } = createTestTemplateContextManager({
        data: { url_shortener: { provider: UrlShortenerProviderName.Yourls } },
      });

      const options = await manager.getOptions();

      expect(options.urlShorteners.provider).toBe(UrlShortenerProviderName.Yourls);
      expect(options.notifications.enabled).toBe(true);
    });

    it('caches the options so they are only built once', async () => {
      const { manager } = createTestTemplateContextManager();

      const first = await manager.getOptions();
      const second = await manager.getOptions();

      expect(second).toBe(first);
    });
  });

  describe('collaborator caching', () => {
    it('shortens a given URL only once', async () => {
      const { manager, shorten } = createTestTemplateContextManager({ shortUrl: 'https://sho.rt/1' });

      await manager.getShortUrl('https://example.com/a');
      await manager.getShortUrl('https://example.com/a');

      expect(shorten).toHaveBeenCalledTimes(1);
    });

    it('reads cookies only once for a given URL', async () => {
      const { manager } = createTestTemplateContextManager({ cookies: { sid: 'abc' } });

      await manager.getCookies('https://example.com/');
      await manager.getCookies('https://example.com/');

      expect(browser.cookies.getAll).toHaveBeenCalledTimes(1);
    });

    it('resolves coordinates only once', async () => {
      const { manager, getCoords } = createTestTemplateContextManager({
        coords: {
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 1,
          longitude: 2,
          speed: null,
        },
      });

      await manager.getCoords();
      await manager.getCoords();

      expect(getCoords).toHaveBeenCalledTimes(1);
    });
  });

  describe('render helpers', () => {
    it('short-circuits render for empty text without invoking the renderer', async () => {
      const { manager } = createTestTemplateContextManager();
      const renderer = vi.fn(async (text: string) => text.toUpperCase());

      await expect(manager.render('', renderer)).resolves.toBe('');
      expect(renderer).not.toHaveBeenCalled();
    });

    it('trims the rendered output with renderTrim', async () => {
      const { manager } = createTestTemplateContextManager();

      await expect(manager.renderTrim('x', async () => '  hi  ')).resolves.toBe('hi');
    });
  });
});
