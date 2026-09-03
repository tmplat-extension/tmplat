import { describe, expect, it } from 'vitest';
import { templateContextEntriesDefinitions } from 'extension/template/context/entry';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTestTemplateContextManager } from 'extension/test/template-context-manager.factory';

/**
 * A behavioural contract applied to *every* registered entry, grouped by the category it declares.
 *
 * The family suites in this directory (`url`, `tab-metadata`, `string-operation`, ...) cover representatives that were
 * chosen by hand, which leaves no guarantee for any entry that was not picked — an entry added tomorrow would be
 * structurally validated by `index.test.ts` but never actually rendered, and nothing would fail. This suite closes
 * that gap by enumerating the registry at runtime, so a new entry is behaviourally covered the moment it is
 * registered.
 *
 * The assertions are deliberately shallow — what a value *is* belongs in the family suites. What is asserted here is
 * the contract implied by an entry's declared category:
 *
 * - every entry's renderer actually executes and resolves rather than throwing;
 * - a `Standard` entry renders a value when referenced bare (`{name}`);
 * - an `Operation` entry consumes its section body (`{#name}input{/name}`);
 * - a `Collection` entry can be iterated or indexed, and is not a section lambda.
 *
 * Above all, no entry may ever render the renderer's own JavaScript source into the user's output. That is the defect
 * class behind the `cookies`/`hashSearchParams` bug and behind the bare-operation leak (MIGRATION-GAPS.md §8), both
 * of which are fixed in this codebase.
 */

/**
 * Matches the JavaScript source of a renderer, which is what Mustache stringifies when a section lambda is referenced
 * bare (e.g. `async (text, render) => mapper(...)`).
 *
 * The fixtures below are chosen so that no legitimate value can contain an arrow or a function keyword, which would
 * otherwise make this a false positive.
 */
const RENDERER_SOURCE_PATTERN = /=>|\bfunction\s*\(/;

/**
 * Operation entries whose section body is not free-form text.
 *
 * `pushUrl` pushes its body onto the manager's URL stack, so it has to be given something parsable as a URL.
 */
const SECTION_BODIES: Readonly<Record<string, string>> = { pushUrl: 'https://www.example.com/pushed' };

const DEFAULT_SECTION_BODY = 'foo';

/**
 * Operations that resolve more than one result and join them.
 *
 * These were declared as `Collection` entries until it was established that 1.x had always joined their results
 * into a single string (`src/lib/background.coffee:1237-1239`), and that a section lambda's return value can never
 * be iterated anyway — see MIGRATION-GAPS.md §8.
 */
const MULTI_RESULT_OPERATIONS: readonly string[] = [
  'selectAll',
  'selectAllHtml',
  'selectAllMarkdown',
  'xpathAll',
  'xpathAllHtml',
  'xpathAllMarkdown',
];

/**
 * Operations that also declare a `Standard` category, and so are documented to resolve a value of their own when
 * referenced bare. For these an empty result is a regression rather than the correct "the body is the input, and
 * there was no body" answer.
 *
 * `popUrl` is deliberately absent: it exists for its side effect on the URL stack and renders nothing by design.
 */
const BARE_VALUE_OPERATIONS: readonly string[] = ['dateTime', 'lastModified', 'short', 'shorten'];

const definitions = templateContextEntriesDefinitions;

const inCategory = (category: TemplateContextCategory): TemplateContextEntryDefinition[] =>
  definitions.filter((definition) => definition.categories[category]);

const collectionEntries = inCategory(TemplateContextCategory.Collection);
const operationEntries = inCategory(TemplateContextCategory.Operation);
const standardEntries = inCategory(TemplateContextCategory.Standard);

const names = (entries: readonly TemplateContextEntryDefinition[]): string[] =>
  entries.map((definition) => definition.name);

/**
 * Builds a harness with every input an entry might read already populated, so that a renderer reaching for tab
 * content, cookies or a URL resolves a real value rather than failing for want of a fixture.
 */
const createHarness = () =>
  createTestTemplateContextManager({
    cookies: { bar: 'two', foo: 'one' },
    tabContent: ['alpha', 'beta'],
  });

const renderBare = async (name: string): Promise<string> => createHarness().render(`{${name}}`);

const renderSection = async (name: string, body = SECTION_BODIES[name] ?? DEFAULT_SECTION_BODY): Promise<string> =>
  createHarness().render(`{#${name}}${body}{/${name}}`);

describe('template context entry contract', () => {
  it('covers every registered entry, so the suites below cannot silently miss one', () => {
    const covered = new Set([...names(collectionEntries), ...names(operationEntries), ...names(standardEntries)]);

    expect([...covered].toSorted()).toEqual(names(definitions).toSorted());
  });

  describe('standard entries', () => {
    it('is not empty, so the assertions below are meaningful', () => {
      expect(standardEntries.length).toBeGreaterThan(0);
    });

    it.each(names(standardEntries))('renders %s as a value when referenced bare', async (name) => {
      const result = await renderBare(name);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
      expect(result).not.toBe('[object Object]');
    });
  });

  describe('operation entries', () => {
    it('is not empty, so the assertions below are meaningful', () => {
      expect(operationEntries.length).toBeGreaterThan(0);
    });

    it.each(names(operationEntries))('renders %s as a section over its body', async (name) => {
      const result = await renderSection(name);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
      expect(result).not.toBe('[object Object]');
    });

    /**
     * Regression guard for the bare-operation leak (MIGRATION-GAPS.md §8).
     *
     * Referencing an operation bare used to render the renderer's own JavaScript source into the user's clipboard,
     * because a section lambda was being stringified. It is asserted as a whole-category assertion rather than as a
     * handful of examples so that a new operation is covered the moment it is registered.
     *
     * An operation given no body has no input, so the correct answer is an empty string unless the entry also
     * resolves a value of its own — see `BARE_VALUE_OPERATIONS`.
     */
    it.each(names(operationEntries))(
      'renders %s without leaking the renderer source when referenced bare',
      async (name) => {
        const result = await renderBare(name);

        expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
        expect(result).not.toBe('[object Object]');
      },
    );

    it.each(BARE_VALUE_OPERATIONS)('renders %s as a value of its own when referenced bare', async (name) => {
      const result = await renderBare(name);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
      expect(result).not.toBe('');
    });

    /**
     * Regression guard for MIGRATION-GAPS.md §8 (formerly §2.6).
     *
     * These six were declared as `Collection` entries with an `Array` data type, so the guide promised iteration
     * (`{#selectAll}{.}{/selectAll}`) that the engine can never deliver: they are section lambdas, so the body is
     * consumed as the expression and any array they return is stringified rather than iterated. Returning an array
     * therefore only chose the separator, and chose a *different* one from 1.x — which joined with a new line.
     */
    describe('multi-result operations', () => {
      it('covers exactly the operations that resolve more than one result', () => {
        expect(MULTI_RESULT_OPERATIONS.every((name) => names(operationEntries).includes(name))).toBe(true);
      });

      it.each(MULTI_RESULT_OPERATIONS)('joins every %s result with a new line', async (name) => {
        const result = await renderSection(name, 'div.example');

        // The harness resolves two results. Before the fix these arrived comma-joined by `Array#toString`.
        expect(result.split('\n')).toHaveLength(2);
        expect(result).not.toContain(',');
      });

      it.each(MULTI_RESULT_OPERATIONS)('consumes the %s section body as the expression', async (name) => {
        const result = await renderSection(name, '[{.}]');

        // The body carries the selector, so it can never also template the results.
        expect(result).not.toContain('[alpha]');
      });
    });
  });

  describe('collection entries', () => {
    it('is not empty, so the assertions below are meaningful', () => {
      expect(collectionEntries.length).toBeGreaterThan(0);
    });

    it.each(names(collectionEntries))('does not render %s as a section lambda when referenced bare', async (name) => {
      const result = await renderBare(name);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
    });

    const arrayCollections = collectionEntries.filter(
      (definition) =>
        definition.categories[TemplateContextCategory.Collection]?.dataType === TemplateContextDataType.Array,
    );
    const objectCollections = collectionEntries.filter(
      (definition) =>
        definition.categories[TemplateContextCategory.Collection]?.dataType === TemplateContextDataType.Object,
    );

    it('splits into array and object collections, so neither assertion below is vacuous', () => {
      expect(arrayCollections.length).toBeGreaterThan(0);
      expect(objectCollections.length).toBeGreaterThan(0);
      expect(arrayCollections.length + objectCollections.length).toBe(collectionEntries.length);
    });

    // An array collection has to be iterable, so that `{.}` resolves each item rather than the array being
    // stringified as a whole.
    it.each(names(arrayCollections))('iterates %s with {.}', async (name) => {
      const result = await createHarness().render(`{#${name}}{.}{/${name}}`);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
      expect(result).not.toContain('[object Object]');
    });

    // An object collection is pushed onto the context stack, so its properties resolve by name from inside the
    // section. `{.}` is not its access form, hence only the lambda check here — `object-collection.test.ts` covers
    // named access in detail for the plural string-valued entries.
    it.each(names(objectCollections))('resolves %s as a section rather than a lambda', async (name) => {
      const result = await createHarness().render(`{#${name}}ok{/${name}}`);

      expect(result).not.toMatch(RENDERER_SOURCE_PATTERN);
    });
  });
});
