import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * `searchParams`, `cookies` and `hashSearchParams` are all declared as `Collection`/`Object` entries with a string
 * `valueDataType`, so a named value must be readable from any of them the same way — `{#name}{key}{/name}`.
 *
 * Each renderer therefore has to return the plain object, so that Mustache pushes it onto the context stack and
 * resolves nested tags against it. Building one of them with `createTrimmedContentRenderer` instead (as `cookies` and
 * `hashSearchParams` originally were) makes the context value a *section lambda* that ignores the section body and
 * returns the object, which Mustache stringifies to the literal `[object Object]`. Worse, referencing such an entry
 * bare renders the lambda's source code.
 *
 * The singular `cookie`/`searchParam`/`hashSearchParam` entries are `Operation`s and are a different shape
 * deliberately: they read one named value out of the section body.
 */
describe('object collection entries', () => {
  describe.each([
    [
      'searchParams',
      { url: 'https://e.com/p?foo=bar&baz=qux' },
      '{#searchParams}{foo}-{baz}{/searchParams}',
      '{searchParams}',
    ],
    ['cookies', { cookies: { baz: 'qux', foo: 'bar' } }, '{#cookies}{foo}-{baz}{/cookies}', '{cookies}'],
    [
      'hashSearchParams',
      { url: 'https://e.com/p#foo=bar&baz=qux' },
      '{#hashSearchParams}{foo}-{baz}{/hashSearchParams}',
      '{hashSearchParams}',
    ],
  ] as const)('%s', (_name, options, section, bare) => {
    it('resolves named values against the section', async () => {
      const { render } = createTestTemplateContextManager(options);

      await expect(render(section)).resolves.toBe('bar-qux');
    });

    // A section lambda would render its own source code here, pasting JavaScript into the user's clipboard.
    it('does not render as a section lambda when referenced bare', async () => {
      const { render } = createTestTemplateContextManager(options);
      const result = await render(bare);

      expect(result).not.toContain('=>');
      expect(result).not.toBe('[object Object]');
    });
  });

  it('renders the singular {#cookie}name{/cookie} operation', async () => {
    const { render } = createTestTemplateContextManager({ cookies: { sessionId: 'abc' } });

    await expect(render('{#cookie}sessionId{/cookie}')).resolves.toBe('abc');
  });

  // Characterization: an empty object is still truthy to Mustache, so an inverted section does *not* fire for a
  // collection with no entries. `{^cookies}` is therefore not a way to detect "no cookies".
  it('does not render an inverted section for a collection with no entries', async () => {
    const { render } = createTestTemplateContextManager({ cookies: {} });

    await expect(render('{^cookies}none{/cookies}')).resolves.toBe('');
    await expect(render('{#cookies}body{/cookies}')).resolves.toBe('body');
  });
});
