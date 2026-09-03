import TmplatMustache from 'tmplat-mustache';
import { describe, expect, it } from 'vitest';

/**
 * Characterization tests for `tmplat-mustache`, the fork of mustache.js used to render templates.
 *
 * Its syntax deliberately differs from stock Mustache (single braces, unescaped by default), and stock syntax fails
 * silently rather than erroring, so these tests pin the behavior that the guide documents and that user templates
 * depend on.
 */
describe('tmplat-mustache', () => {
  describe('interpolation', () => {
    it('resolves a single-brace tag against the context', async () => {
      await expect(TmplatMustache.render('{name}', { name: 'tmplat' })).resolves.toBe('tmplat');
    });

    it('resolves tags case-insensitively, matching how entries are registered in lower case', async () => {
      await expect(TmplatMustache.render('{Name} {NAME} {NaMe}', { name: 'tmplat' })).resolves.toBe(
        'tmplat tmplat tmplat',
      );
    });

    it('resolves a tag whose value is produced by a function', async () => {
      await expect(TmplatMustache.render('{name}', { name: () => 'tmplat' })).resolves.toBe('tmplat');
    });

    it('awaits a tag whose value is a promise', async () => {
      await expect(TmplatMustache.render('{name}', { name: Promise.resolve('tmplat') })).resolves.toBe('tmplat');
    });

    it('renders an empty string for an unknown tag rather than throwing', async () => {
      await expect(TmplatMustache.render('a{unknown}b', {})).resolves.toBe('ab');
    });

    it.each([
      ['null', null, ''],
      ['undefined', undefined, ''],
      ['false', false, 'false'],
      ['zero', 0, '0'],
      ['a number', 42, '42'],
    ])('renders %s as %j', async (_label, value, expected) => {
      await expect(TmplatMustache.render('{value}', { value })).resolves.toBe(expected);
    });
  });

  describe('escaping', () => {
    const value = '<a href="x">&</a>';

    it('does not escape a single-brace tag', async () => {
      await expect(TmplatMustache.render('{value}', { value })).resolves.toBe(value);
    });

    it('escapes a double-brace tag, including the equals sign', async () => {
      await expect(TmplatMustache.render('{{value}}', { value })).resolves.toBe(
        '&lt;a href&#x3D;&quot;x&quot;&gt;&amp;&lt;&#x2F;a&gt;',
      );
    });

    it('escapes an ampersand tag, matching the double-brace tag', async () => {
      await expect(TmplatMustache.render('{&value}', { value })).resolves.toBe(
        await TmplatMustache.render('{{value}}', { value }),
      );
    });
  });

  describe('sections', () => {
    it('renders a truthy section once', async () => {
      await expect(TmplatMustache.render('{#on}yes{/on}', { on: true })).resolves.toBe('yes');
    });

    it.each([
      ['false', false],
      ['an empty array', []],
      ['null', null],
      ['undefined', undefined],
    ])('skips a section for %s', async (_label, on) => {
      await expect(TmplatMustache.render('{#on}yes{/on}', { on })).resolves.toBe('');
    });

    it('iterates an array section, exposing each item as the implicit tag', async () => {
      await expect(TmplatMustache.render('{#items}[{.}]{/items}', { items: ['a', 'b'] })).resolves.toBe('[a][b]');
    });

    it('renders an inverted section only when the value is falsy', async () => {
      await expect(TmplatMustache.render('{^on}no{/on}', { on: false })).resolves.toBe('no');
      await expect(TmplatMustache.render('{^on}no{/on}', { on: true })).resolves.toBe('');
    });

    it('passes the raw inner text and a render callback to a function section', async () => {
      const received: string[] = [];

      const output = await TmplatMustache.render('{#upper}{name}{/upper}', {
        name: 'tmplat',
        upper: () => async (text: string, render: (template: string) => Promise<string>) => {
          received.push(text);
          return (await render(text)).toUpperCase();
        },
      });

      expect(received).toEqual(['{name}']);
      expect(output).toBe('TMPLAT');
    });

    it('supports nesting operations', async () => {
      const context = {
        name: ' tmplat ',
        trim: () => async (text: string, render: (template: string) => Promise<string>) => (await render(text)).trim(),
        upper: () => async (text: string, render: (template: string) => Promise<string>) =>
          (await render(text)).toUpperCase(),
      };

      await expect(TmplatMustache.render('{#upper}{#trim}{name}{/trim}{/upper}', context)).resolves.toBe('TMPLAT');
    });
  });

  describe('comments', () => {
    it('strips a comment tag from the output', async () => {
      await expect(TmplatMustache.render('a{! ignored }b', {})).resolves.toBe('ab');
    });
  });

  describe('stock Mustache syntax', () => {
    // Stock syntax fails silently rather than erroring, which is exactly why templates must be verified against this
    // engine rather than assumed to behave like mustache.js.
    it('treats a stock double-brace section as two empty escaped tags, so the body renders exactly once', async () => {
      await expect(TmplatMustache.render('{{#items}}x{{/items}}', { items: ['a', 'b'] })).resolves.toBe('x');
    });

    it('renders the body of a stock section even when the value is falsy', async () => {
      await expect(TmplatMustache.render('{{#items}}x{{/items}}', { items: [] })).resolves.toBe('x');
    });

    it('does not treat a triple-brace tag as the unescape syntax', async () => {
      await expect(TmplatMustache.render('{{{name}}}', { name: 'tmplat' })).resolves.not.toBe('tmplat');
    });
  });
});
