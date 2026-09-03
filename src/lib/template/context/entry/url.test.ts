import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * Tests for the URL-decomposition context entries.
 *
 * These are driven end-to-end through the real templating engine (`{name}`) over a real `TemplateContextManager`, so
 * they exercise the full path a user template takes to the clipboard, including the manager's URL stack and caching.
 */
describe('URL context entries', () => {
  const URL = 'https://john:secret@www.example.com:8080/path/to/page.html?foo=bar&baz=qux#section';

  it.each([
    ['url', URL],
    ['host', 'www.example.com'],
    ['origin', 'https://www.example.com:8080'],
    ['path', '/path/to/page.html'],
    ['port', '8080'],
    ['protocol', 'https'],
    ['password', 'secret'],
    ['user', 'john'],
    ['hash', 'section'],
    ['search', 'foo=bar&baz=qux'],
    ['authority', 'john:secret@www.example.com:8080'],
    ['relative', '/path/to/page.html?foo=bar&baz=qux#section'],
    ['directory', '/path/to/'],
    ['file', 'page.html'],
  ])('resolves {%s} to %j', async (name, expected) => {
    const { render } = createTestTemplateContextManager({ url: URL });

    await expect(render(`{${name}}`)).resolves.toBe(expected);
  });

  it('resolves {authority} to just the host when the URL has no user info', async () => {
    const { render } = createTestTemplateContextManager({ url: 'https://example.com/x' });

    await expect(render('{authority}')).resolves.toBe('example.com');
  });

  it('resolves {authority} to user@host when the URL has a username but no password', async () => {
    const { render } = createTestTemplateContextManager({ url: 'https://john@example.com/x' });

    await expect(render('{authority}')).resolves.toBe('john@example.com');
  });

  it('resolves {port} to an empty string for a default port', async () => {
    const { render } = createTestTemplateContextManager({ url: 'https://example.com/x' });

    await expect(render('{port}')).resolves.toBe('');
  });

  describe('userInfo', () => {
    it('resolves {userInfo} to user:password when both are present', async () => {
      const { render } = createTestTemplateContextManager({ url: 'https://john:secret@example.com/x' });

      await expect(render('{userInfo}')).resolves.toBe('john:secret');
    });

    it('resolves {userInfo} to just the username when there is no password', async () => {
      const { render } = createTestTemplateContextManager({ url: 'https://john@example.com/x' });

      await expect(render('{userInfo}')).resolves.toBe('john');
    });

    it('resolves {userInfo} to an empty string when there is no user info', async () => {
      const { render } = createTestTemplateContextManager({ url: 'https://example.com/x' });

      await expect(render('[{userInfo}]')).resolves.toBe('[]');
    });
  });

  describe('search params', () => {
    it('resolves a named {searchParam}', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#searchParam}foo{/searchParam}')).resolves.toBe('bar');
    });

    it('resolves {#searchParams} to a key/value object', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#searchParams}{foo}-{baz}{/searchParams}')).resolves.toBe('bar-qux');
    });
  });

  describe('hash', () => {
    const HASH_URL = 'https://example.com/p#a/b/c?x=1&y=2';

    it('resolves a named {hashSearchParam}', async () => {
      const { render } = createTestTemplateContextManager({ url: 'https://example.com/p#x=1&y=2' });

      await expect(render('{#hashSearchParam}x{/hashSearchParam}')).resolves.toBe('1');
    });

    it('resolves {#hashSegment} at a one-based index', async () => {
      const { render } = createTestTemplateContextManager({ url: HASH_URL });

      await expect(render('{#hashSegment}1{/hashSegment}')).resolves.toBe('a');
    });
  });

  describe('segments', () => {
    it('resolves {#segments} to the path segments', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#segments}{.}|{/segments}')).resolves.toBe('path|to|page.html|');
    });

    it('resolves {#segment} at a one-based index', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#segment}2{/segment}')).resolves.toBe('to');
    });

    it('resolves {#segment} from the end for a negative index', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#segment}-1{/segment}')).resolves.toBe('page.html');
    });

    it('resolves {#segment} to an empty string for index zero', async () => {
      const { render } = createTestTemplateContextManager({ url: URL });

      await expect(render('{#segment}0{/segment}')).resolves.toBe('');
    });
  });
});
