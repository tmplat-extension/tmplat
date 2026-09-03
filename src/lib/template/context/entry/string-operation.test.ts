import { describe, expect, it } from 'vitest';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

const render = (source: string) => createTestTemplateContextManager().render(source);

/**
 * Tests for the string-manipulation "operation" context entries.
 *
 * Operations receive the rendered inner content of their section tag, so they are driven as `{#name}input{/name}`.
 */
describe('string operation context entries', () => {
  describe('case conversions', () => {
    it.each([
      ['camelCase', 'Hello world-example', 'helloWorldExample'],
      ['kebabCase', 'Hello world-example', 'hello-world-example'],
      ['snakeCase', 'Hello world-example', 'hello_world_example'],
      ['startCase', 'Hello world-example', 'Hello World Example'],
      ['upperCase', 'Hello world', 'HELLO WORLD'],
      ['lowerCase', 'Hello WORLD', 'hello world'],
      ['capitalize', 'hELLO', 'Hello'],
    ])('resolves {#%s}%s{/} to %j', async (name, input, expected) => {
      await expect(render(`{#${name}}${input}{/${name}}`)).resolves.toBe(expected);
    });

    it('resolves {#lower} using locale-aware lower casing', async () => {
      await expect(render('{#lower}HELLO{/lower}')).resolves.toBe('hello');
    });

    it('resolves {#upper} using locale-aware upper casing', async () => {
      await expect(render('{#upper}hello{/upper}')).resolves.toBe('HELLO');
    });
  });

  describe('codecs', () => {
    it.each([
      ['encodeBase64', 'foo', 'Zm9v'],
      ['decodeBase64', 'Zm9v', 'foo'],
      ['encodeUriComponent', 'a b&c', 'a%20b%26c'],
      ['decodeUriComponent', 'a%20b%26c', 'a b&c'],
    ])('resolves {#%s}%s{/} to %j', async (name, input, expected) => {
      await expect(render(`{#${name}}${input}{/${name}}`)).resolves.toBe(expected);
    });

    it('resolves {#encodeBase64} of an empty (whitespace-only) input to an empty string', async () => {
      await expect(render('{#encodeBase64}   {/encodeBase64}')).resolves.toBe('');
    });
  });

  describe('html escaping', () => {
    it('escapes HTML with {#escapeHtml}', async () => {
      await expect(render('{#escapeHtml}<a>&</a>{/escapeHtml}')).resolves.toBe('&lt;a&gt;&amp;&lt;/a&gt;');
    });

    it('unescapes HTML with {#unescapeHtml}', async () => {
      await expect(render('{#unescapeHtml}&lt;a&gt;&amp;{/unescapeHtml}')).resolves.toBe('<a>&');
    });
  });

  describe('measurements', () => {
    it('resolves {#length} to the character count of the untrimmed content', async () => {
      await expect(render('{#length} ab {/length}')).resolves.toBe('4');
    });

    it('resolves {#wordCount} to the number of words', async () => {
      await expect(render('{#wordCount}one two-three{/wordCount}')).resolves.toBe('3');
    });
  });

  describe('whitespace and misc', () => {
    it('resolves {#trim} by trimming both ends', async () => {
      await expect(render('{#trim}  x  {/trim}')).resolves.toBe('x');
    });

    it('resolves {#trimStart} by trimming the leading whitespace only', async () => {
      await expect(render('[{#trimStart}  x  {/trimStart}]')).resolves.toBe('[x  ]');
    });

    it('resolves {#trimEnd} by trimming the trailing whitespace only', async () => {
      await expect(render('[{#trimEnd}  x  {/trimEnd}]')).resolves.toBe('[  x]');
    });

    it('collapses runs of spaces and tabs with {#tidy}', async () => {
      await expect(render('{#tidy}a\t \t b   c{/tidy}')).resolves.toBe('a b c');
    });

    it('removes diacritics with {#deburr}', async () => {
      await expect(render('{#deburr}déjà vu{/deburr}')).resolves.toBe('deja vu');
    });
  });
});
